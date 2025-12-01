import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePromotions } from "@/hooks/usePromotions";
import heroImage from "@/assets/hero-christmas.jpg";

const HeroCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { data: promotions = [], isLoading } = usePromotions();

  // Build slides from promotions or use fallback
  const slides = useMemo(() => {
    if (promotions.length > 0) {
      return promotions.slice(0, 5).map((promo: any, index: number) => ({
        id: promo.promotionId || promo.id || index,
        image: promo.imageUrl || promo.image || heroImage,
        alt: promo.name || promo.title || "Promoción KFC",
        title: promo.name || promo.title,
        description: promo.description,
      }));
    }
    // Fallback slides if no promotions
    return [
      {
        id: 1,
        image: heroImage,
        alt: "Mega Navidad - Promoción especial",
        title: "¡Ofertas Especiales!",
        description: "Descubre nuestras promociones",
      },
    ];
  }, [promotions]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  if (isLoading) {
    return (
      <div className="relative w-full bg-gradient-hero overflow-hidden rounded-2xl shadow-lg">
        <div className="aspect-[21/9] md:aspect-[21/7] flex items-center justify-center bg-muted">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-gradient-hero overflow-hidden rounded-xl sm:rounded-2xl shadow-lg">
      {/* Slides */}
      <div className="relative aspect-[16/9] sm:aspect-[21/9] md:aspect-[21/7]">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={slide.image}
              alt={slide.alt}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = heroImage;
              }}
            />
            {/* Optional overlay with text */}
            {slide.title && (
              <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-white text-center p-4">
                <h2 className="text-xl sm:text-3xl md:text-5xl font-bold mb-1 sm:mb-2">
                  {slide.title}
                </h2>
                {slide.description && (
                  <p className="text-sm sm:text-lg md:text-xl max-w-2xl">
                    {slide.description}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Navigation Arrows - only show if more than 1 slide */}
      {slides.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={prevSlide}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-background/20 hover:bg-background/40 text-primary-foreground backdrop-blur-sm h-8 w-8 sm:h-12 sm:w-12 rounded-full"
          >
            <ChevronLeft className="h-5 w-5 sm:h-8 sm:w-8" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={nextSlide}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-background/20 hover:bg-background/40 text-primary-foreground backdrop-blur-sm h-8 w-8 sm:h-12 sm:w-12 rounded-full"
          >
            <ChevronRight className="h-5 w-5 sm:h-8 sm:w-8" />
          </Button>

          {/* Pagination Dots */}
          <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all ${
                  index === currentSlide
                    ? "bg-primary-foreground w-6 sm:w-8"
                    : "bg-primary-foreground/50 hover:bg-primary-foreground/75"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default HeroCarousel;
