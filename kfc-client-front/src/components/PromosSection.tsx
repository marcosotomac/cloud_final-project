import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRef } from "react";
import { useMenu } from "@/hooks/useMenu";
import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface MenuItem {
  itemId: string;
  name: string;
  description: string;
  price: number;
  oldPrice?: number;
  discount?: string;
  category: string;
  imageUrl?: string;
}

const PromosSection = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { data: menuItems = [], isLoading, error } = useMenu();
  const { addItem } = useCart();
  const navigate = useNavigate();

  // Get promo products (category "Promos" or items with significant discounts)
  const promoProducts = (menuItems as MenuItem[])
    .filter(
      (item) =>
        item.category?.toLowerCase() === "promos" ||
        (item.discount && parseInt(item.discount) <= -25)
    )
    .slice(0, 10);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      const newScrollLeft =
        scrollContainerRef.current.scrollLeft +
        (direction === "left" ? -scrollAmount : scrollAmount);
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      });
    }
  };

  const handleAddToCart = (e: React.MouseEvent, item: MenuItem) => {
    e.stopPropagation();
    addItem({
      id: item.itemId,
      name: item.name,
      price: item.price,
      quantity: 1,
      image: item.imageUrl || "/placeholder.svg",
    });
    toast.success(`${item.name} agregado al carrito`);
  };

  if (error) {
    return null;
  }

  return (
    <section className="py-8 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-2xl font-bold flex items-center gap-2">
            Promos 🔥
          </h2>
          <div className="hidden sm:flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("left")}
              className="rounded-full"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("right")}
              className="rounded-full"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="min-w-[220px]">
                <Skeleton className="w-full aspect-square rounded-lg mb-3" />
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-6 w-1/2" />
              </div>
            ))}
          </div>
        ) : promoProducts.length > 0 ? (
          <div
            ref={scrollContainerRef}
            className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 sm:mx-0 sm:px-0"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {promoProducts.map((item) => (
              <Card
                key={item.itemId}
                onClick={() => navigate(`/product/${item.itemId}`)}
                className="flex-shrink-0 w-40 sm:w-48 md:w-56 bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer border-0"
              >
                <div className="relative aspect-square p-3 bg-gradient-to-b from-red-50 to-orange-50">
                  <img
                    src={item.imageUrl || "/placeholder.svg"}
                    alt={item.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.svg";
                    }}
                  />
                  <Button
                    size="icon"
                    onClick={(e) => handleAddToCart(e, item)}
                    className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-white hover:bg-gray-100 text-gray-800 shadow-md border"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="p-2 sm:p-3">
                  <h3 className="font-semibold text-xs sm:text-sm mb-1 line-clamp-2">
                    {item.name}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-gray-500 mb-2 line-clamp-2 hidden sm:block">
                    {item.description}
                  </p>

                  <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                    {item.discount && (
                      <span className="text-green-600 font-bold text-xs sm:text-sm">
                        {item.discount}
                      </span>
                    )}
                    {item.oldPrice && (
                      <span className="text-gray-400 text-xs sm:text-sm line-through">
                        S/{item.oldPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm sm:text-lg font-bold">
                    S/{item.price.toFixed(2)}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No hay promociones disponibles en este momento
          </div>
        )}
      </div>
    </section>
  );
};

export default PromosSection;
