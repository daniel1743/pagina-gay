import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Check, X, Lock, Crown, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

// 30 avatares estéticos usando DiceBear API
// Niveles: FREE (0-9), VERIFICADO (10-19), PREMIUM (20-29)
const AVATAR_STYLES = [
  // FREE: Avatares básicos (0-9)
  { style: 'avataaars', seed: 'rainbow1', name: 'Arcoíris 1', tier: 'free' },
  { style: 'avataaars', seed: 'rainbow2', name: 'Arcoíris 2', tier: 'free' },
  { style: 'avataaars', seed: 'cool1', name: 'Cool 1', tier: 'free' },
  { style: 'avataaars', seed: 'cool2', name: 'Cool 2', tier: 'free' },
  { style: 'avataaars', seed: 'happy1', name: 'Feliz 1', tier: 'free' },
  { style: 'avataaars', seed: 'happy2', name: 'Feliz 2', tier: 'free' },
  { style: 'avataaars', seed: 'smile1', name: 'Sonrisa 1', tier: 'free' },
  { style: 'avataaars', seed: 'smile2', name: 'Sonrisa 2', tier: 'free' },
  { style: 'adventurer', seed: 'adv1', name: 'Aventurero 1', tier: 'free' },
  { style: 'adventurer', seed: 'adv2', name: 'Aventurero 2', tier: 'free' },

  // VERIFICADO: Avatares exclusivos para verificados (10-19)
  { style: 'adventurer', seed: 'adv3', name: 'Aventurero 3', tier: 'verified' },
  { style: 'adventurer', seed: 'adv4', name: 'Aventurero 4', tier: 'verified' },
  { style: 'big-smile', seed: 'smile3', name: 'Gran Sonrisa 1', tier: 'verified' },
  { style: 'big-smile', seed: 'smile4', name: 'Gran Sonrisa 2', tier: 'verified' },
  { style: 'big-smile', seed: 'smile5', name: 'Gran Sonrisa 3', tier: 'verified' },
  { style: 'bottts', seed: 'bot1', name: 'Robot 1', tier: 'verified' },
  { style: 'bottts', seed: 'bot2', name: 'Robot 2', tier: 'verified' },
  { style: 'bottts', seed: 'bot3', name: 'Robot 3', tier: 'verified' },
  { style: 'croodles', seed: 'croo1', name: 'Doodle 1', tier: 'verified' },
  { style: 'croodles', seed: 'croo2', name: 'Doodle 2', tier: 'verified' },

  // PREMIUM: Avatares exclusivos para premium (20-29)
  { style: 'croodles', seed: 'croo3', name: 'Doodle 3', tier: 'premium' },
  { style: 'fun-emoji', seed: 'emoji1', name: 'Emoji 1', tier: 'premium' },
  { style: 'fun-emoji', seed: 'emoji2', name: 'Emoji 2', tier: 'premium' },
  { style: 'fun-emoji', seed: 'emoji3', name: 'Emoji 3', tier: 'premium' },
  { style: 'lorelei', seed: 'lor1', name: 'Retro 1', tier: 'premium' },
  { style: 'lorelei', seed: 'lor2', name: 'Retro 2', tier: 'premium' },
  { style: 'lorelei', seed: 'lor3', name: 'Retro 3', tier: 'premium' },
  { style: 'micah', seed: 'mic1', name: 'Moderno 1', tier: 'premium' },
  { style: 'micah', seed: 'mic2', name: 'Moderno 2', tier: 'premium' },
  { style: 'micah', seed: 'mic3', name: 'Moderno 3', tier: 'premium' },
];

const AvatarSelector = ({ isOpen, onClose, currentAvatar, onSelect }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar);

  const generateAvatarUrl = (avatar) => {
    return `https://api.dicebear.com/7.x/${avatar.style}/svg?seed=${avatar.seed}`;
  };

  // Determinar si el usuario puede usar un avatar
  const canUseAvatar = (avatarTier) => {
    // Admin puede usar TODOS los avatares (sin restricciones)
    if (user?.role === 'admin' || user?.role === 'administrator') {
      return true;
    }

    // Premium puede usar todos
    if (user?.isPremium) return true;

    // Verificados pueden usar FREE y VERIFICADO
    if (user?.verified) {
      return avatarTier === 'free' || avatarTier === 'verified';
    }

    // FREE solo puede usar FREE
    return avatarTier === 'free';
  };

  const handleSelect = (avatar) => {
    // Admin puede usar TODOS los avatares sin restricciones
    const isAdmin = user?.role === 'admin' || user?.role === 'administrator';
    
    // Verificar si el usuario puede usar este avatar (excepto admin)
    if (!isAdmin && !canUseAvatar(avatar.tier)) {
      // Mostrar toast según el tier bloqueado
      if (avatar.tier === 'premium') {
        toast({
          title: "Avatar Premium 👑",
          description: "Este avatar es exclusivo para usuarios Premium. ¡Hazte Premium para desbloquearlo!",
          variant: "default",
        });
      } else if (avatar.tier === 'verified') {
        toast({
          title: "Avatar Exclusivo ✅",
          description: "Este avatar es exclusivo para usuarios verificados. Conéctate 30 días seguidos para verificarte.",
          variant: "default",
        });
      }
      return;
    }

    const url = generateAvatarUrl(avatar);
    setSelectedAvatar(url);
  };

  const handleConfirm = () => {
    onSelect(selectedAvatar);
    onClose();
  };

  const handleUpgrade = () => {
    onClose();
    navigate('/premium');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-background border-border max-w-4xl w-[95vw] max-h-[90vh] rounded-2xl p-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-4 pb-3 flex-shrink-0 border-b border-border">
          <DialogTitle className="text-2xl font-extrabold text-foreground pr-8">
            Elige tu Avatar
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            {user?.isPremium || user?.role === 'admin' || user?.role === 'administrator'
              ? '¡Tienes acceso a todos los avatares! Elige el que más te guste 👑'
              : user?.verified
                ? 'Tienes 20 avatares disponibles. ¡Hazte Premium para desbloquear los 10 exclusivos! 👑'
                : '10 avatares gratis. Verifícate (30 días) para +10 más, o hazte Premium para todos 👑'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 py-4 overflow-y-auto flex-1 scrollbar-hide">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {AVATAR_STYLES.map((avatar, index) => {
              const url = generateAvatarUrl(avatar);
              const isSelected = selectedAvatar === url;
              const isLocked = !canUseAvatar(avatar.tier);

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.02 }}
                  onClick={() => handleSelect(avatar)}
                  className={`relative rounded-xl p-2 transition-all ${
                    isLocked
                      ? 'cursor-not-allowed opacity-60'
                      : 'cursor-pointer'
                  } ${
                    isSelected
                      ? 'bg-primary/20 border-2 border-primary'
                      : 'bg-accent hover:bg-accent/80 border-2 border-transparent'
                  }`}
                >
                  <div className={`relative ${isLocked ? 'grayscale' : ''}`}>
                    <Avatar className="w-full aspect-square">
                      <AvatarImage src={url} alt={avatar.name} />
                      <AvatarFallback className="bg-secondary">
                        {avatar.name[0]}
                      </AvatarFallback>
                    </Avatar>

                    {/* Candado si está bloqueado */}
                    {isLocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                        <Lock className="w-8 h-8 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Checkmark si está seleccionado */}
                  {isSelected && !isLocked && (
                    <div className="absolute top-1 right-1 bg-primary rounded-full p-1">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}

                  {/* Badge de tier */}
                  {!isLocked && avatar.tier !== 'free' && (
                    <div className="absolute top-1 left-1">
                      {avatar.tier === 'verified' && (
                        <div className="bg-[#1DA1F2] rounded-full p-1">
                          <Shield className="w-3 h-3 text-white" />
                        </div>
                      )}
                      {avatar.tier === 'premium' && (
                        <div className="bg-[#FFD700] rounded-full p-1">
                          <Crown className="w-3 h-3 text-black" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Nombre del avatar */}
                  <p className="text-xs text-center text-muted-foreground mt-2 truncate">
                    {avatar.name}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Leyenda de niveles */}
        <div className="px-4 py-2 border-t border-border bg-accent/30">
          <div className="flex flex-wrap gap-3 text-xs justify-center">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <span className="text-muted-foreground">Gratis (10)</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-[#1DA1F2]" />
              <span className="text-muted-foreground">Verificado (10)</span>
            </div>
            <div className="flex items-center gap-1">
              <Crown className="w-3 h-3 text-[#FFD700]" />
              <span className="text-muted-foreground">Premium (10)</span>
            </div>
          </div>
        </div>

        {/* Footer con botones */}
        <div className="px-4 py-3 flex gap-3 border-t border-border flex-shrink-0 bg-background">
          {!user?.isPremium && !user?.verified && (
            <Button
              onClick={handleUpgrade}
              className="flex-1 gold-gradient"
            >
              <Crown className="w-4 h-4 mr-2" />
              Ver Premium
            </Button>
          )}
          <Button
            variant="outline"
            onClick={onClose}
            className={!user?.isPremium && !user?.verified ? 'flex-1' : 'flex-1'}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-1 bg-primary hover:bg-primary/90"
            disabled={!selectedAvatar}
          >
            Confirmar
          </Button>
        </div>

        {/* Botón cerrar - siempre visible */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-2 right-2 z-50 text-muted-foreground hover:text-foreground hover:bg-accent rounded-full"
        >
          <X className="w-5 h-5" />
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default AvatarSelector;
