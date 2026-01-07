import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 💬 REPLY INDICATOR - Pequeño círculo con número de mensajes sin leer
 *
 * Shows un pequeño círculo con el número de respuestas no leídas.
 * Clicking scrolls to the bottom.
 *
 * @param {boolean} show - Whether to show the indicator
 * @param {function} onClick - Callback when clicked
 * @param {number} count - Número de mensajes sin leer
 */
const ReplyIndicator = ({ show, onClick, count = 0 }) => {
  if (!show || count === 0) return null;

  return (
    <AnimatePresence>
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        onClick={onClick}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 w-6 h-6 rounded-full bg-cyan-500 text-white shadow-lg hover:shadow-cyan-500/50 transition-all hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center"
        aria-label={`${count} mensaje${count > 1 ? 's' : ''} sin leer. Click para ver`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        style={{
          boxShadow: '0 2px 10px rgba(6, 182, 212, 0.5)',
        }}
      >
        <span className="text-xs font-bold">
          {count > 9 ? '9+' : count}
        </span>
      </motion.button>
    </AnimatePresence>
  );
};

export default ReplyIndicator;

