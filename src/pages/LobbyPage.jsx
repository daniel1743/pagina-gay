import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ENABLE_BAUL } from '@/config/featureFlags';
import { MessageSquare, Shield, Calendar, SlidersHorizontal, Users, Lock, MapPin, Sparkles, Zap, ArrowRight } from 'lucide-react';
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
// ⚠️ MODAL INVITADO ELIMINADO - Solo registro normal
// import { GuestUsernameModal } from '@/components/auth/GuestUsernameModal';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { trackPageView, trackPageExit } from '@/services/eventTrackingService';
import { useCanonical } from '@/hooks/useCanonical';
import { subscribeToRoomMessages } from '@/services/chatService';
import { isSupabaseAuthEnabled } from '@/config/supabase';
import { SkeletonCard, SkeletonRoomsGrid } from '@/components/ui/SkeletonLoader';
import ChatDemo from '@/components/landing/ChatDemo';
import PeakHoursIndicator from '@/components/lobby/PeakHoursIndicator';

// ✅ cardData ahora se genera dinámicamente en el componente para usar contadores reales

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
  const [showQuickSignup, setShowQuickSignup] = useState(false);
  // ⚠️ MODAL INVITADO ELIMINADO - Solo registro normal
  // const [showGuestModal, setShowGuestModal] = useState(false);
  const [recentMessages, setRecentMessages] = useState([]);
  const pageStartRef = useRef(Date.now());

  // ✅ Determinar si mostrar Hero Section (SOLO para usuarios NO logueados)
  const showHeroSection = !user;

  // ✅ Determinar si mostrar componentes para usuarios logueados
  const showWelcomeBack = user && !user.isGuest && !user.isAnonymous;

  console.log('🏠 [LOBBY PAGE] showHeroSection:', showHeroSection);
  console.log('🏠 [LOBBY PAGE] showWelcomeBack:', showWelcomeBack);
  console.log('🏠 [LOBBY PAGE] user.isGuest:', user?.isGuest);
  console.log('🏠 [LOBBY PAGE] user.isAnonymous:', user?.isAnonymous);

  // El preview de mensajes solo se consulta en el flujo Supabase-first.
  useEffect(() => {
    if (!showWelcomeBack || !isSupabaseAuthEnabled()) {
      setRecentMessages([]);
      return undefined;
    }

    const unsubscribe = subscribeToRoomMessages('principal', (messages = []) => {
      setRecentMessages([...messages].slice(-3));
    }, 3);

    return () => unsubscribe?.();
  }, [showWelcomeBack]);

  // ✅ Generar cardData dinámicamente con contadores reales
  // ✅ FASE 1: QUICK WINS - Solo features funcionales (sin "Próximamente")
  const cardData = [
    {
      id: 'salas',
      icon: <MessageSquare className="w-8 h-8" />,
      title: "Chat Principal",
      description: "Conversaciones en tiempo real. Entra al chat principal y participa cuando haya actividad.",
      modal: 'RoomsModal',
      variant: "primary",
      badge: null,
      stats: { label: 'Ver estado de la sala', icon: Users },
      accentColor: "cyan"
    },
    {
      id: 'denuncias',
      icon: <Shield className="w-8 h-8" />,
      title: "Centro de Seguridad",
      description: "Señala comportamiento inadecuado para su revisión. No compartas datos personales innecesarios.",
      modal: 'DenunciaModal',
      variant: "default",
      badge: null,
      stats: { label: "⚠️ Reporte para revisión", icon: Shield },
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

  // 🎯 Tarjeta horizontal de OPIN - Discovery Wall
  const opinCard = {
    id: 'opin',
    icon: <Sparkles className="w-8 h-8" />,
    title: "OPIN - Descubrimiento",
    description: "Publica una intención y descubre si la comunidad responde. La actividad y las respuestas dependen de la participación real.",
    onClick: () => navigate('/opin'),
    variant: "default",
    badge: null,
    stats: { label: "Publica una intención", icon: Users },
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
    pageStartRef.current = Date.now();
    trackPageView('/lobby', 'Chat Gay Chile - Chactivo', { user });

    // Event listener para abrir Centro de Seguridad desde el footer
    const handleOpenDenunciaModal = () => {
      setActiveModal('DenunciaModal');
    };
    window.addEventListener('openDenunciaModal', handleOpenDenunciaModal);

    // Track page exit
    return () => {
      const timeOnPage = Math.round((Date.now() - pageStartRef.current) / 1000);
      trackPageExit('/lobby', timeOnPage, { user });
      window.removeEventListener('openDenunciaModal', handleOpenDenunciaModal);
    };
  }, []);

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
      <div className="cv-page cv-shell w-full min-h-screen pb-16 sm:pb-20">
        {/* ✅ HERO MINIMALISTA - Consolidado y simplificado */}
        {showHeroSection && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="cv-hero relative px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 mb-12 sm:mb-16 overflow-hidden"
          >
          {/* Fondo degradado animado */}
          <div className="cv-hero-wash absolute inset-0" aria-hidden="true"></div>

          <div className="relative max-w-5xl mx-auto">
            <div className="cv-hero-panel rounded-2xl px-5 py-4 text-center">
              <p className="text-sm font-semibold text-cyan-200">La actividad se muestra sin contadores promocionales</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Entra a una sala para comprobar el estado real de la conversación.</p>
            </div>

              {/* Tagline */}
              <div className="cv-chip px-6 py-2 rounded-full">
                <p className="text-sm sm:text-base text-cyan-300 font-medium">
                  Acceso rápido y sin registro
                </p>
              </div>

            {/* ✅ HERO SEO: H1 optimizado para SEO */}
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="cv-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-center mb-4 sm:mb-6 leading-tight px-4"
            >
              Chat Gay Chile: conversa y participa en la comunidad 🏳️‍🌈
            </motion.h1>

            {/* Subtítulo del Hero */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-base sm:text-lg md:text-xl text-center text-muted-foreground mb-8 sm:mb-10 max-w-3xl mx-auto px-4 leading-relaxed"
            >
              Entra al chat y decide cómo participar. La actividad visible depende de las personas que estén usando la comunidad en ese momento.
            </motion.p>

            {/* ✅ CTA PRINCIPAL DEL HERO - OPTIMIZADO */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 sm:mb-10 px-4"
            >
              {/* Botón 1: Chatear Ahora - DIRECTO AL CHAT PRINCIPAL */}
              <Button
                onClick={() => {
                  if (user && !user.isAnonymous && !user.isGuest) {
                    // Usuario registrado: ir directo al chat principal
                    navigate('/chat/principal');
                  } else {
                    // Usuario no registrado: ir a registro con redirección
                    navigate('/auth', { state: { redirectTo: '/chat/principal' } });
                  }
                }}
                className="cv-button-primary text-lg sm:text-xl md:text-2xl px-8 sm:px-12 md:px-16 py-6 sm:py-7 md:py-8 rounded-2xl shadow-2xl w-full sm:w-auto min-h-[56px] sm:min-h-[64px]"
              >
                Entrar al chat principal
              </Button>

              {/* Botón 2: Registrate (acceso completo) */}
              <Button
                onClick={() => {
                  if (user && !user.isAnonymous && !user.isGuest) {
                    // Usuario registrado: ir directo al chat principal
                    navigate('/chat/principal');
                  } else {
                    setShowQuickSignup(true);
                  }
                }}
                variant="outline"
                className="cv-button-secondary text-base sm:text-lg md:text-xl px-6 sm:px-8 md:px-12 py-5 sm:py-6 md:py-7 rounded-xl w-full sm:w-auto min-h-[48px]"
              >
                Crear mi cuenta
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 mb-10 px-4"
            >
              <div className="mx-auto max-w-3xl rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-6 text-center">
                <h2 className="text-xl font-bold text-cyan-200">Comunidad y privacidad primero</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  No mostramos ratings, contadores ni testimonios fabricados. La disponibilidad de conversaciones depende de la actividad real; las normas y herramientas de reporte están visibles para todos.
                </p>
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
                Explora el chat principal y decide si quieres participar.
              </p>
              <Button
                onClick={() => navigate('/auth', { state: { redirectTo: '/chat/principal' } })}
                className="cv-button-primary text-lg sm:text-xl px-10 sm:px-14 py-6 sm:py-7 rounded-xl shadow-xl"
              >
                Explorar el chat
              </Button>
            </motion.div>

            {/* Estado de comunidad: sin testimonios ni actividad sintética */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-16 sm:mt-20 mb-12 sm:mb-16 px-4"
            >
              <div className="mx-auto max-w-4xl rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-6 text-center sm:p-10">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">Actividad verificable</p>
                <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">Participa cuando encuentres una conversación útil</h2>
                <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
                  No usamos testimonios, ratings ni contadores para aparentar movimiento. El chat, OPIN y las respuestas muestran únicamente actividad que proviene de la comunidad.
                </p>
                <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                  <Button
                    type="button"
                    onClick={() => navigate('/chat/principal')}
                    className="magenta-gradient min-h-12 rounded-xl px-7 text-base font-bold text-white"
                  >
                    Revisar el chat principal
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/opin')}
                    className="min-h-12 rounded-xl border-cyan-500/40 px-7 text-base font-semibold text-cyan-300 hover:bg-cyan-500/10"
                  >
                    Explorar OPIN
                  </Button>
                </div>
              </div>
            </motion.section>

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
                            Creé <span className="font-bold text-cyan-400">Chactivo</span> para ofrecer una alternativa a las experiencias llenas de
                            <span className="font-semibold text-red-400 line-through mx-1">ruido promocional</span> y actividad que no se puede comprobar.
                          </p>

                          <p className="text-gray-300">
                            Aquí encontrarás <span className="font-bold text-green-400">✓ Conversaciones sin relleno</span>,
                            <span className="font-bold text-green-400 mx-1">✓ Interfaz sin ruido promocional</span>,
                            <span className="font-bold text-green-400 mx-1">✓ Normas y controles visibles</span>.
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
                            <p className="text-xs text-gray-400">Proyecto</p>
                            <p className="text-lg font-bold text-cyan-400">Comunitario</p>
                          </div>
                          <div className="glass-effect px-4 py-2 rounded-lg border border-purple-500/30">
                            <p className="text-xs text-gray-400">Actividad</p>
                            <p className="text-lg font-bold text-purple-400">Participación real</p>
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
                  // Usuario registrado: ir directo al chat principal
                  navigate('/chat/principal');
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
              Privacidad explicada con claridad
            </span>
          </h2>
          <p className="text-center text-lg sm:text-xl text-muted-foreground mb-12 max-w-3xl mx-auto">
            Conoce qué puedes compartir, qué controles existen y qué límites tiene el servicio:
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
              <h3 className="text-lg font-bold text-center mb-2 text-cyan-400">Datos y privacidad explicados</h3>
              <p className="text-sm text-center text-gray-300 leading-relaxed">
                La política de privacidad describe qué información puede tratar el servicio y para qué. No compartas datos sensibles en una sala pública.
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
              <h3 className="text-lg font-bold text-center mb-2 text-purple-400">Privacidad con límites claros</h3>
              <p className="text-sm text-center text-gray-300 leading-relaxed">
                Puedes usar un alias cuando la función lo permita, pero una conversación pública no equivale a anonimato total. No compartas datos sensibles.
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
              <h3 className="text-lg font-bold text-center mb-2 text-green-400">Herramientas de control</h3>
              <p className="text-sm text-center text-gray-300 leading-relaxed">
                Bloquea o reporta cuando esas herramientas estén disponibles y revisa las normas antes de publicar. No prometemos moderación instantánea.
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
              <h3 className="text-lg font-bold text-center mb-2 text-red-400">Información transparente</h3>
              <p className="text-sm text-center text-gray-300 leading-relaxed">
                La política de privacidad explica qué información puede tratar el servicio. No afirmamos ausencia absoluta de seguimiento sin una verificación técnica vigente.
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
              <h3 className="text-lg font-bold text-center mb-2 text-yellow-400">Gestión de cuenta</h3>
              <p className="text-sm text-center text-gray-300 leading-relaxed">
                Consulta las opciones de cuenta y la política de privacidad para conocer el proceso aplicable. Los plazos dependen del backend y sus copias.
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
              <h3 className="text-lg font-bold text-center mb-2 text-blue-400">Privacidad del canal</h3>
              <p className="text-sm text-center text-gray-300 leading-relaxed">
                La protección depende del canal y de su configuración técnica. No describimos el chat como cifrado de extremo a extremo sin validación específica.
              </p>
            </motion.div>
          </div>

          <section
            aria-labelledby="verified-capabilities-title"
            className="mx-auto max-w-3xl rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6 sm:p-8"
          >
            <h3 id="verified-capabilities-title" className="text-2xl font-bold text-center text-cyan-200">
              Lo que sí puedes comprobar aquí
            </h3>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-border/60 bg-background/30 p-4 text-center">
                <p className="font-semibold">Chat y OPIN</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Dos entradas visibles para conversar o publicar una intención.</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/30 p-4 text-center">
                <p className="font-semibold">Actividad real</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">No rellenamos la interfaz con perfiles, mensajes o contadores de muestra.</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/30 p-4 text-center">
                <p className="font-semibold">Normas visibles</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Consulta límites, privacidad y opciones de ayuda antes de participar.</p>
              </div>
            </div>
          </section>

          {/* 🎯 CTA INTERMEDIO - Después de Privacy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-12 sm:mt-16 mb-8 px-4"
          >
            <div className="glass-effect max-w-2xl mx-auto p-8 sm:p-10 rounded-2xl border border-green-500/30">
              <h3 className="text-2xl sm:text-3xl font-bold mb-4 bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
                ¿Quieres conocer los límites antes de participar?
              </h3>
              <p className="text-base sm:text-lg text-muted-foreground mb-6 leading-relaxed">
                Revisa las normas y la política de privacidad. Comparte solo lo necesario y usa las herramientas de control cuando estén disponibles.
              </p>
              <Button
                onClick={() => navigate('/auth', { state: { redirectTo: '/chat/principal' } })}
                className="cv-button-primary text-lg sm:text-xl px-10 sm:px-14 py-6 sm:py-7 rounded-xl shadow-xl"
              >
                Entrar al chat y revisar las normas
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
                  Según la sala, puedes usar un alias o necesitar registro. Revisa los requisitos antes de participar.
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
                <h3 className="text-xl sm:text-2xl font-bold mb-3">Entra al Chat Principal</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                  Una sala principal para participar cuando quieras conversar. La actividad visible depende de la comunidad.
                </p>
                <div className="inline-block px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full">
                  <p className="text-xs sm:text-sm font-semibold text-purple-400">🎯 Todo en un solo lugar</p>
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
                  Chat en vivo y comunidad. Participa con criterio y comparte solo lo necesario.
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
                a: "El chat público está disponible sin pago y algunas salas pueden solicitar registro. Las funciones Premium, si están habilitadas, son opcionales y deben revisarse en la pantalla correspondiente."
              },
              {
                q: "¿Necesito dar mi email o teléfono?",
                a: "Para algunas entradas públicas puedes participar sin proporcionar email o teléfono, usando un alias. Una cuenta registrada puede requerir otros datos; comparte solo lo necesario y revisa la política de privacidad vigente."
              },
              {
                q: "¿Cómo protegen mi privacidad?",
                a: "Puedes participar con un alias y evitar publicar datos personales, pero no prometemos anonimato total. El sitio puede utilizar herramientas técnicas de analítica; no compartas ubicación exacta, teléfono, correo ni información sensible en salas públicas."
              },
              {
                q: "¿Hay moderación? ¿Cómo funciona?",
                a: "Hay filtros locales para algunos patrones de spam o riesgo y herramientas de reporte cuando están disponibles. Los filtros pueden equivocarse y ningún sistema garantiza una revisión inmediata."
              },
              {
                q: "¿Puedo eliminar mi cuenta y datos?",
                a: "Si la opción de eliminación está disponible en Configuración, sigue sus pasos y conserva la confirmación. No prometemos borrado inmediato, eliminación de copias de seguridad ni un plazo universal sin verificar primero el backend y la política vigente."
              },
              {
                q: "¿Por qué no hay anuncios?",
                a: "Priorizamos una interfaz sin anuncios intrusivos. La medición técnica del sitio puede utilizar herramientas de analítica; revisa la información de privacidad antes de compartir datos personales."
              },
              {
                q: "¿Es seguro para profesionales o personas públicas?",
                a: "Puedes usar un alias y decidir qué información compartir, pero no prometemos anonimato total ni invulnerabilidad. No publiques datos sensibles, ubicación exacta, teléfono o correo en una sala pública."
              },
              {
                q: "¿Cómo reporto comportamiento inapropiado?",
                a: "Usa la opción Reportar que aparece en el mensaje o perfil cuando esté disponible y describe el problema sin incluir datos sensibles. Los filtros locales ayudan a detectar algunos patrones, pero no sustituyen tu criterio."
              },
              {
                q: "¿Verifican que los usuarios sean reales?",
                a: "La insignia de verificación es opcional y no constituye una prueba absoluta de identidad. Si algo te parece sospechoso, no compartas datos ni continúes la conversación."
              },
              {
                q: "¿Qué diferencia a Chactivo de Grindr o Tinder?",
                a: "Nuestro enfoque combina conversación y comunidad, no solo citas. Puedes participar con un alias, usar herramientas de reporte cuando estén disponibles y decidir qué compartir. La actividad depende de las personas reales que participen; el chat público no requiere pago."
              },
            ].map((faq, index) => (
              <motion.details
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                className="cv-card cv-card-interactive rounded-xl transition-all group"
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
              onClick={() => navigate('/auth', { state: { redirectTo: '/chat/principal' } })}
              className="magenta-gradient text-white font-bold text-lg sm:text-xl px-8 sm:px-12 py-6 sm:py-7 rounded-xl shadow-xl hover:shadow-[#E4007C]/50 hover:scale-105 transition-all"
            >
              ⚡ Chatear Ahora - Gratis
            </Button>
          </motion.div>
          </motion.section>
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
            {showWelcomeBack && recentMessages.length > 0 && (
              <section
                aria-labelledby="recent-conversations-title"
                className="cv-card mb-10 rounded-2xl p-6 sm:mb-12 sm:p-8"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 id="recent-conversations-title" className="text-xl font-bold text-cyan-200">Conversaciones recientes</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Vista previa de mensajes reales disponibles en la sala principal.</p>
                  </div>
                  <Button type="button" onClick={() => navigate('/chat/principal')} className="min-h-11 rounded-xl bg-primary px-5 font-semibold text-primary-foreground">
                    Abrir chat
                  </Button>
                </div>
                <div className="mt-5 space-y-2 rounded-xl border border-border/70 bg-background/40 p-4">
                  {recentMessages.map((msg) => (
                    <p key={msg.id} className="truncate text-sm text-muted-foreground">
                      <span className="font-semibold text-cyan-200">{msg.username || 'Participante'}:</span>{' '}
                      {msg.content?.substring(0, 100)}{msg.content?.length > 100 ? '…' : ''}
                    </p>
                  ))}
                </div>
              </section>
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
                  <h3 className="text-lg sm:text-xl font-bold text-foreground flex items-center justify-center gap-2">
                    📊 Tu Actividad
                  </h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Mensajes enviados */}
                  <div className="cv-card cv-card-interactive p-5 text-center">
                    <MessageSquare className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                    <p className="text-2xl sm:text-3xl font-bold text-cyan-400">
                      {user.stats?.messagesSent || 0}
                    </p>
                    <p className="text-xs font-medium text-foreground/68 dark:text-gray-300 mt-1">Mensajes enviados</p>
                  </div>

                  {/* Salas visitadas */}
                  <div className="cv-card cv-card-interactive p-5 text-center">
                    <Users className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                    <p className="text-2xl sm:text-3xl font-bold text-purple-400">
                      {user.stats?.roomsVisited || 0}
                    </p>
                    <p className="text-xs font-medium text-foreground/68 dark:text-gray-300 mt-1">Salas visitadas</p>
                  </div>

                  {/* Días activo */}
                  <div className="cv-card cv-card-interactive p-5 text-center">
                    <Calendar className="w-6 h-6 text-green-400 mx-auto mb-2" />
                    <p className="text-2xl sm:text-3xl font-bold text-green-400">
                      {calculateActiveDays(user.createdAt)}
                    </p>
                    <p className="text-xs font-medium text-foreground/68 dark:text-gray-300 mt-1">Días activo</p>
                  </div>

                  {/* Nivel */}
                  <div className="cv-card cv-card-interactive p-5 text-center">
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

            {/* Título de sección: Explora */}
            <div className="text-center mb-8 sm:mb-10">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent leading-tight">
                {showWelcomeBack ? 'Explora' : 'Explora Chactivo'}
              </h2>
              <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed px-4">
                {showWelcomeBack ? 'Elige dónde quieres conectar hoy' : 'Conecta, chatea y descubre la comunidad gay de Chile'}
              </p>
            </div>

            {/* Indicador de horas pico */}
            <div className="max-w-7xl mx-auto mb-4">
              <PeakHoursIndicator />
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

              {/* 2. OPIN - Discovery Wall */}
              <FeatureCard
                key="opin-discovery"
                icon={<Sparkles className="w-8 h-8" />}
                title="OPIN - Descubrimiento"
                description="Publica una intención y descubre si la comunidad responde. La actividad y las respuestas dependen de la participación real."
                onClick={() => navigate('/opin')}
                index={1}
                variant="default"
                badge={null}
                stats={{ label: "Publica una intención", icon: Users }}
                accentColor="purple"
              />

              {ENABLE_BAUL && (
                <FeatureCard
                  key="baul-perfiles"
                  icon={<Users className="w-8 h-8" />}
                  title="Baúl de Perfiles"
                  description="Crea tu tarjeta con tu info. Da likes, deja mensajes. Cuando vuelvas verás quién se interesó en ti."
                  onClick={() => navigate('/baul')}
                  index={2}
                  variant="default"
                  badge="🆕 Nuevo"
                  stats={{ label: "❤️ Conecta diferente", icon: Users }}
                  accentColor="pink"
                />
              )}

              {/* 4. Ajustes */}
              <FeatureCard
                key="ajustes"
                icon={<SlidersHorizontal className="w-8 h-8" />}
                title="Ajustes"
                description="Personaliza tu experiencia: temas, notificaciones, privacidad y preferencias de la app."
                onClick={() => handleCardClick('AjustesModal', { title: 'Ajustes', badge: 'Próximamente' })}
                index={3}
                variant="default"
                badge="Próximamente"
                stats={{ label: "⚙️ Personalizar", icon: SlidersHorizontal }}
                accentColor="gray"
              />
            </div>
          </motion.div>
        </div>

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
            onClick={() => navigate('/auth', { state: { redirectTo: '/chat/principal' } })}
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

      {/* ⚠️ MODAL INVITADO ELIMINADO - Solo registro normal en /auth */}

    </>
  );
};

export default LobbyPage;
