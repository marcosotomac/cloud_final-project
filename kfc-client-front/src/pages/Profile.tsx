import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useOrders } from "@/hooks/useOrders";
import {
  User,
  ShoppingBag,
  MapPin,
  Heart,
  LogOut,
  ChevronRight,
  Clock,
} from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { data: orders, isLoading: ordersLoading } = useOrders();

  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 sm:py-12 text-center">
          <div className="text-5xl sm:text-6xl mb-4">👤</div>
          <h1 className="text-xl sm:text-2xl font-bold mb-2">Inicia sesión</h1>
          <p className="text-sm sm:text-base text-muted-foreground mb-6">
            Accede a tu cuenta para ver tu perfil y pedidos
          </p>
          <Button
            onClick={() => navigate("/auth")}
            className="w-full sm:w-auto"
          >
            Iniciar sesión
          </Button>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "delivered":
        return "bg-green-500/20 text-green-700";
      case "cancelled":
        return "bg-red-500/20 text-red-700";
      case "pending":
        return "bg-yellow-500/20 text-yellow-700";
      default:
        return "bg-blue-500/20 text-blue-700";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Pendiente",
      confirmed: "Confirmado",
      preparing: "Preparando",
      ready: "Listo",
      "out-for-delivery": "En camino",
      delivered: "Entregado",
      completed: "Completado",
      cancelled: "Cancelado",
    };
    return labels[status] || status;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="bg-primary py-3 sm:py-4">
        <h1 className="text-center text-xl sm:text-2xl font-bold text-primary-foreground">
          Mi Cuenta
        </h1>
      </div>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto">
          {/* User Info Header */}
          <Card className="p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl sm:text-2xl font-bold">
                {user?.name?.charAt(0) || "U"}
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-lg sm:text-xl font-bold">
                  {user?.name || "Usuario"}
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground truncate max-w-[200px] sm:max-w-none mx-auto sm:mx-0">
                  {user?.email}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleLogout}
                size="sm"
                className="w-full sm:w-auto mt-2 sm:mt-0"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar sesión
              </Button>
            </div>
          </Card>

          <Tabs defaultValue="orders" className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-4 h-auto p-1">
              <TabsTrigger
                value="orders"
                className="gap-1 sm:gap-2 flex-col sm:flex-row py-2 px-1 sm:px-3 text-xs sm:text-sm"
              >
                <ShoppingBag className="h-4 w-4 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline sm:inline">Pedidos</span>
              </TabsTrigger>
              <TabsTrigger
                value="profile"
                className="gap-1 sm:gap-2 flex-col sm:flex-row py-2 px-1 sm:px-3 text-xs sm:text-sm"
              >
                <User className="h-4 w-4 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline sm:inline">Perfil</span>
              </TabsTrigger>
              <TabsTrigger
                value="addresses"
                className="gap-1 sm:gap-2 flex-col sm:flex-row py-2 px-1 sm:px-3 text-xs sm:text-sm"
              >
                <MapPin className="h-4 w-4 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline sm:inline">Direcciones</span>
              </TabsTrigger>
              <TabsTrigger
                value="favorites"
                className="gap-1 sm:gap-2 flex-col sm:flex-row py-2 px-1 sm:px-3 text-xs sm:text-sm"
              >
                <Heart className="h-4 w-4 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline sm:inline">Favoritos</span>
              </TabsTrigger>
            </TabsList>

            {/* Orders Tab */}
            <TabsContent value="orders" className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-bold">Mis Pedidos</h3>

              {ordersLoading ? (
                <div className="space-y-3 sm:space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="p-3 sm:p-4">
                      <Skeleton className="h-5 sm:h-6 w-28 sm:w-32 mb-2" />
                      <Skeleton className="h-4 w-40 sm:w-48 mb-2" />
                      <Skeleton className="h-4 w-20 sm:w-24" />
                    </Card>
                  ))}
                </div>
              ) : orders && orders.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {orders.map((order: any) => (
                    <Card
                      key={order.orderId}
                      className="p-3 sm:p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/order/${order.orderId}`)}
                    >
                      <div className="flex items-start sm:items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                            <h4 className="font-bold text-sm sm:text-base">
                              #{order.orderId?.slice(-8).toUpperCase()}
                            </h4>
                            <Badge
                              className={`${getStatusColor(
                                order.status
                              )} text-xs`}
                            >
                              {getStatusLabel(order.status)}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                            <span>{order.items?.length || 0} prod.</span>
                            <span className="font-medium text-foreground">
                              S/{order.total?.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8 sm:p-12 text-center">
                  <ShoppingBag className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
                  <h4 className="text-base sm:text-lg font-bold mb-2">
                    Sin pedidos
                  </h4>
                  <p className="text-sm sm:text-base text-muted-foreground mb-4">
                    Aún no has realizado ningún pedido
                  </p>
                  <Button
                    onClick={() => navigate("/menu")}
                    className="w-full sm:w-auto"
                  >
                    Ver menú
                  </Button>
                </Card>
              )}
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-bold">
                Información personal
              </h3>
              <Card className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-sm">
                      Nombre completo
                    </Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) =>
                        setProfile({ ...profile, name: e.target.value })
                      }
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm">
                      Correo electrónico
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) =>
                        setProfile({ ...profile, email: e.target.value })
                      }
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-sm">
                      Teléfono
                    </Label>
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile({ ...profile, phone: e.target.value })
                      }
                      placeholder="+51 999 999 999"
                      className="text-sm sm:text-base"
                    />
                  </div>
                  <Button className="w-full">Guardar cambios</Button>
                </div>
              </Card>
            </TabsContent>

            {/* Addresses Tab */}
            <TabsContent value="addresses" className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <h3 className="text-base sm:text-lg font-bold">
                  Mis Direcciones
                </h3>
                <Button size="sm" className="w-full sm:w-auto">
                  Agregar dirección
                </Button>
              </div>
              <Card className="p-8 sm:p-12 text-center">
                <MapPin className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
                <h4 className="text-base sm:text-lg font-bold mb-2">
                  Sin direcciones guardadas
                </h4>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Agrega direcciones para un checkout más rápido
                </p>
              </Card>
            </TabsContent>

            {/* Favorites Tab */}
            <TabsContent value="favorites" className="space-y-3 sm:space-y-4">
              <h3 className="text-base sm:text-lg font-bold">Mis Favoritos</h3>
              <Card className="p-8 sm:p-12 text-center">
                <Heart className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
                <h4 className="text-base sm:text-lg font-bold mb-2">
                  Sin favoritos
                </h4>
                <p className="text-sm sm:text-base text-muted-foreground mb-4">
                  Guarda tus productos favoritos para pedirlos más rápido
                </p>
                <Button
                  onClick={() => navigate("/menu")}
                  className="w-full sm:w-auto"
                >
                  Explorar menú
                </Button>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Profile;
