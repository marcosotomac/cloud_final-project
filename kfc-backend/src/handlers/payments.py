"""
Payments Handler
Manages payment processing, refunds, and payment methods
"""
import json
import os
from datetime import datetime
from decimal import Decimal

import ulid

from ..utils.response import success_response, error_response, created_response
from ..utils.dynamodb import get_item, put_item, query_items, update_item
from ..utils.auth import get_user_from_token
from ..utils.events import publish_event
from ..utils.websocket import broadcast_order_update


ORDERS_TABLE = os.environ.get('ORDERS_TABLE')
CUSTOMERS_TABLE = os.environ.get('CUSTOMERS_TABLE')


def process_payment_handler(event, context):
    """
    Process a payment for an order
    POST /tenants/{tenantId}/orders/{orderId}/payment
    """
    try:
        tenant_id = event['pathParameters']['tenantId']
        order_id = event['pathParameters']['orderId']

        # Verify authentication
        user = get_user_from_token(event)
        if not user:
            return error_response('No autorizado', 401)

        body = json.loads(event.get('body', '{}'))

        # Get order
        order = get_item(
            ORDERS_TABLE,
            {'PK': f'TENANT#{tenant_id}', 'SK': f'ORDER#{order_id}'}
        )

        if not order:
            return error_response('Orden no encontrada', 404)

        if order.get('paymentStatus') == 'PAID':
            return error_response('Esta orden ya fue pagada', 400)

        # Validate payment method
        payment_method = body.get('paymentMethod')
        if not payment_method:
            return error_response('Método de pago requerido', 400)

        valid_methods = ['CASH', 'CARD', 'YAPE', 'PLIN', 'TRANSFER']
        if payment_method not in valid_methods:
            return error_response(f'Método de pago inválido. Opciones: {", ".join(valid_methods)}', 400)

        # Calculate amounts
        subtotal = Decimal(str(order.get('subtotal', 0)))
        delivery_fee = Decimal(str(order.get('deliveryFee', 0)))
        discount = Decimal(str(order.get('discount', 0)))
        tax = Decimal(str(order.get('tax', 0)))
        tip = Decimal(str(body.get('tip', 0)))

        total = subtotal + delivery_fee - discount + tax + tip

        # Create payment record
        payment_id = str(ulid.new())
        now = datetime.utcnow().isoformat()

        payment = {
            'paymentId': payment_id,
            'orderId': order_id,
            'tenantId': tenant_id,
            'customerId': user.get('userId'),
            'amount': total,
            'subtotal': subtotal,
            'deliveryFee': delivery_fee,
            'discount': discount,
            'tax': tax,
            'tip': tip,
            'paymentMethod': payment_method,
            'status': 'PENDING',
            'createdAt': now
        }

        # Process based on payment method
        if payment_method == 'CASH':
            # Cash payments are marked as pending until delivery
            payment['status'] = 'PENDING_CASH'
            payment['cashAmount'] = Decimal(str(body.get('cashAmount', total)))
            if payment['cashAmount'] >= total:
                payment['change'] = payment['cashAmount'] - total
            else:
                return error_response('Monto insuficiente', 400)

        elif payment_method in ['YAPE', 'PLIN']:
            # Mobile payments - simulate verification
            payment['phoneNumber'] = body.get('phoneNumber', '')
            payment['transactionCode'] = body.get('transactionCode', '')

            # In real implementation, verify with Yape/Plin API
            # For now, auto-approve if transaction code provided
            if payment['transactionCode']:
                payment['status'] = 'COMPLETED'
                payment['completedAt'] = now
            else:
                payment['status'] = 'PENDING_VERIFICATION'

        elif payment_method == 'CARD':
            # Card payments - simulate processing
            card_data = body.get('cardData', {})

            # Validate card data
            if not card_data.get('lastFourDigits'):
                return error_response('Datos de tarjeta incompletos', 400)

            payment['cardLastFour'] = card_data.get('lastFourDigits')
            payment['cardBrand'] = card_data.get('brand', 'VISA')
            payment['cardType'] = card_data.get('type', 'CREDIT')

            # In real implementation, process with payment gateway
            # For now, simulate successful payment
            payment['status'] = 'COMPLETED'
            payment['completedAt'] = now
            payment['authorizationCode'] = f'AUTH{ulid.new()}'[:12].upper()

        elif payment_method == 'TRANSFER':
            # Bank transfer - pending verification
            payment['bankName'] = body.get('bankName', '')
            payment['transferCode'] = body.get('transferCode', '')
            payment['status'] = 'PENDING_VERIFICATION'

        # Store payment record
        payment_item = {
            'PK': f'TENANT#{tenant_id}',
            'SK': f'PAYMENT#{payment_id}',
            'GSI1PK': f'TENANT#{tenant_id}#ORDER#{order_id}',
            'GSI1SK': f'PAYMENT#{payment_id}',
            'GSI2PK': f'TENANT#{tenant_id}#PAYMENTS',
            'GSI2SK': now,
            **payment
        }

        put_item(ORDERS_TABLE, payment_item)

        # Update order with payment info
        order_payment_status = 'PENDING'
        if payment['status'] == 'COMPLETED':
            order_payment_status = 'PAID'
        elif payment['status'] == 'PENDING_CASH':
            order_payment_status = 'PENDING_CASH'
        elif payment['status'] == 'PENDING_VERIFICATION':
            order_payment_status = 'PENDING_VERIFICATION'

        update_item(
            ORDERS_TABLE,
            {'PK': f'TENANT#{tenant_id}', 'SK': f'ORDER#{order_id}'},
            {
                'paymentId': payment_id,
                'paymentStatus': order_payment_status,
                'paymentMethod': payment_method,
                'total': total,
                'tip': tip,
                'paidAt': now if payment['status'] == 'COMPLETED' else None,
                'updatedAt': now
            }
        )

        # Publish event
        publish_event('kfc.payments', 'payment.processed', {
            'tenantId': tenant_id,
            'orderId': order_id,
            'paymentId': payment_id,
            'status': payment['status'],
            'amount': float(total)
        })

        # Broadcast update
        broadcast_order_update(tenant_id, order_id, order_payment_status, {
            'paymentStatus': order_payment_status,
            'paymentMethod': payment_method
        })

        return created_response({
            'message': 'Pago procesado',
            'payment': payment,
            'orderStatus': order_payment_status
        })

    except json.JSONDecodeError:
        return error_response('JSON inválido', 400)
    except Exception as e:
        print(f"Error processing payment: {str(e)}")
        return error_response(f'Error al procesar pago: {str(e)}', 500)


def verify_payment_handler(event, context):
    """
    Verify a pending payment (admin/manager)
    POST /tenants/{tenantId}/payments/{paymentId}/verify
    """
    try:
        tenant_id = event['pathParameters']['tenantId']
        payment_id = event['pathParameters']['paymentId']

        # Verify authentication (admin only)
        user = get_user_from_token(event)
        if not user or user.get('role') not in ['ADMIN', 'MANAGER', 'DISPATCHER']:
            return error_response('No autorizado', 401)

        body = json.loads(event.get('body', '{}'))

        # Get payment
        payment = get_item(
            ORDERS_TABLE,
            {'PK': f'TENANT#{tenant_id}', 'SK': f'PAYMENT#{payment_id}'}
        )

        if not payment:
            return error_response('Pago no encontrado', 404)

        if payment.get('status') not in ['PENDING_VERIFICATION', 'PENDING_CASH']:
            return error_response('Este pago no requiere verificación', 400)

        # Approve or reject
        action = body.get('action', 'approve')
        now = datetime.utcnow().isoformat()

        if action == 'approve':
            new_status = 'COMPLETED'
            payment_updates = {
                'status': new_status,
                'completedAt': now,
                'verifiedBy': user.get('userId'),
                'verificationNote': body.get('note', '')
            }
            order_payment_status = 'PAID'
        else:
            new_status = 'REJECTED'
            payment_updates = {
                'status': new_status,
                'rejectedAt': now,
                'rejectedBy': user.get('userId'),
                'rejectionReason': body.get('reason', 'Pago rechazado')
            }
            order_payment_status = 'PAYMENT_FAILED'

        # Update payment
        update_item(
            ORDERS_TABLE,
            {'PK': f'TENANT#{tenant_id}', 'SK': f'PAYMENT#{payment_id}'},
            payment_updates
        )

        # Update order
        order_id = payment.get('orderId')
        if order_id:
            update_item(
                ORDERS_TABLE,
                {'PK': f'TENANT#{tenant_id}', 'SK': f'ORDER#{order_id}'},
                {
                    'paymentStatus': order_payment_status,
                    'paidAt': now if action == 'approve' else None,
                    'updatedAt': now
                }
            )

            # Broadcast update
            broadcast_order_update(tenant_id, order_id, order_payment_status, {
                'paymentStatus': order_payment_status
            })

        return success_response({
            'message': f'Pago {"aprobado" if action == "approve" else "rechazado"}',
            'status': new_status,
            'paymentId': payment_id
        })

    except json.JSONDecodeError:
        return error_response('JSON inválido', 400)
    except Exception as e:
        print(f"Error verifying payment: {str(e)}")
        return error_response(f'Error al verificar pago: {str(e)}', 500)


def get_order_payments_handler(event, context):
    """
    Get all payments for an order
    GET /tenants/{tenantId}/orders/{orderId}/payments
    """
    try:
        tenant_id = event['pathParameters']['tenantId']
        order_id = event['pathParameters']['orderId']

        payments = query_items(
            ORDERS_TABLE,
            'GSI1PK = :pk',
            {':pk': f'TENANT#{tenant_id}#ORDER#{order_id}'},
            index_name='GSI1'
        )

        # Filter only payment records
        payments = [p for p in payments if p.get(
            'SK', '').startswith('PAYMENT#')]

        return success_response({
            'payments': payments,
            'count': len(payments)
        })

    except Exception as e:
        print(f"Error getting order payments: {str(e)}")
        return error_response(f'Error al obtener pagos: {str(e)}', 500)


def process_refund_handler(event, context):
    """
    Process a refund for an order
    POST /tenants/{tenantId}/orders/{orderId}/refund
    """
    try:
        tenant_id = event['pathParameters']['tenantId']
        order_id = event['pathParameters']['orderId']

        # Verify authentication (admin only)
        user = get_user_from_token(event)
        if not user or user.get('role') not in ['ADMIN', 'MANAGER']:
            return error_response('No autorizado', 401)

        body = json.loads(event.get('body', '{}'))

        # Get order
        order = get_item(
            ORDERS_TABLE,
            {'PK': f'TENANT#{tenant_id}', 'SK': f'ORDER#{order_id}'}
        )

        if not order:
            return error_response('Orden no encontrada', 404)

        if order.get('paymentStatus') != 'PAID':
            return error_response('Solo se pueden reembolsar órdenes pagadas', 400)

        if order.get('refundStatus') == 'REFUNDED':
            return error_response('Esta orden ya fue reembolsada', 400)

        # Calculate refund amount
        total = Decimal(str(order.get('total', 0)))
        refund_amount = Decimal(str(body.get('amount', total)))

        if refund_amount > total:
            return error_response('El monto de reembolso no puede ser mayor al total', 400)

        is_partial = refund_amount < total

        # Create refund record
        refund_id = str(ulid.new())
        now = datetime.utcnow().isoformat()

        refund = {
            'PK': f'TENANT#{tenant_id}',
            'SK': f'REFUND#{refund_id}',
            'GSI1PK': f'TENANT#{tenant_id}#ORDER#{order_id}',
            'GSI1SK': f'REFUND#{refund_id}',
            'refundId': refund_id,
            'orderId': order_id,
            'tenantId': tenant_id,
            'originalPaymentId': order.get('paymentId'),
            'amount': refund_amount,
            'reason': body.get('reason', 'Reembolso solicitado'),
            'type': 'PARTIAL' if is_partial else 'FULL',
            'status': 'COMPLETED',  # In real impl, would be pending
            'processedBy': user.get('userId'),
            'createdAt': now,
            'completedAt': now
        }

        put_item(ORDERS_TABLE, refund)

        # Update order
        refund_status = 'PARTIALLY_REFUNDED' if is_partial else 'REFUNDED'

        update_item(
            ORDERS_TABLE,
            {'PK': f'TENANT#{tenant_id}', 'SK': f'ORDER#{order_id}'},
            {
                'refundStatus': refund_status,
                'refundId': refund_id,
                'refundAmount': refund_amount,
                'refundedAt': now,
                'updatedAt': now
            }
        )

        # Publish event
        publish_event('kfc.payments', 'refund.processed', {
            'tenantId': tenant_id,
            'orderId': order_id,
            'refundId': refund_id,
            'amount': float(refund_amount),
            'type': refund['type']
        })

        return created_response({
            'message': 'Reembolso procesado exitosamente',
            'refund': refund
        })

    except json.JSONDecodeError:
        return error_response('JSON inválido', 400)
    except Exception as e:
        print(f"Error processing refund: {str(e)}")
        return error_response(f'Error al procesar reembolso: {str(e)}', 500)


def get_payment_methods_handler(event, context):
    """
    Get available payment methods for a tenant
    GET /tenants/{tenantId}/payment-methods
    """
    try:
        tenant_id = event['pathParameters']['tenantId']

        # In a real implementation, this would be configurable per tenant
        payment_methods = [
            {
                'id': 'CASH',
                'name': 'Efectivo',
                'description': 'Pago en efectivo al momento de la entrega',
                'icon': 'cash',
                'enabled': True,
                'requiresOnlinePayment': False
            },
            {
                'id': 'CARD',
                'name': 'Tarjeta de crédito/débito',
                'description': 'Visa, Mastercard, American Express',
                'icon': 'credit-card',
                'enabled': True,
                'requiresOnlinePayment': True,
                'supportedCards': ['VISA', 'MASTERCARD', 'AMEX', 'DINERS']
            },
            {
                'id': 'YAPE',
                'name': 'Yape',
                'description': 'Pago con Yape',
                'icon': 'yape',
                'enabled': True,
                'requiresOnlinePayment': True,
                'phoneNumber': '999-888-777'
            },
            {
                'id': 'PLIN',
                'name': 'Plin',
                'description': 'Pago con Plin',
                'icon': 'plin',
                'enabled': True,
                'requiresOnlinePayment': True,
                'phoneNumber': '999-888-777'
            },
            {
                'id': 'TRANSFER',
                'name': 'Transferencia bancaria',
                'description': 'Transferencia a cuenta BCP, Interbank, BBVA',
                'icon': 'bank',
                'enabled': True,
                'requiresOnlinePayment': True,
                'bankAccounts': [
                    {'bank': 'BCP', 'account': '123-456-789'},
                    {'bank': 'Interbank', 'account': '987-654-321'}
                ]
            }
        ]

        return success_response({
            'paymentMethods': payment_methods
        })

    except Exception as e:
        print(f"Error getting payment methods: {str(e)}")
        return error_response(f'Error al obtener métodos de pago: {str(e)}', 500)


def add_saved_card_handler(event, context):
    """
    Save a payment card for a customer
    POST /tenants/{tenantId}/customers/{customerId}/cards
    """
    try:
        tenant_id = event['pathParameters']['tenantId']
        customer_id = event['pathParameters']['customerId']

        # Verify authentication
        user = get_user_from_token(event)
        if not user or user.get('userId') != customer_id:
            return error_response('No autorizado', 401)

        body = json.loads(event.get('body', '{}'))

        # Validate required fields
        required = ['lastFourDigits', 'brand', 'expiryMonth', 'expiryYear']
        missing = [f for f in required if not body.get(f)]
        if missing:
            return error_response(f'Campos requeridos: {", ".join(missing)}', 400)

        # Create card record (tokenized - never store full card number)
        card_id = str(ulid.new())
        now = datetime.utcnow().isoformat()

        card = {
            'PK': f'TENANT#{tenant_id}#CUSTOMER#{customer_id}',
            'SK': f'CARD#{card_id}',
            'cardId': card_id,
            'customerId': customer_id,
            'tenantId': tenant_id,
            'lastFourDigits': body['lastFourDigits'],
            'brand': body['brand'].upper(),
            'type': body.get('type', 'CREDIT'),
            'expiryMonth': body['expiryMonth'],
            'expiryYear': body['expiryYear'],
            'holderName': body.get('holderName', ''),
            'isDefault': body.get('isDefault', False),
            'nickname': body.get('nickname', f'{body["brand"]} ****{body["lastFourDigits"]}'),
            'createdAt': now
        }

        # If this is default, remove default from other cards
        if card['isDefault']:
            existing_cards = query_items(
                CUSTOMERS_TABLE,
                'PK = :pk AND begins_with(SK, :sk)',
                {':pk': f'TENANT#{tenant_id}#CUSTOMER#{customer_id}', ':sk': 'CARD#'}
            )

            for existing in existing_cards:
                if existing.get('isDefault'):
                    update_item(
                        CUSTOMERS_TABLE,
                        {'PK': existing['PK'], 'SK': existing['SK']},
                        {'isDefault': False}
                    )

        put_item(CUSTOMERS_TABLE, card)

        return created_response({
            'message': 'Tarjeta guardada exitosamente',
            'card': {
                'cardId': card_id,
                'lastFourDigits': card['lastFourDigits'],
                'brand': card['brand'],
                'nickname': card['nickname'],
                'isDefault': card['isDefault']
            }
        })

    except json.JSONDecodeError:
        return error_response('JSON inválido', 400)
    except Exception as e:
        print(f"Error saving card: {str(e)}")
        return error_response(f'Error al guardar tarjeta: {str(e)}', 500)


def get_saved_cards_handler(event, context):
    """
    Get saved cards for a customer
    GET /tenants/{tenantId}/customers/{customerId}/cards
    """
    try:
        tenant_id = event['pathParameters']['tenantId']
        customer_id = event['pathParameters']['customerId']

        # Verify authentication
        user = get_user_from_token(event)
        if not user or user.get('userId') != customer_id:
            return error_response('No autorizado', 401)

        cards = query_items(
            CUSTOMERS_TABLE,
            'PK = :pk AND begins_with(SK, :sk)',
            {':pk': f'TENANT#{tenant_id}#CUSTOMER#{customer_id}', ':sk': 'CARD#'}
        )

        # Return only safe fields
        safe_cards = [
            {
                'cardId': c.get('cardId'),
                'lastFourDigits': c.get('lastFourDigits'),
                'brand': c.get('brand'),
                'type': c.get('type'),
                'expiryMonth': c.get('expiryMonth'),
                'expiryYear': c.get('expiryYear'),
                'nickname': c.get('nickname'),
                'isDefault': c.get('isDefault', False)
            }
            for c in cards
        ]

        return success_response({
            'cards': safe_cards,
            'count': len(safe_cards)
        })

    except Exception as e:
        print(f"Error getting saved cards: {str(e)}")
        return error_response(f'Error al obtener tarjetas: {str(e)}', 500)


def delete_saved_card_handler(event, context):
    """
    Delete a saved card
    DELETE /tenants/{tenantId}/customers/{customerId}/cards/{cardId}
    """
    try:
        tenant_id = event['pathParameters']['tenantId']
        customer_id = event['pathParameters']['customerId']
        card_id = event['pathParameters']['cardId']

        # Verify authentication
        user = get_user_from_token(event)
        if not user or user.get('userId') != customer_id:
            return error_response('No autorizado', 401)

        from ..utils.dynamodb import delete_item

        delete_item(
            CUSTOMERS_TABLE,
            {'PK': f'TENANT#{tenant_id}#CUSTOMER#{customer_id}', 'SK': f'CARD#{card_id}'}
        )

        return success_response({'message': 'Tarjeta eliminada exitosamente'})

    except Exception as e:
        print(f"Error deleting card: {str(e)}")
        return error_response(f'Error al eliminar tarjeta: {str(e)}', 500)


def get_daily_revenue_handler(event, context):
    """
    Get daily revenue summary (admin)
    GET /tenants/{tenantId}/payments/daily-revenue
    """
    try:
        tenant_id = event['pathParameters']['tenantId']
        params = event.get('queryStringParameters') or {}

        # Verify authentication
        user = get_user_from_token(event)
        if not user or user.get('role') not in ['ADMIN', 'MANAGER']:
            return error_response('No autorizado', 401)

        date = params.get('date', datetime.utcnow().strftime('%Y-%m-%d'))

        # Get all completed payments for the date
        payments = query_items(
            ORDERS_TABLE,
            'GSI2PK = :pk AND begins_with(GSI2SK, :date)',
            {':pk': f'TENANT#{tenant_id}#PAYMENTS', ':date': date},
            index_name='GSI2'
        )

        # Filter completed payments
        completed = [p for p in payments if p.get('status') == 'COMPLETED']

        # Calculate totals by method
        by_method = {}
        total_revenue = Decimal('0')
        total_tips = Decimal('0')

        for payment in completed:
            method = payment.get('paymentMethod', 'OTHER')
            amount = Decimal(str(payment.get('amount', 0)))
            tip = Decimal(str(payment.get('tip', 0)))

            if method not in by_method:
                by_method[method] = {
                    'count': 0,
                    'total': Decimal('0'),
                    'tips': Decimal('0')
                }

            by_method[method]['count'] += 1
            by_method[method]['total'] += amount
            by_method[method]['tips'] += tip

            total_revenue += amount
            total_tips += tip

        # Convert Decimals to float for JSON
        for method in by_method:
            by_method[method]['total'] = float(by_method[method]['total'])
            by_method[method]['tips'] = float(by_method[method]['tips'])

        return success_response({
            'date': date,
            'totalRevenue': float(total_revenue),
            'totalTips': float(total_tips),
            'transactionCount': len(completed),
            'byPaymentMethod': by_method
        })

    except Exception as e:
        print(f"Error getting daily revenue: {str(e)}")
        return error_response(f'Error al obtener ingresos: {str(e)}', 500)
