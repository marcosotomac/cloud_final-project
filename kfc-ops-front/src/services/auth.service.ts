import apiClient, { User, ApiResponse } from "./api";
import { API_CONFIG, ENDPOINTS } from "@/config/api";

export interface LoginData {
  email: string;
  password: string;
  locationId?: string;
}

// Backend returns user data + token in the same object
interface AuthResponse {
  token: string;
  userId: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  tenantId: string;
}

class AuthService {
  private tenantId = API_CONFIG.TENANT_ID;

  async login(data: LoginData): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post<AuthResponse>(ENDPOINTS.LOGIN, {
      ...data,
      tenantId: this.tenantId,
    });

    if (response.success && response.data) {
      apiClient.setToken(response.data.token);
      const user: User = {
        userId: response.data.userId,
        email: response.data.email,
        name: response.data.name,
        role: response.data.role as User["role"],
        tenantId: response.data.tenantId,
      };
      localStorage.setItem("ops_user", JSON.stringify(user));
    }

    return response;
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post(ENDPOINTS.LOGOUT);
    } finally {
      apiClient.setToken(null);
      localStorage.removeItem("ops_user");
    }
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem("ops_user");
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated(): boolean {
    return !!apiClient.getToken() && !!this.getCurrentUser();
  }

  hasRole(role: string | string[]): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
  }

  isManager(): boolean {
    return this.hasRole(["admin", "manager"]);
  }

  isKitchenStaff(): boolean {
    return this.hasRole(["admin", "manager", "kitchen"]);
  }

  isDeliveryStaff(): boolean {
    return this.hasRole(["admin", "manager", "delivery"]);
  }
}

export const authService = new AuthService();
export default authService;
