"""
Ratings and Reviews Handler
Manages customer ratings and reviews for orders and menu items
"""
import json
import os
from datetime import datetime
from decimal import Decimal

import ulid

from ..utils.response import success_response, error_response, created_response
from ..utils.dynamodb import get_item, put_item, query_items, update_item, delete_item
from ..utils.auth import verify_token, get_user_from_token
from ..utils.events import publish_event


ORDERS_TABLE = os.environ.get('ORDERS_TABLE')
MENU_TABLE = os.environ.get('MENU_TABLE')


def create_order_rating_handler(event, context):
    """
    Create a rating for a completed order
    POST /tenants/{tenantId}/orders/{orderId}/rating
    """
    try:
        tenant_id = event['pathParameters']['tenantId']
        order_id = event['pathParameters']['orderId']

        # Verify authentication
        user = get_user_from_token(event)
        if not user:
            return error_response('No autorizado', 401)

        body = json.loads(event.get('body', '{}'))

        # Validate required fields
        overall_rating = body.get('overallRating')
        if not overall_rating or not (1 <= overall_rating <= 5):
            return error_response('La calificación debe estar entre 1 y 5', 400)

        # Check if order exists and is completed
        order = get_item(
            ORDERS_TABLE,
            {'PK': f'TENANT#{tenant_id}', 'SK': f'ORDER#{order_id}'}
        )

        if not order:
            return error_response('Orden no encontrada', 404)

        if order.get('status') != 'COMPLETED':
            return error_response('Solo se pueden calificar órdenes completadas', 400)

        # Check if already rated
        if order.get('rating'):
            return error_response('Esta orden ya fue calificada', 400)

        # Create rating
        rating_id = str(ulid.new())
        now = datetime.utcnow().isoformat()

        rating_data = {
            'ratingId': rating_id,
            'orderId': order_id,
            'customerId': user.get('userId'),
            'overallRating': Decimal(str(overall_rating)),
            'foodQuality': Decimal(str(body.get('foodQuality', overall_rating))),
            'deliverySpeed': Decimal(str(body.get('deliverySpeed', overall_rating))),
            'packaging': Decimal(str(body.get('packaging', overall_rating))),
            'serviceQuality': Decimal(str(body.get('serviceQuality', overall_rating))),
            'comment': body.get('comment', ''),
            'wouldRecommend': body.get('wouldRecommend', True),
            'createdAt': now
        }

        # Update order with rating
        update_item(
            ORDERS_TABLE,
            {'PK': f'TENANT#{tenant_id}', 'SK': f'ORDER#{order_id}'},
            {
                'rating': rating_data,
                'ratedAt': now
            }
        )

        # Store rating in separate record for querying
        rating_item = {
            'PK': f'TENANT#{tenant_id}',
            'SK': f'RATING#{rating_id}',
            'GSI1PK': f'TENANT#{tenant_id}#RATINGS',
            'GSI1SK': now,
            **rating_data,
            'tenantId': tenant_id
        }

        put_item(ORDERS_TABLE, rating_item)

        # Publish rating event
        publish_event('kfc.ratings', 'order.rated', {
            'tenantId': tenant_id,
            'orderId': order_id,
            'ratingId': rating_id,
            'overallRating': float(overall_rating)
        })

        return created_response({
            'message': 'Calificación registrada exitosamente',
            'ratingId': rating_id,
            'rating': rating_data
        })

    except json.JSONDecodeError:
        return error_response('JSON inválido', 400)
    except Exception as e:
        print(f"Error creating order rating: {str(e)}")
        return error_response(f'Error al crear calificación: {str(e)}', 500)


def get_order_rating_handler(event, context):
    """
    Get rating for a specific order
    GET /tenants/{tenantId}/orders/{orderId}/rating
    """
    try:
        tenant_id = event['pathParameters']['tenantId']
        order_id = event['pathParameters']['orderId']

        order = get_item(
            ORDERS_TABLE,
            {'PK': f'TENANT#{tenant_id}', 'SK': f'ORDER#{order_id}'}
        )

        if not order:
            return error_response('Orden no encontrada', 404)

        rating = order.get('rating')
        if not rating:
            return error_response('Esta orden no tiene calificación', 404)

        return success_response({'rating': rating})

    except Exception as e:
        print(f"Error getting order rating: {str(e)}")
        return error_response(f'Error al obtener calificación: {str(e)}', 500)


def get_tenant_ratings_handler(event, context):
    """
    Get all ratings for a tenant with optional filters
    GET /tenants/{tenantId}/ratings
    """
    try:
        tenant_id = event['pathParameters']['tenantId']
        params = event.get('queryStringParameters') or {}

        min_rating = params.get('minRating')
        limit = int(params.get('limit', 50))

        ratings = query_items(
            ORDERS_TABLE,
            'GSI1PK = :pk',
            {':pk': f'TENANT#{tenant_id}#RATINGS'},
            index_name='GSI1',
            scan_index_forward=False,  # Newest first
            limit=limit
        )

        # Filter by minimum rating if specified
        if min_rating:
            min_rating = float(min_rating)
            ratings = [r for r in ratings if float(
                r.get('overallRating', 0)) >= min_rating]

        # Calculate average ratings
        if ratings:
            avg_overall = sum(float(r.get('overallRating', 0))
                              for r in ratings) / len(ratings)
            avg_food = sum(float(r.get('foodQuality', 0))
                           for r in ratings) / len(ratings)
            avg_delivery = sum(float(r.get('deliverySpeed', 0))
                               for r in ratings) / len(ratings)
            avg_packaging = sum(float(r.get('packaging', 0))
                                for r in ratings) / len(ratings)
            avg_service = sum(float(r.get('serviceQuality', 0))
                              for r in ratings) / len(ratings)

            summary = {
                'totalRatings': len(ratings),
                'averageOverall': round(avg_overall, 2),
                'averageFoodQuality': round(avg_food, 2),
                'averageDeliverySpeed': round(avg_delivery, 2),
                'averagePackaging': round(avg_packaging, 2),
                'averageServiceQuality': round(avg_service, 2),
                'ratingDistribution': {
                    '5': len([r for r in ratings if int(float(r.get('overallRating', 0))) == 5]),
                    '4': len([r for r in ratings if int(float(r.get('overallRating', 0))) == 4]),
                    '3': len([r for r in ratings if int(float(r.get('overallRating', 0))) == 3]),
                    '2': len([r for r in ratings if int(float(r.get('overallRating', 0))) == 2]),
                    '1': len([r for r in ratings if int(float(r.get('overallRating', 0))) == 1])
                }
            }
        else:
            summary = {
                'totalRatings': 0,
                'averageOverall': 0,
                'averageFoodQuality': 0,
                'averageDeliverySpeed': 0,
                'averagePackaging': 0,
                'averageServiceQuality': 0,
                'ratingDistribution': {'5': 0, '4': 0, '3': 0, '2': 0, '1': 0}
            }

        return success_response({
            'ratings': ratings,
            'summary': summary
        })

    except Exception as e:
        print(f"Error getting tenant ratings: {str(e)}")
        return error_response(f'Error al obtener calificaciones: {str(e)}', 500)


def create_menu_item_review_handler(event, context):
    """
    Create a review for a menu item
    POST /tenants/{tenantId}/menu/{itemId}/reviews
    """
    try:
        tenant_id = event['pathParameters']['tenantId']
        item_id = event['pathParameters']['itemId']

        # Verify authentication
        user = get_user_from_token(event)
        if not user:
            return error_response('No autorizado', 401)

        body = json.loads(event.get('body', '{}'))

        # Validate rating
        rating = body.get('rating')
        if not rating or not (1 <= rating <= 5):
            return error_response('La calificación debe estar entre 1 y 5', 400)

        # Check if menu item exists
        menu_item = get_item(
            MENU_TABLE,
            {'PK': f'TENANT#{tenant_id}', 'SK': f'ITEM#{item_id}'}
        )

        if not menu_item:
            return error_response('Producto no encontrado', 404)

        # Create review
        review_id = str(ulid.new())
        now = datetime.utcnow().isoformat()

        review_data = {
            'PK': f'TENANT#{tenant_id}#ITEM#{item_id}',
            'SK': f'REVIEW#{review_id}',
            'GSI1PK': f'TENANT#{tenant_id}#ITEM_REVIEWS',
            'GSI1SK': now,
            'reviewId': review_id,
            'itemId': item_id,
            'customerId': user.get('userId'),
            'customerName': user.get('name', 'Cliente'),
            'rating': Decimal(str(rating)),
            'title': body.get('title', ''),
            'comment': body.get('comment', ''),
            'pros': body.get('pros', []),
            'cons': body.get('cons', []),
            'images': body.get('images', []),
            'helpful': 0,
            'verified': body.get('orderId') is not None,
            'orderId': body.get('orderId'),
            'tenantId': tenant_id,
            'createdAt': now
        }

        put_item(MENU_TABLE, review_data)

        # Update menu item average rating
        item_reviews = query_items(
            MENU_TABLE,
            'PK = :pk AND begins_with(SK, :sk)',
            {':pk': f'TENANT#{tenant_id}#ITEM#{item_id}', ':sk': 'REVIEW#'}
        )

        if item_reviews:
            avg_rating = sum(float(r.get('rating', 0))
                             for r in item_reviews) / len(item_reviews)
            update_item(
                MENU_TABLE,
                {'PK': f'TENANT#{tenant_id}', 'SK': f'ITEM#{item_id}'},
                {
                    'averageRating': Decimal(str(round(avg_rating, 2))),
                    'reviewCount': len(item_reviews)
                }
            )

        return created_response({
            'message': 'Reseña creada exitosamente',
            'reviewId': review_id,
            'review': review_data
        })

    except json.JSONDecodeError:
        return error_response('JSON inválido', 400)
    except Exception as e:
        print(f"Error creating menu item review: {str(e)}")
        return error_response(f'Error al crear reseña: {str(e)}', 500)


def get_menu_item_reviews_handler(event, context):
    """
    Get reviews for a menu item
    GET /tenants/{tenantId}/menu/{itemId}/reviews
    """
    try:
        tenant_id = event['pathParameters']['tenantId']
        item_id = event['pathParameters']['itemId']
        params = event.get('queryStringParameters') or {}

        limit = int(params.get('limit', 20))
        sort_by = params.get('sortBy', 'recent')  # recent, rating, helpful

        reviews = query_items(
            MENU_TABLE,
            'PK = :pk AND begins_with(SK, :sk)',
            {':pk': f'TENANT#{tenant_id}#ITEM#{item_id}', ':sk': 'REVIEW#'}
        )

        # Sort reviews
        if sort_by == 'rating':
            reviews.sort(key=lambda x: float(x.get('rating', 0)), reverse=True)
        elif sort_by == 'helpful':
            reviews.sort(key=lambda x: x.get('helpful', 0), reverse=True)
        else:  # recent
            reviews.sort(key=lambda x: x.get('createdAt', ''), reverse=True)

        reviews = reviews[:limit]

        # Calculate summary
        if reviews:
            avg_rating = sum(float(r.get('rating', 0))
                             for r in reviews) / len(reviews)
            summary = {
                'totalReviews': len(reviews),
                'averageRating': round(avg_rating, 2),
                'ratingDistribution': {
                    '5': len([r for r in reviews if int(float(r.get('rating', 0))) == 5]),
                    '4': len([r for r in reviews if int(float(r.get('rating', 0))) == 4]),
                    '3': len([r for r in reviews if int(float(r.get('rating', 0))) == 3]),
                    '2': len([r for r in reviews if int(float(r.get('rating', 0))) == 2]),
                    '1': len([r for r in reviews if int(float(r.get('rating', 0))) == 1])
                }
            }
        else:
            summary = {
                'totalReviews': 0,
                'averageRating': 0,
                'ratingDistribution': {'5': 0, '4': 0, '3': 0, '2': 0, '1': 0}
            }

        return success_response({
            'reviews': reviews,
            'summary': summary
        })

    except Exception as e:
        print(f"Error getting menu item reviews: {str(e)}")
        return error_response(f'Error al obtener reseñas: {str(e)}', 500)


def update_review_helpful_handler(event, context):
    """
    Mark a review as helpful
    POST /tenants/{tenantId}/menu/{itemId}/reviews/{reviewId}/helpful
    """
    try:
        tenant_id = event['pathParameters']['tenantId']
        item_id = event['pathParameters']['itemId']
        review_id = event['pathParameters']['reviewId']

        # Verify authentication
        user = get_user_from_token(event)
        if not user:
            return error_response('No autorizado', 401)

        # Get review
        review = get_item(
            MENU_TABLE,
            {'PK': f'TENANT#{tenant_id}#ITEM#{item_id}', 'SK': f'REVIEW#{review_id}'}
        )

        if not review:
            return error_response('Reseña no encontrada', 404)

        # Check if user already marked as helpful
        helpful_users = review.get('helpfulUsers', [])
        user_id = user.get('userId')

        if user_id in helpful_users:
            return error_response('Ya marcaste esta reseña como útil', 400)

        helpful_users.append(user_id)

        # Update review
        update_item(
            MENU_TABLE,
            {'PK': f'TENANT#{tenant_id}#ITEM#{item_id}',
                'SK': f'REVIEW#{review_id}'},
            {
                'helpful': review.get('helpful', 0) + 1,
                'helpfulUsers': helpful_users
            }
        )

        return success_response({
            'message': 'Reseña marcada como útil',
            'helpful': review.get('helpful', 0) + 1
        })

    except Exception as e:
        print(f"Error updating review helpful: {str(e)}")
        return error_response(f'Error al actualizar reseña: {str(e)}', 500)


def delete_review_handler(event, context):
    """
    Delete a review (only owner or admin)
    DELETE /tenants/{tenantId}/menu/{itemId}/reviews/{reviewId}
    """
    try:
        tenant_id = event['pathParameters']['tenantId']
        item_id = event['pathParameters']['itemId']
        review_id = event['pathParameters']['reviewId']

        # Verify authentication
        user = get_user_from_token(event)
        if not user:
            return error_response('No autorizado', 401)

        # Get review
        review = get_item(
            MENU_TABLE,
            {'PK': f'TENANT#{tenant_id}#ITEM#{item_id}', 'SK': f'REVIEW#{review_id}'}
        )

        if not review:
            return error_response('Reseña no encontrada', 404)

        # Check permissions
        user_role = user.get('role', '')
        if review.get('customerId') != user.get('userId') and user_role not in ['ADMIN', 'MANAGER']:
            return error_response('No tienes permiso para eliminar esta reseña', 403)

        # Delete review
        delete_item(
            MENU_TABLE,
            {'PK': f'TENANT#{tenant_id}#ITEM#{item_id}', 'SK': f'REVIEW#{review_id}'}
        )

        # Update menu item average rating
        item_reviews = query_items(
            MENU_TABLE,
            'PK = :pk AND begins_with(SK, :sk)',
            {':pk': f'TENANT#{tenant_id}#ITEM#{item_id}', ':sk': 'REVIEW#'}
        )

        if item_reviews:
            avg_rating = sum(float(r.get('rating', 0))
                             for r in item_reviews) / len(item_reviews)
            update_item(
                MENU_TABLE,
                {'PK': f'TENANT#{tenant_id}', 'SK': f'ITEM#{item_id}'},
                {
                    'averageRating': Decimal(str(round(avg_rating, 2))),
                    'reviewCount': len(item_reviews)
                }
            )
        else:
            update_item(
                MENU_TABLE,
                {'PK': f'TENANT#{tenant_id}', 'SK': f'ITEM#{item_id}'},
                {
                    'averageRating': Decimal('0'),
                    'reviewCount': 0
                }
            )

        return success_response({'message': 'Reseña eliminada exitosamente'})

    except Exception as e:
        print(f"Error deleting review: {str(e)}")
        return error_response(f'Error al eliminar reseña: {str(e)}', 500)


def get_customer_reviews_handler(event, context):
    """
    Get all reviews by a customer
    GET /tenants/{tenantId}/customers/{customerId}/reviews
    """
    try:
        tenant_id = event['pathParameters']['tenantId']
        customer_id = event['pathParameters']['customerId']

        # Query reviews by this customer
        # Note: This would be more efficient with a GSI on customerId
        reviews = query_items(
            MENU_TABLE,
            'GSI1PK = :pk',
            {':pk': f'TENANT#{tenant_id}#ITEM_REVIEWS'},
            index_name='GSI1'
        )

        # Filter by customer
        customer_reviews = [r for r in reviews if r.get(
            'customerId') == customer_id]

        # Sort by date
        customer_reviews.sort(key=lambda x: x.get(
            'createdAt', ''), reverse=True)

        return success_response({
            'reviews': customer_reviews,
            'totalReviews': len(customer_reviews)
        })

    except Exception as e:
        print(f"Error getting customer reviews: {str(e)}")
        return error_response(f'Error al obtener reseñas: {str(e)}', 500)
