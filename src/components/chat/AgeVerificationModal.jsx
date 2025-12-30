import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * Modal simple para verificar mayor¡a de edad antes de entrar al chat.
 */
const AgeVerificationModal = ({ isOpen, onConfirm }) => {
  const [age, setAge] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    const parsedAge = parseInt(age, 10);

    if (Number.isNaN(parsedAge)) {
      setError('Ingresa tu edad en n£meros.');
      return;
    }

    if (parsedAge < 18) {
      setError('Debes ser mayor de 18 a¤os para usar este chat.');
      return;
    }

    setError('');
    onConfirm(parsedAge);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}} modal>
      <DialogContent className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white border border-fuchsia-500/30 shadow-2xl max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-fuchsia-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Confirma tu edad
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-200">
            Este chat es solo para mayores de 18. Confirma tu edad para continuar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-100">
            ¿Cu ntos a¤os tienes?
          </label>
          <Input
            type="number"
            min="0"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="Ej: 24"
            className="bg-slate-900 border-slate-700 text-white"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <p className="text-xs text-slate-300">
            Al continuar confirmas que tienes 18 a¤os o m s y aceptas las normas del chat.
          </p>
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
