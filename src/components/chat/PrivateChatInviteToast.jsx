import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { X, MessageCircle } from 'lucide-react';

/**
 * Toast no intrusivo para invitaciones de chat privado
 * - Aparece centrado y optimizado para móvil
 * - Auto-desaparece a los 10 segundos
 * - Botones de Aceptar/Declinar
 */
const PrivateChatInviteToast = ({ request, onAccept, onDecline, onClose }) => {
  const isGroupInvite = request?.type === 'private_group_invite_request';
  const requestedUsername = request?.requestedUser?.username || 'otro usuario';
  const invitingUsername = request?.from?.username || 'Alguien';

  // Auto-cerrar después de 10 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose?.({ reason: 'timeout' });
    }, 10000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleAccept = () => {
    onAccept?.();
    onClose?.({ reason: 'accept' });
  };

  const handleDecline = () => {
    onDecline?.();
    onClose?.({ reason: 'decline' });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed left-0 right-0 bottom-[4.8rem] sm:bottom-6 z-[140] mx-auto w-full max-w-[calc(100vw-1rem)] sm:max-w-md px-2 sm:px-4"
      >
        <div className="glass-effect rounded-2xl border border-cyan-500/30 shadow-2xl overflow-hidden backdrop-blur-xl bg-slate-950/92">
          {/* Barra de progreso de 10 segundos */}
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 10, ease: 'linear' }}
            className="h-1 bg-gradient-to-r from-cyan-400 to-purple-400"
          />

          <div className="p-3 sm:p-4">
            <div className="flex items-start gap-3">
            {/* Avatar del usuario que invita */}
            <Avatar className="w-11 h-11 sm:w-12 sm:h-12 border-2 border-cyan-400 flex-shrink-0">
              <AvatarImage src={request.from.avatar} alt={request.from.username} />
              <AvatarFallback className="bg-secondary text-lg">
                {request.from.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Contenido del mensaje */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <MessageCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <p className="text-sm font-bold text-white leading-tight">
                  {isGroupInvite ? `${invitingUsername} te invitó a un chat grupal` : `${invitingUsername} te ha invitado a un chat privado`}
                </p>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                {isGroupInvite ? (
                  <>
                    Quiere sumar a <span className="font-bold text-cyan-300">{requestedUsername}</span> a una conversación privada ya existente.
                  </>
                ) : (
                  <>
                    Si aceptas, se abrirá una conversación privada solo entre ustedes dentro de Chactivo.
                  </>
                )}
              </p>
            </div>

            {/* Botón cerrar */}
            <button
              onClick={() => onClose?.({ reason: 'dismiss' })}
              className="flex-shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white hover:bg-white/20 transition-colors"
              aria-label="Cerrar aviso"
            >
              <X className="w-4 h-4" />
            </button>
            </div>

            <p className="mt-2 text-[11px] sm:text-xs text-slate-400">
              Puedes aceptar ahora, declinar o cerrar este aviso. Si lo cierras, la solicitud seguirá disponible en <span className="font-semibold text-cyan-300">Privados</span>.
            </p>
          </div>

          {/* Botones de acción */}
          <div className="px-3 sm:px-4 pb-3 sm:pb-4 flex gap-2">
            <Button
              onClick={handleDecline}
              variant="outline"
              size="sm"
              className="flex-1 h-10 border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500"
            >
              Declinar
            </Button>
            <Button
              onClick={handleAccept}
              size="sm"
              className="flex-1 h-10 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold"
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
