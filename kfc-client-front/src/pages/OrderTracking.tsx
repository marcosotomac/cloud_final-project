import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrder, useOrderTracking } from "@/hooks/useOrders";
import websocketService from "@/services/websocket.service";
import {
  CheckCircle2,
  Clock,
  ChefHat,
  Package,
  Truck,
  MapPin,
  Phone,
  Star,
} from "lucide-react";

const statusSteps = [
  { status: "pending", label: "Pedido recibido", icon: Clock },
  { status: "confirmed", label: "Confirmado", icon: CheckCircle2 },
  { status: "preparing", label: "Preparando", icon: ChefHat },
  { status: "ready", label: "Listo", icon: Package },
  { status: "out-for-delivery", label: "En camino", icon: Truck },
  { status: "delivered", label: "Entregado", icon: MapPin },
];

const getStatusIndex = (status: string) => {
  const index = statusSteps.findIndex((s) => s.status === status);
  return index >= 0 ? index : 0;
};

const OrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { data: order, isLoading, refetch } = useOrder(orderId || "");
  const { data: tracking } = useOrderTracking(orderId || "");
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);

  useEffect(() => {
    // Connect to WebSocket for real-time updates
    websocketService.connect();

    const unsubscribe = websocketService.onOrderUpdate((data: any) => {
      if (data.orderId === orderId) {
        refetch();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [orderId, refetch]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="p-8 max-w-2xl mx-auto">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-32 w-full mb-6" />
            <Skeleton className="h-48 w-full" />
          </Card>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold mb-2">Pedido no encontrado</h1>
          <p className="text-muted-foreground mb-6">
            No pudimos encontrar información de este pedido
          </p>
          <Button onClick={() => navigate("/")}>Volver al inicio</Button>
        </div>
      </div>
    );
  }

  const currentStepIndex = getStatusIndex(order.status);
  const isCompleted =
    order.status === "delivered" || order.status === "completed";

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="bg-primary py-4">
        <h1 className="text-center text-2xl font-bold text-primary-foreground">
          Seguimiento de Pedido
        </h1>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Order Header */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Pedido</p>
                <h2 className="text-2xl font-bold">
                  #{order.orderId?.slice(-8).toUpperCase()}
                </h2>
              </div>
              <Badge
                className={
                  isCompleted
                    ? "bg-green-500/20 text-green-700"
                    : "bg-orange-500/20 text-orange-700"
                }
              >
                {isCompleted ? "Completado" : "En progreso"}
              </Badge>
            </div>

            {tracking?.estimatedTime && !isCompleted && (
              <div className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-primary" />
                <span>
                  Tiempo estimado:{" "}
                  <strong>{tracking.estimatedTime} minutos</strong>
                </span>
              </div>
            )}
          </Card>

          {/* Progress Steps */}
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-6">Estado del pedido</h3>
            <div className="relative">
              {statusSteps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;

                return (
                  <div key={step.status} className="flex gap-4 mb-6 last:mb-0">
                    <div className="relative flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        } ${isCurrent ? "ring-4 ring-primary/20" : ""}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      {index < statusSteps.length - 1 && (
                        <div
                          className={`w-0.5 h-12 ${
                            index < currentStepIndex ? "bg-primary" : "bg-muted"
                          }`}
                        />
                      )}
                    </div>
                    <div className="pt-2">
                      <p
                        className={`font-medium ${
                          isActive ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {step.label}
                      </p>
                      {isCurrent && !isCompleted && (
                        <p className="text-sm text-primary">En progreso...</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Order Details */}
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4">Detalle del pedido</h3>
            <div className="space-y-3">
              {order.items?.map((item: any, index: number) => (
                <div key={index} className="flex justify-between">
                  <span>
                    {item.quantity}x {item.name}
                  </span>
                  <span className="font-medium">
                    S/{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t mt-4 pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">
                  S/{order.total?.toFixed(2)}
                </span>
              </div>
            </div>
          </Card>

          {/* Delivery Info */}
          {order.orderType === "delivery" && order.deliveryAddress && (
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">Dirección de entrega</h3>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p>{order.deliveryAddress.street}</p>
                  {order.deliveryAddress.apartment && (
                    <p className="text-sm text-muted-foreground">
                      {order.deliveryAddress.apartment}
                    </p>
                  )}
                  {order.deliveryAddress.reference && (
                    <p className="text-sm text-muted-foreground">
                      Ref: {order.deliveryAddress.reference}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Rating (for completed orders) */}
          {isCompleted && !order.rating && (
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">
                ¿Cómo estuvo tu pedido?
              </h3>
              <div className="flex justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1"
                  >
                    <Star
                      className={`h-10 w-10 ${
                        star <= rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <Button className="w-full" onClick={() => setShowRating(true)}>
                  Enviar calificación
                </Button>
              )}
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate("/")}
            >
              Volver al inicio
            </Button>
            <Button variant="outline" className="flex-1">
              <Phone className="h-4 w-4 mr-2" />
              Contactar soporte
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OrderTracking;
