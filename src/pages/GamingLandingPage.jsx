import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gamepad2, Users, MessageSquare, Star, ArrowRight, Check, Zap, Shield, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCanonical } from '@/hooks/useCanonical';
import ChatDemo from '@/components/landing/ChatDemo';
import { GuestUsernameModal } from '@/components/auth/GuestUsernameModal';
import TelegramBanner from '@/components/ui/TelegramBanner';

const GamingLandingPage = () => {
  // SEO: Canonical tag
  useCanonical('/gaming');

  const navigate = useNavigate();
  const { user } = useAuth();
  const [showGuestModal, setShowGuestModal] = React.useState(false);

  // Redirigir usuarios autenticados (no guests) directamente al chat
  React.useEffect(() => {
    if (user && !user.isGuest && !user.isAnonymous) {
      navigate('/chat/gaming', { replace: true });
    }
  }, [user, navigate]);

  React.useEffect(() => {
    // ✅ SEO: Title y meta description optimizados para CTR
    document.title = 'Chat Gamer Gay Chile 🎮 Squads y Discord Alternativo | Chactivo';

    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = 'Únete a la sala gamer. Busca partida, habla de setup y conoce amigos. Acceso libre inmediato.';

    return () => {
      if (metaDescription && document.head.contains(metaDescription)) {
        metaDescription.content = 'La comunidad más libre. Solo 4 salas activas con gente real: Santiago, Gaming y más. Sin perfiles, sin emails, solo entra y chatea.';
      }
    };
  }, []);

  const handleChatearAhora = () => {
    if (user && !user.isGuest) {
      navigate('/chat/gaming');
    } else {
      setShowGuestModal(true);
    }
  };

  const handleRegistrar = () => {
    if (user && !user.isGuest) {
      navigate('/chat/gaming');
    } else {
      navigate('/auth', { state: { redirectTo: '/chat/gaming' } });
    }
  };

  return (
    <div className="min-h-screen">
      {/* 📢 Banner Telegram - Fijo en la parte superior */}
      <TelegramBanner className="sticky top-0 z-50" />

      <div className="px-4 py-8 sm:py-12">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 sm:mb-16"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-block mb-6"
          >
            <div className="bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-500/30 rounded-full px-4 sm:px-6 py-2 sm:py-3">
              <p className="text-xs sm:text-sm font-semibold text-violet-300 flex items-center gap-2">
                <Gamepad2 className="w-4 h-4" />
                <span>La comunidad de gamers LGBT+ más activa de Chile</span>
              </p>
            </div>
          </motion.div>

          {/* H1 */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight">
            Chat Gay para{' '}
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
              Gamers en Chile
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-6 max-w-3xl mx-auto">
            Conecta con otros gamers LGBT+ en tiempo real. Comparte juegos, forma equipos, encuentra amigos que realmente te entiendan.
          </p>
          <p className="text-sm sm:text-base text-cyan-300 mb-8 max-w-2xl mx-auto">
            🎮 Jugamos: LoL, Valorant, Genshin, Minecraft, Fortnite, FIFA, GTA V, Among Us y más • 📱 Todas las plataformas: PC, PS5, Xbox, Switch, Móvil
          </p>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-10 text-sm sm:text-base">
            <div className="flex items-center gap-2 text-cyan-300">
              <Shield className="w-5 h-5" />
              <span className="font-semibold">100% Anónimo</span>
            </div>
            <div className="flex items-center gap-2 text-green-300">
              <Zap className="w-5 h-5" />
              <span className="font-semibold">Registro 30s</span>
            </div>
            <div className="flex items-center gap-2 text-yellow-300">
              <Clock className="w-5 h-5" />
              <span className="font-semibold">Activo 24/7</span>
            </div>
          </div>

          {/* CTA Principal - Optimizado */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleChatearAhora}
                size="lg"
                className="magenta-gradient text-white font-extrabold text-lg sm:text-xl md:text-2xl px-8 sm:px-12 md:px-16 py-6 sm:py-7 md:py-8 rounded-2xl shadow-2xl hover:shadow-[#E4007C]/70 hover:scale-105 transition-all w-full sm:w-auto animate-pulse-subtle"
              >
                <Zap className="w-6 h-6 mr-2" />
                Chatear Ahora - ¡Es Gratis!
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleRegistrar}
                size="lg"
                variant="outline"
                className="border-2 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500 font-bold text-base sm:text-lg md:text-xl px-6 sm:px-8 md:px-12 py-5 sm:py-6 md:py-7 rounded-xl transition-all w-full sm:w-auto"
              >
                <Gamepad2 className="w-6 h-6 mr-2" />
                💎 Registrate para Más
              </Button>
            </motion.div>
          </div>

          {/* Micro CTA copy */}
          <p className="text-sm text-muted-foreground mt-4">
            ⚡ Sin registro: Chatea gratis 1 mes • 💎 Con registro: Chats privados, likes y más
          </p>
        </motion.div>

        {/* 🔥 CHAT DEMO - Vista previa con notificaciones animadas */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-16 sm:mb-20"
        >
          <ChatDemo onJoinClick={handleChatearAhora} />
        </motion.section>

        {/* 🎯 SECCIÓN TRUST SIGNALS - Señales de Confianza */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 sm:mt-16 mb-12 sm:mb-16 px-4"
        >
          <div className="max-w-4xl mx-auto">
            {/* Badge principal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
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
              transition={{ delay: 0.6 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
            >
              {/* Usuarios activos */}
              <div className="glass-effect p-5 rounded-xl border border-green-500/30 hover:border-green-500/60 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="relative">
                    <span className="absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75 animate-ping"></span>
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500"></span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-400 font-medium">Gamers en línea</p>
                </div>
                <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  50+
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
              transition={{ delay: 0.7 }}
              className="overflow-hidden"
            >
              <div className="flex animate-marquee-slow">
                {[
                  { text: "Finalmente gamers LGBT+ sin toxicidad", author: "Carlos, 28" },
                  { text: "Encontré squad fijo aquí", author: "Andrés, 35" },
                  { text: "Mejor que Discord random", author: "Matías, 24" },
                  { text: "Comunidad sana y activa", author: "Diego, 31" },
                ].concat([
                  { text: "Finalmente gamers LGBT+ sin toxicidad", author: "Carlos, 28" },
                  { text: "Encontré squad fijo aquí", author: "Andrés, 35" },
                  { text: "Mejor que Discord random", author: "Matías, 24" },
                  { text: "Comunidad sana y activa", author: "Diego, 31" },
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
          transition={{ delay: 0.8 }}
          className="text-center mt-12 sm:mt-16 mb-8 px-4"
        >
          <p className="text-base sm:text-lg text-muted-foreground mb-5 max-w-xl mx-auto">
            Únete a cientos de gamers LGBT+ que ya confían en Chactivo
          </p>
          <Button
            onClick={handleChatearAhora}
            className="magenta-gradient text-white font-bold text-lg sm:text-xl px-10 sm:px-14 py-6 sm:py-7 rounded-xl shadow-xl hover:shadow-[#E4007C]/50 hover:scale-105 transition-all"
          >
            ⚡ Empezar a Chatear Gratis
          </Button>
        </motion.div>

        {/* Featured Games Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16 sm:mb-20"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">
            🎮 Los Juegos Más Populares en la Sala
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {[
              { name: 'League of Legends', emoji: '⚔️', color: 'from-yellow-500 to-orange-500' },
              { name: 'Valorant', emoji: '🔫', color: 'from-red-500 to-pink-500' },
              { name: 'Minecraft', emoji: '🧱', color: 'from-green-500 to-emerald-500' },
              { name: 'Genshin Impact', emoji: '⚡', color: 'from-purple-500 to-violet-500' },
              { name: 'Fortnite', emoji: '🪂', color: 'from-blue-500 to-cyan-500' },
              { name: 'FIFA/FC 24', emoji: '⚽', color: 'from-green-600 to-teal-500' },
              { name: 'GTA V', emoji: '🚗', color: 'from-orange-600 to-red-500' },
              { name: 'Among Us', emoji: '🚀', color: 'from-red-400 to-pink-400' },
            ].map((game, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05, y: -5 }}
                className="glass-effect rounded-xl p-4 text-center border border-border hover:border-violet-500/50 transition-all"
              >
                <div className={`text-4xl mb-2 bg-gradient-to-br ${game.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto`}>
                  {game.emoji}
                </div>
                <p className="text-sm font-semibold">{game.name}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Benefits Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-16 sm:mb-20"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
            ¿Por Qué Gamers LGBT+ Eligen Chactivo?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="glass-effect rounded-2xl p-6 sm:p-8 border border-border">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center mb-5">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Comunidad Activa</h3>
              <p className="text-muted-foreground leading-relaxed">
                Gamers LGBT+ conectados 24/7. Siempre hay alguien online para chatear sobre tus juegos favoritos.
              </p>
            </div>

            <div className="glass-effect rounded-2xl p-6 sm:p-8 border border-border">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mb-5">
                <MessageSquare className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Sin Presión</h3>
              <p className="text-muted-foreground leading-relaxed">
                No es Grindr. Aquí se trata de gaming, amistad y conversación real. Hookups quedan afuera.
              </p>
            </div>

            <div className="glass-effect rounded-2xl p-6 sm:p-8 border border-border">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-fuchsia-500 flex items-center justify-center mb-5">
                <Gamepad2 className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Forma Equipos</h3>
              <p className="text-muted-foreground leading-relaxed">
                Encuentra squad LGBT+ para ranked, raids, dungeons o simplemente jugar casual sin toxicidad.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Testimonials Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-16 sm:mb-20"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
            💬 Lo Que Dicen Otros Gamers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="glass-effect rounded-xl p-6 border border-border">
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                "Encontré un grupo fijo para jugar Valorant. Por fin un espacio donde puedo ser yo mismo sin miedo a comentarios homofóbicos."
              </p>
              <p className="text-sm font-semibold text-violet-400">— Matías, 24 años, Santiago</p>
            </div>

            <div className="glass-effect rounded-xl p-6 border border-border">
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                "Jugamos League todas las noches. La comunidad es súper sana, nada que ver con el chat tóxico de soloQ."
              </p>
              <p className="text-sm font-semibold text-cyan-400">— Diego, 28 años, Valparaíso</p>
            </div>
          </div>
        </motion.section>

        {/* 💬 TESTIMONIOS DETALLADOS - Opiniones Reales con FOTOS */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-16 sm:mt-20 mb-12 sm:mb-16 px-4"
        >
          <div className="max-w-6xl mx-auto">
            {/* Badge superior */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
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

            {/* Grid de testimonios con fotos reales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {/* Testimonio 1: Andrés - Moderación */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
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
                transition={{ delay: 0.8 }}
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
                transition={{ delay: 0.9 }}
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
              transition={{ delay: 1.0 }}
              className="text-center mt-12"
            >
              <p className="text-lg sm:text-xl text-muted-foreground mb-6">
                Únete a miles de usuarios satisfechos
              </p>
              <Button
                onClick={handleChatearAhora}
                className="magenta-gradient text-white font-bold text-lg sm:text-xl px-8 sm:px-12 py-6 sm:py-7 rounded-xl shadow-xl hover:shadow-[#E4007C]/50 hover:scale-105 transition-all"
              >
                🚀 Probar Gratis Ahora
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* How It Works Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-16 sm:mb-20"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
            🚀 Cómo Empezar
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-3xl font-black text-white">
                1
              </div>
              <h3 className="text-xl font-bold mb-2">Regístrate en 30s</h3>
              <p className="text-muted-foreground">
                Elige un username y crea tu contraseña. Sin email, sin tarjeta. 100% anónimo.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-3xl font-black text-white">
                2
              </div>
              <h3 className="text-xl font-bold mb-2">Comparte Tus Juegos</h3>
              <p className="text-muted-foreground">
                Habla de tus juegos favoritos, pide recomendaciones, busca squad.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-500 to-fuchsia-500 flex items-center justify-center text-3xl font-black text-white">
                3
              </div>
              <h3 className="text-xl font-bold mb-2">Conecta y Juega</h3>
              <p className="text-muted-foreground">
                Haz amigos, forma equipos, disfruta del gaming sin toxicidad.
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

          {/* CTA INTERMEDIO - Después de Privacy */}
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

        {/* ❓ FAQ MEJORADO - Preguntas Frecuentes con SEO */}
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
              ⚡ Chatear Ahora - Gratis
            </Button>
          </motion.div>
        </motion.section>

        {/* ✅ SECCIÓN DEL CREADOR - Mensaje personal */}
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

            {/* Tarjeta principal */}
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
                  {/* Foto del creador */}
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

                  {/* Contenido del mensaje */}
                  <div className="flex-1 text-center lg:text-left space-y-4">
                    {/* Título */}
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

                    {/* Mensaje principal */}
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

                    {/* CTA - Redes sociales */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.4 }}
                      className="flex flex-wrap justify-center lg:justify-start gap-3 mt-6"
                    >
                      {/* Instagram */}
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

                      {/* TikTok */}
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
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                        <span className="text-sm font-semibold text-cyan-400">GitHub</span>
                      </a>

                      {/* Facebook */}
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

                {/* Quote decorativa */}
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
          </div>
        </motion.div>

        {/* Final CTA */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-center"
        >
          <div className="glass-effect rounded-3xl p-10 sm:p-16 border-2 border-violet-500/30 bg-gradient-to-br from-violet-900/20 to-purple-900/20">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
              ¿Listo para Conectar con Gamers LGBT+?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Únete a la comunidad de gamers gay más activa de Chile. Sin registro, sin compromiso, 100% gratis.
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={handleChatearAhora}
                size="lg"
                className="magenta-gradient text-white font-bold text-xl sm:text-2xl px-12 sm:px-20 py-6 sm:py-8 rounded-2xl shadow-2xl hover:shadow-[#E4007C]/70"
              >
                <Gamepad2 className="w-7 h-7 mr-3" />
                Entrar al Chat Ahora
                <ArrowRight className="w-7 h-7 ml-3" />
              </Button>
            </motion.div>
            <p className="text-sm text-muted-foreground mt-6">
              🎮 Más de 50+ gamers activos • 🔒 100% anónimo • ⚡ Registro rápido gratis
            </p>
          </div>
        </motion.section>
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

      {/* ✅ FASE 1: GuestUsernameModal - ÚNICO punto de entrada para invitados */}
      <GuestUsernameModal
        open={showGuestModal}
        onClose={() => setShowGuestModal(false)}
        chatRoomId="principal" // Ignorado, siempre navega a /chat/principal
      />
      </div>
    </div>
  );
};

export default GamingLandingPage;
