import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Minus,
  Plus,
  ChevronDown,
  ChevronUp,
  Loader2,
  ArrowLeft,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import Header from "@/components/Header";
import SubNav from "@/components/SubNav";
import Footer from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { useMenuItem, useProductReviews, useMenu } from "@/hooks/useMenu";
import { toast } from "sonner";

interface AddOnItem {
  itemId: string;
  name: string;
  price: number;
  imageUrl?: string;
  selected?: boolean;
}

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const { data: product, isLoading, error } = useMenuItem(id || "");
  const { data: reviews } = useProductReviews(id || "");
  const { data: allMenuItems = [] } = useMenu();

  const [quantity, setQuantity] = useState(1);
  const [recipeExpanded, setRecipeExpanded] = useState(true);
  const [complementExpanded, setComplementExpanded] = useState(true);
  const [extrasExpanded, setExtrasExpanded] = useState(true);

  const [recipeOriginal, setRecipeOriginal] = useState(6);
  const [recipeCrispy, setRecipeCrispy] = useState(0);
  const [recipePicante, setRecipePicante] = useState(0);
  const [selectedComplement, setSelectedComplement] = useState("");
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);

  // Get add-on items from menu (complementos, bebidas, postres)
  const addOnItems = (allMenuItems as any[])
    .filter(
      (item) =>
        item.category === "Complementos" ||
        item.category === "Bebidas" ||
        item.category === "Postres"
    )
    .slice(0, 10);

  // Check if this is a "Mega" product that needs customization
  const isMegaProduct =
    product?.category === "Megas" ||
    product?.name?.toLowerCase().includes("mega") ||
    product?.name?.toLowerCase().includes("piezas");

  const hasPieces =
    product?.description?.toLowerCase().includes("piezas") ||
    product?.description?.toLowerCase().includes("pieza");

  // Extract number of pieces from description
  const piecesMatch = product?.description?.match(/(\d+)\s*piezas?/i);
  const requiredPieces = piecesMatch ? parseInt(piecesMatch[1]) : 6;

  const totalRecipe = recipeOriginal + recipeCrispy + recipePicante;
  const recipeComplete = !hasPieces || totalRecipe === requiredPieces;

  // Calculate extras total
  const extrasTotal = selectedExtras.reduce((total, extraId) => {
    const item = addOnItems.find((i: any) => i.itemId === extraId);
    return total + (item?.price || 0);
  }, 0);

  const handleToggleExtra = (itemId: string) => {
    if (selectedExtras.includes(itemId)) {
      setSelectedExtras(selectedExtras.filter((id) => id !== itemId));
    } else if (selectedExtras.length < 5) {
      setSelectedExtras([...selectedExtras, itemId]);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    if (hasPieces && !recipeComplete) {
      toast.error(`Selecciona exactamente ${requiredPieces} piezas`);
      return;
    }

    const basePrice = product.price + extrasTotal;

    addItem({
      id: product.itemId,
      name: product.name,
      price: basePrice,
      quantity,
      image: product.imageUrl || product.image,
      recipe: hasPieces
        ? `${recipeOriginal} Original, ${recipeCrispy} Crispy, ${recipePicante} Picante`
        : undefined,
      complement: selectedComplement || undefined,
    });

    toast.success("Producto agregado al carrito");
    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <SubNav />
        <main className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <Card className="p-6 bg-white">
              <Skeleton className="w-full aspect-square mb-6" />
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <Skeleton className="h-10 w-1/3" />
            </Card>
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/2" />
              <Card className="p-6">
                <Skeleton className="h-40" />
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <SubNav />
        <main className="container mx-auto px-4 py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Producto no encontrado</h2>
            <Button onClick={() => navigate("/menu")}>Volver al menú</Button>
          </div>
        </main>
      </div>
    );
  }

  const discount = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : product.discount
    ? parseInt(product.discount)
    : 0;

  const totalPrice = (product.price + extrasTotal) * quantity;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <SubNav />

      <main className="container mx-auto px-4 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 max-w-6xl mx-auto">
          {/* Left Side - Product Image & Info */}
          <Card className="p-4 sm:p-6 bg-white border-0 shadow-sm">
            <div className="relative mb-4 sm:mb-6 bg-gradient-to-b from-red-50 to-orange-50 rounded-xl p-2 sm:p-4">
              <img
                src={
                  product.imageUrl ||
                  product.image ||
                  "/placeholder-product.jpg"
                }
                alt={product.name}
                className="w-full aspect-square object-contain max-h-64 sm:max-h-none"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                }}
              />
            </div>

            <h1 className="text-xl sm:text-2xl font-bold mb-2">
              {product.name}
            </h1>
            <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">
              {product.description}
            </p>

            {/* Price */}
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 flex-wrap">
              <span className="text-xl sm:text-2xl font-bold">
                S/{product.price.toFixed(2)}
              </span>
              {product.oldPrice && (
                <span className="text-gray-400 line-through text-sm sm:text-base">
                  S/{product.oldPrice.toFixed(2)}
                </span>
              )}
              {discount > 0 && (
                <span className="text-green-600 font-semibold text-sm sm:text-base">
                  {discount}%
                </span>
              )}
            </div>

            {/* Quantity & Add to Cart */}
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-1 border rounded-lg">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg"
                >
                  <Minus className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <span className="text-lg sm:text-xl font-semibold w-8 sm:w-10 text-center">
                  {quantity}
                </span>
                <Button
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                  className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-primary text-white hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>

              <Button
                onClick={handleAddToCart}
                disabled={hasPieces && !recipeComplete}
                className="flex-1 h-10 sm:h-12 text-sm sm:text-base font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Agregar (S/{totalPrice.toFixed(2)})
              </Button>
            </div>
          </Card>

          {/* Right Side - Customization Panel */}
          <div className="space-y-3 sm:space-y-4">
            <h2 className="text-lg sm:text-xl font-bold">
              Personaliza tu pedido
            </h2>

            {/* Recipe Selection - Only for products with pieces */}
            {hasPieces && (
              <Card className="bg-white border-0 shadow-sm overflow-hidden">
                <button
                  onClick={() => setRecipeExpanded(!recipeExpanded)}
                  className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50"
                >
                  <div className="text-left">
                    <h3 className="font-bold text-sm sm:text-base">
                      Elige la Receta
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {requiredPieces}x Receta{" "}
                      {recipeComplete ? "Original" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Badge
                      className={`text-xs sm:text-sm ${
                        recipeComplete
                          ? "bg-green-100 text-green-700 border-green-200"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {recipeComplete
                        ? "Completado"
                        : `${totalRecipe}/${requiredPieces}`}
                    </Badge>
                    {recipeExpanded ? (
                      <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </div>
                </button>

                {recipeExpanded && (
                  <div className="border-t">
                    {/* Original */}
                    <div className="flex items-center justify-between p-3 sm:p-4 border-b">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center text-lg sm:text-xl">
                          🍗
                        </div>
                        <span className="font-medium text-sm sm:text-base">
                          Receta Original
                        </span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setRecipeOriginal(Math.max(0, recipeOriginal - 1))
                          }
                          className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary text-white hover:bg-primary/90"
                          disabled={recipeOriginal === 0}
                        >
                          <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <span className="w-6 sm:w-8 text-center font-semibold text-sm sm:text-base">
                          {recipeOriginal}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            totalRecipe < requiredPieces &&
                            setRecipeOriginal(recipeOriginal + 1)
                          }
                          className="h-7 w-7 sm:h-8 sm:w-8 rounded-full"
                          disabled={totalRecipe >= requiredPieces}
                        >
                          <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Crispy */}
                    <div className="flex items-center justify-between p-3 sm:p-4 border-b">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-full flex items-center justify-center text-lg sm:text-xl">
                          🍗
                        </div>
                        <span className="font-medium text-sm sm:text-base">
                          Crispy
                        </span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setRecipeCrispy(Math.max(0, recipeCrispy - 1))
                          }
                          className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary text-white hover:bg-primary/90"
                          disabled={recipeCrispy === 0}
                        >
                          <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <span className="w-6 sm:w-8 text-center font-semibold text-sm sm:text-base">
                          {recipeCrispy}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            totalRecipe < requiredPieces &&
                            setRecipeCrispy(recipeCrispy + 1)
                          }
                          className="h-7 w-7 sm:h-8 sm:w-8 rounded-full"
                          disabled={totalRecipe >= requiredPieces}
                        >
                          <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Picante */}
                    <div className="flex items-center justify-between p-3 sm:p-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center text-lg sm:text-xl">
                          🌶️
                        </div>
                        <span className="font-medium text-sm sm:text-base">
                          Picante
                        </span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setRecipePicante(Math.max(0, recipePicante - 1))
                          }
                          className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary text-white hover:bg-primary/90"
                          disabled={recipePicante === 0}
                        >
                          <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <span className="w-6 sm:w-8 text-center font-semibold text-sm sm:text-base">
                          {recipePicante}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            totalRecipe < requiredPieces &&
                            setRecipePicante(recipePicante + 1)
                          }
                          className="h-7 w-7 sm:h-8 sm:w-8 rounded-full"
                          disabled={totalRecipe >= requiredPieces}
                        >
                          <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Complement Selection */}
            {(isMegaProduct ||
              product.description?.toLowerCase().includes("complemento")) && (
              <Card className="bg-white border-0 shadow-sm overflow-hidden">
                <button
                  onClick={() => setComplementExpanded(!complementExpanded)}
                  className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50"
                >
                  <div className="text-left">
                    <h3 className="font-bold text-sm sm:text-base">
                      Elige tu complemento
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500">
                      Elige 1 opción
                    </p>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Badge
                      variant="outline"
                      className="text-gray-600 text-xs sm:text-sm"
                    >
                      Requerido
                    </Badge>
                    {complementExpanded ? (
                      <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </div>
                </button>

                {complementExpanded && (
                  <RadioGroup
                    value={selectedComplement}
                    onValueChange={setSelectedComplement}
                    className="border-t"
                  >
                    <div className="flex items-center justify-between p-3 sm:p-4 border-b hover:bg-gray-50">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-50 rounded-lg overflow-hidden">
                          <img
                            src="https://delosi-pidelo.s3.amazonaws.com/kfc/products/papa-familiar-202506160431489482.jpg"
                            alt="Papa Familiar"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="font-medium text-sm sm:text-base">
                          Papa Familiar
                        </span>
                      </div>
                      <RadioGroupItem
                        value="papa-familiar"
                        id="papa-familiar"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 sm:p-4 border-b hover:bg-gray-50">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-50 rounded-lg overflow-hidden">
                          <img
                            src="https://delosi-pidelo.s3.amazonaws.com/kfc/products/papa-super-familiar-202506160431519379.jpg"
                            alt="Papa Super Familiar"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <span className="font-medium text-sm sm:text-base">
                            Papa Super Familiar
                          </span>
                          <p className="text-xs sm:text-sm text-gray-500">
                            + S/6.90
                          </p>
                        </div>
                      </div>
                      <RadioGroupItem value="papa-super" id="papa-super" />
                    </div>

                    <div className="flex items-center justify-between p-3 sm:p-4 border-b hover:bg-gray-50">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-50 rounded-lg overflow-hidden">
                          <img
                            src="https://delosi-pidelo.s3.amazonaws.com/kfc/products/ensalada-familiar-202506160431528586.jpg"
                            alt="Ensalada Familiar"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="font-medium text-sm sm:text-base">
                          Ensalada Familiar
                        </span>
                      </div>
                      <RadioGroupItem value="ensalada" id="ensalada" />
                    </div>

                    <div className="flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-50 rounded-lg overflow-hidden">
                          <img
                            src="https://delosi-pidelo.s3.amazonaws.com/kfc/products/pure-familiar-202506201432024958.jpg"
                            alt="Puré Familiar"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="font-medium text-sm sm:text-base">
                          Puré Familiar
                        </span>
                      </div>
                      <RadioGroupItem value="pure" id="pure" />
                    </div>
                  </RadioGroup>
                )}
              </Card>
            )}

            {/* Extras / Add-ons */}
            <Card className="bg-white border-0 shadow-sm overflow-hidden">
              <button
                onClick={() => setExtrasExpanded(!extrasExpanded)}
                className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50"
              >
                <div className="text-left">
                  <h3 className="font-bold text-sm sm:text-base">
                    Agranda tu Mega
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Selecciona hasta 5 artículos
                  </p>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <Badge
                    variant="outline"
                    className="text-gray-600 text-xs sm:text-sm"
                  >
                    Opcional
                  </Badge>
                  {extrasExpanded ? (
                    <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </div>
              </button>

              {extrasExpanded && (
                <div className="border-t max-h-72 sm:max-h-96 overflow-y-auto">
                  {addOnItems.map((item: any) => (
                    <div
                      key={item.itemId}
                      className="flex items-center justify-between p-3 sm:p-4 border-b hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={item.imageUrl || "/placeholder.svg"}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "/placeholder.svg";
                            }}
                          />
                        </div>
                        <span className="font-medium text-xs sm:text-sm truncate">
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                        <span className="text-xs sm:text-sm text-gray-600">
                          + S/{item.price.toFixed(2)}
                        </span>
                        <Button
                          variant={
                            selectedExtras.includes(item.itemId)
                              ? "default"
                              : "outline"
                          }
                          size="icon"
                          onClick={() => handleToggleExtra(item.itemId)}
                          className="h-7 w-7 sm:h-8 sm:w-8 rounded-full"
                          disabled={
                            !selectedExtras.includes(item.itemId) &&
                            selectedExtras.length >= 5
                          }
                        >
                          <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;
