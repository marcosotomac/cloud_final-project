import { useQuery } from "@tanstack/react-query";
import dashboardService from "@/services/dashboard.service";
import ordersService from "@/services/orders.service";

// Transform backend response to frontend expected format
const transformDashboardData = (backendData: any) => {
  const summary = backendData?.summary || {};
  const ordersByHour = backendData?.ordersByHour || [];
  const revenueByHour = backendData?.revenueByHour || [];
  const topItems = backendData?.topItems || [];
  const activeOrdersList = backendData?.activeOrders || [];

  return {
    // Stats for cards
    salesTotal: summary.totalRevenue || 0,
    salesChange: 0, // Would need historical data to calculate
    activeOrders: summary.activeOrders || 0,
    pendingOrders: activeOrdersList.filter((o: any) => o.status === "PENDING")
      .length,
    customersServed: summary.totalOrders || 0,
    customerChange: 0,
    avgPrepTime: summary.averagePrepTime || 0,
    prepTimeChange: null,

    // Charts
    salesByHour: revenueByHour.map((item: any) => ({
      hour: item.hour,
      ventas: item.revenue || 0,
    })),
    topProducts: topItems.slice(0, 5).map((item: any) => ({
      name: item.name || "Producto",
      sales: item.quantity || 0,
    })),

    // Raw data
    ordersByStatus: backendData?.ordersByStatus || [],
    completedOrders: summary.completedOrders || 0,
    totalRevenue: summary.totalRevenue || 0,
    averageOrderValue: summary.averageOrderValue || 0,
  };
};

export const useDashboard = () => {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const response = await dashboardService.getDashboardStats();
      if (response.success) {
        return transformDashboardData(response.data);
      }
      throw new Error(response.error || "Error al cargar dashboard");
    },
    refetchInterval: 10000, // Refresh every 10 seconds
    staleTime: 5000,
  });
};

export const useRecentOrders = (limit: number = 10) => {
  return useQuery({
    queryKey: ["orders", "recent", limit],
    queryFn: async () => {
      const response = await ordersService.getOrders({ limit });
      if (response.success) {
        // Sort by creation date descending and take latest
        const orders = response.data || [];
        return orders
          .sort(
            (a: any, b: any) =>
              new Date(b.createdAt || 0).getTime() -
              new Date(a.createdAt || 0).getTime()
          )
          .slice(0, limit);
      }
      throw new Error(response.error || "Error al cargar órdenes");
    },
    refetchInterval: 10000, // Refresh every 10 seconds
    staleTime: 5000,
  });
};

export const useWorkflowStats = () => {
  return useQuery({
    queryKey: ["dashboard", "workflow"],
    queryFn: async () => {
      const response = await dashboardService.getWorkflowStats();
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error);
    },
    refetchInterval: 10000,
    staleTime: 5000,
  });
};

export const useQueueStats = () => {
  return useQuery({
    queryKey: ["dashboard", "queue"],
    queryFn: async () => {
      const response = await dashboardService.getQueueStats();
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error);
    },
    refetchInterval: 10000,
    staleTime: 5000,
  });
};

export const useRealtimeMetrics = () => {
  return useQuery({
    queryKey: ["dashboard", "realtime"],
    queryFn: async () => {
      const response = await dashboardService.getRealtimeMetrics();
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error);
    },
    refetchInterval: 10000,
    staleTime: 5000,
  });
};
