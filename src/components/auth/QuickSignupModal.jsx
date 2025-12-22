import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Lock, User, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const QuickSignupModal = ({ isOpen, onClose, redirectTo = '/lobby' }) => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: ''
  });
  const [errors, setErrors] = useState({});

  const validateStep1 = () => {
    const newErrors = {};

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'El email es requerido';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Ingresa un email válido';
    }

    // Validar contraseña
    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mínimo 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};

    // Validar username
    if (!formData.username) {
      newErrors.username = 'El nombre de usuario es requerido';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Mínimo 3 caracteres';
    } else if (formData.username.length > 20) {
      newErrors.username = 'Máximo 20 caracteres';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Solo letras, números y guion bajo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
      handleRegister();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setErrors({});
    }
  };

  const handleRegister = async () => {
    try {
      const success = await register({
        email: formData.email,
        password: formData.password,
        username: formData.username,
        age: '18', // Valor por defecto para cumplir validación
        phone: '' // Opcional
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
      setStep(2); // Volver al paso 2 si hay error
      toast({
        title: "Error al registrarse",
        description: error.message || "Intenta con otro email o usuario",
        variant: "destructive",
      });
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-purple-900/95 to-fuchsia-900/95 border-purple-500/30 text-white max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-purple-300 to-fuchsia-300 bg-clip-text text-transparent">
            Registro Rápido
          </DialogTitle>
          <DialogDescription className="text-purple-200 text-center">
            Solo 3 pasos para empezar a chatear
          </DialogDescription>
        </DialogHeader>

        {/* Indicador de progreso */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full transition-all ${
                s === step
                  ? 'bg-gradient-to-r from-purple-400 to-fuchsia-400'
                  : s < step
                  ? 'bg-green-500'
                  : 'bg-purple-700/30'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* PASO 1: Email y Contraseña */}
          {step === 1 && (
            <motion.div
              key="step1"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/20 mb-3">
                  <Mail className="w-8 h-8 text-purple-300" />
                </div>
                <h3 className="text-xl font-bold">Paso 1: Credenciales</h3>
                <p className="text-sm text-purple-300">Crea tu cuenta con email y contraseña</p>
              </div>

              <div>
                <Label htmlFor="email" className="text-purple-200">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && handleNext()}
                  className={`bg-purple-900/30 border-purple-700 text-white ${
                    errors.email ? 'border-red-500' : ''
                  }`}
                  placeholder="tu@email.com"
                />
                {errors.email && (
                  <p className="text-red-400 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password" className="text-purple-200">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && handleNext()}
                  className={`bg-purple-900/30 border-purple-700 text-white ${
                    errors.password ? 'border-red-500' : ''
                  }`}
                  placeholder="Mínimo 6 caracteres"
                />
                {errors.password && (
                  <p className="text-red-400 text-xs mt-1">{errors.password}</p>
                )}
              </div>

              <Button
                onClick={handleNext}
                className="w-full bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600 text-white font-bold"
              >
                Siguiente
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          )}

          {/* PASO 2: Nombre de Usuario */}
          {step === 2 && (
            <motion.div
              key="step2"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-fuchsia-500/20 mb-3">
                  <User className="w-8 h-8 text-fuchsia-300" />
                </div>
                <h3 className="text-xl font-bold">Paso 2: Nombre de Usuario</h3>
                <p className="text-sm text-purple-300">¿Cómo quieres que te llamen?</p>
              </div>

              <div>
                <Label htmlFor="username" className="text-purple-200">Nombre de usuario</Label>
                <Input
                  id="username"
                  type="text"
                  autoComplete="username"
                  autoFocus
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && handleNext()}
                  className={`bg-purple-900/30 border-purple-700 text-white ${
                    errors.username ? 'border-red-500' : ''
                  }`}
                  placeholder="ej: Juan_Santiago"
                />
                {errors.username && (
                  <p className="text-red-400 text-xs mt-1">{errors.username}</p>
                )}
                <p className="text-purple-400 text-xs mt-2">
                  3-20 caracteres, solo letras, números y guion bajo
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleBack}
                  variant="outline"
                  className="flex-1 border-purple-500 text-purple-300 hover:bg-purple-800/50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Atrás
                </Button>
                <Button
                  onClick={handleNext}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-600 hover:to-fuchsia-600 text-white font-bold"
                >
                  Crear Cuenta
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* PASO 3: Confirmación y Cargando */}
          {step === 3 && (
            <motion.div
              key="step3"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="space-y-6 py-8"
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 mb-4"
                >
                  <CheckCircle className="w-12 h-12 text-green-400" />
                </motion.div>
                <h3 className="text-2xl font-bold mb-2">¡Listo! 🎉</h3>
                <p className="text-purple-300">Creando tu cuenta...</p>
                <p className="text-sm text-purple-400 mt-2">Te redirigiremos al chat en un momento</p>
              </div>

              {/* Loading spinner */}
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-300"></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Link a login si ya tiene cuenta */}
        {step < 3 && (
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
        )}
      </DialogContent>
    </Dialog>
  );
};

export default QuickSignupModal;
