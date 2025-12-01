import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import menuService from "@/services/menu.service";

export const useMenu = () => {
  return useQuery({
    queryKey: ["menu"],
    queryFn: async () => {
      const response = await menuService.getMenu();
      if (response.success) {
        // Backend returns { items: [...], categories: {...}, totalItems: N }
        const data = response.data as any;
        return data?.items || data || [];
      }
      throw new Error(response.error);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useMenuByCategory = (category: string) => {
  return useQuery({
    queryKey: ["menu", "category", category],
    queryFn: async () => {
      const response = await menuService.getMenuByCategory(category);
      if (response.success) {
        // Backend returns { items: [...], categories: {...}, totalItems: N }
        const data = response.data as any;
        return data?.items || data || [];
      }
      throw new Error(response.error);
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!category,
  });
};

export const useMenuItem = (itemId: string) => {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: ["menu", "item", itemId],
    queryFn: async () => {
      // First, try to find the item in the cached menu
      const cachedMenu = queryClient.getQueryData<any[]>(["menu"]);
      if (cachedMenu) {
        const item = cachedMenu.find((i: any) => i.itemId === itemId);
        if (item) return item;
      }
      
      // If not in cache, fetch the full menu and find the item
      const response = await menuService.getMenu();
      if (response.success) {
        const data = response.data as any;
        const items = data?.items || data || [];
        const item = items.find((i: any) => i.itemId === itemId);
        if (item) return item;
      }
      
      throw new Error("Producto no encontrado");
    },
    enabled: !!itemId,
  });
};

export const useMenuItemReviews = (itemId: string) => {
  return useQuery({
    queryKey: ["menu", "item", itemId, "reviews"],
    queryFn: async () => {
      const response = await menuService.getItemReviews(itemId);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error);
    },
    enabled: !!itemId,
  });
};

// Alias for backward compatibility
export const useProductReviews = useMenuItemReviews;

export const useAddItemReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      itemId,
      rating,
      comment,
    }: {
      itemId: string;
      rating: number;
      comment?: string;
    }) => {
      const response = await menuService.addItemReview(itemId, rating, comment);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["menu", "item", variables.itemId, "reviews"],
      });
    },
  });
};
