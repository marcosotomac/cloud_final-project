import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ordersService from "@/services/orders.service";

// Helper to update order in cache optimistically
const updateOrderInCache = (
  queryClient: ReturnType<typeof useQueryClient>,
  orderId: string,
  newStatus: string,
  updatedOrder?: any
) => {
  // Get all queries that match ["orders", ...] and update them
  queryClient.setQueriesData({ queryKey: ["orders"] }, (oldData: any) => {
    if (!oldData || !Array.isArray(oldData)) return oldData;
    return oldData.map((order: any) => {
      if ((order.orderId || order.id) === orderId) {
        console.log(
          `[Cache] Updating order ${orderId} from ${order.status} to ${newStatus}`
        );
        // Merge the updated order data
        if (updatedOrder) {
          return { ...order, ...updatedOrder, status: newStatus };
        }
        return { ...order, status: newStatus };
      }
      return order;
    });
  });
};

export const useOrders = (filters?: { status?: string; date?: string }) => {
  return useQuery({
    queryKey: ["orders", filters],
    queryFn: async () => {
      const response = await ordersService.getOrders(filters);
      if (response.success) {
        return response.data || [];
      }
      throw new Error(response.error);
    },
    refetchInterval: 5000, // Refresh every 5 seconds
    staleTime: 2000, // Consider data stale after 2 seconds
  });
};

export const useOrder = (orderId: string) => {
  return useQuery({
    queryKey: ["orders", orderId],
    queryFn: async () => {
      const response = await ordersService.getOrder(orderId);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error);
    },
    enabled: !!orderId,
  });
};

export const useOrderQueue = () => {
  return useQuery({
    queryKey: ["orders", "queue"],
    queryFn: async () => {
      const response = await ordersService.getQueue();
      if (response.success) {
        return response.data || [];
      }
      throw new Error(response.error);
    },
    refetchInterval: 10000,
  });
};

export const usePendingOrders = () => {
  return useOrders({ status: "pending" });
};

export const usePreparingOrders = () => {
  return useOrders({ status: "preparing" });
};

export const useReadyOrders = () => {
  return useOrders({ status: "ready" });
};

// Workflow mutations with optimistic updates
export const useTakeOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      console.log(`[useTakeOrder] Calling API for order: ${orderId}`);
      const response = await ordersService.takeOrder(orderId);
      console.log(`[useTakeOrder] API Response:`, response);
      if (response.success) {
        return {
          orderId,
          status: response.data?.status || "RECEIVED",
          data: response.data,
        };
      }
      throw new Error(response.error || "Error al tomar orden");
    },
    onSuccess: (result) => {
      console.log(
        `[useTakeOrder] Success, updating cache with:`,
        result.status
      );
      // Update cache immediately with the new status
      updateOrderInCache(
        queryClient,
        result.orderId,
        result.status,
        result.data
      );
      // Then invalidate to get fresh data in background
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

export const useStartCooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      console.log(`[useStartCooking] Calling API for order: ${orderId}`);
      const response = await ordersService.startCooking(orderId);
      console.log(`[useStartCooking] API Response:`, response);
      if (response.success) {
        return {
          orderId,
          status: response.data?.status || "COOKING",
          data: response.data,
        };
      }
      throw new Error(response.error || "Error al iniciar cocina");
    },
    onSuccess: (result) => {
      console.log(
        `[useStartCooking] Success, updating cache with:`,
        result.status
      );
      updateOrderInCache(
        queryClient,
        result.orderId,
        result.status,
        result.data
      );
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

export const useMarkCooked = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      console.log(`[useMarkCooked] Calling API for order: ${orderId}`);
      const response = await ordersService.markCooked(orderId);
      console.log(`[useMarkCooked] API Response:`, response);
      if (response.success) {
        return {
          orderId,
          status: response.data?.status || "COOKED",
          data: response.data,
        };
      }
      throw new Error(response.error || "Error al marcar como cocinado");
    },
    onSuccess: (result) => {
      console.log(
        `[useMarkCooked] Success, updating cache with:`,
        result.status
      );
      updateOrderInCache(
        queryClient,
        result.orderId,
        result.status,
        result.data
      );
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

export const usePackOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      console.log(`[usePackOrder] Calling API for order: ${orderId}`);
      const response = await ordersService.packOrder(orderId);
      console.log(`[usePackOrder] API Response:`, response);
      if (response.success) {
        return {
          orderId,
          status: response.data?.status || "PACKED",
          data: response.data,
        };
      }
      throw new Error(response.error || "Error al empacar orden");
    },
    onSuccess: (result) => {
      console.log(
        `[usePackOrder] Success, updating cache with:`,
        result.status
      );
      updateOrderInCache(
        queryClient,
        result.orderId,
        result.status,
        result.data
      );
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

export const useStartDelivery = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      console.log(`[useStartDelivery] Calling API for order: ${orderId}`);
      const response = await ordersService.startDelivery(orderId);
      console.log(`[useStartDelivery] API Response:`, response);
      if (response.success) {
        return {
          orderId,
          status: response.data?.status || "DELIVERING",
          data: response.data,
        };
      }
      throw new Error(response.error || "Error al iniciar delivery");
    },
    onSuccess: (result) => {
      console.log(
        `[useStartDelivery] Success, updating cache with:`,
        result.status
      );
      updateOrderInCache(
        queryClient,
        result.orderId,
        result.status,
        result.data
      );
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

export const useCompleteOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      console.log(`[useCompleteOrder] Calling API for order: ${orderId}`);
      const response = await ordersService.completeOrder(orderId);
      console.log(`[useCompleteOrder] API Response:`, response);
      if (response.success) {
        return {
          orderId,
          status: response.data?.status || "COMPLETED",
          data: response.data,
        };
      }
      throw new Error(response.error || "Error al completar orden");
    },
    onSuccess: (result) => {
      console.log(
        `[useCompleteOrder] Success, updating cache with:`,
        result.status
      );
      updateOrderInCache(
        queryClient,
        result.orderId,
        result.status,
        result.data
      );
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

export const useCancelOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      reason,
    }: {
      orderId: string;
      reason: string;
    }) => {
      const response = await ordersService.cancelOrder(orderId, reason);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

export const useUpdateQueuePriority = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      priority,
    }: {
      orderId: string;
      priority: "normal" | "high" | "urgent";
    }) => {
      const response = await ordersService.updateQueuePriority(
        orderId,
        priority
      );
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", "queue"] });
    },
  });
};
