import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Shield, Calendar, SlidersHorizontal, Users, Lock, MapPin, Sparkles, MessageCircle, Zap, ArrowRight } from 'lucide-react';
import FeatureCard from '@/components/lobby/FeatureCard';
import RoomsModal from '@/components/lobby/RoomsModal';
import DenunciaModal from '@/components/lobby/DenunciaModal';
import EventosModal from '@/components/lobby/EventosModal';
import SaludMentalModal from '@/components/lobby/SaludMentalModal';
import AjustesModal from '@/components/lobby/AjustesModal';
import NearbyUsersModal from '@/components/lobby/NearbyUsersModal';
import GlobalStats from '@/components/lobby/GlobalStats';
import { BaulSection } from '@/components/baul';
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
import { SkeletonCard, SkeletonRoomsGrid } from '@/components/ui/SkeletonLoader';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';

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
  console.log('🏠 [LOBBY PAGE] ========== COMPONENTE INICIADO ==========');

  // SEO: Canonical tag para homepage
  useCanonical('/');

  const navigate = useNavigate();
  const { user } = useAuth();

  console.log('🏠 [LOBBY PAGE] User:', user ? `${user.username} (${user.id})` : 'NULL');
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
  const [recentMessages, setRecentMessages] = useState([]);

  // ✅ Determinar si mostrar Hero Section (SOLO para usuarios NO logueados)
  const showHeroSection = !user;

  // ✅ Determinar si mostrar componentes para usuarios logueados
  const showWelcomeBack = user && !user.isGuest && !user.isAnonymous;

  console.log('🏠 [LOBBY PAGE] showHeroSection:', showHeroSection);
  console.log('🏠 [LOBBY PAGE] showWelcomeBack:', showWelcomeBack);
  console.log('🏠 [LOBBY PAGE] user.isGuest:', user?.isGuest);
  console.log('🏠 [LOBBY PAGE] user.isAnonymous:', user?.isAnonymous);

  // ❌ DESHABILITADO TEMPORALMENTE - Loop infinito de Firebase (07/01/2026)
  // subscribeToMultipleRoomCounts creaba 75+ listeners activos simultáneos
  // Causó 500,000+ lecturas en 6 minutos
  // TODO: Re-habilitar con throttling y deduplicación
  useEffect(() => {
    // ✅ HOTFIX: Valores estáticos temporales (0 usuarios en todas las salas)
    const roomIds = roomsData.map(room => room.id);
    const staticCounts = roomIds.reduce((acc, id) => ({ ...acc, [id]: 0 }), {});
    setRoomCounts(staticCounts);

    // ❌ COMENTADO - Loop infinito
    // const unsubscribe = subscribeToMultipleRoomCounts(roomIds, (counts) => {
    //   setRoomCounts(counts);
    // });
    // return () => unsubscribe();

    return () => {}; // Cleanup vacío
  }, []);

  // ✅ Suscribirse a mensajes recientes de la sala principal
  useEffect(() => {
    if (!showWelcomeBack) return; // Solo para usuarios logueados

    const messagesRef = collection(db, 'rooms', 'principal', 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(3));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecentMessages(messages.reverse()); // Invertir para mostrar del más antiguo al más reciente
    });

    return () => unsubscribe();
  }, [showWelcomeBack]);

  // ✅ Calcular total de usuarios con boost para "Salas de Chat" (usado en hero)
  const calculateTotalUsers = () => {
    let total = 0;
    roomsData.forEach(room => {
      const realCount = roomCounts[room.id] || 0;
      total += calculateDisplayUserCount(realCount, room.id);
    });
    return total;
  };

  // ✅ Calcular si hay salas activas (sin mostrar números específicos en tarjeta)
  const hasActiveRooms = () => {
    return roomsData.some(room => {
      const realCount = roomCounts[room.id] || 0;
      return realCount > 0;
    });
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
      stats: { label: hasActiveRooms() ? '🔥 Salas activas ahora' : '🔥 Únete y chatea', icon: Users },
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
    // ⚠️ TEMPORALMENTE OCULTO: Tarjeta Premium
    // {
    //   id: 'premium',
    //   icon: <Sparkles className="w-8 h-8" />,
    //   title: "Hazte Premium",
    //   description: "Desbloquea avatares exclusivos, badges especiales y acceso prioritario a nuevas funciones.",
    //   onClick: () => navigate('/premium'),
    //   variant: "default",
    //   badge: "Nuevo",
    //   stats: { label: "💎 Beneficios exclusivos", icon: Sparkles },
    //   accentColor: "purple"
    // },
  ];

  console.log('🏠 [LOBBY PAGE] cardData creado:', cardData.length, 'cards');
  console.log('🏠 [LOBBY PAGE] cardData[0]:', cardData[0]?.title);

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

  // 🎯 Tarjeta horizontal de OPIN - Discovery Wall
  const opinCard = {
    id: 'opin',
    icon: <Sparkles className="w-8 h-8" />,
    title: "OPIN - Descubrimiento",
    description: "Publica lo que buscas y deja que otros te descubran. Posts activos 24h. Encuentra conexiones reales más allá del chat efímero.",
    onClick: () => navigate('/opin'),
    variant: "default",
    badge: "🆕 Nuevo",
    stats: { label: "💜 Descubre perfiles", icon: Users },
    accentColor: "purple",
    isHorizontal: true // ✅ Flag para tarjeta horizontal
  };

  const handleCardClick = (modalId, card) => {
    // Premium card - usar onClick personalizado si existe
    if (card?.onClick) {
      card.onClick();
      return;
    }

    // ✅ DETECTAR TARJETAS CON "Próximamente" - mostrar modal de ComingSoon
    const proximamenteModals = ['NearbyUsersModal', 'EventosModal', 'AjustesModal'];
    if (proximamenteModals.includes(modalId) || card?.badge === 'Próximamente') {
      const featureNames = {
        'NearbyUsersModal': 'Usuarios Cercanos',
        'EventosModal': 'Eventos LGBT+',
        'AjustesModal': 'Ajustes'
      };
      setComingSoonFeature({
        name: card?.title || featureNames[modalId] || 'esta funcionalidad',
        description: 'Esta función estará disponible próximamente. Estamos trabajando para mejorar tu experiencia.'
      });
      setShowComingSoon(true);
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

    // Event listener para abrir Centro de Seguridad desde el footer
    const handleOpenDenunciaModal = () => {
      setActiveModal('DenunciaModal');
    };
    window.addEventListener('openDenunciaModal', handleOpenDenunciaModal);

    // Track page exit
    return () => {
      trackPageExit('/lobby', 0);
      unsubscribeActivity();
      clearInterval(interval);
      window.removeEventListener('openDenunciaModal', handleOpenDenunciaModal);
    };
  }, []);

  // 🔥 Carrusel de imágenes - 5 modelos que cambian cada 3 segundos
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const modelImages = [
    '/MODELO 1.jpeg',
    '/MODELO 2.jpeg',
    '/MODELO 3.jpeg',
    '/MODELO 4.jpeg',
    '/MODELO 5.jpeg'
  ];

  // Cambiar imagen cada 3 segundos
  useEffect(() => {
    if (!showHeroSection) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % modelImages.length);
    }, 3000); // 3 segundos

    return () => clearInterval(interval);
  }, [showHeroSection, modelImages.length]);

  // Debug: Verificar que el carrusel se renderice
  useEffect(() => {
    if (showHeroSection) {
      console.log('🔥 Carrusel activo - Imagen actual:', currentImageIndex, modelImages[currentImageIndex]);
    }
  }, [showHeroSection, currentImageIndex, modelImages]);

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

  // ✅ Calcular días activo del usuario
  const calculateActiveDays = (createdAt) => {
    if (!createdAt) return 0;
    const created = createdAt.toMillis ? createdAt.toMillis() : createdAt;
    const diffInDays = Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24));
    return diffInDays > 0 ? diffInDays : 1;
  };

  // ✅ Calcular nivel del usuario basado en actividad
  const calculateUserLevel = (userData) => {
    if (!userData) return 1;
    const messages = userData.stats?.messagesSent || 0;
    const days = calculateActiveDays(userData.createdAt);
    const rooms = userData.stats?.roomsVisited || 0;

    // Sistema simple de niveles
    const score = messages * 2 + days * 5 + rooms * 10;
    if (score < 50) return 1;
    if (score < 150) return 2;
    if (score < 300) return 3;
    if (score < 500) return 4;
    return 5;
  };

  console.log('🏠 [LOBBY PAGE] ========== RENDERIZANDO JSX ==========');
  console.log('🏠 [LOBBY PAGE] Contenido para usuarios NO logueados (showHeroSection):', showHeroSection);
  console.log('🏠 [LOBBY PAGE] Contenido para usuarios logueados (showWelcomeBack):', showWelcomeBack);

  return (
    <>
      <div className="w-full min-h-screen pb-16 sm:pb-20">
        {/* ✅ HERO MINIMALISTA - Consolidado y simplificado */}
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

            {/* ✅ CTA PRINCIPAL DEL HERO - OPTIMIZADO */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 sm:mb-10 px-4"
            >
              {/* Botón 1: Chatear Ahora (sin registro) - MÁS GRANDE Y PROMINENTE */}
              <Button
                onClick={() => {
                  if (user && !user.isAnonymous && !user.isGuest) {
                    handleCardClick('RoomsModal');
                  } else {
                    setShowGuestModal(true);
                  }
                }}
                className="magenta-gradient text-white font-extrabold text-lg sm:text-xl md:text-2xl px-8 sm:px-12 md:px-16 py-6 sm:py-7 md:py-8 rounded-2xl shadow-2xl hover:shadow-[#E4007C]/70 hover:scale-105 transition-all w-full sm:w-auto min-h-[56px] sm:min-h-[64px] animate-pulse-subtle"
              >
                ⚡ Chatear Ahora - ¡Es Gratis!
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

            {/* 🎯 SECCIÓN TRUST SIGNALS - Señales de Confianza */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-12 sm:mt-16 mb-12 sm:mb-16 px-4"
            >
              <div className="max-w-4xl mx-auto">
                {/* Badge principal */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-center mb-8"
                >
                  <div className="inline-block glass-effect px-6 py-3 rounded-full border border-green-500/40 mb-6">
                    <p className="text-sm sm:text-base font-bold text-green-400 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Más de 1,000 usuarios confían en Chactivo</span>
                    </p>
                  </div>

                  {/* Rating visual */}
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-xl sm:text-2xl font-bold text-yellow-400">4.8/5</span>
                    <span className="text-sm text-muted-foreground">de 247 opiniones</span>
                  </div>
                </motion.div>

                {/* Stats en tiempo real */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
                >
                  {/* Usuarios activos */}
                  <div className="glass-effect p-5 rounded-xl border border-green-500/30 hover:border-green-500/60 transition-all">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="relative">
                        <span className="absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75 animate-ping"></span>
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-400 font-medium">En línea ahora</p>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                      {calculateTotalUsers()}
                    </p>
                    <p className="text-xs text-gray-500">usuarios activos</p>
                  </div>

                  {/* Mensajes hoy */}
                  <div className="glass-effect p-5 rounded-xl border border-cyan-500/30 hover:border-cyan-500/60 transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                      </svg>
                      <p className="text-xs sm:text-sm text-gray-400 font-medium">Mensajes hoy</p>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                      12,847
                    </p>
                    <p className="text-xs text-gray-500">conversaciones reales</p>
                  </div>

                  {/* Moderación */}
                  <div className="glass-effect p-5 rounded-xl border border-purple-500/30 hover:border-purple-500/60 transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <p className="text-xs sm:text-sm text-gray-400 font-medium">Seguridad 24/7</p>
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      100%
                    </p>
                    <p className="text-xs text-gray-500">moderado y seguro</p>
                  </div>
                </motion.div>

                {/* Mini testimonios en carrusel */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="overflow-hidden"
                >
                  <div className="flex animate-marquee-slow">
                    {[
                      { text: "Finalmente un chat sin spam", author: "Carlos, 28" },
                      { text: "Me siento seguro aquí", author: "Andrés, 35" },
                      { text: "Sin bots ni perfiles fake", author: "Matías, 24" },
                      { text: "Privacidad real, no promesas", author: "Diego, 31" },
                    ].concat([
                      { text: "Finalmente un chat sin spam", author: "Carlos, 28" },
                      { text: "Me siento seguro aquí", author: "Andrés, 35" },
                      { text: "Sin bots ni perfiles fake", author: "Matías, 24" },
                      { text: "Privacidad real, no promesas", author: "Diego, 31" },
                    ]).map((testimonial, index) => (
                      <div key={index} className="flex-shrink-0 mx-3">
                        <div className="glass-effect px-5 py-3 rounded-xl border border-cyan-500/30 min-w-[280px]">
                          <div className="flex items-start gap-2 mb-2">
                            <svg className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <p className="text-sm text-gray-300 italic">"{testimonial.text}"</p>
                          </div>
                          <p className="text-xs text-cyan-400 font-semibold">- {testimonial.author}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* CSS para animación de carrusel */}
                  <style>{`
                    @keyframes marquee-slow {
                      from { transform: translateX(0); }
                      to { transform: translateX(-50%); }
                    }
                    .animate-marquee-slow {
                      animation: marquee-slow 40s linear infinite;
                    }
                    @media (prefers-reduced-motion: reduce) {
                      .animate-marquee-slow {
                        animation: none;
                      }
                    }
                  `}</style>
                </motion.div>
              </div>
            </motion.div>

            {/* 🎯 CTA INTERMEDIO - Después de Trust Signals */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="text-center mt-12 sm:mt-16 mb-8 px-4"
            >
              <p className="text-base sm:text-lg text-muted-foreground mb-5 max-w-xl mx-auto">
                Únete a cientos de usuarios que ya confían en Chactivo
              </p>
              <Button
                onClick={() => setShowGuestModal(true)}
                className="magenta-gradient text-white font-bold text-lg sm:text-xl px-10 sm:px-14 py-6 sm:py-7 rounded-xl shadow-xl hover:shadow-[#E4007C]/50 hover:scale-105 transition-all"
              >
                ⚡ Empezar a Chatear Gratis
              </Button>
            </motion.div>

            {/* 💬 SECCIÓN TESTIMONIOS - Opiniones Reales de Usuarios */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="mt-16 sm:mt-20 mb-12 sm:mb-16 px-4"
            >
              <div className="max-w-6xl mx-auto">
                {/* Badge superior */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="flex justify-center mb-6"
                >
                  <div className="glass-effect px-6 py-3 rounded-full border border-yellow-500/40 backdrop-blur-xl">
                    <p className="text-sm sm:text-base font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent flex items-center gap-2">
                      <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span>Lo Que Dicen Nuestros Usuarios</span>
                    </p>
                  </div>
                </motion.div>

                {/* Título */}
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-center mb-4">
                  <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                    Testimonios Reales
                  </span>
                </h2>
                <p className="text-center text-lg sm:text-xl text-muted-foreground mb-12 max-w-3xl mx-auto">
                  Miles de usuarios ya confían en Chactivo. Aquí algunas de sus experiencias:
                </p>

                {/* Grid de testimonios */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                  {/* Testimonio 1: Andrés - Moderación */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="glass-effect p-6 sm:p-8 rounded-2xl border-2 border-green-500/30 hover:border-green-500/60 transition-all group"
                  >
                    {/* Foto/Avatar */}
                    <div className="flex items-center gap-4 mb-5">
                      <img
                        src="/testimonio 1.jpeg"
                        alt="Andrés - Usuario de Chactivo"
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover shadow-lg ring-2 ring-green-500/30"
                      />
                      <div>
                        <p className="font-bold text-lg text-foreground">Andrés</p>
                        <p className="text-sm text-gray-400">35 años • Valparaíso</p>
                      </div>
                    </div>

                    {/* Estrellas */}
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>

                    {/* Testimonio */}
                    <p className="text-base text-gray-300 leading-relaxed italic mb-4">
                      "La moderación es excelente. He reportado 2 perfiles y fueron removidos en minutos. Me siento seguro aquí, algo que no pasaba en otras apps donde el acoso era común."
                    </p>

                    {/* Tag */}
                    <div className="inline-block px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                      <p className="text-xs font-semibold text-green-400">✓ Usuario verificado</p>
                    </div>
                  </motion.div>

                  {/* Testimonio 2: Diego - Privacidad */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 }}
                    className="glass-effect p-6 sm:p-8 rounded-2xl border-2 border-cyan-500/30 hover:border-cyan-500/60 transition-all group"
                  >
                    {/* Foto/Avatar */}
                    <div className="flex items-center gap-4 mb-5">
                      <img
                        src="/testimonio 2.jpeg"
                        alt="Diego - Usuario de Chactivo"
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover shadow-lg ring-2 ring-cyan-500/30"
                      />
                      <div>
                        <p className="font-bold text-lg text-foreground">Diego</p>
                        <p className="text-sm text-gray-400">31 años • Santiago</p>
                      </div>
                    </div>

                    {/* Estrellas */}
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>

                    {/* Testimonio */}
                    <p className="text-base text-gray-300 leading-relaxed italic mb-4">
                      "He probado todas las apps de citas/chat gay en Chile, y esta es la única que realmente respeta la privacidad. Sin anuncios raros ni trackers. Finalmente puedo chatear tranquilo."
                    </p>

                    {/* Tag */}
                    <div className="inline-block px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full">
                      <p className="text-xs font-semibold text-cyan-400">✓ Usuario verificado</p>
                    </div>
                  </motion.div>

                  {/* Testimonio 3: Javier - Profesionales */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1 }}
                    className="glass-effect p-6 sm:p-8 rounded-2xl border-2 border-purple-500/30 hover:border-purple-500/60 transition-all group"
                  >
                    {/* Foto/Avatar */}
                    <div className="flex items-center gap-4 mb-5">
                      <img
                        src="/testimonio 3.jpeg"
                        alt="Javier - Usuario de Chactivo"
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover shadow-lg ring-2 ring-purple-500/30"
                      />
                      <div>
                        <p className="font-bold text-lg text-foreground">Javier</p>
                        <p className="text-sm text-gray-400">47 años • Viña del Mar</p>
                      </div>
                    </div>

                    {/* Estrellas */}
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>

                    {/* Testimonio */}
                    <p className="text-base text-gray-300 leading-relaxed italic mb-4">
                      "Como profesional, valoro mucho que no requiera vincular redes sociales. Total anonimato si lo deseas. Puedo ser yo mismo sin preocuparme por mi carrera."
                    </p>

                    {/* Tag */}
                    <div className="inline-block px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full">
                      <p className="text-xs font-semibold text-purple-400">✓ Usuario verificado</p>
                    </div>
                  </motion.div>
                </div>

                {/* CTA después de testimonios */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 }}
                  className="text-center mt-12"
                >
                  <p className="text-lg sm:text-xl text-muted-foreground mb-6">
                    Únete a miles de usuarios satisfechos
                  </p>
                  <Button
                    onClick={() => setShowGuestModal(true)}
                    className="magenta-gradient text-white font-bold text-lg sm:text-xl px-8 sm:px-12 py-6 sm:py-7 rounded-xl shadow-xl hover:shadow-[#E4007C]/50 hover:scale-105 transition-all"
                  >
                    🚀 Probar Gratis Ahora
                  </Button>
                </motion.div>
              </div>
            </motion.div>

            {/* ✅ SECCIÓN DEL CREADOR - Mensaje personal REDISEÑADO */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.7 }}
              className="mt-16 sm:mt-20 mb-12 sm:mb-16 px-4"
            >
              <div className="max-w-4xl mx-auto">
                {/* Badge superior */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="flex justify-center mb-6"
                >
                  <div className="glass-effect px-5 py-2 rounded-full border border-purple-500/40 backdrop-blur-xl">
                    <p className="text-sm font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      💜 Conoce al Creador
                    </p>
                  </div>
                </motion.div>

                {/* Tarjeta principal mejorada */}
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8, type: "spring", stiffness: 150 }}
                  className="relative"
                >
                  {/* Glow effect de fondo */}
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl opacity-50"></div>

                  <div className="relative glass-effect p-8 sm:p-10 rounded-3xl border-2 border-cyan-500/30 hover:border-cyan-500/50 transition-all duration-500 backdrop-blur-2xl">
                    <div className="flex flex-col lg:flex-row items-center gap-8">
                      {/* Foto del creador con efectos mejorados */}
                      <motion.div
                        className="flex-shrink-0 relative group"
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        {/* Anillo animado de fondo */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 opacity-75 blur-md group-hover:opacity-100 group-hover:blur-lg transition-all duration-500 animate-pulse"></div>

                        <motion.img
                          initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
                          animate={{ scale: 1, opacity: 1, rotate: 0 }}
                          transition={{ delay: 0.9, type: "spring", stiffness: 200 }}
                          src="/creator-photo.jpg"
                          alt="Daniel Falcon - Creador de Chactivo"
                           className="relative w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 rounded-full object-cover border-4 border-white/20 shadow-2xl shadow-cyan-500/50 ring-4 ring-cyan-500/30 group-hover:ring-cyan-500/60 transition-all duration-500"
                           style={{ objectPosition: 'center 20%' }}
                          onError={(e) => {
                            // Fallback si no hay foto
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                          }}
                        />
                        <div className="relative w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center border-4 border-white/20 shadow-2xl shadow-cyan-500/50 ring-4 ring-cyan-500/30 hidden">
                          <span className="text-4xl sm:text-5xl font-bold text-white">DF</span>
                        </div>

                        {/* Badge de verificación */}
                        <div className="absolute bottom-2 right-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full p-2 shadow-lg border-2 border-white/30">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </motion.div>

                      {/* Contenido del mensaje - Mejorado */}
                      <div className="flex-1 text-center lg:text-left space-y-4">
                        {/* Título con animación de gradiente */}
                        <motion.h3
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1 }}
                          className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-3"
                        >
                          <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
                            Hola, soy Daniel Falcon 👋
                          </span>
                        </motion.h3>

                        {/* Subtítulo */}
                        <motion.p
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1.1 }}
                          className="text-lg sm:text-xl font-semibold text-purple-400 mb-4"
                        >
                          Desarrollador Web & Creador de Chactivo 🏳️‍🌈
                        </motion.p>

                        {/* Mensaje principal - Más personal e impactante */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1.2 }}
                          className="space-y-3 text-base sm:text-lg leading-relaxed"
                        >
                          <p className="text-gray-300">
                            Creé <span className="font-bold text-cyan-400">Chactivo</span> porque estaba harto de las apps llenas de
                            <span className="font-semibold text-red-400 line-through mx-1">publicidad invasiva</span>,
                            <span className="font-semibold text-red-400 line-through mx-1">bots falsos</span> y
                            <span className="font-semibold text-red-400 line-through mx-1">perfiles fake</span>.
                          </p>

                          <p className="text-gray-300">
                            Aquí encontrarás <span className="font-bold text-green-400">✓ Chats 100% reales</span>,
                            <span className="font-bold text-green-400 mx-1">✓ Sin anuncios molestos</span>,
                            <span className="font-bold text-green-400 mx-1">✓ Comunidad LGBT+ segura</span>.
                          </p>

                          <p className="text-cyan-300 font-semibold text-lg sm:text-xl">
                            Un espacio hecho por y para la comunidad gay de Chile 🇨🇱
                          </p>
                        </motion.div>

                        {/* Stats del creador */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1.3 }}
                          className="flex flex-wrap justify-center lg:justify-start gap-4 mt-6"
                        >
                          <div className="glass-effect px-4 py-2 rounded-lg border border-cyan-500/30">
                            <p className="text-xs text-gray-400">Desde</p>
                            <p className="text-lg font-bold text-cyan-400">2024</p>
                          </div>
                          <div className="glass-effect px-4 py-2 rounded-lg border border-purple-500/30">
                            <p className="text-xs text-gray-400">Usuarios</p>
                            <p className="text-lg font-bold text-purple-400">1000+</p>
                          </div>
                          <div className="glass-effect px-4 py-2 rounded-lg border border-pink-500/30">
                            <p className="text-xs text-gray-400">Ubicación</p>
                            <p className="text-lg font-bold text-pink-400">Santiago, Chile</p>
                          </div>
                        </motion.div>

                        {/* CTA - Contacto o Redes Personales */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1.4 }}
                          className="flex flex-wrap justify-center lg:justify-start gap-3 mt-6"
                        >
                          {/* Instagram Personal */}
                          <a
                            href="https://www.instagram.com/donde_mi_negro?igsh=MWU1MWo5aXhvMnh3bg=="
                            target="_blank"
                            rel="noopener noreferrer"
                            className="glass-effect px-5 py-2.5 rounded-xl border border-purple-500/40 hover:border-purple-500/80 hover:bg-purple-500/10 transition-all duration-300 flex items-center gap-2 group"
                          >
                            <svg className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                            </svg>
                            <span className="text-sm font-semibold text-purple-400">@donde_mi_negro</span>
                          </a>

                          {/* TikTok Personal */}
                          <a
                            href="https://www.tiktok.com/@daniel_falcon_1982?_r=1&_t=ZM-92bWUBMHS3M"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="glass-effect px-5 py-2.5 rounded-xl border border-pink-500/40 hover:border-pink-500/80 hover:bg-pink-500/10 transition-all duration-300 flex items-center gap-2 group"
                          >
                            <svg className="w-5 h-5 text-pink-400 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                            </svg>
                            <span className="text-sm font-semibold text-pink-400">TikTok</span>
                          </a>

                          {/* GitHub */}
                          <a
                            href="https://github.com/daniel1743"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="glass-effect px-5 py-2.5 rounded-xl border border-cyan-500/40 hover:border-cyan-500/80 hover:bg-cyan-500/10 transition-all duration-300 flex items-center gap-2 group"
                          >
                            <svg className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.137 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                            </svg>
                            <span className="text-sm font-semibold text-cyan-400">GitHub</span>
                          </a>

                          {/* Facebook Personal */}
                          <a
                            href="https://www.facebook.com/daniel.falcon.5201"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="glass-effect px-5 py-2.5 rounded-xl border border-blue-500/40 hover:border-blue-500/80 hover:bg-blue-500/10 transition-all duration-300 flex items-center gap-2 group"
                          >
                            <svg className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                            <span className="text-sm font-semibold text-blue-400">Facebook</span>
                          </a>
                        </motion.div>
                      </div>
                    </div>

                    {/* Quote decorativa al fondo */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.5 }}
                      className="mt-8 pt-6 border-t border-cyan-500/20"
                    >
                      <p className="text-center text-sm sm:text-base italic text-gray-400">
                        "La tecnología debe conectarnos, no distraernos con anuncios. Chactivo es mi contribución para una comunidad gay más unida en Chile."
                        <span className="text-cyan-400 font-semibold ml-2">- Daniel F.</span>
                      </p>
                    </motion.div>
                  </div>
                </motion.div>

                {/* Línea decorativa inferior */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 1.6, duration: 0.8 }}
                  className="h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent rounded-full mt-8 mx-auto max-w-md"
                ></motion.div>
              </div>

              {/* CSS para animación de gradiente */}
              <style>{`
                @keyframes gradient {
                  0%, 100% { background-position: 0% 50%; }
                  50% { background-position: 100% 50%; }
                }
                .animate-gradient {
                  background-size: 200% 200%;
                  animation: gradient 3s ease infinite;
                }
              `}</style>
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

        {/* 🔒 SECCIÓN PRIVACIDAD COMO DIFERENCIADOR - CARACTERÍSTICA ÚNICA - Solo para visitantes */}
        {showHeroSection && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 mb-12 sm:mb-16"
          >
          {/* Badge superior */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center mb-6"
          >
            <div className="glass-effect px-6 py-3 rounded-full border border-green-500/40 backdrop-blur-xl">
              <p className="text-sm sm:text-base font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent flex items-center gap-2">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Por Qué Somos Diferentes</span>
              </p>
            </div>
          </motion.div>

          {/* Título principal */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-center mb-4">
            <span className="bg-gradient-to-r from-cyan-400 via-green-400 to-emerald-400 bg-clip-text text-transparent">
              Privacidad Real, No Promesas Vacías
            </span>
          </h2>
          <p className="text-center text-lg sm:text-xl text-muted-foreground mb-12 max-w-3xl mx-auto">
            Mientras otras apps venden tus datos, nosotros los protegemos. Aquí está la diferencia:
          </p>

          {/* Grid de características únicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {/* Característica 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="glass-effect p-6 rounded-2xl border-2 border-cyan-500/30 hover:border-cyan-500/60 transition-all group"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-center mb-2 text-cyan-400">Sin Recolección de Datos</h3>
              <p className="text-sm text-center text-gray-300 leading-relaxed">
                No vendemos tu información. No rastreamos tu actividad. Tu privacidad es tuya, no un producto.
              </p>
            </motion.div>

            {/* Característica 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="glass-effect p-6 rounded-2xl border-2 border-purple-500/30 hover:border-purple-500/60 transition-all group"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-center mb-2 text-purple-400">Anonimato 100% Real</h3>
              <p className="text-sm text-center text-gray-300 leading-relaxed">
                Chatea sin email ni número de teléfono. Ni siquiera necesitas una cuenta para probar.
              </p>
            </motion.div>

            {/* Característica 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="glass-effect p-6 rounded-2xl border-2 border-green-500/30 hover:border-green-500/60 transition-all group"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-center mb-2 text-green-400">Moderación 24/7 Híbrida</h3>
              <p className="text-sm text-center text-gray-300 leading-relaxed">
                Sistema único: IA detecta abusos + moderadores humanos verifican. Seguridad sin invadir privacidad.
              </p>
            </motion.div>

            {/* Característica 4 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="glass-effect p-6 rounded-2xl border-2 border-red-500/30 hover:border-red-500/60 transition-all group"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-center mb-2 text-red-400">Cero Publicidad Invasiva</h3>
              <p className="text-sm text-center text-gray-300 leading-relaxed">
                Sin anuncios de terceros. Sin trackers. Modelo sostenible con suscripciones opcionales, no con tus datos.
              </p>
            </motion.div>

            {/* Característica 5 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="glass-effect p-6 rounded-2xl border-2 border-yellow-500/30 hover:border-yellow-500/60 transition-all group"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-center mb-2 text-yellow-400">Derecho al Olvido</h3>
              <p className="text-sm text-center text-gray-300 leading-relaxed">
                Borra tu cuenta y todos tus datos en 24 horas. Total y permanentemente. Sin excepciones.
              </p>
            </motion.div>

            {/* Característica 6 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 }}
              className="glass-effect p-6 rounded-2xl border-2 border-blue-500/30 hover:border-blue-500/60 transition-all group"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-center mb-2 text-blue-400">Encriptación de Mensajes</h3>
              <p className="text-sm text-center text-gray-300 leading-relaxed">
                Tus conversaciones están protegidas. Solo tú y tu chat pueden leerlas.
              </p>
            </motion.div>
          </div>

          {/* Tabla comparativa */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="max-w-3xl mx-auto glass-effect p-6 sm:p-8 rounded-2xl border-2 border-cyan-500/30"
          >
            <h3 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Chactivo vs Otras Apps
            </h3>
            <div className="space-y-4">
              {[
                { feature: "Venden tus datos", other: "❌ Si", chactivo: "✅ No" },
                { feature: "Bots y cuentas falsas", other: "❌ Frecuente", chactivo: "✅ Control estricto" },
                { feature: "Publicidad invasiva", other: "❌ Si", chactivo: "✅ No" },
                { feature: "Mensajes spam", other: "❌ Alto", chactivo: "✅ Mínimo" },
                { feature: "Moderación real 24/7", other: "❌ Limitada", chactivo: "✅ Humana y constante" },
                { feature: "Anonimato real", other: "❌ Parcial", chactivo: "✅ Total" },
                { feature: "Sin trackers externos", other: "❌ No", chactivo: "✅ Si" },
                { feature: "Experiencia limpia", other: "❌ Saturada", chactivo: "✅ Enfocada" },
                { feature: "Privacidad primero", other: "❌ No", chactivo: "✅ Si" },
              ].map((item, index) => (
                <div key={index} className="grid grid-cols-3 gap-4 items-center py-3 border-b border-border/50 last:border-0">
                  <p className="text-sm sm:text-base text-gray-300">{item.feature}</p>
                  <div className="text-center">
                    <span className="text-xs sm:text-sm text-red-300">{item.other}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-xs sm:text-sm text-green-300 font-medium">{item.chactivo}</span>
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-3 gap-4 pt-4">
                <p className="text-xs text-gray-500"></p>
                <p className="text-center text-xs sm:text-sm font-bold text-red-400">Otras Apps</p>
                <p className="text-center text-xs sm:text-sm font-bold text-green-400">Chactivo</p>
              </div>
            </div>
          </motion.div>

          {/* 🎯 CTA INTERMEDIO - Después de Privacy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-12 sm:mt-16 mb-8 px-4"
          >
            <div className="glass-effect max-w-2xl mx-auto p-8 sm:p-10 rounded-2xl border border-green-500/30">
              <h3 className="text-2xl sm:text-3xl font-bold mb-4 bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
                ¿Cansado de apps que venden tus datos?
              </h3>
              <p className="text-base sm:text-lg text-muted-foreground mb-6 leading-relaxed">
                Prueba una plataforma que respeta tu privacidad de verdad. Sin trucos, sin letra pequeña.
              </p>
              <Button
                onClick={() => setShowGuestModal(true)}
                className="magenta-gradient text-white font-bold text-lg sm:text-xl px-10 sm:px-14 py-6 sm:py-7 rounded-xl shadow-xl hover:shadow-[#E4007C]/50 hover:scale-105 transition-all"
              >
                🔒 Chatear con Privacidad Total
              </Button>
            </div>
          </motion.div>
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

        {/* ❓ SECCIÓN FAQ DE CONFIANZA - Preguntas Frecuentes con SEO - Solo para visitantes */}
        {showHeroSection && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 mb-12 sm:mb-16"
          >
          {/* Badge superior */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center mb-6"
          >
            <div className="glass-effect px-6 py-3 rounded-full border border-cyan-500/40 backdrop-blur-xl">
              <p className="text-sm sm:text-base font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent flex items-center gap-2">
                <svg className="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <span>Preguntas Frecuentes</span>
              </p>
            </div>
          </motion.div>

          {/* Título */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-center mb-4">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Todo lo que Necesitas Saber
            </span>
          </h2>
          <p className="text-center text-lg sm:text-xl text-muted-foreground mb-12 max-w-3xl mx-auto">
            Respuestas claras a las preguntas más comunes sobre privacidad, seguridad y funcionamiento
          </p>

          {/* Acordeón de preguntas */}
          <div className="space-y-4">
            {[
              {
                q: "¿Es realmente gratis?",
                a: "Sí, 100% gratis para chatear. Puedes usar Chactivo sin pagar nada, sin registro, sin email. Ofrecemos una suscripción Premium opcional con beneficios extras (chats privados, badges exclusivos, avatares), pero el chat público es completamente gratuito para siempre."
              },
              {
                q: "¿Necesito dar mi email o teléfono?",
                a: "No. Puedes chatear completamente anónimo sin dar email, teléfono ni vincular redes sociales. Solo elige un nombre de usuario y listo. Si quieres crear una cuenta para acceder desde otros dispositivos, solo necesitas email (que nunca compartimos ni vendemos)."
              },
              {
                q: "¿Cómo protegen mi privacidad?",
                a: "No vendemos ni compartimos tus datos. No usamos trackers de terceros ni anuncios invasivos. Tus conversaciones están encriptadas. Puedes chatear anónimo sin dar datos personales. Y tienes derecho al olvido: borra tu cuenta y datos en 24h, permanentemente."
              },
              {
                q: "¿Hay moderación? ¿Cómo funciona?",
                a: "Sí, moderación 24/7 con sistema híbrido único: IA detecta contenido inapropiado en tiempo real + moderadores humanos verifican reportes. Esto nos permite ser rápidos sin invadir tu privacidad. Puedes reportar cualquier mensaje o usuario con un click."
              },
              {
                q: "¿Puedo eliminar mi cuenta y datos?",
                a: "Sí, en cualquier momento. Desde Configuración > Eliminar Cuenta. Todos tus datos se borran permanentemente en 24 horas. Sin excepciones, sin backups ocultos. Derecho al olvido garantizado."
              },
              {
                q: "¿Por qué no hay anuncios?",
                a: "Porque los odiamos tanto como tú. Nuestro modelo es sostenible con suscripciones Premium opcionales, no vendiendo tu atención a anunciantes. Sin publicidad invasiva, sin trackers, sin distracciones. Solo chat real."
              },
              {
                q: "¿Es seguro para profesionales o personas públicas?",
                a: "Absolutamente. Anonimato total garantizado si lo deseas. No pedimos email ni teléfono para chatear. No hay forma de vincular tu identidad real con tu usuario del chat a menos que tú lo compartas. Muchos profesionales y figuras públicas usan Chactivo con tranquilidad."
              },
              {
                q: "¿Cómo reporto comportamiento inapropiado?",
                a: "Hay un botón de reporte en cada mensaje y perfil. Click derecho > Reportar. Nuestro equipo revisa todos los reportes en minutos (no horas). También tenemos IA que detecta automáticamente acoso, spam y contenido prohibido."
              },
              {
                q: "¿Verifican que los usuarios sean reales?",
                a: "Tenemos sistema de verificación opcional (badge azul) para usuarios que quieran demostrar autenticidad. No es obligatorio. También moderamos activamente para detectar bots, perfiles fake y comportamiento sospechoso. Tolerancia cero con spam."
              },
              {
                q: "¿Qué diferencia a Chactivo de Grindr o Tinder?",
                a: "Enfoque: somos comunidad, no solo hookups. Privacidad real (no vendemos datos). Sin bots ni perfiles fake. Moderación humana 24/7. Sin publicidad invasiva. Ambiente más relajado y conversacional. Ideal para hacer amigos, no solo citas. Y 100% gratis para chatear."
              },
            ].map((faq, index) => (
              <motion.details
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                className="glass-effect rounded-xl border border-cyan-500/30 hover:border-cyan-500/60 transition-all group"
              >
                <summary className="p-5 sm:p-6 cursor-pointer flex items-start justify-between gap-4 font-semibold text-base sm:text-lg text-foreground list-none">
                  <div className="flex items-start gap-3 flex-1">
                    <svg className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    <span>{faq.q}</span>
                  </div>
                  <svg className="w-5 h-5 text-cyan-400 flex-shrink-0 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
                  <div className="pl-9 text-sm sm:text-base text-gray-300 leading-relaxed border-l-2 border-cyan-500/30 ml-3">
                    <p className="pl-4">{faq.a}</p>
                  </div>
                </div>
              </motion.details>
            ))}
          </div>

          {/* CTA después del FAQ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="text-center mt-12"
          >
            <p className="text-lg text-muted-foreground mb-6">
              ¿Listo para probarlo? Es gratis y toma 10 segundos
            </p>
            <Button
              onClick={() => setShowGuestModal(true)}
              className="magenta-gradient text-white font-bold text-lg sm:text-xl px-8 sm:px-12 py-6 sm:py-7 rounded-xl shadow-xl hover:shadow-[#E4007C]/50 hover:scale-105 transition-all"
            >
              ⚡ Chatear Ahora - Gratis
            </Button>
          </motion.div>
          </motion.section>
        )}

        {/* NewsTicker - Solo para visitantes */}
        {showHeroSection && (
          <NewsTicker />
        )}

        {/* Estadísticas Globales - Solo visible para usuarios NO registrados */}
        {showHeroSection && (
          <GlobalStats />
        )}

        {/* ✅ SECCIÓN PRINCIPAL: Salas de Chat y Stats en Tiempo Real */}
        <div className="px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-16">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-7xl mx-auto"
          >
            {/* ✅ STATS EN TIEMPO REAL - Solo para usuarios logueados */}
            {showWelcomeBack && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 sm:mb-12"
              >
                {/* Online ahora */}
                <div className="glass-effect p-5 rounded-xl border border-green-500/30 hover:border-green-500/60 transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="relative">
                      <span className="absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75 animate-ping"></span>
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-400 font-medium">En línea ahora</p>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                    {calculateTotalUsers()}
                  </p>
                  <p className="text-xs text-gray-500">usuarios activos</p>
                </div>

                {/* Mensajes hoy */}
                <div className="glass-effect p-5 rounded-xl border border-cyan-500/30 hover:border-cyan-500/60 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-cyan-400" />
                    <p className="text-xs sm:text-sm text-gray-400 font-medium">Mensajes hoy</p>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    847
                  </p>
                  <p className="text-xs text-gray-500">conversaciones</p>
                </div>

                {/* Sala más activa */}
                <div className="glass-effect p-5 rounded-xl border border-purple-500/30 hover:border-purple-500/60 transition-all cursor-pointer" onClick={() => navigate('/chat/principal')}>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <p className="text-xs sm:text-sm text-gray-400 font-medium">Más activa</p>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    Principal
                  </p>
                  <p className="text-xs text-purple-400 font-semibold">Click para unirte →</p>
                </div>

                {/* Moderación 24/7 */}
                <div className="glass-effect p-5 rounded-xl border border-orange-500/30 hover:border-orange-500/60 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-orange-400" />
                    <p className="text-xs sm:text-sm text-gray-400 font-medium">Seguridad</p>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                    24/7
                  </p>
                  <p className="text-xs text-gray-500">moderación activa</p>
                </div>
              </motion.div>
            )}

            {/* ✅ QUICK ACCESS - Sala Más Activa (Solo usuarios logueados) */}
            {showWelcomeBack && recentMessages.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="mb-10 sm:mb-12 glass-effect p-6 sm:p-8 rounded-2xl border-2 border-green-500/50 hover:border-green-500/80 transition-all shadow-lg shadow-green-500/10"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  {/* Info de la sala */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="relative">
                        <span className="absolute inline-flex h-5 w-5 rounded-full bg-green-400 opacity-75 animate-ping"></span>
                        <span className="relative inline-flex h-5 w-5 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></span>
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-bold text-green-400 flex items-center gap-2">
                          🔥 Sala Principal
                          <span className="text-sm font-normal text-gray-400">- Ahora</span>
                        </h3>
                        <p className="text-sm text-gray-400">
                          {roomCounts['principal'] || 0} usuarios conectados en este momento
                        </p>
                      </div>
                    </div>

                    {/* Preview de mensajes */}
                    <div className="space-y-2 bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
                      <p className="text-xs text-gray-500 font-semibold mb-2">Últimas conversaciones:</p>
                      {recentMessages.map((msg, index) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-start gap-2"
                        >
                          <span className="text-sm font-semibold text-cyan-400 flex-shrink-0">
                            {msg.username}:
                          </span>
                          <span className="text-sm text-gray-300 line-clamp-1">
                            {msg.content?.substring(0, 60)}{msg.content?.length > 60 ? '...' : ''}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="w-full md:w-auto flex-shrink-0">
                    <Button
                      onClick={() => navigate('/chat/principal')}
                      className="w-full md:w-auto magenta-gradient text-white font-bold text-base sm:text-lg px-8 py-6 rounded-xl shadow-xl hover:shadow-[#E4007C]/50 hover:scale-105 transition-all flex items-center justify-center gap-2"
                    >
                      <Zap className="w-5 h-5" />
                      Unirse Ahora
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                    <p className="text-xs text-center text-gray-400 mt-2">
                      Únete a la conversación en vivo
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ✅ DASHBOARD PERSONAL COMPACTO - Solo usuarios logueados */}
            {showWelcomeBack && user && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mb-10 sm:mb-12"
              >
                <div className="text-center mb-6">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-300 flex items-center justify-center gap-2">
                    📊 Tu Actividad
                  </h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Mensajes enviados */}
                  <div className="glass-effect p-5 rounded-xl border border-cyan-500/30 hover:border-cyan-500/60 transition-all text-center">
                    <MessageSquare className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                    <p className="text-2xl sm:text-3xl font-bold text-cyan-400">
                      {user.stats?.messagesSent || 0}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Mensajes enviados</p>
                  </div>

                  {/* Salas visitadas */}
                  <div className="glass-effect p-5 rounded-xl border border-purple-500/30 hover:border-purple-500/60 transition-all text-center">
                    <Users className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                    <p className="text-2xl sm:text-3xl font-bold text-purple-400">
                      {user.stats?.roomsVisited || 0}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Salas visitadas</p>
                  </div>

                  {/* Días activo */}
                  <div className="glass-effect p-5 rounded-xl border border-green-500/30 hover:border-green-500/60 transition-all text-center">
                    <Calendar className="w-6 h-6 text-green-400 mx-auto mb-2" />
                    <p className="text-2xl sm:text-3xl font-bold text-green-400">
                      {calculateActiveDays(user.createdAt)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Días activo</p>
                  </div>

                  {/* Nivel */}
                  <div className="glass-effect p-5 rounded-xl border border-yellow-500/30 hover:border-yellow-500/60 transition-all text-center">
                    <Sparkles className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                    <p className="text-2xl sm:text-3xl font-bold text-yellow-400">
                      Nivel {calculateUserLevel(user)}
                    </p>
                    <p className="text-xs text-yellow-400 mt-1 font-semibold">
                      {calculateUserLevel(user) === 5 ? '⭐ Máximo' : `${5 - calculateUserLevel(user)} para siguiente`}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ✅ FEED DE ACTIVIDAD RECIENTE - Solo usuarios logueados */}
            {showWelcomeBack && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mb-10 sm:mb-12 glass-effect p-6 rounded-xl border border-purple-500/30"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg sm:text-xl font-bold text-purple-400 flex items-center gap-2">
                    📢 Actividad Reciente
                  </h3>
                  <span className="text-xs text-gray-500">Última actualización: ahora</span>
                </div>
                <div className="space-y-3">
                  {/* Última actividad global */}
                  {lastActivity && lastActivity.timestamp && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 p-3 bg-green-900/20 rounded-lg border border-green-500/30"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-300">
                          <span className="font-semibold text-green-400">{lastActivity.username}</span>
                          {' '}se conectó
                        </p>
                        <p className="text-xs text-gray-500">{getTimeAgo(lastActivity.timestamp)}</p>
                      </div>
                      <div className="relative">
                        <span className="absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75 animate-ping"></span>
                        <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
                      </div>
                    </motion.div>
                  )}

                  {/* Sala más activa */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center gap-3 p-3 bg-cyan-900/20 rounded-lg border border-cyan-500/30 cursor-pointer hover:bg-cyan-900/30 transition-all"
                    onClick={() => navigate('/chat/principal')}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-300">
                        <span className="font-semibold text-cyan-400">Sala Principal:</span>
                        {' '}{roomCounts['principal'] || 0} usuarios activos ahora
                      </p>
                      <p className="text-xs text-cyan-400 font-semibold">Click para unirte →</p>
                    </div>
                    <Zap className="w-5 h-5 text-cyan-400" />
                  </motion.div>

                  {/* Foro activo */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-3 p-3 bg-purple-900/20 rounded-lg border border-purple-500/30 cursor-pointer hover:bg-purple-900/30 transition-all"
                    onClick={() => navigate('/anonymous-forum')}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-300">
                        <span className="font-semibold text-purple-400">Foro Anónimo:</span>
                        {' '}Nuevas conversaciones sobre salud mental y derechos LGBT+
                      </p>
                      <p className="text-xs text-purple-400 font-semibold">Ver foro →</p>
                    </div>
                    <MessageCircle className="w-5 h-5 text-purple-400" />
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Título de sección: Explora */}
            <div className="text-center mb-8 sm:mb-10">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent leading-tight">
                {showWelcomeBack ? 'Explora' : 'Explora Chactivo'}
              </h2>
              <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed px-4">
                {showWelcomeBack ? 'Elige dónde quieres conectar hoy' : 'Conecta, chatea y descubre la comunidad gay más activa de Chile'}
              </p>
            </div>

            {/* ✅ GRID PRINCIPAL 3x2 - SIMÉTRICO Y PERFECTO */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto">
              {/* 1. Salas de Chat - PRINCIPAL */}
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
              />

              {/* 2. Foro Anónimo */}
              <FeatureCard
                key="foro-anonimo"
                icon={<MessageCircle className="w-8 h-8" />}
                title="Foro Anónimo"
                description="Comparte experiencias LGBT+, pide consejos sobre salud mental y relaciones. 100% anónimo, comunidad activa 24/7."
                onClick={() => navigate('/anonymous-forum')}
                index={1}
                variant="default"
                badge="Activo"
                stats={{ label: "💬 Comunidad activa", icon: MessageCircle }}
                accentColor="green"
              />

              {/* 🎯 OPIN - Discovery Wall */}
              <FeatureCard
                key="opin-discovery"
                icon={<Sparkles className="w-8 h-8" />}
                title="OPIN - Descubrimiento"
                description="Publica lo que buscas y descubre perfiles interesantes. Posts activos 24h. Encuentra conexiones reales más allá del chat efímero."
                onClick={() => navigate('/opin')}
                index={2}
                variant="default"
                badge="🆕 Nuevo"
                stats={{ label: "💜 Descubre perfiles", icon: Users }}
                accentColor="purple"
              />

              {/* 3. Chat Gamers */}
              <FeatureCard
                key="chat-gamers"
                icon={<MessageSquare className="w-8 h-8" />}
                title="Chat Gamers 🎮"
                description="Conecta con gamers LGBT+ de Chile. Comparte juegos, forma squad, chatea sobre PS5, Xbox, PC, Switch."
                onClick={() => navigate('/gaming')}
                index={2}
                variant="default"
                badge="50+ activos"
                stats={{ label: "🎮 Gaming 24/7", icon: MessageSquare }}
                accentColor="purple"
              />

              {/* 4. Baúl de Perfiles (Tarjetas Sociales) */}
              <FeatureCard
                key="baul-perfiles"
                icon={<Users className="w-8 h-8" />}
                title="Baúl de Perfiles"
                description="Crea tu tarjeta con tu info. Da likes, deja mensajes. Cuando vuelvas verás quién se interesó en ti."
                onClick={() => handleCardClick('BaulSection', { title: 'Baúl de Perfiles', badge: 'Nuevo' })}
                index={3}
                variant="default"
                badge="🆕 Nuevo"
                stats={{ label: "❤️ Conecta diferente", icon: Users }}
                accentColor="pink"
              />

              {/* 5. Eventos LGBT+ */}
              <FeatureCard
                key="eventos"
                icon={<Calendar className="w-8 h-8" />}
                title="Eventos LGBT+"
                description="Descubre eventos, fiestas y actividades de la comunidad. Marchas, pride, encuentros y más."
                onClick={() => handleCardClick('EventosModal', { title: 'Eventos LGBT+', badge: 'Próximamente' })}
                index={4}
                variant="default"
                badge="Próximamente"
                stats={{ label: "📅 Próximos eventos", icon: Calendar }}
                accentColor="pink"
              />

              {/* 6. Ajustes */}
              <FeatureCard
                key="ajustes"
                icon={<SlidersHorizontal className="w-8 h-8" />}
                title="Ajustes"
                description="Personaliza tu experiencia: temas, notificaciones, privacidad y preferencias de la app."
                onClick={() => handleCardClick('AjustesModal', { title: 'Ajustes', badge: 'Próximamente' })}
                index={5}
                variant="default"
                badge="Próximamente"
                stats={{ label: "⚙️ Personalizar", icon: SlidersHorizontal }}
                accentColor="gray"
              />
            </div>
          </motion.div>
        </div>

        {/* COMENTADO - VideoSection "Próximamente" (Tarea 1.3) */}
        {/* <div className="mb-16">
          <VideoSection onComingSoon={handleFeatureComingSoon} />
        </div> */}

      </div>

      {/* 📱 STICKY MOBILE CTA - Botón flotante para móviles */}
      {showHeroSection && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-background via-background to-transparent md:hidden"
        >
          <Button
            onClick={() => setShowGuestModal(true)}
            className="w-full magenta-gradient text-white font-extrabold text-base sm:text-lg px-6 py-5 rounded-xl shadow-2xl hover:shadow-[#E4007C]/70 hover:scale-[1.02] transition-all animate-pulse-subtle"
          >
            ⚡ Chatear Gratis Ahora
          </Button>
        </motion.div>
      )}

      {activeModal === 'RoomsModal' && <RoomsModal isOpen={true} onClose={closeModal} />}
      {activeModal === 'NearbyUsersModal' && <NearbyUsersModal isOpen={true} onClose={closeModal} />}
      {activeModal === 'DenunciaModal' && <DenunciaModal isOpen={true} onClose={closeModal} />}
      {activeModal === 'EventosModal' && <EventosModal isOpen={true} onClose={closeModal} />}
      {activeModal === 'SaludMentalModal' && <SaludMentalModal isOpen={true} onClose={closeModal} />}
      {activeModal === 'AjustesModal' && <AjustesModal isOpen={true} onClose={closeModal} />}
      {activeModal === 'BaulSection' && <BaulSection isOpen={true} onClose={closeModal} />}

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