import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import { Calendar03Icon, InformationCircleIcon, Cancel01Icon } from '@hugeicons/core-free-icons';

const EventosModal = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl rounded-2xl border border-border bg-card p-0 text-foreground">
        <DialogHeader className="p-6 pr-14">
          <DialogTitle className="flex items-center gap-3 text-2xl font-extrabold">
            <HugeiconsIcon icon={Calendar03Icon} size={28} color="currentColor" className="text-cyan-300" aria-hidden="true" />
            Eventos y noticias
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Publicaremos aquí únicamente actividades con fecha, organizador y enlace verificables.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6">
          <div className="rounded-xl border border-border/70 bg-background/40 p-6" role="status" aria-live="polite">
            <div className="flex items-start gap-3">
              <HugeiconsIcon icon={InformationCircleIcon} size={22} color="currentColor" className="mt-0.5 shrink-0 text-cyan-300" aria-hidden="true" />
              <div>
                <h3 className="font-semibold">No hay eventos publicados</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Esta sección está preparada para cuando exista una agenda real. No mostramos anuncios, fiestas o fechas de ejemplo como si fueran actividades confirmadas.
                </p>
              </div>
            </div>
          </div>
          <a
            href="/normas-comunidad"
            className="mt-5 inline-flex min-h-11 items-center rounded-xl border border-border/70 px-4 text-sm font-semibold text-foreground transition hover:bg-accent focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:ring-offset-2 focus:ring-offset-card"
          >
            Consultar normas de comunidad
          </a>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Cerrar eventos y noticias"
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={22} color="currentColor" aria-hidden="true" />
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default EventosModal;
