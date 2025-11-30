import apiClient, { MenuItem, ApiResponse } from "./api";
import { ENDPOINTS } from "@/config/api";

interface MenuItemCreateData {
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  available?: boolean;
  ingredients?: string[];
  preparationTime?: number;
  nutritionalInfo?: Record<string, number>;
}

class MenuService {
  // Get all menu items
  async getMenu(filters?: {
    category?: string;
  }): Promise<ApiResponse<MenuItem[]>> {
    let endpoint = ENDPOINTS.MENU;

    if (filters?.category) {
      endpoint += `?category=${encodeURIComponent(filters.category)}`;
    }

    return apiClient.get<MenuItem[]>(endpoint);
  }

  // Get single menu item
  async getMenuItem(itemId: string): Promise<ApiResponse<MenuItem>> {
    return apiClient.get<MenuItem>(ENDPOINTS.MENU_ITEM(itemId));
  }

  // Create new menu item
  async createMenuItem(
    data: MenuItemCreateData
  ): Promise<ApiResponse<MenuItem>> {
    return apiClient.post<MenuItem>(ENDPOINTS.MENU, data);
  }

  // Update menu item
  async updateMenuItem(
    itemId: string,
    data: Partial<MenuItemCreateData>
  ): Promise<ApiResponse<MenuItem>> {
    return apiClient.put<MenuItem>(ENDPOINTS.MENU_ITEM(itemId), data);
  }

  // Delete menu item
  async deleteMenuItem(itemId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(ENDPOINTS.MENU_ITEM(itemId));
  }

  // Toggle menu item availability
  async toggleAvailability(
    itemId: string,
    available: boolean
  ): Promise<ApiResponse<MenuItem>> {
    return apiClient.patch<MenuItem>(ENDPOINTS.MENU_ITEM_AVAILABILITY(itemId), {
      available,
    });
  }

  // Get menu categories
  async getCategories(): Promise<ApiResponse<string[]>> {
    const response = await this.getMenu();
    if (response.success && response.data) {
      const categories = [
        ...new Set(response.data.map((item) => item.category)),
      ];
      return { success: true, data: categories };
    }
    return { success: false, error: response.error };
  }

  // Update menu item price
  async updatePrice(
    itemId: string,
    price: number
  ): Promise<ApiResponse<MenuItem>> {
    return this.updateMenuItem(itemId, { price });
  }

  // Bulk update availability
  async bulkUpdateAvailability(
    items: Array<{ itemId: string; available: boolean }>
  ): Promise<ApiResponse<MenuItem[]>> {
    return apiClient.post<MenuItem[]>(`${ENDPOINTS.MENU}/bulk-availability`, {
      items,
    });
  }
}

export const menuService = new MenuService();
export default menuService;
