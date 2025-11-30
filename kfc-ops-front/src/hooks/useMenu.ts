import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import menuService from "@/services/menu.service";

export const useMenu = (filters?: { category?: string }) => {
  return useQuery({
    queryKey: ["menu", filters],
    queryFn: async () => {
      const response = await menuService.getMenu(filters);
      if (response.success) {
        return response.data || [];
      }
      throw new Error(response.error);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useMenuItem = (itemId: string) => {
  return useQuery({
    queryKey: ["menu", itemId],
    queryFn: async () => {
      const response = await menuService.getMenuItem(itemId);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error);
    },
    enabled: !!itemId,
  });
};

export const useMenuCategories = () => {
  return useQuery({
    queryKey: ["menu", "categories"],
    queryFn: async () => {
      const response = await menuService.getCategories();
      if (response.success) {
        return response.data || [];
      }
      throw new Error(response.error);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useCreateMenuItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description: string;
      price: number;
      category: string;
      imageUrl?: string;
      available?: boolean;
      ingredients?: string[];
      preparationTime?: number;
    }) => {
      const response = await menuService.createMenuItem(data);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu"] });
    },
  });
};

export const useUpdateMenuItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      data,
    }: {
      itemId: string;
      data: Partial<{
        name: string;
        description: string;
        price: number;
        category: string;
        imageUrl?: string;
        available?: boolean;
        ingredients?: string[];
        preparationTime?: number;
      }>;
    }) => {
      const response = await menuService.updateMenuItem(itemId, data);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["menu"] });
      queryClient.invalidateQueries({ queryKey: ["menu", variables.itemId] });
    },
  });
};

export const useDeleteMenuItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const response = await menuService.deleteMenuItem(itemId);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["menu"] });
    },
  });
};

export const useToggleAvailability = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      available,
    }: {
      itemId: string;
      available: boolean;
    }) => {
      const response = await menuService.toggleAvailability(itemId, available);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["menu"] });
      queryClient.invalidateQueries({ queryKey: ["menu", variables.itemId] });
    },
  });
};

export const useUpdatePrice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      price,
    }: {
      itemId: string;
      price: number;
    }) => {
      const response = await menuService.updatePrice(itemId, price);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["menu"] });
      queryClient.invalidateQueries({ queryKey: ["menu", variables.itemId] });
    },
  });
};
