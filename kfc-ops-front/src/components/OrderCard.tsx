import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, User, Package, Loader2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";

export interface Order {
  id: string;
  customer: string;
  items: { name: string; quantity: number }[];
  total: number;
  status: "pending" | "kitchen" | "packing" | "delivery";
  createdAt: Date;
  apiStatus?: string;
}

interface OrderCardProps {
  order: Order;
  onStatusChange: (orderId: string) => void | Promise<void>;
  disabled?: boolean;
}

// Backend status labels
const apiStatusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  RECEIVED: "Recibido",
  COOKING: "En Cocina",
  COOKED: "Listo",
  PACKED: "Empacado",
  DELIVERING: "En Delivery",
  DELIVERED: "Entregado",
  COMPLETED: "Completado",
};

// Next status action labels
const nextActionLabels: Record<string, string> = {
  PENDING: "Aceptar",
  RECEIVED: "Cocinar",
  COOKING: "Listo",
  COOKED: "Empacar",
  PACKED: "Enviar",
  DELIVERING: "Completar",
};

const statusConfig = {
  pending: {
    label: "Pendiente",
    color: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  },
  kitchen: {
    label: "En Cocina",
    color: "bg-orange-500/20 text-orange-700 dark:text-orange-400",
  },
  packing: {
    label: "Empacando",
    color: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
  },
  delivery: {
    label: "En Delivery",
    color: "bg-green-500/20 text-green-700 dark:text-green-400",
  },
};

// Status that should NOT show "Siguiente" button
const finalStatuses = ["COMPLETED", "DELIVERED"];

export const OrderCard = ({
  order,
  onStatusChange,
  disabled = false,
}: OrderCardProps) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: order.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const config = statusConfig[order.status];
  const minutesAgo = Math.floor(
    (Date.now() - order.createdAt.getTime()) / 60000
  );

  // Normalize API status to uppercase for comparison
  const normalizedApiStatus = (order.apiStatus || "").toUpperCase();
  const isFinalStatus = finalStatuses.includes(normalizedApiStatus);

  // Get display label for API status
  const apiStatusLabel = apiStatusLabels[normalizedApiStatus] || config.label;
  
  // Get button label for next action
  const nextActionLabel = nextActionLabels[normalizedApiStatus] || "Siguiente";

  const handleNextStatus = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isUpdating || isFinalStatus || disabled) return;

    setIsUpdating(true);
    try {
      await onStatusChange(order.id);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-4 cursor-grab active:cursor-grabbing hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-lg truncate max-w-[180px]">{order.id.slice(-8)}</h3>
          <div className="flex items-center text-sm text-muted-foreground mt-1">
            <User className="w-3 h-3 mr-1" />
            {order.customer}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge className={config.color}>{apiStatusLabel}</Badge>
          <span className="text-[10px] text-muted-foreground">{normalizedApiStatus}</span>
        </div>
      </div>

      <div className="space-y-2 mb-3">
        {order.items.slice(0, 3).map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between text-sm"
          >
            <div className="flex items-center">
              <Package className="w-3 h-3 mr-2 text-primary" />
              <span className="truncate max-w-[150px]">{item.name}</span>
            </div>
            <span className="text-muted-foreground">x{item.quantity}</span>
          </div>
        ))}
        {order.items.length > 3 && (
          <p className="text-xs text-muted-foreground">
            +{order.items.length - 3} más...
          </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <div>
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-lg font-bold text-primary">
            S/{order.total.toFixed(2)}
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center text-xs text-muted-foreground mb-1">
            <Clock className="w-3 h-3 mr-1" />
            {minutesAgo} min
          </div>
          {!isFinalStatus && (
            <Button
              size="sm"
              onClick={handleNextStatus}
              disabled={isUpdating || disabled}
              className="text-xs"
            >
              {isUpdating ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                nextActionLabel
              )}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
