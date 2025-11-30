import apiClient, { ApiResponse, Promotion } from "./api";
import { API_CONFIG, ENDPOINTS } from "@/config/api";

export interface PromoValidation {
  valid: boolean;
  promotion?: Promotion;
  message?: string;
}

export interface ApplyPromoResult {
  discount: number;
  discountType: "percentage" | "fixed";
  newTotal: number;
  message: string;
}

class PromotionService {
  private tenantId = API_CONFIG.TENANT_ID;

  async getActivePromotions(): Promise<ApiResponse<Promotion[]>> {
    return apiClient.get<Promotion[]>(
      ENDPOINTS.PROMOTIONS_ACTIVE(this.tenantId)
    );
  }

  async getAllPromotions(): Promise<ApiResponse<Promotion[]>> {
    return apiClient.get<Promotion[]>(ENDPOINTS.PROMOTIONS(this.tenantId));
  }

  async validatePromoCode(code: string): Promise<ApiResponse<PromoValidation>> {
    return apiClient.post<PromoValidation>(
      ENDPOINTS.PROMOTIONS_VALIDATE(this.tenantId),
      { code }
    );
  }

  async applyPromoCode(
    code: string,
    orderTotal: number
  ): Promise<ApiResponse<ApplyPromoResult>> {
    return apiClient.post<ApplyPromoResult>(
      ENDPOINTS.PROMOTIONS_APPLY(this.tenantId),
      {
        code,
        orderTotal,
      }
    );
  }
}

export const promotionService = new PromotionService();
export default promotionService;
