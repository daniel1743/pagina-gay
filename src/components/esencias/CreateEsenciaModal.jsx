import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const MAX_ESENCIA_LENGTH = 120;

const CreateEsenciaModal = ({ open, onClose, onCreate, isSubmitting = false }) => {
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    if (open) return;
    setMensaje('');
  }, [open]);

  const remainingChars = useMemo(
    () => MAX_ESENCIA_LENGTH - mensaje.length,
    [mensaje.length]
  );

  const canSubmit = mensaje.trim().length >= 3 && !isSubmitting;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    await onCreate(mensaje.trim());
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle>Dejar una esencia</DialogTitle>
          <DialogDescription>
            Mensaje corto para mostrar que estuviste aquí. Se elimina automáticamente en 5 minutos.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={mensaje}
            onChange={(event) => setMensaje(event.target.value)}
            maxLength={MAX_ESENCIA_LENGTH}
            rows={4}
            placeholder="Ej: Me pasé por aquí, vuelvo en la noche 👋"
            className="w-full resize-none rounded-xl border border-input bg-secondary/40 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Mensaje de esencia"
          />

          <div className="flex items-center justify-between text-xs">
            <span className={remainingChars < 15 ? 'text-orange-400' : 'text-muted-foreground'}>
              {remainingChars} caracteres restantes
            </span>
            <span className="text-muted-foreground">Mínimo 3 caracteres</span>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isSubmitting ? 'Publicando...' : 'Publicar esencia'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEsenciaModal;

