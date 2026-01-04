import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Indicador de "escribiendo" con lógica inteligente
 * - Si hay 1-2 usuarios escribiendo: muestra nombre "Juan está escribiendo..."
 * - Si hay 3+ usuarios: solo muestra "escribiendo..." sin nombres
 * - Si hay muchos usuarios conectados (>10): solo muestra puntos sin texto
 */
const TypingIndicator = ({ typingUsers = [], totalUsersInRoom = 0 }) => {
  // Si no hay usuarios escribiendo, no mostrar nada
  if (!typingUsers || typingUsers.length === 0) {
    return null;
  }

  // Lógica inteligente basada en cantidad de usuarios
  const showName = typingUsers.length <= 2 && totalUsersInRoom <= 10;
  const showText = totalUsersInRoom <= 20;
  const typingUser = typingUsers[0];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="px-4 pb-2 h-6 flex items-center"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {showName && typingUser.username && (
            <span className="font-semibold text-foreground">
              {typingUser.username}
            </span>
          )}
          {showText && (
            <span>{showName ? 'está escribiendo' : 'escribiendo'}</span>
          )}
          <div className="flex gap-1 items-center">
            <motion.span
              className="w-1.5 h-1.5 bg-cyan-400 rounded-full"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.span
              className="w-1.5 h-1.5 bg-cyan-400 rounded-full"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
            />
            <motion.span
              className="w-1.5 h-1.5 bg-cyan-400 rounded-full"
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TypingIndicator;