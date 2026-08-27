import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Camera, Send, X, ShieldAlert } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { createReport } from '@/services/reportService';
import { isSupabaseAuthEnabled } from '@/config/supabase';

const DenunciaModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const reportsReady = isSupabaseAuthEnabled();
  const [denunciaType, setDenunciaType] = useState('acoso');
  const [otraDenuncia, setOtraDenuncia] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [denunciado, setDenunciado] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileEvidence = () => {
    toast({
      title: '🚧 Función en desarrollo',
      description: 'Pronto podrás adjuntar fotos como evidencia. Por ahora, describe todo detalladamente.',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reportsReady) {
      toast({
        title: 'Denuncias pausadas',
        description: 'El almacenamiento seguro de denuncias aún no está configurado. No se envió nada.',
        variant: 'destructive',
      });
      return;
    }
    setIsSubmitting(true);

    try {
      // Guardar denuncia en Supabase
      await createReport({
        reporterUsername: user?.username || 'Anónimo',
        type: denunciaType,
        otherType: denunciaType === 'otras' ? otraDenuncia : null,
        description: descripcion,
        targetUsername: denunciado,
        reportedUserId: null,
        context: 'general',
        reason: denunciaType,
      });

      toast({
        title: '✅ Denuncia Enviada',
        description: 'Nuestro equipo revisará tu caso y te mantendremos al tanto. Gracias por tu ayuda.',
      });

      // Limpiar formulario
      setDescripcion('');
      setDenunciado('');
      setOtraDenuncia('');
      setDenunciaType('acoso');

      onClose();
    } catch (error) {
      console.error('Error al enviar denuncia:', error);
      toast({
        title: 'Error',
        description: 'No se pudo enviar la denuncia. Por favor intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#22203a] border-[#413e62] text-white max-w-lg rounded-2xl p-0">
        <DialogHeader className="p-6">
          <DialogTitle className="text-3xl font-extrabold flex items-center gap-3">
             <ShieldAlert className="w-8 h-8 text-red-500" />
            Formulario de Denuncia
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Ayúdanos a señalar conductas que deban revisarse. No compartas datos personales innecesarios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-hide">
          {!reportsReady && (
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-3 text-sm text-amber-100">
              Las denuncias están pausadas hasta configurar el almacenamiento Supabase. El formulario no enviará datos mientras tanto.
            </div>
          )}
          <div>
            <Label className="font-bold text-gray-200">Tipo de Denuncia</Label>
            <RadioGroup value={denunciaType} onValueChange={setDenunciaType} className="mt-2 grid grid-cols-2 gap-2">
              {['Acoso', 'Violencia', 'Drogas', 'Ventas', 'Otras'].map(type => (
                <Label key={type} className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all border-2 ${denunciaType === type.toLowerCase() ? 'border-red-500 bg-red-500/10' : 'border-transparent bg-[#2C2A4A] hover:bg-[#413e62]'}`}>
                  <RadioGroupItem value={type.toLowerCase()} id={type.toLowerCase()} />
                  {type}
                </Label>
              ))}
            </RadioGroup>
          </div>
          
          {denunciaType === 'otras' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
              <Label htmlFor="otra-denuncia" className="font-bold text-gray-200">Especificar "Otras"</Label>
              <Input id="otra-denuncia" value={otraDenuncia} onChange={(e) => setOtraDenuncia(e.target.value)} placeholder="Ej: Suplantación de identidad" className="mt-1 bg-[#2C2A4A] border-2 border-[#413e62] focus:border-red-500" required />
            </motion.div>
          )}

          <div>
            <Label htmlFor="descripcion" className="font-bold text-gray-200">¿Qué sucedió?</Label>
            <Textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describe la situación con el mayor detalle posible."
              className="mt-1 bg-[#2C2A4A] border-2 border-[#413e62] focus:border-red-500 min-h-[120px]"
              required
            />
          </div>

          <div>
            <Label htmlFor="denunciado" className="font-bold text-gray-200">¿Quién es la persona denunciada?</Label>
            <Input
              id="denunciado"
              value={denunciado}
              onChange={(e) => setDenunciado(e.target.value)}
              placeholder="Nombre de usuario, si lo sabes."
              className="mt-1 bg-[#2C2A4A] border-2 border-[#413e62] focus:border-red-500"
              required
            />
          </div>

          <div>
            <Label className="font-bold text-gray-200">Fotos de Evidencia</Label>
            <Button type="button" onClick={handleFileEvidence} variant="outline" className="w-full mt-1 border-dashed border-2 border-[#413e62] hover:border-red-500 hover:text-red-500">
              <Camera className="mr-2 h-5 w-5" />
              Adjuntar Capturas (Próximamente)
            </Button>
          </div>

          <Button type="submit" disabled={isSubmitting || !reportsReady} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 text-lg">
            <Send className="mr-2 h-5 w-5" />
            {isSubmitting ? 'Enviando...' : 'Enviar Denuncia'}
          </Button>
        </form>

        <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-4 right-4 z-50 text-gray-400 hover:text-white">
          <X className="w-6 h-6" />
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default DenunciaModal;
