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

          {/* CTA Principal - Dos opciones */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleChatearAhora}
                size="lg"
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-lg sm:text-xl px-8 sm:px-12 py-6 sm:py-7 rounded-2xl shadow-2xl w-full sm:w-auto"
              >
                <Zap className="w-6 h-6 mr-2" />
                Chatear Ahora
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

        {/* Testimonials Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-16 sm:mb-20"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
            💬 Lo Que Dicen Nuestros Usuarios
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="glass-effect rounded-xl p-6 border border-border">
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                "Por fin un chat donde puedo hablar de cosas que me interesan sin sentirme viejo. He hecho amigos de verdad aquí."
              </p>
              <p className="text-sm font-semibold text-amber-400">— Carlos, 35 años, Santiago</p>
            </div>

            <div className="glass-effect rounded-xl p-6 border border-border">
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                "Después de años en Grindr, esto es un oasis. Conversaciones maduras, gente interesante, cero drama."
              </p>
              <p className="text-sm font-semibold text-orange-400">— Rodrigo, 42 años, Viña del Mar</p>
            </div>

            <div className="glass-effect rounded-xl p-6 border border-border">
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                "Conocí a mi actual pareja aquí. Empezamos hablando de viajes y literatura, y la química fue natural."
              </p>
              <p className="text-sm font-semibold text-red-400">— Andrés, 38 años, Concepción</p>
            </div>

            <div className="glass-effect rounded-xl p-6 border border-border">
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                "Como profesional LGBT+, valoro mucho poder hacer networking en un ambiente relajado y sin presión."
              </p>
              <p className="text-sm font-semibold text-cyan-400">— Felipe, 45 años, Las Condes</p>
            </div>
          </div>
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

        {/* FAQ Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-16 sm:mb-20"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
            ❓ Preguntas Frecuentes
          </h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: '¿Realmente solo mayores de 30?',
                a: 'Sí, es una sala exclusiva. Los moderadores verifican la edad para mantener el ambiente maduro.'
              },
              {
                q: '¿Es solo para buscar pareja?',
                a: 'No. El foco es amistad y conversación de calidad. Si surge romance, genial, pero sin presión.'
              },
              {
                q: '¿Cuál es el rango de edad promedio?',
                a: 'La mayoría está entre 32-48 años, pero hay usuarios hasta 60+ que valoran el ambiente sano.'
              },
              {
                q: '¿Cómo se diferencia de Grindr?',
                a: 'No es una app de hookups. Aquí el foco es conversación, amistad y relaciones significativas.'
              },
              {
                q: '¿Hay eventos offline?',
                a: 'Sí, organizamos encuentros casuales: café, cine, hiking. Todo opcional y sin presión.'
              }
            ].map((faq, index) => (
              <div key={index} className="glass-effect rounded-xl p-6 border border-border">
                <h3 className="text-lg font-bold mb-2 text-amber-300">{faq.q}</h3>
                <p className="text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
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
