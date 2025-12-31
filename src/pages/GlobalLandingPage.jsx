import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Users, Heart, Star, ArrowRight, Zap, Shield, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCanonical } from '@/hooks/useCanonical';
import ChatDemo from '@/components/landing/ChatDemo';
import { GuestUsernameModal } from '@/components/auth/GuestUsernameModal';

const GlobalLandingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [showGuestModal, setShowGuestModal] = React.useState(false);

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
    document.title = 'Chat gay Chile | Gratis y anónimo';
    
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    
    metaDescription.content = 'Chat gay Chile sin registro. Conocer hombres reales, chat gay activo, chatear gratis sin cuenta. Gente real de trabajo conversando ahora.';
  }, []);

  const handleChatearAhora = () => {
    if (user && !user.isGuest) {
      navigate('/chat/global');
    } else {
      setShowGuestModal(true);
    }
  };

  // COMENTADO: Botón crear cuenta deshabilitado
  // const handleRegistrar = () => {
  //   if (user && !user.isGuest) {
  //     navigate('/chat/global');
  //   } else {
  //     navigate('/auth', { state: { redirectTo: '/chat/global' } });
  //   }
  // };

  const handleEnterChat = () => {
    if (user && !user.isGuest) {
      navigate('/chat/global');
    } else {
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
        style={{ 
          marginTop: '-4rem',
          zIndex: 1
        }}
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
              {/* H1 Principal - SEO optimizado, tono urbano y directo */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-3 sm:mb-4 drop-shadow-2xl leading-tight px-2"
              >
                <span className="bg-gradient-to-r from-purple-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
                  Chatea con Gays de Chile: Sin vueltas, sin registros y 100% Real.
                </span>
              </motion.h1>
              
              {/* H2 - Tono auténtico y directo */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-base sm:text-lg md:text-xl text-white/95 font-semibold drop-shadow-lg mb-5 sm:mb-6 leading-relaxed px-2"
              >
                Un espacio hecho por y para nosotros (Gente real de trabajo).
              </motion.h2>
              
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
              
              {/* Microcopy - Prueba social directa */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-sm sm:text-base text-white/80 mt-4 sm:mt-5 font-medium"
              >
                Sin email • Sin tarjeta • Sin complicaciones
              </motion.p>
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
        
        {/* 🔥 CHAT DEMO - Vista previa con notificaciones animadas */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8 sm:mb-12"
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

        {/* Featured Topics Section - Compacto */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8 sm:mb-12"
        >
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-6">
            Temas populares
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {[
              { name: 'Amistad', emoji: '👥', color: 'from-blue-500 to-cyan-500' },
              { name: 'Relaciones', emoji: '💕', color: 'from-pink-500 to-red-500' },
              { name: 'Gaming', emoji: '🎮', color: 'from-purple-500 to-violet-500' },
              { name: 'Series/Películas', emoji: '🎬', color: 'from-orange-500 to-yellow-500' },
              { name: 'Música', emoji: '🎵', color: 'from-green-500 to-emerald-500' },
              { name: 'Viajes', emoji: '✈️', color: 'from-teal-500 to-cyan-500' },
              { name: 'Deportes', emoji: '⚽', color: 'from-green-600 to-lime-500' },
              { name: 'Cultura', emoji: '🎨', color: 'from-violet-500 to-purple-500' },
            ].map((topic, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05, y: -5 }}
                className="glass-effect rounded-xl p-4 text-center border border-border hover:border-cyan-500/50 transition-all"
              >
                <div className={`text-4xl mb-2 bg-gradient-to-br ${topic.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto`}>
                  {topic.emoji}
                </div>
                <p className="text-sm font-semibold">{topic.name}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Benefits Section - Compacto */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8 sm:mb-12"
        >
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-6">
            Por qué Chactivo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="glass-effect rounded-2xl p-6 sm:p-8 border border-border">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mb-5">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Comunidad Más Grande</h3>
              <p className="text-muted-foreground leading-relaxed">
                La sala con más usuarios activos de Chactivo. Siempre hay alguien online para chatear.
              </p>
            </div>

            <div className="glass-effect rounded-2xl p-6 sm:p-8 border border-border">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-5">
                <MessageSquare className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Todos los Temas</h3>
              <p className="text-muted-foreground leading-relaxed">
                Conversa sobre lo que quieras: gaming, series, música, deportes, viajes, o simplemente haz amigos.
              </p>
            </div>

            <div className="glass-effect rounded-2xl p-6 sm:p-8 border border-border">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center mb-5">
                <Heart className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Ambiente Relajado</h3>
              <p className="text-muted-foreground leading-relaxed">
                Sin presión de hookups. Conversación real, amistad genuina y respeto siempre.
              </p>
            </div>
          </div>
        </motion.section>

        {/* 🔒 SECCIÓN PRIVACIDAD COMO DIFERENCIADOR - CARACTERÍSTICA ÚNICA */}
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
                onClick={handleChatearAhora}
                className="magenta-gradient text-white font-bold text-lg sm:text-xl px-10 sm:px-14 py-6 sm:py-7 rounded-xl shadow-xl hover:shadow-[#E4007C]/50 hover:scale-105 transition-all"
              >
                🔒 Chatear con Privacidad Total
              </Button>
            </div>
          </motion.div>
        </motion.section>

        {/* 💬 SECCIÓN TESTIMONIOS - Compacta */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-8 sm:mt-10 mb-8 sm:mb-10 px-3"
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

            {/* Título - Más directo */}
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6">
              Lo que dice la gente
            </h2>

            {/* Grid de testimonios - Tono WhatsApp, cortos y directos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {/* Testimonio 1: Andrés */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gray-800/60 backdrop-blur-sm p-5 rounded-xl border border-purple-500/30"
              >
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={encodeURI("/testimonio 1.jpeg")}
                    alt="Andrés"
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => {
                      e.target.src = "/testimonio%201.jpeg";
                    }}
                  />
                  <div>
                    <p className="font-bold text-white">Andrés</p>
                    <p className="text-xs text-gray-400">35 • Valparaíso</p>
                  </div>
                </div>
                <p className="text-sm text-gray-200 leading-relaxed">
                  "Reporté 2 perfiles y los sacaron al toque. Acá sí moderan de verdad."
                </p>
              </motion.div>

              {/* Testimonio 2: Diego */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gray-800/60 backdrop-blur-sm p-5 rounded-xl border border-purple-500/30"
              >
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={encodeURI("/testimonio 2.jpeg")}
                    alt="Diego"
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => {
                      e.target.src = "/testimonio%202.jpeg";
                    }}
                  />
                  <div>
                    <p className="font-bold text-white">Diego</p>
                    <p className="text-xs text-gray-400">31 • Santiago</p>
                  </div>
                </div>
                <p className="text-sm text-gray-200 leading-relaxed">
                  "Probé todas las apps. Esta es la única sin anuncios raros ni trackers."
                </p>
              </motion.div>

              {/* Testimonio 3: Javier */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gray-800/60 backdrop-blur-sm p-5 rounded-xl border border-purple-500/30"
              >
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={encodeURI("/testimonio 3.jpeg")}
                    alt="Javier"
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => {
                      e.target.src = "/testimonio%203.jpeg";
                    }}
                  />
                  <div>
                    <p className="font-bold text-white">Javier</p>
                    <p className="text-xs text-gray-400">47 • Viña del Mar</p>
                  </div>
                </div>
                <p className="text-sm text-gray-200 leading-relaxed">
                  "No piden redes sociales. Puedo ser yo sin preocuparme por mi pega."
                </p>
              </motion.div>
            </div>
          </div>
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

        {/* ❓ SECCIÓN FAQ DE CONFIANZA - Preguntas Frecuentes con SEO */}
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
              onClick={handleChatearAhora}
              className="magenta-gradient text-white font-bold text-lg sm:text-xl px-8 sm:px-12 py-6 sm:py-7 rounded-xl shadow-xl hover:shadow-[#E4007C]/50 hover:scale-105 transition-all"
            >
              🚀 Unirme Ahora Gratis
            </Button>
          </motion.div>
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

      {/* Guest Username Modal (Sin Registro) */}
      <GuestUsernameModal
        open={showGuestModal}
        onClose={() => setShowGuestModal(false)}
      />
    </div>
  );
};

export default GlobalLandingPage;
