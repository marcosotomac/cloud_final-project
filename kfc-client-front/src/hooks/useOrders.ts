import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import orderService, {
  CreateOrderData,
  PaymentData,
} from "@/services/order.service";

export const useOrders = () => {
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const response = await orderService.getOrders();
      if (response.success) {
        return response.data || [];
      }
      throw new Error(response.error);
    },
  });
};

export const useOrder = (orderId: string) => {
  return useQuery({
    queryKey: ["orders", orderId],
    queryFn: async () => {
      const response = await orderService.getOrder(orderId);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error);
    },
    enabled: !!orderId,
  });
};

export const useOrderTracking = (orderId: string) => {
  return useQuery({
    queryKey: ["orders", orderId, "tracking"],
    queryFn: async () => {
      const response = await orderService.trackOrder(orderId);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error);
    },
    enabled: !!orderId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateOrderData) => {
      const response = await orderService.createOrder(data);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};

export const useReorder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const response = await orderService.reorder(orderId);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};

export const useRateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      rating,
      comment,
    }: {
      orderId: string;
      rating: number;
      comment?: string;
    }) => {
      const response = await orderService.rateOrder(orderId, rating, comment);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["orders", variables.orderId],
      });
    },
  });
};

export const useProcessPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      orderId,
      paymentData,
    }: {
      orderId: string;
      paymentData: PaymentData;
    }) => {
      const response = await orderService.processPayment(orderId, paymentData);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["orders", variables.orderId],
      });
    },
  });
};
