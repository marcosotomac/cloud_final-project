import { useQuery, useMutation } from "@tanstack/react-query";
import locationService from "@/services/location.service";
import { Address } from "@/services/api";

export const useLocations = () => {
  return useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      const response = await locationService.getLocations();
      if (response.success) {
        return response.data || [];
      }
      throw new Error(response.error);
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useNearbyLocations = (lat?: number, lng?: number) => {
  return useQuery({
    queryKey: ["locations", "nearby", lat, lng],
    queryFn: async () => {
      if (!lat || !lng) return [];
      const response = await locationService.getNearbyLocations(lat, lng);
      if (response.success) {
        return response.data || [];
      }
      throw new Error(response.error);
    },
    enabled: !!lat && !!lng,
  });
};

export const useCheckDelivery = () => {
  return useMutation({
    mutationFn: async (address: Address) => {
      const response = await locationService.checkDeliveryAvailability(address);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error);
    },
  });
};

export const usePaymentMethods = () => {
  return useQuery({
    queryKey: ["payment-methods"],
    queryFn: async () => {
      const response = await locationService.getPaymentMethods();
      if (response.success) {
        return response.data || [];
      }
      throw new Error(response.error);
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};
