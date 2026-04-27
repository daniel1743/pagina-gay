import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageCircle, X } from 'lucide-react';

const PRIVATE_DM_TOAST_DURATION_SECONDS = 4.2;

const PrivateChatDirectMessageToast = ({ message, onOpen, onClose }) => {
  const fromUsername = message?.fromUsername || 'Alguien';
  const title = message?.title || `${fromUsername} te ha escrito un mensaje`;
  const preview = typeof message?.content === 'string' && message.content.trim()
    ? message.content.trim()
    : 'Te ha escrito en privado.';
  const helperText = message?.hint || 'Queda disponible en Conecta. Solo se abre si haces clic.';
  const actionLabel = message?.actionLabel || 'Abrir';

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose?.({ reason: 'timeout' });
    }, PRIVATE_DM_TOAST_DURATION_SECONDS * 1000);

    return () => clearTimeout(timer);
  }, [onClose, message?.notificationId]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.985 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="fixed left-0 right-0 bottom-[5.1rem] sm:bottom-6 z-[141] mx-auto w-full max-w-[calc(100vw-1.25rem)] sm:max-w-[25rem] px-3 sm:px-4"
      >
        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_44px_rgba(15,23,42,0.16)]">
          <div className="pointer-events-none h-px w-full bg-gradient-to-r from-transparent via-sky-300/90 to-transparent" />

          <div className="p-3.5 sm:p-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10 flex-shrink-0 border border-slate-200">
                <AvatarImage src={message?.fromAvatar || ''} alt={fromUsername} />
                <AvatarFallback className="bg-slate-50 text-sm font-semibold text-slate-700">
                  {fromUsername[0]?.toUpperCase?.() || 'U'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  <span className="inline-flex h-5 items-center rounded-full border border-sky-100 bg-sky-50 px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-sky-700">
                    Privado
                  </span>
                  <MessageCircle className="h-3.5 w-3.5 flex-shrink-0 text-sky-500/80" />
                  <p className="truncate text-sm font-semibold text-slate-900 leading-tight">
                    {title}
                  </p>
                </div>
                <p className="line-clamp-2 break-words text-[13px] leading-5 text-slate-700">
                  {preview}
                </p>
                <p className="mt-1.5 text-[11px] leading-4 text-slate-500">
                  {helperText}
                </p>
              </div>

              <button
                onClick={() => onClose?.({ reason: 'dismiss' })}
                className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
                aria-label="Cerrar aviso"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex gap-2 px-3.5 pb-3.5 sm:px-4 sm:pb-4">
            <Button
              onClick={() => onClose?.({ reason: 'dismiss' })}
              variant="outline"
              size="sm"
              className="h-9 flex-1 rounded-full border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              Ahora no
            </Button>
            <Button
              onClick={() => {
                onOpen?.();
                onClose?.({ reason: 'open' });
              }}
              size="sm"
              className="h-9 flex-1 rounded-full bg-[#1473E6] text-white shadow-[0_10px_24px_rgba(20,115,230,0.22)] hover:bg-[#0F67D8]"
            >
              {actionLabel}
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PrivateChatDirectMessageToast;
