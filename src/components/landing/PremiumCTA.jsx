import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Users, Clock, Shield, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * 🚀 PREMIUM CTA COMPONENT
 * CTA profesional con micro interacciones, urgencia y énfasis en "SIN REGISTRO"
 *
 * Características:
 * - Contador de usuarios en tiempo real
 * - Partículas animadas en hover
 * - Badge pulsante "SIN REGISTRO"
 * - Efecto shine/brillo
 * - Confetti effect (opcional)
 * - Copy persuasivo profesional
 * - Múltiples variantes A/B
 */

const PremiumCTA = ({
  onClick,
  variant = 'hero', // 'hero', 'inline', 'sticky'
  showUserCount = true,
  className = ''
}) => {
  const [userCount, setUserCount] = useState(247);
  const [isHovered, setIsHovered] = useState(false);
  const [particles, setParticles] = useState([]);
  const [lastConnectionTime, setLastConnectionTime] = useState(3);

  // Simular contador de usuarios en tiempo real (variación +/- 3 cada 5 segundos)
  useEffect(() => {
    const interval = setInterval(() => {
      setUserCount(prev => {
        const change = Math.floor(Math.random() * 7) - 3; // -3 a +3
        return Math.max(200, Math.min(300, prev + change));
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Actualizar "última conexión" cada 3-8 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setLastConnectionTime(Math.floor(Math.random() * 6) + 3); // 3-8 segundos
    }, Math.floor(Math.random() * 5000) + 3000);
    return () => clearInterval(interval);
  }, []);

  // Generar partículas en hover
  useEffect(() => {
    if (isHovered && variant === 'hero') {
      const newParticles = Array.from({ length: 8 }, (_, i) => ({
        id: Math.random(),
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: i * 0.1
      }));
      setParticles(newParticles);
    } else {
      setParticles([]);
    }
  }, [isHovered, variant]);

  // Variantes de copy según el tipo de CTA
  const ctaCopy = {
    hero: {
      badge: "🔥 MÁS DE 1,000 USUARIOS ACTIVOS",
      title: "SIN REGISTRO",
      subtitle: "Entra en 1 clic",
      buttonText: "Chatear Gratis Ahora",
      buttonIcon: Zap,
      microCopy: "No necesitas email, tarjeta ni nada • Chatea 1 mes gratis"
    },
    inline: {
      badge: "✨ 100% GRATIS",
      title: "SIN REGISTRO",
      subtitle: "Acceso inmediato",
      buttonText: "Entrar al Chat",
      buttonIcon: ArrowRight,
      microCopy: "Sin email • Sin tarjeta • Sin compromiso"
    },
    sticky: {
      badge: null,
      title: "SIN REGISTRO",
      subtitle: null,
      buttonText: "⚡ Chatear Gratis",
      buttonIcon: null,
      microCopy: null
    }
  };

  const copy = ctaCopy[variant];

  // Configuración de tamaño según variante
  const sizes = {
    hero: {
      container: "max-w-4xl mx-auto",
      badge: "text-sm sm:text-base px-6 py-3",
      title: "text-5xl sm:text-6xl md:text-7xl",
      subtitle: "text-xl sm:text-2xl",
      button: "text-xl sm:text-2xl md:text-3xl px-12 sm:px-16 md:px-20 py-6 sm:py-7 md:py-8",
      userCount: "text-base sm:text-lg"
    },
    inline: {
      container: "max-w-2xl mx-auto",
      badge: "text-xs sm:text-sm px-4 py-2",
      title: "text-3xl sm:text-4xl",
      subtitle: "text-lg sm:text-xl",
      button: "text-lg sm:text-xl px-8 sm:px-12 py-5 sm:py-6",
      userCount: "text-sm sm:text-base"
    },
    sticky: {
      container: "w-full",
      badge: null,
      title: "text-xs font-bold",
      subtitle: null,
      button: "text-base sm:text-lg px-6 py-4",
      userCount: "text-xs"
    }
  };

  const size = sizes[variant];

  return (
    <div className={`relative ${size.container} ${className}`}>
      {/* Badge superior */}
      {copy.badge && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex justify-center"
        >
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 blur-xl animate-pulse" />
            <div className={`relative bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-2 border-green-500/50 rounded-full ${size.badge}`}>
              <span className="font-extrabold text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]">
                {copy.badge}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Badge "SIN REGISTRO" pulsante */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mb-4 flex justify-center"
      >
        <div className="relative inline-block">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 blur-2xl opacity-50 animate-pulse" />

          {/* Badge principal */}
          <div className="relative bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 p-1 rounded-2xl animate-gradient">
            <div className="bg-background px-8 py-4 rounded-xl">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-cyan-400 animate-pulse" />
                <div className="text-left">
                  <p className={`font-black bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent ${size.title}`}>
                    {copy.title}
                  </p>
                  {copy.subtitle && (
                    <p className={`${size.subtitle} text-muted-foreground font-semibold`}>
                      {copy.subtitle}
                    </p>
                  )}
                </div>
                <Sparkles className="w-6 h-6 text-yellow-400 animate-spin-slow" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Contador de usuarios activos (si está habilitado) */}
      {showUserCount && variant !== 'sticky' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 flex flex-wrap items-center justify-center gap-4 sm:gap-6"
        >
          {/* Usuarios activos */}
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-2">
            <div className="relative">
              <Users className="w-5 h-5 text-green-400" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
            </div>
            <span className={`font-bold text-green-400 ${size.userCount}`}>
              <AnimatePresence mode="wait">
                <motion.span
                  key={userCount}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.3 }}
                >
                  {userCount}
                </motion.span>
              </AnimatePresence>
              {' '}online ahora
            </span>
          </div>

          {/* Última conexión */}
          <div className="flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full px-4 py-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            <span className={`font-semibold text-cyan-400 ${size.userCount}`}>
              Última: hace {lastConnectionTime}s
            </span>
          </div>
        </motion.div>
      )}

      {/* Botón principal con micro interacciones */}
      <motion.div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: variant === 'hero' ? 1.05 : 1.02 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Partículas animadas en hover */}
        <AnimatePresence>
          {isHovered && particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0.5],
                x: (particle.x - 50) * 2,
                y: (particle.y - 50) * 2,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 1.5,
                delay: particle.delay,
                repeat: Infinity,
                repeatDelay: 0.5
              }}
              className="absolute w-2 h-2 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full pointer-events-none"
              style={{
                left: '50%',
                top: '50%',
              }}
            />
          ))}
        </AnimatePresence>

        {/* Glow effect del botón */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#E4007C] via-purple-600 to-cyan-500 blur-2xl opacity-50 group-hover:opacity-75 transition-opacity rounded-2xl" />

        {/* Botón principal */}
        <Button
          onClick={onClick}
          className={`
            relative w-full sm:w-auto
            bg-gradient-to-r from-[#E4007C] via-purple-600 to-cyan-500
            hover:from-[#FF1493] hover:via-purple-500 hover:to-cyan-400
            text-white font-black
            ${size.button}
            rounded-2xl
            shadow-2xl shadow-[#E4007C]/50
            hover:shadow-[#E4007C]/70
            transition-all duration-300
            overflow-hidden
            group
          `}
        >
          {/* Efecto shine */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

          {/* Contenido del botón */}
          <span className="relative flex items-center justify-center gap-3">
            {copy.buttonIcon && <copy.buttonIcon className="w-6 h-6 sm:w-7 sm:h-7 animate-pulse" />}
            {copy.buttonText}
            <ArrowRight className="w-6 h-6 sm:w-7 sm:h-7 group-hover:translate-x-2 transition-transform" />
          </span>
        </Button>
      </motion.div>

      {/* Micro copy debajo del botón */}
      {copy.microCopy && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-sm sm:text-base"
        >
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle className="w-4 h-4" />
            <span className="font-semibold">Sin email</span>
          </div>
          <div className="hidden sm:block w-1 h-1 bg-muted-foreground rounded-full" />
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle className="w-4 h-4" />
            <span className="font-semibold">Sin tarjeta</span>
          </div>
          <div className="hidden sm:block w-1 h-1 bg-muted-foreground rounded-full" />
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle className="w-4 h-4" />
            <span className="font-semibold">1 mes gratis</span>
          </div>
        </motion.div>
      )}

      {/* Animación de gradiente en el badge */}
      <style>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PremiumCTA;
