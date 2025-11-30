// API Configuration for KFC Operations Frontend
export const API_CONFIG = {
  BASE_URL: "https://9ppqe2n4ul.execute-api.us-east-1.amazonaws.com/dev",
  WS_URL: "wss://7c4562ajgh.execute-api.us-east-1.amazonaws.com/dev",
  TENANT_ID: "kfc-main",
};

export const ENDPOINTS = {
  // Auth
  LOGIN: "/auth/login",
  LOGOUT: "/auth/logout",

  // Dashboard
  DASHBOARD: `/tenants/${API_CONFIG.TENANT_ID}/dashboard`,
  WORKFLOW_STATS: `/tenants/${API_CONFIG.TENANT_ID}/dashboard/workflow-stats`,
  QUEUE_STATS: `/tenants/${API_CONFIG.TENANT_ID}/dashboard/queue-stats`,

  // Orders (Operations)
  ORDERS: `/tenants/${API_CONFIG.TENANT_ID}/orders`,
  ORDER: (orderId: string) =>
    `/tenants/${API_CONFIG.TENANT_ID}/orders/${orderId}`,
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

  // Inventory
  INVENTORY: `/tenants/${API_CONFIG.TENANT_ID}/inventory`,
  INVENTORY_ITEM: (itemId: string) =>
    `/tenants/${API_CONFIG.TENANT_ID}/inventory/${itemId}`,
  INVENTORY_ADJUST: (itemId: string) =>
    `/tenants/${API_CONFIG.TENANT_ID}/inventory/${itemId}/adjust`,
  INVENTORY_ALERTS: `/tenants/${API_CONFIG.TENANT_ID}/inventory/alerts`,

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

  // Promotions Management
  PROMOTIONS: `/tenants/${API_CONFIG.TENANT_ID}/promotions`,
  PROMOTION: (promotionId: string) =>
    `/tenants/${API_CONFIG.TENANT_ID}/promotions/${promotionId}`,

  // Notifications
  NOTIFICATIONS: "/notifications",
  NOTIFICATION_HISTORY: "/notifications/history",
  NOTIFICATION_READ: (notificationId: string) =>
    `/notifications/${notificationId}/read`,
};
