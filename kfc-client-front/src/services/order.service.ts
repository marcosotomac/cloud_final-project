import apiClient, {
  ApiResponse,
  Order,
  OrderItem,
  Address,
  Rating,
} from "./api";
import { API_CONFIG, ENDPOINTS } from "@/config/api";

export interface CreateOrderData {
  items: OrderItem[];
  deliveryAddress?: Address;
  paymentMethod: string;
  notes?: string;
  promoCode?: string;
}

export interface PaymentData {
  method: string;
  amount: number;
  cardDetails?: {
    number: string;
    expiry: string;
    cvv: string;
    name: string;
  };
}

class OrderService {
  private tenantId = API_CONFIG.TENANT_ID;

  async createOrder(data: CreateOrderData): Promise<ApiResponse<Order>> {
    return apiClient.post<Order>(ENDPOINTS.ORDERS(this.tenantId), data);
  }

  async getOrders(): Promise<ApiResponse<Order[]>> {
    return apiClient.get<Order[]>(ENDPOINTS.ORDERS(this.tenantId));
  }

  async getOrder(orderId: string): Promise<ApiResponse<Order>> {
    return apiClient.get<Order>(ENDPOINTS.ORDER(this.tenantId, orderId));
  }

  async trackOrder(orderId: string): Promise<
    ApiResponse<{
      status: string;
      estimatedTime: string;
      currentStep: number;
      steps: { name: string; completed: boolean; timestamp?: string }[];
    }>
  > {
    return apiClient.get(ENDPOINTS.ORDER_TRACK(this.tenantId, orderId));
  }

  async reorder(orderId: string): Promise<ApiResponse<Order>> {
    return apiClient.post<Order>(
      ENDPOINTS.ORDER_REORDER(this.tenantId, orderId)
    );
  }

  async rateOrder(
    orderId: string,
    rating: number,
    comment?: string
  ): Promise<ApiResponse<Rating>> {
    return apiClient.post<Rating>(
      ENDPOINTS.ORDER_RATING(this.tenantId, orderId),
      {
        rating,
        comment,
      }
    );
  }

  async getOrderRating(orderId: string): Promise<ApiResponse<Rating>> {
    return apiClient.get<Rating>(
      ENDPOINTS.ORDER_RATING(this.tenantId, orderId)
    );
  }

  async processPayment(
    orderId: string,
    paymentData: PaymentData
  ): Promise<
    ApiResponse<{
      paymentId: string;
      status: string;
      transactionId?: string;
    }>
  > {
    return apiClient.post(
      ENDPOINTS.ORDER_PAYMENT(this.tenantId, orderId),
      paymentData
    );
  }
}

export const orderService = new OrderService();
export default orderService;
