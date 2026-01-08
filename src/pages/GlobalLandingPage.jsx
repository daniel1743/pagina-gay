import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Star, ArrowRight, Zap, Shield, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCanonical } from '@/hooks/useCanonical';
import ChatDemo from '@/components/landing/ChatDemo';
import { GuestUsernameModal } from '@/components/auth/GuestUsernameModal';
// ⚠️ TOAST ELIMINADO (06/01/2026) - A petición del usuario
// import LandingCaptureToast from '@/components/landing/LandingCaptureToast';
// ⚠️ MODAL COMENTADO - Usamos entrada directa como invitado (sin opciones)
// import { EntryOptionsModal } from '@/components/auth/EntryOptionsModal';

// 10 avatares para asignación aleatoria
const AVATAR_OPTIONS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=avatar1',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=avatar2',
  'https://api.dicebear.com/7.x/bottts/svg?seed=avatar3',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=avatar4',
  'https://api.dicebear.com/7.x/identicon/svg?seed=avatar5',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=avatar6',
  'https://api.dicebear.com/7.x/bottts/svg?seed=avatar7',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=avatar8',
  'https://api.dicebear.com/7.x/identicon/svg?seed=avatar9',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=avatar10',
];

/**
 * Componente inline de entrada rápida - Versión horizontal sin modal
 */
const InlineGuestEntry = ({ chatRoomId = 'principal' }) => {
  const navigate = useNavigate();
  const { signInAsGuest } = useAuth();
  const [nickname, setNickname] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!nickname.trim()) {
      setError('Ingresa tu nickname');
      return;
    }
    if (nickname.trim().length < 3) {
      setError('El nickname debe tener al menos 3 caracteres');
      return;
    }
    if (!acceptedTerms) {
      setError('Debes aceptar que eres mayor de 18 años');
      return;
    }

    setIsLoading(true);

    try {
      const randomAvatar = AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];
      
      // Navegación optimista
      navigate(`/chat/${chatRoomId}`, { replace: true });

      // Crear usuario en background
      signInAsGuest(nickname.trim(), randomAvatar)
        .then(() => {
          console.log('✅ Usuario creado en background');
        })
        .catch((error) => {
          console.error('❌ Error en background:', error);
        });
    } catch (error) {
      setError(`Error al entrar: ${error.message || 'Intenta de nuevo.'}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div 
        className="glass-effect rounded-2xl border-2 border-purple-500/30 hover:border-purple-500/50 transition-all overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
        }}
      >
        {/* ✅ Header con Imagen (gente-guapa.png) */}
        <div className="w-full h-40 bg-gray-900 relative">
          <img 
            src="/MODELO 1.jpeg" 
            alt="Gente Guapa" 
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback si no existe la imagen aún
              e.target.style.display = 'none';
              e.target.parentNode.classList.add('flex', 'items-center', 'justify-center');
              e.target.parentNode.innerHTML += '<span class="text-purple-400 font-bold text-xl">Chatea con Gente Real</span>';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
          <div className="absolute bottom-4 left-6">
            <h2 className="text-2xl font-bold text-white shadow-black drop-shadow-md">
              Chatea YA
            </h2>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="w-full">
            <div className="mb-6">
              <label className="block text-xl font-black text-white mb-3 text-left">
                🚀 Entra al Chat Ahora:
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Tu nombre (ej: Carlos23)"
                maxLength={20}
                required
                disabled={isLoading}
                autoFocus
                className="w-full px-4 py-4 text-lg border-2 border-purple-500/50 rounded-xl outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 bg-white/95 text-gray-900 font-bold transition-all mb-2"
              />
              <p className="text-green-300 font-bold text-base text-center">
                ✅ 100% Gratis • Sin registro • Sin email
              </p>
            </div>

            {/* ✅ Checkbox Mayor de 18 */}
            <div className="mb-6 flex items-start gap-3 p-3 rounded-lg bg-purple-900/20 border border-purple-500/20">
              <input
                type="checkbox"
                id="terms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
              <label htmlFor="terms" className="text-sm text-gray-300 cursor-pointer leading-snug">
                Acepto que soy <span className="font-bold text-white">mayor de 18 años</span> y entro al sitio por mi voluntad.
              </label>
            </div>

            {/* ✅ Desplegable de Reglas */}
            <div className="mb-6">
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-purple-300 hover:text-purple-200 transition-colors p-2 rounded hover:bg-white/5">
                  <span>📜 Reglas Anti-Spam y Conducta</span>
                  <span className="transition-transform group-open:rotate-180">▼</span>
                </summary>
                <div className="mt-3 text-xs text-gray-300 space-y-2 p-3 bg-black/20 rounded-lg border border-white/10">
                  <p>🚫 <span className="font-bold text-red-400">Prohibido Spam:</span> No promociones otros sitios, grupos o servicios.</p>
                  <p>🚫 <span className="font-bold text-red-400">Cero Odio:</span> Discriminación, racismo o insultos serán baneados.</p>
                  <p>🚫 <span className="font-bold text-red-400">No Venta:</span> Prohibida la venta de contenido o servicios.</p>
                  <p>✅ <span className="font-bold text-green-400">Respeto:</span> Trata a los demás como quieres ser tratado.</p>
                  <p className="text-[10px] text-gray-500 mt-2 italic">El incumplimiento resultará en bloqueo permanente.</p>
                </div>
              </details>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm font-medium text-center animate-pulse">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !nickname.trim() || !acceptedTerms}
              className="w-full py-4 text-xl font-bold text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] shadow-xl hover:shadow-purple-500/40 flex items-center justify-center gap-2"
              style={{
                background: isLoading || !nickname.trim() || !acceptedTerms
                  ? 'linear-gradient(135deg, #666 0%, #444 100%)'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              {isLoading ? '⏳ Entrando...' : '🚀 ENTRAR AL CHAT'}
            </button>
            
            <p className="text-xs text-gray-400 mt-4 text-center">
              Protegemos tu privacidad • 100% Anónimo
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

const GlobalLandingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [showGuestModal, setShowGuestModal] = React.useState(false);
  const [loadTime, setLoadTime] = React.useState(null); // ⚡ Medir tiempo de carga
  const [shouldAutoOpen, setShouldAutoOpen] = React.useState(false); // ⚡ Auto-abrir si carga es rápida
  
  // 🔥 Carrusel de imágenes - 5 modelos que cambian cada 3 segundos
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const modelImages = [
    '/MODELO 1.jpeg',
    '/MODELO 2.jpeg',
    '/MODELO 3.jpeg',
    '/MODELO 4.jpeg',
    '/MODELO 5.jpeg'
  ];

  // ⚡ MEDIR VELOCIDAD DE CARGA (Solo para mostrar métrica, sin auto-abrir modal)
  React.useEffect(() => {
    const startTime = performance.now();

    // Preload de recursos críticos
    const preloadImages = modelImages.slice(0, 2); // Preload primeras 2 imágenes
    preloadImages.forEach((img) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = img;
      document.head.appendChild(link);
    });

    // Medir cuando la página está lista
    const measureLoad = () => {
      const endTime = performance.now();
      const loadDuration = endTime - startTime;
      setLoadTime(loadDuration);

      // ⚠️ AUTO-APERTURA DESACTIVADA - El usuario puede explorar la landing libremente
      // La entrada al chat ahora es 100% voluntaria mediante los botones CTA
      /*
      if (loadDuration < 2000 && !user) {
        setShouldAutoOpen(true);
        setTimeout(() => {
          setShowGuestModal(true);
        }, 500);
      }
      */
    };

    // Medir cuando todo está listo
    if (document.readyState === 'complete') {
      measureLoad();
    } else {
      window.addEventListener('load', measureLoad);
      return () => window.removeEventListener('load', measureLoad);
    }
  }, [user, modelImages]);
  
  // ⚠️ MODAL COMENTADO - Ya no usamos EntryOptionsModal
  // const [showEntryModal, setShowEntryModal] = React.useState(false);

  // ⚠️ MODAL COMENTADO - Ya no usamos EntryOptionsModal, entrada directa como invitado
  // React.useEffect(() => {
  //   const searchParams = new URLSearchParams(location.search);
  //   if (searchParams.get('openEntry') === 'true') {
  //     if (!user || user.isGuest || user.isAnonymous) {
  //       setShowGuestModal(true); // Abrir directamente el modal de invitado
  //       navigate(location.pathname, { replace: true });
  //     }
  //   }
  // }, [location.search, user, navigate, location.pathname]);

  // Cambiar imagen cada 3 segundos (declaraciones en línea 199-200)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % modelImages.length);
    }, 3000); // 3 segundos

    return () => clearInterval(interval);
  }, [modelImages.length]);

  // ✅ SEO: Canonical tag dinámico basado en la ruta actual
  const isHomePage = location.pathname === '/';
  useCanonical(isHomePage ? '/' : '/global');

  // ✅ REMOVED: Redirect automático eliminado para permitir navegación libre
  // Los usuarios autenticados ahora pueden visitar la página de inicio sin ser redirigidos
  // React.useEffect(() => {
  //   if (user && !user.isGuest && !user.isAnonymous) {
  //     navigate('/chat/global', { replace: true });
  //   }
  // }, [user, navigate]);

  React.useEffect(() => {
    // ✅ SEO: Title y meta description optimizados - Keywords: chat gay chile, chat gay gratis, chat gay sin registro
    const previousTitle = document.title;
    
    const metaDescription = document.querySelector('meta[name="description"]');
    const hadMetaDescription = !!metaDescription;
    const previousDescription = metaDescription?.getAttribute('content') ?? '';

    document.title = 'Chat gay Chile | Gratis y anónimo';
    
    let ensuredMeta = metaDescription;
    if (!ensuredMeta) {
      ensuredMeta = document.createElement('meta');
      ensuredMeta.name = 'description';
      document.head.appendChild(ensuredMeta);
    }
    
    ensuredMeta.content = 'Chat gay Chile sin registro. Conocer hombres reales, chat gay activo, chatear gratis sin cuenta. Gente real de trabajo conversando ahora.';

    return () => {
      // Restore title
      document.title = previousTitle;

      // Restore or remove meta description depending on previous state
      const currentMeta = document.querySelector('meta[name="description"]');
      if (!currentMeta) return;

      if (hadMetaDescription) {
        currentMeta.setAttribute('content', previousDescription);
      } else {
        currentMeta.remove();
      }
    };
  }, []);

  const handleChatearAhora = () => {
    if (user && !user.isGuest && !user.isAnonymous) {
      navigate('/chat/principal');
    } else if (user && (user.isGuest || user.isAnonymous)) {
      // Usuario ya anónimo/guest - ir directo al chat
      navigate('/chat/principal');
    } else {
      // No hay usuario - abrir modal de invitado directamente (sin opciones)
      setShowGuestModal(true);
    }
  };

  // ⚠️ MODAL COMENTADO - Ya no usamos EntryOptionsModal
  // const handleContinueWithoutRegister = () => {
  //   setShowEntryModal(false);
  //   setTimeout(() => {
  //     setShowGuestModal(true);
  //   }, 150);
  // };

  // COMENTADO: Botón crear cuenta deshabilitado
  // const handleRegistrar = () => {
  //   if (user && !user.isGuest) {
  //     navigate('/chat/global');
  //   } else {
  //     navigate('/auth', { state: { redirectTo: '/chat/global' } });
  //   }
  // };

  const handleEnterChat = () => {
    if (user && !user.isGuest && !user.isAnonymous) {
      navigate('/chat/principal');
    } else if (user && (user.isGuest || user.isAnonymous)) {
      // Usuario ya anónimo/guest - ir directo al chat
      navigate('/chat/principal');
    } else {
      // No hay usuario - abrir modal de invitado directamente (sin opciones)
      setShowGuestModal(true);
    }
  };

  return (
    <div className="min-h-screen">
      {/* 🎯 HERO MOBILE-FIRST - Un solo hero, copy directo, CTA único */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full relative overflow-hidden"
      >
        {/* Mobile: max 60vh, Desktop: max 75vh */}
        <div className="w-full h-[60vh] md:h-[75vh] relative group">
          {/* Carrusel de imágenes con transición suave - Solo la imagen cambia */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImageIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              className="absolute inset-0 w-full h-full"
            >
              <div className="w-full h-full relative overflow-hidden">
                {/* Imagen contextual (no protagonista) */}
                <img 
                  src={encodeURI(modelImages[currentImageIndex])}
                  alt="Chat activo en Chile"
                  className="absolute inset-0 w-full h-full object-cover object-center"
                  loading={currentImageIndex === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  fetchpriority={currentImageIndex === 0 ? 'high' : 'low'}
                  onError={(e) => {
                    console.error('Error cargando imagen:', modelImages[currentImageIndex]);
                    // Intentar con ruta alternativa sin espacios
                    const altPath = modelImages[currentImageIndex].replace(' ', '%20');
                    if (e.target.src !== altPath) {
                      e.target.src = altPath;
                    } else {
                      e.target.style.display = 'none';
                    }
                  }}
                />
                
                {/* Overlay oscuro para legibilidad del texto */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              </div>
            </motion.div>
          </AnimatePresence>
          
          {/* Contenido sobre la imagen - Fijo, no cambia con las imágenes */}
          <div className="absolute inset-0 z-10 h-full flex items-center justify-center px-4 sm:px-6">
            <div className="text-center max-w-3xl w-full">
              {/* H1 Principal - MENSAJE INICIAL CLARO Y DIRECTO */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-5 drop-shadow-2xl leading-tight px-2"
              >
                <span className="bg-gradient-to-r from-purple-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
                  🏳️‍🌈 Chat Gay Chile
                </span>
              </motion.h1>
              
              {/* H2 - MENSAJE CLARO: Entra y chatea YA */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="text-xl sm:text-2xl md:text-3xl text-white font-bold drop-shadow-lg mb-3 sm:mb-4 leading-tight px-2"
              >
                Entra y chatea con gente real. Sin registro, sin vueltas.
              </motion.h2>
              
              {/* H3 - MENSAJE ADICIONAL CLARO */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="text-base sm:text-lg md:text-xl text-white/90 font-medium drop-shadow-md mb-5 sm:mb-6 px-2"
              >
                Gente real de trabajo conversando ahora. 100% gratis y anónimo.
              </motion.p>
              
              {/* CTA - Directo y urgente */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Button
                  onClick={handleChatearAhora}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black px-6 sm:px-10 py-3 sm:py-4 text-base sm:text-lg rounded-xl shadow-2xl hover:shadow-purple-500/50 transition-all hover:scale-105 w-full sm:w-auto uppercase tracking-wide"
                  style={{ minHeight: '48px' }}
                >
                  ¡ENTRAR AL CHAT YA!
                </Button>
              </motion.div>
              
              {/* Microcopy - MENSAJE CLARO Y DIRECTO */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="mt-4 sm:mt-5 space-y-2"
              >
                <p className="text-base sm:text-lg text-white font-bold">
                  ⚡ Entra en 1 clic • 💬 Chatea con gente real • 🔒 100% Anónimo
                </p>
                {loadTime && loadTime < 2000 && (
                  <p className="text-sm text-green-300 font-semibold animate-pulse">
                    ⚡ Carga ultra-rápida: {loadTime.toFixed(0)}ms
                  </p>
                )}
              </motion.div>
            </div>
          </div>

          {/* Indicadores de imágenes (puntos) - Minimizados al 30% */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-20 flex gap-0.5">
            {modelImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`transition-all duration-300 rounded-full ${
                  index === currentImageIndex
                    ? 'w-1 h-1 bg-white/50'
                    : 'w-0.5 h-0.5 bg-white/20 hover:bg-white/30'
                }`}
                aria-label={`Ir a imagen ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Contenido principal - Mobile-first, compacto */}
      <div className="px-3 sm:px-4 py-4 sm:py-6">
        <div className="max-w-5xl mx-auto">
        
        {/* 🎯 MODAL INLINE - Entrada directa entre hero y chat demo */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 sm:mb-12 w-full"
        >
          <InlineGuestEntry chatRoomId="principal" />
        </motion.section>
        
        {/* 🔥 CHAT DEMO - Vista previa interactiva con animaciones avanzadas */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8 sm:mb-12 w-full"
        >
          <ChatDemo onJoinClick={handleChatearAhora} />
        </motion.section>

        {/* 🎯 SECCIÓN TRUST SIGNALS - Compacta */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 sm:mt-8 mb-6 sm:mb-8 px-3"
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
                  150+
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

            {/* Mini testimonios - Tono WhatsApp, directo y corto */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="overflow-hidden"
            >
              <div className="flex animate-marquee-slow">
                {[
                  { text: "Al fin un chat real, sin bots", author: "Carlos, 28" },
                  { text: "Gente real hablando de verdad", author: "Andrés, 35" },
                  { text: "Sin perfiles falsos ni spam", author: "Matías, 24" },
                  { text: "Funciona de verdad", author: "Diego, 31" },
                ].concat([
                  { text: "Al fin un chat real, sin bots", author: "Carlos, 28" },
                  { text: "Gente real hablando de verdad", author: "Andrés, 35" },
                  { text: "Sin perfiles falsos ni spam", author: "Matías, 24" },
                  { text: "Funciona de verdad", author: "Diego, 31" },
                ]).map((testimonial, index) => (
                  <div key={index} className="flex-shrink-0 mx-2">
                    <div className="bg-gray-800/50 backdrop-blur-sm px-4 py-2.5 rounded-lg border border-purple-500/30 min-w-[240px]">
                      <p className="text-sm text-white font-medium mb-1">"{testimonial.text}"</p>
                      <p className="text-xs text-purple-300">- {testimonial.author}</p>
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

        {/* 🎯 CTA INTERMEDIO - Directo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mt-6 sm:mt-8 mb-6"
        >
          <Button
            onClick={handleChatearAhora}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-base sm:text-lg px-8 sm:px-12 py-4 sm:py-5 rounded-xl shadow-xl hover:shadow-purple-500/50 hover:scale-105 transition-all uppercase tracking-wide"
          >
            ¡ENTRAR AL CHAT YA!
          </Button>
        </motion.div>


        {/* How It Works Section - Simplificado */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8 sm:mb-12"
        >
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-6">
            Cómo funciona
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-2xl font-black text-white">
                1
              </div>
              <h3 className="text-lg font-bold mb-2">Entra sin registro</h3>
              <p className="text-sm text-muted-foreground">
                Solo elige un nombre. Sin email, sin tarjeta.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl font-black text-white">
                2
              </div>
              <h3 className="text-lg font-bold mb-2">Chatea ya</h3>
              <p className="text-sm text-muted-foreground">
                Entra y habla con gente real. Sin vueltas.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center text-2xl font-black text-white">
                3
              </div>
              <h3 className="text-lg font-bold mb-2">Conecta</h3>
              <p className="text-sm text-muted-foreground">
                Encuentra con quién hablar. Gente real, conversación real.
              </p>
            </div>
          </div>
        </motion.section>


        {/* ✅ SECCIÓN DEL CREADOR - Compacta */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-8 sm:mt-10 mb-8 sm:mb-10 px-3"
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
                        if (e.target.nextElementSibling) {
                          e.target.nextElementSibling.style.display = 'flex';
                        }
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

                    {/* Subtítulo - Directo */}
                    <motion.p
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.1 }}
                      className="text-lg sm:text-xl font-bold text-purple-400 mb-4"
                    >
                      Creador de Chactivo 🏳️‍🌈
                    </motion.p>

                    {/* Mensaje principal - Tono urbano y directo */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.2 }}
                      className="space-y-3 text-base sm:text-lg leading-relaxed"
                    >
                      <p className="text-gray-300">
                        Creé <span className="font-bold text-cyan-400">Chactivo</span> porque estaba <span className="font-bold text-red-400">harto</span> de las apps falsas. Llenas de bots, perfiles fake y publicidad por todos lados.
                      </p>

                      <p className="text-gray-300">
                        Acá es simple: <span className="font-bold text-green-400">Gente real</span>, <span className="font-bold text-green-400">sin vueltas</span>, <span className="font-bold text-green-400">sin estafas</span>.
                      </p>

                      <p className="text-cyan-300 font-bold text-lg sm:text-xl">
                        Un espacio hecho por y para nosotros. Gente de trabajo, gente real. 🇨🇱
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

        {/* Final CTA */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-center"
        >
          <div className="glass-effect rounded-3xl p-10 sm:p-16 border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-900/20 to-blue-900/20">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
              ¿Listo para Conectar con Gays de Todo Chile?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Únete a la sala más activa de Chactivo. Conversación real, ambiente relajado, 100% gratis.
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={handleEnterChat}
                size="lg"
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xl sm:text-2xl px-12 sm:px-20 py-6 sm:py-8 rounded-2xl shadow-2xl"
              >
                <MessageSquare className="w-7 h-7 mr-3" />
                Entrar al Chat Ahora
                <ArrowRight className="w-7 h-7 ml-3" />
              </Button>
            </motion.div>
            <p className="text-sm text-muted-foreground mt-6">
              💬 La sala más popular • 🔒 100% anónimo • ⚡ Registro rápido gratis
            </p>
          </div>
        </motion.section>
        </div>
      </div>

      {/* 📱 STICKY MOBILE CTA - Botón flotante para móviles */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-background via-background to-transparent md:hidden"
      >
        <Button
          onClick={handleChatearAhora}
          className="w-full magenta-gradient text-white font-extrabold text-base sm:text-lg px-6 py-5 rounded-xl shadow-2xl hover:shadow-[#E4007C]/70 hover:scale-[1.02] transition-all animate-pulse-subtle"
        >
          ⚡ Chatear Gratis Ahora
        </Button>
      </motion.div>

      {/* ⚠️ MODAL COMENTADO - EntryOptionsModal eliminado, entrada directa como invitado */}
      {/* <EntryOptionsModal
        open={showEntryModal}
        onClose={() => setShowEntryModal(false)}
        chatRoomId="principal"
        onContinueWithoutRegister={handleContinueWithoutRegister}
      /> */}

      {/* ⚠️ TOAST ELIMINADO (06/01/2026) - A petición del usuario */}
      {/* Toast de Captación Estratégico */}
      {/* <LandingCaptureToast
        onEnterClick={handleChatearAhora}
      /> */}

      {/* Guest Username Modal (Sin Registro) */}
      <GuestUsernameModal
        open={showGuestModal}
        onClose={() => setShowGuestModal(false)}
        chatRoomId="principal"
      />
    </div>
  );
};

export default GlobalLandingPage;
