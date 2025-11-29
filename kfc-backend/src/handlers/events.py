"""
EventBridge event handlers
"""
import json
from datetime import datetime

from src.utils.dynamodb import get_orders_table, get_item
from src.utils.websocket import broadcast_order_update, broadcast_to_tenant
from src.models.order_status import OrderStatus


def order_events_handler(event, context):
    """Handle order events from EventBridge"""
    try:
        print(f"Received event: {json.dumps(event)}")

        detail_type = event.get('detail-type', '')
        detail = event.get('detail', {})
        source = event.get('source', '')

        order_id = detail.get('orderId')
        tenant_id = detail.get('tenantId')

        if not order_id or not tenant_id:
            print(f"Missing orderId or tenantId in event detail")
            return {'statusCode': 400}

        print(f"Processing {detail_type} event for order {order_id}")

        # Handle different event types
        if detail_type == 'OrderCreated':
            # Notify restaurant staff about new order
            broadcast_to_tenant(
                tenant_id=tenant_id,
                message_type='NEW_ORDER',
                data={
                    'orderId': order_id,
                    'message': 'New order received!',
                    'total': detail.get('total', 0),
                    'items': detail.get('items', [])
                }
            )

        elif detail_type == 'OrderStatusChanged':
            old_status = detail.get('oldStatus')
            new_status = detail.get('newStatus')

            # Notify all connected clients about status change
            broadcast_order_update(
                tenant_id=tenant_id,
                order_id=order_id,
                status=new_status,
                message=f'Order moved from {old_status} to {new_status}'
            )

            # Additional logic based on status
            if new_status == OrderStatus.COOKING.value:
                broadcast_to_tenant(
                    tenant_id=tenant_id,
                    message_type='ORDER_COOKING',
                    data={
                        'orderId': order_id,
                        'message': 'Your order is being prepared!'
                    }
                )
            elif new_status == OrderStatus.DELIVERING.value:
                broadcast_to_tenant(
                    tenant_id=tenant_id,
                    message_type='ORDER_OUT_FOR_DELIVERY',
                    data={
                        'orderId': order_id,
                        'message': 'Your order is on the way!'
                    }
                )
            elif new_status == OrderStatus.COMPLETED.value:
                broadcast_to_tenant(
                    tenant_id=tenant_id,
                    message_type='ORDER_COMPLETED',
                    data={
                        'orderId': order_id,
                        'message': 'Your order has been delivered!'
                    }
                )

        elif detail_type == 'OrderWorkflowStarted':
            broadcast_to_tenant(
                tenant_id=tenant_id,
                message_type='WORKFLOW_STARTED',
                data={
                    'orderId': order_id,
                    'executionArn': detail.get('executionArn')
                }
            )

        elif detail_type == 'OrderReceived':
            # Analytics event - log it
            print(
                f"Analytics: Order {order_id} received, total: {detail.get('total')}")

        elif detail_type == 'OrderCompleted':
            # Order fully completed - analytics
            total_time = detail.get('totalTimeMinutes', 0)
            print(
                f"Analytics: Order {order_id} completed in {total_time} minutes")

        else:
            print(f"Unhandled event type: {detail_type}")

        return {'statusCode': 200}

    except Exception as e:
        print(f"Error handling event: {str(e)}")
        return {'statusCode': 500, 'error': str(e)}


def tenant_events_handler(event, context):
    """Handle tenant-related events from EventBridge"""
    try:
        print(f"Received tenant event: {json.dumps(event)}")

        detail_type = event.get('detail-type', '')
        detail = event.get('detail', {})

        if detail_type == 'TenantCreated':
            tenant_id = detail.get('tenantId')
            name = detail.get('name')
            print(f"New tenant created: {name} ({tenant_id})")

        elif detail_type == 'TenantUpdated':
            tenant_id = detail.get('tenantId')
            print(f"Tenant updated: {tenant_id}")

        return {'statusCode': 200}

    except Exception as e:
        print(f"Error handling tenant event: {str(e)}")
        return {'statusCode': 500, 'error': str(e)}
