import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, Activity } from 'lucide-react';
import { subscribeToMultipleRoomCounts } from '@/services/presenceService';
import { roomsData } from '@/config/rooms';
import AnimatedNumber from '@/components/ui/AnimatedNumber';

/** 🔥 Hook: número vivo que fluctúa solo */
const useLiveNumber = ({
  base,
  enabled = true,
  min = 0,
  max = 9999,
  interval = 2500,
  variance = 15
}) => {
  const [value, setValue] = useState(base ?? 0);

  // si cambia el base (por ejemplo llega data real), sincroniza suave
  useEffect(() => {
    if (typeof base === 'number') setValue(base);
  }, [base]);

  useEffect(() => {
    if (!enabled) return;

    const timer = setInterval(() => {
      const delta = Math.floor(Math.random() * variance * 2) - variance; // -variance .. +variance
      setValue((prev) => {
        const next = prev + delta;
        return Math.max(min, Math.min(max, next));
      });
    }, interval);

    return () => clearInterval(timer);
  }, [enabled, interval, variance, min, max]);

  return value;
};

const GlobalStats = () => {
  const [roomCounts, setRoomCounts] = useState({});

  useEffect(() => {
    const roomIds = roomsData.map((room) => room.id);
    const unsubscribe = subscribeToMultipleRoomCounts(roomIds, (counts) => {
      setRoomCounts(counts);
    });

    return () => unsubscribe();
  }, []);

  const getExampleNumbers = () => ({
    'santiago': 127,
    'valparaiso': 89,
    'conversas-libres': 156,
    'amistad': 73,
    'osos': 45,
    'activos-buscando': 92,
    'pasivos-buscando': 68,
    'lesbianas': 34,
    'menos-30': 201,
    'mas-30': 134,
    'mas-40': 67,
    'mas-50': 28,
    'gaming': 112
  });

  const getRoomStats = () => {
    const exampleCounts = getExampleNumbers();

    const stats = roomsData.map((room) => {
      const realCount = roomCounts[room.id] || 0;

      // Si no hay usuarios reales, usamos números demo (estables)
      const displayCount =
        realCount > 0
          ? realCount
          : (exampleCounts[room.id] || Math.floor(Math.random() * 150) + 20);

      return {
        id: room.id,
        name: room.name,
        count: realCount,       // real
        displayCount            // lo que mostramos como base
      };
    });

    stats.sort((a, b) => b.displayCount - a.displayCount);
    return stats;
  };

  const stats = getRoomStats();
  const totalUsersReal = stats.reduce((sum, room) => sum + room.count, 0);

  // base total: real si hay, si no, demo
  const baseTotal = totalUsersReal > 0 ? totalUsersReal : 342;

  const mostActiveRoom = stats[0];
  const baseMostActive = mostActiveRoom?.displayCount ?? 120;

  // ✅ modo “live demo” cuando NO hay usuarios reales
  const liveDemoEnabled = totalUsersReal === 0;

  // 🔥 Números vivos por sección
  const liveTotalUsers = useLiveNumber({
    base: baseTotal,
    enabled: liveDemoEnabled,
    min: 280,
    max: 420,
    interval: 2200,
    variance: 12
  });

  const liveMostActive = useLiveNumber({
    base: baseMostActive,
    enabled: liveDemoEnabled,
    min: Math.max(40, baseMostActive - 40),
    max: baseMostActive + 40,
    interval: 2600,
    variance: 10
  });

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass-effect rounded-2xl p-6 border border-primary/20"
      >
        {/* Header */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <Activity className="w-6 h-6 text-primary animate-pulse" />
          <h2 className="text-2xl font-bold magenta-gradient-text">Actividad en Tiempo Real</h2>
          <Activity className="w-6 h-6 text-primary animate-pulse" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Total de Usuarios Online */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20"
          >
            <div className="p-3 rounded-full bg-blue-500/20">
              <Users className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Usuarios Conectados</p>
              <p className="text-3xl font-bold text-blue-400">
                <AnimatedNumber value={liveTotalUsers} duration={1200} />
              </p>
              <div className="flex items-center gap-1 mt-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs text-green-500 font-medium">En línea ahora</span>
              </div>
            </div>
          </motion.div>

          {/* Sala Más Concurrida */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20"
          >
            <div className="p-3 rounded-full bg-purple-500/20">
              <TrendingUp className="w-8 h-8 text-purple-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Sala Más Concurrida</p>
              <p className="text-xl font-bold text-purple-400 truncate">
                {mostActiveRoom?.name || 'Cargando...'}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Users className="w-4 h-4 text-pink-400" />
                <span className="text-sm font-semibold text-pink-400">
                  <AnimatedNumber value={liveMostActive} duration={1000} /> personas chateando
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Top 3 Salas */}
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground mb-3 text-center">
            🔥 Top 3 Salas Más Activas
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {stats.slice(0, 3).map((room, index) => {
              const liveRoom = useLiveNumber({
                base: room.displayCount,
                enabled: liveDemoEnabled,
                min: Math.max(0, room.displayCount - 25),
                max: room.displayCount + 25,
                interval: 2800 + index * 500,
                variance: 7 + index * 2
              });

              return (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/10"
                >
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      index === 0
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : index === 1
                        ? 'bg-gray-400/20 text-gray-300'
                        : 'bg-orange-500/20 text-orange-400'
                    } font-bold`}
                  >
                    {index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{room.name}</p>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-primary" />
                      <span className="text-xs text-green-400 font-medium">
                        <AnimatedNumber value={liveRoom} duration={900} /> activos
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 text-center"
        >
          <p className="text-sm text-muted-foreground">
            💬 Únete ahora y sé parte de la comunidad LGBT+ más activa de Chile
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default GlobalStats;
