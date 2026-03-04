import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Eye, EyeOff } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { PROFILE_ROLE_OPTIONS, normalizeProfileRole } from '@/config/profileRoles';

const QuickSignupModal = ({ isOpen, onClose, redirectTo = '/home' }) => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    age: '',
    profileRole: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors = {};

    const ageNum = formData.age ? parseInt(formData.age) : 0;
    if (!formData.age || isNaN(ageNum) || ageNum < 18) {
      newErrors.age = 'Debes ser mayor de 18 años';
    } else if (ageNum > 120) {
      newErrors.age = 'Edad inválida';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'El email es requerido';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Ingresa un email válido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mínimo 6 caracteres';
    }

    if (!normalizeProfileRole(formData.profileRole)) {
      newErrors.profileRole = 'Selecciona tu rol';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const success = await register({
        email: formData.email,
        password: formData.password,
        age: formData.age,
        profileRole: normalizeProfileRole(formData.profileRole),
      });

      if (success) {
        toast({
          title: "¡Bienvenido a Chactivo! 🎉",
          description: "Tu cuenta ha sido creada exitosamente",
          duration: 3000,
        });

        setTimeout(() => {
          onClose();
          navigate(redirectTo);
        }, 1500);
      }
    } catch (error) {
      toast({
        title: "Error al registrarse",
        description: error.message || "Intenta con otro email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-purple-900/95 to-fuchsia-900/95 border-purple-500/30 text-white max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-purple-300 to-fuchsia-300 bg-clip-text text-transparent">
            Registro Rápido
          </DialogTitle>
          <DialogDescription className="text-purple-200 text-center">
            Solo 4 campos para empezar a chatear
          </DialogDescription>
        </DialogHeader>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="age" className="text-purple-200">Edad</Label>
            <Input
              id="age"
              type="number"
              min="18"
              max="120"
              autoComplete="off"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              className={`bg-purple-900/30 border-purple-700 text-white ${
                errors.age ? 'border-red-500' : ''
              }`}
              placeholder="18+"
            />
            {errors.age && <p className="text-red-400 text-xs mt-1">{errors.age}</p>}
            <p className="text-purple-400 text-xs mt-1">Debes ser mayor de 18 años</p>
          </div>

          <div>
            <Label htmlFor="email" className="text-purple-200">Email</Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`bg-purple-900/30 border-purple-700 text-white pr-10 ${
                  errors.email ? 'border-red-500' : ''
                }`}
                placeholder="tu@email.com"
              />
              <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400 pointer-events-none" />
            </div>
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <Label htmlFor="profile-role" className="text-purple-200">Rol</Label>
            <select
              id="profile-role"
              value={formData.profileRole}
              onChange={(e) => setFormData({ ...formData, profileRole: e.target.value })}
              className={`w-full h-10 rounded-md px-3 bg-purple-900/30 border text-white ${
                errors.profileRole ? 'border-red-500' : 'border-purple-700'
              }`}
            >
              <option value="">Selecciona tu rol</option>
              {PROFILE_ROLE_OPTIONS.map((roleOption) => (
                <option key={roleOption.value} value={roleOption.value}>
                  {roleOption.label}
                </option>
              ))}
            </select>
            {errors.profileRole && <p className="text-red-400 text-xs mt-1">{errors.profileRole}</p>}
          </div>

          <div>
            <Label htmlFor="password" className="text-purple-200">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`bg-purple-900/30 border-purple-700 text-white pr-10 ${
                  errors.password ? 'border-red-500' : ''
                }`}
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-400 hover:text-purple-300 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600 text-white font-bold"
          >
            {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </Button>
        </motion.form>

        <div className="text-center mt-4">
          <p className="text-sm text-purple-300">
            ¿Ya tienes cuenta?{' '}
            <button
              onClick={() => {
                onClose();
                navigate('/auth');
              }}
              className="text-fuchsia-400 hover:text-fuchsia-300 font-semibold underline"
            >
              Inicia Sesión
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickSignupModal;
