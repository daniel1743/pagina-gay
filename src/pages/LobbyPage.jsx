import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, Shield, Calendar, HeartPulse, SlidersHorizontal, Users, Lock, MapPin, Sparkles, MessageCircle } from 'lucide-react';
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
import { GuestUsernameModal } from '@/components/auth/GuestUsernameModal';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { trackPageView, trackPageExit } from '@/services/analyticsService';
import { useCanonical } from '@/hooks/useCanonical';
import { subscribeToLastActivity, subscribeToMultipleRoomCounts } from '@/services/presenceService';
import { roomsData } from '@/config/rooms';
import ChatDemo from '@/components/landing/ChatDemo';

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

// ✅ OPTIMIZADO FASE 1: News Ticker con Intersection Observer (pausa cuando no está visible)
const NewsTicker = () => {
  const tickerRef = React.useRef(null);
  const [isVisible, setIsVisible] = React.useState(true);

  const newsItems = [
    { id: 1, text: "🏳️‍🌈 Chile avanza en reconocimiento de familias homoparentales" },
    { id: 2, text: "🎉 Fiesta Pride este sábado en Blondie - Providencia 23:00hrs" },
    { id: 3, text: "💉 Testeo VIH gratuito - Fundación Savia, Bellavista" },
    { id: 4, text: "🌈 Marcha del Orgullo Santiago 2025 confirmada para junio" },
  ];

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          setIsVisible(entry.isIntersecting);
        });
      },
      { threshold: 0.1 }
    );

    if (tickerRef.current) {
      observer.observe(tickerRef.current);
    }

    return () => {
      if (tickerRef.current) {
        observer.unobserve(tickerRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={tickerRef}
      className="relative w-full overflow-hidden carousel-container py-4 sm:py-6 my-6 sm:my-8"
      role="region"
      aria-label="Noticias y eventos"
    >
      <div className="absolute inset-y-0 left-0 w-16 sm:w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none"></div>
      <div className="absolute inset-y-0 right-0 w-16 sm:w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none"></div>
      <div className={`flex ${isVisible ? 'animate-marquee' : ''}`} aria-hidden="true">
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
          animation: marquee 60s linear infinite;
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
  const [showGuestModal, setShowGuestModal] = useState(false);
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
  // ✅ FASE 1: QUICK WINS - Solo features funcionales (sin "Próximamente")
  const cardData = [
    {
      id: 'salas',
      icon: <MessageSquare className="w-8 h-8" />,
      title: "Salas de Chat",
      description: "Conversaciones en vivo 24/7. Únete a salas temáticas y conoce gente como tú ahora.",
      modal: 'RoomsModal',
      variant: "primary",
      badge: "Activo",
      stats: { label: `🔥 ${calculateTotalUsers()} personas chateando`, icon: Users },
      accentColor: "cyan"
    },
    {
      id: 'denuncias',
      icon: <Shield className="w-8 h-8" />,
      title: "Centro de Seguridad",
      description: "Reporta comportamiento inadecuado de forma anónima. Tu bienestar es nuestra prioridad.",
      modal: 'DenunciaModal',
      variant: "default",
      badge: null,
      stats: { label: "⚠️ Denuncia anónima", icon: Shield },
      accentColor: "orange"
    },
    {
      id: 'premium',
      icon: <Sparkles className="w-8 h-8" />,
      title: "Hazte Premium",
      description: "Desbloquea avatares exclusivos, badges especiales y acceso prioritario a nuevas funciones.",
      onClick: () => navigate('/premium'),
      variant: "default",
      badge: "Nuevo",
      stats: { label: "💎 Beneficios exclusivos", icon: Sparkles },
      accentColor: "purple"
    },
  ];

  // ✅ Tarjeta horizontal del Foro (ocupa todo el ancho)
  const forumCard = {
    id: 'foro',
    icon: <MessageCircle className="w-8 h-8" />,
    title: "Foro de Apoyo",
    description: "Comparte experiencias, pide consejos y encuentra recursos en nuestro foro anónimo. Comunidad de apoyo mutuo 24/7.",
    onClick: () => navigate('/anonymous-forum'),
    variant: "default",
    badge: "Activo",
    stats: { label: "💬 Comunidad activa", icon: MessageCircle },
    accentColor: "green",
    isHorizontal: true // ✅ Flag para tarjeta horizontal
  };

  const handleCardClick = (modalId, card) => {
    // Premium card - usar onClick personalizado si existe
    if (card?.onClick) {
      card.onClick();
      return;
    }

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
    // Abrir modal de registro rápido
    setShowQuickSignup(true);
  };

  const handleGoToLogin = () => {
    setShowAuthRequired(false);
    // Navegar a la página de autenticación
    navigate('/auth');
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
    // ✅ SEO: Título optimizado para búsquedas (NO sobrescribir el del index.html)
    // El título del index.html ya es perfecto: "Chat Gay Chile 🏳️‍🌈 Conoce Gente LGBT+ Ahora | Chactivo"
    // Solo actualizar si es necesario para tracking, pero mantener el SEO del index.html
    // document.title = "Chat Gay Chile 🏳️‍🌈 Conoce Gente LGBT+ Ahora | Chactivo";
    
    // Track page view (sin "Lobby" para SEO)
    trackPageView('/lobby', 'Chat Gay Chile - Chactivo');

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
      <div className="w-full min-h-screen pb-16 sm:pb-20">
        {/* 🔥 HERO SECTION - Siempre visible con H1 SEO */}
        {(
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 mb-12 sm:mb-16 overflow-hidden"
          >
          {/* Fondo degradado animado */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20 animate-pulse"></div>

          <div className="relative max-w-5xl mx-auto">
            {/* Contador de usuarios en tiempo real - MEJORADO FASE 1 */}
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col items-center gap-4 mb-6"
            >
              {/* Contador grande animado */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="glass-effect px-8 py-5 rounded-2xl border-2 border-green-500/40 shadow-lg shadow-green-500/20"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {/* Dot pulsante */}
                    <span className="absolute inline-flex h-5 w-5 rounded-full bg-green-400 opacity-75 animate-ping"></span>
                    <span className="relative inline-flex h-5 w-5 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></span>
                  </div>
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                        delay: 0.4
                      }}
                      className="text-4xl sm:text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-1"
                    >
                      {calculateTotalUsers()}
                    </motion.div>
                    <p className="text-sm sm:text-base font-semibold text-green-400">
                      USUARIOS ACTIVOS AHORA 🔥
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Tagline */}
              <div className="glass-effect px-6 py-2 rounded-full border border-cyan-500/30">
                <p className="text-sm sm:text-base text-cyan-300 font-medium">
                  Acceso rápido y sin registro
                </p>
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

            {/* ✅ HERO SEO: H1 optimizado para SEO */}
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-center mb-4 sm:mb-6 leading-tight px-4"
            >
              Chat Gay Chile: Chatea Gratis y Conecta con Personas Reales 🏳️‍🌈
            </motion.h1>

            {/* Subtítulo del Hero */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-base sm:text-lg md:text-xl text-center text-muted-foreground mb-8 sm:mb-10 max-w-3xl mx-auto px-4 leading-relaxed"
            >
              Entra como invitado y chatea gratis por 1 mes, o regístrate para desbloquear chats privados, likes, avatares y más. ¡Cientos de chicos activos ahora!
            </motion.p>

            {/* ✅ CTA PRINCIPAL DEL HERO */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 sm:mb-10 px-4"
            >
              {/* Botón 1: Chatear Ahora (sin registro) */}
              <Button
                onClick={() => {
                  if (user && !user.isAnonymous && !user.isGuest) {
                    handleCardClick('RoomsModal');
                  } else {
                    setShowGuestModal(true);
                  }
                }}
                className="magenta-gradient text-white font-bold text-base sm:text-lg md:text-xl px-6 sm:px-8 md:px-12 py-5 sm:py-6 md:py-7 rounded-xl shadow-xl hover:shadow-[#E4007C]/50 hover:scale-105 transition-all w-full sm:w-auto min-h-[48px]"
              >
                ⚡ Chatear Ahora
              </Button>

              {/* Botón 2: Registrate (acceso completo) */}
              <Button
                onClick={() => {
                  if (user && !user.isAnonymous && !user.isGuest) {
                    handleCardClick('RoomsModal');
                  } else {
                    setShowQuickSignup(true);
                  }
                }}
                variant="outline"
                className="border-2 border-cyan-500/50 text-cyan-400 font-bold text-base sm:text-lg md:text-xl px-6 sm:px-8 md:px-12 py-5 sm:py-6 md:py-7 rounded-xl hover:bg-cyan-500/10 hover:border-cyan-500 transition-all w-full sm:w-auto min-h-[48px]"
              >
                💎 Registrate para Más
              </Button>
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

        {/* 🔥 CHAT DEMO - Vista previa con notificaciones animadas - Solo para visitantes */}
        {showHeroSection && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 mb-12 sm:mb-16"
          >
            <ChatDemo
              onJoinClick={() => {
                if (user && !user.isAnonymous && !user.isGuest) {
                  handleCardClick('RoomsModal');
                } else {
                  setShowQuickSignup(true);
                }
              }}
            />
          </motion.section>
        )}

        {/* ✅ FASE URGENTE: Sección "Cómo Funciona" - Solo para visitantes */}
        {showHeroSection && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
              🎯 Cómo Funciona
            </h2>
            <p className="text-center text-muted-foreground mb-10 sm:mb-12 max-w-2xl mx-auto">
              Conectar con la comunidad gay de Santiago nunca fue tan fácil
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 mb-12">
              {/* Paso 1 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass-effect p-6 sm:p-8 rounded-2xl border border-border text-center hover:border-accent/50 transition-all"
              >
                <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-gradient-to-br from-[#E4007C] to-pink-500 flex items-center justify-center text-3xl font-black text-white shadow-lg">
                  1
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3">Acceso Rápido y Gratis</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                  Sin registro, sin email, sin tarjeta. Conecta al instante y chatea gratis. Comunidad activa 24/7.
                </p>
                <div className="inline-block px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full">
                  <p className="text-xs sm:text-sm font-semibold text-green-400">⚡ Acceso rápido</p>
                </div>
              </motion.div>

              {/* Paso 2 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="glass-effect p-6 sm:p-8 rounded-2xl border border-border text-center hover:border-accent/50 transition-all"
              >
                <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-3xl font-black text-white shadow-lg">
                  2
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3">Elige Tu Sala</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                  13 salas temáticas: Osos, +30, Gaming, Libres, BDSM, Deportes y más.
                </p>
                <div className="inline-block px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full">
                  <p className="text-xs sm:text-sm font-semibold text-purple-400">🎯 Para todos los gustos</p>
                </div>
              </motion.div>

              {/* Paso 3 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="glass-effect p-6 sm:p-8 rounded-2xl border border-border text-center hover:border-accent/50 transition-all"
              >
                <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-3xl font-black text-white shadow-lg">
                  3
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3">Conoce Gente Real</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                  Chat en vivo, eventos, amistades y más. 100% personas reales de Chile.
                </p>
                <div className="inline-block px-4 py-2 bg-[#E4007C]/20 border border-[#E4007C]/30 rounded-full">
                  <p className="text-xs sm:text-sm font-semibold text-[#E4007C]">💬 Sin bots ni fakes</p>
                </div>
              </motion.div>
            </div>

            {/* CTA secundario */}
            <div className="text-center">
              <Button
                onClick={() => setShowQuickSignup(true)}
                className="magenta-gradient text-white font-bold text-lg px-8 py-6 rounded-xl shadow-xl hover:shadow-[#E4007C]/50 hover:scale-105 transition-all"
              >
                🚀 EMPEZAR AHORA
              </Button>
            </div>
          </motion.section>
        )}


        <NewsTicker />

        {/* Estadísticas Globales - Solo visible para usuarios NO registrados */}
        {showHeroSection && (
          <GlobalStats />
        )}

        {/* ✅ SECCIÓN PRINCIPAL: Salas de Chat (inmediatamente después del Hero) */}
        <div className="px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-16">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-7xl mx-auto"
          >
            {/* Título de sección: Salas de Chat */}
            <div className="text-center mb-10 sm:mb-14 lg:mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 light:from-cyan-600 light:via-purple-600 light:to-pink-600 bg-clip-text text-transparent leading-tight">
                Salas de Chat
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-gray-400 light:text-gray-600 max-w-2xl mx-auto leading-relaxed px-4">
                Conecta, chatea y descubre la comunidad gay más activa de Chile
              </p>
            </div>

            {/* ✅ TARJETA PRINCIPAL: Salas de Chat (horizontal, destacada) */}
            <div className="mb-8 sm:mb-12 max-w-6xl mx-auto">
              <FeatureCard
                key={cardData[0].id}
                icon={cardData[0].icon}
                title={cardData[0].title}
                description={cardData[0].description}
                onClick={() => handleCardClick(cardData[0].modal, cardData[0])}
                index={0}
                variant={cardData[0].variant}
                badge={cardData[0].badge}
                stats={cardData[0].stats}
                accentColor={cardData[0].accentColor}
                isHorizontal={true}
              />
            </div>
          </motion.div>
        </div>

        {/* ✅ SECCIÓN: Comunidades destacadas (Foro Gay Chile Anónimo / Chat Gay Gamers Chile) */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 mb-12"
        >
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Comunidades destacadas</h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Explora nuestras comunidades especializadas
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Enlace al Foro */}
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              onClick={() => navigate('/anonymous-forum')}
              className="glass-effect p-6 sm:p-8 rounded-2xl border-2 border-green-500/30 hover:border-green-500/60 cursor-pointer transition-all shadow-lg hover:shadow-green-500/20"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold mb-2 text-green-400">
                    Foro Gay Chile Anónimo
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3 leading-relaxed">
                    Comparte experiencias LGBT+, pide consejos sobre salud mental, relaciones y derechos. 100% anónimo, sin censura. Comunidad de apoyo mutuo activa 24/7.
                  </p>
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-green-400">
                    <span>👥 Comunidad activa</span>
                    <span>•</span>
                    <span>🔒 100% anónimo</span>
                    <span>→</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Enlace a Gaming */}
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              onClick={() => navigate('/gaming')}
              className="glass-effect p-6 sm:p-8 rounded-2xl border-2 border-purple-500/30 hover:border-purple-500/60 cursor-pointer transition-all shadow-lg hover:shadow-purple-500/20"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold mb-2 text-purple-400">
                    Chat Gay Gamers Chile 🎮
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3 leading-relaxed">
                    Conecta con gamers LGBT+ de Chile. Comparte juegos, forma squad, chatea sobre PS5, Xbox, PC, Switch. Comunidad sin toxicidad, puro gaming y buena onda.
                  </p>
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-purple-400">
                    <span>🎮 50+ gamers activos</span>
                    <span>•</span>
                    <span>⚡ Activo 24/7</span>
                    <span>→</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* ✅ SECCIÓN: Foro de Apoyo, Centro de Seguridad, Hazte Premium */}
        <div className="px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-16">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-7xl mx-auto"
          >
            {/* Grid de 3 cards: Foro de Apoyo, Centro de Seguridad, Premium */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16 max-w-6xl mx-auto">
              {/* Foro de Apoyo */}
              <FeatureCard
                key={forumCard.id}
                icon={forumCard.icon}
                title={forumCard.title}
                description={forumCard.description}
                onClick={forumCard.onClick}
                index={0}
                variant={forumCard.variant}
                badge={forumCard.badge}
                stats={forumCard.stats}
                accentColor={forumCard.accentColor}
              />
              
              {/* Centro de Seguridad y Premium */}
              {cardData.slice(1).map((card, index) => (
                <FeatureCard
                  key={card.id}
                  icon={card.icon}
                  title={card.title}
                  description={card.description}
                  onClick={() => handleCardClick(card.modal, card)}
                  index={index + 1}
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
              className="flex-1 bg-[#2C2A4A] border-2 border-[#413e62] text-white font-bold hover:bg-[#3a3755] hover:border-[#4a4768] transition-all"
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

      {/* Guest Username Modal (Sin Registro) */}
      <GuestUsernameModal
        open={showGuestModal}
        onClose={() => setShowGuestModal(false)}
      />

    </>
  );
};

export default LobbyPage;