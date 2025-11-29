import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import PromoCard from "./PromoCard";
import promoNuggets from "@/assets/promo-nuggets.jpg";
import promoWings from "@/assets/promo-wings.jpg";
import promoCombo from "@/assets/promo-combo.jpg";
import promoBucket from "@/assets/promo-bucket.jpg";
import promoTwister from "@/assets/promo-twister.jpg";
import { useRef } from "react";

const promos = [
  {
    id: 1,
    image: promoNuggets,
    title: "Mega Delivery - 6 Piezas",
    description: "6 Piezas de Pollo y 1 Papa Familiar",
    discount: "-32%",
    originalPrice: "S/59.30",
    currentPrice: "S/39.90",
    badge: "GRANDES AHORROS",
  },
  {
    id: 2,
    image: promoWings,
    title: "Wings & Krunch: 18 Hot Wings",
    description: "18 Hot Wings y 1 Complemento Familiar",
    discount: "-40%",
    originalPrice: "S/63.20",
    currentPrice: "S/37.90",
    badge: "GRANDES AHORROS",
  },
  {
    id: 3,
    image: promoCombo,
    title: "Mega Promo: 7 Piezas",
    description: "7 Piezas de Pollo, 1 Complemento Familiar y 1 Bebida 1L",
    currentPrice: "S/42.90",
    badge: "GRANDES AHORROS",
  },
  {
    id: 4,
    image: promoBucket,
    title: "Mega Promo - 8 Piezas",
    description: "8 Piezas de Pollo y 1 Papa Familiar",
    discount: "-33%",
    originalPrice: "S/75.10",
    currentPrice: "S/49.90",
    badge: "GRANDES AHORROS",
  },
  {
    id: 5,
    image: promoTwister,
    title: "Dúo Twister XL con Papas",
    description: "2 Twisters XL Tradicionales y 2 Complementos Regulares",
    discount: "-30%",
    originalPrice: "S/56.60",
    currentPrice: "S/38.90",
    badge: "GRANDES AHORROS",
  },
];

const PromosSection = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {promos.map((promo) => (
            <PromoCard key={promo.id} {...promo} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PromosSection;
