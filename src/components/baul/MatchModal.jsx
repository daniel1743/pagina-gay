/**
 * 🎉 MODAL DE MATCH
 * Celebración cuando dos usuarios se gustan mutuamente
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, MessageSquare, Sparkles } from 'lucide-react';

const MatchModal = ({ isOpen, onClose, matchData, onEnviarMensaje }) => {
  // Auto-cerrar después de 10 segundos
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !matchData) return null;

  const otroUsuario = matchData.otroUsuario || matchData.userB || matchData.userA;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Partículas de fondo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              initial={{
                x: Math.random() * window.innerWidth,
                y: window.innerHeight + 50,
                rotate: 0,
                scale: Math.random() * 0.5 + 0.5
              }}
              animate={{
                y: -100,
                rotate: 360,
                transition: {
                  duration: Math.random() * 3 + 2,
                  repeat: Infinity,
                  delay: Math.random() * 2
                }
              }}
            >
              <Heart
                className={`w-6 h-6 ${
                  i % 3 === 0 ? 'text-pink-500' : i % 3 === 1 ? 'text-red-500' : 'text-purple-500'
                }`}
                fill="currentColor"
              />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.5, opacity: 0, y: 50 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200 }}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-gradient-to-br from-pink-600 via-purple-600 to-indigo-700 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
        >
          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Contenido */}
          <div className="p-8 text-center">
            {/* Icono animado */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2, damping: 10 }}
              className="relative mx-auto mb-6"
            >
              <div className="w-24 h-24 mx-auto bg-white/20 rounded-full flex items-center justify-center">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                  }}
                >
                  <Heart className="w-12 h-12 text-white" fill="white" />
                </motion.div>
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute -top-2 -right-2"
              >
                <Sparkles className="w-8 h-8 text-yellow-300" />
              </motion.div>
            </motion.div>

            {/* Título */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold text-white mb-2"
            >
              ¡Es un Match!
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-white/80 mb-6"
            >
              Tú y <span className="font-semibold">{otroUsuario?.nombre || otroUsuario?.username}</span> se gustan mutuamente
            </motion.p>

            {/* Avatar del otro usuario */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
              className="mb-8"
            >
              {otroUsuario?.avatar ? (
                <img
                  src={otroUsuario.avatar}
                  alt={otroUsuario.nombre}
                  className="w-28 h-28 rounded-full mx-auto ring-4 ring-white/50 object-cover shadow-xl"
                />
              ) : (
                <div className="w-28 h-28 rounded-full mx-auto ring-4 ring-white/50 bg-white/20 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">
                    {(otroUsuario?.nombre || otroUsuario?.username || '?').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </motion.div>

            {/* Botones */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-3"
            >
              <button
                onClick={() => {
                  onEnviarMensaje?.(otroUsuario);
                  onClose();
                }}
                className="w-full py-3.5 rounded-xl bg-white text-purple-600 font-bold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 shadow-lg"
              >
                <MessageSquare className="w-5 h-5" />
                Enviar mensaje
              </button>

              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-white/20 text-white font-medium hover:bg-white/30 transition-colors"
              >
                Seguir explorando
              </button>
            </motion.div>
          </div>

          {/* Decoración inferior */}
          <div className="h-2 bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400" />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MatchModal;
