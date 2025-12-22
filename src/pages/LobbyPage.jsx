import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, Shield, Calendar, HeartPulse, SlidersHorizontal, Users, Lock, MapPin, Sparkles } from 'lucide-react';
import FeatureCard from '@/components/lobby/FeatureCard';
import RoomsModal from '@/components/lobby/RoomsModal';
import DenunciaModal from '@/components/lobby/DenunciaModal';
import EventosModal from '@/components/lobby/EventosModal';
import SaludMentalModal from '@/components/lobby/SaludMentalModal';
import AjustesModal from '@/components/lobby/AjustesModal';
import NearbyUsersModal from '@/components/lobby/NearbyUsersModal';
import GlobalStats from '@/components/lobby/GlobalStats';
// TEMPORALMENTE COMENTADO - Anuncios y Promociones
// import AdCarousel from '@/components/lobby/AdCarousel';
// import AdModal from '@/components/lobby/AdModal';
import PWAInstallBanner from '@/components/ui/PWAInstallBanner';
import ComingSoonModal from '@/components/ui/ComingSoonModal';
import QuickSignupModal from '@/components/auth/QuickSignupModal';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { trackPageView, trackPageExit } from '@/services/analyticsService';
import { useCanonical } from '@/hooks/useCanonical';
import { subscribeToLastActivity, subscribeToMultipleRoomCounts } from '@/services/presenceService';
import { roomsData } from '@/config/rooms';

/**
 * ✅ SISTEMA INTELIGENTE DE CONTADOR DE USUARIOS
 * Calcula el número de usuarios a mostrar con boost estratégico
 */
const calculateDisplayUserCount = (realUserCount, roomId) => {
  if (realUserCount >= 11) {
    return realUserCount;
  }

  const hashCode = roomId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  let fictitiousUsers;
  if (realUserCount === 0) {
    fictitiousUsers = 30 + Math.abs(hashCode % 31);
  } else if (realUserCount <= 2) {
    fictitiousUsers = 25 + Math.abs(hashCode % 21);
  } else if (realUserCount <= 5) {
    fictitiousUsers = 15 + Math.abs(hashCode % 16);
  } else {
    fictitiousUsers = 10 + Math.abs(hashCode % 11);
  }

  return realUserCount + fictitiousUsers;
};

// ✅ cardData ahora se genera dinámicamente en el componente para usar contadores reales

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
    <div className="relative w-full overflow-hidden carousel-container py-4 sm:py-6 my-6 sm:my-8" role="region" aria-label="Noticias y eventos">
      <div className="absolute inset-y-0 left-0 w-16 sm:w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none"></div>
      <div className="absolute inset-y-0 right-0 w-16 sm:w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none"></div>
      <div className="flex animate-marquee" aria-hidden="true">
        {newsItems.concat(newsItems).map((item, index) => (
          <div key={index} className="flex-shrink-0 mx-4 sm:mx-8 flex items-center">
            <span className="text-sm sm:text-base md:text-lg font-semibold text-muted-foreground whitespace-nowrap">{item.text}</span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 80s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-marquee {
            animation: none;
          }
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
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-12">Videos Destacados</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {videos.map(video => (
          <motion.div
            key={video.id}
            className="glass-effect rounded-2xl p-4 sm:p-6 cursor-pointer hover:border-accent/50 transition-all focus:outline-none focus:ring-2 focus:ring-accent/30"
            whileHover={{ scale: 1.02, y: -3 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onComingSoon('la sección de videos', 'Pronto podrás ver contenido educativo, entretenimiento LGBT+ y testimonios de la comunidad directamente aquí.')}
            role="button"
            tabIndex={0}
            aria-label={`Ver video: ${video.title}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onComingSoon('la sección de videos', 'Pronto podrás ver contenido educativo, entretenimiento LGBT+ y testimonios de la comunidad directamente aquí.');
              }
            }}
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
  // TEMPORALMENTE COMENTADO - Anuncios y Promociones
  // const [selectedAd, setSelectedAd] = useState(null);
  // const [showAdModal, setShowAdModal] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState({ name: '', description: '' });
  const [lastActivity, setLastActivity] = useState(null);
  const [, forceUpdate] = useState(0);
  const [showQuickSignup, setShowQuickSignup] = useState(false);
  const [roomCounts, setRoomCounts] = useState({});

  // ✅ Suscribirse a contadores de usuarios en tiempo real
  useEffect(() => {
    const roomIds = roomsData.map(room => room.id);
    const unsubscribe = subscribeToMultipleRoomCounts(roomIds, (counts) => {
      setRoomCounts(counts);
    });
    return () => unsubscribe();
  }, []);

  // ✅ Calcular total de usuarios con boost para "Salas de Chat"
  const calculateTotalUsers = () => {
    let total = 0;
    roomsData.forEach(room => {
      const realCount = roomCounts[room.id] || 0;
      total += calculateDisplayUserCount(realCount, room.id);
    });
    return total;
  };

  // ✅ Generar cardData dinámicamente con contadores reales
  const cardData = [
    {
      id: 'salas',
      icon: <MessageSquare className="w-8 h-8" />,
      title: "Salas de Chat",
      description: "Conversaciones en vivo 24/7. Únete a salas temáticas y conoce gente como tú ahora.",
      modal: 'RoomsModal',
      variant: "primary",
      badge: "Activo",
      stats: { label: `${calculateTotalUsers()} personas conectadas`, icon: Users },
      accentColor: "cyan"
    },
    {
      id: 'cercanos',
      icon: <MapPin className="w-8 h-8" />,
      title: "🌍 Usuarios Cercanos",
      description: "Próximamente: Te avisaremos cuando haya cambios.",
      modal: 'ComingSoon',
      variant: "default",
      badge: null,
      stats: null,
      accentColor: "purple",
      comingSoon: true
    },
    {
      id: 'denuncias',
      icon: <Shield className="w-8 h-8" />,
      title: "Centro de Seguridad",
      description: "Reporta comportamiento inadecuado de forma anónima. Tu bienestar es nuestra prioridad.",
      modal: 'DenunciaModal',
      variant: "default",
      badge: null,
      stats: null,
      accentColor: "orange"
    },
    {
      id: 'eventos',
      icon: <Calendar className="w-8 h-8" />,
      title: "Eventos y Noticias",
      description: "Próximamente: Te avisaremos cuando haya cambios.",
      modal: 'ComingSoon',
      variant: "default",
      badge: null,
      stats: null,
      accentColor: "green",
      comingSoon: true
    },
    {
      id: 'salud',
      icon: <HeartPulse className="w-8 h-8" />,
      title: "Apoyo y Bienestar",
      description: "Próximamente: Te avisaremos cuando haya cambios.",
      modal: 'ComingSoon',
      variant: "default",
      badge: null,
      stats: null,
      accentColor: "green",
      comingSoon: true
    },
    {
      id: 'ajustes',
      icon: <SlidersHorizontal className="w-8 h-8" />,
      title: "Personaliza tu Perfil",
      description: "Próximamente: Te avisaremos cuando haya cambios.",
      modal: 'ComingSoon',
      variant: "default",
      badge: null,
      stats: null,
      accentColor: "purple",
      comingSoon: true
    },
  ];

  const handleCardClick = (modalId, card) => {
    // "Próximamente" siempre es accesible
    if (modalId === 'ComingSoon' || card?.comingSoon) {
        setComingSoonFeature({
          name: card?.title || 'esta funcionalidad',
          description: 'Te avisaremos cuando haya cambios. Estamos trabajando para mejorar tu experiencia.'
        });
        setShowComingSoon(true);
        return;
    }

    // ✅ BLOQUEO DE SEGURIDAD: RoomsModal requiere registro (muestra usuarios conectados)
    if (modalId === 'RoomsModal' && (!user || user.isAnonymous || user.isGuest)) {
        setShowAuthRequired(true);
        return;
    }

    // "Click Aquí" y otros modales requieren registro
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

  // TEMPORALMENTE COMENTADO - Anuncios y Promociones
  // const handleAdClick = (ad) => {
  //   setSelectedAd(ad);
  //   setShowAdModal(true);
  // };

  // const closeAdModal = () => {
  //   setShowAdModal(false);
  //   setSelectedAd(null);
  // };

  const handleFeatureComingSoon = (featureName, description = '') => {
    setComingSoonFeature({ name: featureName, description });
    setShowComingSoon(true);
  };

  useEffect(() => {
    document.title = "Lobby - Chactivo | Chat Gay Chile";
    // Track page view
    trackPageView('/lobby', 'Lobby - Chactivo');

    // Suscribirse a la última actividad global
    const unsubscribeActivity = subscribeToLastActivity((activity) => {
      setLastActivity(activity);
    });

    // Actualizar el contador de tiempo cada 10 segundos
    const interval = setInterval(() => {
      forceUpdate(prev => prev + 1);
    }, 10000);

    // Track page exit
    return () => {
      trackPageExit('/lobby', 0);
      unsubscribeActivity();
      clearInterval(interval);
    };
  }, []);

  // Determinar si mostrar Hero Section (solo para usuarios no autenticados o invitados)
  const showHeroSection = !user || user.isGuest || user.isAnonymous;

  // Helper para calcular el tiempo relativo
  const getTimeAgo = (timestamp) => {
    if (!timestamp) return null;

    const now = Date.now();
    const time = timestamp.toMillis ? timestamp.toMillis() : timestamp;
    const diffInSeconds = Math.floor((now - time) / 1000);

    if (diffInSeconds < 60) return `hace ${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)}h`;
    return `hace ${Math.floor(diffInSeconds / 86400)}d`;
  };

  return (
    <>
      <div className="w-full min-h-screen pt-20 pb-16 sm:pt-24 sm:pb-20">
        {/* 🔥 HERO SECTION - Solo visible para usuarios no registrados o invitados */}
        {showHeroSection && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 mb-12 sm:mb-16 overflow-hidden"
          >
          {/* Fondo degradado animado */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20 animate-pulse"></div>

          <div className="relative max-w-5xl mx-auto">
            {/* Contador de usuarios en tiempo real */}
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col items-center gap-3 mb-6"
            >
              <div className="flex items-center gap-3">
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
              </div>

              {/* Última Actividad */}
              {lastActivity && lastActivity.timestamp && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="glass-effect px-4 py-2 rounded-lg border border-cyan-500/20"
                >
                  <p className="text-xs sm:text-sm text-cyan-400">
                    <span className="font-semibold">{lastActivity.username}</span> se conectó {getTimeAgo(lastActivity.timestamp)}
                  </p>
                </motion.div>
              )}
            </motion.div>

            {/* Título principal */}
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-center mb-6 sm:mb-8 bg-gradient-to-r from-[#E4007C] via-pink-400 to-cyan-400 bg-clip-text text-transparent leading-tight"
            >
              Chat Gay Santiago
            </motion.h1>

            {/* Subtítulo */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-lg sm:text-xl md:text-2xl text-center text-muted-foreground mb-10 sm:mb-12 max-w-3xl mx-auto px-4 leading-relaxed"
            >
              Gratis • Anónimo • 100% Chileno
            </motion.p>

            {/* CTA Principal */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12 sm:mb-16"
            >
              {user && !user.isAnonymous && !user.isGuest ? (
                <button
                  onClick={() => handleCardClick('RoomsModal')}
                  className="group relative px-8 sm:px-12 py-4 sm:py-5 magenta-gradient rounded-2xl font-bold text-lg sm:text-xl text-white hover:scale-105 active:scale-95 transition-all duration-300 shadow-2xl hover:shadow-[#E4007C]/50 focus:outline-none focus:ring-4 focus:ring-[#E4007C]/30 min-h-[56px] flex items-center justify-center"
                  aria-label="Entrar a chatear gratis"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    🔥 ENTRAR A CHATEAR GRATIS
                    <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-12 transition-transform" />
                  </span>
                  {/* Efecto de brillo */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/0 via-white/25 to-white/0 opacity-0 group-hover:opacity-100 group-hover:animate-shimmer"></div>
                </button>
              ) : (
                <button
                  onClick={() => setShowQuickSignup(true)}
                  className="group relative px-8 sm:px-12 py-4 sm:py-5 magenta-gradient rounded-2xl font-bold text-lg sm:text-xl text-white hover:scale-105 active:scale-95 transition-all duration-300 shadow-2xl hover:shadow-[#E4007C]/50 focus:outline-none focus:ring-4 focus:ring-[#E4007C]/30 min-h-[56px] flex items-center justify-center"
                  aria-label="Regístrate para chatear"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    🔥 REGÍSTRATE EN 30 SEGUNDOS
                    <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-12 transition-transform" />
                  </span>
                  {/* Efecto de brillo */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/0 via-white/25 to-white/0 opacity-0 group-hover:opacity-100 group-hover:animate-shimmer"></div>
                </button>
              )}
            </motion.div>

            {/* Preview de salas activas - Solo decorativo, sin enlaces para anónimos */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto mb-12 sm:mb-16"
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
                  className={`glass-effect p-4 sm:p-5 rounded-xl border border-border transition-all ${
                    user && !user.isAnonymous && !user.isGuest 
                      ? 'hover:border-accent/50 cursor-pointer hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-accent/30' 
                      : 'cursor-default'
                  }`}
                  tabIndex={user && !user.isAnonymous && !user.isGuest ? 0 : -1}
                  role={user && !user.isAnonymous && !user.isGuest ? "button" : undefined}
                  aria-label={user && !user.isAnonymous && !user.isGuest ? `Ver sala ${sala.name}` : undefined}
                  onClick={() => {
                    // Solo permitir clic si el usuario está registrado
                    if (user && !user.isAnonymous && !user.isGuest) {
                      handleCardClick('RoomsModal');
                    } else {
                      // Si es anónimo, redirigir a registro
                      navigate('/auth');
                    }
                  }}
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
            className="text-center mb-10 sm:mb-12 px-4 pt-8 sm:pt-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Bienvenido de vuelta</h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">¿Qué quieres hacer hoy?</p>
          </motion.div>
        )}

        <NewsTicker />

        {/* Estadísticas Globales - Solo visible para usuarios NO registrados */}
        {showHeroSection && (
          <GlobalStats />
        )}

        {/* TEMPORALMENTE COMENTADO - Ad Carousel - Solo visible para usuarios autenticados (no anónimos/invitados) */}
        {/* {user && !user.isAnonymous && !user.isGuest && (
          <AdCarousel onAdClick={handleAdClick} />
        )} */}

        <div className="px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-16">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-7xl mx-auto"
          >
            {/* Título de sección */}
            <div className="text-center mb-10 sm:mb-14 lg:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 light:from-cyan-600 light:via-purple-600 light:to-pink-600 bg-clip-text text-transparent leading-tight">
                Explora Chactivo
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-400 light:text-gray-600 max-w-2xl mx-auto leading-relaxed px-4">
                Conecta, chatea y descubre la comunidad gay más activa de Chile
              </p>
            </div>

            {/* Grid jerárquico con card principal destacada */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12 sm:mb-16">
              {cardData.map((card, index) => (
                <FeatureCard
                  key={card.id}
                  icon={card.icon}
                  title={card.title}
                  description={card.description}
                  onClick={() => handleCardClick(card.modal, card)}
                  index={index}
                  variant={card.variant}
                  badge={card.badge}
                  stats={card.stats}
                  accentColor={card.accentColor}
                />
              ))}
            </div>
          </motion.div>
        </div>

        {/* COMENTADO - VideoSection "Próximamente" (Tarea 1.3) */}
        {/* <div className="mb-16">
          <VideoSection onComingSoon={handleFeatureComingSoon} />
        </div> */}

      </div>

      {activeModal === 'RoomsModal' && <RoomsModal isOpen={true} onClose={closeModal} />}
      {activeModal === 'NearbyUsersModal' && <NearbyUsersModal isOpen={true} onClose={closeModal} />}
      {activeModal === 'DenunciaModal' && <DenunciaModal isOpen={true} onClose={closeModal} />}
      {activeModal === 'EventosModal' && <EventosModal isOpen={true} onClose={closeModal} />}
      {activeModal === 'SaludMentalModal' && <SaludMentalModal isOpen={true} onClose={closeModal} />}
      {activeModal === 'AjustesModal' && <AjustesModal isOpen={true} onClose={closeModal} />}

      {/* TEMPORALMENTE COMENTADO - Modal de anuncio */}
      {/* <AdModal ad={selectedAd} isOpen={showAdModal} onClose={closeAdModal} /> */}

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

      {/* Quick Signup Modal */}
      <QuickSignupModal
        isOpen={showQuickSignup}
        onClose={() => setShowQuickSignup(false)}
        redirectTo="/lobby"
      />

    </>
  );
};

export default LobbyPage;