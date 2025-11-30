import { useState } from "react";
import { MapPin, Store, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocations, useDeliveryCoverage } from "@/hooks/useLocations";
import { toast } from "sonner";

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (address: string, locationId?: string) => void;
}

const LocationModal = ({ isOpen, onClose, onConfirm }: LocationModalProps) => {
  const [address, setAddress] = useState("");
  const [apartment, setApartment] = useState("");
  const [reference, setReference] = useState("");
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const { data: locations, isLoading: loadingStores } = useLocations();
  const { data: coverageData, isLoading: checkingCoverage } =
    useDeliveryCoverage(userCoords?.lat || 0, userCoords?.lng || 0);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Tu navegador no soporta geolocalización");
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoords({ lat: latitude, lng: longitude });

        // Reverse geocoding (simplified - in production use a proper geocoding API)
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          setAddress(data.display_name || `${latitude}, ${longitude}`);
        } catch {
          setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        }
        setLoadingLocation(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast.error("No pudimos obtener tu ubicación");
        setLoadingLocation(false);
      }
    );
  };

  const handleConfirmDelivery = () => {
    if (!address.trim()) {
      toast.error("Por favor ingresa una dirección");
      return;
    }

    if (coverageData && !coverageData.covered) {
      toast.error("Lo sentimos, no tenemos cobertura en esta zona");
      return;
    }

    const fullAddress = apartment
      ? `${address}, ${apartment}${reference ? ` (${reference})` : ""}`
      : address;

    onConfirm(fullAddress, coverageData?.nearestLocation?.locationId);
    onClose();
  };

  const handleConfirmPickup = () => {
    if (!selectedStore) {
      toast.error("Por favor selecciona una tienda");
      return;
    }

    const store = locations?.find((l: any) => l.locationId === selectedStore);
    if (store) {
      onConfirm(store.address, store.locationId);
      onClose();
    }
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
                <Store className="h-4 w-4" />
                Recojo en tienda
              </TabsTrigger>
            </TabsList>

            <TabsContent value="delivery" className="space-y-6">
              {/* Map/Location Section */}
              <div className="relative w-full h-48 bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <Button
                    variant="default"
                    onClick={handleGetCurrentLocation}
                    disabled={loadingLocation}
                  >
                    {loadingLocation ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Obteniendo ubicación...
                      </>
                    ) : (
                      "Usar mi ubicación actual"
                    )}
                  </Button>
                </div>
              </div>

              {/* Coverage status */}
              {userCoords && (
                <div
                  className={`p-3 rounded-lg ${
                    checkingCoverage
                      ? "bg-muted"
                      : coverageData?.covered
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {checkingCoverage ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verificando cobertura...
                    </div>
                  ) : coverageData?.covered ? (
                    <div className="flex items-center gap-2">
                      <span>✓</span>
                      ¡Tenemos cobertura! La tienda más cercana es:{" "}
                      {coverageData.nearestLocation?.name}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>✗</span>
                      No tenemos cobertura en esta zona
                    </div>
                  )}
                </div>
              )}

              {/* Address Information */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Entregaremos tu pedido en
                  </label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ingresa tu dirección completa"
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
                  onClick={handleConfirmDelivery}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base font-semibold"
                  disabled={!address.trim()}
                >
                  Confirmar ubicación
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="pickup" className="space-y-4">
              <p className="text-muted-foreground text-center mb-4">
                Selecciona una tienda para recoger tu pedido
              </p>

              {loadingStores ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : locations && locations.length > 0 ? (
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-3">
                    {locations.map((location: any) => (
                      <div
                        key={location.locationId}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedStore === location.locationId
                            ? "border-primary bg-primary/5"
                            : "hover:border-muted-foreground/50"
                        }`}
                        onClick={() => setSelectedStore(location.locationId)}
                      >
                        <div className="flex items-start gap-3">
                          <Store className="h-5 w-5 mt-1 text-primary" />
                          <div className="flex-1">
                            <h4 className="font-semibold">{location.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {location.address}
                            </p>
                            {location.schedule && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Horario: {location.schedule}
                              </p>
                            )}
                          </div>
                          {selectedStore === location.locationId && (
                            <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-white text-xs">
                              ✓
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay tiendas disponibles
                </div>
              )}

              <Button
                onClick={handleConfirmPickup}
                className="w-full h-12 text-base font-semibold"
                disabled={!selectedStore}
              >
                Confirmar tienda
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocationModal;
