import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { X, Heart, MessageSquare, Video, User } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Modal para mostrar todos los favoritos del usuario
 * Permite hacer clic en cada favorito para ver opciones
 */
const FavoritesModal = ({ favorites, onClose, onSelectFavorite }) => {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-card border text-foreground max-w-md rounded-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Heart className="w-6 h-6 text-pink-400" />
            Mis Favoritos
            <span className="text-sm text-muted-foreground font-normal ml-auto">
              {favorites.length}/15
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto scrollbar-hide px-6 pb-6">
          {favorites.length === 0 ? (
            <div className="text-center py-8">
              <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
              <p className="text-muted-foreground">
                Aún no has agregado amigos favoritos
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Agrega usuarios a favoritos para acceso rápido
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 mt-4">
              {favorites.map((fav, index) => (
                <motion.button
                  key={fav.id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    onSelectFavorite(fav);
                    onClose();
                  }}
                  className="glass-effect p-4 rounded-xl border border-border hover:border-pink-400/50 transition-all text-left group"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative">
                      <Avatar className="w-16 h-16 border-2 border-pink-500/30 group-hover:border-pink-400 transition-colors">
                        <AvatarImage src={fav.avatar} alt={fav.username} />
                        <AvatarFallback className="bg-secondary text-lg">
                          {fav.username?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      {fav.isOnline && (
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-card rounded-full"></div>
                      )}
                    </div>

                    <div className="text-center w-full">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {fav.username || 'Usuario'}
                      </p>
                      {fav.lastSeen && (
                        <p className="text-xs text-muted-foreground">
                          {fav.isOnline ? 'En línea' : 'Desconectado'}
                        </p>
                      )}
                    </div>

                    {/* Acciones rápidas */}
                    <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="p-1 bg-secondary rounded-full" title="Ver perfil">
                        <User className="w-3 h-3 text-cyan-400" />
                      </div>
                      <div className="p-1 bg-secondary rounded-full" title="Mensaje">
                        <MessageSquare className="w-3 h-3 text-green-400" />
                      </div>
                      <div className="p-1 bg-secondary rounded-full" title="Chat privado">
                        <Video className="w-3 h-3 text-purple-400" />
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 z-50 text-muted-foreground"
        >
          <X className="w-5 h-5" />
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default FavoritesModal;
