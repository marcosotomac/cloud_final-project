import { useQuery } from "@tanstack/react-query";
import reportsService from "@/services/reports.service";

export const useSalesReport = (params?: {
  startDate?: string;
  endDate?: string;
  period?: "day" | "week" | "month";
}) => {
  return useQuery({
    queryKey: ["reports", "sales", params],
    queryFn: async () => {
      const response = await reportsService.getSalesReport(params);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useOrdersReport = (params?: {
  startDate?: string;
  endDate?: string;
  period?: "day" | "week" | "month";
}) => {
  return useQuery({
    queryKey: ["reports", "orders", params],
    queryFn: async () => {
      const response = await reportsService.getOrdersReport(params);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error);
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useDailyReport = (date?: string) => {
  return useQuery({
    queryKey: ["reports", "daily", date],
    queryFn: async () => {
      const response = await reportsService.getDailyReport(date);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error);
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useTodayReport = () => {
  const today = new Date().toISOString().split("T")[0];
  return useDailyReport(today);
};

export const useWeeklySales = () => {
  return useSalesReport({ period: "week" });
};

export const useMonthlySales = () => {
  return useSalesReport({ period: "month" });
};
