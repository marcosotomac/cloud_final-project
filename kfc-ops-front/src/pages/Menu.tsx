import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Edit,
  Plus,
  Trash2,
  Search,
  Loader2,
  RefreshCw,
  Package,
} from "lucide-react";
import { ProductDialog, Product } from "@/components/ProductDialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  useMenu,
  useMenuCategories,
  useCreateMenuItem,
  useUpdateMenuItem,
  useDeleteMenuItem,
} from "@/hooks/useMenu";

const defaultCategories = [
  "Promos",
  "Megas",
  "Para 2",
  "Sándwiches & Twister XL",
  "Big Box",
  "Combos",
  "Complementos",
  "Postres",
  "Bebidas",
];

const Menu = () => {
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);

  // Fetch real data
  const { data: menuItems = [], isLoading, refetch, isRefetching } = useMenu();
  const { data: apiCategories = [] } = useMenuCategories();

  // Mutations
  const createMenuItem = useCreateMenuItem();
  const updateMenuItem = useUpdateMenuItem();
  const deleteMenuItem = useDeleteMenuItem();

  // Transform API items to Product format
  const products: Product[] = useMemo(() => {
    if (!Array.isArray(menuItems)) return [];

    return menuItems.map((item: any) => ({
      id: item.itemId || item.id,
      name: item.name,
      description: item.description || "",
      price: item.price || 0,
      oldPrice: item.oldPrice || null,
      discount: item.discount || null,
      category: item.category || "Sin categoría",
      imageUrl: item.imageUrl || item.image || "",
      isAvailable: item.isAvailable !== false,
      stock: item.stock ?? -1, // -1 = ilimitado
    }));
  }, [menuItems]);

  // Build categories list
  const categories = useMemo(() => {
    const cats =
      apiCategories.length > 0
        ? apiCategories.map((c: any) => c.name || c)
        : defaultCategories;
    return ["Todos", ...cats];
  }, [apiCategories]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === "Todos" || product.category === selectedCategory;
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesAvailability = !showOnlyAvailable || product.isAvailable;
      return matchesCategory && matchesSearch && matchesAvailability;
    });
  }, [products, selectedCategory, searchTerm, showOnlyAvailable]);

  const handleSaveProduct = async (
    productData: Omit<Product, "id"> & { id?: string }
  ) => {
    try {
      if (productData.id) {
        await updateMenuItem.mutateAsync({
          itemId: productData.id,
          data: {
            name: productData.name,
            description: productData.description,
            price: productData.price,
            oldPrice: productData.oldPrice,
            discount: productData.discount,
            category: productData.category,
            imageUrl: productData.imageUrl,
            isAvailable: productData.isAvailable,
            stock: productData.stock,
          },
        });
        toast.success("Producto actualizado correctamente");
      } else {
        await createMenuItem.mutateAsync({
          name: productData.name,
          description: productData.description,
          price: productData.price,
          oldPrice: productData.oldPrice,
          discount: productData.discount,
          category: productData.category,
          imageUrl: productData.imageUrl,
          isAvailable: productData.isAvailable,
          stock: productData.stock,
        });
        toast.success("Producto creado correctamente");
      }
      setEditingProduct(undefined);
      setDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Error al guardar producto");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteMenuItem.mutateAsync(id);
      toast.success("Producto eliminado");
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar producto");
    }
  };

  const handleOpenDialog = (product?: Product) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando menú...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Menú</h1>
          <p className="text-muted-foreground mt-2">
            CRUD completo de productos del menú
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`}
            />
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Producto
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="available-only"
              checked={showOnlyAvailable}
              onCheckedChange={setShowOnlyAvailable}
            />
            <Label htmlFor="available-only">Solo disponibles</Label>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap mb-6">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </Card>

      {filteredProducts.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">
            {products.length === 0
              ? "No hay productos en el menú. Agrega el primer producto."
              : "No se encontraron productos con los filtros seleccionados"}
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className="overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl">🍗</span>
                )}
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-lg">{product.name}</h3>
                  <Badge
                    variant={product.isAvailable ? "default" : "secondary"}
                    className={
                      product.isAvailable && product.stock !== 0
                        ? "bg-green-500/20 text-green-700 dark:text-green-400"
                        : "bg-red-500/20 text-red-700 dark:text-red-400"
                    }
                  >
                    {product.stock === 0
                      ? "Sin Stock"
                      : product.isAvailable
                      ? "Disponible"
                      : "No disponible"}
                  </Badge>
                </div>

                <div className="flex gap-2 mb-3">
                  <Badge variant="outline">{product.category}</Badge>
                  <Badge
                    variant="outline"
                    className={
                      product.stock === -1
                        ? "bg-blue-500/10 border-blue-500/30"
                        : product.stock === 0
                        ? "bg-red-500/10 border-red-500/30"
                        : product.stock <= 10
                        ? "bg-yellow-500/10 border-yellow-500/30"
                        : "bg-green-500/10 border-green-500/30"
                    }
                  >
                    <Package className="w-3 h-3 mr-1" />
                    {product.stock === -1 ? "∞" : product.stock}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {product.description}
                </p>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold text-primary">
                      S/{product.price.toFixed(2)}
                    </span>
                    {product.oldPrice && (
                      <span className="text-sm text-muted-foreground line-through ml-2">
                        S/{product.oldPrice.toFixed(2)}
                      </span>
                    )}
                    {product.discount && (
                      <Badge className="ml-2 bg-red-500">
                        {product.discount}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(product)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteProduct(product.id)}
                      disabled={deleteMenuItem.isPending}
                    >
                      {deleteMenuItem.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editingProduct}
        onSave={handleSaveProduct}
      />
    </div>
  );
};

export default Menu;
