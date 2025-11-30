import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

interface PromoCardProps {
  id: string;
  image: string;
  title: string;
  description: string;
  discount?: string;
  originalPrice?: string;
  currentPrice: string;
  badge?: string;
  price?: number;
}

const PromoCard = ({
  id,
  image,
  title,
  description,
  discount,
  originalPrice,
  currentPrice,
  badge,
  price,
}: PromoCardProps) => {
  const navigate = useNavigate();
  const { addItem } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem({
      id,
      name: title,
      price: price || parseFloat(currentPrice.replace(/[^\d.]/g, "")),
      quantity: 1,
      image,
    });
    toast.success(`${title} agregado al carrito`);
  };

  return (
    <Card className="flex-shrink-0 w-72 bg-gradient-promo rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 cursor-pointer">
      <div onClick={() => navigate(`/product/${id}`)}>
        {/* Image Section */}
        <div className="relative aspect-square p-4">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/placeholder.svg";
            }}
          />
          {badge && (
            <Badge className="absolute top-6 left-6 bg-accent text-accent-foreground text-xs px-2 py-1">
              {badge}
            </Badge>
          )}
          <Button
            size="icon"
            onClick={handleAddToCart}
            className="absolute bottom-6 right-6 h-10 w-10 rounded-full bg-background hover:bg-background/90 text-foreground shadow-lg"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {/* Content Section */}
        <div className="p-4 bg-background rounded-t-2xl">
          <h3 className="font-bold text-lg mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {description}
          </p>

          <div className="flex items-center gap-2">
            {discount && (
              <span className="text-festive-green font-semibold text-sm">
                {discount}
              </span>
            )}
            {originalPrice && (
              <span className="text-muted-foreground text-sm line-through">
                {originalPrice}
              </span>
            )}
          </div>

          <p className="text-xl font-bold mt-1">{currentPrice}</p>
        </div>
      </div>
    </Card>
  );
};

export default PromoCard;
