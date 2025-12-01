import { useQuery } from "@tanstack/react-query";
import dashboardService from "@/services/dashboard.service";
import ordersService from "@/services/orders.service";

export const useDashboard = () => {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const response = await dashboardService.getDashboardStats();
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error);
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
        return response.data || [];
      }
      throw new Error(response.error);
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
