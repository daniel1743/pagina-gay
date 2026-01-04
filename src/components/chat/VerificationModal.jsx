import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PartyPopper, Clock, LogIn, UserPlus, Sparkles } from 'lucide-react';
import QuickSignupModal from '@/components/auth/QuickSignupModal';
import { getTotalEngagementTime } from '@/services/engagementService';
import { motion } from 'framer-motion';

const VerificationModal = ({ onClose, engagementTime }) => {
  const navigate = useNavigate();
  const [showQuickSignup, setShowQuickSignup] = useState(false);

  const handleNavigate = (path) => {
    onClose();
    navigate(path);
  };

  const handleQuickSignup = () => {
    setShowQuickSignup(true);
  };

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="bg-gradient-to-br from-[#22203a] via-[#2a2449] to-[#22203a] border-[#413e62] text-white max-w-md rounded-2xl overflow-hidden">
          {/* Confetti effect */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  background: ['#E4007C', '#00D9FF', '#FFD700', '#FF1493'][i % 4],
                  left: `${Math.random() * 100}%`,
                  top: '-10px',
                }}
                animate={{
                  y: [0, 400],
                  x: [0, (Math.random() - 0.5) * 100],
                  rotate: [0, 360],
                  opacity: [1, 0],
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  delay: Math.random() * 0.5,
                  ease: 'easeOut',
                }}
              />
            ))}
          </div>

          <DialogHeader className="items-center text-center relative z-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.6 }}
              className="w-20 h-20 bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-2xl"
            >
              <PartyPopper className="w-10 h-10 text-white" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <DialogTitle className="text-white text-3xl font-extrabold mb-2 flex items-center justify-center gap-2">
                <Sparkles className="w-6 h-6 text-yellow-400" />
                ¡Uff, Qué Enganche!
                <Sparkles className="w-6 h-6 text-yellow-400" />
              </DialogTitle>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <DialogDescription className="text-gray-200 pt-3 text-lg leading-relaxed">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Clock className="w-5 h-5 text-cyan-400" />
                  <span className="font-bold text-cyan-400 text-xl">
                    ¡Ya llevas {engagementTime || '1 hora'} en nuestro sitio!
                  </span>
                </div>
                <p className="text-base">
                  Eso significa que <span className="font-bold text-yellow-400">te gusta estar aquí</span>.
                  <br />
                  <span className="text-sm text-gray-300 mt-2 block">
                    Regístrate en <span className="font-bold">30 segundos</span> y continúa sin límites.
                    ¡Es gratis siempre!
                  </span>
                </p>
              </DialogDescription>
            </motion.div>
          </DialogHeader>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col gap-3 mt-6 relative z-10"
          >
            <Button
              onClick={handleQuickSignup}
              className="w-full bg-gradient-to-r from-yellow-500 via-pink-500 to-purple-600 hover:from-yellow-400 hover:via-pink-400 hover:to-purple-500 text-white font-bold py-6 text-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Registro Rápido (30s) - ¡Gratis!
            </Button>
            <Button
              onClick={() => handleNavigate('/auth')}
              variant="outline"
              className="w-full border-2 border-cyan-400/70 text-cyan-300 font-semibold py-4 hover:bg-cyan-500/20 transition-all"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Ya tengo cuenta
            </Button>

            <p className="text-xs text-center text-gray-400 mt-2">
              💯 100% gratis • 🔒 Totalmente anónimo • ⚡ Sin email requerido
            </p>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Modal de registro rápido */}
      {showQuickSignup && (
        <QuickSignupModal
          isOpen={showQuickSignup}
          onClose={() => {
            setShowQuickSignup(false);
            onClose();
          }}
          redirectTo="/chat/principal"
        />
      )}
    </>
  );
};

export default VerificationModal;