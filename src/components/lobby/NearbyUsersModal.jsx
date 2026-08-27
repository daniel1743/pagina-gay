import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin, ShieldCheck } from 'lucide-react';

/**
 * La experiencia de "cerca" se mantiene fuera de servicio hasta contar con un
 * diseño de ubicación aproximada, explícitamente opt-in y con reglas revisadas.
 * Esta versión no solicita permisos, no lee geolocalización y no escribe GPS.
 */
const NearbyUsersModal = ({ isOpen, onClose }) => {
  const handleOpenChange = (open) => {
    if (!open) onClose?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
            <MapPin className="h-5 w-5 text-cyan-400" aria-hidden="true" />
            Personas cerca
          </DialogTitle>
          <DialogDescription className="pt-2 text-sm leading-6 text-muted-foreground">
            Esta función está pausada para proteger tu privacidad. Chactivo no solicita ni guarda tu ubicación GPS exacta.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" aria-hidden="true" />
            <p className="text-sm leading-6 text-foreground/90">
              Más adelante podremos evaluar una opción voluntaria de ciudad o comuna aproximada, sin coordenadas precisas y con controles claros para activarla o desactivarla.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Entendido
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NearbyUsersModal;
