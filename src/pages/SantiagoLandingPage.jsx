import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, MessageSquare, Star, ArrowRight, Shield, Zap, Clock, Coffee, Building2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCanonical } from '@/hooks/useCanonical';
import ChatDemo from '@/components/landing/ChatDemo';

const SantiagoLandingPage = () => {
  // SEO: Canonical tag
  useCanonical('/santiago');

  const navigate = useNavigate();
  const { user } = useAuth();

  React.useEffect(() => {
    // ✅ SEO: Title y meta description optimizados para CTR
    document.title = 'Chat Gay Santiago Chile 🏙️ | Conoce Gays de la Capital | Chactivo';

    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = '🏙️ Chat gay Santiago Chile en tiempo real. Conecta con gays de Providencia, Las Condes, Ñuñoa, Bellavista y toda la capital. Salas temáticas, ambiente seguro, 100% gratis. ¡Sin registro!';

    return () => {
      if (metaDescription && document.head.contains(metaDescription)) {
        metaDescription.content = '🏳️‍🌈 Chat gay chileno 100% gratis. Salas por interés: Gaming 🎮, +30 💪, Osos 🐻, Amistad 💬. Conversación real, sin presión de hookups.';
      }
    };
  }, []);

  const handleEnterChat = () => {
    if (user && !user.isGuest) {
      navigate('/chat/santiago');
    } else {
      navigate('/auth', { state: { redirectTo: '/chat/santiago' } });
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
            <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-full px-4 sm:px-6 py-2 sm:py-3">
              <p className="text-xs sm:text-sm font-semibold text-blue-300 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>La comunidad gay más activa de la capital</span>
              </p>
            </div>
          </motion.div>

          {/* H1 */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight">
            Chat Gay{' '}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
              Santiago Chile
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Conoce gays de Providencia, Las Condes, Ñuñoa, Bellavista y toda la RM. Chat en tiempo real, eventos, amistad y más.
          </p>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-10 text-sm sm:text-base">
            <div className="flex items-center gap-2 text-cyan-300">
              <Shield className="w-5 h-5" />
              <span className="font-semibold">100% Anónimo</span>
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

          {/* CTA Principal */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={handleEnterChat}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xl sm:text-2xl px-10 sm:px-16 py-6 sm:py-8 rounded-2xl shadow-2xl"
            >
              <MapPin className="w-6 h-6 sm:w-7 sm:h-7 mr-3" />
              Entrar al Chat de Santiago
              <ArrowRight className="w-6 h-6 sm:w-7 sm:h-7 ml-3" />
            </Button>
          </motion.div>

          {/* Micro CTA copy */}
          <p className="text-sm text-muted-foreground mt-4">
            ⚡ Entra en 30 segundos • 🏙️ 100% gratis • 🔒 Sin email
          </p>
        </motion.div>

        {/* 🔥 CHAT DEMO - Vista previa con notificaciones animadas */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-16 sm:mb-20"
        >
          <ChatDemo onJoinClick={handleEnterChat} />
        </motion.section>

        {/* Barrios Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-16 sm:mb-20"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">
            📍 Gays Conectados Desde Toda la RM
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {[
              { name: 'Providencia', emoji: '🌆', users: 'Alto' },
              { name: 'Las Condes', emoji: '🏢', users: 'Muy Alto' },
              { name: 'Ñuñoa', emoji: '🎨', users: 'Alto' },
              { name: 'Bellavista', emoji: '🌈', users: 'Muy Alto' },
              { name: 'Santiago Centro', emoji: '🏛️', users: 'Medio' },
              { name: 'La Reina', emoji: '🏔️', users: 'Medio' },
              { name: 'Vitacura', emoji: '💼', users: 'Alto' },
              { name: 'Maipú', emoji: '🏘️', users: 'Medio' },
            ].map((barrio, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05, y: -5 }}
                className="glass-effect rounded-xl p-4 text-center border border-border hover:border-blue-500/50 transition-all"
              >
                <div className="text-4xl mb-2">{barrio.emoji}</div>
                <p className="text-sm font-semibold mb-1">{barrio.name}</p>
                <div className="inline-block px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full">
                  <p className="text-xs text-blue-300 font-medium">{barrio.users} tráfico</p>
                </div>
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
            ✨ ¿Por Qué Santiaguinos Eligen Chactivo?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="glass-effect rounded-2xl p-6 sm:p-8 border border-border">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-5">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Comunidad Local Activa</h3>
              <p className="text-muted-foreground leading-relaxed">
                Gays de Santiago conectados 24/7. Desde Providencia hasta Maipú, todos en un mismo chat.
              </p>
            </div>

            <div className="glass-effect rounded-2xl p-6 sm:p-8 border border-border">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-5">
                <MessageSquare className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Eventos y Quedadas</h3>
              <p className="text-muted-foreground leading-relaxed">
                Organizamos café en Lastarria, hiking San Cristóbal, salidas Bellavista. Todo opcional.
              </p>
            </div>

            <div className="glass-effect rounded-2xl p-6 sm:p-8 border border-border">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-500 to-green-500 flex items-center justify-center mb-5">
                <Coffee className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">No Solo Grindr</h3>
              <p className="text-muted-foreground leading-relaxed">
                Conversación real, amistad, networking. Si buscas solo hookups, esta no es tu app.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Popular Spots Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-16 sm:mb-20"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">
            🌈 Lugares LGBT+ Más Mencionados
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="glass-effect rounded-xl p-6 border border-border hover:border-blue-500/50 transition-all">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                🍸 <span>Bares y Clubes</span>
              </h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• <strong>Blondie</strong> - Providencia (viernes y sábados)</li>
                <li>• <strong>Bokhara</strong> - Bellavista (fiesta drag)</li>
                <li>• <strong>Bunker</strong> - Centro (after office gay)</li>
                <li>• <strong>Fausto</strong> - Bellavista (ambiente relax)</li>
              </ul>
            </div>

            <div className="glass-effect rounded-xl p-6 border border-border hover:border-blue-500/50 transition-all">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                ☕ <span>Cafés y Chill</span>
              </h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• <strong>Lastarria</strong> - Cafés con terraza LGBT-friendly</li>
                <li>• <strong>Barrio Italia</strong> - Vintage shops y café</li>
                <li>• <strong>Bellas Artes</strong> - Cultura y conversación</li>
                <li>• <strong>Parque Forestal</strong> - Paseos y picnic</li>
              </ul>
            </div>

            <div className="glass-effect rounded-xl p-6 border border-border hover:border-blue-500/50 transition-all">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                🏋️ <span>Deporte y Fitness</span>
              </h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• <strong>Cerro San Cristóbal</strong> - Hiking grupal</li>
                <li>• <strong>Parque Bicentenario</strong> - Running LGBT+</li>
                <li>• <strong>Gimnasios Providencia</strong> - Bodybuilding</li>
                <li>• <strong>Yoga Bellavista</strong> - Mindfulness</li>
              </ul>
            </div>

            <div className="glass-effect rounded-xl p-6 border border-border hover:border-blue-500/50 transition-all">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                🎭 <span>Cultura y Arte</span>
              </h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>• <strong>Teatro Municipal</strong> - Ópera y ballet</li>
                <li>• <strong>GAM</strong> - Artes escénicas y expos</li>
                <li>• <strong>Museo de Bellas Artes</strong> - Cultura</li>
                <li>• <strong>Cines Hoyts</strong> - Cine LGBT+ ocasional</li>
              </ul>
            </div>
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
            💬 Lo Que Dicen Usuarios de Santiago
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="glass-effect rounded-xl p-6 border border-border">
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                "Vivo en Providencia y siempre encuentro gente de mi barrio. Hemos armado grupo para café los domingos en Lastarria."
              </p>
              <p className="text-sm font-semibold text-blue-400">— Sebastián, 29 años, Providencia</p>
            </div>

            <div className="glass-effect rounded-xl p-6 border border-border">
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                "Trabajo en Las Condes y en mi hora de almuerzo chateo. He conocido gente para after office en Blondie."
              </p>
              <p className="text-sm font-semibold text-cyan-400">— Pablo, 32 años, Las Condes</p>
            </div>

            <div className="glass-effect rounded-xl p-6 border border-border">
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                "Nuevo en Santiago, vine de regiones. Este chat me salvó para conocer gente y no sentirme tan solo."
              </p>
              <p className="text-sm font-semibold text-teal-400">— Javier, 26 años, Ñuñoa</p>
            </div>

            <div className="glass-effect rounded-xl p-6 border border-border">
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                "Organizamos hiking al San Cristóbal todos los sábados. La comunidad es súper activa y sana."
              </p>
              <p className="text-sm font-semibold text-green-400">— Martín, 35 años, La Reina</p>
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
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-3xl font-black text-white">
                1
              </div>
              <h3 className="text-xl font-bold mb-2">Entra Sin Registro</h3>
              <p className="text-muted-foreground">
                30 segundos y estás dentro. Sin email, sin tarjeta, sin complicaciones.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-3xl font-black text-white">
                2
              </div>
              <h3 className="text-xl font-bold mb-2">Elige Tu Zona</h3>
              <p className="text-muted-foreground">
                Entra al chat, menciona tu barrio, conecta con gente de tu sector.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-teal-500 to-green-500 flex items-center justify-center text-3xl font-black text-white">
                3
              </div>
              <h3 className="text-xl font-bold mb-2">Conoce Gente Real</h3>
              <p className="text-muted-foreground">
                Conversación, eventos, amistad. Sin presión de apps como Grindr.
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
                q: '¿Solo para gente de Santiago?',
                a: 'Principalmente sí, pero hay gente de Valparaíso, Viña y Conce que también entra. El foco es la RM.'
              },
              {
                q: '¿Hacen eventos offline?',
                a: 'Sí, café en Lastarria, hiking San Cristóbal, salidas Blondie. Todo coordinado en el chat, opcional.'
              },
              {
                q: '¿Es seguro quedar con alguien del chat?',
                a: 'Usa sentido común: primero videollamada, queda en lugares públicos, avisa a un amigo. Seguridad primero.'
              },
              {
                q: '¿Qué edad promedio tiene la sala?',
                a: 'Variado: 25-45 años mayormente. Hay de todo, desde universitarios hasta profesionales establecidos.'
              },
              {
                q: '¿Es solo para buscar pareja?',
                a: 'No. Hay de todo: amistad, networking, eventos, y si surge química romántica, perfecto. Sin presión.'
              }
            ].map((faq, index) => (
              <div key={index} className="glass-effect rounded-xl p-6 border border-border">
                <h3 className="text-lg font-bold mb-2 text-blue-300">{faq.q}</h3>
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
          <div className="glass-effect rounded-3xl p-10 sm:p-16 border-2 border-blue-500/30 bg-gradient-to-br from-blue-900/20 to-cyan-900/20">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
              ¿Listo para Conocer Gays de Santiago?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Únete a la comunidad gay más activa de la capital. Conversación real, eventos, amistad. Todo gratis.
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={handleEnterChat}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xl sm:text-2xl px-12 sm:px-20 py-6 sm:py-8 rounded-2xl shadow-2xl"
              >
                <MapPin className="w-7 h-7 mr-3" />
                Entrar al Chat Ahora
                <ArrowRight className="w-7 h-7 ml-3" />
              </Button>
            </motion.div>
            <p className="text-sm text-muted-foreground mt-6">
              🏙️ +80 usuarios activos de Santiago • 🔒 100% anónimo • ⚡ Sin registro
            </p>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default SantiagoLandingPage;
