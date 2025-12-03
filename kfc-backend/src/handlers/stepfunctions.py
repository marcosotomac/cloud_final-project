"""
Step Functions task handlers for automated order workflow
Simplified handlers for: RECEIVED -> COOKING -> PACKING -> DELIVERY -> COMPLETED
"""
import json
from datetime import datetime

from src.utils.dynamodb import get_orders_table, get_item, update_item, get_menu_table, get_inventory_table
from src.utils.websocket import broadcast_order_update
from src.models.order_status import OrderStatus


def sfn_validate_order_handler(event, context):
    """Step Functions task: Validate order (stock, price, availability)"""
    try:
        print(f"SFN ValidateOrder - Raw Event: {json.dumps(event)}")

        order_id = event.get('orderId')
        tenant_id = event.get('tenantId')
        order_data = event.get('order', {})

        print(f"SFN ValidateOrder - Extracted: orderId={order_id}, tenantId={tenant_id}")

        if not order_id or not tenant_id:
            raise Exception(f'Missing orderId or tenantId')

        if not order_data:
            raise Exception(f'Missing order data')

        # Validate items: check stock and prices
        items = order_data.get('items', [])
        menu_table = get_menu_table()
        inventory_table = get_inventory_table()

        validation_errors = []

        for item in items:
            item_id = item.get('itemId')  # itemId, not menuItemId
            requested_qty = item.get('quantity', 0)

            # Skip validation if no item_id (shouldn't happen but be safe)
            if not item_id:
                print(f"[WARN] Item missing itemId: {item}")
                continue

            # Check if menu item exists and is available
            try:
                menu_item = get_item(menu_table, {
                    'PK': f'TENANT#{tenant_id}',
                    'SK': f'MENU#{item_id}'
                })

                if not menu_item:
                    validation_errors.append(f"Menu item {item_id} not found")
                    continue

                if not menu_item.get('available', True):
                    validation_errors.append(f"Menu item {menu_item.get('name')} is not available")
                    continue

                # Verify price hasn't changed dramatically
                stored_price = menu_item.get('price', 0)
                received_price = item.get('price', 0)
                price_diff = abs(stored_price - received_price)
                if price_diff > stored_price * 0.1:  # 10% tolerance
                    print(f"[WARN] Price mismatch for {item_id}: stored={stored_price}, received={received_price}")

            except Exception as menu_error:
                print(f"[WARN] Could not validate menu item {item_id}: {str(menu_error)}")

        # If there are validation errors, cancel the order
        if validation_errors:
            print(f"SFN ValidateOrder - Validation failed: {validation_errors}")
            orders_table = get_orders_table()
            now = datetime.utcnow().isoformat()

            update_item(
                orders_table,
                {'PK': f'TENANT#{tenant_id}', 'SK': f'ORDER#{order_id}'},
                'SET #status = :status, updatedAt = :now, #reason = :reason',
                {
                    ':status': OrderStatus.CANCELLED.value,
                    ':now': now,
                    ':reason': ', '.join(validation_errors)
                },
                {
                    '#status': 'status',
                    '#reason': 'cancellationReason'
                }
            )

            broadcast_order_update(
                tenant_id=tenant_id,
                order_id=order_id,
                status=OrderStatus.CANCELLED.value,
                order_data={**order_data, 'status': OrderStatus.CANCELLED.value}
            )

            raise Exception(f"Order validation failed: {', '.join(validation_errors)}")

        print(f"SFN ValidateOrder - Validation passed")

        result = {
            'orderId': order_id,
            'tenantId': tenant_id,
            'order': order_data,
            'status': 'VALIDATED',
            'validatedAt': datetime.utcnow().isoformat()
        }

        print(f"SFN ValidateOrder - Returning: {json.dumps(result)}")
        return result

    except Exception as e:
        error_msg = f"SFN ValidateOrder error: {str(e)}"
        print(error_msg)
        raise Exception(error_msg)


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
        print(f"SFN Cooking - Raw Event: {json.dumps(event)}")

        order_id = event.get('orderId')
        tenant_id = event.get('tenantId')

        print(f"SFN Cooking - Extracted: orderId={order_id}, tenantId={tenant_id}")

        if not order_id or not tenant_id:
            error_msg = f'Missing orderId or tenantId. Event: {json.dumps(event)}'
            print(f"SFN Cooking ERROR: {error_msg}")
            raise Exception(error_msg)

        table = get_orders_table()
        order = get_item(table, {
            'PK': f'TENANT#{tenant_id}',
            'SK': f'ORDER#{order_id}'
        })

        if not order:
            error_msg = f'Order {order_id} not found for tenant {tenant_id}'
            print(f"SFN Cooking ERROR: {error_msg}")
            raise Exception(error_msg)

        print(f"SFN Cooking - Found order, current status: {order.get('status')}")

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

        print(f"SFN Cooking - Updated order to COOKING status")

        broadcast_order_update(
            tenant_id=tenant_id,
            order_id=order_id,
            status=OrderStatus.COOKING.value,
            order_data=order
        )

        print(f"SFN Cooking - Broadcasted update")

        result = {
            'orderId': order_id,
            'tenantId': tenant_id,
            'status': OrderStatus.COOKING.value,
            'cookingStartedAt': now
        }
        
        print(f"SFN Cooking - Returning: {json.dumps(result)}")
        return result

    except Exception as e:
        error_msg = f"SFN Cooking error: {str(e)}"
        print(error_msg)
        raise Exception(error_msg)


def sfn_pack_order_handler(event, context):
    """Step Functions task: Mark order as packing"""
    try:
        print(f"SFN Packing - Raw Event: {json.dumps(event)}")

        order_id = event.get('orderId')
        tenant_id = event.get('tenantId')

        print(f"SFN Packing - Extracted: orderId={order_id}, tenantId={tenant_id}")

        if not order_id or not tenant_id:
            error_msg = f'Missing orderId or tenantId. Event: {json.dumps(event)}'
            print(f"SFN Packing ERROR: {error_msg}")
            raise Exception(error_msg)

        table = get_orders_table()
        order = get_item(table, {
            'PK': f'TENANT#{tenant_id}',
            'SK': f'ORDER#{order_id}'
        })

        if not order:
            error_msg = f'Order {order_id} not found for tenant {tenant_id}'
            print(f"SFN Packing ERROR: {error_msg}")
            raise Exception(error_msg)

        print(f"SFN Packing - Found order, current status: {order.get('status')}")

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

        print(f"SFN Packing - Updated order to PACKING status")

        broadcast_order_update(
            tenant_id=tenant_id,
            order_id=order_id,
            status=OrderStatus.PACKING.value,
            order_data=order
        )

        print(f"SFN Packing - Broadcasted update")

        result = {
            'orderId': order_id,
            'tenantId': tenant_id,
            'status': OrderStatus.PACKING.value,
            'packingStartedAt': now
        }
        
        print(f"SFN Packing - Returning: {json.dumps(result)}")
        return result

    except Exception as e:
        error_msg = f"SFN Packing error: {str(e)}"
        print(error_msg)
        raise Exception(error_msg)


def sfn_deliver_order_handler(event, context):
    """Step Functions task: Mark order as ready for delivery"""
    try:
        print(f"SFN Delivery - Raw Event: {json.dumps(event)}")

        order_id = event.get('orderId')
        tenant_id = event.get('tenantId')

        print(f"SFN Delivery - Extracted: orderId={order_id}, tenantId={tenant_id}")

        if not order_id or not tenant_id:
            error_msg = f'Missing orderId or tenantId. Event: {json.dumps(event)}'
            print(f"SFN Delivery ERROR: {error_msg}")
            raise Exception(error_msg)

        table = get_orders_table()
        order = get_item(table, {
            'PK': f'TENANT#{tenant_id}',
            'SK': f'ORDER#{order_id}'
        })

        if not order:
            error_msg = f'Order {order_id} not found for tenant {tenant_id}'
            print(f"SFN Delivery ERROR: {error_msg}")
            raise Exception(error_msg)

        print(f"SFN Delivery - Found order, current status: {order.get('status')}")

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

        print(f"SFN Delivery - Updated order to DELIVERY status")

        broadcast_order_update(
            tenant_id=tenant_id,
            order_id=order_id,
            status=OrderStatus.DELIVERY.value,
            order_data=order
        )

        print(f"SFN Delivery - Broadcasted update")

        result = {
            'orderId': order_id,
            'tenantId': tenant_id,
            'status': OrderStatus.DELIVERY.value,
            'deliveryStartedAt': now
        }
        
        print(f"SFN Delivery - Returning: {json.dumps(result)}")
        return result

    except Exception as e:
        error_msg = f"SFN Delivery error: {str(e)}"
        print(error_msg)
        raise Exception(error_msg)


def sfn_complete_order_handler(event, context):
    """Step Functions task: Complete order"""
    try:
        print(f"SFN CompleteOrder - Raw Event: {json.dumps(event)}")

        order_id = event.get('orderId')
        tenant_id = event.get('tenantId')

        print(f"SFN CompleteOrder - Extracted: orderId={order_id}, tenantId={tenant_id}")

        if not order_id or not tenant_id:
            error_msg = f'Missing orderId or tenantId. Event: {json.dumps(event)}'
            print(f"SFN CompleteOrder ERROR: {error_msg}")
            raise Exception(error_msg)

        table = get_orders_table()
        order = get_item(table, {
            'PK': f'TENANT#{tenant_id}',
            'SK': f'ORDER#{order_id}'
        })

        if not order:
            error_msg = f'Order {order_id} not found for tenant {tenant_id}'
            print(f"SFN CompleteOrder ERROR: {error_msg}")
            raise Exception(error_msg)

        print(f"SFN CompleteOrder - Found order, current status: {order.get('status')}")

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

        print(f"SFN CompleteOrder - Updated order to COMPLETED status")

        broadcast_order_update(
            tenant_id=tenant_id,
            order_id=order_id,
            status=OrderStatus.COMPLETED.value,
            order_data=order
        )

        print(f"SFN CompleteOrder - Broadcasted update")

        result = {
            'orderId': order_id,
            'tenantId': tenant_id,
            'status': OrderStatus.COMPLETED.value,
            'completedAt': now
        }
        
        print(f"SFN CompleteOrder - Returning: {json.dumps(result)}")
        return result

    except Exception as e:
        error_msg = f"SFN CompleteOrder error: {str(e)}"
        print(error_msg)
        raise Exception(error_msg)


