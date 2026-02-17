import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Crown, Shield, Camera, Edit, MessageSquare, CheckCircle, HelpCircle, Ticket, Upload, Image as ImageIcon, Heart, Plus, Settings } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import ComingSoonModal from '@/components/ui/ComingSoonModal';
import EditProfileModal from '@/components/profile/EditProfileModal';
import AvatarSelector from '@/components/profile/AvatarSelector';
import PhotoUploadModal from '@/components/profile/PhotoUploadModal';
import ProfileComments from '@/components/profile/ProfileComments';
import CreateTicketModal from '@/components/tickets/CreateTicketModal';
import VerificationExplanationModal from '@/components/verification/VerificationExplanationModal';
import VerificationFAQ from '@/components/verification/VerificationFAQ';
import FavoritesModal from '@/components/chat/FavoritesModal';
import UserActionsModal from '@/components/chat/UserActionsModal';
import { getUserVerificationStatus } from '@/services/verificationService';
import { getFavorites } from '@/services/socialService';
import { useCanonical } from '@/hooks/useCanonical';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ProfilePage = () => {
  // SEO: Canonical tag para página de perfil
  useCanonical('/profile');

  React.useEffect(() => {
    document.title = "Mi Perfil - Chactivo | Chat Gay Chile";
  }, []);

  const navigate = useNavigate();
  const { user, logout, updateProfile } = useAuth();
  const hasProVisual = Boolean(
    user?.isProUser ||
    user?.hasRainbowBorder ||
    user?.hasProBadge ||
    user?.hasFeaturedCard ||
    user?.canUploadSecondPhoto
  );
  const roleValue = (user?.role || '').toString().toLowerCase();
  const isAdminRole = roleValue === 'admin' || roleValue === 'administrator' || roleValue === 'superadmin';
  const displayProfileRole = user?.profileRole || (!['admin', 'administrator', 'superadmin', 'support', 'user'].includes(roleValue) ? user?.role : '');
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isAvatarSelectorOpen, setAvatarSelectorOpen] = useState(false);
  const [isPhotoUploadOpen, setPhotoUploadOpen] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState({ name: '', description: '' });
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showVerificationFAQ, setShowVerificationFAQ] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [showAllFavorites, setShowAllFavorites] = useState(false);
  const [selectedFavorite, setSelectedFavorite] = useState(null);

  // Cargar estado de verificación
  useEffect(() => {
    if (user && !user.isGuest && !user.isAnonymous) {
      const loadVerificationStatus = async () => {
        const status = await getUserVerificationStatus(user.id);
        setVerificationStatus(status);
      };
      loadVerificationStatus();
    }
  }, [user]);

  // Cargar favoritos del usuario
  useEffect(() => {
    const loadFavorites = async () => {
      if (user && !user.isGuest && !user.isAnonymous) {
        setLoadingFavorites(true);
        try {
          const userFavorites = await getFavorites(user.id);
          setFavorites(userFavorites || []);
        } catch (error) {
          console.error('Error loading favorites:', error);
        } finally {
          setLoadingFavorites(false);
        }
      }
    };

    loadFavorites();
  }, [user]);

  const handleVerification = () => {
    setShowVerificationModal(true);
  };

  const handleChangePicture = () => {
    setAvatarSelectorOpen(true);
  };

  const handleUploadPhoto = () => {
    setPhotoUploadOpen(true);
  };

  const handlePhotoUploadSuccess = async (photoURL) => {
    // La foto ya se actualizó en el perfil a través de updateProfile en PhotoUploadModal
    // Solo necesitamos actualizar el estado local si es necesario
    try {
      await updateProfile({ avatar: photoURL });
    } catch (error) {
      console.error('Error actualizando foto en perfil:', error);
    }
  };

  const handleAvatarSelect = async (newAvatar) => {
    // El AvatarSelector ya guarda en Firebase, solo actualizamos el estado local
    try {
      await updateProfile({ avatar: newAvatar });
      // El toast ya se muestra en AvatarSelector, no es necesario duplicar
    } catch (error) {
      console.error('Error actualizando avatar en perfil:', error);
    }
  };

  if (!user) {
    return null; 
  }

  return (
    <>
      <div className="min-h-screen px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-6 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Lobby
          </Button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="glass-effect rounded-3xl p-8"
          >
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-8">
              <div className="relative">
                <div className={`rounded-full ${
                  hasProVisual
                    ? 'rainbow-avatar-ring'
                    : isAdminRole
                    ? 'admin-avatar-ring'
                    : user.verified
                      ? 'verified-avatar-ring'
                      : user.isPremium
                        ? 'premium-avatar-ring'
                        : ''
                }`}>
                    <Avatar className="w-32 h-32 md:w-40 md:h-40">
                    <AvatarImage src={user.avatar} alt={user.username} />
                    <AvatarFallback className="text-4xl bg-[#413e62]">
                        {user.username[0].toUpperCase()}
                    </AvatarFallback>
                    </Avatar>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" className="absolute bottom-1 right-1 rounded-full magenta-gradient">
                      <Camera className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-card border-border text-foreground min-w-[200px]">
                    <DropdownMenuItem onClick={handleUploadPhoto} className="cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      Subir Foto
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleChangePicture} className="cursor-pointer">
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Elegir Avatar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 flex items-center justify-center md:justify-start gap-2">
                  {user.username}
                  {hasProVisual && (
                    <span className="inline-flex items-center gap-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-[9px] font-bold px-1.5 py-0.5 rounded text-white uppercase tracking-wider">
                      PRO
                    </span>
                  )}
                  {(user.isPremium || isAdminRole) && (
                    <CheckCircle className="w-6 h-6 text-[#FFD700]"/>
                  )}
                  {user.verified && !user.isPremium && !isAdminRole && (
                    <CheckCircle className="w-6 h-6 text-[#1DA1F2]"/>
                  )}
                </h1>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-4">
                  {hasProVisual && (
                    <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <Crown className="w-4 h-4" />
                      Usuario PRO
                    </span>
                  )}
                  {user.verified && (
                    <span className="bg-[#1DA1F2] text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <Shield className="w-4 h-4" />
                      Verificado
                    </span>
                  )}
                  {user.profileVisible === false && (
                    <span className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-xs flex items-center gap-1">
                      Perfil oculto — otros no pueden verlo
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground mb-2">"{user.description || '¡Hola! Soy nuevo en Chactivo.'}"</p>
                {user.estado && (
                  <p className="text-sm font-medium text-cyan-400 mb-2">{user.estado}</p>
                )}
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  {displayProfileRole && <span className="bg-accent text-cyan-600 dark:text-cyan-300 px-3 py-1 text-sm rounded-full font-medium">{displayProfileRole}</span>}
                  {user.interests?.map(interest => (
                    <span key={interest} className="bg-accent text-foreground px-3 py-1 text-sm rounded-full">{interest}</span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Button onClick={() => setEditModalOpen(true)} className="w-full magenta-gradient">
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Perfil
                </Button>

                {/* 🛡️ PANEL DE ADMINISTRADOR - Solo visible para admins */}
                {isAdminRole && (
                  <Button
                    onClick={() => navigate('/admin')}
                    variant="outline"
                    className="w-full border-purple-500 text-purple-400 hover:bg-purple-500/20 font-semibold"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Panel de Admin
                  </Button>
                )}

                <Button onClick={() => setShowTicketModal(true)} variant="outline" className="w-full border-orange-500 text-orange-400 hover:bg-orange-500/20">
                  <Ticket className="w-4 h-4 mr-2" />
                  Crear Ticket
                </Button>
                <Button 
                  onClick={handleVerification} 
                  variant="outline" 
                  className={`w-full ${user.verified 
                    ? 'border-green-500 text-green-400 hover:bg-green-500/20' 
                    : 'border-blue-500 text-blue-400 hover:bg-blue-500/20'
                  }`}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  {user.verified ? 'Verificación' : 'Verificar Cuenta'}
                </Button>
                <Button
                  onClick={() => setShowVerificationFAQ(!showVerificationFAQ)}
                  variant="ghost"
                  className="w-full"
                >
                  <HelpCircle className="w-4 h-4 mr-2" />
                  Preguntas sobre Verificación
                </Button>
                {/* Temporalmente oculto
                {!user.isPremium && (
                  <Button onClick={() => navigate('/premium')} className="w-full cyan-gradient text-black">
                    <Crown className="w-4 h-4 mr-2" />
                    Hazte Premium
                  </Button>
                )}
                */}
                 <Button onClick={logout} variant="destructive" className="w-full">
                  Cerrar Sesión
                </Button>
            </div>

            {/* Estado de Verificación */}
            {!user.verified && verificationStatus && (
              <div className="mt-8 mb-8 glass-effect p-6 rounded-xl border border-blue-500/30">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-400" />
                    Progreso de Verificación
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    {verificationStatus.consecutiveDays} / 30 días
                  </span>
                </div>
                <div className="w-full bg-background rounded-full h-3 mb-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (verificationStatus.consecutiveDays / 30) * 100)}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {verificationStatus.daysUntilVerification > 0 
                    ? `Te faltan ${verificationStatus.daysUntilVerification} días consecutivos para verificarte`
                    : '¡Estás a punto de verificarte!'
                  }
                </p>
              </div>
            )}

            {/* Preguntas Frecuentes sobre Verificación */}
            {showVerificationFAQ && (
              <div className="mt-8 mb-8 glass-effect p-6 rounded-xl border border-border">
                <VerificationFAQ />
              </div>
            )}

            {/* Sección de Lista de Amigos */}
            <div className="mt-8 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Heart className="w-6 h-6 text-pink-400" />
                  Lista de Amigos
                </h2>
                <span className="text-sm text-muted-foreground">
                  {favorites.length}/15
                </span>
              </div>

              {loadingFavorites ? (
                <div className="glass-effect p-6 rounded-xl border border-border">
                  <p className="text-center text-muted-foreground">Cargando favoritos...</p>
                </div>
              ) : favorites.length > 0 ? (
                <div className="glass-effect p-6 rounded-xl border border-border">
                  <div className="flex flex-wrap gap-3">
                    {/* Mostrar hasta 5 favoritos */}
                    {favorites.slice(0, 5).map((fav) => (
                      <motion.button
                        key={fav.id}
                        onClick={() => setSelectedFavorite(fav)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex flex-col items-center gap-2 group"
                        title={`Ver perfil de ${fav.username}`}
                      >
                        <div className="relative">
                          <Avatar className="w-16 h-16 border-2 border-pink-500/30 group-hover:border-pink-400 transition-colors">
                            <AvatarImage src={fav.avatar} alt={fav.username} />
                            <AvatarFallback className="bg-secondary text-sm">
                              {fav.username?.[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {fav.isOnline && (
                            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-card rounded-full"></div>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground group-hover:text-foreground truncate max-w-[64px] transition-colors">
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
                        className="flex flex-col items-center justify-center gap-2 group"
                        title="Ver todos los favoritos"
                      >
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 border-2 border-pink-500/30 group-hover:border-pink-400 flex items-center justify-center transition-colors">
                          <Plus className="w-8 h-8 text-pink-400 group-hover:text-pink-300" />
                        </div>
                        <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                          +{favorites.length - 5}
                        </span>
                      </motion.button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="glass-effect p-6 rounded-xl border border-border">
                  <div className="text-center py-8">
                    <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
                    <p className="text-muted-foreground">
                      Aún no has agregado amigos
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Agrega usuarios a tu lista desde el chat para acceso rápido
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-12">
              <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                <MessageSquare />
                Comentarios del Perfil
              </h2>
              <ProfileComments />
            </div>

          </motion.div>
        </div>
      </div>
      
      {isEditModalOpen && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setEditModalOpen(false)}
        />
      )}

      {isAvatarSelectorOpen && (
        <AvatarSelector
          isOpen={isAvatarSelectorOpen}
          onClose={() => setAvatarSelectorOpen(false)}
          currentAvatar={user.avatar}
          onSelect={handleAvatarSelect}
        />
      )}

      {isPhotoUploadOpen && (
        <PhotoUploadModal
          isOpen={isPhotoUploadOpen}
          onClose={() => setPhotoUploadOpen(false)}
          onUploadSuccess={handlePhotoUploadSuccess}
        />
      )}

      <ComingSoonModal
        isOpen={showComingSoon}
        onClose={() => setShowComingSoon(false)}
        feature={comingSoonFeature.name}
        description={comingSoonFeature.description}
      />

      <CreateTicketModal
        isOpen={showTicketModal}
        onClose={() => setShowTicketModal(false)}
        user={user}
      />

      <VerificationExplanationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        verificationStatus={verificationStatus}
      />

      {/* Modal de todos los favoritos */}
      {showAllFavorites && (
        <FavoritesModal
          favorites={favorites}
          onClose={() => setShowAllFavorites(false)}
          onSelectFavorite={(fav) => {
            setSelectedFavorite(fav);
            setShowAllFavorites(false);
          }}
        />
      )}

      {/* Modal de acciones para favorito seleccionado */}
      {selectedFavorite && (
        <UserActionsModal
          user={{
            username: selectedFavorite.username,
            avatar: selectedFavorite.avatar,
            userId: selectedFavorite.id,
            isPremium: selectedFavorite.isPremium,
            verified: selectedFavorite.verified,
            role: selectedFavorite.role,
            isAnonymous: false,
            isGuest: false,
          }}
          onClose={() => setSelectedFavorite(null)}
          onViewProfile={() => {
            navigate(`/profile/${selectedFavorite.id}`);
          }}
          onShowRegistrationModal={() => {
            // No aplica en esta página
          }}
        />
      )}
    </>
  );
};

export default ProfilePage;
