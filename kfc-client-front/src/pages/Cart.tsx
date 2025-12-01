import { ShoppingCart, Trash2, Minus, Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Cart = () => {
  const { items, totalPrice, updateQuantity, removeItem, clearCart } =
    useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleUpdateQuantity = (
    item: (typeof items)[0],
    newQuantity: number
  ) => {
    // Validar stock si no es ilimitado
    if (
      item.stock !== undefined &&
      item.stock !== -1 &&
      newQuantity > item.stock
    ) {
      toast.error(
        `Solo hay ${item.stock} unidades disponibles de ${item.name}`
      );
      return;
    }
    updateQuantity(item.id, newQuantity);
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }
    navigate("/checkout");
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />

        <div className="bg-primary py-4">
          <h1 className="text-center text-2xl font-bold text-primary-foreground">
            Carrito
          </h1>
        </div>

        <main className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center">
                <ShoppingCart className="h-16 w-16 text-muted-foreground" />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-2">
                ¡Tu carrito está vacío!
              </h2>
              <p className="text-muted-foreground">
                Ingresa a nuestra carta y agrega los productos que desees a tu
                pedido
              </p>
            </div>

            <Button
              onClick={() => navigate("/menu")}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 text-base font-semibold"
            >
              Ver menú
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="bg-primary py-4">
        <h1 className="text-center text-2xl font-bold text-primary-foreground">
          Carrito
        </h1>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <span className="text-muted-foreground">
              {items.length} producto(s)
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCart}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Vaciar carrito
            </Button>
          </div>

          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-card border rounded-lg p-4 flex gap-4"
              >
                <img
                  src={item.image || "/placeholder-product.jpg"}
                  alt={item.name}
                  className="w-24 h-24 object-cover rounded"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold">{item.name}</h3>
                      {item.recipe && (
                        <p className="text-sm text-muted-foreground">
                          Receta: {item.recipe}
                        </p>
                      )}
                      {item.complement && (
                        <p className="text-sm text-muted-foreground">
                          Complemento: {item.complement}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex justify-between items-end mt-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          handleUpdateQuantity(item, item.quantity - 1)
                        }
                        className="h-8 w-8"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-semibold">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          handleUpdateQuantity(item, item.quantity + 1)
                        }
                        disabled={
                          item.stock !== undefined &&
                          item.stock !== -1 &&
                          item.quantity >= item.stock
                        }
                        className="h-8 w-8"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      {/* Stock warning */}
                      {item.stock !== undefined &&
                        item.stock !== -1 &&
                        item.quantity >= item.stock && (
                          <Badge
                            variant="outline"
                            className="ml-2 text-yellow-600 border-yellow-500"
                          >
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Máx. stock
                          </Badge>
                        )}
                    </div>
                    <p className="text-lg font-bold">
                      S/{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-card border rounded-lg p-6">
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Subtotal</span>
                <span>S/{totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Delivery</span>
                <span>Por calcular</span>
              </div>
              <div className="border-t pt-3 flex justify-between items-center">
                <span className="text-xl font-bold">Total</span>
                <span className="text-xl font-bold text-primary">
                  S/{totalPrice.toFixed(2)}
                </span>
              </div>
            </div>

            <Button
              onClick={handleCheckout}
              className="w-full h-12 text-base font-semibold"
            >
              {isAuthenticated
                ? "Proceder al pago"
                : "Iniciar sesión para continuar"}
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate("/menu")}
              className="w-full h-12 text-base mt-3"
            >
              Seguir comprando
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Cart;
