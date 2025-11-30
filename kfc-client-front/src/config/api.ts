// API Configuration for KFC Client Frontend
export const API_CONFIG = {
  BASE_URL: "https://f1n09qhtr6.execute-api.us-east-1.amazonaws.com",
  WS_URL: "wss://7c4562ajgh.execute-api.us-east-1.amazonaws.com/dev",
  TENANT_ID: "kfc-main", // Default tenant ID - can be changed per deployment
};

export const ENDPOINTS = {
  // Tenants
  TENANTS: "/tenants",
  TENANT: (tenantId: string) => `/tenants/${tenantId}`,

  // Auth
  AUTH: {
    REGISTER: "/auth/register",
    LOGIN: "/auth/login",
  },

  // Menu
  MENU: (tenantId: string) => `/tenants/${tenantId}/menu`,
  MENU_ITEM: (tenantId: string, itemId: string) =>
    `/tenants/${tenantId}/menu/${itemId}`,
  MENU_ITEM_REVIEWS: (tenantId: string, itemId: string) =>
    `/tenants/${tenantId}/menu/${itemId}/reviews`,

  // Uploads
  UPLOAD_URL: (tenantId: string) => `/tenants/${tenantId}/uploads/url`,

  // Orders
  ORDERS: (tenantId: string) => `/tenants/${tenantId}/orders`,
  ORDER: (tenantId: string, orderId: string) =>
    `/tenants/${tenantId}/orders/${orderId}`,
  ORDERS_BY_STATUS: (tenantId: string, status: string) =>
    `/tenants/${tenantId}/orders/status/${status}`,
  ORDER_UPDATE: (tenantId: string, orderId: string) =>
    `/tenants/${tenantId}/orders/${orderId}`,
  ORDER_CANCEL: (tenantId: string, orderId: string) =>
    `/tenants/${tenantId}/orders/${orderId}/cancel`,
  ORDER_TRACK: (tenantId: string, orderId: string) =>
    `/tenants/${tenantId}/orders/${orderId}/track`,
  ORDER_REORDER: (tenantId: string, orderId: string) =>
    `/tenants/${tenantId}/orders/${orderId}/reorder`,
  ORDER_WORKFLOW: {
    TAKE: (tenantId: string, orderId: string) =>
      `/tenants/${tenantId}/orders/${orderId}/workflow/take`,
    COOK: (tenantId: string, orderId: string) =>
      `/tenants/${tenantId}/orders/${orderId}/workflow/cook`,
    COOKED: (tenantId: string, orderId: string) =>
      `/tenants/${tenantId}/orders/${orderId}/workflow/cooked`,
    PACK: (tenantId: string, orderId: string) =>
      `/tenants/${tenantId}/orders/${orderId}/workflow/pack`,
    DELIVER: (tenantId: string, orderId: string) =>
      `/tenants/${tenantId}/orders/${orderId}/workflow/deliver`,
    COMPLETE: (tenantId: string, orderId: string) =>
      `/tenants/${tenantId}/orders/${orderId}/workflow/complete`,
  },
  ORDER_RATING: (tenantId: string, orderId: string) =>
    `/tenants/${tenantId}/orders/${orderId}/rating`,
  ORDER_PAYMENT: (tenantId: string, orderId: string) =>
    `/tenants/${tenantId}/orders/${orderId}/payment`,
  ORDER_PAYMENTS: (tenantId: string, orderId: string) =>
    `/tenants/${tenantId}/orders/${orderId}/payments`,

  // Customer
  CUSTOMER_PROFILE: (tenantId: string, customerId: string) =>
    `/tenants/${tenantId}/customers/${customerId}/profile`,
  CUSTOMER_FAVORITES: (tenantId: string, customerId: string) =>
    `/tenants/${tenantId}/customers/${customerId}/favorites`,
  CUSTOMER_ADDRESSES: (tenantId: string, customerId: string) =>
    `/tenants/${tenantId}/customers/${customerId}/addresses`,

  // Promotions
  PROMOTIONS: (tenantId: string) => `/tenants/${tenantId}/promotions`,
  PROMOTIONS_ACTIVE: (tenantId: string) =>
    `/tenants/${tenantId}/promotions/active`,
  PROMOTIONS_VALIDATE: (tenantId: string) =>
    `/tenants/${tenantId}/promotions/validate`,
  PROMOTIONS_APPLY: (tenantId: string) =>
    `/tenants/${tenantId}/promotions/apply`,

  // Ratings
  TENANT_RATINGS: (tenantId: string) => `/tenants/${tenantId}/ratings`,

  // Locations
  LOCATIONS: (tenantId: string) => `/tenants/${tenantId}/locations`,
  LOCATIONS_NEARBY: (tenantId: string) =>
    `/tenants/${tenantId}/locations/nearby`,
  LOCATIONS_CHECK_DELIVERY: (tenantId: string) =>
    `/tenants/${tenantId}/locations/check-delivery`,
  LOCATION: (tenantId: string, locationId: string) =>
    `/tenants/${tenantId}/locations/${locationId}`,

  // Reports
  REPORTS: {
    SALES: (tenantId: string) => `/tenants/${tenantId}/reports/sales`,
    ORDERS: (tenantId: string) => `/tenants/${tenantId}/reports/orders`,
    DAILY: (tenantId: string) => `/tenants/${tenantId}/reports/daily`,
  },

  // Payment Methods
  PAYMENT_METHODS: (tenantId: string) => `/tenants/${tenantId}/payment-methods`,
};
