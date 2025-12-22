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
import { ShieldCheck, Crown, LogIn, UserPlus } from 'lucide-react';
import QuickSignupModal from '@/components/auth/QuickSignupModal';

const VerificationModal = ({ onClose }) => {
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
        <DialogContent className="bg-[#22203a] border-[#413e62] text-white max-w-md rounded-2xl">
          <DialogHeader className="items-center text-center">
            <div className="w-16 h-16 magenta-gradient rounded-full flex items-center justify-center mb-4">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-gray-100 text-2xl">
              ¡Continúa la conversación!
            </DialogTitle>
            <DialogDescription className="text-gray-300 pt-2">
              Has alcanzado el límite de 10 mensajes gratuitos. Regístrate en 30 segundos para chatear ilimitado.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button
              onClick={handleQuickSignup}
              className="w-full bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600 text-white font-bold py-6 text-lg"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Registro Rápido (30s)
            </Button>
            <Button
              onClick={() => handleNavigate('/auth')}
              variant="outline"
              className="w-full border-2 border-cyan-500/50 text-cyan-400 font-semibold py-4 hover:bg-cyan-500/10"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Ya tengo cuenta
            </Button>
          </div>
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
          redirectTo="/chat/conversas-libres"
        />
      )}
    </>
  );
};

export default VerificationModal;