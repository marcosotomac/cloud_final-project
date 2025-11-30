import apiClient, { StaffMember, ApiResponse } from "./api";
import { ENDPOINTS } from "@/config/api";

interface StaffCreateData {
  name: string;
  email: string;
  role: "manager" | "cashier" | "kitchen" | "delivery";
  password?: string;
  phone?: string;
}

interface StaffUpdateData {
  name?: string;
  email?: string;
  role?: "manager" | "cashier" | "kitchen" | "delivery";
  status?: "active" | "inactive" | "on-break";
  shift?: {
    start: string;
    end: string;
  };
}

class StaffService {
  // Get all staff members
  async getStaff(filters?: {
    role?: string;
    status?: string;
  }): Promise<ApiResponse<StaffMember[]>> {
    let endpoint = ENDPOINTS.STAFF;
    const params = new URLSearchParams();

    if (filters?.role) params.append("role", filters.role);
    if (filters?.status) params.append("status", filters.status);

    const queryString = params.toString();
    if (queryString) endpoint += `?${queryString}`;

    return apiClient.get<StaffMember[]>(endpoint);
  }

  // Get single staff member
  async getStaffMember(staffId: string): Promise<ApiResponse<StaffMember>> {
    return apiClient.get<StaffMember>(ENDPOINTS.STAFF_MEMBER(staffId));
  }

  // Create new staff member
  async createStaffMember(
    data: StaffCreateData
  ): Promise<ApiResponse<StaffMember>> {
    return apiClient.post<StaffMember>(ENDPOINTS.STAFF, data);
  }

  // Update staff member
  async updateStaffMember(
    staffId: string,
    data: StaffUpdateData
  ): Promise<ApiResponse<StaffMember>> {
    return apiClient.put<StaffMember>(ENDPOINTS.STAFF_MEMBER(staffId), data);
  }

  // Delete staff member
  async deleteStaffMember(staffId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(ENDPOINTS.STAFF_MEMBER(staffId));
  }

  // Update staff status (active, inactive, on-break)
  async updateStatus(
    staffId: string,
    status: "active" | "inactive" | "on-break"
  ): Promise<ApiResponse<StaffMember>> {
    return this.updateStaffMember(staffId, { status });
  }

  // Get active staff
  async getActiveStaff(): Promise<ApiResponse<StaffMember[]>> {
    return this.getStaff({ status: "active" });
  }

  // Get staff by role
  async getStaffByRole(role: string): Promise<ApiResponse<StaffMember[]>> {
    return this.getStaff({ role });
  }

  // Get kitchen staff
  async getKitchenStaff(): Promise<ApiResponse<StaffMember[]>> {
    return this.getStaffByRole("kitchen");
  }

  // Get delivery staff
  async getDeliveryStaff(): Promise<ApiResponse<StaffMember[]>> {
    return this.getStaffByRole("delivery");
  }

  // Assign shift to staff
  async assignShift(
    staffId: string,
    shift: { start: string; end: string }
  ): Promise<ApiResponse<StaffMember>> {
    return this.updateStaffMember(staffId, { shift });
  }
}

export const staffService = new StaffService();
export default staffService;
