import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import SubNav from "@/components/SubNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMenu } from "@/hooks/useMenu";
import { useCart } from "@/contexts/CartContext";
import { Plus, Star, Package } from "lucide-react";
import { toast } from "sonner";

const categories = [
  { id: "all", name: "Todo el Menú", emoji: "🍗" },
  { id: "promos", name: "Promos", emoji: "🔥" },
  { id: "megas", name: "Megas", emoji: "🍗" },
  { id: "para-2", name: "Para 2", emoji: "👫" },
  { id: "sandwiches", name: "Sándwiches & Twister XL", emoji: "🥪" },
  { id: "big-box", name: "Big Box", emoji: "📦" },
  { id: "combos", name: "Combos", emoji: "🍱" },
  { id: "complementos", name: "Complementos", emoji: "🍟" },
  { id: "postres", name: "Postres", emoji: "🍰" },
  { id: "bebidas", name: "Bebidas", emoji: "🥤" },
];

const MenuPage = () => {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: allItems, isLoading } = useMenu();

  // Filtrar items por categoría seleccionada
  const items = useMemo(() => {
    if (!allItems || selectedCategory === "all") return allItems;

    const selectedCat = categories.find((c) => c.id === selectedCategory);
    if (!selectedCat) return allItems;

    return allItems.filter((item: any) => item.category === selectedCat.name);
  }, [allItems, selectedCategory]);

  const handleAddToCart = (item: any) => {
    // Validar stock
    const stock = item.stock ?? -1;
    if (stock === 0) {
      toast.error(`${item.name} no tiene stock disponible`);
      return;
    }

    addItem({
      id: item.itemId,
      name: item.name,
      price: item.price,
      quantity: 1,
      image: item.imageUrl || item.image || "/placeholder-food.jpg",
      stock: stock,
    });
    toast.success(`${item.name} agregado al carrito`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <SubNav />

      <main className="container mx-auto px-4 py-4 sm:py-8">
        <h1 className="text-xl sm:text-3xl font-bold mb-4 sm:mb-6">
          Nuestro Menú
        </h1>

        {/* Category Filter */}
        <div
          className="flex gap-2 overflow-x-auto pb-4 mb-4 sm:mb-8 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              className="rounded-full whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-10"
              onClick={() => setSelectedCategory(cat.id)}
            >
              <span className="mr-1 sm:mr-2">{cat.emoji}</span>
              <span className="hidden xs:inline sm:inline">{cat.name}</span>
              <span className="xs:hidden sm:hidden">
                {cat.name.split(" ")[0]}
              </span>
            </Button>
          ))}
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-square" />
                <div className="p-2 sm:p-4 space-y-2">
                  <Skeleton className="h-4 sm:h-6 w-3/4" />
                  <Skeleton className="h-3 sm:h-4 w-full" />
                  <Skeleton className="h-6 sm:h-8 w-1/3" />
                </div>
              </Card>
            ))}
          </div>
        ) : items && items.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {items.map((item: any) => {
              const stock = item.stock ?? -1;
              const isOutOfStock = stock === 0;
              const isLowStock = stock > 0 && stock <= 5;
              const isUnavailable = item.isAvailable === false || isOutOfStock;

              return (
                <Card
                  key={item.itemId}
                  className={`overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group ${
                    isUnavailable ? "opacity-75" : ""
                  }`}
                >
                  <div
                    className="relative aspect-square bg-muted"
                    onClick={() => navigate(`/product/${item.itemId}`)}
                  >
                    {item.imageUrl || item.image ? (
                      <img
                        src={item.imageUrl || item.image}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl sm:text-6xl">
                        🍗
                      </div>
                    )}
                    {item.discount && (
                      <Badge className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-primary text-[10px] sm:text-xs">
                        {item.discount}
                      </Badge>
                    )}
                    {/* Stock Badge */}
                    {stock !== -1 && (
                      <Badge
                        className={`absolute top-2 right-2 sm:top-3 sm:right-3 text-[10px] sm:text-xs ${
                          isOutOfStock
                            ? "bg-red-500"
                            : isLowStock
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                      >
                        <Package className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                        <span className="hidden sm:inline">
                          {isOutOfStock ? "Agotado" : `${stock} disp.`}
                        </span>
                        <span className="sm:hidden">
                          {isOutOfStock ? "0" : stock}
                        </span>
                      </Badge>
                    )}
                    {isUnavailable && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-bold text-xs sm:text-base">
                          {isOutOfStock ? "Agotado" : "No disponible"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-2 sm:p-4">
                    <div className="flex items-start justify-between mb-1 sm:mb-2">
                      <h3
                        className="font-bold text-xs sm:text-lg line-clamp-2 cursor-pointer hover:text-primary"
                        onClick={() => navigate(`/product/${item.itemId}`)}
                      >
                        {item.name}
                      </h3>
                      {item.rating && (
                        <div className="flex items-center text-[10px] sm:text-sm text-yellow-500">
                          <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-current" />
                          <span className="ml-0.5 sm:ml-1">{item.rating}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-[10px] sm:text-sm text-muted-foreground mb-2 sm:mb-4 line-clamp-2 hidden sm:block">
                      {item.description}
                    </p>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                        <span className="text-sm sm:text-xl font-bold text-primary">
                          S/{item.price?.toFixed(2)}
                        </span>
                        {item.oldPrice && (
                          <span className="text-[10px] sm:text-sm text-muted-foreground line-through">
                            S/{item.oldPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(item);
                        }}
                        disabled={isUnavailable}
                        className="h-7 sm:h-9 text-[10px] sm:text-sm px-2 sm:px-3 w-full sm:w-auto"
                      >
                        <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
                        {isOutOfStock ? "Agotado" : "Agregar"}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">🍗</div>
            <h2 className="text-2xl font-bold mb-2">No hay productos</h2>
            <p className="text-muted-foreground">
              No encontramos productos en esta categoría
            </p>
          </Card>
        )}
      </main>

      <footer className="bg-muted py-6 sm:py-8 mt-8 sm:mt-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm sm:text-base">
          <p>&copy; 2025 KFC Perú. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default MenuPage;
