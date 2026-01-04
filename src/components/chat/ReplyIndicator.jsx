import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown, Reply } from 'lucide-react';

/**
 * 💬 REPLY INDICATOR - WhatsApp/Instagram Style
 *
 * Shows when someone replies to the user's messages.
 * Appears as a floating badge with arrow icon.
 * Clicking scrolls to the reply.
 *
 * @param {boolean} show - Whether to show the indicator
 * @param {function} onClick - Callback when clicked
 * @param {string} username - Username of person who replied
 */
const ReplyIndicator = ({ show, onClick, username }) => {
  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.button
        initial={{ opacity: 0, y: 10, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.8 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        onClick={onClick}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-blue-500 text-white shadow-2xl hover:shadow-blue-500/50 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        aria-label={`${username} respondió. Click para ver`}
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.9 }}
        style={{
          boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)',
        }}
      >
        <Reply className="w-4 h-4" />
        <span className="text-sm font-semibold whitespace-nowrap">
          {username} respondió
        </span>
        <ArrowDown className="w-4 h-4" />
      </motion.button>
    </AnimatePresence>
  );
};

export default ReplyIndicator;

