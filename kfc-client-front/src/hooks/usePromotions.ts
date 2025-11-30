import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import promotionService from "@/services/promotion.service";

export const useActivePromotions = () => {
  return useQuery({
    queryKey: ["promotions", "active"],
    queryFn: async () => {
      const response = await promotionService.getActivePromotions();
      if (response.success) {
        return response.data || [];
      }
      throw new Error(response.error);
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Alias for backward compatibility
export const usePromotions = useActivePromotions;

export const useValidatePromoCode = () => {
  return useMutation({
    mutationFn: async (code: string) => {
      const response = await promotionService.validatePromoCode(code);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error);
    },
  });
};

export const useApplyPromoCode = () => {
  return useMutation({
    mutationFn: async ({
      code,
      orderTotal,
    }: {
      code: string;
      orderTotal: number;
    }) => {
      const response = await promotionService.applyPromoCode(code, orderTotal);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error);
    },
  });
};
