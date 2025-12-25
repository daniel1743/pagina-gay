import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TICKET_STATUS } from '@/services/ticketService';
import {
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  PauseCircle,
  ShieldAlert
} from 'lucide-react';

/**
 * COMPONENTE: TicketStatusBadge
 *
 * Badge visual para mostrar el estado de un ticket
 * con colores y iconos apropiados
 *
 * Props:
 * - status: Estado del ticket (TICKET_STATUS)
 * - showIcon: Mostrar icono (default: true)
 * - size: Tamaño del badge ('sm' | 'md' | 'lg', default: 'md')
 */
const TicketStatusBadge = ({ status, showIcon = true, size = 'md' }) => {
  const getStatusConfig = () => {
    switch (status) {
      case TICKET_STATUS.OPEN:
        return {
          label: 'Abierto',
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300 dark:border-blue-700',
          icon: AlertCircle
        };
      case TICKET_STATUS.IN_PROGRESS:
        return {
          label: 'En Progreso',
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
          icon: Clock
        };
      case TICKET_STATUS.WAITING_USER:
        return {
          label: 'Esperando Usuario',
          color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-300 dark:border-orange-700',
          icon: PauseCircle
        };
      case TICKET_STATUS.RESOLVED:
        return {
          label: 'Resuelto',
          color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-300 dark:border-green-700',
          icon: CheckCircle
        };
      case TICKET_STATUS.CLOSED:
        return {
          label: 'Cerrado',
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 border-gray-300 dark:border-gray-700',
          icon: XCircle
        };
      case TICKET_STATUS.SPAM:
        return {
          label: 'Spam',
          color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-300 dark:border-red-700',
          icon: ShieldAlert
        };
      default:
        return {
          label: 'Desconocido',
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 border-gray-300 dark:border-gray-700',
          icon: AlertCircle
        };
    }
  };

  const config = getStatusConfig();
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
      className={`${config.color} ${sizeClasses[size]} border font-medium inline-flex items-center gap-1.5`}
      variant="outline"
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </Badge>
  );
};

export default TicketStatusBadge;
