import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Flag, X, CheckCircle, Heart, MessageSquare, Calendar, Users, Plus, Ban } from 'lucide-react';
import { motion } from 'framer-motion';
import { getFavorites } from '@/services/socialService';
import { blockUser, isBlocked } from '@/services/blockService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import FavoritesModal from './FavoritesModal';

const UserProfileModal = ({ user, onClose, onReport, onSelectUser }) => {
  const { user: currentUser } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [showAllFavorites, setShowAllFavorites] = useState(false);
  const [userIsBlocked, setUserIsBlocked] = useState(false);

  const isOwnProfile = currentUser && user.userId === currentUser.id;

  // Verificar si el usuario esta bloqueado
  useEffect(() => {
    const checkBlocked = async () => {
      if (currentUser && user.userId && !isOwnProfile) {
        const blocked = await isBlocked(currentUser.id, user.userId);
        setUserIsBlocked(blocked);
      }
    };
    checkBlocked();
  }, [currentUser, user.userId, isOwnProfile]);

  const handleBlockUser = async () => {
    if (!currentUser?.id || !user.userId || isOwnProfile) return;
    try {
      await blockUser(currentUser.id, user.userId, { source: 'user_profile' });
      setUserIsBlocked(true);
      toast({
        title: "Usuario bloqueado",
        description: "Ya no veras sus mensajes en el chat.",
      });
    } catch (error) {
      console.error('Error bloqueando usuario:', error);
      toast({
        title: "Error",
        description: "No se pudo bloquear al usuario.",
        variant: "destructive",
      });
    }
  };

  // Cargar favoritos del usuario (solo si es el perfil propio)
  useEffect(() => {
    const loadFavorites = async () => {
      if (currentUser && user.userId === currentUser.id) {
        setLoadingFavorites(true);
        try {
          const userFavorites = await getFavorites(currentUser.id);
          setFavorites(userFavorites || []);
        } catch (error) {
          console.error('Error loading favorites:', error);
        } finally {
          setLoadingFavorites(false);
        }
      }
    };

    loadFavorites();
  }, [currentUser, user.userId]);
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <DialogContent className="bg-card border text-foreground max-w-sm rounded-2xl">
          <DialogHeader className="items-center text-center">
             <div className={`rounded-full ${
               user.isProUser
                 ? 'rainbow-avatar-ring'
                 : user.role === 'admin'
                   ? 'admin-avatar-ring'
                   : user.verified
                     ? 'verified-avatar-ring'
                     : user.isPremium
                       ? 'premium-avatar-ring'
                       : ''
             } mb-4`}>
              <Avatar className="w-24 h-24 text-4xl">
                <AvatarImage src={user.avatar} alt={user.username} />
                <AvatarFallback className="bg-secondary">
                  {user.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <DialogTitle className="text-foreground text-2xl flex items-center gap-2">
              {user.username}
              {user.isProUser && (
                <span className="inline-flex items-center gap-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-[9px] font-bold px-1.5 py-0.5 rounded text-white uppercase tracking-wider">PRO</span>
              )}
              {(user.isPremium || user.role === 'admin') && (
                <CheckCircle className="w-5 h-5 text-[#FFD700]"/>
              )}
              {user.verified && !user.isPremium && user.role !== 'admin' && (
                <CheckCircle className="w-5 h-5 text-[#1DA1F2]"/>
              )}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Miembro desde {new Date().getFullYear()}
            </DialogDescription>
          </DialogHeader>

          {/* Información adicional */}
          <div className="space-y-4 mt-6 px-6">
            {/* Estado */}
            {user.estado && (
              <div>
                <h3 className="text-sm font-bold text-muted-foreground mb-1">Estado</h3>
                <p className="text-sm font-medium text-cyan-400">{user.estado}</p>
              </div>
            )}

            {/* Bio / Descripción */}
            {(user.bio || user.description) && (
              <div>
                <h3 className="text-sm font-bold text-muted-foreground mb-2">Acerca de</h3>
                <p className="text-sm text-foreground">{user.bio || user.description}</p>
              </div>
            )}

            {/* Intereses */}
            {user.interests && user.interests.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-muted-foreground mb-2">Intereses</h3>
                <div className="flex flex-wrap gap-2">
                  {user.interests.map((interest, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 text-xs rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Favoritos (solo si es perfil propio) */}
            {currentUser && user.userId === currentUser.id && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                    <Heart className="w-4 h-4 text-pink-400" />
                    Amigos Favoritos
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {favorites.length}/15
                  </span>
                </div>

                {loadingFavorites ? (
                  <p className="text-sm text-muted-foreground">Cargando favoritos...</p>
                ) : favorites.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {/* Mostrar hasta 5 favoritos */}
                    {favorites.slice(0, 5).map((fav) => (
                      <motion.button
                        key={fav.id}
                        onClick={() => {
                          if (onSelectUser) {
                            onSelectUser(fav);
                          }
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex flex-col items-center gap-1 group"
                        title={`Ver perfil de ${fav.username}`}
                      >
                        <div className="relative">
                          <Avatar className="w-12 h-12 border-2 border-pink-500/30 group-hover:border-pink-400 transition-colors">
                            <AvatarImage src={fav.avatar} alt={fav.username} />
                            <AvatarFallback className="bg-secondary text-xs">
                              {fav.username?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {fav.isOnline && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full"></div>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground group-hover:text-foreground truncate max-w-[48px] transition-colors">
                          {fav.username}
                        </span>
                      </motion.button>
                    ))}

                    {/* Botón "Ver más" si hay más de 5 favoritos */}
                    {favorites.length > 5 && (
                      <motion.button
                        onClick={() => setShowAllFavorites(true)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex flex-col items-center justify-center gap-1 group"
                        title="Ver todos los favoritos"
                      >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 border-2 border-pink-500/30 group-hover:border-pink-400 flex items-center justify-center transition-colors">
                          <Plus className="w-6 h-6 text-pink-400 group-hover:text-pink-300" />
                        </div>
                        <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                          +{favorites.length - 5}
                        </span>
                      </motion.button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    Aún no has agregado amigos favoritos
                  </p>
                )}
              </div>
            )}

            {/* Estadísticas */}
            <div>
              <h3 className="text-sm font-bold text-muted-foreground mb-3">Estadísticas</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="glass-effect p-3 rounded-lg border border-border text-center">
                  <div className="flex items-center justify-center mb-1">
                    <MessageSquare className="w-4 h-4 text-cyan-400 mr-1" />
                    <p className="text-xl font-bold text-foreground">
                      {user.stats?.messagesSent || 0}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">Mensajes</p>
                </div>

                <div className="glass-effect p-3 rounded-lg border border-border text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Calendar className="w-4 h-4 text-green-400 mr-1" />
                    <p className="text-xl font-bold text-foreground">
                      {user.stats?.daysActive || 0}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">Días activo</p>
                </div>

                <div className="glass-effect p-3 rounded-lg border border-border text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Users className="w-4 h-4 text-purple-400 mr-1" />
                    <p className="text-xl font-bold text-foreground">
                      {user.stats?.roomsVisited || 0}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">Salas visitadas</p>
                </div>

                <div className="glass-effect p-3 rounded-lg border border-border text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Heart className="w-4 h-4 text-pink-400 mr-1" />
                    <p className="text-xl font-bold text-foreground">
                      {favorites.length}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">Favoritos</p>
                </div>
              </div>
            </div>
          </div>

          {/* Acciones */}
          {!isOwnProfile && (
            <div className="flex gap-4 mt-6 px-6 pb-6">
              <Button
                onClick={() => {
                  onReport();
                  onClose();
                }}
                variant="outline"
                className="flex-1 border-red-500 text-red-500 hover:bg-red-500/10 hover:text-red-400"
              >
                <Flag className="w-4 h-4 mr-2" /> Reportar
              </Button>
              <Button
                onClick={handleBlockUser}
                variant="outline"
                disabled={userIsBlocked}
                className="flex-1 border-orange-500 text-orange-500 hover:bg-orange-500/10 hover:text-orange-400 disabled:opacity-50"
              >
                <Ban className="w-4 h-4 mr-2" /> {userIsBlocked ? 'Bloqueado' : 'Bloquear'}
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 z-50 text-muted-foreground"
          >
            <X className="w-5 h-5" />
          </Button>
        </DialogContent>
      </motion.div>

      {/* Modal de todos los favoritos */}
      {showAllFavorites && (
        <FavoritesModal
          favorites={favorites}
          onClose={() => setShowAllFavorites(false)}
          onSelectFavorite={(fav) => {
            if (onSelectUser) {
              onSelectUser(fav);
            }
          }}
        />
      )}
    </Dialog>
  );
};

export default UserProfileModal;