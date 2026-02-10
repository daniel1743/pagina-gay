
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
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { createReport } from '@/services/reportService';
import { useAuth } from '@/contexts/AuthContext';

const ReportModal = ({ target, onClose, isGuest }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reason, setReason] = useState('');

  const reasons = [
    'Acoso o intimidación',
    'Contenido inapropiado',
    'Spam o publicidad',
    'Perfil falso',
    'Lenguaje ofensivo',
    'Otro',
  ];

  const reasonKeyMap = {
    'Acoso o intimidación': 'harassment',
    'Contenido inapropiado': 'inappropriate_content',
    'Spam o publicidad': 'spam',
    'Perfil falso': 'fake_account',
    'Lenguaje ofensivo': 'profanity',
    'Otro': 'other',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isGuest) {
      toast({
          title: "¡Únete para moderar!",
          description: "Para reportar, necesitas crear una cuenta o iniciar sesión.",
          variant: "destructive",
      });
      setTimeout(() => navigate('/auth'), 2000);
      return;
    }

    if (!reason) {
      toast({
        title: "Selecciona un motivo",
        description: "Por favor, elige una razón para el reporte.",
        variant: "destructive",
      });
      return;
    }

    const reasonKey = reasonKeyMap[reason] || 'other';
    const context = target?.context || 'chat';
    const reportedUserId = target?.userId || target?.targetId || null;
    const targetUsername = target?.username || target?.targetUsername || 'Desconocido';
    const messageId = target?.messageId || target?.id || target?._realId || null;

    try {
      await createReport({
        reporterUsername: user?.username || 'Anónimo',
        reportedUserId,
        reportedUsername: targetUsername,
        context,
        messageId: target?.type === 'message' ? messageId : null,
        reason: reasonKey,
        type: reasonKey,
        description: `Reporte (${context}): ${reason}`,
        targetUsername,
        targetId: reportedUserId || null,
        roomId: target?.roomId || null,
      });

      toast({
        title: "Reporte enviado ✅",
        description: "Nuestro equipo lo revisará. Gracias por ayudarnos a mantener Chactivo seguro.",
      });
      onClose();
    } catch (error) {
      console.error('Error creando reporte:', error);
      toast({
        title: "No pudimos enviar tu reporte",
        description: "Intenta de nuevo en un momento.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-[#22203a] border-[#413e62] text-white max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-gray-100">Reportar {target.type === 'message' ? 'Mensaje' : 'Usuario'}</DialogTitle>
          <DialogDescription className="text-gray-400">
            Tu reporte es anónimo y nos ayuda a mantener la comunidad segura.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label className="text-gray-300 mb-3 block">Motivo del reporte</Label>
            <div className="space-y-2">
              {reasons.map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-[#413e62] transition-colors border ${reason === r ? 'border-[#E4007C]' : 'border-transparent'}`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reason === r}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-4 h-4 accent-[#E4007C] bg-gray-700 border-gray-600"
                  />
                  <span className="text-gray-200">{r}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-[#413e62] text-gray-300 hover:bg-[#413e62] hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              Enviar Reporte
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReportModal;
