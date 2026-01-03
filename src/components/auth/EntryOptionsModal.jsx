import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { User, Ghost, LogIn } from 'lucide-react';

export const EntryOptionsModal = ({ open, onClose, chatRoomId, onContinueWithoutRegister }) => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/auth', { state: { redirectTo: `/chat/${chatRoomId}` } });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
            ¿Cómo quieres entrar?
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Opción Invitado */}
          <button
            onClick={onContinueWithoutRegister}
            className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-500/30 hover:border-purple-500/60 hover:scale-[1.02] transition-all group text-left"
          >
            <div className="bg-purple-500/20 p-3 rounded-full group-hover:bg-purple-500/30">
              <Ghost className="w-6 h-6 text-purple-300" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Entrar como Invitado</h3>
              <p className="text-sm text-gray-400">Rápido, anónimo, sin contraseña.</p>
            </div>
          </button>

          {/* Opción Login */}
          <button
            onClick={handleLogin}
            className="flex items-center gap-4 p-4 rounded-xl bg-gray-800/50 border border-gray-700 hover:border-gray-500 hover:bg-gray-800 transition-all text-left"
          >
            <div className="bg-gray-700 p-3 rounded-full">
              <LogIn className="w-6 h-6 text-gray-300" />
            </div>
            <div>
              <h3 className="font-bold text-gray-200 text-lg">Tengo Cuenta</h3>
              <p className="text-sm text-gray-500">Inicia sesión para usar tu perfil.</p>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
