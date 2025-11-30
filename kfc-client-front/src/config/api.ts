// API Configuration for KFC Client Frontend
export const API_CONFIG = {
  BASE_URL: "https://f1n09qhtr6.execute-api.us-east-1.amazonaws.com",
  WS_URL: "wss://7c4562ajgh.execute-api.us-east-1.amazonaws.com/dev",
  TENANT_ID: "kfc-main", // Default tenant ID - can be changed per deployment
};

export const ENDPOINTS = {
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
  // Orders
  ORDERS: (tenantId: string) => `/tenants/${tenantId}/orders`,
  ORDER: (tenantId: string, orderId: string) =>
    `/tenants/${tenantId}/orders/${orderId}`,
  ORDER_TRACK: (tenantId: string, orderId: string) =>
    `/tenants/${tenantId}/orders/${orderId}/track`,
  ORDER_REORDER: (tenantId: string, orderId: string) =>
    `/tenants/${tenantId}/orders/${orderId}/reorder`,
  ORDER_RATING: (tenantId: string, orderId: string) =>
    `/tenants/${tenantId}/orders/${orderId}/rating`,
  ORDER_PAYMENT: (tenantId: string, orderId: string) =>
    `/tenants/${tenantId}/orders/${orderId}/payment`,
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
  // Locations
  LOCATIONS: (tenantId: string) => `/tenants/${tenantId}/locations`,
  LOCATIONS_NEARBY: (tenantId: string) =>
    `/tenants/${tenantId}/locations/nearby`,
  LOCATIONS_CHECK_DELIVERY: (tenantId: string) =>
    `/tenants/${tenantId}/locations/check-delivery`,
  // Payment Methods
  PAYMENT_METHODS: (tenantId: string) => `/tenants/${tenantId}/payment-methods`,
};
