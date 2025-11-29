"""
Step Functions task handlers for order workflow
"""
import json
from datetime import datetime

from src.utils.dynamodb import get_orders_table, get_item, update_item
from src.utils.websocket import broadcast_order_update
from src.models.order_status import OrderStatus


def sfn_receive_order_handler(event, context):
    """Step Functions task: Receive and validate order"""
    try:
        print(f"SFN ReceiveOrder: {json.dumps(event)}")

        order_id = event.get('orderId')
        tenant_id = event.get('tenantId')

        if not order_id or not tenant_id:
            raise Exception('Missing orderId or tenantId')

        table = get_orders_table()
        order = get_item(table, {
            'PK': f'TENANT#{tenant_id}',
            'SK': f'ORDER#{order_id}'
        })

        if not order:
            raise Exception(f'Order {order_id} not found')

        now = datetime.utcnow().isoformat()

        # Update order status to RECEIVED
        update_item(
            table,
            {'PK': f'TENANT#{tenant_id}', 'SK': f'ORDER#{order_id}'},
            {
                'status': OrderStatus.RECEIVED.value,
                'updatedAt': now,
                'workflow.currentStep': 'RECEIVE_ORDER',
                'workflow.steps': order.get('workflow', {}).get('steps', []) + [{
                    'step': 'RECEIVE_ORDER',
                    'status': OrderStatus.RECEIVED.value,
                    'startTime': now,
                    'endTime': now
                }]
            }
        )

        broadcast_order_update(
            tenant_id=tenant_id,
            order_id=order_id,
            status=OrderStatus.RECEIVED.value,
            message='Order received and validated'
        )

        return {
            'orderId': order_id,
            'tenantId': tenant_id,
            'status': OrderStatus.RECEIVED.value,
            'receivedAt': now
        }

    except Exception as e:
        print(f"SFN ReceiveOrder error: {str(e)}")
        raise


def sfn_cook_order_handler(event, context):
    """Step Functions task: Start cooking order"""
    try:
        print(f"SFN CookOrder: {json.dumps(event)}")

        order_id = event.get('orderId')
        tenant_id = event.get('tenantId')

        table = get_orders_table()
        order = get_item(table, {
            'PK': f'TENANT#{tenant_id}',
            'SK': f'ORDER#{order_id}'
        })

        if not order:
            raise Exception(f'Order {order_id} not found')

        now = datetime.utcnow().isoformat()

        # Update order status to COOKING
        update_item(
            table,
            {'PK': f'TENANT#{tenant_id}', 'SK': f'ORDER#{order_id}'},
            {
                'status': OrderStatus.COOKING.value,
                'updatedAt': now,
                'workflow.currentStep': 'COOK_ORDER',
                'workflow.steps': order.get('workflow', {}).get('steps', []) + [{
                    'step': 'COOK_ORDER',
                    'status': OrderStatus.COOKING.value,
                    'startTime': now
                }]
            }
        )

        broadcast_order_update(
            tenant_id=tenant_id,
            order_id=order_id,
            status=OrderStatus.COOKING.value,
            message='Your order is being prepared'
        )

        return {
            'orderId': order_id,
            'tenantId': tenant_id,
            'status': OrderStatus.COOKING.value,
            'cookingStartedAt': now
        }

    except Exception as e:
        print(f"SFN CookOrder error: {str(e)}")
        raise


def sfn_pack_order_handler(event, context):
    """Step Functions task: Pack order for delivery"""
    try:
        print(f"SFN PackOrder: {json.dumps(event)}")

        order_id = event.get('orderId')
        tenant_id = event.get('tenantId')

        table = get_orders_table()
        order = get_item(table, {
            'PK': f'TENANT#{tenant_id}',
            'SK': f'ORDER#{order_id}'
        })

        if not order:
            raise Exception(f'Order {order_id} not found')

        now = datetime.utcnow().isoformat()

        # Update cooking step end time and add packing step
        steps = order.get('workflow', {}).get('steps', [])
        for step in steps:
            if step.get('step') == 'COOK_ORDER' and not step.get('endTime'):
                step['endTime'] = now
                step['status'] = OrderStatus.COOKED.value

        steps.append({
            'step': 'PACK_ORDER',
            'status': OrderStatus.PACKING.value,
            'startTime': now
        })

        update_item(
            table,
            {'PK': f'TENANT#{tenant_id}', 'SK': f'ORDER#{order_id}'},
            {
                'status': OrderStatus.PACKING.value,
                'updatedAt': now,
                'workflow.currentStep': 'PACK_ORDER',
                'workflow.steps': steps
            }
        )

        broadcast_order_update(
            tenant_id=tenant_id,
            order_id=order_id,
            status=OrderStatus.PACKING.value,
            message='Your order is being packed'
        )

        return {
            'orderId': order_id,
            'tenantId': tenant_id,
            'status': OrderStatus.PACKING.value,
            'packingStartedAt': now
        }

    except Exception as e:
        print(f"SFN PackOrder error: {str(e)}")
        raise


def sfn_deliver_order_handler(event, context):
    """Step Functions task: Start delivery"""
    try:
        print(f"SFN DeliverOrder: {json.dumps(event)}")

        order_id = event.get('orderId')
        tenant_id = event.get('tenantId')

        table = get_orders_table()
        order = get_item(table, {
            'PK': f'TENANT#{tenant_id}',
            'SK': f'ORDER#{order_id}'
        })

        if not order:
            raise Exception(f'Order {order_id} not found')

        now = datetime.utcnow().isoformat()

        # Update packing step and add delivery step
        steps = order.get('workflow', {}).get('steps', [])
        for step in steps:
            if step.get('step') == 'PACK_ORDER' and not step.get('endTime'):
                step['endTime'] = now
                step['status'] = OrderStatus.PACKED.value

        steps.append({
            'step': 'DELIVER_ORDER',
            'status': OrderStatus.DELIVERING.value,
            'startTime': now
        })

        update_item(
            table,
            {'PK': f'TENANT#{tenant_id}', 'SK': f'ORDER#{order_id}'},
            {
                'status': OrderStatus.DELIVERING.value,
                'updatedAt': now,
                'workflow.currentStep': 'DELIVER_ORDER',
                'workflow.steps': steps
            }
        )

        broadcast_order_update(
            tenant_id=tenant_id,
            order_id=order_id,
            status=OrderStatus.DELIVERING.value,
            message='Your order is on the way!'
        )

        return {
            'orderId': order_id,
            'tenantId': tenant_id,
            'status': OrderStatus.DELIVERING.value,
            'deliveryStartedAt': now
        }

    except Exception as e:
        print(f"SFN DeliverOrder error: {str(e)}")
        raise


def sfn_complete_order_handler(event, context):
    """Step Functions task: Complete order"""
    try:
        print(f"SFN CompleteOrder: {json.dumps(event)}")

        order_id = event.get('orderId')
        tenant_id = event.get('tenantId')

        table = get_orders_table()
        order = get_item(table, {
            'PK': f'TENANT#{tenant_id}',
            'SK': f'ORDER#{order_id}'
        })

        if not order:
            raise Exception(f'Order {order_id} not found')

        now = datetime.utcnow().isoformat()

        # Update delivery step and calculate total time
        steps = order.get('workflow', {}).get('steps', [])
        for step in steps:
            if step.get('step') == 'DELIVER_ORDER' and not step.get('endTime'):
                step['endTime'] = now
                step['status'] = OrderStatus.DELIVERED.value

        # Calculate total workflow time
        workflow = order.get('workflow', {})
        started_at = workflow.get('startedAt')
        total_time_minutes = 0

        if started_at:
            try:
                start = datetime.fromisoformat(
                    started_at.replace('Z', '+00:00'))
                end = datetime.fromisoformat(now.replace('Z', '+00:00'))
                total_time_minutes = (end - start).total_seconds() / 60
            except:
                pass

        update_item(
            table,
            {'PK': f'TENANT#{tenant_id}', 'SK': f'ORDER#{order_id}'},
            {
                'status': OrderStatus.COMPLETED.value,
                'updatedAt': now,
                'completedAt': now,
                'workflow.currentStep': 'COMPLETED',
                'workflow.completedAt': now,
                'workflow.totalTimeMinutes': round(total_time_minutes, 2),
                'workflow.steps': steps
            }
        )

        broadcast_order_update(
            tenant_id=tenant_id,
            order_id=order_id,
            status=OrderStatus.COMPLETED.value,
            message='Your order has been delivered. Thank you!'
        )

        return {
            'orderId': order_id,
            'tenantId': tenant_id,
            'status': OrderStatus.COMPLETED.value,
            'completedAt': now,
            'totalTimeMinutes': round(total_time_minutes, 2)
        }

    except Exception as e:
        print(f"SFN CompleteOrder error: {str(e)}")
        raise


def sfn_wait_for_task_handler(event, context):
    """Handle wait for human task callback"""
    try:
        print(f"SFN WaitForTask: {json.dumps(event)}")

        # This handler is invoked when Step Functions is waiting for
        # a human to complete a task (like cooking, packing, etc.)
        # The task token is used to signal task completion

        task_token = event.get('taskToken')
        order_id = event.get('orderId')
        tenant_id = event.get('tenantId')
        current_step = event.get('currentStep')

        if not task_token:
            raise Exception('Missing taskToken')

        # Store the task token so it can be used to signal completion
        table = get_orders_table()

        update_item(
            table,
            {'PK': f'TENANT#{tenant_id}', 'SK': f'ORDER#{order_id}'},
            {
                'workflow.pendingTaskToken': task_token,
                'workflow.pendingStep': current_step,
                'updatedAt': datetime.utcnow().isoformat()
            }
        )

        return {
            'orderId': order_id,
            'tenantId': tenant_id,
            'taskToken': task_token,
            'waitingFor': current_step
        }

    except Exception as e:
        print(f"SFN WaitForTask error: {str(e)}")
        raise


def sfn_notify_status_handler(event, context):
    """Step Functions task: Send status notification"""
    try:
        print(f"SFN NotifyStatus: {json.dumps(event)}")

        order_id = event.get('orderId')
        tenant_id = event.get('tenantId')
        status = event.get('status')
        message = event.get('message', f'Order status: {status}')

        if not order_id or not tenant_id:
            raise Exception('Missing orderId or tenantId')

        # Broadcast status update to connected clients
        broadcast_order_update(
            tenant_id=tenant_id,
            order_id=order_id,
            status=status,
            message=message
        )

        return {
            'orderId': order_id,
            'tenantId': tenant_id,
            'status': status,
            'notifiedAt': datetime.utcnow().isoformat()
        }

    except Exception as e:
        print(f"SFN NotifyStatus error: {str(e)}")
        raise
