import React, { useEffect, useRef } from 'react';
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
 * ✅ Auto-cierre después de 5 segundos
 */
export const RegistrationRequiredModal = ({ 
  open, 
  onClose, 
  onContinue = null,
  title = null,
  description = null,
  featureName = null // Nombre de la función (ej: "favoritos", "chat privado", "invitar")
}) => {
  const navigate = useNavigate();
  const autoCloseTimeoutRef = useRef(null);

  // Mensajes personalizados según la función
  const featureMessages = {
    'favoritos': {
      title: 'Guarda tus Contactos',
      description: 'Agrega personas a favoritos para encontrarlas rápido cada vez que entres.'
    },
    'chat privado': {
      title: 'Habla en Privado',
      description: 'Envía mensajes directos y conéctate 1 a 1 con quien quieras.'
    },
    'invitar': {
      title: 'Invita a un Chat',
      description: 'Crea conversaciones grupales privadas con las personas que elijas.'
    },
    'ver perfil': {
      title: 'Conoce a este Usuario',
      description: 'Mira su perfil completo, fotos y más información sobre él.'
    }
  };

  const featureInfo = featureName && featureMessages[featureName.toLowerCase()];
  const finalTitle = title || featureInfo?.title || 'Registro Requerido';
  const finalDescription = description || featureInfo?.description || 'Esta función requiere estar registrado para mantener un mejor control y seguridad.';

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

  const handleDialogClose = () => {
    // ✅ Limpiar timeout de auto-cierre si existe
    if (autoCloseTimeoutRef.current) {
      clearTimeout(autoCloseTimeoutRef.current);
      autoCloseTimeoutRef.current = null;
    }
    if (onClose) onClose();
  };

  // ✅ AUTO-CIERRE: Cerrar automáticamente después de 5 segundos
  useEffect(() => {
    if (open) {
      // Limpiar timeout anterior si existe
      if (autoCloseTimeoutRef.current) {
        clearTimeout(autoCloseTimeoutRef.current);
      }
      
      // Configurar auto-cierre después de 5 segundos
      autoCloseTimeoutRef.current = setTimeout(() => {
        handleDialogClose();
      }, 5000); // 5 segundos
    } else {
      // Si el modal se cierra manualmente, limpiar timeout
      if (autoCloseTimeoutRef.current) {
        clearTimeout(autoCloseTimeoutRef.current);
        autoCloseTimeoutRef.current = null;
      }
    }

    // Cleanup al desmontar
    return () => {
      if (autoCloseTimeoutRef.current) {
        clearTimeout(autoCloseTimeoutRef.current);
        autoCloseTimeoutRef.current = null;
      }
    };
  }, [open]);

  return (
    <Dialog 
      open={open} 
      onOpenChange={(isOpen) => {
        if (!isOpen) handleDialogClose();
      }}
    >
      <DialogContent 
        className="sm:max-w-[500px] neon-border-card text-white p-0"
        onInteractOutside={() => {
          // ✅ Permitir cerrar haciendo clic fuera del modal
          handleDialogClose();
        }}
        onEscapeKeyDown={handleDialogClose}
        onPointerDownOutside={() => {
          // ✅ Permitir cerrar haciendo clic fuera del modal (móvil)
          handleDialogClose();
        }}
      >
        <button 
          onClick={handleDialogClose}
          className="absolute right-4 top-4 p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors z-50"
          aria-label="Cerrar"
        >
          <X className="h-6 w-6" />
        </button>
        <div className="glass-effect rounded-3xl p-6 flex flex-col w-full overflow-y-auto scrollbar-hide max-h-[90vh]">
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
                {finalTitle}
              </span>
            </DialogTitle>

            <DialogDescription className="text-center text-gray-300 text-base leading-relaxed">
              {finalDescription}
              <span className="text-sm text-gray-400 block mt-2">
                Registro gratis · Solo email · 30 segundos
              </span>
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
                  Registrarse
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
                Ahora no
              </Button>
            </motion.div>

            {/* Botón de cierre: Despedir */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Button
                onClick={handleDialogClose}
                variant="ghost"
                className="w-full text-gray-400 hover:text-white font-medium py-4 text-sm rounded-xl hover:bg-gray-800/30 transition-all"
              >
                Cerrar
              </Button>
            </motion.div>

            {/* Info adicional */}
            <div className="bg-purple-900/20 rounded-lg p-3 border border-purple-500/30 mt-2">
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
