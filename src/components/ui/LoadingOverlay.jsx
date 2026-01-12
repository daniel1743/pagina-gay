import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ✅ FASE 2: Fullscreen Loading Overlay
 *
 * Overlay de carga a pantalla completa que se muestra durante
 * el proceso de autenticación de invitados (8-12 segundos de Firebase).
 *
 * Propósito:
 * - Dar feedback visual inmediato al usuario
 * - Eliminar incertidumbre durante la espera
 * - Mantener confianza y retención
 *
 * @param {boolean} show - Si true, muestra el overlay
 */
export const LoadingOverlay = ({ show }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }} // Fade-in rápido (100ms)
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--secondary)) 100%)',
          }}
          role="alert"
          aria-live="polite"
          aria-label="Cargando, por favor espera"
        >
          <div className="flex flex-col items-center gap-6 px-6 text-center">
            {/* Spinner animado */}
            <div className="relative">
              {/* Anillo exterior giratorio */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="w-20 h-20 rounded-full border-4 border-purple-500/20 border-t-purple-500"
              />

              {/* Anillo interior giratorio (dirección opuesta) */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute inset-2 w-16 h-16 rounded-full border-4 border-cyan-500/20 border-t-cyan-500"
              />

              {/* Punto central pulsante */}
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-6 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500"
              />
            </div>

            {/* Texto principal */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                Entrando al chat…
              </h2>
              <p className="text-base text-muted-foreground opacity-70">
                Preparando tu sesión
              </p>
            </div>

            {/* Mensaje de confianza (aparece después de 3 segundos) */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 3, duration: 0.5 }}
              className="text-sm text-muted-foreground/50 max-w-xs"
            >
              Esto puede tomar unos segundos mientras conectamos con el servidor…
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
