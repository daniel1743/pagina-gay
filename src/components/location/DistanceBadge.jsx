import React from 'react';
import { MapPin } from 'lucide-react';

/**
 * Badge que muestra la distancia del usuario
 * Estilo similar a Grindr
 */
const DistanceBadge = ({ distance, distanceText, className = '' }) => {
  if (distance === undefined || distance === null || distance === Infinity) {
    return null;
  }

  // Color según distancia
  let colorClass = 'text-green-400 bg-green-500/20 border-green-500/30';
  if (distance > 5) {
    colorClass = 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
  }
  if (distance > 20) {
    colorClass = 'text-orange-400 bg-orange-500/20 border-orange-500/30';
  }

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium ${colorClass} ${className}`}
    >
      <MapPin className="h-3 w-3" />
      <span>{distanceText}</span>
    </div>
  );
};

export default DistanceBadge;
