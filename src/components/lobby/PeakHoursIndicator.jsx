import React from 'react';
import { Clock } from 'lucide-react';

/**
 * Indicador de horas pico para el lobby
 * Solo se muestra si hay pocos usuarios online (<10)
 * Horas pico: 21:00 - 01:00 hora Chile (UTC-3 / UTC-4)
 */
const PeakHoursIndicator = ({ totalOnline = 0 }) => {
  if (totalOnline >= 10) return null;

  const now = new Date();
  // Hora Chile (aprox UTC-3, simplificado sin DST)
  const chileOffset = -3;
  const utcHours = now.getUTCHours();
  const chileHour = (utcHours + chileOffset + 24) % 24;

  let message = '';
  let variant = 'default'; // default, soon, active

  if (chileHour >= 21 || chileHour < 1) {
    message = 'La comunidad esta activa ahora';
    variant = 'active';
  } else if (chileHour >= 19 && chileHour < 21) {
    message = 'La comunidad se activa a las 21:00';
    variant = 'soon';
  } else {
    message = 'Horas con mas actividad: 21:00 - 01:00 (Chile)';
    variant = 'default';
  }

  const variantStyles = {
    active: 'bg-green-500/10 border-green-500/30 text-green-400',
    soon: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
    default: 'bg-gray-500/10 border-gray-500/30 text-gray-400',
  };

  return (
    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm ${variantStyles[variant]}`}>
      <Clock className="w-4 h-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
};

export default PeakHoursIndicator;
