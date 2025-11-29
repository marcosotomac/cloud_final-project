"""
Order management handlers
"""
import json
import ulid
from datetime import datetime
from boto3.dynamodb.conditions import Key

from src.utils.response import (
    success_response, created_response, error_response, not_found_response
)
from src.utils.dynamodb import get_orders_table, put_item, get_item, query_items
from src.utils.websocket import broadcast_new_order
from src.utils.events import publish_order_event, start_order_workflow
from src.models.order_status import OrderStatus


def create_order_handler(event, context):
    """Create a new order from customer"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')

        if not tenant_id:
            return error_response('Tenant ID is required')

        body = json.loads(event.get('body', '{}'))

        # Validate required fields
        required_fields = ['customerId', 'items', 'deliveryAddress']
        for field in required_fields:
            if not body.get(field):
                return error_response(f'Missing required field: {field}')

        if not body['items'] or len(body['items']) == 0:
            return error_response('Order must contain at least one item')

        table = get_orders_table()

        order_id = str(ulid.new())
        now = datetime.utcnow().isoformat()

        # Calculate totals
        subtotal = sum(item.get('price', 0) * item.get('quantity', 1)
                       for item in body['items'])
        tax = subtotal * 0.18  # 18% IGV
        delivery_fee = body.get('deliveryFee', 5.0)
        total = subtotal + tax + delivery_fee

        # Generate order number
        order_number = f"KFC-{datetime.utcnow().strftime('%Y%m%d')}-{order_id[:8].upper()}"

        order = {
            'PK': f'TENANT#{tenant_id}',
            'SK': f'ORDER#{order_id}',
            'GSI1PK': f'TENANT#{tenant_id}#STATUS#{OrderStatus.PENDING.value}',
            'GSI1SK': now,
            'GSI2PK': f'TENANT#{tenant_id}#CUSTOMER#{body["customerId"]}',
            'GSI2SK': now,
            'orderId': order_id,
            'orderNumber': order_number,
            'tenantId': tenant_id,
            'customerId': body['customerId'],
            'customerName': body.get('customerName', ''),
            'customerPhone': body.get('customerPhone', ''),
            'customerEmail': body.get('customerEmail', ''),
            'items': body['items'],
            'subtotal': subtotal,
            'tax': tax,
            'deliveryFee': delivery_fee,
            'total': total,
            'deliveryAddress': body['deliveryAddress'],
            'deliveryNotes': body.get('deliveryNotes', ''),
            'paymentMethod': body.get('paymentMethod', 'CASH'),
            'paymentStatus': 'PENDING',
            'status': OrderStatus.PENDING.value,
            'statusHistory': [
                {
                    'status': OrderStatus.PENDING.value,
                    'timestamp': now,
                    'message': 'Pedido creado por el cliente'
                }
            ],
            'workflow': {
                'currentStep': 'PENDING',
                'steps': [],
                'assignedStaff': {}
            },
            'estimatedDeliveryTime': body.get('estimatedDeliveryTime', 45),
            'createdAt': now,
            'updatedAt': now
        }

        put_item(table, order)

        # Broadcast new order to restaurant staff via WebSocket
        try:
            broadcast_new_order(tenant_id, order)
        except Exception as ws_error:
            print(f"WebSocket broadcast error: {str(ws_error)}")

        # Publish event to EventBridge
        try:
            publish_order_event('OrderCreated', tenant_id, order_id, order)
        except Exception as event_error:
            print(f"EventBridge publish error: {str(event_error)}")

        return created_response(order, 'Order created successfully')

    except json.JSONDecodeError:
        return error_response('Invalid JSON body')
    except Exception as e:
        print(f"Create order error: {str(e)}")
        return error_response(f'Failed to create order: {str(e)}', 500)


def get_orders_handler(event, context):
    """Get all orders for a tenant"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')

        if not tenant_id:
            return error_response('Tenant ID is required')

        query_params = event.get('queryStringParameters') or {}
        limit = int(query_params.get('limit', 50))

        table = get_orders_table()

        # Query orders for this tenant
        orders = query_items(
            table,
            Key('PK').eq(f'TENANT#{tenant_id}') & Key(
                'SK').begins_with('ORDER#'),
            limit=limit,
            scan_forward=False  # Most recent first
        )

        return success_response({
            'orders': orders,
            'count': len(orders)
        })

    except Exception as e:
        print(f"Get orders error: {str(e)}")
        return error_response(f'Failed to get orders: {str(e)}', 500)


def get_order_handler(event, context):
    """Get a specific order by ID"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')
        order_id = path_params.get('orderId')

        if not tenant_id or not order_id:
            return error_response('Tenant ID and Order ID are required')

        table = get_orders_table()

        order = get_item(table, {
            'PK': f'TENANT#{tenant_id}',
            'SK': f'ORDER#{order_id}'
        })

        if not order:
            return not_found_response('Order not found')

        return success_response(order)

    except Exception as e:
        print(f"Get order error: {str(e)}")
        return error_response(f'Failed to get order: {str(e)}', 500)


def get_orders_by_status_handler(event, context):
    """Get orders by status for a tenant"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')
        status = path_params.get('status')

        if not tenant_id or not status:
            return error_response('Tenant ID and Status are required')

        # Validate status
        valid_statuses = [s.value for s in OrderStatus]
        if status not in valid_statuses:
            return error_response(f'Invalid status. Valid values: {", ".join(valid_statuses)}')

        table = get_orders_table()

        # Query orders by status using GSI1
        orders = query_items(
            table,
            Key('GSI1PK').eq(f'TENANT#{tenant_id}#STATUS#{status}'),
            index_name='GSI1',
            scan_forward=False
        )

        return success_response({
            'orders': orders,
            'status': status,
            'count': len(orders)
        })

    except Exception as e:
        print(f"Get orders by status error: {str(e)}")
        return error_response(f'Failed to get orders: {str(e)}', 500)


def get_customer_orders_handler(event, context):
    """Get orders for a specific customer"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')
        customer_id = path_params.get('customerId')

        if not tenant_id or not customer_id:
            return error_response('Tenant ID and Customer ID are required')

        table = get_orders_table()

        # Query orders by customer using GSI2
        orders = query_items(
            table,
            Key('GSI2PK').eq(f'TENANT#{tenant_id}#CUSTOMER#{customer_id}'),
            index_name='GSI2',
            scan_forward=False
        )

        return success_response({
            'orders': orders,
            'customerId': customer_id,
            'count': len(orders)
        })

    except Exception as e:
        print(f"Get customer orders error: {str(e)}")
        return error_response(f'Failed to get customer orders: {str(e)}', 500)


def update_order_status(
    tenant_id: str,
    order_id: str,
    new_status: str,
    staff_id: str = None,
    staff_name: str = None,
    message: str = None
) -> dict:
    """
    Helper function to update order status

    Args:
        tenant_id: The tenant ID
        order_id: The order ID
        new_status: The new status
        staff_id: ID of staff making the change
        staff_name: Name of staff making the change
        message: Optional message

    Returns:
        Updated order
    """
    from src.utils.websocket import broadcast_order_update

    table = get_orders_table()
    now = datetime.utcnow().isoformat()

    # Get current order
    order = get_item(table, {
        'PK': f'TENANT#{tenant_id}',
        'SK': f'ORDER#{order_id}'
    })

    if not order:
        raise ValueError('Order not found')

    old_status = order.get('status')

    # Add to status history
    status_entry = {
        'status': new_status,
        'timestamp': now,
        'message': message or f'Status changed to {new_status}'
    }
    if staff_id:
        status_entry['staffId'] = staff_id
        status_entry['staffName'] = staff_name

    status_history = order.get('statusHistory', [])
    status_history.append(status_entry)

    # Update order
    response = table.update_item(
        Key={
            'PK': f'TENANT#{tenant_id}',
            'SK': f'ORDER#{order_id}'
        },
        UpdateExpression='''
            SET #status = :newStatus,
                GSI1PK = :gsi1pk,
                GSI1SK = :gsi1sk,
                statusHistory = :statusHistory,
                updatedAt = :updatedAt
        ''',
        ExpressionAttributeNames={
            '#status': 'status'
        },
        ExpressionAttributeValues={
            ':newStatus': new_status,
            ':gsi1pk': f'TENANT#{tenant_id}#STATUS#{new_status}',
            ':gsi1sk': now,
            ':statusHistory': status_history,
            ':updatedAt': now
        },
        ReturnValues='ALL_NEW'
    )

    updated_order = response.get('Attributes', {})

    # Broadcast update via WebSocket
    try:
        broadcast_order_update(tenant_id, order_id, new_status, updated_order)
    except Exception as ws_error:
        print(f"WebSocket broadcast error: {str(ws_error)}")

    # Publish event to EventBridge
    try:
        publish_order_event('OrderStatusChanged', tenant_id, order_id, {
            'order': updated_order,
            'oldStatus': old_status,
            'newStatus': new_status
        })
    except Exception as event_error:
        print(f"EventBridge publish error: {str(event_error)}")

    return updated_order


def update_order_status_handler(event, context):
    """Update order status - used by ops frontend"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')
        order_id = path_params.get('orderId')

        if not tenant_id or not order_id:
            return error_response('Tenant ID and Order ID are required')

        body = json.loads(event.get('body', '{}'))

        new_status = body.get('status')
        if not new_status:
            return error_response('Status is required')

        # Validate status
        valid_statuses = [s.value for s in OrderStatus]
        if new_status not in valid_statuses:
            return error_response(f'Invalid status. Valid values: {", ".join(valid_statuses)}')

        updated_order = update_order_status(
            tenant_id=tenant_id,
            order_id=order_id,
            new_status=new_status,
            staff_id=body.get('staffId'),
            staff_name=body.get('staffName'),
            message=body.get('message')
        )

        return success_response(updated_order, 'Order status updated successfully')

    except ValueError as ve:
        return not_found_response(str(ve))
    except json.JSONDecodeError:
        return error_response('Invalid JSON body')
    except Exception as e:
        print(f"Update order status error: {str(e)}")
        return error_response(f'Failed to update order status: {str(e)}', 500)


def cancel_order_handler(event, context):
    """Cancel an order"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')
        order_id = path_params.get('orderId')

        if not tenant_id or not order_id:
            return error_response('Tenant ID and Order ID are required')

        body = json.loads(event.get('body', '{}'))

        table = get_orders_table()

        order = get_item(table, {
            'PK': f'TENANT#{tenant_id}',
            'SK': f'ORDER#{order_id}'
        })

        if not order:
            return not_found_response('Order not found')

        current_status = order.get('status')

        # Only allow cancellation for certain statuses
        cancellable_statuses = [
            OrderStatus.PENDING.value,
            OrderStatus.RECEIVED.value,
            OrderStatus.COOKING.value
        ]

        if current_status not in cancellable_statuses:
            return error_response(
                f'Cannot cancel order in {current_status} status. '
                f'Cancellation allowed only for: {", ".join(cancellable_statuses)}'
            )

        reason = body.get('reason', 'No reason provided')
        cancelled_by = body.get('cancelledBy', 'system')
        refund_requested = body.get('refundRequested', True)

        now = datetime.utcnow().isoformat()

        # Update order to cancelled
        from src.utils.dynamodb import update_item

        update_fields = {
            'status': OrderStatus.CANCELLED.value,
            'GSI1PK': f'TENANT#{tenant_id}#STATUS#CANCELLED',
            'GSI1SK': now,
            'cancelledAt': now,
            'cancellationReason': reason,
            'cancelledBy': cancelled_by,
            'refundRequested': refund_requested,
            'refundStatus': 'PENDING' if refund_requested else 'NOT_APPLICABLE',
            'updatedAt': now
        }

        # Add to status history
        status_history = order.get('statusHistory', [])
        status_history.append({
            'status': OrderStatus.CANCELLED.value,
            'timestamp': now,
            'message': f'Order cancelled: {reason}',
            'cancelledBy': cancelled_by
        })
        update_fields['statusHistory'] = status_history

        update_item(
            table,
            {'PK': f'TENANT#{tenant_id}', 'SK': f'ORDER#{order_id}'},
            update_fields
        )

        # Publish cancellation event
        try:
            publish_order_event('OrderCancelled', tenant_id, order_id, {
                'orderId': order_id,
                'reason': reason,
                'cancelledBy': cancelled_by,
                'refundRequested': refund_requested
            })
        except Exception as event_error:
            print(f"EventBridge publish error: {str(event_error)}")

        # Notify via WebSocket
        try:
            from src.utils.websocket import broadcast_order_update
            broadcast_order_update(tenant_id, order_id, OrderStatus.CANCELLED.value, {
                'orderId': order_id,
                'status': OrderStatus.CANCELLED.value,
                'cancellationReason': reason
            })
        except Exception as ws_error:
            print(f"WebSocket broadcast error: {str(ws_error)}")

        return success_response({
            'orderId': order_id,
            'status': OrderStatus.CANCELLED.value,
            'cancellationReason': reason,
            'refundStatus': update_fields['refundStatus'],
            'message': 'Order cancelled successfully'
        })

    except json.JSONDecodeError:
        return error_response('Invalid JSON body')
    except Exception as e:
        print(f"Cancel order error: {str(e)}")
        return error_response(f'Failed to cancel order: {str(e)}', 500)


def assign_staff_handler(event, context):
    """Assign staff to an order for a specific step"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')
        order_id = path_params.get('orderId')

        if not tenant_id or not order_id:
            return error_response('Tenant ID and Order ID are required')

        body = json.loads(event.get('body', '{}'))

        staff_id = body.get('staffId')
        staff_name = body.get('staffName')
        role = body.get('role')  # cook, packer, delivery

        if not staff_id or not role:
            return error_response('Staff ID and role are required')

        valid_roles = ['cook', 'packer', 'delivery']
        if role not in valid_roles:
            return error_response(f'Invalid role. Valid: {", ".join(valid_roles)}')

        table = get_orders_table()

        order = get_item(table, {
            'PK': f'TENANT#{tenant_id}',
            'SK': f'ORDER#{order_id}'
        })

        if not order:
            return not_found_response('Order not found')

        now = datetime.utcnow().isoformat()

        # Update workflow assignments
        workflow = order.get('workflow', {'assignedStaff': {}, 'steps': []})
        workflow['assignedStaff'][role] = {
            'staffId': staff_id,
            'staffName': staff_name,
            'assignedAt': now
        }

        from src.utils.dynamodb import update_item
        update_item(
            table,
            {'PK': f'TENANT#{tenant_id}', 'SK': f'ORDER#{order_id}'},
            {
                'workflow': workflow,
                'updatedAt': now
            }
        )

        return success_response({
            'orderId': order_id,
            'role': role,
            'staffId': staff_id,
            'staffName': staff_name,
            'message': f'{role} assigned successfully'
        })

    except json.JSONDecodeError:
        return error_response('Invalid JSON body')
    except Exception as e:
        print(f"Assign staff error: {str(e)}")
        return error_response(f'Failed to assign staff: {str(e)}', 500)


def get_active_orders_handler(event, context):
    """Get all active (non-completed/cancelled) orders"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')

        if not tenant_id:
            return error_response('Tenant ID is required')

        table = get_orders_table()

        # Get orders for this tenant
        orders = query_items(
            table,
            Key('PK').eq(f'TENANT#{tenant_id}') & Key(
                'SK').begins_with('ORDER#')
        )

        # Filter to active orders
        completed_statuses = [
            OrderStatus.COMPLETED.value,
            OrderStatus.CANCELLED.value,
            OrderStatus.DELIVERED.value
        ]

        active_orders = [
            o for o in orders if o.get('status') not in completed_statuses
        ]

        # Group by status
        by_status = {}
        for order in active_orders:
            status = order.get('status', 'UNKNOWN')
            if status not in by_status:
                by_status[status] = []
            by_status[status].append(order)

        return success_response({
            'orders': active_orders,
            'byStatus': by_status,
            'count': len(active_orders)
        })

    except Exception as e:
        print(f"Get active orders error: {str(e)}")
        return error_response(f'Failed to get active orders: {str(e)}', 500)


def get_order_statistics_handler(event, context):
    """Get order statistics for today"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')

        if not tenant_id:
            return error_response('Tenant ID is required')

        table = get_orders_table()

        # Get all orders
        orders = query_items(
            table,
            Key('PK').eq(f'TENANT#{tenant_id}') & Key(
                'SK').begins_with('ORDER#')
        )

        # Filter for today
        from datetime import date
        today = date.today().isoformat()
        today_orders = [
            o for o in orders
            if o.get('createdAt', '').startswith(today)
        ]

        # Calculate statistics
        total_revenue = sum(o.get('total', 0) for o in today_orders if o.get(
            'status') != OrderStatus.CANCELLED.value)
        total_orders = len(today_orders)
        cancelled = len([o for o in today_orders if o.get(
            'status') == OrderStatus.CANCELLED.value])
        completed = len([o for o in today_orders if o.get('status') in [
                        OrderStatus.COMPLETED.value, OrderStatus.DELIVERED.value]])
        pending = len([o for o in today_orders if o.get(
            'status') == OrderStatus.PENDING.value])
        in_progress = total_orders - completed - cancelled - pending

        # Calculate average time for completed orders
        completion_times = []
        for order in today_orders:
            if order.get('status') in [OrderStatus.COMPLETED.value, OrderStatus.DELIVERED.value]:
                workflow = order.get('workflow', {})
                if workflow.get('totalTimeMinutes'):
                    completion_times.append(workflow['totalTimeMinutes'])

        avg_time = sum(completion_times) / \
            len(completion_times) if completion_times else 0

        return success_response({
            'date': today,
            'totalOrders': total_orders,
            'totalRevenue': round(total_revenue, 2),
            'completedOrders': completed,
            'pendingOrders': pending,
            'inProgressOrders': in_progress,
            'cancelledOrders': cancelled,
            'averageCompletionTime': round(avg_time, 1),
            'completionRate': round(completed / total_orders * 100, 1) if total_orders > 0 else 0
        })

    except Exception as e:
        print(f"Get order statistics error: {str(e)}")
        return error_response(f'Failed to get statistics: {str(e)}', 500)
