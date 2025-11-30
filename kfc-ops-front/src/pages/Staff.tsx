import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UserPlus,
  Search,
  Edit,
  Trash2,
  Loader2,
  RefreshCw,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  useStaff,
  useCreateStaff,
  useUpdateStaff,
  useDeleteStaff,
} from "@/hooks/useStaff";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role:
    | "manager"
    | "cashier"
    | "kitchen"
    | "delivery"
    | "admin"
    | "cook"
    | "packer";
  status: "active" | "inactive" | "on-break";
  lastActive?: string;
  phone?: string;
}

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  manager: "Gerente",
  cashier: "Cajero",
  kitchen: "Cocina",
  cook: "Cocinero",
  packer: "Empacador",
  delivery: "Delivery",
};

const roleColors: Record<string, string> = {
  admin: "bg-purple-500/20 text-purple-700 dark:text-purple-400",
  manager: "bg-purple-500/20 text-purple-700 dark:text-purple-400",
  cashier: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
  kitchen: "bg-orange-500/20 text-orange-700 dark:text-orange-400",
  cook: "bg-orange-500/20 text-orange-700 dark:text-orange-400",
  packer: "bg-green-500/20 text-green-700 dark:text-green-400",
  delivery: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
};

const Staff = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "cashier" as StaffMember["role"],
    password: "",
    phone: "",
  });

  // Fetch real data
  const { data: staffData = [], isLoading, refetch, isRefetching } = useStaff();

  // Mutations
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();
  const deleteStaff = useDeleteStaff();

  // Transform API data
  const staff: StaffMember[] = useMemo(() => {
    if (!Array.isArray(staffData)) return [];

    return staffData.map((member: any) => ({
      id: member.staffId || member.id,
      name: member.name,
      email: member.email,
      role: member.role || "cashier",
      status: member.status || "active",
      lastActive: member.lastActive || member.updatedAt || "Sin actividad",
      phone: member.phone,
    }));
  }, [staffData]);

  const filteredStaff = useMemo(() => {
    return staff.filter(
      (member) =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [staff, searchTerm]);

  const handleOpenDialog = (member?: StaffMember) => {
    if (member) {
      setEditingStaff(member);
      setFormData({
        name: member.name,
        email: member.email,
        role: member.role,
        password: "",
        phone: member.phone || "",
      });
    } else {
      setEditingStaff(null);
      setFormData({
        name: "",
        email: "",
        role: "cashier",
        password: "",
        phone: "",
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingStaff) {
        await updateStaff.mutateAsync({
          staffId: editingStaff.id,
          data: {
            name: formData.name,
            email: formData.email,
            role: formData.role as any,
          },
        });
        toast.success("Usuario actualizado correctamente");
      } else {
        await createStaff.mutateAsync({
          name: formData.name,
          email: formData.email,
          role: formData.role as any,
          password: formData.password || undefined,
          phone: formData.phone || undefined,
        });
        toast.success("Usuario registrado correctamente");
      }
      setDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Error al guardar usuario");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteStaff.mutateAsync(id);
      toast.success("Usuario eliminado");
    } catch (error: any) {
      toast.error(error.message || "Error al eliminar usuario");
    }
  };

  const formatLastActive = (lastActive: string) => {
    if (!lastActive || lastActive === "Sin actividad") return "Sin actividad";

    try {
      const date = new Date(lastActive);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return "Ahora";
      if (diffMins < 60) return `Hace ${diffMins} min`;
      if (diffMins < 1440) return `Hace ${Math.floor(diffMins / 60)} horas`;
      return `Hace ${Math.floor(diffMins / 1440)} días`;
    } catch {
      return lastActive;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando personal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gestión de Staff
          </h1>
          <p className="text-muted-foreground mt-2">
            Administra el personal del restaurante
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
            <UserPlus className="w-4 h-4 mr-2" />
            Registrar Usuario
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {staff.length} miembro{staff.length !== 1 ? "s" : ""} del personal
          </div>
        </div>

        {staff.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No hay personal registrado</p>
            <Button className="mt-4" onClick={() => handleOpenDialog()}>
              <UserPlus className="w-4 h-4 mr-2" />
              Registrar primer usuario
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Última Actividad</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No se encontraron resultados para "{searchTerm}"
                  </TableCell>
                </TableRow>
              ) : (
                filteredStaff.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          roleColors[member.role] || roleColors.cashier
                        }
                      >
                        {roleLabels[member.role] || member.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          member.status === "active" ? "default" : "secondary"
                        }
                        className={
                          member.status === "active"
                            ? "bg-green-500/20 text-green-700"
                            : ""
                        }
                      >
                        {member.status === "active"
                          ? "Activo"
                          : member.status === "on-break"
                          ? "En descanso"
                          : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatLastActive(member.lastActive || "")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(member)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(member.id)}
                          disabled={deleteStaff.isPending}
                        >
                          {deleteStaff.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingStaff ? "Editar Usuario" : "Registrar Nuevo Usuario"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre Completo</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ej: Juan Pérez"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="usuario@kfc.com"
              />
            </div>
            {!editingStaff && (
              <div>
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
            )}
            <div>
              <Label htmlFor="phone">Teléfono (opcional)</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+51 999 999 999"
              />
            </div>
            <div>
              <Label htmlFor="role">Rol</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    role: value as StaffMember["role"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(roleLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                createStaff.isPending ||
                updateStaff.isPending ||
                !formData.name ||
                !formData.email
              }
            >
              {(createStaff.isPending || updateStaff.isPending) && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Staff;
