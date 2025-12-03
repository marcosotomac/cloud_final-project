"""
Step Functions task handlers for automated order workflow
Simplified handlers for: RECEIVED -> COOKING -> PACKING -> DELIVERY -> COMPLETED
"""
import json
from datetime import datetime

from src.utils.dynamodb import get_orders_table, get_item, update_item
from src.utils.websocket import broadcast_order_update
from src.models.order_status import OrderStatus


def sfn_receive_order_handler(event, context):
    """Step Functions task: Mark order as received"""
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
            'SET #status = :status, updatedAt = :now',
            {
                ':status': OrderStatus.RECEIVED.value,
                ':now': now
            },
            {
                '#status': 'status'
            }
        )

        broadcast_order_update(
            tenant_id=tenant_id,
            order_id=order_id,
            status=OrderStatus.RECEIVED.value,
            order_data=order
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
    """Step Functions task: Mark order as cooking"""
    try:
        print(f"SFN Cooking: {json.dumps(event)}")

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

        # Update order status to COOKING
        update_item(
            table,
            {'PK': f'TENANT#{tenant_id}', 'SK': f'ORDER#{order_id}'},
            'SET #status = :status, updatedAt = :now',
            {
                ':status': OrderStatus.COOKING.value,
                ':now': now
            },
            {
                '#status': 'status'
            }
        )

        broadcast_order_update(
            tenant_id=tenant_id,
            order_id=order_id,
            status=OrderStatus.COOKING.value,
            order_data=order
        )

        return {
            'orderId': order_id,
            'tenantId': tenant_id,
            'status': OrderStatus.COOKING.value,
            'cookingStartedAt': now
        }

    except Exception as e:
        print(f"SFN Cooking error: {str(e)}")
        raise


def sfn_pack_order_handler(event, context):
    """Step Functions task: Mark order as packing"""
    try:
        print(f"SFN Packing: {json.dumps(event)}")

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

        # Update order status to PACKING
        update_item(
            table,
            {'PK': f'TENANT#{tenant_id}', 'SK': f'ORDER#{order_id}'},
            'SET #status = :status, updatedAt = :now',
            {
                ':status': OrderStatus.PACKING.value,
                ':now': now
            },
            {
                '#status': 'status'
            }
        )

        broadcast_order_update(
            tenant_id=tenant_id,
            order_id=order_id,
            status=OrderStatus.PACKING.value,
            order_data=order
        )

        return {
            'orderId': order_id,
            'tenantId': tenant_id,
            'status': OrderStatus.PACKING.value,
            'packingStartedAt': now
        }

    except Exception as e:
        print(f"SFN Packing error: {str(e)}")
        raise


def sfn_deliver_order_handler(event, context):
    """Step Functions task: Mark order as ready for delivery"""
    try:
        print(f"SFN Delivery: {json.dumps(event)}")

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

        # Update order status to DELIVERY
        update_item(
            table,
            {'PK': f'TENANT#{tenant_id}', 'SK': f'ORDER#{order_id}'},
            'SET #status = :status, updatedAt = :now',
            {
                ':status': OrderStatus.DELIVERY.value,
                ':now': now
            },
            {
                '#status': 'status'
            }
        )

        broadcast_order_update(
            tenant_id=tenant_id,
            order_id=order_id,
            status=OrderStatus.DELIVERY.value,
            order_data=order
        )

        return {
            'orderId': order_id,
            'tenantId': tenant_id,
            'status': OrderStatus.DELIVERY.value,
            'deliveryStartedAt': now
        }

    except Exception as e:
        print(f"SFN Delivery error: {str(e)}")
        raise


def sfn_complete_order_handler(event, context):
    """Step Functions task: Complete order"""
    try:
        print(f"SFN CompleteOrder: {json.dumps(event)}")

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

        # Update order status to COMPLETED
        update_item(
            table,
            {'PK': f'TENANT#{tenant_id}', 'SK': f'ORDER#{order_id}'},
            'SET #status = :status, updatedAt = :now, completedAt = :now',
            {
                ':status': OrderStatus.COMPLETED.value,
                ':now': now
            },
            {
                '#status': 'status'
            }
        )

        broadcast_order_update(
            tenant_id=tenant_id,
            order_id=order_id,
            status=OrderStatus.COMPLETED.value,
            order_data=order
        )

        return {
            'orderId': order_id,
            'tenantId': tenant_id,
            'status': OrderStatus.COMPLETED.value,
            'completedAt': now
        }

    except Exception as e:
        print(f"SFN CompleteOrder error: {str(e)}")
        raise


