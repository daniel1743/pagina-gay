import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Crown, Gift, Users, Share2 } from 'lucide-react';

/**
 * Modal de Bienvenida Premium
 * Muestra una oferta especial para las primeras 100 personas
 */
export const PremiumWelcomeModal = ({ open, onClose }) => {
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Chat Gay Santiago',
        text: '¡Únete al nuevo chat gay de Santiago! 🌈',
        url: window.location.href,
      }).catch(() => {});
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900 border-pink-500 text-white overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-center mb-2">
            <div className="relative">
              <Crown className="h-12 w-12 text-yellow-400 animate-pulse" />
              <Sparkles className="h-5 w-5 text-yellow-300 absolute -top-1 -right-1 animate-bounce" />
            </div>
          </div>

          <DialogTitle className="text-xl font-bold text-center text-yellow-400">
            ¡Bienvenido al Chat de Santiago! 🎉
          </DialogTitle>

          <DialogDescription className="text-center text-white/90 text-sm mt-2">
            <div className="space-y-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-pink-400/30">
                <Gift className="h-7 w-7 text-yellow-400 mx-auto mb-1" />
                <p className="font-bold text-base text-yellow-300 mb-1">
                  ¡FELICITACIONES! 🎊
                </p>
                <p className="text-xs">
                  Has ganado <span className="font-bold text-pink-300">Membresía Premium</span>
                </p>
              </div>

              <div className="bg-gradient-to-r from-yellow-500/20 to-pink-500/20 rounded-lg p-3 border border-yellow-400/50">
                <Users className="h-6 w-6 text-yellow-300 mx-auto mb-1" />
                <p className="text-xs font-semibold mb-1">
                  Las primeras <span className="text-yellow-300 font-bold">100 personas</span> activas
                </p>
                <p className="text-xs">
                  Ganarán <span className="font-bold text-pink-300">1 AÑO GRATIS</span>
                </p>
              </div>

              <div className="space-y-1 text-left bg-white/5 rounded-lg p-2">
                <p className="font-semibold text-pink-300 text-center text-xs mb-1">
                  ✨ Funciones Premium:
                </p>
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs text-white/80">
                  <div>✓ Sin límite mensajes</div>
                  <div>✓ Chats privados</div>
                  <div>✓ Avatar custom</div>
                  <div>✓ Sin publicidad</div>
                </div>
              </div>

              <div className="bg-pink-500/20 rounded-lg p-2 border border-pink-400/40">
                <p className="text-xs font-semibold mb-1">
                  📋 Requisitos:
                </p>
                <p className="text-xs text-white/80">
                  • Permanece activo • Comparte la app • Participa
                </p>
              </div>

              <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-400/30 rounded-lg">
                <p className="text-sm font-bold text-yellow-300 text-center animate-pulse">
                  ¿Eres parte de los 100? 🌟
                </p>
                <p className="text-xs text-white/70 text-center mt-0.5">
                  ¡Comienza a participar ahora!
                </p>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col sm:flex-col gap-2 mt-3">
          <Button
            onClick={handleShare}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold shadow-lg text-sm py-2"
          >
            <Share2 className="mr-2 h-3 w-3" />
            Compartir Ahora
          </Button>

          <Button
            onClick={onClose}
            variant="outline"
            className="w-full border-pink-400/50 text-pink-300 hover:bg-pink-500/10 text-sm py-2"
          >
            ¡Entendido, Participaré! 🎉
          </Button>
        </DialogFooter>

        <div className="mt-2 text-center">
          <p className="text-xs text-white/50">
            * Válido para las primeras 100 personas activas
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
