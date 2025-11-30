import { useState } from "react";
import {
  Menu,
  Search,
  ShoppingCart,
  MapPin,
  ChevronDown,
  User,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import MobileMenu from "./MobileMenu";
import LocationModal from "./LocationModal";

const Header = () => {
  const { totalItems } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [location, setLocation] = useState("Ingresa tu ubicación");
  const [searchQuery, setSearchQuery] = useState("");

  const handleLocationConfirm = (address: string) => {
    setLocation(address.split(",")[0]);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/menu?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-primary shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Left: Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMenuOpen(true)}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Menu className="h-6 w-6" />
            </Button>

            {/* Logo */}
            <div
              className="flex-shrink-0 cursor-pointer"
              onClick={() => navigate("/")}
            >
              <h1 className="text-3xl font-bold text-primary-foreground tracking-wider">
                KFC
              </h1>
            </div>

            {/* Search Bar */}
            <form
              onSubmit={handleSearch}
              className="hidden md:flex flex-1 max-w-xl"
            >
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder='Buscar "Mega"'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 bg-background border-0 focus-visible:ring-2 focus-visible:ring-primary-foreground/20"
                />
              </div>
            </form>

            {/* Right: Location, Account, Cart */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => setLocationModalOpen(true)}
                className="hidden lg:flex text-primary-foreground hover:bg-primary-foreground/10 gap-2"
              >
                <MapPin className="h-5 w-5" />
                <span className="hidden xl:inline max-w-32 truncate">
                  {location}
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>

              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="hidden md:flex text-primary-foreground hover:bg-primary-foreground/10 gap-2"
                    >
                      <User className="h-5 w-5" />
                      <div className="flex flex-col items-start text-xs">
                        <span>Hola, {user?.name?.split(" ")[0]}</span>
                        <span className="font-semibold">Mi cuenta</span>
                      </div>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => navigate("/profile")}>
                      <User className="h-4 w-4 mr-2" />
                      Mi perfil
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate("/profile?tab=orders")}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Mis pedidos
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-destructive"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Cerrar sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => navigate("/auth")}
                  className="hidden md:flex text-primary-foreground hover:bg-primary-foreground/10 gap-2"
                >
                  <User className="h-5 w-5" />
                  <div className="flex flex-col items-start text-xs">
                    <span>Hola, identifícate</span>
                    <span className="font-semibold">Inicia sesión</span>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/cart")}
                className="relative text-primary-foreground hover:bg-primary-foreground/10"
              >
                <ShoppingCart className="h-6 w-6" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-accent text-accent-foreground">
                  {totalItems}
                </Badge>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <LocationModal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        onConfirm={handleLocationConfirm}
      />
    </>
  );
};

export default Header;
