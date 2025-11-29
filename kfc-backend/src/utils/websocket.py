"""
WebSocket utilities for real-time communication
"""
import os
import json
import boto3
from typing import Any, Dict, List
from boto3.dynamodb.conditions import Key
from .dynamodb import get_connections_table, query_items, decimal_to_float


def get_api_gateway_management_client():
    """Get API Gateway Management API client"""
    endpoint = os.environ.get('WEBSOCKET_API_ENDPOINT')
    return boto3.client(
        'apigatewaymanagementapi',
        endpoint_url=endpoint
    )


def send_to_connection(connection_id: str, data: Dict[str, Any]) -> bool:
    """
    Send a message to a specific WebSocket connection

    Args:
        connection_id: The WebSocket connection ID
        data: The data to send

    Returns:
        True if successful, False otherwise
    """
    try:
        client = get_api_gateway_management_client()
        client.post_to_connection(
            ConnectionId=connection_id,
            Data=json.dumps(data).encode('utf-8')
        )
        return True
    except client.exceptions.GoneException:
        # Connection no longer exists, clean it up
        cleanup_connection(connection_id)
        return False
    except Exception as e:
        print(f"Error sending to connection {connection_id}: {str(e)}")
        return False


def cleanup_connection(connection_id: str) -> bool:
    """Remove a stale connection from DynamoDB"""
    try:
        table = get_connections_table()
        table.delete_item(Key={'connectionId': connection_id})
        return True
    except Exception as e:
        print(f"Error cleaning up connection {connection_id}: {str(e)}")
        return False


def broadcast_to_tenant(tenant_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Broadcast a message to all connections for a specific tenant

    Args:
        tenant_id: The tenant ID to broadcast to
        data: The data to send

    Returns:
        Dictionary with success count and failure count
    """
    table = get_connections_table()

    # Query connections for this tenant
    connections = query_items(
        table,
        Key('tenantId').eq(tenant_id),
        index_name='TenantIndex'
    )

    success_count = 0
    failure_count = 0

    for connection in connections:
        connection_id = connection.get('connectionId')
        if connection_id:
            if send_to_connection(connection_id, data):
                success_count += 1
            else:
                failure_count += 1

    return {
        'success_count': success_count,
        'failure_count': failure_count,
        'total_connections': len(connections)
    }


def broadcast_order_update(
    tenant_id: str,
    order_id: str,
    status: str,
    order_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Broadcast an order status update to all connections for a tenant

    Args:
        tenant_id: The tenant ID
        order_id: The order ID
        status: The new status
        order_data: The full order data

    Returns:
        Broadcast result
    """
    message = {
        'type': 'ORDER_UPDATE',
        'payload': {
            'orderId': order_id,
            'status': status,
            'order': decimal_to_float(order_data),
            'timestamp': order_data.get('updatedAt', '')
        }
    }

    return broadcast_to_tenant(tenant_id, message)


def broadcast_new_order(tenant_id: str, order_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Broadcast a new order notification to all connections for a tenant

    Args:
        tenant_id: The tenant ID
        order_data: The order data

    Returns:
        Broadcast result
    """
    message = {
        'type': 'NEW_ORDER',
        'payload': {
            'order': decimal_to_float(order_data),
            'timestamp': order_data.get('createdAt', '')
        }
    }

    return broadcast_to_tenant(tenant_id, message)


def broadcast_dashboard_update(
    tenant_id: str,
    dashboard_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Broadcast a dashboard update to all connections for a tenant

    Args:
        tenant_id: The tenant ID
        dashboard_data: The dashboard data

    Returns:
        Broadcast result
    """
    message = {
        'type': 'DASHBOARD_UPDATE',
        'payload': dashboard_data
    }

    return broadcast_to_tenant(tenant_id, message)


def save_connection(
    connection_id: str,
    tenant_id: str,
    user_id: str = None,
    user_type: str = None
) -> bool:
    """
    Save a WebSocket connection to DynamoDB

    Args:
        connection_id: The connection ID
        tenant_id: The tenant ID
        user_id: Optional user ID
        user_type: Optional user type (customer, staff, admin)

    Returns:
        True if successful
    """
    from datetime import datetime

    table = get_connections_table()
    item = {
        'connectionId': connection_id,
        'tenantId': tenant_id,
        'connectedAt': datetime.utcnow().isoformat(),
    }

    if user_id:
        item['userId'] = user_id
    if user_type:
        item['userType'] = user_type

    table.put_item(Item=item)
    return True
