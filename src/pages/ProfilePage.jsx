import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Crown, Shield, Camera, Edit, MessageSquare, CheckCircle, HelpCircle, Ticket, Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import ComingSoonModal from '@/components/ui/ComingSoonModal';
import EditProfileModal from '@/components/profile/EditProfileModal';
import AvatarSelector from '@/components/profile/AvatarSelector';
import PhotoUploadModal from '@/components/profile/PhotoUploadModal';
import ProfileComments from '@/components/profile/ProfileComments';
import CreateTicketModal from '@/components/tickets/CreateTicketModal';
import VerificationExplanationModal from '@/components/verification/VerificationExplanationModal';
import VerificationFAQ from '@/components/verification/VerificationFAQ';
import { getUserVerificationStatus } from '@/services/verificationService';
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
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isAvatarSelectorOpen, setAvatarSelectorOpen] = useState(false);
  const [isPhotoUploadOpen, setPhotoUploadOpen] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState({ name: '', description: '' });
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showVerificationFAQ, setShowVerificationFAQ] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);

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
                  user.role === 'admin'
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
                  {(user.isPremium || user.role === 'admin') && (
                    <CheckCircle className="w-6 h-6 text-[#FFD700]"/>
                  )}
                  {user.verified && !user.isPremium && user.role !== 'admin' && (
                    <CheckCircle className="w-6 h-6 text-[#1DA1F2]"/>
                  )}
                </h1>
                <div className="flex gap-2 justify-center md:justify-start mb-4">
                  {user.verified && (
                    <span className="bg-[#1DA1F2] text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <Shield className="w-4 h-4" />
                      Verificado
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground mb-2">"{user.description || '¡Hola! Soy nuevo en Chactivo.'}"</p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  {user.role && <span className="bg-accent text-cyan-600 dark:text-cyan-300 px-3 py-1 text-sm rounded-full font-medium">{user.role}</span>}
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
                {!user.isPremium && (
                  <Button onClick={() => navigate('/premium')} className="w-full cyan-gradient text-black">
                    <Crown className="w-4 h-4 mr-2" />
                    Hazte Premium
                  </Button>
                )}
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
    </>
  );
};

export default ProfilePage;