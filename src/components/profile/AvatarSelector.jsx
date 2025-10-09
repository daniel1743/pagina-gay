import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

// 30 avatares estéticos usando DiceBear API
const AVATAR_STYLES = [
  { style: 'avataaars', seed: 'rainbow1', name: 'Arcoíris 1' },
  { style: 'avataaars', seed: 'rainbow2', name: 'Arcoíris 2' },
  { style: 'avataaars', seed: 'cool1', name: 'Cool 1' },
  { style: 'avataaars', seed: 'cool2', name: 'Cool 2' },
  { style: 'avataaars', seed: 'happy1', name: 'Feliz 1' },
  { style: 'avataaars', seed: 'happy2', name: 'Feliz 2' },
  { style: 'avataaars', seed: 'smile1', name: 'Sonrisa 1' },
  { style: 'avataaars', seed: 'smile2', name: 'Sonrisa 2' },
  { style: 'adventurer', seed: 'adv1', name: 'Aventurero 1' },
  { style: 'adventurer', seed: 'adv2', name: 'Aventurero 2' },
  { style: 'adventurer', seed: 'adv3', name: 'Aventurero 3' },
  { style: 'adventurer', seed: 'adv4', name: 'Aventurero 4' },
  { style: 'big-smile', seed: 'smile3', name: 'Gran Sonrisa 1' },
  { style: 'big-smile', seed: 'smile4', name: 'Gran Sonrisa 2' },
  { style: 'big-smile', seed: 'smile5', name: 'Gran Sonrisa 3' },
  { style: 'bottts', seed: 'bot1', name: 'Robot 1' },
  { style: 'bottts', seed: 'bot2', name: 'Robot 2' },
  { style: 'bottts', seed: 'bot3', name: 'Robot 3' },
  { style: 'croodles', seed: 'croo1', name: 'Doodle 1' },
  { style: 'croodles', seed: 'croo2', name: 'Doodle 2' },
  { style: 'croodles', seed: 'croo3', name: 'Doodle 3' },
  { style: 'fun-emoji', seed: 'emoji1', name: 'Emoji 1' },
  { style: 'fun-emoji', seed: 'emoji2', name: 'Emoji 2' },
  { style: 'fun-emoji', seed: 'emoji3', name: 'Emoji 3' },
  { style: 'lorelei', seed: 'lor1', name: 'Retro 1' },
  { style: 'lorelei', seed: 'lor2', name: 'Retro 2' },
  { style: 'lorelei', seed: 'lor3', name: 'Retro 3' },
  { style: 'micah', seed: 'mic1', name: 'Moderno 1' },
  { style: 'micah', seed: 'mic2', name: 'Moderno 2' },
  { style: 'micah', seed: 'mic3', name: 'Moderno 3' },
];

const AvatarSelector = ({ isOpen, onClose, currentAvatar, onSelect }) => {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar);

  const generateAvatarUrl = (avatar) => {
    return `https://api.dicebear.com/7.x/${avatar.style}/svg?seed=${avatar.seed}`;
  };

  const handleSelect = (avatar) => {
    const url = generateAvatarUrl(avatar);
    setSelectedAvatar(url);
  };

  const handleConfirm = () => {
    onSelect(selectedAvatar);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-background border-border max-w-3xl rounded-2xl p-0 max-h-[85vh] overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-3xl font-extrabold text-foreground">
            Elige tu Avatar
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Selecciona el avatar que mejor te represente. Las fotos personalizadas son Premium 👑
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 overflow-y-auto max-h-[60vh] scrollbar-hide">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {AVATAR_STYLES.map((avatar, index) => {
              const url = generateAvatarUrl(avatar);
              const isSelected = selectedAvatar === url;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.02 }}
                  onClick={() => handleSelect(avatar)}
                  className={`relative cursor-pointer rounded-xl p-2 transition-all ${
                    isSelected
                      ? 'bg-primary/20 border-2 border-primary'
                      : 'bg-accent hover:bg-accent/80 border-2 border-transparent'
                  }`}
                >
                  <Avatar className="w-full aspect-square">
                    <AvatarImage src={url} alt={avatar.name} />
                    <AvatarFallback className="bg-secondary">
                      {avatar.name[0]}
                    </AvatarFallback>
                  </Avatar>

                  {/* Checkmark si está seleccionado */}
                  {isSelected && (
                    <div className="absolute top-1 right-1 bg-primary rounded-full p-1">
                      <Check className="w-3 h-3 text-primary-foreground" />
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

        {/* Footer con botones */}
        <div className="px-6 pb-6 pt-2 flex gap-3 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-1 bg-primary hover:bg-primary/90"
            disabled={!selectedAvatar}
          >
            Confirmar Selección
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="w-6 h-6" />
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default AvatarSelector;
