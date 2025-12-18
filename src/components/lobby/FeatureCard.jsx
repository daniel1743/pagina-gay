import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, TrendingUp, Sparkles, Users } from 'lucide-react';

/**
 * FeatureCard - Tarjeta profesional tipo SaaS
 * Diseñada para transmitir confianza, actividad y valor
 */
const FeatureCard = ({
  icon,
  title,
  description,
  onClick,
  index,
  badge = null, // "Activo" | "Nuevo" | "Recomendado" | "Popular"
  variant = "default", // "default" | "primary" | "secondary"
  stats = null, // { label: "15 personas", icon: Users }
  accentColor = "cyan", // "cyan" | "purple" | "green" | "orange"
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.08,
        duration: 0.4,
        ease: "easeOut"
      },
    }),
  };

  // Colores según accentColor con soporte light/dark
  const accentColors = {
    cyan: {
      // DARK mode (por defecto)
      badge: "from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-300 light:from-cyan-100 light:to-blue-100 light:border-cyan-600 light:text-cyan-700",
      glow: "group-hover:shadow-cyan-500/20 light:group-hover:shadow-cyan-500/30",
      iconBg: "bg-gradient-to-br from-cyan-500/10 to-blue-500/10 light:from-cyan-100 light:to-blue-100",
      iconColor: "text-cyan-400 light:text-cyan-700",
      arrow: "text-cyan-400 group-hover:text-cyan-300 light:text-cyan-600 light:group-hover:text-cyan-700"
    },
    purple: {
      badge: "from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-300 light:from-purple-100 light:to-pink-100 light:border-purple-600 light:text-purple-700",
      glow: "group-hover:shadow-purple-500/20 light:group-hover:shadow-purple-500/30",
      iconBg: "bg-gradient-to-br from-purple-500/10 to-pink-500/10 light:from-purple-100 light:to-pink-100",
      iconColor: "text-purple-400 light:text-purple-700",
      arrow: "text-purple-400 group-hover:text-purple-300 light:text-purple-600 light:group-hover:text-purple-700"
    },
    green: {
      badge: "from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-300 light:from-green-100 light:to-emerald-100 light:border-green-600 light:text-green-700",
      glow: "group-hover:shadow-green-500/20 light:group-hover:shadow-green-500/30",
      iconBg: "bg-gradient-to-br from-green-500/10 to-emerald-500/10 light:from-green-100 light:to-emerald-100",
      iconColor: "text-green-400 light:text-green-700",
      arrow: "text-green-400 group-hover:text-green-300 light:text-green-600 light:group-hover:text-green-700"
    },
    orange: {
      badge: "from-orange-500/20 to-amber-500/20 border-orange-500/30 text-orange-300 light:from-orange-100 light:to-amber-100 light:border-orange-600 light:text-orange-700",
      glow: "group-hover:shadow-orange-500/20 light:group-hover:shadow-orange-500/30",
      iconBg: "bg-gradient-to-br from-orange-500/10 to-amber-500/10 light:from-orange-100 light:to-amber-100",
      iconColor: "text-orange-400 light:text-orange-700",
      arrow: "text-orange-400 group-hover:text-orange-300 light:text-orange-600 light:group-hover:text-orange-700"
    }
  };

  const colors = accentColors[accentColor] || accentColors.cyan;

  // Variante de tamaño según importancia
  const sizeVariants = {
    primary: "lg:col-span-2 lg:row-span-1", // Card principal destacada
    default: "",
    secondary: ""
  };

  // Badge configs con soporte light/dark
  const badgeConfigs = {
    "Activo": {
      icon: TrendingUp,
      color: colors.badge
    },
    "Nuevo": {
      icon: Sparkles,
      color: "from-pink-500/20 to-rose-500/20 border-pink-500/30 text-pink-300 light:from-pink-100 light:to-rose-100 light:border-pink-600 light:text-pink-700"
    },
    "Recomendado": {
      icon: Sparkles,
      color: "from-amber-500/20 to-yellow-500/20 border-amber-500/30 text-amber-300 light:from-amber-100 light:to-yellow-100 light:border-amber-600 light:text-amber-800"
    },
    "Popular": {
      icon: Users,
      color: "from-purple-500/20 to-fuchsia-500/20 border-purple-500/30 text-purple-300 light:from-purple-100 light:to-fuchsia-100 light:border-purple-600 light:text-purple-700"
    }
  };

  const badgeConfig = badge ? badgeConfigs[badge] : null;
  const BadgeIcon = badgeConfig?.icon;

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      className={`relative group ${sizeVariants[variant]}`}
    >
      {/* Card principal con glassmorphism sutil */}
      <motion.div
        whileHover={{
          y: -6,
          transition: { duration: 0.2, ease: "easeOut" }
        }}
        whileTap={{ scale: 0.98 }}
        className={`
          relative h-full min-h-[180px]
          bg-gradient-to-br from-white/[0.03] to-white/[0.01]
          light:from-white light:to-gray-50
          backdrop-blur-xl
          border border-white/[0.08]
          light:border-gray-300
          rounded-2xl
          p-6
          cursor-pointer
          transition-all duration-300
          hover:border-white/20
          light:hover:border-gray-400
          ${colors.glow}
          hover:shadow-2xl
          light:shadow-lg
          light:hover:shadow-xl
          overflow-hidden
        `}
      >
        {/* Brillo superior sutil */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent light:via-gray-300/50" />

        {/* Badge de estado */}
        {badge && badgeConfig && (
          <div className={`
            absolute top-4 right-4
            px-3 py-1
            rounded-full
            bg-gradient-to-r ${badgeConfig.color}
            border
            backdrop-blur-sm
            flex items-center gap-1.5
            text-xs font-semibold
          `}>
            <BadgeIcon className="w-3 h-3" />
            <span>{badge}</span>
          </div>
        )}

        {/* Contenido */}
        <div className="relative z-10 flex flex-col h-full">

          {/* Icono con background */}
          <motion.div
            className={`
              ${colors.iconBg}
              w-14 h-14
              rounded-xl
              flex items-center justify-center
              mb-4
              border border-white/5
              light:border-gray-300
            `}
            whileHover={{ scale: 1.05, rotate: 3 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <div className={colors.iconColor}>
              {icon}
            </div>
          </motion.div>

          {/* Título */}
          <h3 className="text-xl font-bold text-white light:text-gray-900 mb-2 leading-tight">
            {title}
          </h3>

          {/* Microcopy - descripción con valor */}
          <p className="text-sm text-gray-400 light:text-gray-600 leading-relaxed mb-auto">
            {description}
          </p>

          {/* Footer: Stats o CTA */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5 light:border-gray-200">
            {stats ? (
              <div className="flex items-center gap-2 text-sm text-gray-400 light:text-gray-600">
                {stats.icon && <stats.icon className="w-4 h-4" />}
                <span>{stats.label}</span>
              </div>
            ) : (
              <div className="text-sm text-gray-500 light:text-gray-500">
                Explorar
              </div>
            )}

            {/* Flecha con animación */}
            <motion.div
              className={`
                ${colors.arrow}
                transition-all duration-300
              `}
              animate={{
                x: isHovered ? 4 : 0
              }}
            >
              <ArrowRight className="w-5 h-5" />
            </motion.div>
          </div>
        </div>

        {/* Glow effect en hover */}
        <div
          className={`
            absolute inset-0
            opacity-0 group-hover:opacity-100
            transition-opacity duration-500
            pointer-events-none
          `}
        >
          <div className={`
            absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
            w-40 h-40
            ${colors.iconBg}
            rounded-full
            blur-3xl
          `} />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FeatureCard;
