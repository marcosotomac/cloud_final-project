import apiClient, { Order, ApiResponse } from "./api";
import { ENDPOINTS } from "@/config/api";

type WorkflowAction =
  | "take"
  | "cook"
  | "cooked"
  | "pack"
  | "deliver"
  | "complete";

interface QueueOrder extends Order {
  position: number;
  priority: "normal" | "high" | "urgent";
  waitTime: number;
}

class OrdersService {
  // Get all orders with optional filters
  async getOrders(filters?: {
    status?: string;
    date?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Order[]>> {
    let endpoint = ENDPOINTS.ORDERS;
    const params = new URLSearchParams();

    if (filters?.status) params.append("status", filters.status);
    if (filters?.date) params.append("date", filters.date);
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());

    const queryString = params.toString();
    if (queryString) endpoint += `?${queryString}`;

    return apiClient.get<Order[]>(endpoint);
  }

  // Get single order details
  async getOrder(orderId: string): Promise<ApiResponse<Order>> {
    return apiClient.get<Order>(ENDPOINTS.ORDER(orderId));
  }

  // Get orders in queue
  async getQueue(): Promise<ApiResponse<QueueOrder[]>> {
    return apiClient.get<QueueOrder[]>(ENDPOINTS.QUEUE);
  }

  // Update order priority in queue
  async updateQueuePriority(
    orderId: string,
    priority: "normal" | "high" | "urgent"
  ): Promise<ApiResponse<void>> {
    return apiClient.put(ENDPOINTS.ORDER_QUEUE_PRIORITY(orderId), { priority });
  }

  // Workflow Actions
  async takeOrder(orderId: string): Promise<ApiResponse<Order>> {
    return apiClient.post<Order>(ENDPOINTS.WORKFLOW_TAKE(orderId));
  }

  async startCooking(orderId: string): Promise<ApiResponse<Order>> {
    return apiClient.post<Order>(ENDPOINTS.WORKFLOW_COOK(orderId));
  }

  async markCooked(orderId: string): Promise<ApiResponse<Order>> {
    return apiClient.post<Order>(ENDPOINTS.WORKFLOW_COOKED(orderId));
  }

  async packOrder(orderId: string): Promise<ApiResponse<Order>> {
    return apiClient.post<Order>(ENDPOINTS.WORKFLOW_PACK(orderId));
  }

  async startDelivery(orderId: string): Promise<ApiResponse<Order>> {
    return apiClient.post<Order>(ENDPOINTS.WORKFLOW_DELIVER(orderId));
  }

  async completeOrder(orderId: string): Promise<ApiResponse<Order>> {
    return apiClient.post<Order>(ENDPOINTS.WORKFLOW_COMPLETE(orderId));
  }

  // Generic workflow action
  async executeWorkflow(
    orderId: string,
    action: WorkflowAction
  ): Promise<ApiResponse<Order>> {
    const actionMap = {
      take: this.takeOrder,
      cook: this.startCooking,
      cooked: this.markCooked,
      pack: this.packOrder,
      deliver: this.startDelivery,
      complete: this.completeOrder,
    };

    return actionMap[action].call(this, orderId);
  }

  // Cancel order
  async cancelOrder(
    orderId: string,
    reason: string
  ): Promise<ApiResponse<Order>> {
    return apiClient.put<Order>(ENDPOINTS.ORDER(orderId), {
      status: "cancelled",
      cancellationReason: reason,
    });
  }

  // Get orders by status for workflow view
  async getOrdersByStatus(status: string): Promise<ApiResponse<Order[]>> {
    return this.getOrders({ status });
  }

  // Get pending orders (new orders to process)
  async getPendingOrders(): Promise<ApiResponse<Order[]>> {
    return this.getOrdersByStatus("pending");
  }

  // Get orders being prepared
  async getPreparingOrders(): Promise<ApiResponse<Order[]>> {
    return this.getOrdersByStatus("preparing");
  }

  // Get orders ready for pickup/delivery
  async getReadyOrders(): Promise<ApiResponse<Order[]>> {
    return this.getOrdersByStatus("ready");
  }
}

export const ordersService = new OrdersService();
export default ordersService;
