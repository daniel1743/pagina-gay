import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageCircle, X } from 'lucide-react';

const PrivateChatDirectMessageToast = ({ message, onOpen, onClose }) => {
  const fromUsername = message?.fromUsername || 'Alguien';
  const preview = typeof message?.content === 'string' && message.content.trim()
    ? message.content.trim()
    : 'Te ha escrito en privado.';

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose?.();
    }, 10000);

    return () => clearTimeout(timer);
  }, [onClose, message?.notificationId]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed left-0 right-0 bottom-[4.8rem] sm:bottom-6 z-[141] mx-auto w-full max-w-[calc(100vw-1rem)] sm:max-w-md px-2 sm:px-4"
      >
        <div className="glass-effect rounded-2xl border border-emerald-500/30 shadow-2xl overflow-hidden backdrop-blur-xl bg-slate-950/92">
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 10, ease: 'linear' }}
            className="h-1 bg-gradient-to-r from-emerald-400 to-cyan-400"
          />

          <div className="p-3 sm:p-4">
            <div className="flex items-start gap-3">
              <Avatar className="w-11 h-11 sm:w-12 sm:h-12 border-2 border-emerald-400 flex-shrink-0">
                <AvatarImage src={message?.fromAvatar || ''} alt={fromUsername} />
                <AvatarFallback className="bg-secondary text-lg">
                  {fromUsername[0]?.toUpperCase?.() || 'U'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <MessageCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <p className="text-sm font-bold text-white leading-tight">
                    {fromUsername} te ha escrito un mensaje
                  </p>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed line-clamp-2 break-words">
                  {preview}
                </p>
              </div>

              <button
                onClick={onClose}
                className="flex-shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white hover:bg-white/20 transition-colors"
                aria-label="Cerrar aviso"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="mt-2 text-[11px] sm:text-xs text-slate-400">
              Si lo abres ahora, entrarás directo a la conversación privada. Si cierras este aviso, el mensaje seguirá en <span className="font-semibold text-emerald-300">Privados</span>.
            </p>
          </div>

          <div className="px-3 sm:px-4 pb-3 sm:pb-4 flex gap-2">
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="flex-1 h-10 border-white/20 text-slate-200 hover:bg-white/10 hover:text-white"
            >
              Cerrar
            </Button>
            <Button
              onClick={() => {
                onOpen?.();
                onClose?.();
              }}
              size="sm"
              className="flex-1 h-10 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold"
            >
              Abrir chat
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PrivateChatDirectMessageToast;
