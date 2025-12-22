import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, Activity } from 'lucide-react';
import { subscribeToMultipleRoomCounts } from '@/services/presenceService';
import { roomsData } from '@/config/rooms';
import AnimatedNumber from '@/components/ui/AnimatedNumber';

const GlobalStats = () => {
  const [roomCounts, setRoomCounts] = useState({});

  useEffect(() => {
    const roomIds = roomsData.map((room) => room.id);
    const unsubscribe = subscribeToMultipleRoomCounts(roomIds, (counts) => {
      setRoomCounts(counts);
    });

    return () => unsubscribe();
  }, []);

  const getRoomStats = () => {
    const stats = roomsData.map((room) => {
      const count = roomCounts[room.id] || 0;

      return {
        id: room.id,
        name: room.name,
        count: count
      };
    });

    stats.sort((a, b) => b.count - a.count);
    return stats;
  };

  const stats = getRoomStats();
  const totalUsers = stats.reduce((sum, room) => sum + room.count, 0);
  const mostActiveRoom = stats[0];
  const mostActiveCount = mostActiveRoom?.count ?? 0;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 sm:mb-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass-effect rounded-2xl p-5 sm:p-6 lg:p-8 border border-primary/20"
      >
        {/* Header */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
          <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-primary animate-pulse" />
          <h2 className="text-xl sm:text-2xl font-bold magenta-gradient-text">Actividad en Tiempo Real</h2>
          <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-primary animate-pulse" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Total de Usuarios Online */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20"
          >
            <div className="p-3 rounded-full bg-blue-500/20">
              <Users className="w-8 h-8 text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Usuarios Conectados</p>
              <p className="text-2xl sm:text-3xl font-bold text-blue-400">
                <AnimatedNumber value={totalUsers} duration={1200} />
              </p>
              <div className="flex items-center gap-1 mt-1 sm:mt-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs text-green-500 font-medium">En línea ahora</span>
              </div>
            </div>
          </motion.div>

          {/* Sala Más Concurrida */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20"
          >
            <div className="p-3 rounded-full bg-purple-500/20">
              <TrendingUp className="w-8 h-8 text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Sala Más Concurrida</p>
              <p className="text-lg sm:text-xl font-bold text-purple-400 truncate">
                {mostActiveRoom?.name || 'Sin salas activas'}
              </p>
              <div className="flex items-center gap-2 mt-1 sm:mt-2">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 text-pink-400 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-pink-400 truncate">
                  <AnimatedNumber value={mostActiveCount} duration={1000} /> personas chateando
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Top 3 Salas */}
        <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-border">
          <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-5 text-center font-semibold">
            🔥 Top 3 Salas Más Activas
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {stats.slice(0, 3).map((room, index) => (
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
                      <AnimatedNumber value={room.count} duration={900} /> activos
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
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
