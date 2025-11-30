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
import Header from "@/components/Header";
import SubNav from "@/components/SubNav";
import { useCart } from "@/contexts/CartContext";
import { useMenuItem, useProductReviews } from "@/hooks/useMenu";
import { toast } from "sonner";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const { data: product, isLoading, error } = useMenuItem(id || "");
  const { data: reviews } = useProductReviews(id || "");

  const [quantity, setQuantity] = useState(1);
  const [recipeExpanded, setRecipeExpanded] = useState(true);
  const [complementExpanded, setComplementExpanded] = useState(true);

  const [recipeOriginal, setRecipeOriginal] = useState(6);
  const [recipeCrispy, setRecipeCrispy] = useState(0);
  const [recipePicante, setRecipePicante] = useState(0);
  const [selectedComplement, setSelectedComplement] = useState("familiar");

  // Calculate if product has customization
  const hasRecipeSelection = product?.customizations?.some(
    (c: any) => c.type === "recipe"
  );
  const hasComplementSelection = product?.customizations?.some(
    (c: any) => c.type === "side"
  );
  const requiredPieces =
    product?.customizations?.find((c: any) => c.type === "recipe")?.required ||
    0;

  const totalRecipe = recipeOriginal + recipeCrispy + recipePicante;
  const recipeComplete = !hasRecipeSelection || totalRecipe === requiredPieces;
  const complementComplete =
    !hasComplementSelection || selectedComplement !== "";

  const handleAddToCart = () => {
    if (!product) return;

    if (hasRecipeSelection && !recipeComplete) {
      toast.error("Completa tu selección de receta");
      return;
    }

    if (hasComplementSelection && !complementComplete) {
      toast.error("Selecciona un complemento");
      return;
    }

    addItem({
      id: product.itemId,
      name: product.name,
      price: product.price,
      quantity,
      image: product.imageUrl,
      recipe: hasRecipeSelection
        ? `${recipeOriginal} Original, ${recipeCrispy} Crispy, ${recipePicante} Picante`
        : undefined,
      complement: hasComplementSelection ? selectedComplement : undefined,
    });

    toast.success("Producto agregado al carrito");
    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <SubNav />
        <main className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <Card className="p-6">
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
      <div className="min-h-screen bg-background">
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

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <SubNav />

      <main className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Product Image Card */}
          <Card className="p-6">
            <div className="relative mb-6">
              <img
                src={product.imageUrl || "/placeholder-product.jpg"}
                alt={product.name}
                className="w-full aspect-square object-contain"
              />
              <Badge className="absolute top-4 left-4 bg-accent text-accent-foreground">
                IMÁGENES REFERENCIALES
              </Badge>
            </div>

            <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
            <p className="text-muted-foreground mb-4">{product.description}</p>

            {/* Reviews summary */}
            {reviews && reviews.averageRating && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(reviews.averageRating)
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  ({reviews.totalReviews} reseñas)
                </span>
              </div>
            )}

            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl font-bold">
                S/{product.price.toFixed(2)}
              </span>
              {product.originalPrice && (
                <>
                  <span className="text-muted-foreground line-through">
                    S/{product.originalPrice.toFixed(2)}
                  </span>
                  <span className="text-festive-green font-semibold">
                    {discount}%
                  </span>
                </>
              )}
            </div>

            {/* Nutrition info */}
            {product.nutritionInfo && (
              <div className="grid grid-cols-4 gap-2 mb-4 text-center text-xs">
                <div className="bg-muted p-2 rounded">
                  <p className="font-semibold">
                    {product.nutritionInfo.calories}
                  </p>
                  <p className="text-muted-foreground">Calorías</p>
                </div>
                <div className="bg-muted p-2 rounded">
                  <p className="font-semibold">
                    {product.nutritionInfo.protein}g
                  </p>
                  <p className="text-muted-foreground">Proteína</p>
                </div>
                <div className="bg-muted p-2 rounded">
                  <p className="font-semibold">
                    {product.nutritionInfo.carbs}g
                  </p>
                  <p className="text-muted-foreground">Carbos</p>
                </div>
                <div className="bg-muted p-2 rounded">
                  <p className="font-semibold">{product.nutritionInfo.fat}g</p>
                  <p className="text-muted-foreground">Grasa</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-muted rounded-lg p-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="h-10 w-10"
                >
                  <Minus className="h-5 w-5" />
                </Button>
                <span className="text-xl font-semibold w-12 text-center">
                  {quantity}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                  className="h-10 w-10 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>

              <Button
                onClick={handleAddToCart}
                disabled={!recipeComplete || !complementComplete}
                className="flex-1 h-12 text-base font-semibold"
              >
                Agregar (S/{(product.price * quantity).toFixed(2)})
              </Button>
            </div>
          </Card>

          {/* Customization Panel */}
          <div className="space-y-4">
            {(hasRecipeSelection || hasComplementSelection) && (
              <h2 className="text-2xl font-bold">Personaliza tu pedido</h2>
            )}

            {/* Recipe Selection */}
            {hasRecipeSelection && (
              <Card className="p-6">
                <button
                  onClick={() => setRecipeExpanded(!recipeExpanded)}
                  className="w-full flex items-center justify-between mb-4"
                >
                  <div className="text-left">
                    <h3 className="font-bold text-lg">Elige la Receta</h3>
                    <p className="text-sm text-muted-foreground">
                      {requiredPieces}x Receta
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={recipeComplete ? "default" : "secondary"}
                      className="bg-festive-green"
                    >
                      {recipeComplete
                        ? "Completado"
                        : `${totalRecipe}/${requiredPieces}`}
                    </Badge>
                    {recipeExpanded ? <ChevronUp /> : <ChevronDown />}
                  </div>
                </button>

                {recipeExpanded && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded-full" />
                        <span className="font-medium">Receta Original</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            setRecipeOriginal(Math.max(0, recipeOriginal - 1))
                          }
                          className="h-8 w-8 rounded-full bg-primary text-primary-foreground"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-semibold">
                          {recipeOriginal}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            totalRecipe < requiredPieces &&
                            setRecipeOriginal(recipeOriginal + 1)
                          }
                          className="h-8 w-8 rounded-full"
                          disabled={totalRecipe >= requiredPieces}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded-full" />
                        <span className="font-medium">Crispy</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            setRecipeCrispy(Math.max(0, recipeCrispy - 1))
                          }
                          className="h-8 w-8 rounded-full bg-primary text-primary-foreground"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-semibold">
                          {recipeCrispy}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            totalRecipe < requiredPieces &&
                            setRecipeCrispy(recipeCrispy + 1)
                          }
                          className="h-8 w-8 rounded-full"
                          disabled={totalRecipe >= requiredPieces}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded-full" />
                        <span className="font-medium">Picante 🔥</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            setRecipePicante(Math.max(0, recipePicante - 1))
                          }
                          className="h-8 w-8 rounded-full bg-primary text-primary-foreground"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-semibold">
                          {recipePicante}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            totalRecipe < requiredPieces &&
                            setRecipePicante(recipePicante + 1)
                          }
                          className="h-8 w-8 rounded-full"
                          disabled={totalRecipe >= requiredPieces}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Complement Selection */}
            {hasComplementSelection && (
              <Card className="p-6">
                <button
                  onClick={() => setComplementExpanded(!complementExpanded)}
                  className="w-full flex items-center justify-between mb-4"
                >
                  <div className="text-left">
                    <h3 className="font-bold text-lg">Elige tu complemento</h3>
                    <p className="text-sm text-muted-foreground">
                      Elige 1 opción
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Requerido</Badge>
                    {complementExpanded ? <ChevronUp /> : <ChevronDown />}
                  </div>
                </button>

                {complementExpanded && (
                  <RadioGroup
                    value={selectedComplement}
                    onValueChange={setSelectedComplement}
                  >
                    <div className="space-y-3">
                      {(
                        product.customizations?.find(
                          (c: any) => c.type === "side"
                        )?.options || [
                          {
                            id: "familiar",
                            name: "Papa Familiar",
                            extraPrice: 0,
                          },
                          {
                            id: "super",
                            name: "Papa Super Familiar",
                            extraPrice: 6.9,
                          },
                          {
                            id: "ensalada",
                            name: "Ensalada Familiar",
                            extraPrice: 0,
                          },
                          { id: "pure", name: "Puré Familiar", extraPrice: 0 },
                        ]
                      ).map((option: any) => (
                        <div
                          key={option.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-muted rounded-full" />
                            <div className="flex flex-col">
                              <Label
                                htmlFor={option.id}
                                className="font-medium cursor-pointer"
                              >
                                {option.name}
                              </Label>
                              {option.extraPrice > 0 && (
                                <span className="text-sm text-muted-foreground">
                                  + S/{option.extraPrice.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                          <RadioGroupItem value={option.id} id={option.id} />
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                )}
              </Card>
            )}

            {/* If no customization, show product details */}
            {!hasRecipeSelection && !hasComplementSelection && (
              <Card className="p-6">
                <h3 className="font-bold text-lg mb-4">
                  Detalles del producto
                </h3>
                <p className="text-muted-foreground">{product.description}</p>
                {product.ingredients && (
                  <div className="mt-4">
                    <p className="font-medium mb-2">Ingredientes:</p>
                    <p className="text-sm text-muted-foreground">
                      {product.ingredients.join(", ")}
                    </p>
                  </div>
                )}
                {product.allergens && product.allergens.length > 0 && (
                  <div className="mt-4">
                    <p className="font-medium mb-2">Alérgenos:</p>
                    <div className="flex flex-wrap gap-2">
                      {product.allergens.map((allergen: string) => (
                        <Badge key={allergen} variant="outline">
                          {allergen}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductDetail;
