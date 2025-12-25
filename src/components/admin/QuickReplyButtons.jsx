import React from 'react';
import { Button } from '@/components/ui/button';
import { QUICK_REPLIES } from '@/services/ticketService';
import { Zap } from 'lucide-react';

/**
 * COMPONENTE: QuickReplyButtons
 *
 * Botones de respuesta rápida para macros predefinidas
 * Facilita respuestas comunes sin tener que escribir todo
 *
 * Props:
 * - onSelectReply: (reply) => void - Callback cuando se selecciona una respuesta
 * - disabled: boolean - Deshabilitar botones
 */
const QuickReplyButtons = ({ onSelectReply, disabled = false }) => {
  const quickReplies = [
    {
      key: 'USERNAME_REQUEST',
      label: 'Solicitar Info Username',
      emoji: '❓',
      data: QUICK_REPLIES.USERNAME_REQUEST
    },
    {
      key: 'USERNAME_UPDATED',
      label: 'Username Actualizado',
      emoji: '✅',
      data: QUICK_REPLIES.USERNAME_UPDATED
    },
    {
      key: 'TECHNICAL_INVESTIGATING',
      label: 'Investigando Problema',
      emoji: '🔍',
      data: QUICK_REPLIES.TECHNICAL_INVESTIGATING
    },
    {
      key: 'RESOLVED_THANKS',
      label: 'Resuelto - Gracias',
      emoji: '🎉',
      data: QUICK_REPLIES.RESOLVED_THANKS
    },
    {
      key: 'MORE_INFO_NEEDED',
      label: 'Necesito Más Info',
      emoji: '📋',
      data: QUICK_REPLIES.MORE_INFO_NEEDED
    }
  ];

  const handleClick = (reply) => {
    if (onSelectReply) {
      onSelectReply(reply.data);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
        <Zap className="w-3.5 h-3.5" />
        <span>Respuestas Rápidas</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
        {quickReplies.map((reply) => (
          <Button
            key={reply.key}
            variant="outline"
            size="sm"
            onClick={() => handleClick(reply)}
            disabled={disabled}
            className="text-xs h-auto py-2 px-3 flex flex-col items-center gap-1 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
          >
            <span className="text-lg">{reply.emoji}</span>
            <span className="text-center leading-tight">{reply.label}</span>
          </Button>
        ))}
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 italic">
        Haz clic en una respuesta para autocompletar el mensaje
      </p>
    </div>
  );
};

export default QuickReplyButtons;
