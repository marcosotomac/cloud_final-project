import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PromoCard from "./PromoCard";
import { useRef } from "react";
import { useActivePromotions } from "@/hooks/usePromotions";

const PromosSection = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { data: promotions, isLoading, error } = useActivePromotions();

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

  if (error) {
    return null;
  }

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold flex items-center gap-2">
            Promos 🔥
          </h2>
          <div className="flex gap-2">
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
              <div key={i} className="min-w-[280px]">
                <Skeleton className="w-full aspect-[4/3] rounded-lg mb-3" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-8 w-1/2" />
              </div>
            ))}
          </div>
        ) : promotions && promotions.length > 0 ? (
          <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {promotions.map((promo: any) => (
              <PromoCard
                key={promo.promotionId || promo.id}
                id={promo.promotionId || promo.id}
                image={
                  promo.imageUrl || promo.image || "/placeholder-promo.jpg"
                }
                title={promo.name || promo.title}
                description={promo.description || ""}
                discount={
                  promo.discountPercentage
                    ? `-${promo.discountPercentage}%`
                    : promo.discount
                    ? `-${promo.discount}%`
                    : undefined
                }
                originalPrice={
                  promo.originalPrice
                    ? `S/${promo.originalPrice.toFixed(2)}`
                    : undefined
                }
                currentPrice={`S/${(
                  promo.price ||
                  promo.discountedPrice ||
                  0
                ).toFixed(2)}`}
                badge={promo.badge || promo.type || "PROMOCIÓN"}
                price={promo.price || promo.discountedPrice || 0}
              />
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
