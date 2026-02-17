/**
 * Página para ver el perfil público de otro usuario
 * Ruta: /profile/:userId
 * Muestra foto, rol, intereses, descripción, estado
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { usePrivateChat } from '@/contexts/PrivateChatContext';
import { getPublicProfile } from '@/services/userService';
import { getOrCreatePrivateChat } from '@/services/socialService';
import PublicProfileView from '@/components/profile/PublicProfileView';
import { toast } from '@/components/ui/use-toast';

const ProfileViewPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { setActivePrivateChat } = usePrivateChat();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const data = await getPublicProfile(userId);
        setProfile(data);
      } catch (error) {
        console.error('Error loading profile:', error);
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  const handleEnviarMensaje = async () => {
    if (!currentUser?.id || !profile?.id || currentUser.id === profile.id) return;
    if (currentUser.isGuest || currentUser.isAnonymous) {
      toast({
        title: 'Regístrate para enviar mensajes',
        description: 'Necesitas una cuenta para iniciar conversaciones.',
        variant: 'default',
      });
      return;
    }

    try {
      const { chatId } = await getOrCreatePrivateChat(currentUser.id, profile.id);
      setActivePrivateChat({
        chatId,
        partner: {
          id: profile.id,
          userId: profile.id,
          username: profile.username,
          avatar: profile.avatar,
        },
        roomId: null,
      });
      toast({
        title: 'Chat abierto',
        description: `Puedes conversar con ${profile.username}`,
      });
    } catch (error) {
      console.error('Error opening chat:', error);
      toast({
        title: 'No se pudo abrir el chat',
        description: error?.message || 'Intenta de nuevo.',
        variant: 'destructive',
      });
    }
  };

  const isOwnProfile = currentUser?.id === userId;

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="glass-effect rounded-3xl p-6 md:p-8"
        >
          <PublicProfileView profile={profile} isLoading={isLoading} />

          {!isLoading && profile && !isOwnProfile && currentUser && (
            <div className="mt-6 pt-6 border-t border-border">
              <Button
                onClick={handleEnviarMensaje}
                className="w-full magenta-gradient"
                disabled={currentUser.isGuest || currentUser.isAnonymous}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Enviar mensaje
              </Button>
            </div>
          )}

          {!isLoading && profile && isOwnProfile && (
            <div className="mt-6 pt-6 border-t border-border">
              <Button
                onClick={() => navigate('/profile')}
                variant="outline"
                className="w-full"
              >
                Editar mi perfil
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ProfileViewPage;
