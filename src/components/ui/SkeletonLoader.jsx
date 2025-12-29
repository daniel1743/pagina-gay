import React from 'react';
import { motion } from 'framer-motion';

/**
 * Skeleton Loader Premium con glassmorphism
 */
export const SkeletonCard = ({ className = '' }) => {
  return (
    <div className={`relative glassmorphism-card rounded-2xl p-6 overflow-hidden ${className}`}>
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{
          translateX: ['100%', '100%']
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      {/* Content skeleton */}
      <div className="space-y-4 relative z-10">
        {/* Icon + Title */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/10 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-6 bg-white/10 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-white/10 rounded animate-pulse w-1/2" />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <div className="h-3 bg-white/10 rounded animate-pulse w-full" />
          <div className="h-3 bg-white/10 rounded animate-pulse w-5/6" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4">
          <div className="h-4 bg-white/10 rounded animate-pulse w-1/4" />
          <div className="h-10 bg-white/10 rounded-lg animate-pulse w-32" />
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton para métricas pequeñas
 */
export const SkeletonMetric = ({ className = '' }) => {
  return (
    <div className={`glassmorphism-card rounded-xl p-4 ${className}`}>
      <div className="space-y-3">
        <div className="h-8 bg-white/10 rounded animate-pulse w-1/3" />
        <div className="h-4 bg-white/10 rounded animate-pulse w-full" />
      </div>
    </div>
  );
};

/**
 * Skeleton para rooms grid
 */
export const SkeletonRoomsGrid = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
};

export default SkeletonCard;
