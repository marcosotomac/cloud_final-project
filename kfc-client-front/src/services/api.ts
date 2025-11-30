import { API_CONFIG } from "@/config/api";

// Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface User {
  userId: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  tenantId: string;
}

// Backend returns user data + token in the same object
export interface AuthResponse {
  token: string;
  userId: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  tenantId: string;
}

export interface MenuItem {
  itemId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  imageUrl?: string;
  available: boolean;
  preparationTime?: number;
  ingredients?: string[];
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  // Extended properties for product detail
  originalPrice?: number;
  customizations?: Array<{
    type: string;
    required?: number;
    options?: Array<{
      id: string;
      name: string;
      extraPrice?: number;
    }>;
  }>;
  allergens?: string[];
  rating?: number;
}

export interface OrderItem {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface Order {
  orderId: string;
  tenantId: string;
  customerId: string;
  items: OrderItem[];
  status: string;
  orderType?: "pickup" | "delivery" | "dine-in";
  total: number;
  subtotal: number;
  tax: number;
  deliveryFee?: number;
  discount?: number;
  deliveryAddress?: Address;
  paymentMethod?: string;
  paymentStatus?: string;
  createdAt: string;
  updatedAt: string;
  estimatedDeliveryTime?: string;
  rating?: number;
}

export interface Address {
  addressId?: string;
  street: string;
  apartment?: string;
  reference?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  isDefault?: boolean;
  label?: string;
}

export interface Location {
  locationId: string;
  name: string;
  address: Address;
  phone: string;
  hours: {
    open: string;
    close: string;
  };
  coordinates?: {
    lat: number;
    lng: number;
  };
  deliveryRadius?: number;
  isOpen?: boolean;
}

export interface Promotion {
  promotionId: string;
  code: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

export interface Rating {
  ratingId: string;
  orderId: string;
  customerId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  reviews: Rating[];
}

// API Client
class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
    this.token = localStorage.getItem("kfc_token");
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem("kfc_token", token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem("kfc_token");
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || data.error || "An error occurred",
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      };
    } catch (error) {
      console.error("API Error:", error);
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

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
