import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import SubNav from "@/components/SubNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMenu, useMenuByCategory } from "@/hooks/useMenu";
import { useCart } from "@/contexts/CartContext";
import { Plus, Star } from "lucide-react";
import { toast } from "sonner";

const categories = [
  { id: "all", name: "Todo el Menú", emoji: "🍗" },
  { id: "pollo", name: "Pollo Frito", emoji: "🍗" },
  { id: "combos", name: "Combos", emoji: "🍱" },
  { id: "sandwiches", name: "Sandwiches", emoji: "🥪" },
  { id: "complementos", name: "Complementos", emoji: "🍟" },
  { id: "bebidas", name: "Bebidas", emoji: "🥤" },
  { id: "postres", name: "Postres", emoji: "🍰" },
];

const MenuPage = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const selectedCategory = category || "all";

  const { data: allItems, isLoading: allLoading } = useMenu();
  const { data: categoryItems, isLoading: categoryLoading } = useMenuByCategory(
    selectedCategory !== "all" ? selectedCategory : ""
  );

  const items = selectedCategory === "all" ? allItems : categoryItems;
  const isLoading = selectedCategory === "all" ? allLoading : categoryLoading;

  const handleAddToCart = (item: any) => {
    addItem({
      id: item.itemId,
      name: item.name,
      price: item.price,
      quantity: 1,
      image: item.image || "/placeholder-food.jpg",
    });
    toast.success(`${item.name} agregado al carrito`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <SubNav />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Nuestro Menú</h1>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              className="rounded-full whitespace-nowrap"
              onClick={() =>
                navigate(cat.id === "all" ? "/menu" : `/menu/${cat.id}`)
              }
            >
              <span className="mr-2">{cat.emoji}</span>
              {cat.name}
            </Button>
          ))}
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-square" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-8 w-1/3" />
                </div>
              </Card>
            ))}
          </div>
        ) : items && items.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item: any) => (
              <Card
                key={item.itemId}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
              >
                <div
                  className="relative aspect-square bg-muted"
                  onClick={() => navigate(`/product/${item.itemId}`)}
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">
                      🍗
                    </div>
                  )}
                  {item.discount && (
                    <Badge className="absolute top-3 left-3 bg-primary">
                      -{item.discount}%
                    </Badge>
                  )}
                  {item.isAvailable === false && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-bold">
                        No disponible
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3
                      className="font-bold text-lg line-clamp-2 cursor-pointer hover:text-primary"
                      onClick={() => navigate(`/product/${item.itemId}`)}
                    >
                      {item.name}
                    </h3>
                    {item.rating && (
                      <div className="flex items-center text-sm text-yellow-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="ml-1">{item.rating}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xl font-bold text-primary">
                        S/{item.price?.toFixed(2)}
                      </span>
                      {item.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through ml-2">
                          S/{item.originalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(item);
                      }}
                      disabled={item.isAvailable === false}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
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

      <footer className="bg-muted py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 KFC Perú. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default MenuPage;
