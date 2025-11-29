"""
Promotions and discounts handlers
"""
import json
import ulid
from datetime import datetime
from boto3.dynamodb.conditions import Key

from src.utils.response import (
    success_response, created_response, error_response, not_found_response
)
from src.utils.dynamodb import get_orders_table, put_item, get_item, query_items, update_item, delete_item


def get_promotions_handler(event, context):
    """Get all active promotions for a tenant"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')

        if not tenant_id:
            return error_response('Tenant ID is required')

        query_params = event.get('queryStringParameters') or {}
        include_inactive = query_params.get(
            'includeInactive', 'false').lower() == 'true'

        table = get_orders_table()

        promotions = query_items(
            table,
            Key('PK').eq(f'TENANT#{tenant_id}') & Key(
                'SK').begins_with('PROMO#')
        )

        now = datetime.utcnow()

        # Filter and enrich promotions
        result = []
        for promo in promotions:
            # Check if active
            start_date = promo.get('startDate', '')
            end_date = promo.get('endDate', '')
            is_active = promo.get('isActive', True)

            try:
                start = datetime.fromisoformat(
                    start_date.replace('Z', '+00:00'))
                end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                currently_valid = start.replace(
                    tzinfo=None) <= now <= end.replace(tzinfo=None)
            except:
                currently_valid = False

            promo['currentlyValid'] = currently_valid and is_active

            if include_inactive or promo['currentlyValid']:
                promo.pop('PK', None)
                promo.pop('SK', None)
                result.append(promo)

        return success_response({
            'promotions': result,
            'activeCount': len([p for p in result if p['currentlyValid']])
        })

    except Exception as e:
        print(f"Get promotions error: {str(e)}")
        return error_response(f'Failed to get promotions: {str(e)}', 500)


def create_promotion_handler(event, context):
    """Create a new promotion"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')

        if not tenant_id:
            return error_response('Tenant ID is required')

        body = json.loads(event.get('body', '{}'))

        required_fields = ['name', 'discountType',
                           'discountValue', 'startDate', 'endDate']
        for field in required_fields:
            if field not in body:
                return error_response(f'Missing required field: {field}')

        # Validate discount type
        valid_types = ['percentage', 'fixed', 'buyXgetY', 'freeItem']
        if body['discountType'] not in valid_types:
            return error_response(f'Invalid discount type. Valid: {", ".join(valid_types)}')

        promo_id = str(ulid.new())
        now = datetime.utcnow().isoformat()

        promo = {
            'PK': f'TENANT#{tenant_id}',
            'SK': f'PROMO#{promo_id}',
            'promoId': promo_id,
            'tenantId': tenant_id,
            'name': body['name'],
            'description': body.get('description', ''),
            'code': body.get('code', '').upper(),  # Optional promo code
            'discountType': body['discountType'],
            'discountValue': body['discountValue'],
            'minOrderAmount': body.get('minOrderAmount', 0),
            # Cap for percentage discounts
            'maxDiscount': body.get('maxDiscount'),
            # Empty = all items
            'applicableItems': body.get('applicableItems', []),
            'applicableCategories': body.get('applicableCategories', []),
            'startDate': body['startDate'],
            'endDate': body['endDate'],
            'usageLimit': body.get('usageLimit'),  # None = unlimited
            'usageCount': 0,
            'perCustomerLimit': body.get('perCustomerLimit', 1),
            'isActive': body.get('isActive', True),
            'image': body.get('image', ''),
            'terms': body.get('terms', ''),
            'createdAt': now,
            'updatedAt': now
        }

        # For buyXgetY type
        if body['discountType'] == 'buyXgetY':
            promo['buyQuantity'] = body.get('buyQuantity', 2)
            promo['getQuantity'] = body.get('getQuantity', 1)
            promo['getItemId'] = body.get('getItemId')  # Free item

        # For freeItem type
        if body['discountType'] == 'freeItem':
            promo['freeItemId'] = body.get('freeItemId')

        table = get_orders_table()
        put_item(table, promo)

        promo.pop('PK', None)
        promo.pop('SK', None)

        return created_response(promo, 'Promotion created successfully')

    except json.JSONDecodeError:
        return error_response('Invalid JSON body')
    except Exception as e:
        print(f"Create promotion error: {str(e)}")
        return error_response(f'Failed to create promotion: {str(e)}', 500)


def update_promotion_handler(event, context):
    """Update a promotion"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')
        promo_id = path_params.get('promoId')

        if not tenant_id or not promo_id:
            return error_response('Tenant ID and Promo ID are required')

        body = json.loads(event.get('body', '{}'))

        table = get_orders_table()

        updatable = ['name', 'description', 'code', 'discountType', 'discountValue',
                     'minOrderAmount', 'maxDiscount', 'applicableItems', 'applicableCategories',
                     'startDate', 'endDate', 'usageLimit', 'perCustomerLimit', 'isActive',
                     'image', 'terms', 'buyQuantity', 'getQuantity', 'getItemId', 'freeItemId']

        update_fields = {}
        for field in updatable:
            if field in body:
                update_fields[field] = body[field]

        if not update_fields:
            return error_response('No fields to update')

        update_fields['updatedAt'] = datetime.utcnow().isoformat()

        update_item(
            table,
            {'PK': f'TENANT#{tenant_id}', 'SK': f'PROMO#{promo_id}'},
            update_fields
        )

        return success_response({'message': 'Promotion updated successfully'})

    except json.JSONDecodeError:
        return error_response('Invalid JSON body')
    except Exception as e:
        print(f"Update promotion error: {str(e)}")
        return error_response(f'Failed to update promotion: {str(e)}', 500)


def delete_promotion_handler(event, context):
    """Delete a promotion"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')
        promo_id = path_params.get('promoId')

        if not tenant_id or not promo_id:
            return error_response('Tenant ID and Promo ID are required')

        table = get_orders_table()
        delete_item(table, {'PK': f'TENANT#{tenant_id}',
                    'SK': f'PROMO#{promo_id}'})

        return success_response({'message': 'Promotion deleted successfully'})

    except Exception as e:
        print(f"Delete promotion error: {str(e)}")
        return error_response(f'Failed to delete promotion: {str(e)}', 500)


def validate_promo_code_handler(event, context):
    """Validate a promo code for a customer order"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')

        if not tenant_id:
            return error_response('Tenant ID is required')

        body = json.loads(event.get('body', '{}'))

        code = body.get('code', '').upper().strip()
        order_total = body.get('orderTotal', 0)
        items = body.get('items', [])
        customer_id = body.get('customerId')

        if not code:
            return error_response('Promo code is required')

        table = get_orders_table()

        # Find promo by code
        promotions = query_items(
            table,
            Key('PK').eq(f'TENANT#{tenant_id}') & Key(
                'SK').begins_with('PROMO#')
        )

        promo = None
        for p in promotions:
            if p.get('code', '').upper() == code:
                promo = p
                break

        if not promo:
            return error_response('Invalid promo code', 400)

        now = datetime.utcnow()

        # Validate dates
        try:
            start = datetime.fromisoformat(
                promo['startDate'].replace('Z', '+00:00'))
            end = datetime.fromisoformat(
                promo['endDate'].replace('Z', '+00:00'))
            if not (start.replace(tzinfo=None) <= now <= end.replace(tzinfo=None)):
                return error_response('Promo code has expired or not yet active', 400)
        except:
            return error_response('Invalid promotion dates', 400)

        # Check if active
        if not promo.get('isActive', True):
            return error_response('Promo code is not active', 400)

        # Check usage limit
        if promo.get('usageLimit') and promo.get('usageCount', 0) >= promo['usageLimit']:
            return error_response('Promo code usage limit reached', 400)

        # Check minimum order amount
        if order_total < promo.get('minOrderAmount', 0):
            return error_response(
                f'Minimum order amount is S/{promo["minOrderAmount"]:.2f}', 400
            )

        # Check per customer limit (would need to check order history)
        # Simplified for now

        # Calculate discount
        discount_type = promo['discountType']
        discount_value = promo['discountValue']

        if discount_type == 'percentage':
            discount = order_total * (discount_value / 100)
            if promo.get('maxDiscount'):
                discount = min(discount, promo['maxDiscount'])
        elif discount_type == 'fixed':
            discount = min(discount_value, order_total)
        else:
            discount = 0

        return success_response({
            'valid': True,
            'promoId': promo['promoId'],
            'name': promo['name'],
            'description': promo.get('description', ''),
            'discountType': discount_type,
            'discountValue': discount_value,
            'calculatedDiscount': round(discount, 2),
            'newTotal': round(order_total - discount, 2)
        })

    except json.JSONDecodeError:
        return error_response('Invalid JSON body')
    except Exception as e:
        print(f"Validate promo code error: {str(e)}")
        return error_response(f'Failed to validate promo code: {str(e)}', 500)
