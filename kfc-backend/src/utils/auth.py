"""
Authentication utilities
"""
import os
import hashlib
import hmac
import base64
from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Tuple
import json


# Simple JWT-like token implementation for AWS Academy (without external libraries)
SECRET_KEY = os.environ.get('JWT_SECRET', 'kfc-order-system-secret-key-2024')


def hash_password(password: str) -> str:
    """
    Hash a password using SHA256

    Args:
        password: The plain text password

    Returns:
        The hashed password
    """
    salt = os.urandom(32)
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
    return base64.b64encode(salt + key).decode('utf-8')


def verify_password(password: str, stored_hash: str) -> bool:
    """
    Verify a password against a stored hash

    Args:
        password: The plain text password
        stored_hash: The stored password hash

    Returns:
        True if password matches
    """
    try:
        decoded = base64.b64decode(stored_hash.encode('utf-8'))
        salt = decoded[:32]
        stored_key = decoded[32:]
        key = hashlib.pbkdf2_hmac(
            'sha256', password.encode('utf-8'), salt, 100000)
        return hmac.compare_digest(key, stored_key)
    except Exception:
        return False


def create_token(payload: Dict[str, Any], expires_hours: int = 24) -> str:
    """
    Create a simple JWT-like token

    Args:
        payload: The token payload
        expires_hours: Token expiration in hours

    Returns:
        The token string
    """
    header = {'alg': 'HS256', 'typ': 'JWT'}

    # Add expiration
    exp = datetime.utcnow() + timedelta(hours=expires_hours)
    payload['exp'] = exp.isoformat()
    payload['iat'] = datetime.utcnow().isoformat()

    # Encode header and payload
    header_b64 = base64.urlsafe_b64encode(
        json.dumps(header).encode()).decode().rstrip('=')
    payload_b64 = base64.urlsafe_b64encode(
        json.dumps(payload).encode()).decode().rstrip('=')

    # Create signature
    message = f"{header_b64}.{payload_b64}"
    signature = hmac.new(
        SECRET_KEY.encode(),
        message.encode(),
        hashlib.sha256
    ).digest()
    signature_b64 = base64.urlsafe_b64encode(signature).decode().rstrip('=')

    return f"{header_b64}.{payload_b64}.{signature_b64}"


def verify_token(token: str) -> Tuple[bool, Optional[Dict[str, Any]]]:
    """
    Verify a JWT-like token

    Args:
        token: The token string

    Returns:
        Tuple of (is_valid, payload)
    """
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return False, None

        header_b64, payload_b64, signature_b64 = parts

        # Verify signature
        message = f"{header_b64}.{payload_b64}"
        expected_signature = hmac.new(
            SECRET_KEY.encode(),
            message.encode(),
            hashlib.sha256
        ).digest()
        expected_signature_b64 = base64.urlsafe_b64encode(
            expected_signature).decode().rstrip('=')

        if not hmac.compare_digest(signature_b64, expected_signature_b64):
            return False, None

        # Decode payload
        # Add padding if needed
        padding = 4 - len(payload_b64) % 4
        if padding != 4:
            payload_b64 += '=' * padding

        payload = json.loads(base64.urlsafe_b64decode(payload_b64))

        # Check expiration
        exp = datetime.fromisoformat(payload.get('exp', ''))
        if datetime.utcnow() > exp:
            return False, None

        return True, payload

    except Exception as e:
        print(f"Token verification error: {str(e)}")
        return False, None


def get_user_from_event(event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Extract user information from the request event

    Args:
        event: The Lambda event

    Returns:
        User payload if authenticated, None otherwise
    """
    headers = event.get('headers', {})

    # Handle case-insensitive headers
    auth_header = headers.get(
        'Authorization') or headers.get('authorization', '')

    if not auth_header.startswith('Bearer '):
        return None

    token = auth_header[7:]  # Remove 'Bearer ' prefix
    is_valid, payload = verify_token(token)

    if is_valid:
        return payload

    return None


def get_tenant_id_from_event(event: Dict[str, Any]) -> Optional[str]:
    """
    Extract tenant ID from path parameters or headers

    Args:
        event: The Lambda event

    Returns:
        Tenant ID if found
    """
    # First try path parameters
    path_params = event.get('pathParameters', {}) or {}
    tenant_id = path_params.get('tenantId')

    if tenant_id:
        return tenant_id

    # Then try headers
    headers = event.get('headers', {}) or {}
    return headers.get('X-Tenant-Id') or headers.get('x-tenant-id')
