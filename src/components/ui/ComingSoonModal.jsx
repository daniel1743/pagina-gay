import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Rocket, Zap, X } from 'lucide-react';

const ComingSoonModal = ({ isOpen, onClose, feature = "esta funcionalidad", description }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="bg-gradient-to-br from-[#2C2A4A] via-[#3d3a5c] to-[#2C2A4A] border-2 border-[#E4007C]/30 text-white max-w-md max-h-[90vh] my-4 rounded-3xl p-0 overflow-hidden flex flex-col">
            {/* Fondo animado con burbujas */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div
                className="absolute w-32 h-32 bg-[#E4007C]/20 rounded-full blur-3xl"
                animate={{
                  x: [0, 100, 0],
                  y: [0, -50, 0],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                style={{ top: '10%', left: '10%' }}
              />
              <motion.div
                className="absolute w-40 h-40 bg-cyan-400/10 rounded-full blur-3xl"
                animate={{
                  x: [0, -80, 0],
                  y: [0, 60, 0],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                style={{ bottom: '10%', right: '10%' }}
              />
            </div>

            {/* Botón cerrar */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 text-gray-400 hover:text-white transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Contenido con scroll */}
            <div className="relative z-10 p-8 pt-12 overflow-y-auto flex-1 min-h-0">
              {/* Icono principal con animación */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 15, stiffness: 200 }}
                className="flex justify-center mb-6"
              >
                <div className="relative">
                  <motion.div
                    animate={{
                      rotate: 360,
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-[#E4007C] via-cyan-400 to-[#E4007C] rounded-full blur-xl opacity-50"
                    style={{ width: '120px', height: '120px', margin: '-10px' }}
                  />
                  <div className="relative w-24 h-24 bg-gradient-to-br from-[#E4007C] to-[#a3005a] rounded-full flex items-center justify-center shadow-2xl">
                    <Rocket className="w-12 h-12 text-white" />
                  </div>
                </div>
              </motion.div>

              {/* Título con animación */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-extrabold text-center mb-4 bg-gradient-to-r from-[#E4007C] via-cyan-400 to-[#E4007C] bg-clip-text text-transparent"
              >
                ¡Próximamente!
              </motion.h2>

              {/* Descripción */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center mb-6"
              >
                <p className="text-gray-300 leading-relaxed mb-4">
                  Estamos trabajando arduamente en <span className="font-bold text-white">{feature}</span>.
                </p>
                {description && (
                  <p className="text-sm text-gray-400 italic">
                    {description}
                  </p>
                )}
              </motion.div>

              {/* Features icons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-3 gap-4 mb-6"
              >
                <div className="text-center p-3 bg-white/5 rounded-lg backdrop-blur-sm border border-white/10">
                  <Sparkles className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-300">Innovadora</p>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-lg backdrop-blur-sm border border-white/10">
                  <Zap className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-300">Potente</p>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-lg backdrop-blur-sm border border-white/10">
                  <Rocket className="w-6 h-6 text-[#E4007C] mx-auto mb-2" />
                  <p className="text-xs text-gray-300">En camino</p>
                </div>
              </motion.div>

              {/* Timeline */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white/5 rounded-xl p-4 backdrop-blur-sm border border-white/10 mb-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <p className="text-sm text-gray-300">
                    <span className="font-bold text-white">En desarrollo activo</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                  <p className="text-sm text-gray-300">
                    Nuestro equipo está dedicado a traerte la mejor experiencia
                  </p>
                </div>
              </motion.div>

              {/* Call to action */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Button
                  onClick={onClose}
                  className="w-full bg-gradient-to-r from-[#E4007C] to-[#a3005a] hover:from-[#ff0087] hover:to-[#c0006b] text-white font-bold py-3 rounded-xl shadow-lg transition-all hover:scale-105"
                >
                  ¡Entendido! 🚀
                </Button>
                <p className="text-center text-xs text-gray-400 mt-3">
                  Te notificaremos cuando esté lista
                </p>
              </motion.div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default ComingSoonModal;
