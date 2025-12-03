import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderCard } from "@/components/OrderCard";
import {
  DndContext,
  DragEndEvent,
  useSensor,
  useSensors,
  PointerSensor,
  useDroppable,
} from "@dnd-kit/core";
import { Bell, Loader2, RefreshCw, LayoutGrid, List } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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

// View mode type
type ViewMode = "tabs" | "kanban";

// Map API status to UI status
type UIStatus = "pending" | "kitchen" | "packing" | "delivery";
const mapApiStatusToUI = (apiStatus: string): UIStatus => {
  const normalized = (apiStatus || "").toUpperCase();
  const statusMap: Record<string, UIStatus> = {
    PENDING: "pending",
    RECEIVED: "kitchen",
    COOKING: "kitchen",
    PACKING: "packing",
    DELIVERY: "delivery",
    COMPLETED: "delivery",
    CANCELLED: "pending",
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

// Raw API order type
interface RawOrder {
  orderId?: string;
  id?: string;
  status: string;
  customerName?: string;
  customer?: { name?: string };
  items?: any[];
  total?: number;
  totalAmount?: number;
  createdAt?: string;
}

// Valid transitions: current UI status -> next UI status
const validTransitions: Record<UIStatus, UIStatus | null> = {
  pending: "kitchen", // PENDING -> RECEIVED/COOKING
  kitchen: "packing", // COOKING/RECEIVED -> COOKED
  packing: "delivery", // COOKED/PACKED -> DELIVERING
  delivery: null, // No next status
};

// Droppable zone component for each status column
const DroppableZone = ({
  id,
  children,
  className = "",
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[200px] rounded-lg transition-colors ${
        isOver ? "bg-primary/10 ring-2 ring-primary ring-dashed" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
};

const Orders = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("tabs");
  const [filterStatus, setFilterStatus] = useState<UIStatus | "all">("all");
  const [activeTab, setActiveTab] = useState<string>("all");
  const { addNotification } = useNotifications();
  const queryClient = useQueryClient();

  // Local state for orders - this is the source of truth for UI
  const [localOrders, setLocalOrders] = useState<RawOrder[]>([]);
  const pendingUpdates = useRef<Set<string>>(new Set());

  // Drag sensor with activation constraint to prevent accidental drags
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    })
  );

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

  // Sync API orders to local state (only when not pending updates)
  useEffect(() => {
    if (Array.isArray(apiOrders) && apiOrders.length > 0) {
      setLocalOrders((current) => {
        // Merge: keep local status for orders with pending updates, use API for others
        const merged = apiOrders.map((apiOrder: any) => {
          const orderId = apiOrder.orderId || apiOrder.id;
          const localOrder = current.find(
            (o) => (o.orderId || o.id) === orderId
          );
          // If we have a pending update for this order, keep local version
          if (pendingUpdates.current.has(orderId) && localOrder) {
            return localOrder;
          }
          return apiOrder;
        });
        return merged;
      });
    }
  }, [apiOrders]);

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

  // Helper to update local order status immediately
  const updateLocalOrderStatus = useCallback(
    (orderId: string, newStatus: string) => {
      console.log(`[Local] Updating order ${orderId} to ${newStatus}`);
      setLocalOrders((current) =>
        current.map((order) => {
          if ((order.orderId || order.id) === orderId) {
            return { ...order, status: newStatus };
          }
          return order;
        })
      );
    },
    []
  );

  // Transform local orders to UI format
  const orders: UIOrder[] = useMemo(() => {
    if (!Array.isArray(localOrders)) return [];

    return localOrders.map((order: any) => ({
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
  }, [localOrders]);

  const handleStatusChange = async (orderId: string) => {
    // Get order from LOCAL state (not API)
    const currentOrder = localOrders.find(
      (o) => (o.orderId || o.id) === orderId
    );
    if (!currentOrder) {
      toast.error("Orden no encontrada");
      return;
    }

    // Normalize to uppercase to match backend enum
    const backendStatus = (currentOrder.status || "").toUpperCase();
    console.log(`[Workflow] Order ${orderId} current status: ${backendStatus}`);

    // Mark this order as having a pending update
    pendingUpdates.current.add(orderId);

    try {
      // WORKFLOW AUTOMATIZADO: Solo permitir aceptar la orden (PENDING -> RECEIVED)
      // El resto de transiciones son automáticas vía Step Functions
      
      if (backendStatus === "PENDING") {
        // Solo permitir esta transición manual - tomar/aceptar la orden
        updateLocalOrderStatus(orderId, "RECEIVED"); // Update UI immediately
        const result = await takeOrder.mutateAsync(orderId);
        toast.success(`Orden aceptada ✓ El flujo automático iniciará`);
        
        console.log(`[Workflow] Order ${orderId} accepted, Step Functions will handle rest`);
        
        // Clear pending flag after successful mutation
        pendingUpdates.current.delete(orderId);

        addNotification({
          title: "Orden Aceptada",
          message: `La orden iniciará cocción automáticamente en ${30 - 2}s`,
          type: "order",
        });
      } else {
        // Todas las otras transiciones son AUTOMÁTICAS vía Step Functions
        toast.info(`✨ Esta orden avanzará automáticamente: ${backendStatus} → Siguiente estado`);
        toast.info("Espera 30 segundos por etapa (cocina, empaque, delivery)");
        pendingUpdates.current.delete(orderId);
      }
    } catch (error: any) {
      const errorMsg = error?.message || "Error al aceptar orden";
      toast.error(errorMsg);
      console.error("[Workflow] Error:", error);

      // Revert local state on error - refetch will sync
      pendingUpdates.current.delete(orderId);
      refetch();
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // No drop target
    if (!over) return;

    // WORKFLOW AUTOMATIZADO: No permitir drag & drop manual
    // Las transiciones son automáticas vía Step Functions
    toast.info("⚙️ Workflow automatizado activo");
    toast.info("Las órdenes avanzan automáticamente sin intervención manual");
    return;
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
            ⚙️ Workflow Automatizado - Solo acepta órdenes, el resto es automático via Step Functions
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => value && setViewMode(value as ViewMode)}
            className="border rounded-md"
          >
            <ToggleGroupItem
              value="tabs"
              aria-label="Vista Tabs"
              className="px-3"
            >
              <List className="w-4 h-4 mr-2" />
              Tabs
            </ToggleGroupItem>
            <ToggleGroupItem
              value="kanban"
              aria-label="Vista Kanban"
              className="px-3"
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              Kanban
            </ToggleGroupItem>
          </ToggleGroup>

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
      ) : viewMode === "tabs" ? (
        /* ========== VISTA TABS ========== */
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
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

          {/* Vista "Todas" en modo Tabs */}
          <TabsContent value="all" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusChange={handleStatusChange}
                  disabled={isMutating}
                />
              ))}
            </div>
          </TabsContent>

          {/* Vistas individuales por estado en modo Tabs */}
          {(["pending", "kitchen", "packing", "delivery"] as UIStatus[]).map(
            (status) => (
              <TabsContent key={status} value={status} className="space-y-4">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {getOrdersByStatus(status).map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onStatusChange={handleStatusChange}
                      disabled={isMutating}
                    />
                  ))}
                  {getOrdersByStatus(status).length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      No hay órdenes en este estado
                    </div>
                  )}
                </div>
              </TabsContent>
            )
          )}
        </Tabs>
      ) : (
        /* ========== VISTA KANBAN (Drag & Drop) ========== */
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {(["pending", "kitchen", "packing", "delivery"] as UIStatus[]).map(
              (status) => (
                <DroppableZone key={status} id={`zone-${status}`}>
                  <div className="space-y-3 p-3 bg-muted/30 rounded-lg min-h-[500px]">
                    <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center justify-between">
                      <span>
                        {status === "pending" && "📋 Pendientes"}
                        {status === "kitchen" && "🍳 Cocina"}
                        {status === "packing" && "📦 Empaque"}
                        {status === "delivery" && "🚗 Delivery"}
                      </span>
                      <Badge variant="outline">
                        {getOrdersByStatus(status).length}
                      </Badge>
                    </h3>
                    <div className="space-y-3">
                      {getOrdersByStatus(status).map((order) => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          onStatusChange={handleStatusChange}
                          disabled={isMutating}
                        />
                      ))}
                      {getOrdersByStatus(status).length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                          Arrastra órdenes aquí
                        </div>
                      )}
                    </div>
                  </div>
                </DroppableZone>
              )
            )}
          </div>
        </DndContext>
      )}
    </div>
  );
};

export default Orders;
