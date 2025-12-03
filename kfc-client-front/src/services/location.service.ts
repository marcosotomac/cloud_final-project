import apiClient, { ApiResponse, Location, Address } from "./api";
import { API_CONFIG, ENDPOINTS } from "@/config/api";

export interface DeliveryCheck {
  available: boolean;
  covered: boolean;
  estimatedTime?: number;
  deliveryFee?: number;
  message?: string;
  nearestLocation?: {
    locationId: string;
    name: string;
    distance?: number;
  };
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
    // El backend espera latitude y longitude directamente
    const response = await apiClient.post<{
      available: boolean;
      locations: any[];
      closestLocation: any;
      message: string;
    }>(ENDPOINTS.LOCATIONS_CHECK_DELIVERY(this.tenantId), {
      latitude: address.lat,
      longitude: address.lng,
    });

    // Transformar la respuesta del backend al formato esperado por el frontend
    if (response.success && response.data) {
      const backendData = response.data;
      return {
        ...response,
        data: {
          available: backendData.available,
          covered: backendData.available, // Mapear available a covered
          estimatedTime: backendData.closestLocation?.estimatedTime,
          deliveryFee: backendData.closestLocation?.deliveryFee,
          message: backendData.message,
          nearestLocation: backendData.closestLocation
            ? {
                locationId: backendData.closestLocation.locationId,
                name: backendData.closestLocation.name,
                distance: backendData.closestLocation.distance,
              }
            : undefined,
        },
      };
    }

    return response as ApiResponse<DeliveryCheck>;
  }

  async getPaymentMethods(): Promise<
    ApiResponse<{ id: string; name: string; type: string }[]>
  > {
    return apiClient.get(ENDPOINTS.PAYMENT_METHODS(this.tenantId));
  }
}

export const locationService = new LocationService();
export default locationService;
