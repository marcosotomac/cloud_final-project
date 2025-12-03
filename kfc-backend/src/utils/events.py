"""
Event utilities for EventBridge and SNS
"""
import os
import json
import boto3
from datetime import datetime
from typing import Any, Dict


# Initialize clients
eventbridge = boto3.client('events')
sns = boto3.client('sns')
sqs = boto3.client('sqs')
stepfunctions = boto3.client('stepfunctions')


def publish_order_event(
    event_type: str,
    tenant_id: str,
    order_id: str,
    order_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Publish an order event to EventBridge

    Args:
        event_type: Type of event (OrderCreated, OrderUpdated, etc.)
        tenant_id: The tenant ID
        order_id: The order ID
        order_data: The order data

    Returns:
        EventBridge response
    """
    event_bus_name = os.environ.get('ORDER_EVENTS_BUS')

    event = {
        'Source': 'kfc.orders',
        'DetailType': event_type,
        'Detail': json.dumps({
            'tenantId': tenant_id,
            'orderId': order_id,
            'order': order_data,
            'timestamp': datetime.utcnow().isoformat()
        }),
        'EventBusName': event_bus_name
    }

    response = eventbridge.put_events(Entries=[event])
    return response


def send_notification(
    tenant_id: str,
    notification_type: str,
    message: str,
    data: Dict[str, Any] = None
) -> Dict[str, Any]:
    """
    Send a notification via SNS

    Args:
        tenant_id: The tenant ID
        notification_type: Type of notification
        message: Notification message
        data: Additional data

    Returns:
        SNS response
    """
    topic_arn = os.environ.get('NOTIFICATIONS_TOPIC_ARN')

    notification = {
        'tenantId': tenant_id,
        'type': notification_type,
        'message': message,
        'data': data or {},
        'timestamp': datetime.utcnow().isoformat()
    }

    response = sns.publish(
        TopicArn=topic_arn,
        Message=json.dumps(notification),
        MessageAttributes={
            'tenantId': {
                'DataType': 'String',
                'StringValue': tenant_id
            },
            'type': {
                'DataType': 'String',
                'StringValue': notification_type
            }
        }
    )

    return response


def send_to_queue(
    queue_url: str,
    message: Dict[str, Any],
    message_group_id: str = None
) -> Dict[str, Any]:
    """
    Send a message to SQS

    Args:
        queue_url: The SQS queue URL
        message: The message to send
        message_group_id: Optional message group ID for FIFO queues

    Returns:
        SQS response
    """
    params = {
        'QueueUrl': queue_url,
        'MessageBody': json.dumps(message)
    }

    if message_group_id:
        params['MessageGroupId'] = message_group_id

    response = sqs.send_message(**params)
    return response


def start_order_workflow(
    tenant_id: str,
    order_id: str,
    order_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Start the Step Functions workflow for an order

    Args:
        tenant_id: The tenant ID
        order_id: The order ID
        order_data: The order data

    Returns:
        Step Functions response
    """
    # Build the State Machine ARN dynamically to avoid circular dependency
    region = os.environ.get('REGION', 'us-east-1')
    stage = os.environ.get('STAGE', 'dev')
    # AWS Account ID from STS
    try:
        sts = boto3.client('sts')
        account_id = sts.get_caller_identity()['Account']
    except:
        # Fallback if STS fails
        account_id = '595645243021'
    
    state_machine_arn = f"arn:aws:states:{region}:{account_id}:stateMachine:kfc-core-{stage}-OrderWorkflowStateMachine"

    input_data = {
        'tenantId': tenant_id,
        'orderId': order_id,
        'order': order_data,
        'startTime': datetime.utcnow().isoformat()
    }

    response = stepfunctions.start_execution(
        stateMachineArn=state_machine_arn,
        name=f"{tenant_id}-{order_id}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
        input=json.dumps(input_data)
    )

    return response


def send_task_success(task_token: str, output: Dict[str, Any]) -> Dict[str, Any]:
    """
    Send task success to Step Functions

    Args:
        task_token: The task token
        output: The output data

    Returns:
        Step Functions response
    """
    response = stepfunctions.send_task_success(
        taskToken=task_token,
        output=json.dumps(output)
    )
    return response


def send_task_failure(
    task_token: str,
    error: str,
    cause: str
) -> Dict[str, Any]:
    """
    Send task failure to Step Functions

    Args:
        task_token: The task token
        error: Error code
        cause: Error cause

    Returns:
        Step Functions response
    """
    response = stepfunctions.send_task_failure(
        taskToken=task_token,
        error=error,
        cause=cause
    )
    return response
