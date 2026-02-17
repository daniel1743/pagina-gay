import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { X, Save, Loader2, Eye, EyeOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { checkUsernameAvailability } from '@/services/userService';

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
  const isProfileRoleOption = (value) => ROLES.includes(value);
  const getInitialProfileRole = () => {
    if (isProfileRoleOption(user?.profileRole)) return user.profileRole;
    if (isProfileRoleOption(user?.role)) return user.role;
    return '';
  };
  const [formData, setFormData] = useState({
    username: user?.username || '',
    description: user?.description || '',
    estado: user?.estado || '',
    profileRole: getInitialProfileRole(),
    interests: user?.interests || [],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [usernameError, setUsernameError] = useState('');

  // Resetear form cuando se abre el modal
  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        username: user.username || '',
        description: user.description || '',
        estado: user.estado || '',
        profileRole: getInitialProfileRole(),
        interests: user.interests || [],
        profileVisible: user.profileVisible !== false,
      });
      setUsernameError('');
    }
  }, [isOpen, user]);

  const handleInterestChange = (interest) => {
    setFormData(prev => {
      const newInterests = prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest];
      return { ...prev, interests: newInterests };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setUsernameError('');

    try {
      const newUsername = formData.username.trim();

      // Validar nombre
      if (!newUsername || newUsername.length < 2) {
        setUsernameError('El nombre debe tener al menos 2 caracteres.');
        setIsSaving(false);
        return;
      }
      if (newUsername.length > 30) {
        setUsernameError('El nombre no puede tener más de 30 caracteres.');
        setIsSaving(false);
        return;
      }

      // Si el nombre cambió, verificar disponibilidad
      if (newUsername.toLowerCase() !== (user?.username || '').toLowerCase()) {
        const available = await checkUsernameAvailability(newUsername, user?.id);
        if (!available) {
          setUsernameError('Este nombre ya está en uso. Elige otro.');
          setIsSaving(false);
          return;
        }
      }

      // Validar estado (máximo 100 caracteres)
      const estado = (formData.estado || '').trim().slice(0, 100);

      await updateProfile({
        username: newUsername,
        description: formData.description,
        estado,
        profileRole: formData.profileRole,
        interests: formData.interests,
        profileVisible: formData.profileVisible,
      });

      toast({
        title: 'Perfil Actualizado',
        description: 'Tus cambios se han guardado correctamente.',
      });
      onClose();
    } catch (error) {
      console.error('Error guardando perfil:', error);
      toast({
        title: 'Error',
        description: error?.message || 'No se pudo guardar. Intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
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
          {/* Visibilidad del perfil */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-accent/50 border border-border">
            <div className="flex items-center gap-3">
              {formData.profileVisible ? (
                <Eye className="w-5 h-5 text-cyan-500" />
              ) : (
                <EyeOff className="w-5 h-5 text-muted-foreground" />
              )}
              <div>
                <Label className="font-bold text-foreground">Mi perfil visible</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Otros pueden ver tu foto, rol, intereses y descripción
                </p>
              </div>
            </div>
            <Switch
              checked={formData.profileVisible}
              onCheckedChange={(checked) => setFormData({ ...formData, profileVisible: checked })}
            />
          </div>

          {/* Cambiar nombre */}
          <div>
            <Label htmlFor="username" className="font-bold text-foreground">Tu Nombre</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => {
                setFormData({ ...formData, username: e.target.value });
                setUsernameError('');
              }}
              placeholder="Tu nombre en Chactivo"
              maxLength={30}
              className="mt-1 bg-background border-2 border-border focus:border-primary text-foreground"
            />
            {usernameError && (
              <p className="text-xs text-red-400 mt-1">{usernameError}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {formData.username.length}/30 caracteres
            </p>
          </div>

          {/* Estado */}
          <div>
            <Label htmlFor="estado" className="font-bold text-foreground">Tu Estado</Label>
            <Input
              id="estado"
              value={formData.estado}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
              placeholder="Ej: Buscando pasarla bien, Quiero conocer gente..."
              maxLength={100}
              className="mt-1 bg-background border-2 border-border focus:border-primary text-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {(formData.estado || '').length}/100 caracteres — visible en tu perfil
            </p>
          </div>

          {/* Descripción */}
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
            <RadioGroup value={formData.profileRole} onValueChange={(value) => setFormData({ ...formData, profileRole: value })} className="mt-2 grid grid-cols-2 gap-2">
              {ROLES.map(role => (
                <Label key={role} className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all border-2 ${formData.profileRole === role ? 'border-primary bg-primary/10' : 'border-transparent bg-accent hover:bg-accent/80'}`}>
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

          <Button type="submit" disabled={isSaving} className="w-full magenta-gradient text-white font-bold py-3 text-lg">
            {isSaving ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Guardando...</>
            ) : (
              <><Save className="mr-2 h-5 w-5" /> Guardar Cambios</>
            )}
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
