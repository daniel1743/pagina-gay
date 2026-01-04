import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown } from 'lucide-react';

/**
 * 🔔 NEW MESSAGES INDICATOR - WhatsApp/Instagram Style
 *
 * Floating badge that appears when user scrolls up and new messages arrive.
 * Shows a circular badge with number (like WhatsApp) or arrow (like Instagram).
 * Clicking scrolls smoothly to bottom.
 *
 * @param {number} count - Number of unread messages
 * @param {function} onClick - Callback when clicked
 * @param {boolean} show - Whether to show the indicator
 */
const NewMessagesIndicator = ({ count, onClick, show }) => {
  if (!show || count === 0) return null;

  // ⚡ WHATSAPP STYLE: Badge circular con número (más compacto)
  return (
    <AnimatePresence>
      <motion.button
        initial={{ opacity: 0, y: 10, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.8 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        onClick={onClick}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center w-12 h-12 rounded-full bg-[#25D366] text-white shadow-2xl hover:shadow-[#25D366]/50 transition-all hover:scale-110 active:scale-95 cursor-pointer"
        aria-label={`${count} mensajes nuevos. Click para ir al final`}
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.9 }}
        style={{
          boxShadow: '0 4px 20px rgba(37, 211, 102, 0.4)',
        }}
      >
        {/* Badge circular con número */}
        <div className="relative flex items-center justify-center">
          <ArrowDown className="w-5 h-5" />
          {count > 1 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-white text-[#25D366] text-[10px] font-bold"
            >
              {count > 99 ? '99+' : count}
            </motion.span>
          )}
        </div>
      </motion.button>
    </AnimatePresence>
  );
};

export default NewMessagesIndicator;
