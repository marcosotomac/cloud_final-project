"""
Customer-focused handlers for kfc-client-front
"""
import json
import ulid
from datetime import datetime
from boto3.dynamodb.conditions import Key

from src.utils.response import (
    success_response, created_response, error_response, not_found_response
)
from src.utils.dynamodb import get_users_table, get_orders_table, put_item, get_item, query_items, update_item


def get_customer_profile_handler(event, context):
    """Get customer profile"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')
        customer_id = path_params.get('customerId')

        if not tenant_id or not customer_id:
            return error_response('Tenant ID and Customer ID are required')

        table = get_users_table()

        customer = get_item(table, {
            'PK': f'TENANT#{tenant_id}',
            'SK': f'USER#{customer_id}'
        })

        if not customer:
            return not_found_response('Customer not found')

        # Remove sensitive data
        customer.pop('passwordHash', None)
        customer.pop('PK', None)
        customer.pop('SK', None)
        customer.pop('GSI1PK', None)
        customer.pop('GSI1SK', None)

        return success_response(customer)

    except Exception as e:
        print(f"Get customer profile error: {str(e)}")
        return error_response(f'Failed to get profile: {str(e)}', 500)


def update_customer_profile_handler(event, context):
    """Update customer profile"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')
        customer_id = path_params.get('customerId')

        if not tenant_id or not customer_id:
            return error_response('Tenant ID and Customer ID are required')

        body = json.loads(event.get('body', '{}'))

        updatable = ['name', 'phone', 'defaultAddress', 'preferences']
        update_fields = {}

        for field in updatable:
            if field in body:
                update_fields[field] = body[field]

        if not update_fields:
            return error_response('No fields to update')

        update_fields['updatedAt'] = datetime.utcnow().isoformat()

        table = get_users_table()
        update_item(
            table,
            {'PK': f'TENANT#{tenant_id}', 'SK': f'USER#{customer_id}'},
            update_fields
        )

        return success_response({'message': 'Profile updated successfully'})

    except json.JSONDecodeError:
        return error_response('Invalid JSON body')
    except Exception as e:
        print(f"Update customer profile error: {str(e)}")
        return error_response(f'Failed to update profile: {str(e)}', 500)


def get_customer_addresses_handler(event, context):
    """Get customer delivery addresses"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')
        customer_id = path_params.get('customerId')

        if not tenant_id or not customer_id:
            return error_response('Tenant ID and Customer ID are required')

        table = get_orders_table()

        addresses = query_items(
            table,
            Key('PK').eq(f'CUSTOMER#{customer_id}') & Key(
                'SK').begins_with('ADDRESS#')
        )

        for addr in addresses:
            addr.pop('PK', None)
            addr.pop('SK', None)

        return success_response({'addresses': addresses})

    except Exception as e:
        print(f"Get addresses error: {str(e)}")
        return error_response(f'Failed to get addresses: {str(e)}', 500)


def add_customer_address_handler(event, context):
    """Add a delivery address for customer"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')
        customer_id = path_params.get('customerId')

        if not tenant_id or not customer_id:
            return error_response('Tenant ID and Customer ID are required')

        body = json.loads(event.get('body', '{}'))

        required = ['street', 'city', 'label']
        for field in required:
            if not body.get(field):
                return error_response(f'Missing required field: {field}')

        address_id = str(ulid.new())
        now = datetime.utcnow().isoformat()

        address = {
            'PK': f'CUSTOMER#{customer_id}',
            'SK': f'ADDRESS#{address_id}',
            'addressId': address_id,
            'customerId': customer_id,
            'tenantId': tenant_id,
            'label': body['label'],  # Home, Work, etc.
            'street': body['street'],
            'number': body.get('number', ''),
            'apartment': body.get('apartment', ''),
            'city': body['city'],
            'district': body.get('district', ''),
            'zipCode': body.get('zipCode', ''),
            'reference': body.get('reference', ''),
            'latitude': body.get('latitude'),
            'longitude': body.get('longitude'),
            'isDefault': body.get('isDefault', False),
            'createdAt': now
        }

        table = get_orders_table()

        # If this is default, remove default from others
        if address['isDefault']:
            existing = query_items(
                table,
                Key('PK').eq(f'CUSTOMER#{customer_id}') & Key(
                    'SK').begins_with('ADDRESS#')
            )
            for addr in existing:
                if addr.get('isDefault'):
                    update_item(
                        table,
                        {'PK': addr['PK'], 'SK': addr['SK']},
                        {'isDefault': False}
                    )

        put_item(table, address)

        address.pop('PK', None)
        address.pop('SK', None)

        return created_response(address, 'Address added successfully')

    except json.JSONDecodeError:
        return error_response('Invalid JSON body')
    except Exception as e:
        print(f"Add address error: {str(e)}")
        return error_response(f'Failed to add address: {str(e)}', 500)


def get_customer_favorites_handler(event, context):
    """Get customer favorite items"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')
        customer_id = path_params.get('customerId')

        if not tenant_id or not customer_id:
            return error_response('Tenant ID and Customer ID are required')

        table = get_orders_table()

        favorites = query_items(
            table,
            Key('PK').eq(f'CUSTOMER#{customer_id}') & Key(
                'SK').begins_with('FAVORITE#')
        )

        # Get menu item details
        from src.utils.dynamodb import get_menu_table
        menu_table = get_menu_table()

        result = []
        for fav in favorites:
            item_id = fav.get('itemId')
            menu_item = get_item(menu_table, {
                'PK': f'TENANT#{tenant_id}',
                'SK': f'ITEM#{item_id}'
            })

            if menu_item:
                result.append({
                    'favoriteId': fav.get('SK', '').replace('FAVORITE#', ''),
                    'itemId': item_id,
                    'name': menu_item.get('name'),
                    'description': menu_item.get('description'),
                    'price': menu_item.get('price'),
                    'image': menu_item.get('image'),
                    'category': menu_item.get('category'),
                    'addedAt': fav.get('addedAt')
                })

        return success_response({'favorites': result})

    except Exception as e:
        print(f"Get favorites error: {str(e)}")
        return error_response(f'Failed to get favorites: {str(e)}', 500)


def add_favorite_handler(event, context):
    """Add item to favorites"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')
        customer_id = path_params.get('customerId')

        if not tenant_id or not customer_id:
            return error_response('Tenant ID and Customer ID are required')

        body = json.loads(event.get('body', '{}'))
        item_id = body.get('itemId')

        if not item_id:
            return error_response('Item ID is required')

        table = get_orders_table()

        favorite = {
            'PK': f'CUSTOMER#{customer_id}',
            'SK': f'FAVORITE#{item_id}',
            'customerId': customer_id,
            'tenantId': tenant_id,
            'itemId': item_id,
            'addedAt': datetime.utcnow().isoformat()
        }

        put_item(table, favorite)

        return created_response({'itemId': item_id}, 'Added to favorites')

    except json.JSONDecodeError:
        return error_response('Invalid JSON body')
    except Exception as e:
        print(f"Add favorite error: {str(e)}")
        return error_response(f'Failed to add favorite: {str(e)}', 500)


def remove_favorite_handler(event, context):
    """Remove item from favorites"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')
        customer_id = path_params.get('customerId')
        item_id = path_params.get('itemId')

        if not tenant_id or not customer_id or not item_id:
            return error_response('Tenant ID, Customer ID and Item ID are required')

        table = get_orders_table()

        from src.utils.dynamodb import delete_item
        delete_item(table, {
            'PK': f'CUSTOMER#{customer_id}',
            'SK': f'FAVORITE#{item_id}'
        })

        return success_response({'message': 'Removed from favorites'})

    except Exception as e:
        print(f"Remove favorite error: {str(e)}")
        return error_response(f'Failed to remove favorite: {str(e)}', 500)


def track_order_handler(event, context):
    """Track order status in real-time"""
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

        # Get workflow info
        workflow = order.get('workflow', {})
        steps = workflow.get('steps', [])

        # Build tracking info
        from src.models.order_status import WORKFLOW_STEPS, get_status_display_name

        tracking_steps = []
        current_status = order.get('status')

        for ws in WORKFLOW_STEPS:
            step_status = ws['status']

            # Find matching workflow step
            step_data = next(
                (s for s in steps if s.get('status') == step_status),
                None
            )

            step_info = {
                'status': step_status,
                'name': ws['name'],
                'description': ws['description'],
                'icon': ws['icon'],
                'completed': False,
                'current': False,
                'timestamp': None
            }

            if step_data:
                step_info['completed'] = True
                step_info['timestamp'] = step_data.get(
                    'startTime') or step_data.get('endTime')
                step_info['staffName'] = step_data.get('staffName')

            if step_status == current_status:
                step_info['current'] = True

            tracking_steps.append(step_info)

        # Estimated delivery time
        estimated_time = None
        if current_status in ['PENDING', 'RECEIVED', 'COOKING']:
            estimated_time = 25  # minutes
        elif current_status in ['COOKED', 'PACKING', 'PACKED']:
            estimated_time = 15
        elif current_status == 'DELIVERING':
            estimated_time = 10

        return success_response({
            'orderId': order_id,
            'status': current_status,
            'statusDisplay': get_status_display_name(current_status),
            'items': order.get('items', []),
            'total': order.get('total'),
            'deliveryAddress': order.get('deliveryAddress'),
            'trackingSteps': tracking_steps,
            'estimatedMinutes': estimated_time,
            'createdAt': order.get('createdAt'),
            'deliveryPerson': order.get('deliveryPerson')
        })

    except Exception as e:
        print(f"Track order error: {str(e)}")
        return error_response(f'Failed to track order: {str(e)}', 500)


def rate_order_handler(event, context):
    """Rate a completed order"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')
        order_id = path_params.get('orderId')

        if not tenant_id or not order_id:
            return error_response('Tenant ID and Order ID are required')

        body = json.loads(event.get('body', '{}'))

        rating = body.get('rating')
        comment = body.get('comment', '')

        if not rating or rating < 1 or rating > 5:
            return error_response('Rating must be between 1 and 5')

        table = get_orders_table()

        order = get_item(table, {
            'PK': f'TENANT#{tenant_id}',
            'SK': f'ORDER#{order_id}'
        })

        if not order:
            return not_found_response('Order not found')

        if order.get('status') not in ['DELIVERED', 'COMPLETED']:
            return error_response('Can only rate completed orders')

        if order.get('rating'):
            return error_response('Order already rated')

        now = datetime.utcnow().isoformat()

        update_item(
            table,
            {'PK': f'TENANT#{tenant_id}', 'SK': f'ORDER#{order_id}'},
            {
                'rating': rating,
                'ratingComment': comment,
                'ratedAt': now
            }
        )

        return success_response({
            'orderId': order_id,
            'rating': rating,
            'message': 'Thank you for your feedback!'
        })

    except json.JSONDecodeError:
        return error_response('Invalid JSON body')
    except Exception as e:
        print(f"Rate order error: {str(e)}")
        return error_response(f'Failed to rate order: {str(e)}', 500)


def reorder_handler(event, context):
    """Reorder a previous order"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')
        order_id = path_params.get('orderId')

        if not tenant_id or not order_id:
            return error_response('Tenant ID and Order ID are required')

        table = get_orders_table()

        original_order = get_item(table, {
            'PK': f'TENANT#{tenant_id}',
            'SK': f'ORDER#{order_id}'
        })

        if not original_order:
            return not_found_response('Order not found')

        # Create new order with same items
        new_order_id = str(ulid.new())
        now = datetime.utcnow().isoformat()

        new_order = {
            'PK': f'TENANT#{tenant_id}',
            'SK': f'ORDER#{new_order_id}',
            'GSI1PK': f'TENANT#{tenant_id}',
            'GSI1SK': f'STATUS#PENDING#{now}',
            'orderId': new_order_id,
            'tenantId': tenant_id,
            'customerId': original_order.get('customerId'),
            'customerName': original_order.get('customerName'),
            'customerPhone': original_order.get('customerPhone'),
            'items': original_order.get('items', []),
            'subtotal': original_order.get('subtotal'),
            'tax': original_order.get('tax'),
            'deliveryFee': original_order.get('deliveryFee'),
            'total': original_order.get('total'),
            'deliveryAddress': original_order.get('deliveryAddress'),
            'orderType': original_order.get('orderType'),
            'status': 'PENDING',
            'reorderedFrom': order_id,
            'createdAt': now,
            'updatedAt': now
        }

        put_item(table, new_order)

        new_order.pop('PK', None)
        new_order.pop('SK', None)
        new_order.pop('GSI1PK', None)
        new_order.pop('GSI1SK', None)

        return created_response(new_order, 'Order created successfully')

    except Exception as e:
        print(f"Reorder error: {str(e)}")
        return error_response(f'Failed to reorder: {str(e)}', 500)
