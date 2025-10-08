import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Crown, LogIn } from 'lucide-react';

const VerificationModal = ({ onClose }) => {
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    onClose();
    navigate(path);
  };

  return (
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
            Has alcanzado el límite de mensajes para invitados. Inicia sesión o regístrate para chatear sin límites y acceder a más funciones.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 mt-4">
          <Button
            onClick={() => handleNavigate('/auth')}
            className="w-full cyan-gradient text-black font-bold py-6 text-lg"
          >
            <LogIn className="w-5 h-5 mr-2" />
            Iniciar Sesión / Registrarse
          </Button>
          <Button
            onClick={() => handleNavigate('/premium')}
            variant="outline"
            className="w-full border-2 border-[#E4007C] text-[#E4007C] font-bold py-6 text-lg hover:bg-[#E4007C]/10 hover:text-[#E4007C]"
          >
            <Crown className="w-5 h-5 mr-2" />
            Hazte Premium
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VerificationModal;