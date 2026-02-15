/**
 * 🔔 POPUP DE RECORDATORIO DE EVENTO
 * Aparece cuando un evento guardado con "Recordarme" se activa (EN VIVO)
 * Solo aparece una vez por sesión por evento
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, ChevronRight, X } from 'lucide-react';

export default function EventReminderPopup({ evento, onDismiss }) {
  const navigate = useNavigate();

  if (!evento) return null;

  const handleEntrar = () => {
    navigate(`/chat/${evento.roomId}`);
    onDismiss();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm"
      >
        <div className="bg-gray-900 border border-red-500/40 rounded-2xl shadow-2xl shadow-red-500/10 overflow-hidden">
          {/* Barra superior roja animada */}
          <div className="h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 animate-pulse" />

          <div className="p-4">
            <div className="flex items-start gap-3">
              {/* Icono pulsante */}
              <div className="flex-shrink-0 p-2 rounded-xl bg-red-500/20">
                <Radio className="w-5 h-5 text-red-400 animate-pulse" />
              </div>

              {/* Contenido */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-red-400 uppercase tracking-wide mb-0.5">
                  EN VIVO AHORA
                </p>
                <p className="text-sm font-semibold text-white truncate">
                  {evento.nombre}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  El evento que guardaste ya comenzó
                </p>
              </div>

              {/* Cerrar */}
              <button
                onClick={onDismiss}
                className="flex-shrink-0 p-1 rounded text-gray-500 hover:text-gray-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Botón Entrar */}
            <button
              onClick={handleEntrar}
              className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/80 hover:bg-red-500 text-white text-sm font-semibold transition-colors"
            >
              Entrar al evento
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
