import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gamepad2, Users, MessageSquare, Star, ArrowRight, Check, Zap, Shield, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCanonical } from '@/hooks/useCanonical';

const GamingLandingPage = () => {
  // SEO: Canonical tag
  useCanonical('/gaming');

  const navigate = useNavigate();
  const { user } = useAuth();

  React.useEffect(() => {
    // ✅ SEO: Title y meta description optimizados para CTR
    document.title = 'Chat Gay para Gamers en Chile 🎮 | Conoce Gamers LGBT+ | Chactivo';

    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = '🎮 Únete al chat gay de gamers más activo de Chile. Comparte tus juegos favoritos, encuentra squad LGBT+, chatea sobre PS5, Xbox, PC, Switch y móvil. ¡100% gratis, sin registro!';

    return () => {
      if (metaDescription && document.head.contains(metaDescription)) {
        metaDescription.content = '🏳️‍🌈 Chat gay chileno 100% gratis. Salas por interés: Gaming 🎮, +30 💪, Osos 🐻, Amistad 💬. Conversación real, sin presión de hookups.';
      }
    };
  }, []);

  const handleEnterChat = () => {
    if (user && !user.isGuest) {
      navigate('/chat/gaming');
    } else {
      navigate('/auth', { state: { redirectTo: '/chat/gaming' } });
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
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Conecta con otros gamers LGBT+ en tiempo real. Comparte juegos, forma equipos, encuentra amigos que realmente te entiendan.
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
              <span className="font-semibold">Activo 24/7</span>
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
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold text-xl sm:text-2xl px-10 sm:px-16 py-6 sm:py-8 rounded-2xl shadow-2xl"
            >
              <Gamepad2 className="w-6 h-6 sm:w-7 sm:h-7 mr-3" />
              Entrar al Chat Gamer
              <ArrowRight className="w-6 h-6 sm:w-7 sm:h-7 ml-3" />
            </Button>
          </motion.div>

          {/* Micro CTA copy */}
          <p className="text-sm text-muted-foreground mt-4">
            ⚡ Entra en 30 segundos • 🎮 100% gratis • 🔒 Sin email
          </p>
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
              <h3 className="text-xl font-bold mb-2">Entra Gratis</h3>
              <p className="text-muted-foreground">
                Sin registro, sin email, sin tarjeta. Solo elige un username.
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

        {/* FAQ Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-16 sm:mb-20"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
            ❓ Preguntas Frecuentes
          </h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: '¿Es realmente gratis?',
                a: 'Sí, 100% gratis. No pedimos tarjeta ni datos personales. Entra y chatea sin límites.'
              },
              {
                q: '¿Qué plataformas se juegan más?',
                a: 'PC es la más popular, pero hay mucha gente en PS5, Xbox, Switch y móvil. Todos son bienvenidos.'
              },
              {
                q: '¿Solo para gamers hardcore?',
                a: 'Para nada. Hay desde pros hasta casuales. Lo importante es la buena onda LGBT+ sin toxicidad.'
              },
              {
                q: '¿Puedo encontrar pareja aquí?',
                a: 'El foco es gaming y amistad, pero si surge química, perfecto. Sin presión de hookups como Grindr.'
              }
            ].map((faq, index) => (
              <div key={index} className="glass-effect rounded-xl p-6 border border-border">
                <h3 className="text-lg font-bold mb-2 text-violet-300">{faq.q}</h3>
                <p className="text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </motion.section>

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
                onClick={handleEnterChat}
                size="lg"
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold text-xl sm:text-2xl px-12 sm:px-20 py-6 sm:py-8 rounded-2xl shadow-2xl"
              >
                <Gamepad2 className="w-7 h-7 mr-3" />
                Entrar al Chat Ahora
                <ArrowRight className="w-7 h-7 ml-3" />
              </Button>
            </motion.div>
            <p className="text-sm text-muted-foreground mt-6">
              🎮 Más de 50+ gamers activos • 🔒 100% anónimo • ⚡ Sin registro
            </p>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default GamingLandingPage;
