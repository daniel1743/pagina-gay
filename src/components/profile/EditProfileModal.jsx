import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { X, Save } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const ROLES = ['Activo', 'Pasivo', 'Versátil', 'Trans', 'No Binario', 'Fluido', 'Otro'];
const INTERESTS = [
  'Amistad',
  'Citas',
  'Relación Seria',
  'Diversión',
  'Networking',
  'Deportes',
  'Música',
  'Arte y Cultura',
  'Viajes',
  'Gastronomía',
  'Activismo LGBT+',
  'Cine y Series',
  'Videojuegos',
  'Lectura',
  'Fitness',
  'Naturaleza',
  'Fiesta',
  'Teatro',
  'Fotografía',
  'Moda'
];

const EditProfileModal = ({ isOpen, onClose }) => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    description: user.description || '',
    role: user.role || '',
    interests: user.interests || [],
  });

  const handleInterestChange = (interest) => {
    setFormData(prev => {
      const newInterests = prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest];
      return { ...prev, interests: newInterests };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfile(formData);
    toast({
      title: '✅ Perfil Actualizado',
      description: 'Tus cambios se han guardado correctamente.',
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-background border-border max-w-lg rounded-2xl p-0">
        <DialogHeader className="p-6">
          <DialogTitle className="text-3xl font-extrabold text-foreground">Editar Perfil</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Personaliza cómo te ven los demás en Chactivo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-hide">
          <div>
            <Label htmlFor="description" className="font-bold text-foreground">Tu Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Una breve descripción sobre ti..."
              className="mt-1 bg-background border-2 border-border focus:border-primary min-h-[100px] text-foreground"
            />
          </div>

          <div>
            <Label className="font-bold text-foreground">Tu Rol</Label>
            <RadioGroup value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })} className="mt-2 grid grid-cols-2 gap-2">
              {ROLES.map(role => (
                <Label key={role} className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all border-2 ${formData.role === role ? 'border-primary bg-primary/10' : 'border-transparent bg-accent hover:bg-accent/80'}`}>
                  <RadioGroupItem value={role} id={role} />
                  <span className="text-foreground">{role}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label className="font-bold text-foreground">Tus Intereses (máximo 5)</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {INTERESTS.map(interest => (
                <Button
                  key={interest}
                  type="button"
                  variant="outline"
                  onClick={() => handleInterestChange(interest)}
                  disabled={!formData.interests.includes(interest) && formData.interests.length >= 5}
                  className={`transition-all ${formData.interests.includes(interest) ? 'bg-cyan-500 text-white border-cyan-500 hover:bg-cyan-600' : 'bg-accent border-border text-foreground hover:bg-accent/80'}`}
                >
                  {interest}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {formData.interests.length}/5 intereses seleccionados
            </p>
          </div>

          <Button type="submit" className="w-full magenta-gradient text-white font-bold py-3 text-lg">
            <Save className="mr-2 h-5 w-5" />
            Guardar Cambios
          </Button>
        </form>

        <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-4 right-4 z-50 text-muted-foreground hover:text-foreground">
          <X className="w-6 h-6" />
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileModal;