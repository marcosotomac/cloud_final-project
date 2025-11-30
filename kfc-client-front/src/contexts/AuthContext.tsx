import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import authService, { LoginData, RegisterData } from "@/services/auth.service";
import { User } from "@/services/api";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginData) => Promise<{ success: boolean; error?: string }>;
  register: (
    data: RegisterData
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const currentUser = authService.getCurrentUser();
    if (currentUser && authService.isAuthenticated()) {
      setUser(currentUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (data: LoginData) => {
    const response = await authService.login(data);
    if (response.success && response.data) {
      const userData: User = {
        userId: response.data.userId,
        email: response.data.email,
        name: response.data.name,
        phone: response.data.phone,
        role: response.data.role,
        tenantId: response.data.tenantId,
      };
      setUser(userData);
      return { success: true };
    }
    return { success: false, error: response.error };
  };

  const register = async (data: RegisterData) => {
    const response = await authService.register(data);
    if (response.success && response.data) {
      const userData: User = {
        userId: response.data.userId,
        email: response.data.email,
        name: response.data.name,
        phone: response.data.phone,
        role: response.data.role,
        tenantId: response.data.tenantId,
      };
      setUser(userData);
      return { success: true };
    }
    return { success: false, error: response.error };
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
