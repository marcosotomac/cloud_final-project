"""
SNS notification handlers
"""
import json
from datetime import datetime

from src.utils.dynamodb import get_orders_table, get_connections_table, get_item, query_items
from src.utils.websocket import broadcast_order_update


def notification_handler(event, context):
    """Handle SNS notifications"""
    try:
        for record in event.get('Records', []):
            sns_message = record.get('Sns', {})
            message_body = sns_message.get('Message', '{}')
            subject = sns_message.get('Subject', '')

            try:
                message = json.loads(message_body)
            except json.JSONDecodeError:
                message = {'text': message_body}

            print(
                f"SNS Notification - Subject: {subject}, Message: {json.dumps(message)}")

            notification_type = message.get('type', 'general')
            tenant_id = message.get('tenantId')
            order_id = message.get('orderId')

            if notification_type == 'order_update' and order_id and tenant_id:
                # Send real-time update via WebSocket
                broadcast_order_update(
                    tenant_id=tenant_id,
                    order_id=order_id,
                    status=message.get('status'),
                    message=message.get('message', 'Order updated')
                )

            elif notification_type == 'staff_alert' and tenant_id:
                # Alert staff members
                from src.utils.websocket import broadcast_to_tenant
                broadcast_to_tenant(
                    tenant_id=tenant_id,
                    message_type='STAFF_ALERT',
                    data={
                        'message': message.get('message'),
                        'priority': message.get('priority', 'normal')
                    }
                )

            elif notification_type == 'system_alert':
                # System-wide alert (e.g., maintenance)
                print(f"System alert: {message.get('message')}")

            else:
                print(f"Unhandled notification type: {notification_type}")

        return {'statusCode': 200}

    except Exception as e:
        print(f"Notification handler error: {str(e)}")
        return {'statusCode': 500, 'error': str(e)}


def order_notification_handler(event, context):
    """Handle order-specific notifications from SNS"""
    try:
        for record in event.get('Records', []):
            sns_message = record.get('Sns', {})
            message_body = sns_message.get('Message', '{}')

            try:
                message = json.loads(message_body)
            except json.JSONDecodeError:
                print(f"Failed to parse SNS message: {message_body}")
                continue

            event_type = message.get('eventType')
            order_id = message.get('orderId')
            tenant_id = message.get('tenantId')

            if not order_id or not tenant_id:
                print("Missing orderId or tenantId in notification")
                continue

            print(f"Order notification: {event_type} for order {order_id}")

            # Get order details
            table = get_orders_table()
            order = get_item(table, {
                'PK': f'TENANT#{tenant_id}',
                'SK': f'ORDER#{order_id}'
            })

            if not order:
                print(f"Order {order_id} not found")
                continue

            # Handle different event types
            if event_type == 'ORDER_CREATED':
                # Could send email/SMS to customer
                customer_id = order.get('customerId')
                print(
                    f"New order {order_id} created for customer {customer_id}")

            elif event_type == 'ORDER_READY':
                # Notify customer that order is ready
                print(f"Order {order_id} is ready for pickup/delivery")

            elif event_type == 'ORDER_DELIVERED':
                # Request review, send thanks
                print(f"Order {order_id} delivered successfully")

            elif event_type == 'ORDER_CANCELLED':
                # Notify customer about cancellation
                reason = message.get('reason', 'No reason provided')
                print(f"Order {order_id} cancelled: {reason}")

        return {'statusCode': 200}

    except Exception as e:
        print(f"Order notification error: {str(e)}")
        return {'statusCode': 500, 'error': str(e)}
