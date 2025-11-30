import apiClient, { User, ApiResponse } from "./api";
import { ENDPOINTS } from "@/config/api";

export interface LoginData {
  email: string;
  password: string;
  locationId?: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

class AuthService {
  async login(data: LoginData): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post<AuthResponse>(ENDPOINTS.LOGIN, data);

    if (response.success && response.data) {
      apiClient.setToken(response.data.token);
      localStorage.setItem("ops_user", JSON.stringify(response.data.user));
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
