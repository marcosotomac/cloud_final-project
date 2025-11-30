import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import inventoryService from "@/services/inventory.service";

export const useInventory = (filters?: {
  category?: string;
  status?: string;
}) => {
  return useQuery({
    queryKey: ["inventory", filters],
    queryFn: async () => {
      const response = await inventoryService.getInventory(filters);
      if (response.success) {
        return response.data || [];
      }
      throw new Error(response.error);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useInventoryItem = (itemId: string) => {
  return useQuery({
    queryKey: ["inventory", itemId],
    queryFn: async () => {
      const response = await inventoryService.getInventoryItem(itemId);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error);
    },
    enabled: !!itemId,
  });
};

export const useInventoryAlerts = () => {
  return useQuery({
    queryKey: ["inventory", "alerts"],
    queryFn: async () => {
      const response = await inventoryService.getInventoryAlerts();
      if (response.success) {
        return response.data || [];
      }
      throw new Error(response.error);
    },
    refetchInterval: 60000, // Refresh every minute
  });
};

export const useLowStockItems = () => {
  return useInventory({ status: "low" });
};

export const useCriticalStockItems = () => {
  return useInventory({ status: "critical" });
};

export const useCreateInventoryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      category: string;
      quantity: number;
      unit: string;
      minLevel: number;
      maxLevel: number;
      reorderPoint: number;
    }) => {
      const response = await inventoryService.createInventoryItem(data);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
};

export const useUpdateInventoryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      data,
    }: {
      itemId: string;
      data: Partial<{
        name: string;
        category: string;
        quantity: number;
        unit: string;
        minLevel: number;
        maxLevel: number;
        reorderPoint: number;
      }>;
    }) => {
      const response = await inventoryService.updateInventoryItem(itemId, data);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({
        queryKey: ["inventory", variables.itemId],
      });
    },
  });
};

export const useAdjustInventory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      quantity,
      type,
      reason,
    }: {
      itemId: string;
      quantity: number;
      type: "add" | "remove" | "set";
      reason: string;
    }) => {
      const response = await inventoryService.adjustInventory(itemId, {
        quantity,
        type,
        reason,
      });
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({
        queryKey: ["inventory", variables.itemId],
      });
      queryClient.invalidateQueries({ queryKey: ["inventory", "alerts"] });
    },
  });
};

export const useDeleteInventoryItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const response = await inventoryService.deleteInventoryItem(itemId);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
};
