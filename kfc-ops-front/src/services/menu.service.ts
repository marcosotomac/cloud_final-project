import apiClient, { MenuItem, ApiResponse } from "./api";
import { ENDPOINTS } from "@/config/api";

interface MenuItemCreateData {
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  isAvailable?: boolean;
  ingredients?: string[];
  preparationTime?: number;
  nutritionalInfo?: Record<string, number>;
}

class MenuService {
  // Get all menu items
  async getMenu(filters?: {
    category?: string;
    availableOnly?: boolean;
  }): Promise<ApiResponse<MenuItem[]>> {
    const params = new URLSearchParams();

    if (filters?.category) {
      params.append("category", filters.category);
    }

    // For ops panel, show all items by default (including unavailable)
    params.append(
      "availableOnly",
      filters?.availableOnly?.toString() ?? "false"
    );

    const queryString = params.toString();
    const endpoint = queryString
      ? `${ENDPOINTS.MENU}?${queryString}`
      : ENDPOINTS.MENU;

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
      // response.data could be {items: [...]} or directly an array
      const items = (response.data as any)?.items || response.data;
      if (Array.isArray(items)) {
        const categories = [
          ...new Set(items.map((item: MenuItem) => item.category)),
        ];
        return { success: true, data: categories };
      }
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
