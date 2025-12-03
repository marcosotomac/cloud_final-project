"""
Locations Handler
Manages store locations and availability
"""
import json
import os
from datetime import datetime
from decimal import Decimal
import math

import ulid

from ..utils.response import success_response, error_response, created_response
from ..utils.dynamodb import get_item, put_item, query_items, update_item, delete_item, scan_items
from ..utils.auth import verify_token, get_user_from_token


TENANTS_TABLE = os.environ.get('TENANTS_TABLE')


def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points in km"""
    R = 6371  # Earth's radius in kilometers

    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)

    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * \
        math.cos(lat2_rad) * math.sin(delta_lon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

    return R * c


def create_location_handler(event, context):
    """
    Create a new store location
    POST /tenants/{tenantId}/locations
    """
    try:
        tenant_id = event['pathParameters']['tenantId']

        # Verify authentication (admin only)
        user = get_user_from_token(event)
        if not user or user.get('role') not in ['ADMIN', 'MANAGER']:
            return error_response('No autorizado', 401)

        body = json.loads(event.get('body', '{}'))

        # Validate required fields
        required = ['name', 'address', 'latitude', 'longitude']
        missing = [f for f in required if not body.get(f)]
        if missing:
            return error_response(f'Campos requeridos: {", ".join(missing)}', 400)

        location_id = str(ulid.new())
        now = datetime.utcnow().isoformat()

        # Create location
        location = {
            'PK': f'TENANT#{tenant_id}',
            'SK': f'LOCATION#{location_id}',
            'GSI1PK': f'LOCATIONS',
            'GSI1SK': f'TENANT#{tenant_id}#LOCATION#{location_id}',
            'locationId': location_id,
            'tenantId': tenant_id,
            'name': body['name'],
            'address': body['address'],
            'city': body.get('city', ''),
            'state': body.get('state', ''),
            'postalCode': body.get('postalCode', ''),
            'country': body.get('country', 'Perú'),
            'latitude': Decimal(str(body['latitude'])),
            'longitude': Decimal(str(body['longitude'])),
            'phone': body.get('phone', ''),
            'email': body.get('email', ''),
            'isActive': body.get('isActive', True),
            'isOpen': body.get('isOpen', True),
            # km
            'deliveryRadius': Decimal(str(body.get('deliveryRadius', 5))),
            'minimumOrder': Decimal(str(body.get('minimumOrder', 20))),
            'deliveryFee': Decimal(str(body.get('deliveryFee', 5))),
            'freeDeliveryThreshold': Decimal(str(body.get('freeDeliveryThreshold', 50))),
            # minutes
            'averageDeliveryTime': body.get('averageDeliveryTime', 30),
            'schedule': body.get('schedule', {
                'monday': {'open': '10:00', 'close': '22:00', 'isOpen': True},
                'tuesday': {'open': '10:00', 'close': '22:00', 'isOpen': True},
                'wednesday': {'open': '10:00', 'close': '22:00', 'isOpen': True},
                'thursday': {'open': '10:00', 'close': '22:00', 'isOpen': True},
                'friday': {'open': '10:00', 'close': '23:00', 'isOpen': True},
                'saturday': {'open': '10:00', 'close': '23:00', 'isOpen': True},
                'sunday': {'open': '11:00', 'close': '22:00', 'isOpen': True}
            }),
            'features': body.get('features', {
                'dineIn': True,
                'takeout': True,
                'delivery': True,
                'driveThru': False,
                'wifi': True,
                'parking': True,
                'accessible': True
            }),
            'images': body.get('images', []),
            'createdAt': now,
            'updatedAt': now
        }

        put_item(TENANTS_TABLE, location)

        return created_response({
            'message': 'Ubicación creada exitosamente',
            'location': location
        })

    except json.JSONDecodeError:
        return error_response('JSON inválido', 400)
    except Exception as e:
        print(f"Error creating location: {str(e)}")
        return error_response(f'Error al crear ubicación: {str(e)}', 500)


def get_locations_handler(event, context):
    """
    Get all locations for a tenant
    GET /tenants/{tenantId}/locations
    """
    try:
        tenant_id = event['pathParameters']['tenantId']
        params = event.get('queryStringParameters') or {}

        only_active = params.get('active', 'true').lower() == 'true'
        only_open = params.get('open', 'false').lower() == 'true'

        locations = query_items(
            TENANTS_TABLE,
            'PK = :pk AND begins_with(SK, :sk)',
            {':pk': f'TENANT#{tenant_id}', ':sk': 'LOCATION#'}
        )

        # Filter by active/open status
        if only_active:
            locations = [l for l in locations if l.get('isActive', True)]

        if only_open:
            locations = [l for l in locations if l.get('isOpen', True)]

        return success_response({
            'locations': locations,
            'count': len(locations)
        })

    except Exception as e:
        print(f"Error getting locations: {str(e)}")
        return error_response(f'Error al obtener ubicaciones: {str(e)}', 500)


def get_location_handler(event, context):
    """
    Get a specific location
    GET /tenants/{tenantId}/locations/{locationId}
    """
    try:
        tenant_id = event['pathParameters']['tenantId']
        location_id = event['pathParameters']['locationId']

        location = get_item(
            TENANTS_TABLE,
            {'PK': f'TENANT#{tenant_id}', 'SK': f'LOCATION#{location_id}'}
        )

        if not location:
            return error_response('Ubicación no encontrada', 404)

        return success_response({'location': location})

    except Exception as e:
        print(f"Error getting location: {str(e)}")
        return error_response(f'Error al obtener ubicación: {str(e)}', 500)


def update_location_handler(event, context):
    """
    Update a location
    PUT /tenants/{tenantId}/locations/{locationId}
    """
    try:
        tenant_id = event['pathParameters']['tenantId']
        location_id = event['pathParameters']['locationId']

        # Verify authentication (admin only)
        user = get_user_from_token(event)
        if not user or user.get('role') not in ['ADMIN', 'MANAGER']:
            return error_response('No autorizado', 401)

        body = json.loads(event.get('body', '{}'))

        # Get existing location
        location = get_item(
            TENANTS_TABLE,
            {'PK': f'TENANT#{tenant_id}', 'SK': f'LOCATION#{location_id}'}
        )

        if not location:
            return error_response('Ubicación no encontrada', 404)

        # Build update
        updates = {'updatedAt': datetime.utcnow().isoformat()}

        allowed_fields = [
            'name', 'address', 'city', 'state', 'postalCode', 'country',
            'latitude', 'longitude', 'phone', 'email', 'isActive', 'isOpen',
            'deliveryRadius', 'minimumOrder', 'deliveryFee', 'freeDeliveryThreshold',
            'averageDeliveryTime', 'schedule', 'features', 'images'
        ]

        for field in allowed_fields:
            if field in body:
                if field in ['latitude', 'longitude', 'deliveryRadius', 'minimumOrder', 'deliveryFee', 'freeDeliveryThreshold']:
                    updates[field] = Decimal(str(body[field]))
                else:
                    updates[field] = body[field]

        update_item(
            TENANTS_TABLE,
            {'PK': f'TENANT#{tenant_id}', 'SK': f'LOCATION#{location_id}'},
            updates
        )

        return success_response({
            'message': 'Ubicación actualizada exitosamente',
            'location': {**location, **updates}
        })

    except json.JSONDecodeError:
        return error_response('JSON inválido', 400)
    except Exception as e:
        print(f"Error updating location: {str(e)}")
        return error_response(f'Error al actualizar ubicación: {str(e)}', 500)


def delete_location_handler(event, context):
    """
    Delete a location
    DELETE /tenants/{tenantId}/locations/{locationId}
    """
    try:
        tenant_id = event['pathParameters']['tenantId']
        location_id = event['pathParameters']['locationId']

        # Verify authentication (admin only)
        user = get_user_from_token(event)
        if not user or user.get('role') not in ['ADMIN']:
            return error_response('No autorizado', 401)

        # Check if location exists
        location = get_item(
            TENANTS_TABLE,
            {'PK': f'TENANT#{tenant_id}', 'SK': f'LOCATION#{location_id}'}
        )

        if not location:
            return error_response('Ubicación no encontrada', 404)

        delete_item(
            TENANTS_TABLE,
            {'PK': f'TENANT#{tenant_id}', 'SK': f'LOCATION#{location_id}'}
        )

        return success_response({'message': 'Ubicación eliminada exitosamente'})

    except Exception as e:
        print(f"Error deleting location: {str(e)}")
        return error_response(f'Error al eliminar ubicación: {str(e)}', 500)


def find_nearby_locations_handler(event, context):
    """
    Find locations near a given coordinate
    GET /tenants/{tenantId}/locations/nearby
    Query params: latitude, longitude, radius (km)
    """
    try:
        tenant_id = event['pathParameters']['tenantId']
        params = event.get('queryStringParameters') or {}

        # Validate coordinates
        if not params.get('latitude') or not params.get('longitude'):
            return error_response('Se requieren latitude y longitude', 400)

        user_lat = float(params['latitude'])
        user_lon = float(params['longitude'])
        search_radius = float(params.get('radius', 10))  # km, default 10km

        # Get all active locations
        locations = query_items(
            TENANTS_TABLE,
            'PK = :pk AND begins_with(SK, :sk)',
            {':pk': f'TENANT#{tenant_id}', ':sk': 'LOCATION#'}
        )

        # Filter active locations only
        locations = [l for l in locations if l.get('isActive', True)]

        # Calculate distances and filter by radius
        nearby = []
        for location in locations:
            loc_lat = float(location.get('latitude', 0))
            loc_lon = float(location.get('longitude', 0))

            if loc_lat and loc_lon:
                distance = haversine_distance(
                    user_lat, user_lon, loc_lat, loc_lon)

                if distance <= search_radius:
                    location['distance'] = round(distance, 2)
                    location['canDeliver'] = distance <= float(
                        location.get('deliveryRadius', 0))
                    nearby.append(location)

        # Sort by distance
        nearby.sort(key=lambda x: x.get('distance', float('inf')))

        return success_response({
            'locations': nearby,
            'count': len(nearby),
            'searchRadius': search_radius
        })

    except ValueError as e:
        return error_response('Coordenadas inválidas', 400)
    except Exception as e:
        print(f"Error finding nearby locations: {str(e)}")
        return error_response(f'Error al buscar ubicaciones: {str(e)}', 500)


def check_delivery_availability_handler(event, context):
    """
    Check if delivery is available to a specific address
    POST /tenants/{tenantId}/locations/check-delivery
    
    NOTA: Siempre devuelve cobertura disponible para demo/desarrollo
    """
    try:
        tenant_id = event['pathParameters']['tenantId']
        body = json.loads(event.get('body', '{}'))

        # Validate coordinates
        if not body.get('latitude') or not body.get('longitude'):
            return error_response('Se requieren latitude y longitude', 400)

        user_lat = float(body['latitude'])
        user_lon = float(body['longitude'])

        # Get all active locations
        locations = query_items(
            TENANTS_TABLE,
            'PK = :pk AND begins_with(SK, :sk)',
            {':pk': f'TENANT#{tenant_id}', ':sk': 'LOCATION#'}
        )

        # Filter active and open locations
        locations = [l for l in locations if l.get(
            'isActive', True) and l.get('isOpen', True)]

        # Find locations that can deliver
        can_deliver = []
        for location in locations:
            loc_lat = float(location.get('latitude', 0))
            loc_lon = float(location.get('longitude', 0))
            # Radio de delivery muy amplio (100km) para siempre tener cobertura
            delivery_radius = float(location.get('deliveryRadius', 100))

            if loc_lat and loc_lon:
                distance = haversine_distance(
                    user_lat, user_lon, loc_lat, loc_lon)

                # Siempre incluir la ubicación (sin límite de radio)
                delivery_fee = float(location.get('deliveryFee', 0))
                free_threshold = float(
                    location.get('freeDeliveryThreshold', 0))

                can_deliver.append({
                    'locationId': location.get('locationId'),
                    'name': location.get('name'),
                    'address': location.get('address'),
                    'distance': round(distance, 2),
                    'estimatedTime': location.get('averageDeliveryTime', 30) + int(distance * 2),
                    'deliveryFee': delivery_fee,
                    'freeDeliveryThreshold': free_threshold,
                    'minimumOrder': float(location.get('minimumOrder', 0))
                })

        # Sort by distance
        can_deliver.sort(key=lambda x: x.get('distance', float('inf')))

        # Si no hay ubicaciones, crear una ubicación virtual por defecto
        if not can_deliver:
            default_location = {
                'locationId': 'default-location',
                'name': 'KFC Principal',
                'address': 'Av. Javier Prado Este 4200, Lima',
                'distance': 0,
                'estimatedTime': 30,
                'deliveryFee': 5.0,
                'freeDeliveryThreshold': 50.0,
                'minimumOrder': 20.0
            }
            can_deliver.append(default_location)

        # Siempre disponible
        return success_response({
            'available': True,
            'locations': can_deliver,
            'closestLocation': can_deliver[0] if can_deliver else None,
            'message': 'Delivery disponible'
        })

    except json.JSONDecodeError:
        return error_response('JSON inválido', 400)
    except Exception as e:
        print(f"Error checking delivery availability: {str(e)}")
        return error_response(f'Error al verificar disponibilidad: {str(e)}', 500)


def toggle_location_status_handler(event, context):
    """
    Toggle location open/closed status
    POST /tenants/{tenantId}/locations/{locationId}/toggle
    """
    try:
        tenant_id = event['pathParameters']['tenantId']
        location_id = event['pathParameters']['locationId']

        # Verify authentication
        user = get_user_from_token(event)
        if not user or user.get('role') not in ['ADMIN', 'MANAGER']:
            return error_response('No autorizado', 401)

        body = json.loads(event.get('body', '{}'))

        # Get location
        location = get_item(
            TENANTS_TABLE,
            {'PK': f'TENANT#{tenant_id}', 'SK': f'LOCATION#{location_id}'}
        )

        if not location:
            return error_response('Ubicación no encontrada', 404)

        # Toggle status
        new_status = body.get('isOpen', not location.get('isOpen', True))
        reason = body.get('reason', '')

        update_item(
            TENANTS_TABLE,
            {'PK': f'TENANT#{tenant_id}', 'SK': f'LOCATION#{location_id}'},
            {
                'isOpen': new_status,
                'statusReason': reason,
                'statusChangedAt': datetime.utcnow().isoformat(),
                'statusChangedBy': user.get('userId'),
                'updatedAt': datetime.utcnow().isoformat()
            }
        )

        return success_response({
            'message': f'Ubicación {"abierta" if new_status else "cerrada"} exitosamente',
            'isOpen': new_status,
            'locationId': location_id
        })

    except json.JSONDecodeError:
        return error_response('JSON inválido', 400)
    except Exception as e:
        print(f"Error toggling location status: {str(e)}")
        return error_response(f'Error al cambiar estado: {str(e)}', 500)


def get_location_schedule_handler(event, context):
    """
    Get location schedule and check if currently open
    GET /tenants/{tenantId}/locations/{locationId}/schedule
    """
    try:
        tenant_id = event['pathParameters']['tenantId']
        location_id = event['pathParameters']['locationId']

        location = get_item(
            TENANTS_TABLE,
            {'PK': f'TENANT#{tenant_id}', 'SK': f'LOCATION#{location_id}'}
        )

        if not location:
            return error_response('Ubicación no encontrada', 404)

        schedule = location.get('schedule', {})
        is_manual_open = location.get('isOpen', True)

        # Check if currently open based on schedule
        now = datetime.utcnow()
        day_name = now.strftime('%A').lower()
        current_time = now.strftime('%H:%M')

        day_schedule = schedule.get(day_name, {})
        is_scheduled_open = day_schedule.get('isOpen', True)

        if is_scheduled_open:
            open_time = day_schedule.get('open', '00:00')
            close_time = day_schedule.get('close', '23:59')
            is_within_hours = open_time <= current_time <= close_time
        else:
            is_within_hours = False

        is_currently_open = is_manual_open and is_scheduled_open and is_within_hours

        return success_response({
            'schedule': schedule,
            'currentDay': day_name,
            'currentTime': current_time,
            'isCurrentlyOpen': is_currently_open,
            'isManualOpen': is_manual_open,
            'todaySchedule': day_schedule,
            'statusReason': location.get('statusReason', '')
        })

    except Exception as e:
        print(f"Error getting location schedule: {str(e)}")
        return error_response(f'Error al obtener horario: {str(e)}', 500)
