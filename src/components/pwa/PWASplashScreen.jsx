import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Splash Screen Premium para PWA
 * Se muestra al iniciar la aplicación instalada
 */
export const PWASplashScreen = ({ onComplete }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Duración del splash screen: 2.5 segundos
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 500); // Esperar a que termine la animación de salida
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A]"
        >
          {/* Partículas de fondo animadas */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-gradient-to-r from-[#8B5CF6] to-[#10B981] rounded-full"
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                  scale: 0,
                  opacity: 0
                }}
                animate={{
                  y: [null, Math.random() * window.innerHeight],
                  scale: [0, 1, 0],
                  opacity: [0, 0.6, 0]
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2
                }}
              />
            ))}
          </div>

          {/* Logo con animación premium */}
          <div className="relative z-10 flex flex-col items-center gap-8">
            {/* Logo principal */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                duration: 1
              }}
              className="relative"
            >
              {/* Glow effect */}
              <motion.div
                className="absolute inset-0 blur-3xl"
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                  scale: [0.8, 1.2, 0.8]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <div className="w-40 h-40 bg-gradient-to-r from-[#8B5CF6] to-[#10B981] rounded-full" />
              </motion.div>

              {/* Logo */}
              <img
                src="/LOGO-TRASPARENTE.png"
                alt="Chactivo"
                className="w-40 h-40 relative z-10 object-contain"
              />

              {/* Anillo animado */}
              <motion.div
                className="absolute inset-0 border-4 border-transparent rounded-full"
                style={{
                  borderImage: "linear-gradient(135deg, #8B5CF6, #10B981, #8B5CF6) 1"
                }}
                animate={{
                  rotate: 360
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            </motion.div>

            {/* Texto Chactivo */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-center"
            >
              <h1 className="text-4xl font-bold bg-gradient-to-r from-[#8B5CF6] to-[#10B981] bg-clip-text text-transparent mb-2">
                Chactivo
              </h1>
              <p className="text-gray-400 text-sm">Comunidad LGBT+ Chile</p>
            </motion.div>

            {/* Loading bar */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "200px" }}
              transition={{ delay: 0.8, duration: 1.5 }}
              className="h-1 bg-gradient-to-r from-[#8B5CF6] to-[#10B981] rounded-full overflow-hidden"
            >
              <motion.div
                className="h-full w-full bg-white/30"
                animate={{
                  x: ["-100%", "100%"]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PWASplashScreen;
