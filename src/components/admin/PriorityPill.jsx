import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TICKET_PRIORITY } from '@/services/ticketService';
import {
  ChevronDown,
  Minus,
  ChevronUp,
  AlertTriangle
} from 'lucide-react';

/**
 * COMPONENTE: PriorityPill
 *
 * Indicador visual de prioridad del ticket
 * con colores y iconos apropiados
 *
 * Props:
 * - priority: Prioridad del ticket (TICKET_PRIORITY)
 * - showIcon: Mostrar icono (default: true)
 * - size: Tamaño del badge ('sm' | 'md' | 'lg', default: 'md')
 */
const PriorityPill = ({ priority, showIcon = true, size = 'md' }) => {
  const getPriorityConfig = () => {
    switch (priority) {
      case TICKET_PRIORITY.LOW:
        return {
          label: 'Baja',
          color: 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300 border-gray-300 dark:border-gray-700',
          icon: ChevronDown
        };
      case TICKET_PRIORITY.MEDIUM:
        return {
          label: 'Media',
          color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300 dark:border-blue-700',
          icon: Minus
        };
      case TICKET_PRIORITY.HIGH:
        return {
          label: 'Alta',
          color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-300 dark:border-orange-700',
          icon: ChevronUp
        };
      case TICKET_PRIORITY.URGENT:
        return {
          label: 'Urgente',
          color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-300 dark:border-red-700',
          icon: AlertTriangle,
          pulse: true
        };
      default:
        return {
          label: 'Sin prioridad',
          color: 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300 border-gray-300 dark:border-gray-700',
          icon: Minus
        };
    }
  };

  const config = getPriorityConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4'
  };

  return (
    <Badge
      className={`
        ${config.color}
        ${sizeClasses[size]}
        ${config.pulse ? 'animate-pulse' : ''}
        border font-medium inline-flex items-center gap-1.5
      `}
      variant="outline"
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </Badge>
  );
};

export default PriorityPill;
