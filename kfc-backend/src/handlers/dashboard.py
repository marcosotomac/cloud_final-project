"""
Dashboard handlers for analytics and reporting
"""
import json
from datetime import datetime, timedelta
from collections import defaultdict
from boto3.dynamodb.conditions import Key, Attr

from src.utils.response import success_response, error_response
from src.utils.dynamodb import get_orders_table, query_items, scan_items
from src.models.order_status import OrderStatus, WORKFLOW_STEPS, get_status_display_name


def get_dashboard_handler(event, context):
    """Get dashboard summary for a tenant"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')

        if not tenant_id:
            return error_response('Tenant ID is required')

        query_params = event.get('queryStringParameters') or {}
        date_range = query_params.get('range', 'today')  # today, week, month

        table = get_orders_table()

        # Get all orders for the tenant
        orders = query_items(
            table,
            Key('PK').eq(f'TENANT#{tenant_id}') & Key(
                'SK').begins_with('ORDER#')
        )

        now = datetime.utcnow()

        # Filter by date range
        if date_range == 'today':
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        elif date_range == 'week':
            start_date = now - timedelta(days=7)
        elif date_range == 'month':
            start_date = now - timedelta(days=30)
        else:
            start_date = now - timedelta(days=1)

        filtered_orders = []
        for order in orders:
            created_at = order.get('createdAt', '')
            try:
                order_date = datetime.fromisoformat(
                    created_at.replace('Z', '+00:00'))
                if order_date.replace(tzinfo=None) >= start_date:
                    filtered_orders.append(order)
            except:
                pass

        # Calculate statistics
        total_orders = len(filtered_orders)
        total_revenue = sum(order.get('total', 0) for order in filtered_orders)

        # Orders by status
        status_counts = defaultdict(int)
        for order in filtered_orders:
            status_counts[order.get('status', 'UNKNOWN')] += 1

        # Active orders (not completed or cancelled)
        active_statuses = [
            OrderStatus.PENDING.value,
            OrderStatus.RECEIVED.value,
            OrderStatus.COOKING.value,
            OrderStatus.COOKED.value,
            OrderStatus.PACKING.value,
            OrderStatus.PACKED.value,
            OrderStatus.DELIVERING.value
        ]
        active_orders = [o for o in filtered_orders if o.get(
            'status') in active_statuses]

        # Calculate average preparation time (from RECEIVED to PACKED)
        completed_orders = [o for o in filtered_orders if o.get(
            'status') == OrderStatus.COMPLETED.value]
        avg_prep_time = 0
        if completed_orders:
            total_prep_time = 0
            valid_orders = 0
            for order in completed_orders:
                workflow = order.get('workflow', {})
                total_time = workflow.get('totalTimeMinutes', 0)
                if total_time > 0:
                    total_prep_time += total_time
                    valid_orders += 1
            if valid_orders > 0:
                avg_prep_time = total_prep_time / valid_orders

        # Orders by hour (for chart)
        orders_by_hour = defaultdict(int)
        for order in filtered_orders:
            created_at = order.get('createdAt', '')
            try:
                order_date = datetime.fromisoformat(
                    created_at.replace('Z', '+00:00'))
                hour = order_date.strftime('%H:00')
                orders_by_hour[hour] += 1
            except:
                pass

        # Revenue by hour
        revenue_by_hour = defaultdict(float)
        for order in filtered_orders:
            created_at = order.get('createdAt', '')
            try:
                order_date = datetime.fromisoformat(
                    created_at.replace('Z', '+00:00'))
                hour = order_date.strftime('%H:00')
                revenue_by_hour[hour] += order.get('total', 0)
            except:
                pass

        # Top selling items
        item_sales = defaultdict(
            lambda: {'quantity': 0, 'revenue': 0, 'name': ''})
        for order in filtered_orders:
            for item in order.get('items', []):
                item_id = item.get('itemId', item.get('name', 'unknown'))
                item_sales[item_id]['quantity'] += item.get('quantity', 1)
                item_sales[item_id]['revenue'] += item.get(
                    'price', 0) * item.get('quantity', 1)
                item_sales[item_id]['name'] = item.get('name', 'Unknown')

        top_items = sorted(
            [{'itemId': k, **v} for k, v in item_sales.items()],
            key=lambda x: x['quantity'],
            reverse=True
        )[:10]

        dashboard_data = {
            'summary': {
                'totalOrders': total_orders,
                'totalRevenue': round(total_revenue, 2),
                'activeOrders': len(active_orders),
                'completedOrders': len(completed_orders),
                'averageOrderValue': round(total_revenue / total_orders, 2) if total_orders > 0 else 0,
                'averagePrepTime': round(avg_prep_time, 1)
            },
            'ordersByStatus': [
                {
                    'status': status,
                    'displayName': get_status_display_name(status),
                    'count': count
                }
                for status, count in status_counts.items()
            ],
            'activeOrders': sorted(
                active_orders,
                key=lambda x: x.get('createdAt', ''),
                reverse=True
            )[:20],
            'ordersByHour': [
                {'hour': hour, 'count': count}
                for hour, count in sorted(orders_by_hour.items())
            ],
            'revenueByHour': [
                {'hour': hour, 'revenue': round(revenue, 2)}
                for hour, revenue in sorted(revenue_by_hour.items())
            ],
            'topItems': top_items,
            'dateRange': date_range,
            'generatedAt': now.isoformat()
        }

        return success_response(dashboard_data)

    except Exception as e:
        print(f"Get dashboard error: {str(e)}")
        return error_response(f'Failed to get dashboard: {str(e)}', 500)


def get_workflow_stats_handler(event, context):
    """Get workflow statistics for orders"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')

        if not tenant_id:
            return error_response('Tenant ID is required')

        table = get_orders_table()

        # Get completed orders to analyze workflow
        orders = query_items(
            table,
            Key('PK').eq(f'TENANT#{tenant_id}') & Key(
                'SK').begins_with('ORDER#')
        )

        completed_orders = [
            o for o in orders
            if o.get('status') == OrderStatus.COMPLETED.value
        ]

        # Analyze workflow steps timing
        step_times = defaultdict(list)
        staff_performance = defaultdict(
            lambda: {'ordersHandled': 0, 'totalTime': 0})

        for order in completed_orders:
            workflow = order.get('workflow', {})
            steps = workflow.get('steps', [])

            for step in steps:
                step_name = step.get('step', '')
                start_time = step.get('startTime', '')
                end_time = step.get('endTime', '')
                staff_id = step.get('staffId', '')
                staff_name = step.get('staffName', '')

                if start_time and end_time:
                    try:
                        start = datetime.fromisoformat(
                            start_time.replace('Z', '+00:00'))
                        end = datetime.fromisoformat(
                            end_time.replace('Z', '+00:00'))
                        duration = (end - start).total_seconds() / \
                            60  # in minutes
                        step_times[step_name].append(duration)

                        if staff_id:
                            staff_performance[staff_id]['ordersHandled'] += 1
                            staff_performance[staff_id]['totalTime'] += duration
                            staff_performance[staff_id]['name'] = staff_name
                    except:
                        pass

        # Calculate averages for each step
        step_averages = []
        for step_name, times in step_times.items():
            if times:
                step_averages.append({
                    'step': step_name,
                    'averageTime': round(sum(times) / len(times), 2),
                    'minTime': round(min(times), 2),
                    'maxTime': round(max(times), 2),
                    'totalOrders': len(times)
                })

        # Staff performance metrics
        staff_metrics = []
        for staff_id, data in staff_performance.items():
            if data['ordersHandled'] > 0:
                staff_metrics.append({
                    'staffId': staff_id,
                    'staffName': data['name'],
                    'ordersHandled': data['ordersHandled'],
                    'averageTime': round(data['totalTime'] / data['ordersHandled'], 2)
                })

        # Sort by orders handled
        staff_metrics.sort(key=lambda x: x['ordersHandled'], reverse=True)

        # Current queue status
        pending_orders = [o for o in orders if o.get(
            'status') == OrderStatus.PENDING.value]
        cooking_orders = [o for o in orders if o.get(
            'status') == OrderStatus.COOKING.value]
        packing_orders = [o for o in orders if o.get(
            'status') in [OrderStatus.COOKED.value, OrderStatus.PACKING.value]]
        delivery_orders = [o for o in orders if o.get(
            'status') in [OrderStatus.PACKED.value, OrderStatus.DELIVERING.value]]

        workflow_stats = {
            'stepAnalysis': step_averages,
            'staffPerformance': staff_metrics[:10],  # Top 10
            'currentQueue': {
                'pending': len(pending_orders),
                'cooking': len(cooking_orders),
                'packing': len(packing_orders),
                'delivery': len(delivery_orders)
            },
            'totalCompleted': len(completed_orders),
            'workflowSteps': WORKFLOW_STEPS,
            'generatedAt': datetime.utcnow().isoformat()
        }

        return success_response(workflow_stats)

    except Exception as e:
        print(f"Get workflow stats error: {str(e)}")
        return error_response(f'Failed to get workflow stats: {str(e)}', 500)
