import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Shield, UserPlus, ArrowRight, Zap, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Modal que aparece al presionar "ENTRAR GRATIS"
 * Explica que se puede usar sin registro pero ofrece beneficios del registro
 */
export const EntryOptionsModal = ({
  open,
  onClose,
  chatRoomId = 'principal', // Sala por defecto (principal para Chile, es-main para España, etc.)
  onContinueWithoutRegister // Callback del padre para abrir GuestUsernameModal
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleContinueWithoutRegister = () => {
    // Si se proporciona un callback del padre, usarlo
    if (onContinueWithoutRegister) {
      onContinueWithoutRegister();
      return;
    }

    // Fallback: comportamiento por defecto
    onClose();
    // Si ya está logueado, ir directo al chat
    if (user && !user.isGuest) {
      navigate(`/chat/${chatRoomId}`);
    } else {
      // Redirigir al chat que abrirá el modal automáticamente
      navigate(`/chat/${chatRoomId}`);
    }
  };

  const handleRegister = () => {
    onClose();
    // Redirigir a registro con redirect para volver después
    const currentPath = window.location.pathname;
    navigate(`/auth?redirect=${encodeURIComponent(`/chat/${chatRoomId}`)}`);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px] neon-border-card text-white p-0 h-[90vh] max-h-[600px] flex flex-col overflow-hidden">
        <div className="glass-effect rounded-3xl p-6 flex-1 overflow-y-auto">
          <DialogHeader>
            {/* Icono con efecto */}
            <div className="flex items-center justify-center mb-4">
              <motion.div
                className="relative"
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <div className="rounded-full p-4 bg-purple-500/20 border-2 border-purple-400/50">
                  <Shield className="h-10 w-10 text-purple-400" />
                </div>
              </motion.div>
            </div>

            <DialogTitle className="text-2xl sm:text-3xl font-bold text-center mb-3">
              <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Chactivo valora tu privacidad
              </span>
            </DialogTitle>

            <DialogDescription className="text-center text-gray-300 text-base leading-relaxed">
              Puedes usar <span className="font-semibold text-purple-300">Chactivo sin registro</span> y mantener tu anonimato completo.
              {' '}
              Sin embargo, si te <span className="font-semibold text-cyan-300">registras tendrás más beneficios</span>:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-6">
            {/* Beneficios del registro */}
            <div className="bg-purple-900/20 rounded-lg p-4 border border-purple-500/30">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-200">
                  <CheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span>Verificarte y obtener badge de verificación</span>
                </div>
                <div className="flex items-center gap-2 text-gray-200">
                  <CheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span>Crear y administrar tus propias salas</span>
                </div>
                <div className="flex items-center gap-2 text-gray-200">
                  <CheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span>Chats privados 1 a 1</span>
                </div>
                <div className="flex items-center gap-2 text-gray-200">
                  <CheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span>50+ avatares personalizados</span>
                </div>
                <div className="flex items-center gap-2 text-gray-200">
                  <CheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span>Acceso ilimitado sin expiración</span>
                </div>
              </div>
            </div>

            {/* Botón principal: Continuar sin registro */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={handleContinueWithoutRegister}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-6 text-lg rounded-xl shadow-xl hover:shadow-purple-500/50 transition-all relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Zap className="h-5 w-5" />
                  Continuar sin Registro
                  <ArrowRight className="h-5 w-5" />
                </span>
              </Button>
            </motion.div>

            {/* Botón secundario: Registrar */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Button
                onClick={handleRegister}
                variant="outline"
                className="w-full border-2 border-purple-500/50 hover:border-purple-400 text-white hover:text-white font-semibold py-5 text-base rounded-xl bg-purple-900/30 hover:bg-purple-800/40 transition-all"
              >
                <span className="flex items-center justify-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Registrar
                </span>
              </Button>
            </motion.div>

            {/* Info adicional */}
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50 mt-4">
              <p className="text-xs text-gray-400 text-center">
                💡 El registro es <span className="text-purple-300 font-semibold">gratis y rápido</span>. Solo necesitas un email.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EntryOptionsModal;

