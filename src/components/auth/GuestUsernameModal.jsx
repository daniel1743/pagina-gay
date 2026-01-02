import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Zap, Lock, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

/**
 * Modal de Entrada Rápida para Guests
 * Permite entrar al chat con SOLO username (sin email/password)
 * Limita a 2 avatares básicos - incentiva registro para desbloquear más
 */
export const GuestUsernameModal = ({ open, onClose, chatRoomId = 'principal' }) => {
  const navigate = useNavigate();
  const { signInAsGuest } = useAuth();

  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('guest1');
  const [isLoading, setIsLoading] = useState(false);

  // 🎨 Solo 2 avatares básicos para guests
  const guestAvatars = [
    {
      id: 'guest1',
      url: 'https://api.dicebear.com/7.x/bottts/svg?seed=guest1&backgroundColor=b6e3f4',
      name: 'Avatar Azul'
    },
    {
      id: 'guest2',
      url: 'https://api.dicebear.com/7.x/bottts/svg?seed=guest2&backgroundColor=d1d4f9',
      name: 'Avatar Morado'
    }
  ];

  // 🔒 Avatares premium (bloqueados) - incentivo visual
  const premiumAvatarsPreview = [
    { url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=premium1', locked: true },
    { url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=premium2', locked: true },
    { url: 'https://api.dicebear.com/7.x/identicon/svg?seed=premium3', locked: true },
    { url: 'https://api.dicebear.com/7.x/bottts/svg?seed=premium4', locked: true }
  ];

  const handleStart = async () => {
    // Validación de username
    if (!username.trim()) {
      toast({
        title: "Nombre requerido",
        description: "Por favor ingresa un nombre de usuario",
        variant: "destructive",
      });
      return;
    }

    if (username.trim().length < 3) {
      toast({
        title: "Nombre muy corto",
        description: "El nombre debe tener al menos 3 caracteres",
        variant: "destructive",
      });
      return;
    }

    if (username.trim().length > 20) {
      toast({
        title: "Nombre muy largo",
        description: "El nombre debe tener máximo 20 caracteres",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Obtener URL del avatar seleccionado
      const avatarUrl = guestAvatars.find(a => a.id === selectedAvatar)?.url;

      // Crear usuario guest en Firebase
      await signInAsGuest(username.trim(), avatarUrl);

      toast({
        title: "¡Bienvenido! 🎉",
        description: `Hola ${username.trim()}, ya puedes chatear`,
      });

      // Redirigir a la sala especificada (o global por defecto)
      navigate(`/chat/${chatRoomId}`);

      onClose();
    } catch (error) {
      console.error('Error creating guest user:', error);
      toast({
        title: "Error",
        description: "No se pudo iniciar sesión como invitado. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToLogin = () => {
    onClose();
    navigate('/auth');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] neon-border-card text-white overflow-y-auto scrollbar-hide p-0">
        {/* Fondo interior con glassmorphism */}
        <div className="glass-effect rounded-3xl p-6">
          <DialogHeader>
            {/* Icono con efecto neón */}
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <motion.div
                  className="neon-glow-cyan rounded-full p-4 bg-neon-cyan/10"
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Zap className="h-12 w-12 text-neon-cyan" />
                </motion.div>
                <Sparkles className="h-5 w-5 text-neon-pink absolute -top-1 -right-1 animate-pulse" />
              </div>
            </div>

            <DialogTitle className="text-3xl font-bold text-center neon-text-cyan mb-3">
              Entra SIN Registro
            </DialogTitle>

            <DialogDescription className="text-center text-gray-300 text-base leading-relaxed">
              Solo elige un nombre y empieza a chatear.
              <br />
              <span className="neon-text-pink font-bold text-lg">Sin email, sin contraseña, sin esperas.</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-6">
            {/* 📝 Input de Username con diseño neón */}
            <div>
              <label className="text-sm font-semibold text-neon-cyan mb-3 block flex items-center gap-2">
                <span className="text-lg">👤</span>
                ¿Cómo te llamas?
              </label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Ej: Carlos28, Mateo_Stgo, Diego..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleStart()}
                  maxLength={20}
                  className="glass-input text-white placeholder:text-gray-400 text-lg py-6 px-4 border-2 border-neon-cyan/20 focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/50 transition-all rounded-xl"
                  autoFocus
                />
                {/* Contador con estilo neón */}
                <div className="absolute -bottom-6 right-0 text-xs text-gray-400 font-mono">
                  <span className={username.length >= 3 ? 'text-neon-green' : 'text-gray-500'}>
                    {username.length}/20
                  </span>
                  {username.length < 3 && <span className="ml-2 text-neon-pink">mín. 3</span>}
                </div>
              </div>
            </div>

          {/* 🎨 Selector de Avatar - Solo 2 para guests */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Elige tu avatar
            </label>

            {/* Avatares disponibles para guests */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              {guestAvatars.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => setSelectedAvatar(avatar.id)}
                  className={`relative p-3 rounded-lg border-2 transition-all ${
                    selectedAvatar === avatar.id
                      ? 'border-cyan-400 bg-cyan-400/10 scale-105'
                      : 'border-[#413e62] bg-[#2a2740] hover:border-cyan-400/50'
                  }`}
                >
                  <img
                    src={avatar.url}
                    alt={avatar.name}
                    className="w-full h-20 object-cover rounded"
                  />
                  <p className="text-xs text-center mt-1 text-gray-300">
                    {avatar.name}
                  </p>
                  {selectedAvatar === avatar.id && (
                    <div className="absolute top-1 right-1 w-5 h-5 bg-cyan-400 rounded-full flex items-center justify-center">
                      <span className="text-black text-xs">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* 🔒 Preview de avatares premium (incentivo visual) */}
            <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-lg p-3 border border-pink-400/30">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-pink-300">
                  +50 avatares premium 🎨
                </p>
                <Lock className="h-3 w-3 text-pink-400" />
              </div>

              <div className="grid grid-cols-4 gap-2 mb-2">
                {premiumAvatarsPreview.map((avatar, idx) => (
                  <div key={idx} className="relative opacity-50">
                    <img
                      src={avatar.url}
                      alt="Premium avatar"
                      className="w-full h-12 object-cover rounded border border-gray-600"
                    />
                    <div className="absolute inset-0 bg-black/40 rounded flex items-center justify-center">
                      <Lock className="h-4 w-4 text-white" />
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-gray-400 text-center">
                Regístrate para desbloquear todos los avatares
              </p>
            </div>
          </div>

            {/* ✅ Botón de Inicio con efecto neón */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={handleStart}
                disabled={isLoading || username.trim().length < 3}
                className="w-full neon-button py-7 text-xl font-bold shadow-2xl disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 relative overflow-hidden group"
              >
                {/* Efecto de brillo animado */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                <span className="relative z-10 flex items-center justify-center gap-3">
                  {isLoading ? (
                    <>
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        ⏳
                      </motion.span>
                      Entrando...
                    </>
                  ) : (
                    <>
                      <Zap className="h-6 w-6" />
                      Empezar a Chatear Ahora
                      <Zap className="h-6 w-6" />
                    </>
                  )}
                </span>
              </Button>
            </motion.div>

          {/* 🔗 Link a Login */}
          <div className="text-center">
            <button
              onClick={handleGoToLogin}
              className="text-sm text-gray-400 hover:text-cyan-400 transition-colors underline"
            >
              ¿Ya tienes cuenta? Inicia sesión
            </button>
          </div>

          {/* ℹ️ Como invitado puedes: */}
          <div className="bg-green-900/20 rounded-lg p-3 border border-green-500/30 mb-3">
            <p className="text-xs font-semibold text-green-300 mb-1">
              ✅ Como invitado puedes:
            </p>
            <div className="space-y-0.5 text-xs text-gray-300">
              <div>✓ Chatear en salas públicas gratis por 1 mes</div>
              <div>✓ Ver conversaciones en tiempo real</div>
              <div>✓ Avatar con tu inicial (sin foto personalizada)</div>
            </div>
          </div>

          {/* ℹ️ Regístrate para desbloquear */}
          <div className="bg-[#2a2740] rounded-lg p-3 border border-[#413e62]">
            <p className="text-xs font-semibold text-yellow-300 mb-1">
              💎 Regístrate para desbloquear:
            </p>
            <div className="space-y-0.5 text-xs text-gray-400">
              <div>✓ Chats privados 1 a 1</div>
              <div>✓ Dar likes y reacciones a mensajes</div>
              <div>✓ 50+ avatares personalizados</div>
              <div>✓ Crear y administrar salas propias</div>
              <div>✓ Badge de verificación</div>
              <div>✓ Acceso ilimitado sin expiración</div>
            </div>
          </div>
          </div>

          <div className="mt-3 text-center">
            <p className="text-xs text-gray-500">
              Al continuar, aceptas nuestros{' '}
              <a href="/terminos-condiciones.html" target="_blank" className="text-cyan-400 hover:underline">
                Términos y Condiciones
              </a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
