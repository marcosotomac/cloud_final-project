import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";

const Cart = () => {
  const { items, totalPrice } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />

        <div className="bg-primary py-4">
          <h1 className="text-center text-2xl font-bold text-primary-foreground">Carrito</h1>
        </div>

        <main className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center">
                <ShoppingCart className="h-16 w-16 text-muted-foreground" />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-2">¡Tu carrito esta vacío!</h2>
              <p className="text-muted-foreground">
                Ingresa a nuestra carta y agrega los productos que desees a tu pedido
              </p>
            </div>

            <Button
              onClick={() => navigate("/")}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 text-base font-semibold"
            >
              Agregar productos
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
        <h1 className="text-center text-2xl font-bold text-primary-foreground">Carrito</h1>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-card border rounded-lg p-4 flex gap-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-24 h-24 object-cover rounded"
                />
                <div className="flex-1">
                  <h3 className="font-bold">{item.name}</h3>
                  {item.recipe && (
                    <p className="text-sm text-muted-foreground">Receta: {item.recipe}</p>
                  )}
                  {item.complement && (
                    <p className="text-sm text-muted-foreground">
                      Complemento: {item.complement}
                    </p>
                  )}
                  <p className="font-semibold mt-2">S/{item.price.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">x{item.quantity}</p>
                  <p className="text-lg font-bold">
                    S/{(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-card border rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg">Subtotal</span>
              <span className="text-lg">S/{totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-6">
              <span className="text-2xl font-bold">Total</span>
              <span className="text-2xl font-bold text-primary">
                S/{totalPrice.toFixed(2)}
              </span>
            </div>
            <Button className="w-full h-12 text-base font-semibold">
              Proceder al pago
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Cart;
