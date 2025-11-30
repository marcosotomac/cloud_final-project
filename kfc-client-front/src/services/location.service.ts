import apiClient, { ApiResponse, Location, Address } from "./api";
import { API_CONFIG, ENDPOINTS } from "@/config/api";

export interface DeliveryCheck {
  available: boolean;
  estimatedTime?: number;
  deliveryFee?: number;
  message?: string;
}

class LocationService {
  private tenantId = API_CONFIG.TENANT_ID;

  async getLocations(): Promise<ApiResponse<Location[]>> {
    return apiClient.get<Location[]>(ENDPOINTS.LOCATIONS(this.tenantId));
  }

  async getNearbyLocations(
    lat: number,
    lng: number,
    radius?: number
  ): Promise<ApiResponse<Location[]>> {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
      ...(radius && { radius: radius.toString() }),
    });
    return apiClient.get<Location[]>(
      `${ENDPOINTS.LOCATIONS_NEARBY(this.tenantId)}?${params}`
    );
  }

  async checkDeliveryAvailability(
    address: Address
  ): Promise<ApiResponse<DeliveryCheck>> {
    return apiClient.post<DeliveryCheck>(
      ENDPOINTS.LOCATIONS_CHECK_DELIVERY(this.tenantId),
      { address }
    );
  }

  async getPaymentMethods(): Promise<
    ApiResponse<{ id: string; name: string; type: string }[]>
  > {
    return apiClient.get(ENDPOINTS.PAYMENT_METHODS(this.tenantId));
  }
}

export const locationService = new LocationService();
export default locationService;
