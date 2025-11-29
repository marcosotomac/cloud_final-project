"""
SQS Queue processing handlers
"""
import json
from datetime import datetime

from src.utils.dynamodb import get_orders_table, get_item, update_item
from src.utils.websocket import broadcast_order_update
from src.utils.events import send_order_event
from src.models.order_status import OrderStatus


def process_order_queue_handler(event, context):
    """Process orders from SQS queue"""
    processed = 0
    failed = 0

    for record in event.get('Records', []):
        try:
            body = json.loads(record.get('body', '{}'))

            order_id = body.get('orderId')
            tenant_id = body.get('tenantId')
            action = body.get('action', 'PROCESS')

            if not order_id or not tenant_id:
                print(f"Missing orderId or tenantId in message: {body}")
                failed += 1
                continue

            print(
                f"Processing order {order_id} for tenant {tenant_id}, action: {action}")

            table = get_orders_table()
            order = get_item(table, {
                'PK': f'TENANT#{tenant_id}',
                'SK': f'ORDER#{order_id}'
            })

            if not order:
                print(f"Order {order_id} not found")
                failed += 1
                continue

            # Process based on action
            if action == 'NEW_ORDER':
                # New order notification - broadcast to all connected clients
                broadcast_order_update(
                    tenant_id=tenant_id,
                    order_id=order_id,
                    status=order.get('status'),
                    message='New order received!',
                    order_data=order
                )

                # Emit event for analytics
                send_order_event(
                    event_type='OrderReceived',
                    order_data={
                        'orderId': order_id,
                        'tenantId': tenant_id,
                        'total': order.get('total', 0),
                        'itemCount': len(order.get('items', []))
                    }
                )

            elif action == 'STATUS_UPDATE':
                new_status = body.get('newStatus')
                if new_status:
                    # Broadcast status update
                    broadcast_order_update(
                        tenant_id=tenant_id,
                        order_id=order_id,
                        status=new_status,
                        message=f'Order status updated to {new_status}'
                    )

            elif action == 'NOTIFICATION':
                # Send notification to customer
                notification_type = body.get(
                    'notificationType', 'order_update')
                message = body.get('message', 'Your order has been updated')

                # Broadcast to customer
                broadcast_order_update(
                    tenant_id=tenant_id,
                    order_id=order_id,
                    status=order.get('status'),
                    message=message,
                    extra_data={'notificationType': notification_type}
                )

            processed += 1

        except json.JSONDecodeError as e:
            print(f"Failed to parse message: {str(e)}")
            failed += 1
        except Exception as e:
            print(f"Failed to process message: {str(e)}")
            failed += 1

    print(f"Processed {processed} messages, {failed} failed")

    return {
        'processed': processed,
        'failed': failed
    }


def process_dlq_handler(event, context):
    """Process Dead Letter Queue messages for failed orders"""
    for record in event.get('Records', []):
        try:
            body = json.loads(record.get('body', '{}'))

            order_id = body.get('orderId', 'unknown')
            tenant_id = body.get('tenantId', 'unknown')
            action = body.get('action', 'unknown')

            # Log the failed message for analysis
            print(
                f"DLQ Message - Order: {order_id}, Tenant: {tenant_id}, Action: {action}")
            print(f"Full message: {json.dumps(body)}")

            # You could store this in a separate DynamoDB table for admin review
            # or send an alert to operations team

        except Exception as e:
            print(f"Error processing DLQ message: {str(e)}")

    return {'statusCode': 200}
