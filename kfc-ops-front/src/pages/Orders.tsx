import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderCard } from "@/components/OrderCard";
import { DndContext, DragEndEvent, closestCorners } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Bell, Loader2, RefreshCw } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { Badge } from "@/components/ui/badge";
import {
  useOrders,
  useTakeOrder,
  useStartCooking,
  useMarkCooked,
  usePackOrder,
  useStartDelivery,
  useCompleteOrder,
} from "@/hooks/useOrders";
import { useWebSocket, useOrderNotifications } from "@/hooks/useWebSocket";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Map API status to UI status
type UIStatus = "pending" | "kitchen" | "packing" | "delivery";
const mapApiStatusToUI = (apiStatus: string): UIStatus => {
  const normalized = (apiStatus || "").toUpperCase();
  const statusMap: Record<string, UIStatus> = {
    PENDING: "pending",
    RECEIVED: "kitchen",
    COOKING: "kitchen",
    COOKED: "packing",
    PACKING: "packing",
    PACKED: "delivery",
    READY_FOR_DELIVERY: "delivery",
    DELIVERING: "delivery",
    DELIVERED: "delivery",
    COMPLETED: "delivery",
  };
  return statusMap[normalized] || "pending";
};

// Transform API order to UI format
interface UIOrder {
  id: string;
  customer: string;
  items: { name: string; quantity: number }[];
  total: number;
  status: UIStatus;
  createdAt: Date;
  apiStatus: string;
}

const Orders = () => {
  const [filterStatus, setFilterStatus] = useState<UIStatus | "all">("all");
  const { addNotification } = useNotifications();
  const queryClient = useQueryClient();

  // Keep WebSocket connected and refresh caches on events
  const { isConnected } = useWebSocket();

  useOrderNotifications(
    (newOrder) => {
      // Upsert new order into cache to show instantly
      queryClient.setQueryData(
        ["orders", undefined],
        (old: any[] | undefined) => {
          const orders = old ? [...old] : [];
          const id = (newOrder as any)?.orderId || (newOrder as any)?.id;
          const existingIndex = orders.findIndex(
            (o: any) => (o.orderId || o.id) === id
          );
          if (existingIndex >= 0) {
            orders[existingIndex] = newOrder as any;
          } else {
            orders.unshift(newOrder as any);
          }
          return orders;
        }
      );
      toast.success("Nuevo pedido recibido");
    },
    (updatedOrder) => {
      queryClient.setQueryData(
        ["orders", undefined],
        (old: any[] | undefined) => {
          const orders = old ? [...old] : [];
          const id =
            (updatedOrder as any)?.orderId || (updatedOrder as any)?.id;
          const existingIndex = orders.findIndex(
            (o: any) => (o.orderId || o.id) === id
          );
          if (existingIndex >= 0) {
            orders[existingIndex] = {
              ...orders[existingIndex],
              ...updatedOrder,
            };
          } else {
            orders.unshift(updatedOrder as any);
          }
          return orders;
        }
      );
    }
  );

  // Fetch real orders from API
  const {
    data: apiOrders = [],
    isLoading,
    refetch,
    isRefetching,
  } = useOrders();

  // Workflow mutations
  const takeOrder = useTakeOrder();
  const startCooking = useStartCooking();
  const finishCooking = useMarkCooked();
  const packOrder = usePackOrder();
  const startDelivery = useStartDelivery();
  const completeOrder = useCompleteOrder();
  const isMutating =
    takeOrder.isPending ||
    startCooking.isPending ||
    finishCooking.isPending ||
    packOrder.isPending ||
    startDelivery.isPending ||
    completeOrder.isPending;

  // Transform API orders to UI format
  const orders: UIOrder[] = useMemo(() => {
    if (!Array.isArray(apiOrders)) return [];

    return apiOrders.map((order: any) => ({
      id: order.orderId || order.id,
      customer: order.customerName || order.customer?.name || "Cliente",
      items:
        order.items?.map((item: any) => ({
          name: item.name || item.menuItemName || "Producto",
          quantity: item.quantity || 1,
        })) || [],
      total: order.total || order.totalAmount || 0,
      status: mapApiStatusToUI(order.status),
      createdAt: new Date(order.createdAt || Date.now()),
      apiStatus: order.status,
    }));
  }, [apiOrders]);

  const handleStatusChange = async (orderId: string) => {
    // Get fresh order state from apiOrders (not transformed)
    const apiOrder = apiOrders.find(
      (o: any) => (o.orderId || o.id) === orderId
    );
    if (!apiOrder) {
      toast.error("Orden no encontrada");
      return;
    }

    // Normalize to uppercase to match backend enum
    const backendStatus = ((apiOrder as any).status || "").toUpperCase();
    console.log(`[Workflow] Order ${orderId} current status: ${backendStatus}`);

    try {
      // Flow: PENDING -> RECEIVED -> COOKING -> COOKED -> PACKED -> DELIVERING -> COMPLETED
      let result;
      if (backendStatus === "PENDING") {
        result = await takeOrder.mutateAsync(orderId);
        toast.success(`Orden ${orderId} aceptada → RECEIVED`);
      } else if (backendStatus === "RECEIVED") {
        result = await startCooking.mutateAsync(orderId);
        toast.success(`Orden ${orderId} en cocina → COOKING`);
      } else if (backendStatus === "COOKING") {
        result = await finishCooking.mutateAsync(orderId);
        toast.success(`Orden ${orderId} lista → COOKED`);
      } else if (backendStatus === "COOKED") {
        result = await packOrder.mutateAsync(orderId);
        toast.success(`Orden ${orderId} empacada → PACKED`);
      } else if (backendStatus === "PACKED") {
        result = await startDelivery.mutateAsync(orderId);
        toast.success(`Orden ${orderId} en camino → DELIVERING`);
      } else if (backendStatus === "DELIVERING") {
        result = await completeOrder.mutateAsync(orderId);
        toast.success(`Orden ${orderId} completada → COMPLETED`);
      } else if (backendStatus === "COMPLETED" || backendStatus === "DELIVERED") {
        toast.info(`Orden ${orderId} ya está completada`);
        return;
      } else {
        toast.warning(`Estado desconocido: ${backendStatus}`);
        return;
      }

      console.log(`[Workflow] Order ${orderId} transitioned to:`, result?.status);

      addNotification({
        title: "Estado Actualizado",
        message: `Orden ${orderId} actualizada a ${result?.status || "siguiente estado"}`,
        type: "order",
      });
    } catch (error: any) {
      const errorMsg = error?.message || "Error al actualizar orden";
      toast.error(errorMsg);
      console.error("[Workflow] Error:", error);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeOrder = orders.find((o) => o.id === active.id);
    if (!activeOrder) return;

    // Determine the new status based on the drop zone
    handleStatusChange(activeOrder.id);
  };

  const filteredOrders = orders.filter(
    (order) => filterStatus === "all" || order.status === filterStatus
  );

  const getOrdersByStatus = (status: UIStatus) =>
    orders.filter((order) => order.status === status);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando órdenes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Panel de Órdenes en Tiempo Real
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestiona el flujo completo de pedidos con drag & drop
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? "WS Conectado" : "Reconectando WS..."}
          </Badge>
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`}
            />
          </Button>
          <Button variant="outline" size="icon">
            <Bell className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            No hay órdenes activas
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Las nuevas órdenes aparecerán aquí automáticamente
          </p>
        </div>
      ) : (
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all" onClick={() => setFilterStatus("all")}>
              Todas
              <Badge variant="secondary" className="ml-2">
                {orders.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="pending"
              onClick={() => setFilterStatus("pending")}
            >
              Pendientes
              <Badge variant="secondary" className="ml-2">
                {getOrdersByStatus("pending").length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="kitchen"
              onClick={() => setFilterStatus("kitchen")}
            >
              Cocina
              <Badge variant="secondary" className="ml-2">
                {getOrdersByStatus("kitchen").length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="packing"
              onClick={() => setFilterStatus("packing")}
            >
              Empaque
              <Badge variant="secondary" className="ml-2">
                {getOrdersByStatus("packing").length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="delivery"
              onClick={() => setFilterStatus("delivery")}
            >
              Delivery
              <Badge variant="secondary" className="ml-2">
                {getOrdersByStatus("delivery").length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <DndContext
            collisionDetection={closestCorners}
            onDragEnd={handleDragEnd}
          >
            <TabsContent value="all" className="space-y-4">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <SortableContext
                  items={filteredOrders.map((o) => o.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {filteredOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onStatusChange={handleStatusChange}
                      disabled={isMutating}
                    />
                  ))}
                </SortableContext>
              </div>
            </TabsContent>

            {(["pending", "kitchen", "packing", "delivery"] as UIStatus[]).map(
              (status) => (
                <TabsContent key={status} value={status} className="space-y-4">
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <SortableContext
                      items={getOrdersByStatus(status).map((o) => o.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {getOrdersByStatus(status).map((order) => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          onStatusChange={handleStatusChange}
                          disabled={isMutating}
                        />
                      ))}
                    </SortableContext>
                  </div>
                </TabsContent>
              )
            )}
          </DndContext>
        </Tabs>
      )}
    </div>
  );
};

export default Orders;
