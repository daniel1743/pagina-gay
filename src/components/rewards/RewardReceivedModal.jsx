import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Award, Crown, Gift, Shield, Sparkles, Star, X, Zap } from 'lucide-react';
import { REWARD_TYPES } from '@/services/rewardsService';

const typeConfig = {
  [REWARD_TYPES.PREMIUM_1_MONTH]: {
    icon: Crown,
    title: 'Premium por 1 mes',
    accent: 'from-yellow-400 to-amber-500',
  },
  [REWARD_TYPES.VERIFIED_1_MONTH]: {
    icon: Shield,
    title: 'Verificacion por 1 mes',
    accent: 'from-blue-400 to-cyan-500',
  },
  [REWARD_TYPES.SPECIAL_AVATAR]: {
    icon: Star,
    title: 'Avatar especial',
    accent: 'from-purple-400 to-fuchsia-500',
  },
  [REWARD_TYPES.FEATURED_USER]: {
    icon: Award,
    title: 'Usuario destacado',
    accent: 'from-pink-400 to-rose-500',
  },
  [REWARD_TYPES.MODERATOR_1_MONTH]: {
    icon: Shield,
    title: 'Moderador por 1 mes',
    accent: 'from-cyan-400 to-teal-500',
  },
  [REWARD_TYPES.PRO_USER]: {
    icon: Zap,
    title: 'Premio PRO',
    accent: 'from-amber-400 to-orange-500',
  },
};

const RewardReceivedModal = ({ isOpen, reward, onAccept, username }) => {
  if (!isOpen || !reward) return null;

  const config = typeConfig[reward.type] || {
    icon: Gift,
    title: 'Recompensa especial',
    accent: 'from-green-400 to-emerald-500',
  };
  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 12 }}
          transition={{ type: 'spring', stiffness: 220, damping: 24 }}
          className="relative w-full max-w-md rounded-2xl overflow-hidden border border-white/10 bg-[#1f1b30] shadow-2xl"
        >
          <motion.div
            className="absolute left-0 top-0 h-full w-10 bg-gradient-to-r from-fuchsia-600/35 to-transparent"
            animate={{ x: [0, 3, 0] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
          <motion.div
            className="absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-cyan-500/30 to-transparent"
            animate={{ x: [0, -3, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.4 }}
          />

          <button
            type="button"
            onClick={onAccept}
            className="absolute right-3 top-3 z-20 rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="relative z-10 p-6">
            <div className="mb-4 flex justify-center">
              <motion.div
                className={`flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br ${config.accent} shadow-[0_0_24px_rgba(99,102,241,0.4)]`}
                animate={{ y: [0, -4, 0], rotate: [0, 4, -4, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Icon className="w-10 h-10 text-white" />
              </motion.div>
            </div>

            <h2 className="text-center text-2xl font-extrabold text-white">
              {username ? `Felicidades, ${username}` : 'Felicidades'}
            </h2>
            <p className="mt-2 text-center text-base font-semibold text-cyan-300">
              Recibiste: {config.title}
            </p>

            {reward.reasonDescription && (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-sm leading-relaxed text-gray-200">{reward.reasonDescription}</p>
              </div>
            )}

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-300">
              <Sparkles className="w-3.5 h-3.5 text-fuchsia-300" />
              <span>Tu premio ya fue aplicado a tu cuenta</span>
            </div>

            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={onAccept}
              className={`mt-6 w-full rounded-xl bg-gradient-to-r ${config.accent} px-4 py-3 text-sm font-bold text-white shadow-lg`}
            >
              Aceptar premio
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RewardReceivedModal;
