import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check } from 'lucide-react';

// 4 avatares predefinidos con descripciones
const AVATAR_OPTIONS = [
  {
    id: 'avataaars',
    url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=avatar1',
    name: 'Clásico',
    description: 'Estilo clásico y elegante'
  },
  {
    id: 'bottts',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=avatar2',
    name: 'Robot',
    description: 'Robot amigable y moderno'
  },
  {
    id: 'pixel-art',
    url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=avatar3',
    name: 'Retro',
    description: 'Estilo retro y divertido'
  },
  {
    id: 'identicon',
    url: 'https://api.dicebear.com/7.x/identicon/svg?seed=avatar4',
    name: 'Geométrico',
    description: 'Diseño geométrico único'
  }
];

/**
 * Modal para verificar mayoría de edad, elegir nombre de usuario y avatar para usuarios anónimos
 */
const AgeVerificationModal = ({ isOpen, onConfirm }) => {
  const [age, setAge] = useState('');
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [error, setError] = useState('');

  const handleConfirm = () => {
    // Validar edad
    const parsedAge = parseInt(age, 10);
    if (Number.isNaN(parsedAge)) {
      setError('Ingresa tu edad en números.');
      return;
    }
    if (parsedAge < 18) {
      setError('Debes ser mayor de 18 años para usar este chat.');
      return;
    }

    // Validar nombre de usuario
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError('Ingresa un nombre de usuario.');
      return;
    }
    if (trimmedUsername.length < 3) {
      setError('El nombre de usuario debe tener al menos 3 caracteres.');
      return;
    }
    if (trimmedUsername.length > 20) {
      setError('El nombre de usuario no puede tener más de 20 caracteres.');
      return;
    }

    // Validar avatar
    if (!selectedAvatar) {
      setError('Selecciona un avatar.');
      return;
    }

    setError('');
    onConfirm(parsedAge, trimmedUsername, selectedAvatar);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}} modal>
      <DialogContent className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white border border-fuchsia-500/30 shadow-2xl max-w-2xl">
        <div className="overflow-y-auto scrollbar-hide max-h-[calc(90vh-8rem)]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Completa tu perfil
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-200">
              Confirma tu edad, elige un nombre y un avatar para continuar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
          {/* Edad */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-100">
              ¿Cuántos años tienes? *
            </label>
            <Input
              type="number"
              min="0"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Ej: 24"
              className="bg-slate-900 border-slate-700 text-white"
            />
          </div>

          {/* Nombre de usuario */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-100">
              Nombre de usuario *
            </label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Elige un nombre único"
              maxLength={20}
              className="bg-slate-900 border-slate-700 text-white"
            />
            <p className="text-xs text-slate-400">
              Entre 3 y 20 caracteres. Este será tu nombre en el chat.
            </p>
          </div>

          {/* Selección de avatar */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-100">
              Elige tu avatar *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {AVATAR_OPTIONS.map((avatar) => (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`relative p-4 rounded-lg border-2 transition-all ${
                    selectedAvatar?.id === avatar.id
                      ? 'border-fuchsia-500 bg-fuchsia-500/10 scale-105'
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800'
                  }`}
                >
                  {selectedAvatar?.id === avatar.id && (
                    <div className="absolute top-2 right-2 bg-fuchsia-500 rounded-full p-1">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="flex flex-col items-center space-y-2">
                    <img
                      src={avatar.url}
                      alt={avatar.name}
                      className="w-20 h-20 rounded-full bg-slate-700 p-2"
                    />
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-100">{avatar.name}</p>
                      <p className="text-xs text-slate-400">{avatar.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <p className="text-xs text-slate-400">
            Al continuar confirmas que tienes 18 años o más y aceptas las normas del chat.
          </p>
          </div>
        </div>

        <DialogFooter className="sm:justify-end">
          <Button
            onClick={handleConfirm}
            className="w-full sm:w-auto bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-500 text-white hover:from-fuchsia-600 hover:via-purple-600 hover:to-cyan-600"
          >
            Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AgeVerificationModal;
