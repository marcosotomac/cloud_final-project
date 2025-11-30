import { useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import websocketService from "@/services/websocket.service";
import { Order } from "@/services/api";

export const useWebSocket = () => {
  const queryClient = useQueryClient();
  const isConnected = useRef(false);

  useEffect(() => {
    if (!isConnected.current) {
      websocketService.connect();
      isConnected.current = true;

      // Set up event handlers for query invalidation
      const unsubOrderReceived = websocketService.on("orderReceived", () => {
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      });

      const unsubOrderUpdated = websocketService.on("orderUpdated", () => {
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      });

      const unsubOrderCancelled = websocketService.on("orderCancelled", () => {
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      });

      const unsubInventoryAlert = websocketService.on("inventoryAlert", () => {
        queryClient.invalidateQueries({ queryKey: ["inventory"] });
        queryClient.invalidateQueries({ queryKey: ["inventory", "alerts"] });
      });

      return () => {
        unsubOrderReceived();
        unsubOrderUpdated();
        unsubOrderCancelled();
        unsubInventoryAlert();
      };
    }
  }, [queryClient]);

  const disconnect = useCallback(() => {
    websocketService.disconnect();
    isConnected.current = false;
  }, []);

  return {
    isConnected: websocketService.isConnected(),
    disconnect,
  };
};

export const useOrderNotifications = (
  onNewOrder?: (order: Order) => void,
  onOrderUpdate?: (order: Order) => void
) => {
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    if (onNewOrder) {
      unsubscribers.push(
        websocketService.on("orderReceived", (data) => {
          onNewOrder(data as Order);
        })
      );
    }

    if (onOrderUpdate) {
      unsubscribers.push(
        websocketService.on("orderUpdated", (data) => {
          onOrderUpdate(data as Order);
        })
      );
    }

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [onNewOrder, onOrderUpdate]);
};

export const useInventoryNotifications = (
  onAlert?: (alert: unknown) => void
) => {
  useEffect(() => {
    if (!onAlert) return;

    const unsub = websocketService.on("inventoryAlert", onAlert);
    return unsub;
  }, [onAlert]);
};

export const useKitchenNotifications = (
  onKitchenUpdate?: (update: unknown) => void
) => {
  useEffect(() => {
    if (!onKitchenUpdate) return;

    const unsub = websocketService.on("kitchenUpdate", onKitchenUpdate);
    return unsub;
  }, [onKitchenUpdate]);
};
