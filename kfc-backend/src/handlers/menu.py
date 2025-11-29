"""
Menu management handlers
"""
import json
import ulid
from datetime import datetime
from boto3.dynamodb.conditions import Key

from src.utils.response import (
    success_response, created_response, error_response, not_found_response
)
from src.utils.dynamodb import get_menu_table, put_item, get_item, query_items, delete_item


def create_menu_item_handler(event, context):
    """Create a new menu item"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')

        if not tenant_id:
            return error_response('Tenant ID is required')

        body = json.loads(event.get('body', '{}'))

        # Validate required fields
        required_fields = ['name', 'price', 'category']
        for field in required_fields:
            if not body.get(field):
                return error_response(f'Missing required field: {field}')

        table = get_menu_table()

        item_id = str(ulid.new())
        now = datetime.utcnow().isoformat()

        menu_item = {
            'PK': f'TENANT#{tenant_id}',
            'SK': f'ITEM#{item_id}',
            'itemId': item_id,
            'tenantId': tenant_id,
            'name': body['name'],
            'description': body.get('description', ''),
            'price': float(body['price']),
            'category': body['category'],
            'image': body.get('image', ''),
            'ingredients': body.get('ingredients', []),
            'nutritionalInfo': body.get('nutritionalInfo', {}),
            'preparationTime': body.get('preparationTime', 15),
            'isAvailable': body.get('isAvailable', True),
            'isFeatured': body.get('isFeatured', False),
            'tags': body.get('tags', []),
            'stock': body.get('stock', -1),  # -1 means unlimited
            'createdAt': now,
            'updatedAt': now
        }

        put_item(table, menu_item)

        return created_response(menu_item, 'Menu item created successfully')

    except json.JSONDecodeError:
        return error_response('Invalid JSON body')
    except Exception as e:
        print(f"Create menu item error: {str(e)}")
        return error_response(f'Failed to create menu item: {str(e)}', 500)


def get_menu_handler(event, context):
    """Get all menu items for a tenant"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')

        if not tenant_id:
            return error_response('Tenant ID is required')

        query_params = event.get('queryStringParameters') or {}
        category = query_params.get('category')
        available_only = query_params.get(
            'availableOnly', 'true').lower() == 'true'

        table = get_menu_table()

        # Query all items for this tenant
        items = query_items(
            table,
            Key('PK').eq(f'TENANT#{tenant_id}') & Key(
                'SK').begins_with('ITEM#')
        )

        # Filter by category if specified
        if category:
            items = [item for item in items if item.get(
                'category') == category]

        # Filter by availability
        if available_only:
            items = [item for item in items if item.get('isAvailable', True)]

        # Group by category
        categories = {}
        for item in items:
            cat = item.get('category', 'Other')
            if cat not in categories:
                categories[cat] = []
            categories[cat].append(item)

        response_data = {
            'items': items,
            'categories': categories,
            'totalItems': len(items)
        }

        return success_response(response_data)

    except Exception as e:
        print(f"Get menu error: {str(e)}")
        return error_response(f'Failed to get menu: {str(e)}', 500)


def get_menu_item_handler(event, context):
    """Get a specific menu item"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')
        item_id = path_params.get('itemId')

        if not tenant_id or not item_id:
            return error_response('Tenant ID and Item ID are required')

        table = get_menu_table()

        item = get_item(table, {
            'PK': f'TENANT#{tenant_id}',
            'SK': f'ITEM#{item_id}'
        })

        if not item:
            return not_found_response('Menu item not found')

        return success_response(item)

    except Exception as e:
        print(f"Get menu item error: {str(e)}")
        return error_response(f'Failed to get menu item: {str(e)}', 500)


def update_menu_item_handler(event, context):
    """Update a menu item"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')
        item_id = path_params.get('itemId')

        if not tenant_id or not item_id:
            return error_response('Tenant ID and Item ID are required')

        body = json.loads(event.get('body', '{}'))

        table = get_menu_table()

        # Check if item exists
        existing_item = get_item(table, {
            'PK': f'TENANT#{tenant_id}',
            'SK': f'ITEM#{item_id}'
        })

        if not existing_item:
            return not_found_response('Menu item not found')

        # Build update expression
        update_parts = []
        expression_values = {}
        expression_names = {}

        updatable_fields = [
            'name', 'description', 'price', 'category', 'image',
            'ingredients', 'nutritionalInfo', 'preparationTime',
            'isAvailable', 'isFeatured', 'tags', 'stock'
        ]

        for field in updatable_fields:
            if field in body:
                update_parts.append(f'#{field} = :{field}')
                value = body[field]
                if field == 'price':
                    value = float(value)
                expression_values[f':{field}'] = value
                expression_names[f'#{field}'] = field

        if not update_parts:
            return error_response('No fields to update')

        # Add updatedAt
        update_parts.append('#updatedAt = :updatedAt')
        expression_values[':updatedAt'] = datetime.utcnow().isoformat()
        expression_names['#updatedAt'] = 'updatedAt'

        update_expression = 'SET ' + ', '.join(update_parts)

        response = table.update_item(
            Key={
                'PK': f'TENANT#{tenant_id}',
                'SK': f'ITEM#{item_id}'
            },
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values,
            ExpressionAttributeNames=expression_names,
            ReturnValues='ALL_NEW'
        )

        return success_response(response.get('Attributes'), 'Menu item updated successfully')

    except json.JSONDecodeError:
        return error_response('Invalid JSON body')
    except Exception as e:
        print(f"Update menu item error: {str(e)}")
        return error_response(f'Failed to update menu item: {str(e)}', 500)


def delete_menu_item_handler(event, context):
    """Delete a menu item"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')
        item_id = path_params.get('itemId')

        if not tenant_id or not item_id:
            return error_response('Tenant ID and Item ID are required')

        table = get_menu_table()

        # Check if item exists
        existing_item = get_item(table, {
            'PK': f'TENANT#{tenant_id}',
            'SK': f'ITEM#{item_id}'
        })

        if not existing_item:
            return not_found_response('Menu item not found')

        delete_item(table, {
            'PK': f'TENANT#{tenant_id}',
            'SK': f'ITEM#{item_id}'
        })

        return success_response(None, 'Menu item deleted successfully')

    except Exception as e:
        print(f"Delete menu item error: {str(e)}")
        return error_response(f'Failed to delete menu item: {str(e)}', 500)
