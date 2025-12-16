import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, Shield, Calendar, HeartPulse, SlidersHorizontal, Users, Lock, MapPin } from 'lucide-react';
import LobbyCard from '@/components/lobby/LobbyCard';
import RoomsModal from '@/components/lobby/RoomsModal';
import DenunciaModal from '@/components/lobby/DenunciaModal';
import EventosModal from '@/components/lobby/EventosModal';
import SaludMentalModal from '@/components/lobby/SaludMentalModal';
import AjustesModal from '@/components/lobby/AjustesModal';
import NearbyUsersModal from '@/components/lobby/NearbyUsersModal';
import GlobalStats from '@/components/lobby/GlobalStats';
import AdCarousel from '@/components/lobby/AdCarousel';
import AdModal from '@/components/lobby/AdModal';
import PWAInstallBanner from '@/components/ui/PWAInstallBanner';
import ComingSoonModal from '@/components/ui/ComingSoonModal';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { trackPageView, trackPageExit } from '@/services/analyticsService';
import { useCanonical } from '@/hooks/useCanonical';

const cardData = [
  { id: 'salas', icon: <MessageSquare className="w-12 h-12" />, title: "Salas de Chat", description: "Explora y únete a nuestras salas temáticas. ¡Siempre hay alguien con quien conectar!", modal: 'RoomsModal', gradient: "blue-gradient" },
  { id: 'cercanos', icon: <MapPin className="w-12 h-12" />, title: "Click Aquí", description: "Descubre usuarios cercanos a ti. Conéctate con personas en tu zona. ¡Haz click!", modal: 'NearbyUsersModal', gradient: "magenta-gradient" },
  { id: 'denuncias', icon: <Shield className="w-12 h-12" />, title: "Centro de Denuncias", description: "Ayúdanos a mantener la comunidad segura. Reporta cualquier comportamiento inadecuado.", modal: 'DenunciaModal', gradient: "amber-gradient" },
  { id: 'eventos', icon: <Calendar className="w-12 h-12" />, title: "Eventos y Noticias", description: "Mantente al día con los últimos eventos, fiestas y noticias de la comunidad.", modal: 'EventosModal', gradient: "green-gradient" },
  { id: 'salud', icon: <HeartPulse className="w-12 h-12" />, title: "Salud Mental LGBTQ+", description: "Un espacio seguro y anónimo para hablar, encontrar apoyo y conectar con profesionales.", modal: 'SaludMentalModal', gradient: "teal-gradient" },
  { id: 'ajustes', icon: <SlidersHorizontal className="w-12 h-12" />, title: "Ajustes y Tienda", description: "Personaliza tu experiencia. ¡Exclusivo para miembros Premium!", modal: 'AjustesModal', gradient: "purple-gradient" },
  { id: 'proximamente', icon: <Users className="w-12 h-12" />, title: "Comunidades", description: "Crea y únete a grupos más pequeños con tus intereses específicos. ¡Próximamente!", modal: 'ComingSoon', gradient: "pink-gradient" },
];

const NewsTicker = () => {
  const newsItems = [
    { id: 1, text: "🏳️‍🌈 Chile avanza en reconocimiento de familias homoparentales - Proyecto de ley ingresa al Congreso" },
    { id: 2, text: "🎉 Este sábado: Fiesta Pride en Blondie - Providencia, Santiago. DJs invitados desde las 23:00hrs" },
    { id: 3, text: "💉 Campaña de testeo VIH gratuito en Fundación Savia - Barrio Bellavista, miércoles 10-18hrs" },
    { id: 4, text: "📚 Charla virtual sobre salud mental LGBT+ este jueves 19:00hrs. Cupos limitados - Inscríbete en 'Eventos'" },
    { id: 5, text: "🌈 Marcha del Orgullo Santiago 2025 confirmada para junio - Convocatoria abierta para organizaciones" },
    { id: 6, text: "⚽ Liga deportiva LGBT+ Chile abre inscripciones - Fútbol, vóley y básquet. Info en Eventos" },
    { id: 7, text: "🎭 Festival de cine Diversa presenta películas queer latinoamericanas - Centro Cultural La Moneda" },
    { id: 8, text: "💼 Feria laboral inclusiva LGBT+ en Mall Plaza Vespucio - Empresas certificadas OTD este viernes" },
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

const VideoSection = ({ onComingSoon }) => {
  const videos = [
    { id: 1, title: "Marcha del Orgullo Santiago 2024 - Resumen y mejores momentos", thumbnailText: "🏳️‍🌈 Pride Santiago 2024", description: "Miles de personas marcharon por Alameda exigiendo igualdad de derechos" },
    { id: 2, title: "Testimonios: Vivir siendo LGBT+ en Chile", thumbnailText: "🎤 Voces de la comunidad", description: "Historias reales de jóvenes LGBT+ en Santiago y regiones" },
    { id: 3, title: "Guía práctica: Citas seguras y consentimiento", thumbnailText: "💕 Citas Seguras", description: "Tips de seguridad para encuentros, apps de citas y red flags a detectar" },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 className="text-3xl font-bold text-center mb-8">Videos Destacados</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {videos.map(video => (
          <motion.div
            key={video.id}
            className="glass-effect rounded-2xl p-4 cursor-pointer hover:border-accent/50 transition-colors"
            whileHover={{ scale: 1.05, y: -5 }}
            onClick={() => onComingSoon('la sección de videos', 'Pronto podrás ver contenido educativo, entretenimiento LGBT+ y testimonios de la comunidad directamente aquí.')}
          >
            <div className="aspect-video bg-gradient-to-br from-secondary to-secondary/50 rounded-lg mb-4 flex items-center justify-center border border-border">
              <span className="text-lg font-bold text-center px-4">{video.thumbnailText}</span>
            </div>
            <h3 className="font-bold text-lg mb-2 text-foreground">{video.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{video.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};


const LobbyPage = () => {
  // SEO: Canonical tag para homepage
  useCanonical('/');

  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeModal, setActiveModal] = useState(null);
  const [showAuthRequired, setShowAuthRequired] = useState(false);
  const [selectedAd, setSelectedAd] = useState(null);
  const [showAdModal, setShowAdModal] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState({ name: '', description: '' });

  const handleCardClick = (modalId) => {
    // "Próximamente" siempre es accesible
    if (modalId === 'ComingSoon') {
        setComingSoonFeature({
          name: 'las Comunidades',
          description: 'Podrás crear y unirte a grupos más pequeños con tus intereses específicos: hobbies, deportes, series, política, y mucho más.'
        });
        setShowComingSoon(true);
        return;
    }

    // "Salas de Chat" y "Click Aquí" son accesibles para todos
    if (modalId !== 'RoomsModal' && modalId !== 'NearbyUsersModal' && user && (user.isAnonymous || user.isGuest)) {
        setShowAuthRequired(true);
        return;
    }

    setActiveModal(modalId);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const handleGoToRegister = () => {
    setShowAuthRequired(false);
    navigate('/?action=register');
  };

  const handleGoToLogin = () => {
    setShowAuthRequired(false);
    navigate('/?action=login');
  };

  const handleAdClick = (ad) => {
    setSelectedAd(ad);
    setShowAdModal(true);
  };

  const closeAdModal = () => {
    setShowAdModal(false);
    setSelectedAd(null);
  };

  const handleFeatureComingSoon = (featureName, description = '') => {
    setComingSoonFeature({ name: featureName, description });
    setShowComingSoon(true);
  };

  useEffect(() => {
    document.title = "Lobby - Chactivo | Chat Gay Chile";
    // Track page view
    trackPageView('/lobby', 'Lobby - Chactivo');
    
    // Track page exit
    return () => {
      trackPageExit('/lobby', 0);
    };
  }, []);

  // Determinar si mostrar Hero Section (solo para usuarios no autenticados o invitados)
  const showHeroSection = !user || user.isGuest || user.isAnonymous;

  return (
    <>
      <div className="w-full min-h-screen pt-12 pb-20">
        {/* 🔥 HERO SECTION - Solo visible para usuarios no registrados o invitados */}
        {showHeroSection && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative px-4 py-12 mb-8 overflow-hidden"
          >
          {/* Fondo degradado animado */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20 animate-pulse"></div>

          <div className="relative max-w-5xl mx-auto">
            {/* Contador de usuarios en tiempo real */}
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex items-center justify-center gap-3 mb-6"
            >
              <div className="relative">
                {/* Dot pulsante */}
                <span className="absolute inline-flex h-4 w-4 rounded-full bg-green-400 opacity-75 animate-ping"></span>
                <span className="relative inline-flex h-4 w-4 rounded-full bg-green-500"></span>
              </div>
              <div className="glass-effect px-6 py-3 rounded-full border border-green-500/30">
                <p className="text-sm text-muted-foreground">
                  <span className="text-3xl font-bold text-green-400 mr-2">Activo</span>
                  <span className="text-muted-foreground">Chatea con gays de Chile ahora</span>
                </p>
              </div>
            </motion.div>

            {/* Título principal */}
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-5xl md:text-7xl font-extrabold text-center mb-4 bg-gradient-to-r from-[#E4007C] via-pink-400 to-cyan-400 bg-clip-text text-transparent"
            >
              Chat Gay Santiago
            </motion.h1>

            {/* Subtítulo */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xl md:text-2xl text-center text-muted-foreground mb-8 max-w-3xl mx-auto"
            >
              Gratis • Anónimo • 100% Chileno
            </motion.p>

            {/* CTA Principal */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8"
            >
              <button
                onClick={() => handleCardClick('RoomsModal')}
                className="group relative px-12 py-5 magenta-gradient rounded-2xl font-bold text-xl text-white hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-[#E4007C]/50"
              >
                <span className="relative z-10 flex items-center gap-3">
                  🔥 ENTRAR A CHATEAR GRATIS
                  <MessageSquare className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                </span>
                {/* Efecto de brillo */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/0 via-white/25 to-white/0 opacity-0 group-hover:opacity-100 group-hover:animate-shimmer"></div>
              </button>
            </motion.div>

            {/* Preview de salas activas */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8"
            >
              {[
                { emoji: '🐻', name: 'Osos', count: '15', gradient: 'from-orange-500 to-red-500' },
                { emoji: '💪', name: '+30 años', count: '23', gradient: 'from-blue-500 to-cyan-500' },
                { emoji: '🎮', name: 'Gaming', count: '12', gradient: 'from-purple-500 to-pink-500' },
                { emoji: '💬', name: 'Libres', count: '31', gradient: 'from-green-500 to-teal-500' }
              ].map((sala, index) => (
                <motion.div
                  key={sala.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="glass-effect p-4 rounded-xl border border-border hover:border-accent/50 transition-all cursor-pointer hover:scale-105"
                  onClick={() => handleCardClick('RoomsModal')}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2">{sala.emoji}</div>
                    <p className="text-sm font-semibold mb-1">{sala.name}</p>
                    <div className={`inline-block px-3 py-1 rounded-full bg-gradient-to-r ${sala.gradient} text-white text-xs font-bold`}>
                      {sala.count} online
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Prueba social */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="text-center space-y-4"
            >
              <div className="flex items-center justify-center gap-2 text-yellow-500">
                <span className="text-2xl">⭐⭐⭐⭐⭐</span>
                <span className="text-sm text-muted-foreground">Comunidad activa 24/7</span>
              </div>

              <div className="max-w-2xl mx-auto glass-effect p-6 rounded-2xl border border-border">
                <p className="text-sm italic text-muted-foreground mb-2">
                  "Mejor que Grindr para conversación real. Conocí amigos increíbles aquí"
                </p>
                <p className="text-xs text-muted-foreground">- Juan, 28, Providencia</p>
              </div>
            </motion.div>
          </div>

          {/* CSS para animación shimmer */}
          <style>{`
            @keyframes shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
            .animate-shimmer {
              animation: shimmer 2s infinite;
            }
          `}</style>
          </motion.section>
        )}

        {/* Título alternativo para usuarios autenticados (cuando no se muestra Hero Section) */}
        {!showHeroSection && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8 px-4"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Bienvenido de vuelta</h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">¿Qué quieres hacer hoy?</p>
          </motion.div>
        )}

        <NewsTicker />

        {/* Estadísticas Globales - Solo visible para usuarios NO registrados */}
        {showHeroSection && (
          <GlobalStats />
        )}

        {/* Ad Carousel - Solo visible para usuarios autenticados (no anónimos/invitados) */}
        {user && !user.isAnonymous && !user.isGuest && (
          <AdCarousel onAdClick={handleAdClick} />
        )}

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
          <VideoSection onComingSoon={handleFeatureComingSoon} />
        </div>

      </div>

      {activeModal === 'RoomsModal' && <RoomsModal isOpen={true} onClose={closeModal} />}
      {activeModal === 'NearbyUsersModal' && <NearbyUsersModal isOpen={true} onClose={closeModal} />}
      {activeModal === 'DenunciaModal' && <DenunciaModal isOpen={true} onClose={closeModal} />}
      {activeModal === 'EventosModal' && <EventosModal isOpen={true} onClose={closeModal} />}
      {activeModal === 'SaludMentalModal' && <SaludMentalModal isOpen={true} onClose={closeModal} />}
      {activeModal === 'AjustesModal' && <AjustesModal isOpen={true} onClose={closeModal} />}

      {/* Modal de anuncio */}
      <AdModal ad={selectedAd} isOpen={showAdModal} onClose={closeAdModal} />

      {/* Modal de autenticación requerida */}
      <Dialog open={showAuthRequired} onOpenChange={setShowAuthRequired}>
        <DialogContent className="bg-[#22203a] border-[#413e62] text-white max-w-md rounded-2xl">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gradient-to-r from-[#E4007C] to-[#00FFFF] p-3 rounded-full">
                <Lock className="w-8 h-8 text-white" />
              </div>
            </div>
            <DialogTitle className="text-2xl font-extrabold text-center bg-gradient-to-r from-[#E4007C] to-[#00FFFF] bg-clip-text text-transparent">
              Registro Requerido
            </DialogTitle>
            <DialogDescription className="text-gray-300 text-center mt-2">
              Para acceder a esta funcionalidad debes estar registrado e iniciar sesión.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-3">
            <p className="text-sm text-gray-400 text-center">
              ✅ Acceso completo a todas las funcionalidades<br/>
              ✅ Crear y personalizar tu perfil<br/>
              ✅ Participar en eventos y denuncias<br/>
              ✅ Conectar con la comunidad
            </p>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button
              onClick={handleGoToRegister}
              className="flex-1 bg-gradient-to-r from-[#E4007C] to-[#00FFFF] text-white font-bold hover:opacity-90 transition-opacity"
            >
              Ir a Registro
            </Button>
            <Button
              onClick={handleGoToLogin}
              variant="outline"
              className="flex-1 border-[#413e62] text-white hover:bg-[#2C2A4A]"
            >
              Iniciar Sesión
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PWA Install Banner */}
      <PWAInstallBanner />

      {/* Coming Soon Modal */}
      <ComingSoonModal
        isOpen={showComingSoon}
        onClose={() => setShowComingSoon(false)}
        feature={comingSoonFeature.name}
        description={comingSoonFeature.description}
      />

    </>
  );
};

export default LobbyPage;