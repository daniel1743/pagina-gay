import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Users, Heart, Star, ArrowRight, Zap, Shield, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCanonical } from '@/hooks/useCanonical';
import ChatDemo from '@/components/landing/ChatDemo';
import { GuestUsernameModal } from '@/components/auth/GuestUsernameModal';
import { EntryOptionsModal } from '@/components/auth/EntryOptionsModal';

const SpainLandingPage = () => {
  console.log('🇪🇸 [SPAIN LANDING] Componente renderizando...');

  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [showGuestModal, setShowGuestModal] = React.useState(false);
  const [showEntryModal, setShowEntryModal] = React.useState(false);

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

  // ✅ SEO: Canonical tag dinámico
  useCanonical('/es');

  React.useEffect(() => {
    console.log('🇪🇸 [SPAIN LANDING] Aplicando SEO tags...');

    // ✅ SEO: Title y meta description optimizados para España
    const previousTitle = document.title;

    const metaDescription = document.querySelector('meta[name="description"]');
    const hadMetaDescription = !!metaDescription;
    const previousDescription = metaDescription?.getAttribute('content') ?? '';

    document.title = 'Chat Gay España 🏳️‍🌈 Gratis - Madrid, Barcelona, Chueca | Chactivo';

    let ensuredMeta = metaDescription;
    if (!ensuredMeta) {
      ensuredMeta = document.createElement('meta');
      ensuredMeta.name = 'description';
      document.head.appendChild(ensuredMeta);
    }

    ensuredMeta.content = 'Chat gay España 100% gratis. Conoce tíos de Madrid, Barcelona, Chueca y toda España. Sin rollos, sin registro. Entra ya y chatea con gays españoles.';

    // Keywords específicos de España
    let keywords = document.querySelector('meta[name="keywords"]');
    const hadKeywords = !!keywords;
    const previousKeywords = keywords?.getAttribute('content') ?? '';
    if (!keywords) {
      keywords = document.createElement('meta');
      keywords.setAttribute('name', 'keywords');
      document.head.appendChild(keywords);
    }
    keywords.setAttribute('content', 'chat gay españa, chat gay madrid, chat gay barcelona, chueca madrid, gay españa online, ligar gay españa, conocer gays españa, chat homosexual españa, salas gay madrid, chat lgbt españa');

    return () => {
      // Restore title
      document.title = previousTitle;

      // Restore or remove meta description
      const currentMeta = document.querySelector('meta[name="description"]');
      if (!currentMeta) return;

      if (hadMetaDescription) {
        currentMeta.setAttribute('content', previousDescription);
      } else {
        currentMeta.remove();
      }

      // Restore keywords
      const currentKeywords = document.querySelector('meta[name="keywords"]');
      if (currentKeywords) {
        if (hadKeywords) {
          currentKeywords.setAttribute('content', previousKeywords);
        } else {
          currentKeywords.remove();
        }
      }
    };
  }, []);

  const handleChatearAhora = () => {
    if (user && !user.isGuest) {
      navigate('/chat/es-main');
    } else {
      setShowEntryModal(true);
    }
  };

  const handleContinueWithoutRegister = () => {
    setShowEntryModal(false);
    setShowGuestModal(true);
  };

  const handleEnterChat = () => {
    if (user && !user.isGuest) {
      navigate('/chat/es-main');
    } else {
      setShowGuestModal(true);
    }
  };

  console.log('🇪🇸 [SPAIN LANDING] Renderizando JSX...');

  return (
    <div className="min-h-screen">
      {/* 🎯 HERO MOBILE-FIRST - Full screen en mobile para visibilidad inmediata */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full relative overflow-hidden"
      >
        <div className="w-full h-screen md:h-[75vh] relative group">
          {/* Carrusel de imágenes */}
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
                <img
                  src={encodeURI(modelImages[currentImageIndex])}
                  alt="Chat gay España - Madrid Barcelona Chueca"
                  className="absolute inset-0 w-full h-full object-cover object-center"
                  loading={currentImageIndex === 0 ? 'eager' : 'lazy'}
                  onError={(e) => {
                    console.error('Error cargando imagen:', modelImages[currentImageIndex]);
                    const altPath = modelImages[currentImageIndex].replace(' ', '%20');
                    if (e.target.src !== altPath) {
                      e.target.src = altPath;
                    } else {
                      e.target.style.display = 'none';
                    }
                  }}
                />

                {/* Overlay oscuro */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Contenido sobre la imagen */}
          <div className="absolute inset-0 z-10 h-full flex items-center justify-center px-4 sm:px-6">
            <div className="text-center max-w-3xl w-full">
              {/* H1 Principal - SEO optimizado para España */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black mb-3 sm:mb-4 drop-shadow-2xl leading-tight px-2"
              >
                <span className="bg-gradient-to-r from-purple-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
                  Chat Gay España: Conoce Tíos de Madrid, Barcelona y Chueca
                </span>
              </motion.h1>

              {/* H2 - Tono español directo */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-base sm:text-lg md:text-xl text-white/95 font-semibold drop-shadow-lg mb-5 sm:mb-6 leading-relaxed px-2"
              >
                Sin rollos, tío. Gente real de España conversando ahora.
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

              {/* Microcopy */}
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

          {/* Indicadores de imágenes */}
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

      {/* Contenido principal */}
      <div className="px-3 sm:px-4 py-4 sm:py-6">
        <div className="max-w-5xl mx-auto">

        {/* 🔥 CHAT DEMO */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8 sm:mb-12"
        >
          <ChatDemo onJoinClick={handleChatearAhora} />
        </motion.section>

        {/* 🎯 CTA INTERMEDIO */}
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

        {/* Benefits Section - Adaptado para España */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8 sm:mb-12"
        >
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-6">
            Por qué Chactivo España
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="glass-effect rounded-2xl p-6 sm:p-8 border border-border">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mb-5">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Comunidad Activa España</h3>
              <p className="text-muted-foreground leading-relaxed">
                Tíos de Madrid, Barcelona, Valencia, Sevilla y toda España. Siempre hay alguien online.
              </p>
            </div>

            <div className="glass-effect rounded-2xl p-6 sm:p-8 border border-border">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-5">
                <MessageSquare className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">100% en Español</h3>
              <p className="text-muted-foreground leading-relaxed">
                Conversa en español con gente de tu zona. De Chueca al Eixample, todos conectados.
              </p>
            </div>

            <div className="glass-effect rounded-2xl p-6 sm:p-8 border border-border">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center mb-5">
                <Heart className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Ambiente Relajado</h3>
              <p className="text-muted-foreground leading-relaxed">
                Sin presión. Conversación real, amistad genuina y respeto siempre.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Final CTA */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-center"
        >
          <div className="glass-effect rounded-3xl p-10 sm:p-16 border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-900/20 to-blue-900/20">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
              ¿Listo para Conectar con Gays de Toda España?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Únete al chat más activo de España. Conversación real, ambiente relajado, 100% gratis.
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
              💬 Chat España • 🔒 100% anónimo • ⚡ Sin registro
            </p>
          </div>
        </motion.section>
        </div>
      </div>

      {/* 📱 STICKY MOBILE CTA */}
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

      {/* Modals */}
      <EntryOptionsModal
        open={showEntryModal}
        onClose={() => setShowEntryModal(false)}
        chatRoomId="es-main"
        onContinueWithoutRegister={handleContinueWithoutRegister}
      />

      <GuestUsernameModal
        open={showGuestModal}
        onClose={() => setShowGuestModal(false)}
        chatRoomId="es-main"
      />
    </div>
  );
};

export default SpainLandingPage;
