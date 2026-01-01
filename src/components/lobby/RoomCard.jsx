import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users } from 'lucide-react';

/**
 * RoomCard - Tarjeta compacta para grid de exploración de salas
 * Usada en tabs de categorías
 */
const RoomCard = ({
  room,
  userCount = 0,
  onClick,
  index = 0,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: (i) => ({
      opacity: 1,
      scale: 1,
      transition: { delay: i * 0.05, duration: 0.3 },
    }),
  };

  // Colores por sala (matching con rooms config)
  const colorMap = {
    teal: 'from-teal-500 to-cyan-500',
    cyan: 'from-cyan-500 to-blue-500',
    violet: 'from-violet-500 to-purple-500',
    red: 'from-red-500 to-pink-500',
    green: 'from-green-500 to-emerald-500',
    blue: 'from-blue-500 to-indigo-500',
    purple: 'from-purple-500 to-fuchsia-500',
  };

  const gradientClass = colorMap[room.color] || colorMap.teal;

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      className="relative cursor-pointer group"
    >
      <motion.div
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.98 }}
        className="glassmorphism-card rounded-xl p-4 border border-border hover:border-cyan-500/40 transition-all duration-300 h-full flex flex-col min-h-[140px]"
      >
        {/* Icono con gradiente de fondo */}
        <div className="mb-3 flex items-center justify-between">
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-lg`}>
            {room.icon ? (
              <room.icon className="w-6 h-6 text-white" />
            ) : (
              <span className="text-2xl">{room.emoji || '🌍'}</span>
            )}
          </div>

          {/* Badge de usuarios activos */}
          {userCount > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/20 border border-green-500/30">
              <div className="relative">
                <span className="absolute inline-flex h-1.5 w-1.5 rounded-full bg-green-400 opacity-75 animate-ping"></span>
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500"></span>
              </div>
              <span className="text-xs font-semibold text-green-400">{userCount}</span>
            </div>
          )}
        </div>

        {/* Nombre de la sala */}
        <h3 className="text-base sm:text-lg font-bold mb-2 leading-tight">
          {room.name}
        </h3>

        {/* Descripción (visible en hover en móvil, siempre en desktop) */}
        <AnimatePresence>
          {(isHovered || window.innerWidth >= 768) && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="text-xs sm:text-sm text-muted-foreground leading-relaxed"
            >
              {room.description}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Indicador visual de hover */}
        <motion.div
          animate={{ opacity: isHovered ? 1 : 0 }}
          className="absolute bottom-3 right-3"
        >
          <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default RoomCard;
