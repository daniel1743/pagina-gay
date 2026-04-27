import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * RoomPreviewCard - Tarjeta de preview de sala con acceso directo
 * Usada en sección "Recomendado para ti"
 */
const RoomPreviewCard = ({
  room,
  highlighted = false,
  onClick,
  index = 0,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.4 },
    }),
  };

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative group"
    >
      <motion.div
        whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0,0,0,0.15)' }}
        className={`
          glassmorphism-card rounded-2xl p-5 sm:p-6
          ${highlighted ? 'border-2 border-cyan-500/50' : 'border border-border'}
          hover:border-cyan-500/60
          transition-all duration-300
          h-full flex flex-col
        `}
      >
        {/* Icono de la sala */}
        <div className="mb-4 flex items-center gap-3">
          <div
            className={`
              w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center
              ${highlighted
                ? 'bg-cyan-500/20 border-2 border-cyan-500/40'
                : 'bg-secondary border border-border'
              }
            `}
          >
            {room.icon ? (
              <room.icon className={`w-6 h-6 sm:w-7 sm:h-7 ${highlighted ? 'text-cyan-400' : 'text-muted-foreground'}`} />
            ) : (
              <span className="text-2xl">{room.emoji || '🌍'}</span>
            )}
          </div>

          {/* Badge destacado si es la sala principal */}
          {highlighted && (
            <div className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40">
              <span className="text-xs font-semibold text-cyan-400">⭐ Destacada</span>
            </div>
          )}
        </div>

        {/* Nombre de la sala */}
        <h3 className="text-lg sm:text-xl font-bold mb-2 leading-tight">
          {room.name}
        </h3>

        {/* Razón de la recomendación */}
        {room.reason && (
          <p className="text-sm text-cyan-400 mb-2 font-medium">
            {room.reason}
          </p>
        )}

        {/* Descripción */}
        <p className="text-sm sm:text-base text-muted-foreground mb-4 flex-1 leading-relaxed">
          {room.description}
        </p>

        {/* Footer: Badge de usuarios + botón */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
          {/* Badge de usuarios activos */}
          {room.userCount !== undefined && room.userCount > 0 ? (
            <div className="flex items-center gap-2 text-sm text-green-400">
              <div className="relative">
                <span className="absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75 animate-ping"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
              </div>
              <span className="font-semibold">{room.userCount} {room.userCount === 1 ? 'activo' : 'activos'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Users className="w-4 h-4" />
              <span>Disponible</span>
            </div>
          )}

          {/* Botón de acción */}
          <Button
            onClick={onClick}
            variant={highlighted ? 'default' : 'outline'}
            size="sm"
            className={`
              ${highlighted
                ? 'border-cyan-600 bg-cyan-600 text-white hover:border-cyan-700 hover:bg-cyan-700 dark:border-cyan-400 dark:bg-cyan-400 dark:text-slate-950 dark:hover:border-cyan-300 dark:hover:bg-cyan-300'
                : 'border-slate-300 bg-white text-slate-900 hover:border-cyan-500 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10'
              }
              transition-all
            `}
          >
            Entrar
            <motion.div
              animate={{ x: isHovered ? 2 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ArrowRight className="w-4 h-4 ml-1" />
            </motion.div>
          </Button>
        </div>

        {/* Glow effect para destacada */}
        {highlighted && (
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-cyan-500/5 rounded-2xl pointer-events-none"></div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default RoomPreviewCard;
