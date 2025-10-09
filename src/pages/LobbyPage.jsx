import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { MessageSquare, Shield, Calendar, HeartPulse, SlidersHorizontal, Users } from 'lucide-react';
import LobbyCard from '@/components/lobby/LobbyCard';
import RoomsModal from '@/components/lobby/RoomsModal';
import DenunciaModal from '@/components/lobby/DenunciaModal';
import EventosModal from '@/components/lobby/EventosModal';
import SaludMentalModal from '@/components/lobby/SaludMentalModal';
import AjustesModal from '@/components/lobby/AjustesModal';
import { toast } from '@/components/ui/use-toast';

const cardData = [
  { id: 'salas', icon: <MessageSquare className="w-12 h-12" />, title: "Salas de Chat", description: "Explora y únete a nuestras salas temáticas. ¡Siempre hay alguien con quien conectar!", modal: 'RoomsModal', gradient: "blue-gradient" },
  { id: 'denuncias', icon: <Shield className="w-12 h-12" />, title: "Centro de Denuncias", description: "Ayúdanos a mantener la comunidad segura. Reporta cualquier comportamiento inadecuado.", modal: 'DenunciaModal', gradient: "amber-gradient" },
  { id: 'eventos', icon: <Calendar className="w-12 h-12" />, title: "Eventos y Noticias", description: "Mantente al día con los últimos eventos, fiestas y noticias de la comunidad.", modal: 'EventosModal', gradient: "green-gradient" },
  { id: 'salud', icon: <HeartPulse className="w-12 h-12" />, title: "Salud Mental LGBTQ+", description: "Un espacio seguro y anónimo para hablar, encontrar apoyo y conectar con profesionales.", modal: 'SaludMentalModal', gradient: "teal-gradient" },
  { id: 'ajustes', icon: <SlidersHorizontal className="w-12 h-12" />, title: "Ajustes y Tienda", description: "Personaliza tu experiencia. ¡Exclusivo para miembros Premium!", modal: 'AjustesModal', gradient: "purple-gradient" },
  { id: 'proximamente', icon: <Users className="w-12 h-12" />, title: "Comunidades", description: "Crea y únete a grupos más pequeños con tus intereses específicos. ¡Próximamente!", modal: 'ComingSoon', gradient: "pink-gradient" },
];

const NewsTicker = () => {
  const newsItems = [
    { id: 1, text: "Noticia de Último Minuto: Nueva Ley de Igualdad Aprobada." },
    { id: 2, text: "Este Viernes: Fiesta Flúor en Club Divino. ¡No te la pierdas!" },
    { id: 3, text: "Charla sobre salud sexual este miércoles vía Zoom. Link en 'Eventos'." },
    { id: 4, text: "Campaña de donación de sangre para la comunidad. ¡Participa!" },
    { id: 5, text: "Chactivo busca moderadores voluntarios. Postula en nuestro Discord." },
  ];

  return (
    <div className="relative w-full overflow-hidden carousel-container py-4 my-8">
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-10"></div>
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-10"></div>
      <div className="flex animate-marquee">
        {newsItems.concat(newsItems).map((item, index) => (
          <div key={index} className="flex-shrink-0 mx-8 flex items-center">
            <span className="text-lg font-semibold text-muted-foreground whitespace-nowrap">{item.text}</span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 60s linear infinite;
        }
      `}</style>
    </div>
  );
};

const VideoSection = () => {
  const videos = [
    { id: 1, title: "Resumen Marcha del Orgullo 2024", thumbnailText: "Resumen Marcha 2024" },
    { id: 2, title: "Entrevista a activista LGBTQ+", thumbnailText: "Entrevista a Activista" },
    { id: 3, title: "Tips para una cita segura", thumbnailText: "Citas Seguras" },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 className="text-3xl font-bold text-center mb-8">Videos Destacados</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {videos.map(video => (
          <motion.div 
            key={video.id}
            className="glass-effect rounded-2xl p-4 cursor-pointer"
            whileHover={{ scale: 1.05, y: -5 }}
            onClick={() => toast({ title: '🚧 Videos en desarrollo', description: 'Pronto podrás ver este video aquí.' })}
          >
            <div className="aspect-video bg-secondary rounded-lg mb-4 flex items-center justify-center">
              <span className="text-muted-foreground text-center px-2">{video.thumbnailText}</span>
            </div>
            <h3 className="font-bold text-lg">{video.title}</h3>
          </motion.div>
        ))}
      </div>
    </div>
  );
};


const LobbyPage = () => {
  const [activeModal, setActiveModal] = useState(null);

  const handleCardClick = (modalId) => {
    if (modalId === 'ComingSoon') {
        toast({
            title: "🚧 ¡Próximamente!",
            description: "Esta sección está en construcción. ¡Vuelve pronto!",
        });
        return;
    }
    setActiveModal(modalId);
  };
  
  const closeModal = () => {
    setActiveModal(null);
  };
  
  return (
    <>
      <Helmet>
        <title>Lobby - Chactivo</title>
        <meta name="description" content="Bienvenido al lobby de Chactivo. Conecta con la comunidad." />
      </Helmet>

      <div className="w-full min-h-screen pt-12 pb-20">
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8 px-4"
        >
            <h1 className="text-4xl md:text-5xl font-extrabold mb-2">Bienvenido a Chactivo</h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">Tu espacio para conectar, compartir y crecer. Explora nuestras salas y eventos.</p>
        </motion.div>

        <NewsTicker />
        
        <div className="px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto mb-16">
              {cardData.map((card, index) => (
                <LobbyCard
                  key={card.id}
                  icon={card.icon}
                  title={card.title}
                  description={card.description}
                  onClick={() => handleCardClick(card.modal)}
                  gradient={card.gradient}
                  index={index}
                />
              ))}
            </div>
        </div>
        
        <div className="mb-16">
          <VideoSection />
        </div>

      </div>

      {activeModal === 'RoomsModal' && <RoomsModal isOpen={true} onClose={closeModal} />}
      {activeModal === 'DenunciaModal' && <DenunciaModal isOpen={true} onClose={closeModal} />}
      {activeModal === 'EventosModal' && <EventosModal isOpen={true} onClose={closeModal} />}
      {activeModal === 'SaludMentalModal' && <SaludMentalModal isOpen={true} onClose={closeModal} />}
      {activeModal === 'AjustesModal' && <AjustesModal isOpen={true} onClose={closeModal} />}

    </>
  );
};

export default LobbyPage;