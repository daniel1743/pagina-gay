import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, TrendingUp, Sparkles, Users } from "lucide-react";

const FeatureCard = ({
  icon,
  title,
  description,
  onClick,
  index,
  badge = null,
  variant = "default",
  stats = null,
  accentColor = "cyan",
  isHorizontal = false, // ✅ Nueva prop para tarjeta horizontal
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.08, duration: 0.4 },
    }),
  };

  /* 🎨 Colores por acento (LIGHT base + DARK override) */
  const accentColors = {
    cyan: {
      badge:
        "bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/30",
      iconBg:
        "bg-cyan-100 border-cyan-200 dark:bg-cyan-500/10 dark:border-white/10",
      iconColor: "text-cyan-700 dark:text-cyan-400",
      arrow: "text-cyan-700 dark:text-cyan-400",
      glow: "group-hover:shadow-cyan-500/20",
    },
    purple: {
      badge:
        "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30",
      iconBg:
        "bg-purple-100 border-purple-200 dark:bg-purple-500/10 dark:border-white/10",
      iconColor: "text-purple-700 dark:text-purple-400",
      arrow: "text-purple-700 dark:text-purple-400",
      glow: "group-hover:shadow-purple-500/20",
    },
    green: {
      badge:
        "bg-green-100 text-green-800 border-green-300 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/30",
      iconBg:
        "bg-green-100 border-green-200 dark:bg-green-500/10 dark:border-white/10",
      iconColor: "text-green-700 dark:text-green-400",
      arrow: "text-green-700 dark:text-green-400",
      glow: "group-hover:shadow-green-500/20",
    },
    orange: {
      badge:
        "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/30",
      iconBg:
        "bg-orange-100 border-orange-200 dark:bg-orange-500/10 dark:border-white/10",
      iconColor: "text-orange-700 dark:text-orange-400",
      arrow: "text-orange-700 dark:text-orange-400",
      glow: "group-hover:shadow-orange-500/20",
    },
  };

  const colors = accentColors[accentColor] || accentColors.cyan;

  const badgeIcons = {
    Activo: TrendingUp,
    Nuevo: Sparkles,
    Popular: Users,
  };

  const BadgeIcon = badge ? badgeIcons[badge] : null;

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      className="relative group cursor-pointer"
    >
      <motion.div
        whileHover={{ y: -6 }}
        whileTap={{ scale: 0.98 }}
        className={`
          relative h-full ${isHorizontal ? 'min-h-[140px] sm:min-h-[160px]' : 'min-h-[200px] sm:min-h-[220px]'}
          bg-card text-foreground
          border-2 border-border
          rounded-2xl p-5 sm:p-6
          transition-all duration-300
          hover:border-primary/60
          shadow-sm hover:shadow-xl
          focus:outline-none focus:ring-4 focus:ring-primary/20
          dark:bg-gradient-to-br dark:from-white/[0.03] dark:to-white/[0.01]
          dark:border dark:border-white/10 dark:hover:border-white/20
          dark:shadow-none
          ${colors.glow}
        `}
        tabIndex={0}
        role="button"
        aria-label={`${title} - ${description}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
      >
        {/* Badge - Solo para layout vertical */}
        {!isHorizontal && badge && BadgeIcon && (
          <div
            className={`absolute top-4 right-4 px-3 py-1 rounded-full border text-xs font-semibold flex items-center gap-1.5 ${colors.badge}`}
          >
            <BadgeIcon className="w-3 h-3" />
            {badge}
          </div>
        )}

        {isHorizontal ? (
          // ✅ Layout horizontal para tarjeta del foro (responsive: mejorado para móvil)
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 h-full relative">
            {/* Icon - Móvil: centrado, Desktop: izquierda */}
            <div className="flex items-center gap-3 sm:block w-full sm:w-auto">
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 flex-shrink-0 rounded-xl flex items-center justify-center border ${colors.iconBg}`}
              >
                <div className={colors.iconColor}>{icon}</div>
              </div>
              {/* Badge en móvil al lado del icono */}
              {badge && BadgeIcon && (
                <div
                  className={`sm:hidden px-2 py-1 rounded-full border text-xs font-semibold flex items-center gap-1.5 ${colors.badge}`}
                >
                  <BadgeIcon className="w-3 h-3" />
                  {badge}
                </div>
              )}
            </div>

            {/* Contenido central */}
            <div className="flex-1 min-w-0 w-full sm:w-auto">
              <div className="flex items-start sm:items-center gap-2 sm:gap-3 mb-2">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold leading-tight flex-1">{title}</h3>
                {/* Badge en desktop */}
                {badge && BadgeIcon && (
                  <div
                    className={`hidden sm:flex px-2 py-1 rounded-full border text-xs font-semibold items-center gap-1.5 flex-shrink-0 ${colors.badge}`}
                  >
                    <BadgeIcon className="w-3 h-3" />
                    {badge}
                  </div>
                )}
              </div>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-3 sm:mb-0">
                {description}
              </p>
              
              {/* Stats en móvil debajo de la descripción */}
              {stats && (
                <div className="sm:hidden flex items-center gap-2 text-xs text-muted-foreground">
                  {stats.icon && <stats.icon className="w-4 h-4" />}
                  <span>{stats.label}</span>
                </div>
              )}
            </div>

            {/* Footer derecho - Solo visible en desktop */}
            <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
              {stats && (
                <div className="flex items-center gap-2 text-sm md:text-base text-muted-foreground">
                  {stats.icon && <stats.icon className="w-5 h-5" />}
                  {stats.label}
                </div>
              )}
              <motion.div animate={{ x: isHovered ? 4 : 0 }}>
                <ArrowRight className={`w-6 h-6 ${colors.arrow}`} />
              </motion.div>
            </div>

            {/* Arrow en móvil - al final */}
            <div className="sm:hidden flex items-center justify-end w-full pt-2 border-t border-border/50">
              <motion.div animate={{ x: isHovered ? 4 : 0 }}>
                <ArrowRight className={`w-5 h-5 ${colors.arrow}`} />
              </motion.div>
            </div>
          </div>
        ) : (
          // Layout vertical normal
          <div className="flex flex-col h-full">
            {/* Icon */}
            <div
              className={`w-14 h-14 mb-4 rounded-xl flex items-center justify-center border ${colors.iconBg}`}
            >
              <div className={colors.iconColor}>{icon}</div>
            </div>

            {/* Title */}
            <h3 className="text-lg sm:text-xl font-bold mb-3 leading-tight">{title}</h3>

            {/* Description */}
            <p className="text-sm sm:text-base text-muted-foreground mb-auto leading-relaxed">
              {description}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border dark:border-white/10">
              {stats ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {stats.icon && <stats.icon className="w-4 h-4" />}
                  {stats.label}
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Explorar</span>
              )}

              <motion.div animate={{ x: isHovered ? 4 : 0 }}>
                <ArrowRight className={`w-5 h-5 ${colors.arrow}`} />
              </motion.div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default FeatureCard;
