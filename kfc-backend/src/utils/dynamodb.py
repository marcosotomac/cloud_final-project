"""
DynamoDB utilities
"""
import os
import boto3
from typing import Any, Dict, List, Optional
from decimal import Decimal
from datetime import datetime
from boto3.dynamodb.conditions import Key, Attr


# Initialize DynamoDB resource
dynamodb = boto3.resource('dynamodb')


def get_table(table_name: str):
    """Get a DynamoDB table reference"""
    return dynamodb.Table(table_name)


def get_orders_table():
    """Get the orders table"""
    return get_table(os.environ.get('ORDERS_TABLE'))


def get_connections_table():
    """Get the connections table"""
    return get_table(os.environ.get('CONNECTIONS_TABLE'))


def get_tenants_table():
    """Get the tenants table"""
    return get_table(os.environ.get('TENANTS_TABLE'))


def get_menu_table():
    """Get the menu table"""
    return get_table(os.environ.get('MENU_TABLE'))


def get_users_table():
    """Get the users table"""
    return get_table(os.environ.get('USERS_TABLE'))


def float_to_decimal(obj: Any) -> Any:
    """Convert float values to Decimal for DynamoDB"""
    if isinstance(obj, float):
        return Decimal(str(obj))
    elif isinstance(obj, dict):
        return {k: float_to_decimal(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [float_to_decimal(i) for i in obj]
    return obj


def decimal_to_float(obj: Any) -> Any:
    """Convert Decimal values to float for JSON serialization"""
    if isinstance(obj, Decimal):
        return float(obj)
    elif isinstance(obj, dict):
        return {k: decimal_to_float(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [decimal_to_float(i) for i in obj]
    return obj


def put_item(table, item: Dict[str, Any]) -> Dict[str, Any]:
    """Put an item in DynamoDB"""
    item = float_to_decimal(item)
    table.put_item(Item=item)
    return item


def get_item(table, key: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Get an item from DynamoDB"""
    response = table.get_item(Key=key)
    item = response.get('Item')
    if item:
        return decimal_to_float(item)
    return None


def update_item(
    table,
    key: Dict[str, Any],
    update_expression: str,
    expression_values: Dict[str, Any],
    expression_names: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    """Update an item in DynamoDB"""
    expression_values = float_to_decimal(expression_values)

    params = {
        'Key': key,
        'UpdateExpression': update_expression,
        'ExpressionAttributeValues': expression_values,
        'ReturnValues': 'ALL_NEW'
    }

    if expression_names:
        params['ExpressionAttributeNames'] = expression_names

    response = table.update_item(**params)
    return decimal_to_float(response.get('Attributes', {}))


def delete_item(table, key: Dict[str, Any]) -> bool:
    """Delete an item from DynamoDB"""
    table.delete_item(Key=key)
    return True


def query_items(
    table,
    key_condition: Any,
    index_name: Optional[str] = None,
    filter_expression: Optional[Any] = None,
    limit: Optional[int] = None,
    scan_forward: bool = True
) -> List[Dict[str, Any]]:
    """Query items from DynamoDB"""
    params = {
        'KeyConditionExpression': key_condition,
        'ScanIndexForward': scan_forward
    }

    if index_name:
        params['IndexName'] = index_name

    if filter_expression:
        params['FilterExpression'] = filter_expression

    if limit:
        params['Limit'] = limit

    response = table.query(**params)
    items = response.get('Items', [])
    return [decimal_to_float(item) for item in items]


def scan_items(
    table,
    filter_expression: Optional[Any] = None,
    limit: Optional[int] = None
) -> List[Dict[str, Any]]:
    """Scan items from DynamoDB"""
    params = {}

    if filter_expression:
        params['FilterExpression'] = filter_expression

    if limit:
        params['Limit'] = limit

    response = table.scan(**params)
    items = response.get('Items', [])
    return [decimal_to_float(item) for item in items]


def batch_write_items(table, items: List[Dict[str, Any]]) -> bool:
    """Batch write items to DynamoDB"""
    with table.batch_writer() as batch:
        for item in items:
            batch.put_item(Item=float_to_decimal(item))
    return True
