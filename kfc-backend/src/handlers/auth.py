"""
Authentication handlers
"""
import json
import ulid
from datetime import datetime
from boto3.dynamodb.conditions import Key

from src.utils.response import (
    success_response, created_response, error_response,
    unauthorized_response
)
from src.utils.dynamodb import get_users_table, put_item, query_items
from src.utils.auth import hash_password, verify_password, create_token


def register_handler(event, context):
    """Handle user registration"""
    try:
        body = json.loads(event.get('body', '{}'))

        # Validate required fields
        required_fields = ['email', 'password', 'name', 'tenantId']
        for field in required_fields:
            if not body.get(field):
                return error_response(f'Missing required field: {field}')

        email = body['email'].lower().strip()
        password = body['password']
        name = body['name']
        tenant_id = body['tenantId']
        role = body.get('role', 'CUSTOMER')
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
            return error_response('User already exists with this email', 409)

        # Create user
        user_id = str(ulid.new())
        now = datetime.utcnow().isoformat()

        user = {
            'PK': f'TENANT#{tenant_id}',
            'SK': f'USER#{user_id}',
            'GSI1PK': f'TENANT#{tenant_id}',
            'GSI1SK': f'EMAIL#{email}',
            'userId': user_id,
            'tenantId': tenant_id,
            'email': email,
            'passwordHash': hash_password(password),
            'name': name,
            'phone': phone,
            'role': role,
            'status': 'ACTIVE',
            'createdAt': now,
            'updatedAt': now
        }

        put_item(table, user)

        # Create token
        token_payload = {
            'userId': user_id,
            'tenantId': tenant_id,
            'email': email,
            'name': name,
            'role': role
        }
        token = create_token(token_payload)

        # Return user data (without password)
        user_response = {
            'userId': user_id,
            'tenantId': tenant_id,
            'email': email,
            'name': name,
            'phone': phone,
            'role': role,
            'token': token
        }

        return created_response(user_response, 'User registered successfully')

    except json.JSONDecodeError:
        return error_response('Invalid JSON body')
    except Exception as e:
        print(f"Registration error: {str(e)}")
        return error_response(f'Registration failed: {str(e)}', 500)


def login_handler(event, context):
    """Handle user login"""
    try:
        body = json.loads(event.get('body', '{}'))

        # Validate required fields
        required_fields = ['email', 'password', 'tenantId']
        for field in required_fields:
            if not body.get(field):
                return error_response(f'Missing required field: {field}')

        email = body['email'].lower().strip()
        password = body['password']
        tenant_id = body['tenantId']

        table = get_users_table()

        # Find user by email
        users = query_items(
            table,
            Key('GSI1PK').eq(f'TENANT#{tenant_id}') & Key(
                'GSI1SK').eq(f'EMAIL#{email}'),
            index_name='GSI1'
        )

        if not users:
            return unauthorized_response('Invalid email or password')

        user = users[0]

        # Verify password
        if not verify_password(password, user.get('passwordHash', '')):
            return unauthorized_response('Invalid email or password')

        # Check if user is active
        if user.get('status') != 'ACTIVE':
            return error_response('User account is not active', 403)

        # Create token
        token_payload = {
            'userId': user['userId'],
            'tenantId': user['tenantId'],
            'email': user['email'],
            'name': user['name'],
            'role': user['role']
        }
        token = create_token(token_payload)

        # Update last login
        table.update_item(
            Key={'PK': user['PK'], 'SK': user['SK']},
            UpdateExpression='SET lastLogin = :ll',
            ExpressionAttributeValues={':ll': datetime.utcnow().isoformat()}
        )

        # Return user data
        user_response = {
            'userId': user['userId'],
            'tenantId': user['tenantId'],
            'email': user['email'],
            'name': user['name'],
            'phone': user.get('phone', ''),
            'role': user['role'],
            'token': token
        }

        return success_response(user_response, 'Login successful')

    except json.JSONDecodeError:
        return error_response('Invalid JSON body')
    except Exception as e:
        print(f"Login error: {str(e)}")
        return error_response(f'Login failed: {str(e)}', 500)
