import apiClient, { ApiResponse, Address, MenuItem } from "./api";
import { API_CONFIG, ENDPOINTS } from "@/config/api";
import authService from "./auth.service";

export interface CustomerProfile {
  customerId: string;
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  preferences?: {
    notifications: boolean;
    newsletter: boolean;
    language: string;
  };
}

class CustomerService {
  private tenantId = API_CONFIG.TENANT_ID;

  private getCustomerId(): string {
    const user = authService.getCurrentUser();
    return user?.userId || "";
  }

  async getProfile(): Promise<ApiResponse<CustomerProfile>> {
    const customerId = this.getCustomerId();
    if (!customerId) {
      return { success: false, error: "Not authenticated" };
    }
    return apiClient.get<CustomerProfile>(
      ENDPOINTS.CUSTOMER_PROFILE(this.tenantId, customerId)
    );
  }

  async updateProfile(
    data: Partial<CustomerProfile>
  ): Promise<ApiResponse<CustomerProfile>> {
    const customerId = this.getCustomerId();
    if (!customerId) {
      return { success: false, error: "Not authenticated" };
    }
    return apiClient.put<CustomerProfile>(
      ENDPOINTS.CUSTOMER_PROFILE(this.tenantId, customerId),
      data
    );
  }

  async getFavorites(): Promise<ApiResponse<MenuItem[]>> {
    const customerId = this.getCustomerId();
    if (!customerId) {
      return { success: false, error: "Not authenticated" };
    }
    return apiClient.get<MenuItem[]>(
      ENDPOINTS.CUSTOMER_FAVORITES(this.tenantId, customerId)
    );
  }

  async addFavorite(itemId: string): Promise<ApiResponse<{ message: string }>> {
    const customerId = this.getCustomerId();
    if (!customerId) {
      return { success: false, error: "Not authenticated" };
    }
    return apiClient.post(
      ENDPOINTS.CUSTOMER_FAVORITES(this.tenantId, customerId),
      { itemId }
    );
  }

  async getAddresses(): Promise<ApiResponse<Address[]>> {
    const customerId = this.getCustomerId();
    if (!customerId) {
      return { success: false, error: "Not authenticated" };
    }
    return apiClient.get<Address[]>(
      ENDPOINTS.CUSTOMER_ADDRESSES(this.tenantId, customerId)
    );
  }

  async addAddress(address: Address): Promise<ApiResponse<Address>> {
    const customerId = this.getCustomerId();
    if (!customerId) {
      return { success: false, error: "Not authenticated" };
    }
    return apiClient.post<Address>(
      ENDPOINTS.CUSTOMER_ADDRESSES(this.tenantId, customerId),
      address
    );
  }
}

export const customerService = new CustomerService();
export default customerService;
