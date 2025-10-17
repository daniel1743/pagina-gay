import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Crown, Shield, Camera, Edit, MessageSquare, CheckCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import ComingSoonModal from '@/components/ui/ComingSoonModal';
import EditProfileModal from '@/components/profile/EditProfileModal';
import AvatarSelector from '@/components/profile/AvatarSelector';
import ProfileComments from '@/components/profile/ProfileComments';

const ProfilePage = () => {
  React.useEffect(() => {
    document.title = "Mi Perfil - Chactivo | Chat Gay Chile";
  }, []);

  const navigate = useNavigate();
  const { user, logout, updateProfile } = useAuth();
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isAvatarSelectorOpen, setAvatarSelectorOpen] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState({ name: '', description: '' });

  const handleVerification = () => {
    setComingSoonFeature({
      name: 'la verificación de cuenta',
      description: 'Podrás verificar tu identidad para obtener una insignia de verificación y mayor confianza en la comunidad. ¡Pronto estará disponible!'
    });
    setShowComingSoon(true);
  };

  const handleChangePicture = () => {
    setAvatarSelectorOpen(true);
  };

  const handleAvatarSelect = (newAvatar) => {
    updateProfile({ avatar: newAvatar });
    toast({
      title: "¡Avatar actualizado!",
      description: "Tu nuevo avatar está listo. ✨",
    });
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
                <div className={`rounded-full ${user.isPremium ? 'premium-avatar-ring' : ''}`}>
                    <Avatar className="w-32 h-32 md:w-40 md:h-40">
                    <AvatarImage src={user.avatar} alt={user.username} />
                    <AvatarFallback className="text-4xl bg-[#413e62]">
                        {user.username[0].toUpperCase()}
                    </AvatarFallback>
                    </Avatar>
                </div>
                <Button onClick={handleChangePicture} size="icon" className="absolute bottom-1 right-1 rounded-full magenta-gradient">
                  <Camera className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 flex items-center justify-center md:justify-start gap-2">
                  {user.username}
                  {user.isPremium && <CheckCircle className="w-6 h-6 text-cyan-400"/>}
                </h1>
                <div className="flex gap-2 justify-center md:justify-start mb-4">
                  {user.verified && (
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
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
                {!user.verified && (
                  <Button onClick={handleVerification} variant="outline" className="w-full border-green-500 text-green-400 hover:bg-green-500/20">
                    <Shield className="w-4 h-4 mr-2" />
                    Verificar Cuenta
                  </Button>
                )}
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

      <ComingSoonModal
        isOpen={showComingSoon}
        onClose={() => setShowComingSoon(false)}
        feature={comingSoonFeature.name}
        description={comingSoonFeature.description}
      />
    </>
  );
};

export default ProfilePage;