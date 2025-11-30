import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import staffService from "@/services/staff.service";

export const useStaff = (filters?: { role?: string; status?: string }) => {
  return useQuery({
    queryKey: ["staff", filters],
    queryFn: async () => {
      const response = await staffService.getStaff(filters);
      if (response.success) {
        return response.data || [];
      }
      throw new Error(response.error);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useStaffMember = (staffId: string) => {
  return useQuery({
    queryKey: ["staff", staffId],
    queryFn: async () => {
      const response = await staffService.getStaffMember(staffId);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error);
    },
    enabled: !!staffId,
  });
};

export const useActiveStaff = () => {
  return useStaff({ status: "active" });
};

export const useKitchenStaff = () => {
  return useStaff({ role: "kitchen" });
};

export const useDeliveryStaff = () => {
  return useStaff({ role: "delivery" });
};

export const useCreateStaff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      role: "manager" | "cashier" | "kitchen" | "delivery";
      password?: string;
      phone?: string;
    }) => {
      const response = await staffService.createStaffMember(data);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });
};

export const useUpdateStaff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      staffId,
      data,
    }: {
      staffId: string;
      data: Partial<{
        name: string;
        email: string;
        role: "manager" | "cashier" | "kitchen" | "delivery";
        status: "active" | "inactive" | "on-break";
        shift: { start: string; end: string };
      }>;
    }) => {
      const response = await staffService.updateStaffMember(staffId, data);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      queryClient.invalidateQueries({ queryKey: ["staff", variables.staffId] });
    },
  });
};

export const useDeleteStaff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (staffId: string) => {
      const response = await staffService.deleteStaffMember(staffId);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });
};

export const useUpdateStaffStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      staffId,
      status,
    }: {
      staffId: string;
      status: "active" | "inactive" | "on-break";
    }) => {
      const response = await staffService.updateStatus(staffId, status);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      queryClient.invalidateQueries({ queryKey: ["staff", variables.staffId] });
    },
  });
};

export const useAssignShift = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      staffId,
      shift,
    }: {
      staffId: string;
      shift: { start: string; end: string };
    }) => {
      const response = await staffService.assignShift(staffId, shift);
      if (response.success) {
        return response.data;
      }
      throw new Error(response.error);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      queryClient.invalidateQueries({ queryKey: ["staff", variables.staffId] });
    },
  });
};
