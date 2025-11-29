"""
Order status constants and utilities
"""
from enum import Enum
from typing import List


class OrderStatus(Enum):
    """Order status enumeration"""
    PENDING = "PENDING"                 # Order placed by customer
    RECEIVED = "RECEIVED"               # Order received by restaurant
    COOKING = "COOKING"                 # Cook is preparing the order
    COOKED = "COOKED"                   # Food is ready
    PACKING = "PACKING"                 # Dispatcher is packing
    PACKED = "PACKED"                   # Order is packed
    READY_FOR_DELIVERY = "READY_FOR_DELIVERY"  # Ready for delivery
    DELIVERING = "DELIVERING"           # Delivery in progress
    DELIVERED = "DELIVERED"             # Delivered to customer
    COMPLETED = "COMPLETED"             # Order completed
    CANCELLED = "CANCELLED"             # Order cancelled


class UserRole(Enum):
    """User role enumeration"""
    CUSTOMER = "CUSTOMER"
    COOK = "COOK"
    DISPATCHER = "DISPATCHER"
    DELIVERY = "DELIVERY"
    MANAGER = "MANAGER"
    ADMIN = "ADMIN"


# Workflow steps configuration
WORKFLOW_STEPS = [
    {
        'status': OrderStatus.PENDING.value,
        'name': 'Pedido Realizado',
        'description': 'El cliente ha realizado el pedido',
        'icon': 'shopping-cart'
    },
    {
        'status': OrderStatus.RECEIVED.value,
        'name': 'Pedido Recibido',
        'description': 'El restaurante ha recibido el pedido',
        'icon': 'inbox'
    },
    {
        'status': OrderStatus.COOKING.value,
        'name': 'En Preparación',
        'description': 'El cocinero está preparando el pedido',
        'icon': 'fire'
    },
    {
        'status': OrderStatus.COOKED.value,
        'name': 'Comida Lista',
        'description': 'La comida está lista',
        'icon': 'check-circle'
    },
    {
        'status': OrderStatus.PACKING.value,
        'name': 'Empacando',
        'description': 'El despachador está empacando el pedido',
        'icon': 'package'
    },
    {
        'status': OrderStatus.PACKED.value,
        'name': 'Empacado',
        'description': 'El pedido está empacado y listo',
        'icon': 'box'
    },
    {
        'status': OrderStatus.DELIVERING.value,
        'name': 'En Camino',
        'description': 'El repartidor está en camino',
        'icon': 'truck'
    },
    {
        'status': OrderStatus.DELIVERED.value,
        'name': 'Entregado',
        'description': 'El pedido ha sido entregado',
        'icon': 'home'
    },
    {
        'status': OrderStatus.COMPLETED.value,
        'name': 'Completado',
        'description': 'Pedido completado exitosamente',
        'icon': 'check-double'
    }
]


def get_next_status(current_status: str) -> str:
    """
    Get the next status in the workflow

    Args:
        current_status: Current order status

    Returns:
        Next status string
    """
    status_flow = [
        OrderStatus.PENDING.value,
        OrderStatus.RECEIVED.value,
        OrderStatus.COOKING.value,
        OrderStatus.COOKED.value,
        OrderStatus.PACKING.value,
        OrderStatus.PACKED.value,
        OrderStatus.DELIVERING.value,
        OrderStatus.DELIVERED.value,
        OrderStatus.COMPLETED.value
    ]

    try:
        current_index = status_flow.index(current_status)
        if current_index < len(status_flow) - 1:
            return status_flow[current_index + 1]
    except ValueError:
        pass

    return current_status


def get_allowed_roles_for_action(action: str) -> List[str]:
    """
    Get allowed roles for a specific action

    Args:
        action: The action to perform

    Returns:
        List of allowed roles
    """
    action_roles = {
        'take_order': [UserRole.COOK.value, UserRole.MANAGER.value, UserRole.ADMIN.value],
        'start_cooking': [UserRole.COOK.value, UserRole.MANAGER.value, UserRole.ADMIN.value],
        'finish_cooking': [UserRole.COOK.value, UserRole.MANAGER.value, UserRole.ADMIN.value],
        'pack_order': [UserRole.DISPATCHER.value, UserRole.MANAGER.value, UserRole.ADMIN.value],
        'start_delivery': [UserRole.DELIVERY.value, UserRole.MANAGER.value, UserRole.ADMIN.value],
        'complete_delivery': [UserRole.DELIVERY.value, UserRole.MANAGER.value, UserRole.ADMIN.value],
        'cancel_order': [UserRole.MANAGER.value, UserRole.ADMIN.value],
        'view_dashboard': [UserRole.MANAGER.value, UserRole.ADMIN.value],
        'manage_menu': [UserRole.MANAGER.value, UserRole.ADMIN.value],
        'manage_staff': [UserRole.MANAGER.value, UserRole.ADMIN.value]
    }

    return action_roles.get(action, [])


def get_status_display_name(status: str) -> str:
    """
    Get display name for a status

    Args:
        status: The status code

    Returns:
        Display name
    """
    display_names = {
        OrderStatus.PENDING.value: 'Pendiente',
        OrderStatus.RECEIVED.value: 'Recibido',
        OrderStatus.COOKING.value: 'Cocinando',
        OrderStatus.COOKED.value: 'Cocinado',
        OrderStatus.PACKING.value: 'Empacando',
        OrderStatus.PACKED.value: 'Empacado',
        OrderStatus.READY_FOR_DELIVERY.value: 'Listo para Envío',
        OrderStatus.DELIVERING.value: 'En Camino',
        OrderStatus.DELIVERED.value: 'Entregado',
        OrderStatus.COMPLETED.value: 'Completado',
        OrderStatus.CANCELLED.value: 'Cancelado'
    }

    return display_names.get(status, status)
