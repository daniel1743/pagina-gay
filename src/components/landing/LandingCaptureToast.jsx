import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { LANDING_CAPTURE_MESSAGES, LANDING_TOAST_DISMISSED_KEY, LANDING_TOAST_DISMISS_EXPIRY } from './landingToastMessages';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Toast de captación estratégico para el landing page
 * 
 * Características:
 * - Mensajes rotativos cada 8 segundos
 * - Aparece después de 2 segundos
 * - Se cierra automáticamente después de 15 segundos
 * - Guarda en localStorage si el usuario cierra (no mostrar en 24h)
 * - No se muestra si el usuario ya está autenticado
 * - CTA "Entrar ahora" que abre el modal de nickname
 */
const LandingCaptureToast = ({ onEnterClick, autoCloseDelay = 15000, initialDelay = 2000, rotationInterval = 8000 }) => {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [hasBeenClosed, setHasBeenClosed] = useState(false);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setHasBeenClosed(true);
    
    // Guardar en localStorage que el usuario cerró
    localStorage.setItem(LANDING_TOAST_DISMISSED_KEY, JSON.stringify({
      timestamp: Date.now()
    }));
  }, []);

  // Verificar si el usuario ya cerró el toast (localStorage)
  useEffect(() => {
    const dismissedData = localStorage.getItem(LANDING_TOAST_DISMISSED_KEY);
    if (dismissedData) {
      const { timestamp } = JSON.parse(dismissedData);
      const now = Date.now();
      // Si pasaron menos de 24 horas, no mostrar
      if (now - timestamp < LANDING_TOAST_DISMISS_EXPIRY) {
        return;
      } else {
        // Expiró, limpiar
        localStorage.removeItem(LANDING_TOAST_DISMISSED_KEY);
      }
    }

    // No mostrar si el usuario ya está autenticado (no es guest ni anonymous)
    if (user && !user.isGuest && !user.isAnonymous) {
      return;
    }

    // Mostrar después del delay inicial
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, initialDelay);

    return () => clearTimeout(showTimer);
  }, [user, initialDelay]);

  // Rotación automática de mensajes
  useEffect(() => {
    if (!isVisible || hasBeenClosed) return;

    const rotationTimer = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % LANDING_CAPTURE_MESSAGES.length);
    }, rotationInterval);

    return () => clearInterval(rotationTimer);
  }, [isVisible, hasBeenClosed, rotationInterval]);

  // Cierre automático después del delay
  useEffect(() => {
    if (!isVisible || hasBeenClosed) return;

    const autoCloseTimer = setTimeout(() => {
      handleClose();
    }, autoCloseDelay);

    return () => clearTimeout(autoCloseTimer);
  }, [isVisible, hasBeenClosed, autoCloseDelay, currentMessageIndex, handleClose]);

  const handleEnterClick = () => {
    handleClose();
    onEnterClick?.();
  };

  const currentMessage = LANDING_CAPTURE_MESSAGES[currentMessageIndex];

  if (!isVisible || !currentMessage) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed top-4 left-4 right-4 sm:top-auto sm:left-auto sm:right-4 sm:bottom-4 z-50 w-auto max-w-sm sm:max-w-md mx-auto sm:mx-0"
      >
        <div
          className="relative bg-white/95 dark:bg-gray-900/95 rounded-xl border-2 p-4 sm:p-5 backdrop-blur-xl border-purple-300 dark:border-purple-500/30 shadow-xl"
          style={{
            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3), 0 4px 16px rgba(0, 0, 0, 0.2)'
          }}
        >
          {/* Botón de cerrar */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-1 rounded-full hover:bg-gray-200 dark:hover:bg-white/10"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Contenido del mensaje */}
          <div className="pr-8">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-2xl flex-shrink-0">{currentMessage.icon}</span>
              <div className="flex-1 min-w-0">
                <h3 className="text-gray-900 dark:text-white font-bold text-base sm:text-lg mb-1">
                  {currentMessage.title}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base">
                  {currentMessage.description}
                </p>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleEnterClick}
              className="w-full mt-3 px-4 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm sm:text-base rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/50 flex items-center justify-center gap-2"
            >
              <span>Entrar ahora</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </button>
          </div>

          {/* Indicadores de rotación (puntos) */}
          <div className="flex gap-1.5 justify-center mt-3 pt-3 border-t border-gray-300 dark:border-white/10">
            {LANDING_CAPTURE_MESSAGES.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentMessageIndex(index)}
                className={`h-1.5 rounded-full transition-all ${
                  index === currentMessageIndex
                    ? 'w-6 bg-purple-600 dark:bg-purple-400'
                    : 'w-1.5 bg-gray-400 dark:bg-white/30 hover:bg-gray-500 dark:hover:bg-white/50'
                }`}
                aria-label={`Ir a mensaje ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LandingCaptureToast;

