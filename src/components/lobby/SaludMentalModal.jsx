import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Bot, Users, User, Shield, MessageCircle, Crown } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const SaludMentalModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleNavigation = (path) => {
    onClose();
    navigate(path);
  };
  
  const handleFeatureClick = (feature) => {
    switch(feature) {
      case 'ai-chat':
        if (user.isPremium) {
           toast({
            title: '🚧 IA de Apoyo en desarrollo',
            description: 'Pronto podrás conversar con nuestra IA especializada.',
          });
        } else {
           toast({
            title: '👑 Función Premium',
            description: 'El chat con IA es una función exclusiva para miembros Premium.',
            action: <Button onClick={() => handleNavigation('/premium')}>Ver Premium</Button>,
          });
        }
        break;
      case 'psychologist':
        toast({
          title: '🚧 Psicólogos Reales Próximamente',
          description: 'Estamos trabajando para conectar a profesionales contigo. Te avisaremos cuando esté listo.',
        });
        break;
      case 'anonymous-chat':
        handleNavigation('/anonymous-chat');
        break;
      case 'forum':
        handleNavigation('/anonymous-chat');
        break;
      default:
        break;
    }
  };

  const options = [
    {
      id: 'anonymous-chat',
      title: 'Sala de Apoyo Anónima',
      description: 'Conecta y habla libremente con otros en un espacio 100% anónimo.',
      icon: <Users className="w-8 h-8 text-cyan-400" />,
      premium: false,
    },
    {
      id: 'ai-chat',
      title: 'Chat con IA de Apoyo',
      description: 'Una IA entrenada para escucharte y ofrecerte apoyo emocional 24/7.',
      icon: <Bot className="w-8 h-8 text-purple-400" />,
      premium: true,
    },
     {
      id: 'forum',
      title: 'Foro Anónimo',
      description: 'Haz preguntas y comparte experiencias en un foro moderado y seguro.',
      icon: <MessageCircle className="w-8 h-8 text-yellow-400" />,
      premium: false,
    },
    {
      id: 'psychologist',
      title: 'Habla con un Psicólogo',
      description: 'Conéctate con psicólogos profesionales para una sesión (próximamente).',
      icon: <User className="w-8 h-8 text-green-400" />,
      premium: false,
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border text-foreground max-w-2xl rounded-2xl p-0">
        <DialogHeader className="p-6">
          <DialogTitle className="text-3xl font-extrabold flex items-center gap-3">
            <Shield className="w-8 h-8 text-cyan-400" />
            Centro de Salud Mental
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Tu espacio seguro para el bienestar emocional. No estás solo/a.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 max-h-[70vh] overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 scrollbar-hide">
          {options.map((option, index) => (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onClick={() => handleFeatureClick(option.id)}
              className="relative glass-effect p-6 rounded-xl flex flex-col gap-4 cursor-pointer hover:border-cyan-400 transition-all border"
            >
              <div className="flex items-center gap-4">
                {option.icon}
                <h3 className="text-xl font-bold text-foreground">{option.title}</h3>
              </div>
              <p className="text-muted-foreground text-sm">{option.description}</p>
              {option.premium && (
                <div className="absolute top-3 right-3 flex items-center gap-1 text-xs font-bold text-black bg-gradient-to-r from-purple-400 to-pink-500 px-2 py-1 rounded-full">
                  <Crown className="w-3 h-3"/> Premium
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-4 right-4 z-50 text-muted-foreground hover:text-foreground">
          <X className="w-6 h-6" />
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default SaludMentalModal;
