import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Minus, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Header from "@/components/Header";
import SubNav from "@/components/SubNav";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import promoNuggets from "@/assets/promo-nuggets.jpg";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  
  const [quantity, setQuantity] = useState(1);
  const [recipeExpanded, setRecipeExpanded] = useState(true);
  const [complementExpanded, setComplementExpanded] = useState(true);
  
  const [recipeOriginal, setRecipeOriginal] = useState(6);
  const [recipeCrispy, setRecipeCrispy] = useState(0);
  const [recipePicante, setRecipePicante] = useState(0);
  const [selectedComplement, setSelectedComplement] = useState("familiar");

  const product = {
    id: "mega-delivery-6",
    name: "Mega Delivery - 6 Piezas",
    description: "6 Piezas de Pollo y 1 Papa Familiar",
    price: 39.90,
    originalPrice: 59.30,
    discount: 32,
    image: promoNuggets,
  };

  const totalRecipe = recipeOriginal + recipeCrispy + recipePicante;
  const recipeComplete = totalRecipe === 6;
  const complementRequired = selectedComplement !== "";

  const handleAddToCart = () => {
    if (!recipeComplete) {
      toast.error("Completa tu selección de receta");
      return;
    }
    
    if (!complementRequired) {
      toast.error("Selecciona un complemento");
      return;
    }

    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity,
      image: product.image,
      recipe: `${recipeOriginal} Original, ${recipeCrispy} Crispy, ${recipePicante} Picante`,
      complement: selectedComplement,
    });

    toast.success("Producto agregado al carrito");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <SubNav />

      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Product Image Card */}
          <Card className="p-6">
            <div className="relative mb-6">
              <img
                src={product.image}
                alt={product.name}
                className="w-full aspect-square object-contain"
              />
              <Badge className="absolute top-4 left-4 bg-accent text-accent-foreground">
                IMÁGENES REFERENCIALES
              </Badge>
            </div>

            <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
            <p className="text-muted-foreground mb-4">{product.description}</p>

            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl font-bold">S/{product.price.toFixed(2)}</span>
              <span className="text-muted-foreground line-through">
                S/{product.originalPrice.toFixed(2)}
              </span>
              <span className="text-festive-green font-semibold">{product.discount}%</span>
            </div>

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
                <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
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
                disabled={!recipeComplete || !complementRequired}
                className="flex-1 h-12 text-base font-semibold bg-muted hover:bg-muted/80 text-foreground"
              >
                Agregar (S/{(product.price * quantity).toFixed(2)})
              </Button>
            </div>
          </Card>

          {/* Customization Panel */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Personaliza tu pedido</h2>

            {/* Recipe Selection */}
            <Card className="p-6">
              <button
                onClick={() => setRecipeExpanded(!recipeExpanded)}
                className="w-full flex items-center justify-between mb-4"
              >
                <div className="text-left">
                  <h3 className="font-bold text-lg">Elige la Receta</h3>
                  <p className="text-sm text-muted-foreground">6x Receta Original</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={recipeComplete ? "default" : "secondary"} className="bg-festive-green">
                    {recipeComplete ? "Completado" : "Requerido"}
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
                        onClick={() => setRecipeOriginal(Math.max(0, recipeOriginal - 1))}
                        className="h-8 w-8 rounded-full bg-primary text-primary-foreground"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-semibold">{recipeOriginal}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setRecipeOriginal(Math.min(6, recipeOriginal + 1))}
                        className="h-8 w-8 rounded-full"
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
                        onClick={() => setRecipeCrispy(Math.max(0, recipeCrispy - 1))}
                        className="h-8 w-8 rounded-full bg-primary text-primary-foreground"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-semibold">{recipeCrispy}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setRecipeCrispy(Math.min(6 - recipeOriginal - recipePicante, recipeCrispy + 1))}
                        className="h-8 w-8 rounded-full"
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
                        onClick={() => setRecipePicante(Math.max(0, recipePicante - 1))}
                        className="h-8 w-8 rounded-full bg-primary text-primary-foreground"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-semibold">{recipePicante}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setRecipePicante(Math.min(6 - recipeOriginal - recipeCrispy, recipePicante + 1))}
                        className="h-8 w-8 rounded-full"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Complement Selection */}
            <Card className="p-6">
              <button
                onClick={() => setComplementExpanded(!complementExpanded)}
                className="w-full flex items-center justify-between mb-4"
              >
                <div className="text-left">
                  <h3 className="font-bold text-lg">Elige tu complemento</h3>
                  <p className="text-sm text-muted-foreground">Elige 1 opción</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Requerido</Badge>
                  {complementExpanded ? <ChevronUp /> : <ChevronDown />}
                </div>
              </button>

              {complementExpanded && (
                <RadioGroup value={selectedComplement} onValueChange={setSelectedComplement}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded-full" />
                        <Label htmlFor="familiar" className="font-medium cursor-pointer">
                          Papa Familiar
                        </Label>
                      </div>
                      <RadioGroupItem value="familiar" id="familiar" />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded-full" />
                        <div className="flex flex-col">
                          <Label htmlFor="super" className="font-medium cursor-pointer">
                            Papa Super Familiar
                          </Label>
                          <span className="text-sm text-muted-foreground">+ S/6.90</span>
                        </div>
                      </div>
                      <RadioGroupItem value="super" id="super" />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded-full" />
                        <Label htmlFor="ensalada" className="font-medium cursor-pointer">
                          Ensalada Familiar
                        </Label>
                      </div>
                      <RadioGroupItem value="ensalada" id="ensalada" />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded-full" />
                        <Label htmlFor="pure" className="font-medium cursor-pointer">
                          Puré Familiar
                        </Label>
                      </div>
                      <RadioGroupItem value="pure" id="pure" />
                    </div>
                  </div>
                </RadioGroup>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductDetail;
