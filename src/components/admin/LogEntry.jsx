import React from 'react';
import { LOG_ACTION } from '@/services/ticketService';
import {
  FileText,
  MessageSquare,
  User,
  CheckCircle,
  XCircle,
  Edit,
  UserPlus,
  AlertTriangle,
  StickyNote,
  ArrowUpCircle,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * COMPONENTE: LogEntry
 *
 * Entrada individual del historial de auditoría
 * Muestra acciones realizadas en el ticket con formato visual
 *
 * Props:
 * - log: Objeto log con { action, actorUid, actorRole, meta, createdAt }
 * - compact: Versión compacta (default: false)
 */
const LogEntry = ({ log, compact = false }) => {
  const { action, actorUid, actorRole, meta = {}, createdAt } = log;

  const getActionConfig = () => {
    switch (action) {
      case LOG_ACTION.CREATED:
        return {
          icon: FileText,
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          label: 'Ticket creado',
          description: `Categoría: ${meta.category || 'N/A'}, Prioridad: ${meta.priority || 'N/A'}`
        };

      case LOG_ACTION.STATUS_CHANGED:
        return {
          icon: Edit,
          color: 'text-purple-600 dark:text-purple-400',
          bgColor: 'bg-purple-100 dark:bg-purple-900/30',
          label: 'Estado cambiado',
          description: `De "${meta.oldStatus || 'N/A'}" a "${meta.newStatus || 'N/A'}"`
        };

      case LOG_ACTION.PRIORITY_CHANGED:
        return {
          icon: ArrowUpCircle,
          color: 'text-orange-600 dark:text-orange-400',
          bgColor: 'bg-orange-100 dark:bg-orange-900/30',
          label: 'Prioridad modificada',
          description: `De "${meta.oldPriority || 'N/A'}" a "${meta.newPriority || 'N/A'}"`
        };

      case LOG_ACTION.ASSIGNED:
        return {
          icon: UserPlus,
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          label: 'Asignado',
          description: `Asignado a: ${meta.assignedToUsername || meta.assignedTo || 'N/A'}`
        };

      case LOG_ACTION.MESSAGE_SENT:
        return {
          icon: MessageSquare,
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          label: 'Mensaje enviado',
          description: meta.preview || 'Nuevo mensaje en el thread'
        };

      case LOG_ACTION.NOTE_ADDED:
        return {
          icon: StickyNote,
          color: 'text-amber-600 dark:text-amber-400',
          bgColor: 'bg-amber-100 dark:bg-amber-900/30',
          label: 'Nota interna agregada',
          description: meta.preview || 'Nota solo visible para staff'
        };

      case LOG_ACTION.USERNAME_CHANGED:
        return {
          icon: User,
          color: 'text-indigo-600 dark:text-indigo-400',
          bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
          label: 'Username actualizado',
          description: `De "${meta.oldUsername || 'N/A'}" a "${meta.newUsername || 'N/A'}"`
        };

      case LOG_ACTION.EMAIL_CHANGED:
        return {
          icon: User,
          color: 'text-indigo-600 dark:text-indigo-400',
          bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
          label: 'Email actualizado',
          description: `De "${meta.oldEmail || 'N/A'}" a "${meta.newEmail || 'N/A'}"`
        };

      case LOG_ACTION.RESOLVED:
        return {
          icon: CheckCircle,
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          label: 'Ticket resuelto',
          description: meta.resolution || 'Marcado como resuelto'
        };

      case LOG_ACTION.CLOSED:
        return {
          icon: XCircle,
          color: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-100 dark:bg-gray-800/50',
          label: 'Ticket cerrado',
          description: meta.reason || 'Ticket cerrado'
        };

      case LOG_ACTION.REOPENED:
        return {
          icon: AlertTriangle,
          color: 'text-yellow-600 dark:text-yellow-400',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
          label: 'Ticket reabierto',
          description: meta.reason || 'Ticket reabierto'
        };

      default:
        return {
          icon: Clock,
          color: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-100 dark:bg-gray-800/50',
          label: 'Acción desconocida',
          description: action
        };
    }
  };

  const config = getActionConfig();
  const Icon = config.icon;

  const formatDate = () => {
    if (!createdAt) return '';
    try {
      const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
      return formatDistanceToNow(date, { addSuffix: true, locale: es });
    } catch {
      return '';
    }
  };

  const getRoleBadge = () => {
    if (actorRole === 'admin') return '👑';
    if (actorRole === 'support' || actorRole === 'staff') return '🛡️';
    return '👤';
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <div className={`${config.bgColor} p-1 rounded`}>
          <Icon className={`w-3 h-3 ${config.color}`} />
        </div>
        <span className="text-gray-700 dark:text-gray-300">{config.label}</span>
        <span className="text-gray-400 dark:text-gray-500">{formatDate()}</span>
      </div>
    );
  }

  return (
    <div className="flex gap-3 py-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
      {/* Icon */}
      <div className={`flex-shrink-0 w-8 h-8 ${config.bgColor} rounded-full flex items-center justify-center`}>
        <Icon className={`w-4 h-4 ${config.color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {config.label}
              </span>
              <span className="text-xs">{getRoleBadge()}</span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
              {config.description}
            </p>
          </div>

          <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
            {formatDate()}
          </span>
        </div>

        {/* Actor info (optional) */}
        {actorUid && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">
            Por: {actorUid.substring(0, 8)}...
          </p>
        )}
      </div>
    </div>
  );
};

export default LogEntry;
