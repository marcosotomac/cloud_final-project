import { Card } from "@/components/ui/card";
import {
  TrendingUp,
  ShoppingCart,
  Users,
  DollarSign,
  Clock,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useDashboard, useRecentOrders } from "@/hooks/useDashboard";

const Dashboard = () => {
  const {
    data: dashboardData,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useDashboard();
  const { data: recentOrders, isLoading: loadingOrders } = useRecentOrders();

  const stats = dashboardData
    ? [
        {
          title: "Ventas Hoy",
          value: `S/${dashboardData.salesTotal?.toFixed(2) || "0.00"}`,
          change: dashboardData.salesChange
            ? `${dashboardData.salesChange > 0 ? "+" : ""}${
                dashboardData.salesChange
              }%`
            : "N/A",
          icon: DollarSign,
          color: "text-green-600",
        },
        {
          title: "Órdenes Activas",
          value: String(dashboardData.activeOrders || 0),
          change: `${dashboardData.pendingOrders || 0} pendientes`,
          icon: ShoppingCart,
          color: "text-orange-600",
        },
        {
          title: "Clientes Atendidos",
          value: String(dashboardData.customersServed || 0),
          change: dashboardData.customerChange
            ? `${dashboardData.customerChange > 0 ? "+" : ""}${
                dashboardData.customerChange
              }%`
            : "N/A",
          icon: Users,
          color: "text-purple-600",
        },
        {
          title: "Tiempo Promedio",
          value: `${dashboardData.avgPrepTime || 0} min`,
          change: dashboardData.prepTimeChange
            ? `${dashboardData.prepTimeChange} min vs ayer`
            : "N/A",
          icon: Clock,
          color: "text-blue-600",
        },
      ]
    : [];

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Vista general del negocio en tiempo real
            </p>
          </div>
        </div>
        <Card className="p-12 text-center">
          <p className="text-destructive mb-4">
            Error al cargar los datos del dashboard
          </p>
          <Button onClick={() => refetch()}>Reintentar</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Vista general del negocio en tiempo real
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isRefetching ? "animate-spin" : ""}`}
          />
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? [...Array(4)].map((_, i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32 mb-1" />
                <Skeleton className="h-4 w-20" />
              </Card>
            ))
          : stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title} className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-bold">{stat.value}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {stat.change}
                      </p>
                    </div>
                    <Icon className={`w-12 h-12 ${stat.color} opacity-80`} />
                  </div>
                </Card>
              );
            })}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-6">Ventas por Hora</h2>
          {isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : dashboardData?.salesByHour?.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dashboardData.salesByHour}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="ventas"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No hay datos disponibles
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold mb-6">Productos Más Vendidos</h2>
          {isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : dashboardData?.topProducts?.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData.topProducts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="sales" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No hay datos disponibles
            </div>
          )}
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-6">Pedidos Recientes</h2>
        {loadingOrders ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : recentOrders?.length ? (
          <div className="space-y-4">
            {recentOrders.map((order: any) => (
              <div
                key={order.orderId}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-semibold">
                      #{order.orderId?.slice(-6).toUpperCase()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.customerName || "Cliente"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-sm text-muted-foreground">
                    {order.items?.length || 0} items
                  </p>
                  <p className="font-bold text-primary">
                    S/{order.total?.toFixed(2) || "0.00"}
                  </p>
                  <Badge
                    variant={
                      order.status === "completed" ? "default" : "secondary"
                    }
                    className={
                      order.status === "completed" ||
                      order.status === "delivered"
                        ? "bg-green-500/20 text-green-700 dark:text-green-400"
                        : order.status === "preparing" ||
                          order.status === "in_kitchen"
                        ? "bg-orange-500/20 text-orange-700 dark:text-orange-400"
                        : "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
                    }
                  >
                    {order.status === "completed" ||
                    order.status === "delivered"
                      ? "Completado"
                      : order.status === "preparing" ||
                        order.status === "in_kitchen"
                      ? "Preparando"
                      : order.status === "pending"
                      ? "Pendiente"
                      : order.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No hay pedidos recientes
          </p>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;
