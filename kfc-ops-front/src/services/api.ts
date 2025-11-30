import { API_CONFIG } from "@/config/api";

// Types for Operations
export interface User {
  userId: string;
  email: string;
  name: string;
  role: "admin" | "manager" | "staff" | "kitchen" | "delivery";
  tenantId: string;
  locationId?: string;
}

export interface Order {
  orderId: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];
  status: OrderStatus;
  orderType: "pickup" | "delivery" | "dine-in";
  subtotal: number;
  tax: number;
  total: number;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  assignedTo?: string;
  estimatedTime?: number;
  createdAt: string;
  updatedAt: string;
  workflowHistory?: WorkflowStep[];
}

export interface OrderItem {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
  customizations?: Record<string, string>;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "cooking"
  | "ready"
  | "packed"
  | "out-for-delivery"
  | "delivered"
  | "completed"
  | "cancelled";

export interface WorkflowStep {
  action: string;
  timestamp: string;
  staffId: string;
  staffName: string;
}

export interface MenuItem {
  itemId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  available: boolean;
  ingredients?: string[];
  preparationTime?: number;
  nutritionalInfo?: Record<string, number>;
}

export interface InventoryItem {
  itemId: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minLevel: number;
  maxLevel: number;
  reorderPoint: number;
  lastUpdated: string;
  status: "ok" | "low" | "critical" | "out-of-stock";
}

export interface StaffMember {
  staffId: string;
  name: string;
  email: string;
  role: "manager" | "cashier" | "kitchen" | "delivery";
  status: "active" | "inactive" | "on-break";
  shift?: {
    start: string;
    end: string;
  };
  performance?: {
    ordersCompleted: number;
    avgTime: number;
    rating: number;
  };
}

export interface DashboardStats {
  ordersToday: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  avgPrepTime: number;
  staffOnDuty: number;
  lowStockItems: number;
  ordersByStatus: Record<string, number>;
  hourlyOrders: { hour: string; count: number }[];
}

export interface WorkflowStats {
  pending: number;
  preparing: number;
  cooking: number;
  ready: number;
  packed: number;
  delivering: number;
  avgWaitTime: number;
  avgPrepTime: number;
  avgDeliveryTime: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// API Client
class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
    this.token = localStorage.getItem("ops_auth_token");
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem("ops_auth_token", token);
    } else {
      localStorage.removeItem("ops_auth_token");
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Tenant-Id": API_CONFIG.TENANT_ID,
        ...(options.headers as Record<string, string>),
      };

      if (this.token) {
        headers["Authorization"] = `Bearer ${this.token}`;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || `Error: ${response.status}`,
        };
      }

      return {
        success: true,
        data: data.body ? JSON.parse(data.body) : data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
