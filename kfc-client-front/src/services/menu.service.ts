import apiClient, { ApiResponse, MenuItem, Rating, ReviewSummary } from "./api";
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

  async getItemReviews(itemId: string): Promise<ApiResponse<ReviewSummary>> {
    const response = await apiClient.get<Rating[]>(
      ENDPOINTS.MENU_ITEM_REVIEWS(this.tenantId, itemId)
    );

    // Transform Rating[] to ReviewSummary
    if (response.success && response.data) {
      const ratings = response.data;
      const totalReviews = ratings.length;
      const averageRating =
        totalReviews > 0
          ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalReviews
          : 0;

      return {
        success: true,
        data: {
          averageRating,
          totalReviews,
          reviews: ratings,
        },
      };
    }

    return {
      success: response.success,
      data: { averageRating: 0, totalReviews: 0, reviews: [] },
      error: response.error,
    };
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
