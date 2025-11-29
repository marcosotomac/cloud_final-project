import { Home, Gift, ChevronRight, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { NavLink } from "@/components/NavLink";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuCategories = [
  { name: "Promos", path: "/menu/promos" },
  { name: "Megas", path: "/menu/megas" },
  { name: "Para 2", path: "/menu/para-2" },
  { name: "Sándwiches & Twister XL", path: "/menu/sandwiches" },
  { name: "Big Box", path: "/menu/big-box" },
  { name: "Combos", path: "/menu/combos" },
  { name: "Complementos", path: "/menu/complementos" },
  { name: "Postres", path: "/menu/postres" },
  { name: "Bebidas", path: "/menu/bebidas" },
];

const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-80 p-0 bg-background">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="bg-primary p-4 text-primary-foreground">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="h-8 w-8" />
                <div className="text-left">
                  <SheetTitle className="text-primary-foreground font-semibold">
                    Iniciar sesión
                  </SheetTitle>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-primary-foreground hover:bg-primary-foreground/10"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
          </SheetHeader>

          {/* Main Navigation */}
          <nav className="flex-1 overflow-y-auto">
            <div className="py-4">
              <NavLink
                to="/"
                onClick={onClose}
                className="flex items-center gap-3 px-6 py-3 hover:bg-muted transition-colors"
              >
                <Home className="h-5 w-5 text-primary" />
                <span className="font-medium">Inicio</span>
              </NavLink>

              <NavLink
                to="/ventas-corporativas"
                onClick={onClose}
                className="flex items-center gap-3 px-6 py-3 hover:bg-muted transition-colors"
              >
                <Gift className="h-5 w-5" />
                <span>Ventas Corporativas</span>
              </NavLink>

              <div className="mt-6">
                <h3 className="px-6 py-2 font-bold text-lg">Menú</h3>
                {menuCategories.map((category) => (
                  <NavLink
                    key={category.path}
                    to={category.path}
                    onClick={onClose}
                    className="flex items-center justify-between px-6 py-3 hover:bg-muted transition-colors"
                  >
                    <span>{category.name}</span>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </NavLink>
                ))}
              </div>
            </div>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenu;
