import { useState } from "react";
import { MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (address: string) => void;
}

const LocationModal = ({ isOpen, onClose, onConfirm }: LocationModalProps) => {
  const [address, setAddress] = useState("Jr. Medrano Silva 165, Barranco 15063, Perú");
  const [apartment, setApartment] = useState("");
  const [reference, setReference] = useState("");

  const handleConfirm = () => {
    onConfirm(address);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl font-bold text-center">
            Dirección de entrega
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6">
          <Tabs defaultValue="delivery" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="delivery" className="gap-2">
                <MapPin className="h-4 w-4" />
                Delivery
              </TabsTrigger>
              <TabsTrigger value="pickup" className="gap-2">
                Recojo en tienda
              </TabsTrigger>
            </TabsList>

            <TabsContent value="delivery" className="space-y-6">
              {/* Map Placeholder */}
              <div className="relative w-full h-64 bg-muted rounded-lg overflow-hidden">
                <img
                  src="https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s-circle+e4002b(-77.0218,-12.1391)/−77.0218,-12.1391,14,0/600x400@2x?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw"
                  alt="Mapa"
                  className="w-full h-full object-cover"
                />
                <Button
                  variant="default"
                  size="sm"
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-foreground text-background hover:bg-foreground/90"
                >
                  Ajustar ubicación
                </Button>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Entregaremos tu pedido en
                  </label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Dpto. / Casa / Oficina
                    </label>
                    <Input
                      placeholder="Ej: Departamento 4D (opcional)"
                      value={apartment}
                      onChange={(e) => setApartment(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Referencia
                    </label>
                    <Input
                      placeholder="Ej: Junto a la farmacia (opcional)"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  onClick={handleConfirm}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base font-semibold"
                >
                  Confirmar ubicación
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="pickup">
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Selecciona una tienda para recoger tu pedido
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocationModal;
