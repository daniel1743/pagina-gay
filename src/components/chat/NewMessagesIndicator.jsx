import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

/**
 * 🔔 NEW MESSAGES INDICATOR
 *
 * Floating pill that appears when user scrolls up and new messages arrive.
 * Keeps a subtle, premium look while preserving quick access to latest messages.
 * Clicking scrolls smoothly to bottom.
 *
 * @param {number} count - Number of unread messages
 * @param {function} onClick - Callback when clicked
 * @param {boolean} show - Whether to show the indicator
 */
const NewMessagesIndicator = ({ count, onClick, show }) => {
  if (!show || count === 0) return null;
  const safeCount = count > 99 ? '99+' : count;
  const messageLabel = count === 1 ? 'mensaje nuevo' : 'mensajes nuevos';

  return (
    <AnimatePresence>
      <motion.button
        initial={{ opacity: 0, y: 12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 420, damping: 28 }}
        onClick={onClick}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 group inline-flex items-center gap-2 rounded-full px-3 py-2 bg-card/95 backdrop-blur-md border border-border/70 text-foreground shadow-[0_12px_30px_rgba(0,0,0,0.28)] hover:border-primary/40 hover:bg-card transition-all active:scale-[0.98] cursor-pointer"
        aria-label={`${count} mensajes nuevos. Click para ir al final`}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
      >
        <motion.span
          className="w-2 h-2 rounded-full bg-primary/80"
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />

        <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
          {safeCount} {messageLabel}
        </span>

        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/15 text-primary group-hover:bg-primary/20 transition-colors">
          <ChevronDown className="w-4 h-4" />
        </span>
      </motion.button>
    </AnimatePresence>
  );
};

export default NewMessagesIndicator;
