import React from 'react';
import { Reply } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * 💬 MESSAGE QUOTE COMPONENT
 *
 * Muestra un preview del mensaje al que se está respondiendo
 * Click salta al mensaje original con highlight
 *
 * @param {Object} replyTo - { messageId, username, content }
 * @param {Function} onJumpToMessage - Callback para saltar al mensaje
 */
const MessageQuote = ({ replyTo, onJumpToMessage }) => {
  if (!replyTo) return null;

  const truncateContent = (text, maxLength = 50) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="mb-1.5 pl-2 border-l-2 border-cyan-400 cursor-pointer hover:bg-secondary/50 rounded-r transition-colors"
      onClick={() => onJumpToMessage?.(replyTo.messageId)}
      title="Click para ir al mensaje original"
    >
      <div className="flex items-start gap-1.5 py-1 px-2">
        <Reply className="w-3 h-3 text-cyan-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-cyan-400 truncate">
            {replyTo.username}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {truncateContent(replyTo.content)}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default MessageQuote;
