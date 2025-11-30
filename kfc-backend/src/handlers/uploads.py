"""
Upload handlers for S3 pre-signed URLs
"""
import json
import os
import uuid
import boto3
from botocore.exceptions import ClientError
from src.utils.response import success_response, error_response

s3_client = boto3.client('s3')
ASSETS_BUCKET = os.environ.get('ASSETS_BUCKET', 'kfc-assets-dev-595645243021')
REGION = os.environ.get('REGION', 'us-east-1')


def get_upload_url_handler(event, context):
    """
    Generate a pre-signed URL for uploading a file to S3

    Query parameters:
    - filename: Original filename (required)
    - contentType: MIME type (required, e.g., image/jpeg)
    - folder: Optional folder path (default: 'menu')
    """
    try:
        # Get query parameters
        query_params = event.get('queryStringParameters') or {}
        filename = query_params.get('filename')
        content_type = query_params.get('contentType')
        folder = query_params.get('folder', 'menu')

        if not filename:
            return error_response('filename is required', 400)

        if not content_type:
            return error_response('contentType is required', 400)

        # Validate content type (only images allowed)
        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if content_type not in allowed_types:
            return error_response(f'Invalid content type. Allowed: {", ".join(allowed_types)}', 400)

        # Generate unique key
        file_extension = filename.split('.')[-1] if '.' in filename else 'jpg'
        unique_id = str(uuid.uuid4())
        key = f"{folder}/{unique_id}.{file_extension}"

        # Generate pre-signed URL for PUT operation
        presigned_url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': ASSETS_BUCKET,
                'Key': key,
                'ContentType': content_type,
            },
            ExpiresIn=300  # 5 minutes
        )

        # Build the public URL for the uploaded file
        public_url = f"https://{ASSETS_BUCKET}.s3.{REGION}.amazonaws.com/{key}"

        return success_response({
            'uploadUrl': presigned_url,
            'publicUrl': public_url,
            'key': key,
            'expiresIn': 300
        })

    except ClientError as e:
        return error_response(f'S3 error: {str(e)}', 500)
    except Exception as e:
        return error_response(f'Error generating upload URL: {str(e)}', 500)


def delete_asset_handler(event, context):
    """
    Delete an asset from S3

    Path parameter: key (URL encoded S3 key)
    """
    try:
        path_params = event.get('pathParameters') or {}
        key = path_params.get('key')

        if not key:
            return error_response('key is required', 400)

        # URL decode the key
        import urllib.parse
        key = urllib.parse.unquote(key)

        # Delete the object
        s3_client.delete_object(
            Bucket=ASSETS_BUCKET,
            Key=key
        )

        return success_response({
            'message': 'Asset deleted successfully',
            'key': key
        })

    except ClientError as e:
        return error_response(f'S3 error: {str(e)}', 500)
    except Exception as e:
        return error_response(f'Error deleting asset: {str(e)}', 500)
