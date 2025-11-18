import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, Activity } from 'lucide-react';
import { subscribeToMultipleRoomCounts } from '@/services/presenceService';
import { roomsData } from '@/config/rooms';

const GlobalStats = () => {
  const [roomCounts, setRoomCounts] = useState({});

  // Suscribirse a contadores de todas las salas
  useEffect(() => {
    const roomIds = roomsData.map(room => room.id);
    const unsubscribe = subscribeToMultipleRoomCounts(roomIds, (counts) => {
      setRoomCounts(counts);
    });

    return () => unsubscribe();
  }, []);

  // Calcular estadísticas
  const getRoomStats = () => {
    const stats = roomsData.map(room => {
      const realCount = roomCounts[room.id] || 0;

      // Generar número ficticio consistente basado en ID de sala
      // Mínimo 50, 70, 100+ usuarios para mostrar actividad alta
      const hashCode = room.id.split('').reduce((acc, char) => {
        return char.charCodeAt(0) + ((acc << 5) - acc);
      }, 0);
      // Generar números en rangos: 50-69, 70-99, 100-149, 150+ (más activos)
      const ranges = [50, 70, 100, 120, 150];
      const rangeIndex = Math.abs(hashCode % ranges.length);
      const baseMin = ranges[rangeIndex];
      const rangeSize = rangeIndex < ranges.length - 1 ? ranges[rangeIndex + 1] - baseMin : 50;
      const fictitiousUsers = baseMin + Math.abs(hashCode % rangeSize);
      const totalCount = Math.max(fictitiousUsers, realCount > 0 ? Math.max(realCount, 50) : fictitiousUsers);

      return {
        id: room.id,
        name: room.name,
        count: totalCount
      };
    });

    // Ordenar por cantidad de usuarios
    stats.sort((a, b) => b.count - a.count);

    return stats;
  };

  const stats = getRoomStats();
  const totalUsers = stats.reduce((sum, room) => sum + room.count, 0);
  const mostActiveRoom = stats[0];

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
                {totalUsers.toLocaleString()}
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
                  {mostActiveRoom?.count || 0} personas chateando
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
            {stats.slice(0, 3).map((room, index) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/10"
              >
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                  index === 1 ? 'bg-gray-400/20 text-gray-300' :
                  'bg-orange-500/20 text-orange-400'
                } font-bold`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{room.name}</p>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-primary" />
                    <span className="text-xs text-muted-foreground">{room.count}</span>
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
