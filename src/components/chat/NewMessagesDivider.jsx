import React from 'react';
import { motion } from 'framer-motion';

/**
 * 📍 NEW MESSAGES DIVIDER
 *
 * Separador visual inline (estilo WhatsApp) que marca donde comienzan los mensajes nuevos
 * Se inserta entre el último mensaje leído y el primer mensaje nuevo
 *
 * @param {boolean} show - Si debe mostrarse
 */
const NewMessagesDivider = ({ show }) => {
  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0 }}
      animate={{ opacity: 1, scaleX: 1 }}
      className="flex items-center gap-3 my-3 px-4"
    >
      <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
        className="text-xs font-semibold text-cyan-400 px-3 py-1 rounded-full bg-cyan-400/10 border border-cyan-400/30 whitespace-nowrap"
      >
        Mensajes nuevos
      </motion.span>
      <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
    </motion.div>
  );
};

export default NewMessagesDivider;
