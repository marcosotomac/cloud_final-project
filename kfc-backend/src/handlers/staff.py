"""
Staff management handlers
"""
import json
import ulid
from datetime import datetime
from boto3.dynamodb.conditions import Key

from src.utils.response import (
    success_response, created_response, error_response, not_found_response
)
from src.utils.dynamodb import get_users_table, put_item, get_item, query_items
from src.utils.auth import hash_password
from src.models.order_status import UserRole


def get_staff_handler(event, context):
    """Get all staff members for a tenant"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')

        if not tenant_id:
            return error_response('Tenant ID is required')

        query_params = event.get('queryStringParameters') or {}
        role = query_params.get('role')

        table = get_users_table()

        # Query all users for this tenant
        users = query_items(
            table,
            Key('PK').eq(f'TENANT#{tenant_id}') & Key(
                'SK').begins_with('USER#')
        )

        # Filter to staff only (exclude customers)
        staff_roles = [
            UserRole.COOK.value,
            UserRole.DISPATCHER.value,
            UserRole.DELIVERY.value,
            UserRole.MANAGER.value,
            UserRole.ADMIN.value
        ]

        staff = [u for u in users if u.get('role') in staff_roles]

        # Filter by role if specified
        if role and role in staff_roles:
            staff = [s for s in staff if s.get('role') == role]

        # Remove sensitive data
        for member in staff:
            member.pop('passwordHash', None)
            member.pop('PK', None)
            member.pop('SK', None)

        return success_response({
            'staff': staff,
            'count': len(staff)
        })

    except Exception as e:
        print(f"Get staff error: {str(e)}")
        return error_response(f'Failed to get staff: {str(e)}', 500)


def create_staff_handler(event, context):
    """Create a new staff member"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')

        if not tenant_id:
            return error_response('Tenant ID is required')

        body = json.loads(event.get('body', '{}'))

        # Validate required fields
        required_fields = ['email', 'password', 'name', 'role']
        for field in required_fields:
            if not body.get(field):
                return error_response(f'Missing required field: {field}')

        # Validate role
        valid_roles = [
            UserRole.COOK.value,
            UserRole.DISPATCHER.value,
            UserRole.DELIVERY.value,
            UserRole.MANAGER.value,
            UserRole.ADMIN.value
        ]

        if body['role'] not in valid_roles:
            return error_response(f'Invalid role. Valid roles: {", ".join(valid_roles)}')

        email = body['email'].lower().strip()
        password = body['password']
        name = body['name']
        role = body['role']
        phone = body.get('phone', '')

        table = get_users_table()

        # Check if user already exists
        existing_users = query_items(
            table,
            Key('GSI1PK').eq(f'TENANT#{tenant_id}') & Key(
                'GSI1SK').eq(f'EMAIL#{email}'),
            index_name='GSI1'
        )

        if existing_users:
            return error_response('Staff member already exists with this email', 409)

        # Create staff member
        staff_id = str(ulid.new())
        now = datetime.utcnow().isoformat()

        staff = {
            'PK': f'TENANT#{tenant_id}',
            'SK': f'USER#{staff_id}',
            'GSI1PK': f'TENANT#{tenant_id}',
            'GSI1SK': f'EMAIL#{email}',
            'userId': staff_id,
            'tenantId': tenant_id,
            'email': email,
            'passwordHash': hash_password(password),
            'name': name,
            'phone': phone,
            'role': role,
            'status': 'ACTIVE',
            'schedule': body.get('schedule', {}),
            'permissions': body.get('permissions', []),
            'createdAt': now,
            'updatedAt': now
        }

        put_item(table, staff)

        # Return staff data (without password)
        staff_response = {
            'userId': staff_id,
            'tenantId': tenant_id,
            'email': email,
            'name': name,
            'phone': phone,
            'role': role,
            'status': 'ACTIVE',
            'createdAt': now
        }

        return created_response(staff_response, 'Staff member created successfully')

    except json.JSONDecodeError:
        return error_response('Invalid JSON body')
    except Exception as e:
        print(f"Create staff error: {str(e)}")
        return error_response(f'Failed to create staff member: {str(e)}', 500)


def update_staff_handler(event, context):
    """Update a staff member"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')
        staff_id = path_params.get('staffId')

        if not tenant_id or not staff_id:
            return error_response('Tenant ID and Staff ID are required')

        body = json.loads(event.get('body', '{}'))

        table = get_users_table()

        # Check if staff exists
        staff = get_item(table, {
            'PK': f'TENANT#{tenant_id}',
            'SK': f'USER#{staff_id}'
        })

        if not staff:
            return not_found_response('Staff member not found')

        # Build update expression
        update_parts = []
        expression_values = {}
        expression_names = {}

        updatable_fields = ['name', 'phone', 'role',
                            'status', 'schedule', 'permissions']

        for field in updatable_fields:
            if field in body:
                # Validate role if being updated
                if field == 'role':
                    valid_roles = [
                        UserRole.COOK.value,
                        UserRole.DISPATCHER.value,
                        UserRole.DELIVERY.value,
                        UserRole.MANAGER.value,
                        UserRole.ADMIN.value
                    ]
                    if body['role'] not in valid_roles:
                        return error_response(f'Invalid role. Valid roles: {", ".join(valid_roles)}')

                update_parts.append(f'#{field} = :{field}')
                expression_values[f':{field}'] = body[field]
                expression_names[f'#{field}'] = field

        # Handle password update separately
        if 'password' in body and body['password']:
            update_parts.append('#passwordHash = :passwordHash')
            expression_values[':passwordHash'] = hash_password(
                body['password'])
            expression_names['#passwordHash'] = 'passwordHash'

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
                'SK': f'USER#{staff_id}'
            },
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values,
            ExpressionAttributeNames=expression_names,
            ReturnValues='ALL_NEW'
        )

        # Remove sensitive data
        result = response.get('Attributes', {})
        result.pop('passwordHash', None)
        result.pop('PK', None)
        result.pop('SK', None)

        return success_response(result, 'Staff member updated successfully')

    except json.JSONDecodeError:
        return error_response('Invalid JSON body')
    except Exception as e:
        print(f"Update staff error: {str(e)}")
        return error_response(f'Failed to update staff member: {str(e)}', 500)


def get_staff_member_handler(event, context):
    """Get a specific staff member by ID"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')
        staff_id = path_params.get('staffId')

        if not tenant_id or not staff_id:
            return error_response('Tenant ID and Staff ID are required')

        table = get_users_table()

        staff = get_item(table, {
            'PK': f'TENANT#{tenant_id}',
            'SK': f'USER#{staff_id}'
        })

        if not staff:
            return not_found_response('Staff member not found')

        # Check if it's a staff member (not a customer)
        staff_roles = [
            UserRole.COOK.value,
            UserRole.DISPATCHER.value,
            UserRole.DELIVERY.value,
            UserRole.MANAGER.value,
            UserRole.ADMIN.value
        ]

        if staff.get('role') not in staff_roles:
            return not_found_response('Staff member not found')

        # Remove sensitive data
        staff.pop('passwordHash', None)
        staff.pop('PK', None)
        staff.pop('SK', None)

        return success_response(staff)

    except Exception as e:
        print(f"Get staff member error: {str(e)}")
        return error_response(f'Failed to get staff member: {str(e)}', 500)
