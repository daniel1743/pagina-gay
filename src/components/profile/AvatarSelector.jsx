import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Check, X, Lock, Crown, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_CATALOG, canUserUseAvatar, getAvatarsByTier } from '@/lib/avatars/dicebearCatalog';
import { saveAvatarSelection } from '@/lib/avatars/avatarStorage';

const AvatarSelector = ({ isOpen, onClose, currentAvatar, onSelect }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedAvatarId, setSelectedAvatarId] = useState(null);
  const [filterTier, setFilterTier] = useState('all'); // 'all', 'free', 'verified', 'premium'
  const [isSaving, setIsSaving] = useState(false);

  // Determinar tier del usuario
  const userTier = useMemo(() => {
    if (!user) return 'free';
    // Admin puede usar todos
    if (user.role === 'admin' || user.role === 'administrator') return 'premium';
    if (user.isPremium) return 'premium';
    if (user.verified) return 'verified';
    return 'free';
  }, [user]);

  // Filtrar avatares según el filtro seleccionado
  const filteredAvatares = useMemo(() => {
    if (filterTier === 'all') {
      return DEFAULT_CATALOG;
    }
    return getAvatarsByTier(filterTier);
  }, [filterTier]);

  // Contar avatares disponibles por tier
  const tierCounts = useMemo(() => {
    const free = DEFAULT_CATALOG.filter(a => canUserUseAvatar(a, 'free', 0)).length;
    const verified = DEFAULT_CATALOG.filter(a => canUserUseAvatar(a, 'verified', 0)).length;
    const premium = DEFAULT_CATALOG.filter(a => canUserUseAvatar(a, 'premium', 0)).length;
    return { free, verified, premium };
  }, []);

  // Contar avatares accesibles por el usuario actual
  const accessibleCounts = useMemo(() => {
    const free = DEFAULT_CATALOG.filter(a => canUserUseAvatar(a, 'free', 0)).length;
    const verified = DEFAULT_CATALOG.filter(a => canUserUseAvatar(a, 'verified', 0)).length;
    const premium = DEFAULT_CATALOG.filter(a => canUserUseAvatar(a, 'premium', 0)).length;
    
    // Contar cuántos puede usar el usuario actual
    let userAccessible = 0;
    if (user?.role === 'admin' || user?.role === 'administrator') {
      userAccessible = DEFAULT_CATALOG.length;
    } else if (userTier === 'premium') {
      userAccessible = free + verified + premium;
    } else if (userTier === 'verified') {
      userAccessible = free + verified;
    } else {
      userAccessible = free;
    }
    
    return { free, verified, premium, total: userAccessible };
  }, [userTier, user]);

  // Establecer avatar seleccionado inicial basado en currentAvatar
  useEffect(() => {
    if (currentAvatar && isOpen) {
      // Buscar avatar en el catálogo que coincida con el SVG actual
      const found = DEFAULT_CATALOG.find(a => a.svg === currentAvatar || currentAvatar.includes(a.seed));
      if (found) {
        setSelectedAvatarId(found.id);
      }
    }
  }, [currentAvatar, isOpen]);

  const handleSelect = (avatar) => {
    // Verificar si el usuario puede usar este avatar
    const isAdmin = user?.role === 'admin' || user?.role === 'administrator';
    const canUse = isAdmin || canUserUseAvatar(avatar, userTier, user?.level || 0);
    
    if (!canUse) {
      // Mostrar toast según el tier bloqueado
      if (avatar.tierRequired === 'premium') {
        toast({
          title: "Avatar Premium 👑",
          description: "Este avatar es exclusivo para usuarios Premium. ¡Hazte Premium para desbloquearlo!",
          variant: "default",
        });
      } else if (avatar.tierRequired === 'verified') {
        toast({
          title: "Avatar Exclusivo ✅",
          description: "Este avatar es exclusivo para usuarios verificados. Conéctate 30 días seguidos para verificarte.",
          variant: "default",
        });
      }
      return;
    }

    setSelectedAvatarId(avatar.id);
  };

  const handleConfirm = async () => {
    if (!selectedAvatarId) {
      toast({
        title: "Selecciona un Avatar",
        description: "Por favor elige un avatar antes de confirmar.",
        variant: "destructive",
      });
      return;
    }

    const selectedAvatar = DEFAULT_CATALOG.find(a => a.id === selectedAvatarId);
    if (!selectedAvatar) return;

    setIsSaving(true);
    try {
      // Guardar en Firebase/localStorage
      await saveAvatarSelection({
        id: selectedAvatar.id,
        seed: selectedAvatar.seed,
        style: selectedAvatar.style,
        svg: selectedAvatar.svg,
      });

      // Llamar callback con el SVG
      if (onSelect) {
        onSelect(selectedAvatar.svg);
      }

      toast({
        title: "✅ Avatar Actualizado",
        description: `Has seleccionado "${selectedAvatar.name}"`,
      });

      onClose();
    } catch (error) {
      console.error('Error guardando avatar:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el avatar. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpgrade = () => {
    onClose();
    navigate('/premium');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-[#1a0d2e] via-[#2d1b4e] to-[#1a0d2e] border-2 border-[#E4007C]/30 text-white max-w-5xl w-[95vw] max-h-[90vh] rounded-2xl p-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-4 pb-3 flex-shrink-0 border-b border-border">
          <DialogTitle className="text-2xl font-extrabold text-foreground pr-8">
            Elige tu Avatar
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            {user?.isPremium || user?.role === 'admin' || user?.role === 'administrator'
              ? `¡Tienes acceso a todos los ${DEFAULT_CATALOG.length} avatares! Elige el que más te guste 👑`
              : user?.verified
                ? `Tienes ${accessibleCounts.total} avatares disponibles. ¡Hazte Premium para desbloquear ${accessibleCounts.premium} más! 👑`
                : `Tienes ${accessibleCounts.total} avatares gratis. Verifícate (30 días) para ${accessibleCounts.verified} más, o hazte Premium para todos 👑`
            }
          </DialogDescription>
        </DialogHeader>

        {/* Filtros por tier */}
        <div className="px-4 py-3 border-b border-border bg-accent/30">
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              variant={filterTier === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterTier('all')}
              className={filterTier === 'all' ? 'bg-primary text-primary-foreground' : ''}
            >
              Todos ({DEFAULT_CATALOG.length})
            </Button>
            <Button
              variant={filterTier === 'free' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterTier('free')}
              className={filterTier === 'free' ? 'bg-gray-600 text-white' : ''}
            >
              Gratis ({tierCounts.free})
            </Button>
            <Button
              variant={filterTier === 'verified' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterTier('verified')}
              className={filterTier === 'verified' ? 'bg-[#1DA1F2] text-white' : ''}
            >
              <Shield className="w-3 h-3 mr-1" />
              Verificado ({tierCounts.verified})
            </Button>
            <Button
              variant={filterTier === 'premium' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterTier('premium')}
              className={filterTier === 'premium' ? 'bg-[#FFD700] text-black' : ''}
            >
              <Crown className="w-3 h-3 mr-1" />
              Premium ({tierCounts.premium})
            </Button>
          </div>
        </div>

        <div className="px-4 py-4 overflow-y-auto flex-1 scrollbar-hide min-h-0">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            <AnimatePresence mode="popLayout">
              {filteredAvatares.map((avatar, index) => {
                const isSelected = selectedAvatarId === avatar.id;
                const isLocked = !canUserUseAvatar(avatar, userTier, user?.level || 0) && 
                                 !(user?.role === 'admin' || user?.role === 'administrator');

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.02 }}
                  onClick={() => handleSelect(avatar)}
                  className={`relative rounded-xl p-2 transition-all ${
                    isLocked
                      ? 'cursor-not-allowed'
                      : 'cursor-pointer hover:scale-105'
                  } ${
                    isSelected
                      ? 'bg-gradient-to-br from-[#E4007C]/30 to-cyan-500/30 border-2 border-[#E4007C] shadow-lg shadow-pink-500/50'
                      : 'bg-gradient-to-br from-[#E4007C]/20 to-cyan-500/20 hover:from-[#E4007C]/30 hover:to-cyan-500/30 border-2 border-transparent hover:border-[#E4007C]/50'
                  }`}
                >
                  <div className={`relative ${isLocked ? 'grayscale opacity-60' : ''}`}>
                    <div className="w-full aspect-square rounded-full overflow-hidden bg-gradient-to-br from-[#E4007C]/20 to-cyan-500/20 p-1">
                      <img 
                        src={avatar.svg} 
                        alt={avatar.name}
                        className="w-full h-full object-contain rounded-full bg-white/10"
                      />
                    </div>

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
                  {!isLocked && avatar.tierRequired !== 'free' && (
                    <div className="absolute top-1 left-1">
                      {avatar.tierRequired === 'verified' && (
                        <div className="bg-[#1DA1F2] rounded-full p-1 shadow-lg">
                          <Shield className="w-3 h-3 text-white" />
                        </div>
                      )}
                      {avatar.tierRequired === 'premium' && (
                        <div className="bg-[#FFD700] rounded-full p-1 shadow-lg">
                          <Crown className="w-3 h-3 text-black" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tooltip para bloqueados */}
                  {isLocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl opacity-0 hover:opacity-100 transition-opacity">
                      <div className="text-center p-2">
                        <Lock className="w-6 h-6 text-white mx-auto mb-1" />
                        <p className="text-xs text-white font-semibold">
                          {avatar.tierRequired === 'premium' ? 'Premium' : 'Verificado'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Nombre del avatar */}
                  <p className="text-xs text-center text-muted-foreground mt-2 truncate">
                    {avatar.name}
                  </p>
                </motion.div>
              );
            })}
            </AnimatePresence>
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
            className="flex-1 bg-gradient-to-r from-[#E4007C] to-cyan-500 hover:from-[#ff0087] hover:to-cyan-400 text-white font-bold"
            disabled={!selectedAvatarId || isSaving}
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Guardando...
              </>
            ) : (
              'Confirmar'
            )}
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
