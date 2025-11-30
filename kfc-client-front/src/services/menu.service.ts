import apiClient, { ApiResponse, MenuItem, Rating } from "./api";
import { API_CONFIG, ENDPOINTS } from "@/config/api";

class MenuService {
  private tenantId = API_CONFIG.TENANT_ID;

  async getMenu(): Promise<ApiResponse<MenuItem[]>> {
    return apiClient.get<MenuItem[]>(ENDPOINTS.MENU(this.tenantId));
  }

  async getMenuItem(itemId: string): Promise<ApiResponse<MenuItem>> {
    return apiClient.get<MenuItem>(ENDPOINTS.MENU_ITEM(this.tenantId, itemId));
  }

  async getMenuByCategory(category: string): Promise<ApiResponse<MenuItem[]>> {
    const response = await this.getMenu();
    if (response.success && response.data) {
      return {
        ...response,
        data: response.data.filter((item) => item.category === category),
      };
    }
    return response;
  }

  async getItemReviews(itemId: string): Promise<ApiResponse<Rating[]>> {
    return apiClient.get<Rating[]>(
      ENDPOINTS.MENU_ITEM_REVIEWS(this.tenantId, itemId)
    );
  }

  async addItemReview(
    itemId: string,
    rating: number,
    comment?: string
  ): Promise<ApiResponse<Rating>> {
    return apiClient.post<Rating>(
      ENDPOINTS.MENU_ITEM_REVIEWS(this.tenantId, itemId),
      {
        rating,
        comment,
      }
    );
  }
}

export const menuService = new MenuService();
export default menuService;
