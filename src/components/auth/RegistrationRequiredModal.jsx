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
import { Shield, UserPlus, ArrowRight, X } from 'lucide-react';

/**
 * Modal que aparece cuando el usuario intenta acceder a funciones que requieren registro
 * Explica que Chactivo mantiene el anonimato pero algunas funciones requieren registro
 */
export const RegistrationRequiredModal = ({ 
  open, 
  onClose, 
  onContinue = null,
  title = "Registro Requerido",
  description = "Esta función requiere estar registrado para mantener un mejor control y seguridad."
}) => {
  const navigate = useNavigate();

  const handleContinueToRegister = () => {
    onClose();
    if (onContinue) {
      onContinue();
    } else {
      // Redirigir a registro con redirect para volver después
      const currentPath = window.location.pathname;
      navigate(`/auth?redirect=${encodeURIComponent(currentPath)}`);
    }
  };

  const handleContinueWithoutRegister = () => {
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] neon-border-card text-white overflow-hidden p-0">
        <div className="glass-effect rounded-3xl p-6">
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
                {title}
              </span>
            </DialogTitle>

            <DialogDescription className="text-center text-gray-300 text-base leading-relaxed space-y-3">
              <div>
                <span className="font-semibold text-purple-300">Chactivo se destaca por mantener el anonimato</span> y respetar tu privacidad.
              </div>
              <div>
                Sin embargo, para disfrutar de <span className="font-semibold text-cyan-300">algunas funciones especiales</span>, es necesario estar registrado para llevar un mejor control y garantizar la seguridad de todos.
              </div>
              {description && (
                <div className="text-sm text-gray-400 italic">
                  {description}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-6">
            {/* Botón principal: Continuar a registrar */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={handleContinueToRegister}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-6 text-lg rounded-xl shadow-xl hover:shadow-purple-500/50 transition-all relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Continuar a Registrar
                  <ArrowRight className="h-5 w-5" />
                </span>
              </Button>
            </motion.div>

            {/* Botón secundario: Seguir sin registro */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Button
                onClick={handleContinueWithoutRegister}
                variant="outline"
                className="w-full border-2 border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white font-semibold py-5 text-base rounded-xl bg-gray-800/50 hover:bg-gray-700/50 transition-all"
              >
                Seguir sin Registro
              </Button>
            </motion.div>

            {/* Info adicional */}
            <div className="bg-purple-900/20 rounded-lg p-3 border border-purple-500/30 mt-4">
              <p className="text-xs text-gray-300 text-center">
                💡 El registro es <span className="text-purple-300 font-semibold">gratis y rápido</span>. Solo necesitas un email.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RegistrationRequiredModal;

