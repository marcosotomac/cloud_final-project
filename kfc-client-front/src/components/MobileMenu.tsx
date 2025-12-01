import { Home, Gift, ChevronRight, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

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
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleAuthClick = () => {
    onClose();
    navigate("/auth");
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-80 p-0 bg-background">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="bg-primary p-4 text-primary-foreground">
            <div className="flex items-center">
              {isAuthenticated && user ? (
                <div className="flex items-center gap-3 flex-1">
                  <div className="h-10 w-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                    <User className="h-6 w-6" />
                  </div>
                  <div className="text-left flex-1">
                    <SheetTitle className="text-primary-foreground font-semibold text-base">
                      {user.name}
                    </SheetTitle>
                    <p className="text-primary-foreground/80 text-sm truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  onClick={handleAuthClick}
                  className="flex items-center gap-3 text-primary-foreground hover:bg-primary-foreground/10 p-0"
                >
                  <div className="h-10 w-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                    <User className="h-6 w-6" />
                  </div>
                  <div className="text-left">
                    <SheetTitle className="text-primary-foreground font-semibold text-base">
                      Iniciar sesión
                    </SheetTitle>
                    <p className="text-primary-foreground/80 text-sm">
                      o Regístrate
                    </p>
                  </div>
                </Button>
              )}
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

              {/* Logout button when authenticated */}
              {isAuthenticated && (
                <div className="mt-6 border-t pt-4">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-6 py-3 hover:bg-muted transition-colors w-full text-left text-destructive"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenu;
