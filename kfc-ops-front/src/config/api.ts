// API Configuration for KFC Operations Frontend
export const API_CONFIG = {
  BASE_URL: "https://f1n09qhtr6.execute-api.us-east-1.amazonaws.com",
  WS_URL: "wss://7c4562ajgh.execute-api.us-east-1.amazonaws.com/dev",
  TENANT_ID: "kfc-main",
};

export const ENDPOINTS = {
  // Tenants
  TENANTS: "/tenants",
  TENANT: (tenantId: string) => `/tenants/${tenantId}`,

  // Auth
  LOGIN: "/auth/login",
  LOGOUT: "/auth/logout",
  REGISTER: "/auth/register",

  // Dashboard
  DASHBOARD: `/tenants/${API_CONFIG.TENANT_ID}/dashboard`,
  WORKFLOW_STATS: `/tenants/${API_CONFIG.TENANT_ID}/dashboard/workflow-stats`,
  QUEUE_STATS: `/tenants/${API_CONFIG.TENANT_ID}/dashboard/queue-stats`,

  // Orders (Operations)
  ORDERS: `/tenants/${API_CONFIG.TENANT_ID}/orders`,
  ORDER: (orderId: string) =>
    `/tenants/${API_CONFIG.TENANT_ID}/orders/${orderId}`,
  ORDERS_BY_STATUS: (status: string) =>
    `/tenants/${API_CONFIG.TENANT_ID}/orders/status/${status}`,
  ORDER_CANCEL: (orderId: string) =>
    `/tenants/${API_CONFIG.TENANT_ID}/orders/${orderId}/cancel`,
  ORDER_TRACK: (orderId: string) =>
    `/tenants/${API_CONFIG.TENANT_ID}/orders/${orderId}/track`,
  ORDER_RATING: (orderId: string) =>
    `/tenants/${API_CONFIG.TENANT_ID}/orders/${orderId}/rating`,
  ORDER_PAYMENT: (orderId: string) =>
    `/tenants/${API_CONFIG.TENANT_ID}/orders/${orderId}/payment`,
  ORDER_PAYMENTS: (orderId: string) =>
    `/tenants/${API_CONFIG.TENANT_ID}/orders/${orderId}/payments`,
  QUEUE: `/tenants/${API_CONFIG.TENANT_ID}/queue`,
  ORDER_QUEUE: (orderId: string) =>
    `/tenants/${API_CONFIG.TENANT_ID}/queue/${orderId}`,
  ORDER_QUEUE_PRIORITY: (orderId: string) =>
    `/tenants/${API_CONFIG.TENANT_ID}/queue/${orderId}/priority`,

  // Order Workflow Actions
  WORKFLOW_TAKE: (orderId: string) =>
    `/tenants/${API_CONFIG.TENANT_ID}/orders/${orderId}/workflow/take`,
  WORKFLOW_COOK: (orderId: string) =>
    `/tenants/${API_CONFIG.TENANT_ID}/orders/${orderId}/workflow/cook`,
  WORKFLOW_COOKED: (orderId: string) =>
    `/tenants/${API_CONFIG.TENANT_ID}/orders/${orderId}/workflow/cooked`,
  WORKFLOW_PACK: (orderId: string) =>
    `/tenants/${API_CONFIG.TENANT_ID}/orders/${orderId}/workflow/pack`,
  WORKFLOW_DELIVER: (orderId: string) =>
    `/tenants/${API_CONFIG.TENANT_ID}/orders/${orderId}/workflow/deliver`,
  WORKFLOW_COMPLETE: (orderId: string) =>
    `/tenants/${API_CONFIG.TENANT_ID}/orders/${orderId}/workflow/complete`,

  // Menu Management
  MENU: `/tenants/${API_CONFIG.TENANT_ID}/menu`,
  MENU_ITEM: (itemId: string) =>
    `/tenants/${API_CONFIG.TENANT_ID}/menu/${itemId}`,
  MENU_ITEM_AVAILABILITY: (itemId: string) =>
    `/tenants/${API_CONFIG.TENANT_ID}/menu/${itemId}/availability`,
  MENU_ITEM_REVIEWS: (itemId: string) =>
    `/tenants/${API_CONFIG.TENANT_ID}/menu/${itemId}/reviews`,

  // Uploads
  UPLOAD_URL: `/tenants/${API_CONFIG.TENANT_ID}/uploads/url`,

  // Inventory
  INVENTORY: `/tenants/${API_CONFIG.TENANT_ID}/inventory`,
  INVENTORY_ITEM: (itemId: string) =>
    `/tenants/${API_CONFIG.TENANT_ID}/inventory/${itemId}`,
  INVENTORY_ADJUST: (itemId: string) =>
    `/tenants/${API_CONFIG.TENANT_ID}/inventory/${itemId}/adjust`,
  INVENTORY_ALERTS: `/tenants/${API_CONFIG.TENANT_ID}/inventory/alerts/low-stock`,

  // Staff Management
  STAFF: `/tenants/${API_CONFIG.TENANT_ID}/staff`,
  STAFF_MEMBER: (staffId: string) =>
    `/tenants/${API_CONFIG.TENANT_ID}/staff/${staffId}`,

  // Reports
  REPORTS_SALES: `/tenants/${API_CONFIG.TENANT_ID}/reports/sales`,
  REPORTS_ORDERS: `/tenants/${API_CONFIG.TENANT_ID}/reports/orders`,
  REPORTS_DAILY: `/tenants/${API_CONFIG.TENANT_ID}/reports/daily`,

  // Locations
  LOCATIONS: `/tenants/${API_CONFIG.TENANT_ID}/locations`,
  LOCATION: (locationId: string) =>
    `/tenants/${API_CONFIG.TENANT_ID}/locations/${locationId}`,
  LOCATIONS_NEARBY: `/tenants/${API_CONFIG.TENANT_ID}/locations/nearby`,
  LOCATIONS_CHECK_DELIVERY: `/tenants/${API_CONFIG.TENANT_ID}/locations/check-delivery`,

  // Promotions Management
  PROMOTIONS: `/tenants/${API_CONFIG.TENANT_ID}/promotions`,
  PROMOTION: (promotionId: string) =>
    `/tenants/${API_CONFIG.TENANT_ID}/promotions/${promotionId}`,
  PROMOTIONS_ACTIVE: `/tenants/${API_CONFIG.TENANT_ID}/promotions/active`,
  PROMOTIONS_VALIDATE: `/tenants/${API_CONFIG.TENANT_ID}/promotions/validate`,
  PROMOTIONS_APPLY: `/tenants/${API_CONFIG.TENANT_ID}/promotions/apply`,

  // Ratings
  RATINGS: `/tenants/${API_CONFIG.TENANT_ID}/ratings`,

  // Payment Methods
  PAYMENT_METHODS: `/tenants/${API_CONFIG.TENANT_ID}/payment-methods`,

  // Notifications
  NOTIFICATIONS: "/notifications",
  NOTIFICATION_HISTORY: "/notifications/history",
  NOTIFICATION_READ: (notificationId: string) =>
    `/notifications/${notificationId}/read`,
};
