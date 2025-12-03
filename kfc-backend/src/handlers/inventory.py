"""
Inventory management handlers for KFC Operations
"""
import json
import ulid
from datetime import datetime
from boto3.dynamodb.conditions import Key

from src.utils.response import (
    success_response, created_response, error_response, not_found_response
)
from src.utils.dynamodb import get_orders_table, put_item, get_item, query_items, update_item, delete_item


def get_inventory_table():
    """Get the inventory table (using Orders table with INVENTORY# prefix)"""
    return get_orders_table()


def get_inventory_handler(event, context):
    """Get all inventory items for a tenant"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')

        if not tenant_id:
            return error_response('Tenant ID is required')

        query_params = event.get('queryStringParameters') or {}
        status = query_params.get('status')  # all, low, critical
        category = query_params.get('category')

        table = get_inventory_table()

        items = query_items(
            table,
            Key('PK').eq(f'TENANT#{tenant_id}') & Key(
                'SK').begins_with('INVENTORY#')
        )

        # Filter by status
        if status == 'low':
            items = [i for i in items if i.get(
                'quantity', 0) <= i.get('minQuantity', 0)]
        elif status == 'critical':
            items = [i for i in items if i.get(
                'quantity', 0) <= i.get('criticalQuantity', 0)]

        # Filter by category
        if category:
            items = [i for i in items if i.get(
                'category', '').lower() == category.lower()]

        # Calculate status for each item
        for item in items:
            quantity = item.get('quantity', 0)
            min_qty = item.get('minQuantity', 0)
            critical_qty = item.get('criticalQuantity', 0)

            if quantity <= critical_qty:
                item['status'] = 'critical'
            elif quantity <= min_qty:
                item['status'] = 'low'
            else:
                item['status'] = 'good'

            # Clean DynamoDB keys
            item.pop('PK', None)
            item.pop('SK', None)

        # Summary stats
        total_items = len(items)
        critical_count = len(
            [i for i in items if i.get('status') == 'critical'])
        low_count = len([i for i in items if i.get('status') == 'low'])

        return success_response({
            'items': items,
            'summary': {
                'totalItems': total_items,
                'criticalCount': critical_count,
                'lowCount': low_count,
                'goodCount': total_items - critical_count - low_count
            }
        })

    except Exception as e:
        print(f"Get inventory error: {str(e)}")
        return error_response(f'Failed to get inventory: {str(e)}', 500)


def create_inventory_item_handler(event, context):
    """Create a new inventory item"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')

        if not tenant_id:
            return error_response('Tenant ID is required')

        body = json.loads(event.get('body', '{}'))

        # Validate required fields
        required_fields = ['name', 'unit', 'quantity']
        for field in required_fields:
            if field not in body:
                return error_response(f'Missing required field: {field}')

        item_id = str(ulid.new())
        now = datetime.utcnow().isoformat()

        # If minQuantity/maxQuantity not provided, use defaults based on quantity
        quantity = body['quantity']
        min_quantity = body.get('minQuantity', max(1, int(quantity * 0.2)))  # 20% of quantity
        max_quantity = body.get('maxQuantity', int(quantity * 1.5))  # 150% of quantity

        item = {
            'PK': f'TENANT#{tenant_id}',
            'SK': f'INVENTORY#{item_id}',
            'itemId': item_id,
            'tenantId': tenant_id,
            'name': body['name'],
            'category': body.get('category', 'general'),
            'unit': body['unit'],
            'quantity': quantity,
            'minQuantity': min_quantity,
            'maxQuantity': max_quantity,
            'criticalQuantity': body.get('criticalQuantity', max(1, min_quantity // 2)),
            'costPerUnit': body.get('costPerUnit', 0),
            'supplier': body.get('supplier', ''),
            'lastRestocked': now,
            'createdAt': now,
            'updatedAt': now
        }

        table = get_inventory_table()
        put_item(table, item)

        item.pop('PK', None)
        item.pop('SK', None)

        return created_response(item, 'Inventory item created successfully')

    except json.JSONDecodeError:
        return error_response('Invalid JSON body')
    except Exception as e:
        print(f"Create inventory item error: {str(e)}")
        return error_response(f'Failed to create inventory item: {str(e)}', 500)


def update_inventory_item_handler(event, context):
    """Update an inventory item"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')
        item_id = path_params.get('itemId')

        if not tenant_id or not item_id:
            return error_response('Tenant ID and Item ID are required')

        body = json.loads(event.get('body', '{}'))

        table = get_inventory_table()

        # Build update expression
        update_fields = {}
        updatable = ['name', 'category', 'unit', 'quantity', 'minQuantity',
                     'maxQuantity', 'criticalQuantity', 'costPerUnit', 'supplier']

        for field in updatable:
            if field in body:
                update_fields[field] = body[field]

        if not update_fields:
            return error_response('No fields to update')

        update_fields['updatedAt'] = datetime.utcnow().isoformat()

        # If quantity is being restocked, update lastRestocked
        if 'quantity' in body:
            existing = get_item(table, {
                'PK': f'TENANT#{tenant_id}',
                'SK': f'INVENTORY#{item_id}'
            })
            if existing and body['quantity'] > existing.get('quantity', 0):
                update_fields['lastRestocked'] = update_fields['updatedAt']

        update_item(
            table,
            {'PK': f'TENANT#{tenant_id}', 'SK': f'INVENTORY#{item_id}'},
            update_fields
        )

        return success_response({'message': 'Inventory item updated successfully'})

    except json.JSONDecodeError:
        return error_response('Invalid JSON body')
    except Exception as e:
        print(f"Update inventory item error: {str(e)}")
        return error_response(f'Failed to update inventory item: {str(e)}', 500)


def adjust_inventory_handler(event, context):
    """Adjust inventory quantity (add/subtract)"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')
        item_id = path_params.get('itemId')

        if not tenant_id or not item_id:
            return error_response('Tenant ID and Item ID are required')

        body = json.loads(event.get('body', '{}'))

        adjustment = body.get('adjustment', 0)
        reason = body.get('reason', 'Manual adjustment')

        if adjustment == 0:
            return error_response('Adjustment amount is required')

        table = get_inventory_table()

        # Get current item
        item = get_item(table, {
            'PK': f'TENANT#{tenant_id}',
            'SK': f'INVENTORY#{item_id}'
        })

        if not item:
            return not_found_response('Inventory item not found')

        current_qty = item.get('quantity', 0)
        new_qty = current_qty + adjustment

        if new_qty < 0:
            return error_response('Cannot reduce quantity below 0')

        now = datetime.utcnow().isoformat()

        update_fields = {
            'quantity': new_qty,
            'updatedAt': now
        }

        # Log the adjustment
        adjustments = item.get('adjustments', [])
        adjustments.append({
            'date': now,
            'previousQty': current_qty,
            'newQty': new_qty,
            'adjustment': adjustment,
            'reason': reason
        })
        # Keep only last 20 adjustments
        update_fields['adjustments'] = adjustments[-20:]

        if adjustment > 0:
            update_fields['lastRestocked'] = now

        update_item(
            table,
            {'PK': f'TENANT#{tenant_id}', 'SK': f'INVENTORY#{item_id}'},
            update_fields
        )

        return success_response({
            'previousQuantity': current_qty,
            'adjustment': adjustment,
            'newQuantity': new_qty,
            'reason': reason
        }, 'Inventory adjusted successfully')

    except json.JSONDecodeError:
        return error_response('Invalid JSON body')
    except Exception as e:
        print(f"Adjust inventory error: {str(e)}")
        return error_response(f'Failed to adjust inventory: {str(e)}', 500)


def get_low_stock_alerts_handler(event, context):
    """Get low stock alerts for a tenant"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')

        if not tenant_id:
            return error_response('Tenant ID is required')

        table = get_inventory_table()

        items = query_items(
            table,
            Key('PK').eq(f'TENANT#{tenant_id}') & Key(
                'SK').begins_with('INVENTORY#')
        )

        alerts = []
        for item in items:
            quantity = item.get('quantity', 0)
            min_qty = item.get('minQuantity', 0)
            critical_qty = item.get('criticalQuantity', 0)

            if quantity <= critical_qty:
                alerts.append({
                    'itemId': item.get('itemId'),
                    'name': item.get('name'),
                    'category': item.get('category'),
                    'currentQuantity': quantity,
                    'minQuantity': min_qty,
                    'criticalQuantity': critical_qty,
                    'unit': item.get('unit'),
                    'severity': 'critical',
                    'message': f'{item.get("name")} está en nivel crítico ({quantity} {item.get("unit")})'
                })
            elif quantity <= min_qty:
                alerts.append({
                    'itemId': item.get('itemId'),
                    'name': item.get('name'),
                    'category': item.get('category'),
                    'currentQuantity': quantity,
                    'minQuantity': min_qty,
                    'criticalQuantity': critical_qty,
                    'unit': item.get('unit'),
                    'severity': 'low',
                    'message': f'{item.get("name")} está bajo el mínimo ({quantity} {item.get("unit")})'
                })

        # Sort by severity (critical first)
        alerts.sort(key=lambda x: 0 if x['severity'] == 'critical' else 1)

        return success_response({
            'alerts': alerts,
            'criticalCount': len([a for a in alerts if a['severity'] == 'critical']),
            'lowCount': len([a for a in alerts if a['severity'] == 'low'])
        })

    except Exception as e:
        print(f"Get low stock alerts error: {str(e)}")
        return error_response(f'Failed to get alerts: {str(e)}', 500)
