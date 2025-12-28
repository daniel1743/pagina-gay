import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, MessageSquare, Star, ArrowRight, Shield, Zap, Clock, Heart, Coffee, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCanonical } from '@/hooks/useCanonical';
import ChatDemo from '@/components/landing/ChatDemo';
import { GuestUsernameModal } from '@/components/auth/GuestUsernameModal';

const Mas30LandingPage = () => {
  // SEO: Canonical tag
  useCanonical('/mas-30');

  const navigate = useNavigate();
  const { user } = useAuth();
  const [showGuestModal, setShowGuestModal] = React.useState(false);

  // Redirigir usuarios autenticados (no guests) directamente al chat
  React.useEffect(() => {
    if (user && !user.isGuest && !user.isAnonymous) {
      navigate('/chat/mas-30', { replace: true });
    }
  }, [user, navigate]);

  React.useEffect(() => {
    // ✅ SEO: Title y meta description optimizados para CTR
    document.title = 'Chat Gay Mayores de 30 en Chile 💪 | Conversación Madura | Chactivo';

    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = '💪 Chat gay para mayores de 30 años en Chile. Conversaciones maduras, sin drama ni presión. Conoce gays de tu edad en Santiago, Viña, Conce y todo Chile. ¡Sin registro, 100% gratis!';

    return () => {
      if (metaDescription && document.head.contains(metaDescription)) {
        metaDescription.content = '🏳️‍🌈 Chat gay chileno 100% gratis. Salas por interés: Gaming 🎮, +30 💪, Osos 🐻, Amistad 💬. Conversación real, sin presión de hookups.';
      }
    };
  }, []);

  const handleChatearAhora = () => {
    if (user && !user.isGuest) {
      navigate('/chat/mas-30');
    } else {
      setShowGuestModal(true);
    }
  };

  const handleRegistrar = () => {
    if (user && !user.isGuest) {
      navigate('/chat/mas-30');
    } else {
      navigate('/auth', { state: { redirectTo: '/chat/mas-30' } });
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 sm:py-12">
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
            <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-full px-4 sm:px-6 py-2 sm:py-3">
              <p className="text-xs sm:text-sm font-semibold text-amber-300 flex items-center gap-2">
                <Coffee className="w-4 h-4" />
                <span>Para gays que valoran la conversación de calidad</span>
              </p>
            </div>
          </motion.div>

          {/* H1 */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight">
            Chat Gay{' '}
            <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
              Mayores de 30
            </span>
            {' '}en Chile
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Conversaciones maduras, sin drama. Conecta con gays de tu edad que buscan amistad, conversación real y relaciones significativas.
          </p>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-10 text-sm sm:text-base">
            <div className="flex items-center gap-2 text-cyan-300">
              <Shield className="w-5 h-5" />
              <span className="font-semibold">Ambiente Maduro</span>
            </div>
            <div className="flex items-center gap-2 text-green-300">
              <Zap className="w-5 h-5" />
              <span className="font-semibold">Sin Registro</span>
            </div>
            <div className="flex items-center gap-2 text-yellow-300">
              <Clock className="w-5 h-5" />
              <span className="font-semibold">24/7 Activo</span>
            </div>
          </div>

          {/* CTA Principal - Optimizado */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleChatearAhora}
                size="lg"
                className="magenta-gradient text-white font-extrabold text-xl sm:text-2xl px-12 sm:px-16 py-7 sm:py-8 rounded-2xl shadow-2xl hover:shadow-[#E4007C]/50 hover:scale-105 transition-all w-full sm:w-auto"
              >
                <Zap className="w-7 h-7 mr-2" />
                Chatear Ahora - ¡Es Gratis!
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleRegistrar}
                size="lg"
                variant="outline"
                className="border-2 border-amber-500 text-amber-400 hover:bg-amber-500/10 font-bold text-lg sm:text-xl px-8 sm:px-12 py-6 sm:py-7 rounded-2xl w-full sm:w-auto"
              >
                <Users className="w-6 h-6 mr-2" />
                Registrate para Más
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

        {/* 🎯 TRUST SIGNALS SECTION - Señales de Confianza */}
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
                  287
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
            onClick={handleChatearAhora}
            className="magenta-gradient text-white font-bold text-lg sm:text-xl px-10 sm:px-14 py-6 sm:py-7 rounded-xl shadow-xl hover:shadow-[#E4007C]/50 hover:scale-105 transition-all"
          >
            ⚡ Empezar a Chatear Gratis
          </Button>
        </motion.div>

        {/* 💬 TESTIMONIOS DETALLADOS - Opiniones Reales con FOTOS */}
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

            {/* Grid de testimonios con FOTOS REALES */}
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
                onClick={handleChatearAhora}
                className="magenta-gradient text-white font-bold text-lg sm:text-xl px-8 sm:px-12 py-6 sm:py-7 rounded-xl shadow-xl hover:shadow-[#E4007C]/50 hover:scale-105 transition-all"
              >
                🚀 Probar Gratis Ahora
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Why +30 Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16 sm:mb-20"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">
            🎯 ¿Por Qué Una Sala Exclusiva +30?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="glass-effect rounded-xl p-6 border border-border hover:border-amber-500/50 transition-all">
              <div className="text-4xl mb-3">🧠</div>
              <h3 className="text-xl font-bold mb-2">Conversaciones con Sustancia</h3>
              <p className="text-muted-foreground leading-relaxed">
                Habla de carrera, viajes, libros, política, vida. Sin el ruido y drama de los veinteañeros.
              </p>
            </div>

            <div className="glass-effect rounded-xl p-6 border border-border hover:border-amber-500/50 transition-all">
              <div className="text-4xl mb-3">🎭</div>
              <h3 className="text-xl font-bold mb-2">Menos Filtros, Más Autenticidad</h3>
              <p className="text-muted-foreground leading-relaxed">
                A los 30+ ya sabes quién eres. Aquí no hay poses ni juegos, solo conversación real.
              </p>
            </div>

            <div className="glass-effect rounded-xl p-6 border border-border hover:border-amber-500/50 transition-all">
              <div className="text-4xl mb-3">🤝</div>
              <h3 className="text-xl font-bold mb-2">Amistad y Networking</h3>
              <p className="text-muted-foreground leading-relaxed">
                Conoce profesionales LGBT+ de tu edad. Networking, amistades duraderas, no solo hookups.
              </p>
            </div>

            <div className="glass-effect rounded-xl p-6 border border-border hover:border-amber-500/50 transition-all">
              <div className="text-4xl mb-3">💼</div>
              <h3 className="text-xl font-bold mb-2">Estabilidad y Madurez</h3>
              <p className="text-muted-foreground leading-relaxed">
                Gente establecida, con proyectos, metas claras. Sin el caos de apps como Grindr.
              </p>
            </div>
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
            ✨ Lo Que Hace Diferente Esta Sala
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="glass-effect rounded-2xl p-6 sm:p-8 border border-border">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-5">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Comunidad de Calidad</h3>
              <p className="text-muted-foreground leading-relaxed">
                Solo mayores de 30. Conversaciones inteligentes, sin spam ni perfiles fake.
              </p>
            </div>

            <div className="glass-effect rounded-2xl p-6 sm:p-8 border border-border">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mb-5">
                <MessageSquare className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Respeto y Moderación</h3>
              <p className="text-muted-foreground leading-relaxed">
                Ambiente seguro y respetuoso. Moderadores activos, cero tolerancia al bullying.
              </p>
            </div>

            <div className="glass-effect rounded-2xl p-6 sm:p-8 border border-border">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-fuchsia-500 flex items-center justify-center mb-5">
                <Heart className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Relaciones Significativas</h3>
              <p className="text-muted-foreground leading-relaxed">
                Amistades que duran, networking profesional, y si surge química, mejor aún.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Topics Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-16 sm:mb-20"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">
            💬 Temas de Conversación Más Populares
          </h2>
          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
            {[
              '💼 Carrera y Trabajo',
              '✈️ Viajes',
              '📚 Libros y Series',
              '🍷 Gastronomía',
              '🏋️ Fitness y Salud',
              '🎬 Cine y Teatro',
              '🏠 Decoración',
              '💰 Inversiones',
              '🐕 Mascotas',
              '🎨 Arte y Cultura',
              '🌍 Actualidad',
              '💑 Relaciones',
            ].map((topic, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05 }}
                className="glass-effect rounded-full px-4 py-2 border border-border hover:border-amber-500/50 transition-all"
              >
                <span className="text-sm font-semibold">{topic}</span>
              </motion.div>
            ))}
          </div>
        </motion.section>

{/* 🔒 PRIVACY AS DIFFERENTIATOR - Característica Única */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-12 sm:mb-16"
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
                { feature: "Venden tus datos", other: true, chactivo: false },
                { feature: "Spam y bots", other: true, chactivo: false },
                { feature: "Publicidad invasiva", other: true, chactivo: false },
                { feature: "Perfiles fake", other: true, chactivo: false },
                { feature: "Moderación 24/7", other: false, chactivo: true },
                { feature: "Anonimato real", other: false, chactivo: true },
                { feature: "Sin trackers", other: false, chactivo: true },
              ].map((item, index) => (
                <div key={index} className="grid grid-cols-3 gap-4 items-center py-3 border-b border-border/50 last:border-0">
                  <p className="text-sm sm:text-base text-gray-300">{item.feature}</p>
                  <div className="text-center">
                    {item.other ? (
                      <span className="text-2xl">❌</span>
                    ) : (
                      <span className="text-2xl">✅</span>
                    )}
                  </div>
                  <div className="text-center">
                    {item.chactivo ? (
                      <span className="text-2xl">✅</span>
                    ) : (
                      <span className="text-2xl">❌</span>
                    )}
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

          {/* CTA después de Privacy */}
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

        {/* How It Works Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-16 sm:mb-20"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
            🚀 Cómo Empezar
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-3xl font-black text-white">
                1
              </div>
              <h3 className="text-xl font-bold mb-2">Entra en 30 Segundos</h3>
              <p className="text-muted-foreground">
                Sin formularios largos. Solo username y listo. Cero fricción.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-3xl font-black text-white">
                2
              </div>
              <h3 className="text-xl font-bold mb-2">Elige Tu Tema</h3>
              <p className="text-muted-foreground">
                Entra a la conversación. Viajes, libros, carrera, lo que te interese.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-500 to-fuchsia-500 flex items-center justify-center text-3xl font-black text-white">
                3
              </div>
              <h3 className="text-xl font-bold mb-2">Conecta de Verdad</h3>
              <p className="text-muted-foreground">
                Conversaciones reales, amistades duraderas, sin presión ni drama.
              </p>
            </div>
          </div>
        </motion.section>

        {/* ❓ FAQ MEJORADO - Preguntas Frecuentes Detalladas */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-12 sm:mb-16"
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
          <div className="space-y-4 max-w-5xl mx-auto">
            {[
              {
                q: "¿Es realmente gratis?",
                a: "Sí, 100% gratis para chatear. Puedes usar Chactivo sin pagar nada, sin registro, sin email. Ofrecemos una suscripción Premium opcional con beneficios extras (chats privados, badges exclusivos, avatares), pero el chat público es completamente gratuito para siempre."
              },
              {
                q: "¿Realmente solo mayores de 30?",
                a: "Sí, es una sala exclusiva para mayores de 30 años. Los moderadores verifican la edad para mantener el ambiente maduro y las conversaciones de calidad que buscamos."
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
                q: "¿Es solo para buscar pareja?",
                a: "No. El foco principal es amistad, conversación de calidad y networking entre profesionales LGBT+ de tu edad. Si surge romance, genial, pero sin presión. No es una app de hookups."
              },
              {
                q: "¿Hay moderación? ¿Cómo funciona?",
                a: "Sí, moderación 24/7 con sistema híbrido único: IA detecta contenido inapropiado en tiempo real + moderadores humanos verifican reportes. Esto nos permite ser rápidos sin invadir tu privacidad. Puedes reportar cualquier mensaje o usuario con un click."
              },
              {
                q: "¿Cuál es el rango de edad promedio?",
                a: "La mayoría de usuarios está entre 32-48 años, pero tenemos miembros activos hasta 60+ que valoran el ambiente maduro y respetuoso de la comunidad."
              },
              {
                q: "¿Cómo se diferencia de Grindr?",
                a: "No es una app de hookups. Aquí el foco es conversación de calidad, amistad duradera y relaciones significativas. Además: sin venta de datos, sin bots, moderación real 24/7, ambiente sin presión."
              },
              {
                q: "¿Por qué no hay anuncios?",
                a: "Porque los odiamos tanto como tú. Nuestro modelo es sostenible con suscripciones Premium opcionales, no vendiendo tu atención a anunciantes. Sin publicidad invasiva, sin trackers, sin distracciones. Solo chat real."
              },
              {
                q: "¿Hay eventos offline?",
                a: "Sí, organizamos encuentros casuales regulares: café, cine, hiking, cenas. Todo opcional y sin presión. Es una forma excelente de conocer personas de la comunidad en un ambiente relajado."
              }
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

        {/* Final CTA */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <div className="glass-effect rounded-3xl p-10 sm:p-16 border-2 border-amber-500/30 bg-gradient-to-br from-amber-900/20 to-orange-900/20">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
              ¿Listo para Conversaciones de Verdad?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Únete a la sala +30 más activa de Chile. Conversación madura, sin drama, 100% gratis.
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={handleEnterChat}
                size="lg"
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xl sm:text-2xl px-12 sm:px-20 py-6 sm:py-8 rounded-2xl shadow-2xl"
              >
                <Users className="w-7 h-7 mr-3" />
                Entrar a la Sala Ahora
                <ArrowRight className="w-7 h-7 ml-3" />
              </Button>
            </motion.div>
            <p className="text-sm text-muted-foreground mt-6">
              💪 Comunidad +30 activa • 🔒 100% anónimo • ⚡ Sin registro
            </p>
          </div>
        </motion.section>
      </div>

      {/* Guest Username Modal (Sin Registro) */}
      <GuestUsernameModal
        open={showGuestModal}
        onClose={() => setShowGuestModal(false)}
      />
    </div>
  );
};

export default Mas30LandingPage;
