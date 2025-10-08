import React from 'react';
import { motion } from 'framer-motion';

const TypingIndicator = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="px-4 pb-2 h-6 flex items-center"
    >
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span className="font-semibold text-gray-300">UsuarioDemo</span>
        <span>está escribiendo</span>
        <div className="flex gap-1 items-center">
          <motion.span
            className="w-1.5 h-1.5 bg-gray-400 rounded-full"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.span
            className="w-1.5 h-1.5 bg-gray-400 rounded-full"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
          />
          <motion.span
            className="w-1.5 h-1.5 bg-gray-400 rounded-full"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default TypingIndicator;