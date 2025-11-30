import apiClient, { InventoryItem, ApiResponse } from "./api";
import { ENDPOINTS } from "@/config/api";

interface InventoryAdjustment {
  quantity: number;
  type: "add" | "remove" | "set";
  reason: string;
}

interface InventoryAlert {
  itemId: string;
  itemName: string;
  currentQuantity: number;
  minLevel: number;
  alertType: "low" | "critical" | "out-of-stock";
  createdAt: string;
}

interface InventoryCreateData {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minLevel: number;
  maxLevel: number;
  reorderPoint: number;
}

class InventoryService {
  // Get all inventory items
  async getInventory(filters?: {
    category?: string;
    status?: string;
  }): Promise<ApiResponse<InventoryItem[]>> {
    let endpoint = ENDPOINTS.INVENTORY;
    const params = new URLSearchParams();

    if (filters?.category) params.append("category", filters.category);
    if (filters?.status) params.append("status", filters.status);

    const queryString = params.toString();
    if (queryString) endpoint += `?${queryString}`;

    return apiClient.get<InventoryItem[]>(endpoint);
  }

  // Get single inventory item
  async getInventoryItem(itemId: string): Promise<ApiResponse<InventoryItem>> {
    return apiClient.get<InventoryItem>(ENDPOINTS.INVENTORY_ITEM(itemId));
  }

  // Create new inventory item
  async createInventoryItem(
    data: InventoryCreateData
  ): Promise<ApiResponse<InventoryItem>> {
    return apiClient.post<InventoryItem>(ENDPOINTS.INVENTORY, data);
  }

  // Update inventory item
  async updateInventoryItem(
    itemId: string,
    data: Partial<InventoryCreateData>
  ): Promise<ApiResponse<InventoryItem>> {
    return apiClient.put<InventoryItem>(ENDPOINTS.INVENTORY_ITEM(itemId), data);
  }

  // Adjust inventory quantity
  async adjustInventory(
    itemId: string,
    adjustment: InventoryAdjustment
  ): Promise<ApiResponse<InventoryItem>> {
    return apiClient.post<InventoryItem>(
      ENDPOINTS.INVENTORY_ADJUST(itemId),
      adjustment
    );
  }

  // Get inventory alerts
  async getInventoryAlerts(): Promise<ApiResponse<InventoryAlert[]>> {
    return apiClient.get<InventoryAlert[]>(ENDPOINTS.INVENTORY_ALERTS);
  }

  // Get low stock items
  async getLowStockItems(): Promise<ApiResponse<InventoryItem[]>> {
    return this.getInventory({ status: "low" });
  }

  // Get critical stock items
  async getCriticalStockItems(): Promise<ApiResponse<InventoryItem[]>> {
    return this.getInventory({ status: "critical" });
  }

  // Delete inventory item
  async deleteInventoryItem(itemId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(ENDPOINTS.INVENTORY_ITEM(itemId));
  }

  // Batch update inventory (for stock taking)
  async batchUpdateInventory(
    updates: Array<{ itemId: string; quantity: number }>
  ): Promise<ApiResponse<InventoryItem[]>> {
    return apiClient.post<InventoryItem[]>(`${ENDPOINTS.INVENTORY}/batch`, {
      updates,
    });
  }
}

export const inventoryService = new InventoryService();
export default inventoryService;
