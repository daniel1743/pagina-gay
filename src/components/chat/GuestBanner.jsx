import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';

const GuestBanner = () => {
  const navigate = useNavigate();

  const handleRegister = () => {
    navigate('/auth');
  };

  return (
    <div className="bg-blue-900/50 border-t border-b border-blue-800 text-white p-3 flex items-center justify-between gap-4">
      <div className="flex items-center">
        <Info className="w-6 h-6 mr-3 text-cyan-400 flex-shrink-0" />
        <p className="text-sm">
          Estás chateando como invitado. 
          <span className="hidden sm:inline"> ¡Regístrate gratis para guardar tu perfil y acceder a todas las funciones!</span>
        </p>
      </div>
      <Button
        onClick={handleRegister}
        size="sm"
        className="bg-cyan-400 hover:bg-cyan-500 text-slate-900 font-bold flex-shrink-0"
      >
        Registrarse
      </Button>
    </div>
  );
};

export default GuestBanner;
