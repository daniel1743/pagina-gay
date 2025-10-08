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

const ROLES = ['Activo', 'Pasivo', 'Versátil', 'Trans'];
const INTERESTS = ['Amistad', 'Citas', 'Relación Seria', 'Diversión', 'Networking'];

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
      <DialogContent className="bg-[#22203a] border-[#413e62] text-white max-w-lg rounded-2xl p-0">
        <DialogHeader className="p-6">
          <DialogTitle className="text-3xl font-extrabold">Editar Perfil</DialogTitle>
          <DialogDescription className="text-gray-300">
            Personaliza cómo te ven los demás en Chactivo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-hide">
          <div>
            <Label htmlFor="description" className="font-bold text-gray-200">Tu Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Una breve descripción sobre ti..."
              className="mt-1 bg-[#2C2A4A] border-2 border-[#413e62] focus:border-[#E4007C] min-h-[100px]"
            />
          </div>

          <div>
            <Label className="font-bold text-gray-200">Tu Rol</Label>
            <RadioGroup value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })} className="mt-2 grid grid-cols-2 gap-2">
              {ROLES.map(role => (
                <Label key={role} className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all border-2 ${formData.role === role ? 'border-[#E4007C] bg-[#E4007C]/10' : 'border-transparent bg-[#2C2A4A] hover:bg-[#413e62]'}`}>
                  <RadioGroupItem value={role} id={role} />
                  {role}
                </Label>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label className="font-bold text-gray-200">Tus Intereses</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {INTERESTS.map(interest => (
                <Button
                  key={interest}
                  type="button"
                  variant="outline"
                  onClick={() => handleInterestChange(interest)}
                  className={`transition-all ${formData.interests.includes(interest) ? 'bg-[#00FFFF] text-black border-[#00FFFF]' : 'bg-[#2C2A4A] border-[#413e62] text-white hover:bg-[#413e62]'}`}
                >
                  {interest}
                </Button>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full magenta-gradient text-white font-bold py-3 text-lg">
            <Save className="mr-2 h-5 w-5" />
            Guardar Cambios
          </Button>
        </form>

        <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X className="w-6 h-6" />
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileModal;