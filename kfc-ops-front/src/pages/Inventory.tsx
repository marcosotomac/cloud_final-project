import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  Package,
  Loader2,
  RefreshCw,
  Plus,
  Minus,
} from "lucide-react";
import {
  useInventory,
  useInventoryAlerts,
  useAdjustInventory,
  useCreateInventoryItem,
} from "@/hooks/useInventory";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  minLevel: number;
  maxLevel: number;
  status: string;
  category?: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "critical":
      return "bg-destructive text-destructive-foreground";
    case "low":
      return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400";
    default:
      return "bg-green-500/20 text-green-700 dark:text-green-400";
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "critical":
      return "Crítico";
    case "low":
      return "Bajo";
    default:
      return "Óptimo";
  }
};

const calculateStatus = (
  quantity: number,
  min: number,
  max: number
): string => {
  if (quantity <= min * 0.5) return "critical";
  if (quantity <= min) return "low";
  return "good";
};

const Inventory = () => {
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState("");
  const [adjustType, setAdjustType] = useState<"add" | "remove" | "set">("add");
  const [adjustReason, setAdjustReason] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    category: "Ingredientes",
    quantity: 0,
    unit: "kg",
    minLevel: 10,
    maxLevel: 100,
    reorderPoint: 20,
  });

  // Fetch real data
  const {
    data: inventoryData = [],
    isLoading,
    refetch,
    isRefetching,
  } = useInventory();
  const { data: alerts = [] } = useInventoryAlerts();

  // Mutations
  const adjustInventory = useAdjustInventory();
  const createInventoryItem = useCreateInventoryItem();

  // Transform API data
  const inventory: InventoryItem[] = useMemo(() => {
    if (!Array.isArray(inventoryData)) return [];

    return inventoryData.map((item: any) => ({
      id: item.itemId || item.id,
      name: item.name,
      quantity: item.quantity || 0,
      unit: item.unit || "unidades",
      minLevel: item.minLevel || 10,
      maxLevel: item.maxLevel || 100,
      status:
        item.status ||
        calculateStatus(
          item.quantity,
          item.minLevel || 10,
          item.maxLevel || 100
        ),
      category: item.category,
    }));
  }, [inventoryData]);

  const lowStockCount = inventory.filter(
    (i) => i.status === "low" || i.status === "critical"
  ).length;

  const handleOpenAdjustDialog = (item: InventoryItem) => {
    setSelectedItem(item);
    setAdjustQuantity("");
    setAdjustType("add");
    setAdjustReason("");
    setAdjustDialogOpen(true);
  };

  const handleAdjustInventory = async () => {
    if (!selectedItem || !adjustQuantity) return;

    try {
      await adjustInventory.mutateAsync({
        itemId: selectedItem.id,
        quantity: parseInt(adjustQuantity),
        type: adjustType,
        reason: adjustReason || "Ajuste manual",
      });
      toast.success("Inventario ajustado correctamente");
      setAdjustDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Error al ajustar inventario");
    }
  };

  const handleCreateItem = async () => {
    if (!newItem.name) return;

    try {
      await createInventoryItem.mutateAsync(newItem);
      toast.success("Producto agregado al inventario");
      setCreateDialogOpen(false);
      setNewItem({
        name: "",
        category: "Ingredientes",
        quantity: 0,
        unit: "kg",
        minLevel: 10,
        maxLevel: 100,
        reorderPoint: 20,
      });
    } catch (error: any) {
      toast.error(error.message || "Error al crear producto");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando inventario...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Control de Inventario
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitorea el stock de productos
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
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Agregar Producto
          </Button>
        </div>
      </div>

      {/* Alert for low stock */}
      {lowStockCount > 0 && (
        <Card className="p-4 border-yellow-500 bg-yellow-500/5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="font-medium">Alerta de Inventario</p>
              <p className="text-sm text-muted-foreground">
                {lowStockCount} producto{lowStockCount !== 1 ? "s" : ""}{" "}
                {lowStockCount !== 1 ? "están" : "está"} por debajo del nivel
                mínimo
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Inventory Grid */}
      {inventory.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            No hay productos en el inventario. Agrega el primer producto.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {inventory.map((item) => {
            const percentage = (item.quantity / item.maxLevel) * 100;

            return (
              <Card
                key={item.id}
                className="p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary">
                      <Package className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.unit}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(item.status)}>
                    {getStatusLabel(item.status)}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Cantidad</span>
                    <span className="font-bold text-lg">
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                  <Progress value={Math.min(percentage, 100)} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Mín: {item.minLevel}</span>
                    <span>Máx: {item.maxLevel}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleOpenAdjustDialog(item)}
                  >
                    Ajustar
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedItem(item);
                      setAdjustType("add");
                      setAdjustQuantity(String(item.maxLevel - item.quantity));
                      setAdjustReason("Reabastecimiento");
                      setAdjustDialogOpen(true);
                    }}
                  >
                    Reabastecer
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Adjust Inventory Dialog */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar Inventario</DialogTitle>
            <DialogDescription>
              {selectedItem?.name} - Cantidad actual: {selectedItem?.quantity}{" "}
              {selectedItem?.unit}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de ajuste</Label>
              <Select
                value={adjustType}
                onValueChange={(v) => setAdjustType(v as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Agregar
                    </div>
                  </SelectItem>
                  <SelectItem value="remove">
                    <div className="flex items-center gap-2">
                      <Minus className="w-4 h-4" /> Retirar
                    </div>
                  </SelectItem>
                  <SelectItem value="set">Establecer cantidad</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cantidad</Label>
              <Input
                type="number"
                value={adjustQuantity}
                onChange={(e) => setAdjustQuantity(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Razón (opcional)</Label>
              <Input
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="Ej: Reabastecimiento semanal"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAdjustDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAdjustInventory}
              disabled={adjustInventory.isPending || !adjustQuantity}
            >
              {adjustInventory.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Item Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Producto al Inventario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={newItem.name}
                onChange={(e) =>
                  setNewItem({ ...newItem, name: e.target.value })
                }
                placeholder="Ej: Pollo Fresco"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cantidad inicial</Label>
                <Input
                  type="number"
                  value={newItem.quantity}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      quantity: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Unidad</Label>
                <Select
                  value={newItem.unit}
                  onValueChange={(v) => setNewItem({ ...newItem, unit: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="L">Litros</SelectItem>
                    <SelectItem value="unidades">Unidades</SelectItem>
                    <SelectItem value="g">Gramos</SelectItem>
                    <SelectItem value="ml">Mililitros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nivel mínimo</Label>
                <Input
                  type="number"
                  value={newItem.minLevel}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      minLevel: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Nivel máximo</Label>
                <Input
                  type="number"
                  value={newItem.maxLevel}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      maxLevel: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateItem}
              disabled={createInventoryItem.isPending || !newItem.name}
            >
              {createInventoryItem.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Inventory;
