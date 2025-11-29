"""
Reports handlers for analytics and business intelligence
"""
import json
from datetime import datetime, timedelta
from collections import defaultdict
from boto3.dynamodb.conditions import Key

from src.utils.response import success_response, error_response
from src.utils.dynamodb import get_orders_table, query_items
from src.models.order_status import OrderStatus


def get_sales_report_handler(event, context):
    """Generate sales report for a date range"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')

        if not tenant_id:
            return error_response('Tenant ID is required')

        query_params = event.get('queryStringParameters') or {}
        start_date_str = query_params.get('startDate')
        end_date_str = query_params.get('endDate')
        group_by = query_params.get('groupBy', 'day')  # day, week, month

        # Parse dates
        now = datetime.utcnow()
        if start_date_str:
            start_date = datetime.fromisoformat(
                start_date_str.replace('Z', ''))
        else:
            start_date = now - timedelta(days=7)

        if end_date_str:
            end_date = datetime.fromisoformat(end_date_str.replace('Z', ''))
        else:
            end_date = now

        table = get_orders_table()

        # Get all orders
        orders = query_items(
            table,
            Key('PK').eq(f'TENANT#{tenant_id}') & Key(
                'SK').begins_with('ORDER#')
        )

        # Filter by date range and completed status
        filtered_orders = []
        for order in orders:
            created_at = order.get('createdAt', '')
            try:
                order_date = datetime.fromisoformat(
                    created_at.replace('Z', '+00:00'))
                order_date = order_date.replace(tzinfo=None)
                if start_date <= order_date <= end_date:
                    filtered_orders.append(order)
            except:
                pass

        # Group by time period
        sales_by_period = defaultdict(
            lambda: {'revenue': 0, 'orders': 0, 'items': 0})

        for order in filtered_orders:
            if order.get('status') not in ['CANCELLED']:
                created_at = order.get('createdAt', '')
                try:
                    order_date = datetime.fromisoformat(
                        created_at.replace('Z', '+00:00'))

                    if group_by == 'day':
                        period_key = order_date.strftime('%Y-%m-%d')
                    elif group_by == 'week':
                        period_key = order_date.strftime('%Y-W%W')
                    else:  # month
                        period_key = order_date.strftime('%Y-%m')

                    sales_by_period[period_key]['revenue'] += order.get(
                        'total', 0)
                    sales_by_period[period_key]['orders'] += 1
                    sales_by_period[period_key]['items'] += sum(
                        item.get('quantity', 1) for item in order.get('items', [])
                    )
                except:
                    pass

        # Calculate totals
        total_revenue = sum(p['revenue'] for p in sales_by_period.values())
        total_orders = sum(p['orders'] for p in sales_by_period.values())
        total_items = sum(p['items'] for p in sales_by_period.values())

        # Best selling items
        item_sales = defaultdict(lambda: {'quantity': 0, 'revenue': 0})
        for order in filtered_orders:
            if order.get('status') not in ['CANCELLED']:
                for item in order.get('items', []):
                    name = item.get('name', 'Unknown')
                    qty = item.get('quantity', 1)
                    price = item.get('price', 0)
                    item_sales[name]['quantity'] += qty
                    item_sales[name]['revenue'] += price * qty

        top_items = sorted(
            [{'name': k, **v} for k, v in item_sales.items()],
            key=lambda x: x['quantity'],
            reverse=True
        )[:10]

        # Sales by hour of day
        hourly_sales = defaultdict(lambda: {'revenue': 0, 'orders': 0})
        for order in filtered_orders:
            if order.get('status') not in ['CANCELLED']:
                created_at = order.get('createdAt', '')
                try:
                    order_date = datetime.fromisoformat(
                        created_at.replace('Z', '+00:00'))
                    hour = order_date.strftime('%H:00')
                    hourly_sales[hour]['revenue'] += order.get('total', 0)
                    hourly_sales[hour]['orders'] += 1
                except:
                    pass

        return success_response({
            'period': {
                'startDate': start_date.isoformat(),
                'endDate': end_date.isoformat(),
                'groupBy': group_by
            },
            'summary': {
                'totalRevenue': round(total_revenue, 2),
                'totalOrders': total_orders,
                'totalItems': total_items,
                'averageOrderValue': round(total_revenue / total_orders, 2) if total_orders > 0 else 0
            },
            'salesByPeriod': [
                {'period': k, **v, 'revenue': round(v['revenue'], 2)}
                for k, v in sorted(sales_by_period.items())
            ],
            'topSellingItems': top_items,
            'salesByHour': [
                {'hour': k, 'revenue': round(
                    v['revenue'], 2), 'orders': v['orders']}
                for k, v in sorted(hourly_sales.items())
            ],
            'generatedAt': now.isoformat()
        })

    except Exception as e:
        print(f"Get sales report error: {str(e)}")
        return error_response(f'Failed to generate report: {str(e)}', 500)


def get_performance_report_handler(event, context):
    """Generate staff and operations performance report"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')

        if not tenant_id:
            return error_response('Tenant ID is required')

        query_params = event.get('queryStringParameters') or {}
        days = int(query_params.get('days', 7))

        table = get_orders_table()

        # Get completed orders
        orders = query_items(
            table,
            Key('PK').eq(f'TENANT#{tenant_id}') & Key(
                'SK').begins_with('ORDER#')
        )

        # Filter to last N days and completed
        cutoff = datetime.utcnow() - timedelta(days=days)
        completed_orders = []

        for order in orders:
            if order.get('status') == OrderStatus.COMPLETED.value:
                created_at = order.get('createdAt', '')
                try:
                    order_date = datetime.fromisoformat(
                        created_at.replace('Z', '+00:00'))
                    if order_date.replace(tzinfo=None) >= cutoff:
                        completed_orders.append(order)
                except:
                    pass

        # Staff performance
        staff_stats = defaultdict(lambda: {
            'ordersHandled': 0,
            'totalTime': 0,
            'roles': set()
        })

        # Step timing analysis
        step_times = defaultdict(list)

        for order in completed_orders:
            workflow = order.get('workflow', {})
            steps = workflow.get('steps', [])

            for step in steps:
                staff_id = step.get('staffId')
                staff_name = step.get('staffName', 'Unknown')
                step_name = step.get('step', '')

                if staff_id:
                    staff_stats[staff_id]['name'] = staff_name
                    staff_stats[staff_id]['ordersHandled'] += 1
                    staff_stats[staff_id]['roles'].add(step_name)

                # Calculate step duration
                start_time = step.get('startTime')
                end_time = step.get('endTime')

                if start_time and end_time:
                    try:
                        start = datetime.fromisoformat(
                            start_time.replace('Z', '+00:00'))
                        end = datetime.fromisoformat(
                            end_time.replace('Z', '+00:00'))
                        duration = (end - start).total_seconds() / 60
                        step_times[step_name].append(duration)

                        if staff_id:
                            staff_stats[staff_id]['totalTime'] += duration
                    except:
                        pass

        # Calculate averages
        step_averages = {}
        for step_name, times in step_times.items():
            if times:
                step_averages[step_name] = {
                    'averageMinutes': round(sum(times) / len(times), 2),
                    'minMinutes': round(min(times), 2),
                    'maxMinutes': round(max(times), 2),
                    'count': len(times)
                }

        # Staff rankings
        staff_rankings = []
        for staff_id, stats in staff_stats.items():
            avg_time = stats['totalTime'] / \
                stats['ordersHandled'] if stats['ordersHandled'] > 0 else 0
            staff_rankings.append({
                'staffId': staff_id,
                'staffName': stats['name'],
                'ordersHandled': stats['ordersHandled'],
                'averageTimeMinutes': round(avg_time, 2),
                'roles': list(stats['roles'])
            })

        staff_rankings.sort(key=lambda x: x['ordersHandled'], reverse=True)

        # Order fulfillment times
        fulfillment_times = []
        for order in completed_orders:
            workflow = order.get('workflow', {})
            total_time = workflow.get('totalTimeMinutes', 0)
            if total_time > 0:
                fulfillment_times.append(total_time)

        avg_fulfillment = sum(fulfillment_times) / \
            len(fulfillment_times) if fulfillment_times else 0

        return success_response({
            'period': {
                'days': days,
                'startDate': cutoff.isoformat(),
                'endDate': datetime.utcnow().isoformat()
            },
            'orderMetrics': {
                'totalCompleted': len(completed_orders),
                'averageFulfillmentTime': round(avg_fulfillment, 2),
                'fastestOrder': round(min(fulfillment_times), 2) if fulfillment_times else 0,
                'slowestOrder': round(max(fulfillment_times), 2) if fulfillment_times else 0
            },
            'stepPerformance': step_averages,
            'staffRankings': staff_rankings[:20],
            'generatedAt': datetime.utcnow().isoformat()
        })

    except Exception as e:
        print(f"Get performance report error: {str(e)}")
        return error_response(f'Failed to generate report: {str(e)}', 500)


def get_customer_report_handler(event, context):
    """Generate customer analytics report"""
    try:
        path_params = event.get('pathParameters', {}) or {}
        tenant_id = path_params.get('tenantId')

        if not tenant_id:
            return error_response('Tenant ID is required')

        table = get_orders_table()

        # Get all orders
        orders = query_items(
            table,
            Key('PK').eq(f'TENANT#{tenant_id}') & Key(
                'SK').begins_with('ORDER#')
        )

        # Customer analysis
        customer_stats = defaultdict(lambda: {
            'orderCount': 0,
            'totalSpent': 0,
            'lastOrder': None,
            'firstOrder': None
        })

        for order in orders:
            if order.get('status') not in ['CANCELLED']:
                customer_id = order.get('customerId', 'anonymous')
                customer_name = order.get('customerName', 'Anonymous')

                stats = customer_stats[customer_id]
                stats['name'] = customer_name
                stats['orderCount'] += 1
                stats['totalSpent'] += order.get('total', 0)

                order_date = order.get('createdAt')
                if not stats['firstOrder'] or order_date < stats['firstOrder']:
                    stats['firstOrder'] = order_date
                if not stats['lastOrder'] or order_date > stats['lastOrder']:
                    stats['lastOrder'] = order_date

        # Calculate metrics
        total_customers = len(customer_stats)
        returning_customers = len(
            [c for c in customer_stats.values() if c['orderCount'] > 1])
        new_customers = total_customers - returning_customers

        # Top customers
        top_customers = sorted(
            [
                {
                    'customerId': cid,
                    **stats,
                    'totalSpent': round(stats['totalSpent'], 2),
                    'averageOrder': round(stats['totalSpent'] / stats['orderCount'], 2)
                }
                for cid, stats in customer_stats.items()
            ],
            key=lambda x: x['totalSpent'],
            reverse=True
        )[:20]

        # Customer order frequency distribution
        frequency_dist = defaultdict(int)
        for stats in customer_stats.values():
            count = stats['orderCount']
            if count == 1:
                frequency_dist['1 order'] += 1
            elif count <= 3:
                frequency_dist['2-3 orders'] += 1
            elif count <= 5:
                frequency_dist['4-5 orders'] += 1
            elif count <= 10:
                frequency_dist['6-10 orders'] += 1
            else:
                frequency_dist['10+ orders'] += 1

        # Average order value by customer segment
        total_spent_all = sum(c['totalSpent'] for c in customer_stats.values())
        total_orders_all = sum(c['orderCount']
                               for c in customer_stats.values())

        return success_response({
            'summary': {
                'totalCustomers': total_customers,
                'newCustomers': new_customers,
                'returningCustomers': returning_customers,
                'repeatRate': round(returning_customers / total_customers * 100, 1) if total_customers > 0 else 0,
                'averageOrderValue': round(total_spent_all / total_orders_all, 2) if total_orders_all > 0 else 0,
                'averageOrdersPerCustomer': round(total_orders_all / total_customers, 2) if total_customers > 0 else 0
            },
            'topCustomers': top_customers,
            'frequencyDistribution': dict(frequency_dist),
            'generatedAt': datetime.utcnow().isoformat()
        })

    except Exception as e:
        print(f"Get customer report error: {str(e)}")
        return error_response(f'Failed to generate report: {str(e)}', 500)
