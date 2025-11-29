"""
WebSocket handlers for real-time communication
"""
import json
from datetime import datetime
from src.utils.response import create_response
from src.utils.websocket import save_connection, cleanup_connection, send_to_connection
from src.utils.dynamodb import get_connections_table


def connect_handler(event, context):
    """Handle WebSocket connect event"""
    connection_id = event['requestContext']['connectionId']

    # Get query parameters
    query_params = event.get('queryStringParameters') or {}
    tenant_id = query_params.get('tenantId', 'default')
    user_id = query_params.get('userId')
    user_type = query_params.get('userType', 'customer')

    try:
        save_connection(connection_id, tenant_id, user_id, user_type)

        return {
            'statusCode': 200,
            'body': 'Connected'
        }
    except Exception as e:
        print(f"Connection error: {str(e)}")
        return {
            'statusCode': 500,
            'body': f'Connection failed: {str(e)}'
        }


def disconnect_handler(event, context):
    """Handle WebSocket disconnect event"""
    connection_id = event['requestContext']['connectionId']

    try:
        cleanup_connection(connection_id)

        return {
            'statusCode': 200,
            'body': 'Disconnected'
        }
    except Exception as e:
        print(f"Disconnect error: {str(e)}")
        return {
            'statusCode': 500,
            'body': f'Disconnect failed: {str(e)}'
        }


def default_handler(event, context):
    """Handle default WebSocket route"""
    connection_id = event['requestContext']['connectionId']

    try:
        body = json.loads(event.get('body', '{}'))

        # Echo the message back
        response_message = {
            'type': 'ECHO',
            'message': 'Message received',
            'data': body,
            'timestamp': datetime.utcnow().isoformat()
        }

        send_to_connection(connection_id, response_message)

        return {
            'statusCode': 200,
            'body': 'Message processed'
        }
    except Exception as e:
        print(f"Default handler error: {str(e)}")
        return {
            'statusCode': 500,
            'body': f'Error: {str(e)}'
        }


def subscribe_handler(event, context):
    """Handle subscription to specific events"""
    connection_id = event['requestContext']['connectionId']

    try:
        body = json.loads(event.get('body', '{}'))
        subscription_type = body.get('subscriptionType', 'all')
        tenant_id = body.get('tenantId')

        # Update connection with subscription info
        table = get_connections_table()
        table.update_item(
            Key={'connectionId': connection_id},
            UpdateExpression='SET subscriptionType = :st, updatedAt = :ua',
            ExpressionAttributeValues={
                ':st': subscription_type,
                ':ua': datetime.utcnow().isoformat()
            }
        )

        # Send confirmation
        response_message = {
            'type': 'SUBSCRIPTION_CONFIRMED',
            'subscriptionType': subscription_type,
            'timestamp': datetime.utcnow().isoformat()
        }

        send_to_connection(connection_id, response_message)

        return {
            'statusCode': 200,
            'body': 'Subscription confirmed'
        }
    except Exception as e:
        print(f"Subscribe handler error: {str(e)}")
        return {
            'statusCode': 500,
            'body': f'Error: {str(e)}'
        }


def broadcast_handler(event, context):
    """Handle broadcast message (for admin use)"""
    connection_id = event['requestContext']['connectionId']

    try:
        body = json.loads(event.get('body', '{}'))

        # This is for testing purposes
        # In production, broadcasts should come from backend services
        response_message = {
            'type': 'BROADCAST_RECEIVED',
            'message': 'Broadcast functionality is handled by backend services',
            'timestamp': datetime.utcnow().isoformat()
        }

        send_to_connection(connection_id, response_message)

        return {
            'statusCode': 200,
            'body': 'Broadcast acknowledged'
        }
    except Exception as e:
        print(f"Broadcast handler error: {str(e)}")
        return {
            'statusCode': 500,
            'body': f'Error: {str(e)}'
        }
