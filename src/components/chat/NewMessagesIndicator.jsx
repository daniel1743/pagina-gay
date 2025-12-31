import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown } from 'lucide-react';

/**
 * 🔔 NEW MESSAGES INDICATOR
 *
 * Floating button that appears when user scrolls up and new messages arrive.
 * Clicking scrolls smoothly to bottom.
 *
 * @param {number} count - Number of unread messages
 * @param {function} onClick - Callback when clicked
 * @param {boolean} show - Whether to show the indicator
 */
const NewMessagesIndicator = ({ count, onClick, show }) => {
  if (!show || count === 0) return null;

  return (
    <AnimatePresence>
      <motion.button
        initial={{ opacity: 0, y: 20, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.8 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        onClick={onClick}
        className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-2xl hover:shadow-purple-500/50 transition-all hover:scale-105 active:scale-95"
        aria-label={`${count} mensajes nuevos. Click para ir al final`}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.95 }}
      >
        <ArrowDown className="w-4 h-4 animate-bounce" />
        <span className="font-semibold text-sm whitespace-nowrap">
          {count} {count === 1 ? 'mensaje nuevo' : 'mensajes nuevos'}
        </span>
      </motion.button>
    </AnimatePresence>
  );
};

export default NewMessagesIndicator;
