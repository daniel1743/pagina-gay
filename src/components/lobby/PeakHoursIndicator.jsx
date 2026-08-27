import { HugeiconsIcon } from '@hugeicons/react';
import { InformationCircleIcon } from '@hugeicons/core-free-icons';

/**
 * Aviso de disponibilidad para el lobby.
 * La actividad no se infiere por horario: solo una fuente real de presencia puede
 * afirmar que una sala está activa.
 */
const PeakHoursIndicator = ({ totalOnline: _totalOnline = 0 }) => {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-border/70 bg-card/50 px-4 py-3 text-sm text-muted-foreground">
      <HugeiconsIcon icon={InformationCircleIcon} size={18} color="currentColor" className="mt-0.5 shrink-0 text-cyan-300" aria-hidden="true" />
      <span>La actividad depende de la participación real. Entra a una sala para comprobar su estado.</span>
    </div>
  );
};

export default PeakHoursIndicator;
