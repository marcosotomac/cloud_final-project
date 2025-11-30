import apiClient, { ApiResponse } from "./api";
import { ENDPOINTS } from "@/config/api";

interface SalesReport {
  period: string;
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  topItems: Array<{
    itemId: string;
    name: string;
    quantity: number;
    revenue: number;
  }>;
  revenueByCategory: Record<string, number>;
  revenueByHour: Array<{ hour: string; revenue: number }>;
  comparedToPrevious: {
    revenueChange: number;
    ordersChange: number;
  };
}

interface OrdersReport {
  period: string;
  totalOrders: number;
  ordersByStatus: Record<string, number>;
  ordersByType: Record<string, number>;
  avgPrepTime: number;
  avgDeliveryTime: number;
  cancellationRate: number;
  peakHours: Array<{ hour: string; orders: number }>;
}

interface DailyReport {
  date: string;
  summary: {
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
  };
  performance: {
    avgPrepTime: number;
    avgWaitTime: number;
    customerSatisfaction: number;
  };
  inventory: {
    lowStockItems: number;
    outOfStockItems: number;
    restockedItems: number;
  };
  staff: {
    totalOnDuty: number;
    topPerformers: Array<{
      staffId: string;
      name: string;
      ordersCompleted: number;
    }>;
  };
}

class ReportsService {
  // Get sales report
  async getSalesReport(params?: {
    startDate?: string;
    endDate?: string;
    period?: "day" | "week" | "month";
  }): Promise<ApiResponse<SalesReport>> {
    let endpoint = ENDPOINTS.REPORTS_SALES;
    const queryParams = new URLSearchParams();

    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);
    if (params?.period) queryParams.append("period", params.period);

    const queryString = queryParams.toString();
    if (queryString) endpoint += `?${queryString}`;

    return apiClient.get<SalesReport>(endpoint);
  }

  // Get orders report
  async getOrdersReport(params?: {
    startDate?: string;
    endDate?: string;
    period?: "day" | "week" | "month";
  }): Promise<ApiResponse<OrdersReport>> {
    let endpoint = ENDPOINTS.REPORTS_ORDERS;
    const queryParams = new URLSearchParams();

    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);
    if (params?.period) queryParams.append("period", params.period);

    const queryString = queryParams.toString();
    if (queryString) endpoint += `?${queryString}`;

    return apiClient.get<OrdersReport>(endpoint);
  }

  // Get daily report
  async getDailyReport(date?: string): Promise<ApiResponse<DailyReport>> {
    let endpoint = ENDPOINTS.REPORTS_DAILY;

    if (date) {
      endpoint += `?date=${date}`;
    }

    return apiClient.get<DailyReport>(endpoint);
  }

  // Get today's report
  async getTodayReport(): Promise<ApiResponse<DailyReport>> {
    const today = new Date().toISOString().split("T")[0];
    return this.getDailyReport(today);
  }

  // Get this week's sales
  async getWeeklySales(): Promise<ApiResponse<SalesReport>> {
    return this.getSalesReport({ period: "week" });
  }

  // Get this month's sales
  async getMonthlySales(): Promise<ApiResponse<SalesReport>> {
    return this.getSalesReport({ period: "month" });
  }

  // Compare periods
  async comparePeriods(
    period1: { start: string; end: string },
    period2: { start: string; end: string }
  ): Promise<
    ApiResponse<{
      period1: SalesReport;
      period2: SalesReport;
      comparison: {
        revenueChange: number;
        ordersChange: number;
        avgOrderValueChange: number;
      };
    }>
  > {
    const [report1, report2] = await Promise.all([
      this.getSalesReport({ startDate: period1.start, endDate: period1.end }),
      this.getSalesReport({ startDate: period2.start, endDate: period2.end }),
    ]);

    if (report1.success && report2.success && report1.data && report2.data) {
      const revenueChange =
        ((report2.data.totalRevenue - report1.data.totalRevenue) /
          report1.data.totalRevenue) *
        100;
      const ordersChange =
        ((report2.data.totalOrders - report1.data.totalOrders) /
          report1.data.totalOrders) *
        100;
      const avgOrderValueChange =
        ((report2.data.avgOrderValue - report1.data.avgOrderValue) /
          report1.data.avgOrderValue) *
        100;

      return {
        success: true,
        data: {
          period1: report1.data,
          period2: report2.data,
          comparison: {
            revenueChange,
            ordersChange,
            avgOrderValueChange,
          },
        },
      };
    }

    return { success: false, error: report1.error || report2.error };
  }
}

export const reportsService = new ReportsService();
export default reportsService;
