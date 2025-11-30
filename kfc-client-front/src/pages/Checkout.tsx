import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateOrder } from "@/hooks/useOrders";
import { useValidatePromoCode } from "@/hooks/usePromotions";
import { toast } from "sonner";
import { MapPin, CreditCard, Banknote, Loader2, Tag } from "lucide-react";

const Checkout = () => {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const createOrder = useCreateOrder();
  const validatePromo = useValidatePromoCode();

  const [orderType, setOrderType] = useState<"delivery" | "pickup">("delivery");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash">("card");
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [address, setAddress] = useState({
    street: "",
    apartment: "",
    reference: "",
  });

  const deliveryFee = orderType === "delivery" ? 5.0 : 0;
  const subtotal = totalPrice;
  const total = subtotal + deliveryFee - discount;

  const handleApplyPromo = async () => {
    if (!promoCode) return;
    try {
      const result = await validatePromo.mutateAsync(promoCode);
      if (result?.valid) {
        const discountAmount = (subtotal * (result.discount || 0)) / 100;
        setDiscount(discountAmount);
        toast.success(`Código aplicado: ${result.discount}% de descuento`);
      } else {
        toast.error("Código de promoción inválido");
      }
    } catch {
      toast.error("Error al validar el código");
    }
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      toast.error("Debes iniciar sesión para realizar un pedido");
      navigate("/auth");
      return;
    }

    if (!user) {
      toast.error("No pudimos validar tu sesión, intenta nuevamente");
      return;
    }

    if (items.length === 0) {
      toast.error("Tu carrito está vacío");
      return;
    }

    if (orderType === "delivery" && !address.street) {
      toast.error("Por favor ingresa tu dirección de entrega");
      return;
    }

    try {
      const deliveryAddressData =
        orderType === "delivery"
          ? address
          : { street: "Recojo en tienda" };

      const orderData = {
        customerId: user.userId,
        customerName: user.name,
        customerEmail: user.email,
        customerPhone: user.phone,
        items: items.map((item) => ({
          itemId: item.id,
          quantity: item.quantity,
          price: item.price,
          name: item.name,
          notes: item.recipe || undefined,
          customizations: item.complement
            ? { complement: item.complement }
            : undefined,
        })),
        orderType,
        paymentMethod,
        deliveryAddress: deliveryAddressData,
        deliveryFee,
        deliveryNotes:
          orderType === "delivery"
            ? address.reference || undefined
            : "Recojo en tienda",
        promoCode: promoCode || undefined,
      };

      const result = await createOrder.mutateAsync(orderData);
      clearCart();
      toast.success("¡Pedido realizado con éxito!");
      if (result?.orderId) {
        navigate(`/order/${result.orderId}`);
      }
    } catch (error) {
      console.error("Checkout error", error);
      toast.error("Error al procesar tu pedido");
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h1 className="text-2xl font-bold mb-2">Tu carrito está vacío</h1>
          <p className="text-muted-foreground mb-6">
            Agrega productos para continuar
          </p>
          <Button onClick={() => navigate("/menu")}>Ver Menú</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="bg-primary py-4">
        <h1 className="text-center text-2xl font-bold text-primary-foreground">
          Finalizar Pedido
        </h1>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Type */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Tipo de pedido</h2>
              <RadioGroup
                value={orderType}
                onValueChange={(v) => setOrderType(v as "delivery" | "pickup")}
                className="grid grid-cols-2 gap-4"
              >
                <Label
                  htmlFor="delivery"
                  className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    orderType === "delivery"
                      ? "border-primary bg-primary/5"
                      : ""
                  }`}
                >
                  <RadioGroupItem value="delivery" id="delivery" />
                  <div>
                    <p className="font-medium">Delivery</p>
                    <p className="text-sm text-muted-foreground">
                      Envío a domicilio
                    </p>
                  </div>
                </Label>
                <Label
                  htmlFor="pickup"
                  className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    orderType === "pickup" ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <RadioGroupItem value="pickup" id="pickup" />
                  <div>
                    <p className="font-medium">Recojo en tienda</p>
                    <p className="text-sm text-muted-foreground">
                      Sin costo de envío
                    </p>
                  </div>
                </Label>
              </RadioGroup>
            </Card>

            {/* Delivery Address */}
            {orderType === "delivery" && (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold">Dirección de entrega</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="street">Dirección</Label>
                    <Input
                      id="street"
                      placeholder="Av. Principal 123"
                      value={address.street}
                      onChange={(e) =>
                        setAddress({ ...address, street: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="apartment">
                        Dpto / Oficina (opcional)
                      </Label>
                      <Input
                        id="apartment"
                        placeholder="Ej: Dpto 401"
                        value={address.apartment}
                        onChange={(e) =>
                          setAddress({ ...address, apartment: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="reference">Referencia (opcional)</Label>
                      <Input
                        id="reference"
                        placeholder="Ej: Frente al parque"
                        value={address.reference}
                        onChange={(e) =>
                          setAddress({ ...address, reference: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Payment Method */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">Método de pago</h2>
              </div>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as "card" | "cash")}
                className="space-y-3"
              >
                <Label
                  htmlFor="card"
                  className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === "card"
                      ? "border-primary bg-primary/5"
                      : ""
                  }`}
                >
                  <RadioGroupItem value="card" id="card" />
                  <CreditCard className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Tarjeta de crédito/débito</p>
                    <p className="text-sm text-muted-foreground">
                      Pago seguro en línea
                    </p>
                  </div>
                </Label>
                <Label
                  htmlFor="cash"
                  className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === "cash"
                      ? "border-primary bg-primary/5"
                      : ""
                  }`}
                >
                  <RadioGroupItem value="cash" id="cash" />
                  <Banknote className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Efectivo</p>
                    <p className="text-sm text-muted-foreground">
                      Pago contra entrega
                    </p>
                  </div>
                </Label>
              </RadioGroup>
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Resumen del pedido</h2>

              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.quantity}x {item.name}
                    </span>
                    <span>S/{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              {/* Promo Code */}
              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Código promocional"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={handleApplyPromo}
                  disabled={validatePromo.isPending}
                >
                  Aplicar
                </Button>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>S/{subtotal.toFixed(2)}</span>
                </div>
                {orderType === "delivery" && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Envío</span>
                    <span>S/{deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Descuento</span>
                    <span>-S/{discount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between text-xl font-bold mb-6">
                <span>Total</span>
                <span className="text-primary">S/{total.toFixed(2)}</span>
              </div>

              <Button
                className="w-full h-12 text-base font-semibold"
                onClick={handleSubmit}
                disabled={createOrder.isPending}
              >
                {createOrder.isPending ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  `Confirmar pedido - S/${total.toFixed(2)}`
                )}
              </Button>

              {!isAuthenticated && (
                <p className="text-sm text-muted-foreground text-center mt-4">
                  Debes{" "}
                  <button
                    className="text-primary hover:underline"
                    onClick={() => navigate("/auth")}
                  >
                    iniciar sesión
                  </button>{" "}
                  para realizar tu pedido
                </p>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;
