"""
Tenant management handlers
"""
import json
import ulid
from datetime import datetime

from src.utils.response import (
    success_response, created_response, error_response, not_found_response
)
from src.utils.dynamodb import get_tenants_table, put_item, get_item, scan_items


def create_tenant_handler(event, context):
    """Create a new tenant (restaurant)"""
    try:
        body = json.loads(event.get('body', '{}'))

        # Validate required fields
        required_fields = ['name', 'address']
        for field in required_fields:
            if not body.get(field):
                return error_response(f'Missing required field: {field}')

        table = get_tenants_table()

        tenant_id = str(ulid.new())
        now = datetime.utcnow().isoformat()

        tenant = {
            'tenantId': tenant_id,
            'name': body['name'],
            'address': body['address'],
            'phone': body.get('phone', ''),
            'email': body.get('email', ''),
            'logo': body.get('logo', ''),
            'description': body.get('description', ''),
            'settings': body.get('settings', {
                'currency': 'PEN',
                'timezone': 'America/Lima',
                'orderPrefix': 'KFC',
                'autoAcceptOrders': False,
                'notificationsEnabled': True
            }),
            'status': 'ACTIVE',
            'createdAt': now,
            'updatedAt': now
        }

        put_item(table, tenant)

        return created_response(tenant, 'Tenant created successfully')

    except json.JSONDecodeError:
        return error_response('Invalid JSON body')
    except Exception as e:
        print(f"Create tenant error: {str(e)}")
        return error_response(f'Failed to create tenant: {str(e)}', 500)


def get_tenants_handler(event, context):
    """Get all tenants"""
    try:
        table = get_tenants_table()

        tenants = scan_items(table)

        # Filter out inactive tenants (optional based on query params)
        query_params = event.get('queryStringParameters') or {}
        include_inactive = query_params.get(
            'includeInactive', 'false').lower() == 'true'

        if not include_inactive:
            tenants = [t for t in tenants if t.get('status') == 'ACTIVE']

        return success_response(tenants)

    except Exception as e:
        print(f"Get tenants error: {str(e)}")
        return error_response(f'Failed to get tenants: {str(e)}', 500)


def get_tenant_handler(event, context):
    """Get a specific tenant by ID"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')

        if not tenant_id:
            return error_response('Tenant ID is required')

        table = get_tenants_table()

        tenant = get_item(table, {'tenantId': tenant_id})

        if not tenant:
            return not_found_response('Tenant not found')

        return success_response(tenant)

    except Exception as e:
        print(f"Get tenant error: {str(e)}")
        return error_response(f'Failed to get tenant: {str(e)}', 500)


def update_tenant_handler(event, context):
    """Update a tenant"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')

        if not tenant_id:
            return error_response('Tenant ID is required')

        body = json.loads(event.get('body', '{}'))

        table = get_tenants_table()

        # Check if tenant exists
        tenant = get_item(table, {'tenantId': tenant_id})
        if not tenant:
            return not_found_response('Tenant not found')

        # Build update expression
        update_parts = []
        expression_values = {}
        expression_names = {}

        updatable_fields = ['name', 'address', 'phone',
                            'email', 'logo', 'description', 'settings', 'status']

        for field in updatable_fields:
            if field in body:
                update_parts.append(f'#{field} = :{field}')
                expression_values[f':{field}'] = body[field]
                expression_names[f'#{field}'] = field

        if not update_parts:
            return error_response('No fields to update')

        # Add updatedAt
        update_parts.append('#updatedAt = :updatedAt')
        expression_values[':updatedAt'] = datetime.utcnow().isoformat()
        expression_names['#updatedAt'] = 'updatedAt'

        update_expression = 'SET ' + ', '.join(update_parts)

        response = table.update_item(
            Key={'tenantId': tenant_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values,
            ExpressionAttributeNames=expression_names,
            ReturnValues='ALL_NEW'
        )

        return success_response(response.get('Attributes'), 'Tenant updated successfully')

    except json.JSONDecodeError:
        return error_response('Invalid JSON body')
    except Exception as e:
        print(f"Update tenant error: {str(e)}")
        return error_response(f'Failed to update tenant: {str(e)}', 500)
