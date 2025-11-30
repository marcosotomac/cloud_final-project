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
  usePackOrder,
  useStartDelivery,
  useCompleteOrder,
} from "@/hooks/useOrders";
import { toast } from "sonner";

// Map API status to UI status
type UIStatus = "pending" | "kitchen" | "packing" | "delivery";
const mapApiStatusToUI = (apiStatus: string): UIStatus => {
  const statusMap: Record<string, UIStatus> = {
    pending: "pending",
    confirmed: "pending",
    preparing: "kitchen",
    cooking: "kitchen",
    cooked: "packing",
    ready: "packing",
    packed: "delivery",
    out_for_delivery: "delivery",
    delivering: "delivery",
  };
  return statusMap[apiStatus] || "pending";
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
  const packOrder = usePackOrder();
  const startDelivery = useStartDelivery();
  const completeOrder = useCompleteOrder();

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

  const handleStatusChange = async (orderId: string, newStatus: UIStatus) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    try {
      // Determine which workflow action to call based on current and new status
      if (order.status === "pending" && newStatus === "kitchen") {
        // Take order and start cooking
        await takeOrder.mutateAsync(orderId);
        await startCooking.mutateAsync(orderId);
        toast.success(`Orden ${orderId} enviada a cocina`);
      } else if (order.status === "kitchen" && newStatus === "packing") {
        // Mark as ready for packing
        await packOrder.mutateAsync(orderId);
        toast.success(`Orden ${orderId} lista para empaque`);
      } else if (order.status === "packing" && newStatus === "delivery") {
        // Start delivery
        await startDelivery.mutateAsync(orderId);
        toast.success(`Orden ${orderId} en camino`);
      }

      addNotification({
        title: "Estado Actualizado",
        message: `Orden ${orderId} actualizada`,
        type: "success",
      });
    } catch (error: any) {
      toast.error(error.message || "Error al actualizar orden");
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeOrder = orders.find((o) => o.id === active.id);
    if (!activeOrder) return;

    // Determine the new status based on the drop zone
    const newStatus = over.id as UIStatus;
    handleStatusChange(activeOrder.id, newStatus);
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
