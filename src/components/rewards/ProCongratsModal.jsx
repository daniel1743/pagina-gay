import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Star, Image, Sparkles, X } from 'lucide-react';

const ProCongratsModal = ({ isOpen, onClose, username }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
        >
          {/* Borde arcoíris animado */}
          <div className="absolute inset-0 rounded-2xl rainbow-avatar-ring p-[3px]">
            <div className="w-full h-full bg-gray-900 rounded-2xl" />
          </div>

          <div className="relative z-10 bg-gray-900 rounded-2xl p-6 m-[3px]">
            {/* Botón cerrar */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Icono principal */}
            <div className="flex justify-center mb-4">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-[0_0_30px_rgba(251,191,36,0.4)]"
              >
                <Zap className="w-10 h-10 text-white" />
              </motion.div>
            </div>

            {/* Título */}
            <h2 className="text-2xl font-extrabold text-center mb-1">
              <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">
                ¡Felicidades, {username}!
              </span>
            </h2>

            <p className="text-center text-gray-300 text-sm mb-5">
              Tu participación activa te ha convertido en usuario
              <span className="inline-flex items-center gap-0.5 mx-1 bg-gradient-to-r from-amber-500 to-orange-500 text-[10px] font-bold px-1.5 py-0.5 rounded text-white uppercase tracking-wider">
                <Zap className="w-2.5 h-2.5" />PRO
              </span>
            </p>

            {/* Beneficios */}
            <div className="space-y-2.5 mb-5">
              <div className="flex items-center gap-3 bg-gray-800/60 rounded-xl px-3 py-2.5 border border-amber-500/20">
                <Image className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white">Segunda foto en tu tarjeta</p>
                  <p className="text-[11px] text-gray-400">Muestra más de ti en el Baúl</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-gray-800/60 rounded-xl px-3 py-2.5 border border-amber-500/20">
                <Star className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white">Tarjeta destacada con borde dorado</p>
                  <p className="text-[11px] text-gray-400">Tu perfil brilla entre los demás</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-gray-800/60 rounded-xl px-3 py-2.5 border border-amber-500/20">
                <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white">Borde arcoíris en tu perfil</p>
                  <p className="text-[11px] text-gray-400">Efecto visual exclusivo para usuarios PRO</p>
                </div>
              </div>
            </div>

            {/* Advertencia 48h */}
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg px-3 py-2 mb-5">
              <p className="text-[11px] text-orange-200 text-center">
                ⚠️ Tu estado PRO se mantiene mientras estés activo.
                Si pasas más de <strong>48 horas sin conectarte</strong>, perderás el premio.
                ¡Sigue participando!
              </p>
            </div>

            {/* Botón */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/20"
            >
              ¡Genial, gracias!
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProCongratsModal;
