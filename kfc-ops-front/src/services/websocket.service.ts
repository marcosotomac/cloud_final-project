import { API_CONFIG } from "@/config/api";
import { Order } from "./api";

type MessageHandler = (data: unknown) => void;

interface WebSocketMessage {
  action: string;
  type?: string;
  data?: unknown;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private isConnecting = false;

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    const token = localStorage.getItem("ops_auth_token");
    const url = `${API_CONFIG.WS_URL}?token=${token}&tenantId=${API_CONFIG.TENANT_ID}&role=staff`;

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log("Operations WebSocket connected");
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.emit("connected", null);

        // Subscribe to operations channel
        this.send({
          action: "subscribe",
          channels: ["orders", "kitchen", "inventory", "staff"],
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      this.ws.onclose = () => {
        console.log("Operations WebSocket disconnected");
        this.isConnecting = false;
        this.emit("disconnected", null);
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error("Operations WebSocket error:", error);
        this.isConnecting = false;
        this.emit("error", error);
      };
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      this.isConnecting = false;
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    const { type, action, data } = message;
    const eventType = type || action;

    if (eventType) {
      this.emit(eventType, data);
    }

    // Handle specific message types for operations
    switch (eventType) {
      case "new_order":
        this.emit("orderReceived", data as Order);
        break;
      case "order_update":
        this.emit("orderUpdated", data as Order);
        break;
      case "order_cancelled":
        this.emit("orderCancelled", data);
        break;
      case "inventory_alert":
        this.emit("inventoryAlert", data);
        break;
      case "staff_update":
        this.emit("staffUpdate", data);
        break;
      case "kitchen_update":
        this.emit("kitchenUpdate", data);
        break;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("Max reconnection attempts reached");
      this.emit("maxReconnectAttemptsReached", null);
      return;
    }

    this.reconnectAttempts++;
    console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);

    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private send(data: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  // Subscribe to events
  on(event: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(event)?.delete(handler);
    };
  }

  private emit(event: string, data: unknown): void {
    this.handlers.get(event)?.forEach((handler) => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in handler for ${event}:`, error);
      }
    });
  }

  // Operations-specific actions
  notifyOrderTaken(orderId: string): void {
    this.send({
      action: "order_taken",
      data: { orderId },
    });
  }

  notifyOrderStatusChange(orderId: string, status: string): void {
    this.send({
      action: "order_status_change",
      data: { orderId, status },
    });
  }

  notifyKitchenUpdate(update: { type: string; data: unknown }): void {
    this.send({
      action: "kitchen_update",
      data: update,
    });
  }

  // Acknowledge order received
  acknowledgeOrder(orderId: string): void {
    this.send({
      action: "acknowledge_order",
      data: { orderId },
    });
  }

  // Staff status update
  updateStaffStatus(staffId: string, status: string): void {
    this.send({
      action: "staff_status",
      data: { staffId, status },
    });
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const websocketService = new WebSocketService();
export default websocketService;
