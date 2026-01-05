import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Banner NO bloqueante para reglas del moderador
 * - Auto-hide en 5s si no hay interacción
 * - Botón X para cerrar
 * - Botón Minimizar (colapsa a barrita)
 * - Poder re-abrir si minimiza
 */
const RulesBanner = ({ message, onDismiss, roomId, userId }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const timerRef = useRef(null);

  // SessionStorage key para no repetir en la misma sesión
  const storageKey = `rules_banner_dismissed_${roomId}_${userId}`;

  useEffect(() => {
    // Verificar si ya fue dismissed en esta sesión
    const wasDismissed = sessionStorage.getItem(storageKey);
    if (wasDismissed === 'true') {
      setIsVisible(false);
      return;
    }

    // Auto-hide después de 5 segundos SI no ha interactuado
    timerRef.current = setTimeout(() => {
      if (!hasInteracted) {
        setIsMinimized(true); // Minimizar en vez de ocultar completamente
      }
    }, 5000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [hasInteracted, roomId, userId, storageKey]);

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem(storageKey, 'true');
    if (onDismiss) onDismiss();
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    setHasInteracted(true);
  };

  const handleMaximize = () => {
    setIsMinimized(false);
    setHasInteracted(true);
  };

  const handleInteraction = () => {
    setHasInteracted(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  if (!isVisible) {
    return null;
  }

  // Barrita minimizada (puede re-abrirse)
  if (isMinimized) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-16 left-0 right-0 z-40 mx-auto max-w-3xl px-4"
      >
        <div className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg shadow-lg">
          <Button
            onClick={handleMaximize}
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs text-white hover:bg-white/20"
          >
            <Maximize2 className="w-3 h-3 mr-1" />
            Ver reglas del chat
          </Button>
          <div className="flex-1" />
          <button
            onClick={handleClose}
            className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
            aria-label="Cerrar reglas"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </motion.div>
    );
  }

  // Banner completo (expandido)
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="fixed top-16 left-0 right-0 z-40 mx-auto max-w-3xl px-4"
        onMouseEnter={handleInteraction}
        onTouchStart={handleInteraction}
      >
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/90 dark:to-pink-900/90 border-2 border-purple-300/60 dark:border-purple-600/50 rounded-lg shadow-xl backdrop-blur-sm">
          {/* Header con botones */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-purple-200 dark:border-purple-700">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xl">🛡️</span>
              <span className="font-bold text-purple-600 dark:text-purple-300 text-sm">
                {message.username || 'Moderador'}
              </span>
            </div>

            <Button
              onClick={handleMinimize}
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs text-purple-600 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-800/50"
            >
              <Minimize2 className="w-3 h-3 mr-1" />
              Minimizar
            </Button>

            <button
              onClick={handleClose}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-purple-100 dark:hover:bg-purple-800/50 transition-colors"
              aria-label="Cerrar reglas"
            >
              <X className="w-4 h-4 text-purple-600 dark:text-purple-300" />
            </button>
          </div>

          {/* Contenido scrollable */}
          <div
            className="px-4 py-3 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-300 dark:scrollbar-thumb-purple-700 scrollbar-track-transparent"
            onScroll={handleInteraction}
          >
            <div className="text-sm leading-relaxed text-foreground whitespace-pre-line">
              {message.content}
            </div>
          </div>

          {/* Footer con botón "Entendido" */}
          <div className="px-4 py-2 border-t border-purple-200 dark:border-purple-700 flex justify-end">
            <Button
              onClick={handleClose}
              size="sm"
              className="h-7 px-3 text-xs bg-purple-600 hover:bg-purple-700 text-white"
            >
              Entendido
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RulesBanner;
