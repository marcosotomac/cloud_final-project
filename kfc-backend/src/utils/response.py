"""
Response utilities for Lambda functions
"""
import json
from typing import Any, Dict, Optional
from decimal import Decimal


class DecimalEncoder(json.JSONEncoder):
    """Custom JSON encoder for Decimal types"""

    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)


def create_response(
    status_code: int,
    body: Any = None,
    headers: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    """
    Create a standardized API Gateway response

    Args:
        status_code: HTTP status code
        body: Response body (will be JSON serialized)
        headers: Optional additional headers

    Returns:
        API Gateway compatible response dictionary
    """
    default_headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Tenant-Id',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    }

    if headers:
        default_headers.update(headers)

    response = {
        'statusCode': status_code,
        'headers': default_headers
    }

    if body is not None:
        response['body'] = json.dumps(body, cls=DecimalEncoder)

    return response


def success_response(data: Any = None, message: str = "Success") -> Dict[str, Any]:
    """Create a success response (200)"""
    body = {"success": True, "message": message}
    if data is not None:
        body["data"] = data
    return create_response(200, body)


def created_response(data: Any = None, message: str = "Created") -> Dict[str, Any]:
    """Create a created response (201)"""
    body = {"success": True, "message": message}
    if data is not None:
        body["data"] = data
    return create_response(201, body)


def error_response(
    message: str,
    status_code: int = 400,
    errors: Optional[list] = None
) -> Dict[str, Any]:
    """Create an error response"""
    body = {"success": False, "message": message}
    if errors:
        body["errors"] = errors
    return create_response(status_code, body)


def not_found_response(message: str = "Resource not found") -> Dict[str, Any]:
    """Create a not found response (404)"""
    return error_response(message, 404)


def unauthorized_response(message: str = "Unauthorized") -> Dict[str, Any]:
    """Create an unauthorized response (401)"""
    return error_response(message, 401)


def forbidden_response(message: str = "Forbidden") -> Dict[str, Any]:
    """Create a forbidden response (403)"""
    return error_response(message, 403)


def internal_error_response(message: str = "Internal server error") -> Dict[str, Any]:
    """Create an internal error response (500)"""
    return error_response(message, 500)
