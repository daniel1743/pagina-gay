import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Users } from 'lucide-react';
import { subscribeToActiveUsers } from '@/services/analyticsService';

/**
 * Contador de usuarios activos en tiempo real
 * Muestra cuántos usuarios están conectados AHORA MISMO
 */
export const ActiveUsersCounter = () => {
  const [activeUsers, setActiveUsers] = useState(0);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    // Suscribirse a usuarios activos en tiempo real
    const unsubscribe = subscribeToActiveUsers((count) => {
      setActiveUsers(count);
      // Animación de "latido" cuando cambia el número
      setIsLive(false);
      setTimeout(() => setIsLive(true), 100);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-effect p-6 rounded-2xl border border-green-500/30 relative overflow-hidden"
    >
      {/* Indicador de "En Vivo" */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <motion.div
          animate={{
            scale: isLive ? [1, 1.2, 1] : 1,
            opacity: isLive ? [0.5, 1, 0.5] : 0.5,
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-2 h-2 bg-green-400 rounded-full"
        />
        <span className="text-xs text-green-400 font-medium">EN VIVO</span>
      </div>

      {/* Icono principal */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
          <Activity className="w-7 h-7 text-white" />
        </div>
        <div>
          <h4 className="text-sm text-muted-foreground mb-1">Usuarios Activos</h4>
          <motion.h3
            key={activeUsers}
            initial={{ scale: 1.2, color: '#4ade80' }}
            animate={{ scale: 1, color: '#ffffff' }}
            transition={{ duration: 0.3 }}
            className="text-4xl font-bold"
          >
            {activeUsers}
          </motion.h3>
        </div>
      </div>

      {/* Descripción */}
      <p className="text-xs text-muted-foreground flex items-center gap-2">
        <Users className="w-4 h-4" />
        Conectados en los últimos 5 minutos
      </p>

      {/* Barra de progreso decorativa */}
      <div className="mt-4 h-1 bg-background/50 rounded-full overflow-hidden">
        <motion.div
          animate={{
            x: ['-100%', '100%']
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
          className="h-full w-1/3 bg-gradient-to-r from-transparent via-green-400 to-transparent"
        />
      </div>
    </motion.div>
  );
};

export default ActiveUsersCounter;
