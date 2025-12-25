import React from 'react';
import { MESSAGE_TYPE, MESSAGE_AUTHOR } from '@/services/ticketService';
import { User, Shield, Lock, Paperclip } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * COMPONENTE: MessageBubble
 *
 * Burbuja de mensaje estilo chat para threads de tickets
 * Distingue entre:
 * - Mensajes de usuario vs staff
 * - Mensajes externos (visibles al usuario) vs internos (solo staff)
 *
 * Props:
 * - message: Objeto mensaje con { type, author, authorUsername, body, attachments, createdAt }
 * - isCurrentUserStaff: Si el usuario actual es staff (para mostrar notas internas)
 */
const MessageBubble = ({ message, isCurrentUserStaff = false }) => {
  const {
    type,
    author,
    authorUsername,
    body,
    attachments = [],
    createdAt
  } = message;

  const isStaff = author === MESSAGE_AUTHOR.STAFF;
  const isInternal = type === MESSAGE_TYPE.INTERNAL;

  // No mostrar mensajes internos a no-staff
  if (isInternal && !isCurrentUserStaff) {
    return null;
  }

  // Formatear timestamp
  const getTimeAgo = () => {
    if (!createdAt) return '';

    try {
      const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
      return formatDistanceToNow(date, { addSuffix: true, locale: es });
    } catch (error) {
      return '';
    }
  };

  return (
    <div className={`flex gap-3 ${isStaff ? 'flex-row-reverse' : 'flex-row'} mb-4`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 ${isStaff ? 'order-2' : 'order-1'}`}>
        <div
          className={`
            w-8 h-8 rounded-full flex items-center justify-center
            ${isStaff
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }
          `}
        >
          {isStaff ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
        </div>
      </div>

      {/* Message content */}
      <div className={`flex-1 max-w-[75%] ${isStaff ? 'order-1' : 'order-2'}`}>
        {/* Header */}
        <div className={`flex items-center gap-2 mb-1 ${isStaff ? 'justify-end' : 'justify-start'}`}>
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {authorUsername || (isStaff ? 'Staff' : 'Usuario')}
          </span>
          {isInternal && (
            <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
              <Lock className="w-3 h-3" />
              <span className="font-medium">Nota Interna</span>
            </div>
          )}
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {getTimeAgo()}
          </span>
        </div>

        {/* Bubble */}
        <div
          className={`
            rounded-2xl px-4 py-2.5 break-words
            ${isStaff
              ? isInternal
                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 border border-amber-300 dark:border-amber-700'
                : 'bg-purple-500 dark:bg-purple-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
            }
            ${isInternal ? 'border-2 border-dashed' : ''}
          `}
        >
          {/* Body text */}
          <p className="text-sm whitespace-pre-wrap leading-relaxed">
            {body}
          </p>

          {/* Attachments */}
          {attachments && attachments.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {attachments.map((attachment, index) => (
                <a
                  key={index}
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`
                    flex items-center gap-2 text-xs rounded-lg px-2.5 py-1.5
                    transition-colors
                    ${isStaff
                      ? 'bg-white/20 hover:bg-white/30 text-white'
                      : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                    }
                  `}
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[200px]">
                    {attachment.name || `Archivo ${index + 1}`}
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Internal note explanation */}
        {isInternal && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 italic">
            Solo visible para el equipo de soporte
          </p>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
