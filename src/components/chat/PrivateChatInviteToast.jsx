import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { X, MessageCircle } from 'lucide-react';

/**
 * Toast no intrusivo para invitaciones de chat privado
 * - Aparece arriba sin interrumpir la experiencia
 * - Auto-desaparece a los 4 segundos
 * - Botones de Aceptar/Declinar
 */
const PrivateChatInviteToast = ({ request, onAccept, onDecline, onClose }) => {
  // Auto-cerrar después de 4 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleAccept = () => {
    onAccept();
    onClose();
  };

  const handleDecline = () => {
    onDecline();
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4"
      >
        <div className="glass-effect rounded-xl border-2 border-cyan-500/30 shadow-2xl overflow-hidden backdrop-blur-xl">
          {/* Barra de progreso de 4 segundos */}
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 4, ease: 'linear' }}
            className="h-1 bg-gradient-to-r from-cyan-400 to-purple-400"
          />

          <div className="p-4 flex items-center gap-3">
            {/* Avatar del usuario que invita */}
            <Avatar className="w-12 h-12 border-2 border-cyan-400 flex-shrink-0">
              <AvatarImage src={request.from.avatar} alt={request.from.username} />
              <AvatarFallback className="bg-secondary text-lg">
                {request.from.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Contenido del mensaje */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <MessageCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <p className="text-sm font-bold text-white truncate">
                  Invitación de chat privado
                </p>
              </div>
              <p className="text-xs text-gray-300">
                <span className="font-bold text-cyan-400">{request.from.username}</span> te invitó a hablar en privado
              </p>
            </div>

            {/* Botón cerrar */}
            <button
              onClick={onClose}
              className="flex-shrink-0 p-1 hover:bg-gray-700/50 rounded-full transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-white" />
            </button>
          </div>

          {/* Botones de acción */}
          <div className="px-4 pb-4 flex gap-2">
            <Button
              onClick={handleDecline}
              variant="outline"
              size="sm"
              className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500"
            >
              Declinar
            </Button>
            <Button
              onClick={handleAccept}
              size="sm"
              className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold"
            >
              Aceptar
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PrivateChatInviteToast;
