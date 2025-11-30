import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ordersService from "@/services/orders.service";

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
    refetchInterval: 15000, // Refresh every 15 seconds
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

// Workflow mutations
export const useTakeOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await ordersService.takeOrder(orderId);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error);
    },
    onSuccess: (data, orderId) => {
      const newStatus = data?.status || "RECEIVED";
      queryClient.setQueryData(["orders", undefined], (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((o) =>
          (o.orderId || o.id) === orderId
            ? { ...o, status: newStatus, apiStatus: newStatus }
            : o
        );
      });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};

export const useStartCooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await ordersService.startCooking(orderId);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error);
    },
    onSuccess: (data, orderId) => {
      const newStatus = data?.status || "COOKING";
      queryClient.setQueryData(["orders", undefined], (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((o) =>
          (o.orderId || o.id) === orderId
            ? { ...o, status: newStatus, apiStatus: newStatus }
            : o
        );
      });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};

export const useMarkCooked = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await ordersService.markCooked(orderId);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error);
    },
    onSuccess: (data, orderId) => {
      const newStatus = data?.status || "COOKED";
      queryClient.setQueryData(["orders", undefined], (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((o) =>
          (o.orderId || o.id) === orderId
            ? { ...o, status: newStatus, apiStatus: newStatus }
            : o
        );
      });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};

export const usePackOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await ordersService.packOrder(orderId);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error);
    },
    onSuccess: (data, orderId) => {
      const newStatus = data?.status || "PACKED";
      queryClient.setQueryData(["orders", undefined], (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((o) =>
          (o.orderId || o.id) === orderId
            ? { ...o, status: newStatus, apiStatus: newStatus }
            : o
        );
      });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};

export const useStartDelivery = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await ordersService.startDelivery(orderId);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error);
    },
    onSuccess: (data, orderId) => {
      const newStatus = data?.status || "DELIVERING";
      queryClient.setQueryData(["orders", undefined], (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((o) =>
          (o.orderId || o.id) === orderId
            ? { ...o, status: newStatus, apiStatus: newStatus }
            : o
        );
      });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};

export const useCompleteOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await ordersService.completeOrder(orderId);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error);
    },
    onSuccess: (data, orderId) => {
      const newStatus = data?.status || "COMPLETED";
      queryClient.setQueryData(["orders", undefined], (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((o) =>
          (o.orderId || o.id) === orderId
            ? { ...o, status: newStatus, apiStatus: newStatus }
            : o
        );
      });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
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
