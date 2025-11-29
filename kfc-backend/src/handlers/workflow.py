"""
Workflow management handlers - handles order state transitions
"""
import json
from datetime import datetime

from src.utils.response import (
    success_response, error_response, not_found_response
)
from src.utils.dynamodb import get_orders_table, get_item
from src.utils.events import start_order_workflow
from src.utils.auth import get_user_from_event
from src.handlers.orders import update_order_status
from src.models.order_status import OrderStatus


def start_workflow_handler(event, context):
    """Start the Step Functions workflow for an order"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')
        order_id = path_params.get('orderId')

        if not tenant_id or not order_id:
            return error_response('Tenant ID and Order ID are required')

        table = get_orders_table()

        # Get order
        order = get_item(table, {
            'PK': f'TENANT#{tenant_id}',
            'SK': f'ORDER#{order_id}'
        })

        if not order:
            return not_found_response('Order not found')

        # Start the Step Functions workflow
        result = start_order_workflow(tenant_id, order_id, order)

        # Update order with workflow execution ARN
        now = datetime.utcnow().isoformat()
        table.update_item(
            Key={
                'PK': f'TENANT#{tenant_id}',
                'SK': f'ORDER#{order_id}'
            },
            UpdateExpression='SET workflow.executionArn = :arn, workflow.startedAt = :startedAt',
            ExpressionAttributeValues={
                ':arn': result.get('executionArn'),
                ':startedAt': now
            }
        )

        return success_response({
            'orderId': order_id,
            'executionArn': result.get('executionArn'),
            'message': 'Workflow started successfully'
        })

    except Exception as e:
        print(f"Start workflow error: {str(e)}")
        return error_response(f'Failed to start workflow: {str(e)}', 500)


def take_order_handler(event, context):
    """Restaurant staff takes/accepts an order"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')
        order_id = path_params.get('orderId')

        if not tenant_id or not order_id:
            return error_response('Tenant ID and Order ID are required')

        body = json.loads(event.get('body', '{}'))
        staff_id = body.get('staffId')
        staff_name = body.get('staffName', 'Staff')

        # Get current order to validate status
        table = get_orders_table()
        order = get_item(table, {
            'PK': f'TENANT#{tenant_id}',
            'SK': f'ORDER#{order_id}'
        })

        if not order:
            return not_found_response('Order not found')

        if order.get('status') != OrderStatus.PENDING.value:
            return error_response(f'Order cannot be taken. Current status: {order.get("status")}')

        # Update order status
        updated_order = update_order_status(
            tenant_id=tenant_id,
            order_id=order_id,
            new_status=OrderStatus.RECEIVED.value,
            staff_id=staff_id,
            staff_name=staff_name,
            message=f'Pedido recibido por {staff_name}'
        )

        # Update workflow info
        now = datetime.utcnow().isoformat()
        table.update_item(
            Key={
                'PK': f'TENANT#{tenant_id}',
                'SK': f'ORDER#{order_id}'
            },
            UpdateExpression='SET workflow.assignedStaff.receiver = :staff, workflow.steps = list_append(if_not_exists(workflow.steps, :empty), :step)',
            ExpressionAttributeValues={
                ':staff': {'staffId': staff_id, 'staffName': staff_name, 'timestamp': now},
                ':step': [{
                    'step': 'RECEIVED',
                    'staffId': staff_id,
                    'staffName': staff_name,
                    'startTime': now
                }],
                ':empty': []
            }
        )

        return success_response(updated_order, 'Order received successfully')

    except json.JSONDecodeError:
        return error_response('Invalid JSON body')
    except ValueError as ve:
        return not_found_response(str(ve))
    except Exception as e:
        print(f"Take order error: {str(e)}")
        return error_response(f'Failed to take order: {str(e)}', 500)


def start_cooking_handler(event, context):
    """Cook starts preparing the order"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')
        order_id = path_params.get('orderId')

        if not tenant_id or not order_id:
            return error_response('Tenant ID and Order ID are required')

        body = json.loads(event.get('body', '{}'))
        staff_id = body.get('staffId')
        staff_name = body.get('staffName', 'Cook')

        # Get current order to validate status
        table = get_orders_table()
        order = get_item(table, {
            'PK': f'TENANT#{tenant_id}',
            'SK': f'ORDER#{order_id}'
        })

        if not order:
            return not_found_response('Order not found')

        if order.get('status') != OrderStatus.RECEIVED.value:
            return error_response(f'Order cannot start cooking. Current status: {order.get("status")}')

        # Update order status
        updated_order = update_order_status(
            tenant_id=tenant_id,
            order_id=order_id,
            new_status=OrderStatus.COOKING.value,
            staff_id=staff_id,
            staff_name=staff_name,
            message=f'Cocinero {staff_name} iniciando preparación'
        )

        # Update workflow info
        now = datetime.utcnow().isoformat()
        table.update_item(
            Key={
                'PK': f'TENANT#{tenant_id}',
                'SK': f'ORDER#{order_id}'
            },
            UpdateExpression='SET workflow.assignedStaff.cook = :staff, workflow.steps = list_append(if_not_exists(workflow.steps, :empty), :step)',
            ExpressionAttributeValues={
                ':staff': {'staffId': staff_id, 'staffName': staff_name, 'timestamp': now},
                ':step': [{
                    'step': 'COOKING',
                    'staffId': staff_id,
                    'staffName': staff_name,
                    'startTime': now
                }],
                ':empty': []
            }
        )

        return success_response(updated_order, 'Cooking started')

    except json.JSONDecodeError:
        return error_response('Invalid JSON body')
    except ValueError as ve:
        return not_found_response(str(ve))
    except Exception as e:
        print(f"Start cooking error: {str(e)}")
        return error_response(f'Failed to start cooking: {str(e)}', 500)


def finish_cooking_handler(event, context):
    """Cook finishes preparing the order"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')
        order_id = path_params.get('orderId')

        if not tenant_id or not order_id:
            return error_response('Tenant ID and Order ID are required')

        body = json.loads(event.get('body', '{}'))
        staff_id = body.get('staffId')
        staff_name = body.get('staffName', 'Cook')

        # Get current order to validate status
        table = get_orders_table()
        order = get_item(table, {
            'PK': f'TENANT#{tenant_id}',
            'SK': f'ORDER#{order_id}'
        })

        if not order:
            return not_found_response('Order not found')

        if order.get('status') != OrderStatus.COOKING.value:
            return error_response(f'Order is not being cooked. Current status: {order.get("status")}')

        # Update order status
        updated_order = update_order_status(
            tenant_id=tenant_id,
            order_id=order_id,
            new_status=OrderStatus.COOKED.value,
            staff_id=staff_id,
            staff_name=staff_name,
            message=f'Comida lista por {staff_name}'
        )

        # Update workflow step end time
        now = datetime.utcnow().isoformat()
        workflow_steps = order.get('workflow', {}).get('steps', [])
        for step in workflow_steps:
            if step.get('step') == 'COOKING' and not step.get('endTime'):
                step['endTime'] = now

        table.update_item(
            Key={
                'PK': f'TENANT#{tenant_id}',
                'SK': f'ORDER#{order_id}'
            },
            UpdateExpression='SET workflow.steps = :steps',
            ExpressionAttributeValues={
                ':steps': workflow_steps
            }
        )

        return success_response(updated_order, 'Cooking finished')

    except json.JSONDecodeError:
        return error_response('Invalid JSON body')
    except ValueError as ve:
        return not_found_response(str(ve))
    except Exception as e:
        print(f"Finish cooking error: {str(e)}")
        return error_response(f'Failed to finish cooking: {str(e)}', 500)


def pack_order_handler(event, context):
    """Dispatcher packs the order"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')
        order_id = path_params.get('orderId')

        if not tenant_id or not order_id:
            return error_response('Tenant ID and Order ID are required')

        body = json.loads(event.get('body', '{}'))
        staff_id = body.get('staffId')
        staff_name = body.get('staffName', 'Dispatcher')

        # Get current order to validate status
        table = get_orders_table()
        order = get_item(table, {
            'PK': f'TENANT#{tenant_id}',
            'SK': f'ORDER#{order_id}'
        })

        if not order:
            return not_found_response('Order not found')

        if order.get('status') != OrderStatus.COOKED.value:
            return error_response(f'Order cannot be packed. Current status: {order.get("status")}')

        # Update order status
        updated_order = update_order_status(
            tenant_id=tenant_id,
            order_id=order_id,
            new_status=OrderStatus.PACKED.value,
            staff_id=staff_id,
            staff_name=staff_name,
            message=f'Pedido empacado por {staff_name}'
        )

        # Update workflow info
        now = datetime.utcnow().isoformat()
        table.update_item(
            Key={
                'PK': f'TENANT#{tenant_id}',
                'SK': f'ORDER#{order_id}'
            },
            UpdateExpression='SET workflow.assignedStaff.dispatcher = :staff, workflow.steps = list_append(if_not_exists(workflow.steps, :empty), :step)',
            ExpressionAttributeValues={
                ':staff': {'staffId': staff_id, 'staffName': staff_name, 'timestamp': now},
                ':step': [{
                    'step': 'PACKED',
                    'staffId': staff_id,
                    'staffName': staff_name,
                    'startTime': now,
                    'endTime': now
                }],
                ':empty': []
            }
        )

        return success_response(updated_order, 'Order packed successfully')

    except json.JSONDecodeError:
        return error_response('Invalid JSON body')
    except ValueError as ve:
        return not_found_response(str(ve))
    except Exception as e:
        print(f"Pack order error: {str(e)}")
        return error_response(f'Failed to pack order: {str(e)}', 500)


def start_delivery_handler(event, context):
    """Delivery person starts delivery"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')
        order_id = path_params.get('orderId')

        if not tenant_id or not order_id:
            return error_response('Tenant ID and Order ID are required')

        body = json.loads(event.get('body', '{}'))
        staff_id = body.get('staffId')
        staff_name = body.get('staffName', 'Delivery')

        # Get current order to validate status
        table = get_orders_table()
        order = get_item(table, {
            'PK': f'TENANT#{tenant_id}',
            'SK': f'ORDER#{order_id}'
        })

        if not order:
            return not_found_response('Order not found')

        if order.get('status') != OrderStatus.PACKED.value:
            return error_response(f'Order cannot start delivery. Current status: {order.get("status")}')

        # Update order status
        updated_order = update_order_status(
            tenant_id=tenant_id,
            order_id=order_id,
            new_status=OrderStatus.DELIVERING.value,
            staff_id=staff_id,
            staff_name=staff_name,
            message=f'Repartidor {staff_name} en camino'
        )

        # Update workflow info
        now = datetime.utcnow().isoformat()
        table.update_item(
            Key={
                'PK': f'TENANT#{tenant_id}',
                'SK': f'ORDER#{order_id}'
            },
            UpdateExpression='SET workflow.assignedStaff.delivery = :staff, workflow.steps = list_append(if_not_exists(workflow.steps, :empty), :step)',
            ExpressionAttributeValues={
                ':staff': {'staffId': staff_id, 'staffName': staff_name, 'timestamp': now},
                ':step': [{
                    'step': 'DELIVERING',
                    'staffId': staff_id,
                    'staffName': staff_name,
                    'startTime': now
                }],
                ':empty': []
            }
        )

        return success_response(updated_order, 'Delivery started')

    except json.JSONDecodeError:
        return error_response('Invalid JSON body')
    except ValueError as ve:
        return not_found_response(str(ve))
    except Exception as e:
        print(f"Start delivery error: {str(e)}")
        return error_response(f'Failed to start delivery: {str(e)}', 500)


def complete_delivery_handler(event, context):
    """Complete the delivery and the order"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')
        order_id = path_params.get('orderId')

        if not tenant_id or not order_id:
            return error_response('Tenant ID and Order ID are required')

        body = json.loads(event.get('body', '{}'))
        staff_id = body.get('staffId')
        staff_name = body.get('staffName', 'Delivery')
        customer_signature = body.get('customerSignature', '')
        delivery_notes = body.get('deliveryNotes', '')

        # Get current order to validate status
        table = get_orders_table()
        order = get_item(table, {
            'PK': f'TENANT#{tenant_id}',
            'SK': f'ORDER#{order_id}'
        })

        if not order:
            return not_found_response('Order not found')

        if order.get('status') != OrderStatus.DELIVERING.value:
            return error_response(f'Order is not being delivered. Current status: {order.get("status")}')

        # Update order status to COMPLETED
        updated_order = update_order_status(
            tenant_id=tenant_id,
            order_id=order_id,
            new_status=OrderStatus.COMPLETED.value,
            staff_id=staff_id,
            staff_name=staff_name,
            message=f'Pedido entregado por {staff_name}'
        )

        # Update workflow info and finalize
        now = datetime.utcnow().isoformat()
        workflow_steps = order.get('workflow', {}).get('steps', [])
        for step in workflow_steps:
            if step.get('step') == 'DELIVERING' and not step.get('endTime'):
                step['endTime'] = now

        # Calculate total time
        created_at = order.get('createdAt', now)
        try:
            start_time = datetime.fromisoformat(
                created_at.replace('Z', '+00:00'))
            end_time = datetime.fromisoformat(now)
            total_minutes = (end_time - start_time).total_seconds() / 60
        except:
            total_minutes = 0

        table.update_item(
            Key={
                'PK': f'TENANT#{tenant_id}',
                'SK': f'ORDER#{order_id}'
            },
            UpdateExpression='''
                SET workflow.steps = :steps,
                    workflow.completedAt = :completedAt,
                    workflow.totalTimeMinutes = :totalTime,
                    deliveryConfirmation.signature = :signature,
                    deliveryConfirmation.notes = :notes,
                    deliveryConfirmation.timestamp = :timestamp,
                    paymentStatus = :paymentStatus
            ''',
            ExpressionAttributeValues={
                ':steps': workflow_steps,
                ':completedAt': now,
                ':totalTime': total_minutes,
                ':signature': customer_signature,
                ':notes': delivery_notes,
                ':timestamp': now,
                ':paymentStatus': 'COMPLETED'
            }
        )

        return success_response(updated_order, 'Order completed successfully')

    except json.JSONDecodeError:
        return error_response('Invalid JSON body')
    except ValueError as ve:
        return not_found_response(str(ve))
    except Exception as e:
        print(f"Complete delivery error: {str(e)}")
        return error_response(f'Failed to complete delivery: {str(e)}', 500)
