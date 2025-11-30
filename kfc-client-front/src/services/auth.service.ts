import apiClient, { ApiResponse, AuthResponse, User } from "./api";
import { API_CONFIG, ENDPOINTS } from "@/config/api";

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

class AuthService {
  private tenantId = API_CONFIG.TENANT_ID;

  async register(data: RegisterData): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post<AuthResponse>(
      ENDPOINTS.AUTH.REGISTER,
      { ...data, tenantId: this.tenantId }
    );
    if (response.success && response.data?.token) {
      apiClient.setToken(response.data.token);
      const user: User = {
        userId: response.data.userId,
        email: response.data.email,
        name: response.data.name,
        phone: response.data.phone,
        role: response.data.role,
        tenantId: response.data.tenantId,
      };
      localStorage.setItem("kfc_user", JSON.stringify(user));
    }
    return response;
  }

  async login(data: LoginData): Promise<ApiResponse<AuthResponse>> {
    const response = await apiClient.post<AuthResponse>(ENDPOINTS.AUTH.LOGIN, {
      ...data,
      tenantId: this.tenantId,
    });
    if (response.success && response.data?.token) {
      apiClient.setToken(response.data.token);
      const user: User = {
        userId: response.data.userId,
        email: response.data.email,
        name: response.data.name,
        phone: response.data.phone,
        role: response.data.role,
        tenantId: response.data.tenantId,
      };
      localStorage.setItem("kfc_user", JSON.stringify(user));
    }
    return response;
  }

  logout(): void {
    apiClient.clearToken();
    localStorage.removeItem("kfc_user");
    localStorage.removeItem("kfc_token");
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem("kfc_user");
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem("kfc_token");
  }
}

export const authService = new AuthService();
export default authService;
