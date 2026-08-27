import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MessageCircle,
  Users,
  Shield,
  Sparkles,
  Lock,
  ArrowRight,
  CheckCircle2,
  Star,
  Heart,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import EventsCalendar from '@/components/events/EventsCalendar';
// ⚠️ MODAL INVITADO ELIMINADO - Solo registro normal
// import { GuestUsernameModal } from '@/components/auth/GuestUsernameModal';

/**
 * LANDING PAGE PARA SALAS DE CHAT
 *
 * Se muestra cuando user === null (visitante sin sesión)
 * Propósito:
 * - Evitar requests a Firestore sin autenticación
 * - Mejorar SEO con contenido indexable
 * - Aumentar conversión mostrando valor antes de registro
 * - Experiencia profesional (como Slack, Discord)
 */

// Contenido personalizado por sala
const ROOM_CONTENT = {
  'global': {
    title: 'Conversas Libres',
    subtitle: 'Chat gay chileno sin filtros',
    description: 'Una sala de conversación de Chile. Conoce gays de todo el país, conversa de cualquier tema sin presión. Ambiente relajado, sin juicios.',
    icon: '💬',
    features: [
      'Chat en tiempo real según la actividad',
      'Participación real de la comunidad',
      'Moderación contra spam y acoso',
      'Acceso sin costo y privacidad clara'
    ],
    ctaPrimary: 'Entrar al chat gratis',
    ctaSecondary: 'Crear cuenta',
    ctaPrimary: 'Unirme a Gaming',
    ctaSecondary: 'Registrarme',
    ctaPrimary: 'Entrar a +30',
    ctaSecondary: 'Crear cuenta',
    ctaPrimary: 'Chatear en Santiago',
    ctaSecondary: 'Unirme ahora',
    testimonials: [
      { text: 'Conocí amigos de mi barrio', author: 'Usuario de Providencia' },
      { text: 'La mejor app para gays de Stgo', author: 'Usuario de Las Condes' }
    ]
  }
};

const ChatLandingPage = ({ roomSlug }) => {
  const navigate = useNavigate();
  const content = ROOM_CONTENT[roomSlug] || ROOM_CONTENT['global'];
  // ⚠️ MODAL INVITADO ELIMINADO - Solo registro normal
  // const [showGuestModal, setShowGuestModal] = useState(false);

  // SEO: Meta tags dinámicos
  useEffect(() => {
    // Title
    document.title = `${content.title} - Chactivo | Chat Gay Chile`;

    // Meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = content.description;

    // Meta robots (permitir indexación)
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.name = 'robots';
      document.head.appendChild(metaRobots);
    }
    metaRobots.content = 'index,follow';

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = `${window.location.origin}/chat/${roomSlug}`;

    return () => {
      // Restaurar descripción por defecto
      if (metaDescription && document.head.contains(metaDescription)) {
        metaDescription.content = '🏳️‍🌈 Chat gay chileno 100% gratis. Conoce gays, chatea en vivo, comunidad LGBT+ activa.';
      }
    };
  }, [content, roomSlug]);

  // ✅ Redirigir a registro normal
  const handleJoinChat = () => {
    navigate('/auth', { state: { redirectTo: `/chat/${roomSlug}` } });
  };

  const handleSignup = () => {
    navigate(`/auth?redirect=/chat/${roomSlug}`);
  };

  const handleGoHome = () => {
    navigate('/lobby');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header con logo */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 mb-6 cursor-pointer" onClick={handleGoHome}>
              <span className="text-4xl">🏳️‍🌈</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Chactivo
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-6"
          >
            <div className="text-7xl mb-4">{content.icon}</div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              {content.title}
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8">
              {content.subtitle}
            </p>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              {content.description}
            </p>
          </motion.div>

          {/* CTAs principales */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-8"
          >
            {/* Botón principal: MÁS GRANDE y destacado */}
            <Button
              onClick={handleJoinChat}
              size="lg"
              className="h-16 sm:h-20 px-10 sm:px-14 text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:via-pink-500 hover:to-purple-500 shadow-2xl hover:shadow-purple-500/50 transition-all hover:scale-105 w-full sm:w-auto uppercase tracking-wide relative overflow-hidden group"
            >
              {/* Efecto de brillo animado */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <span className="relative z-10 flex items-center gap-3">
                <Zap className="w-6 h-6 sm:w-7 sm:h-7" />
                {content.ctaPrimary}
              </span>
            </Button>
            
            {/* Botón secundario: MÁS PEQUEÑO pero elegante */}
            <Button
              onClick={handleSignup}
              size="default"
              variant="outline"
              className="h-11 sm:h-12 px-6 sm:px-8 text-sm sm:text-base font-semibold border-2 border-purple-400/60 hover:border-purple-400 hover:bg-purple-500/10 dark:border-purple-500/60 dark:hover:border-purple-500 dark:hover:bg-purple-900/30 transition-all hover:scale-105 w-full sm:w-auto backdrop-blur-sm"
            >
              <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              {content.ctaSecondary}
            </Button>
          </motion.div>

          <div className="mb-12 text-center text-sm text-gray-500 dark:text-gray-400">
            La disponibilidad de respuestas depende de la participación real; no mostramos contadores inventados.
          </div>
        </div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          {content.features.map((feature, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <p className="font-semibold text-gray-700 dark:text-gray-300">
                  {feature}
                </p>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Benefits Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-12"
        >
          <h2 className="text-3xl font-bold text-center mb-8">
            ¿Por qué elegir Chactivo?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-purple-100 dark:bg-purple-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">100% Seguro</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Herramientas y normas contra spam y acoso.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-pink-100 dark:bg-pink-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-pink-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">Privacidad Total</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Chat anónimo opcional. Tú decides qué compartir.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-bold text-lg mb-2">Gratis Siempre</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Sin costos ocultos. Chat ilimitado sin pagar.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Events Calendar Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.5 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold text-center mb-4">
            📅 Eventos de la Semana
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Conecta en horarios específicos con gente que comparte tus intereses. ¡Crea el hábito!
          </p>
          <div className="max-w-3xl mx-auto">
            <EventsCalendar roomSlug={roomSlug} />
          </div>
        </motion.div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 0.5 }}
          className="text-center bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-12 text-white"
        >
          <h2 className="text-4xl font-bold mb-4">
            ¿Listo para conocer gente increíble?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Participa en una comunidad LGBT+ de Chile
          </p>
          <Button
            onClick={handleJoinChat}
            size="lg"
            className="h-16 px-12 text-xl font-bold bg-white text-purple-600 hover:bg-gray-100 shadow-2xl"
          >
            Entrar al chat ahora
            <ArrowRight className="w-6 h-6 ml-2" />
          </Button>
          <p className="mt-4 text-sm opacity-75">
            Sin registro obligatorio • Gratis para siempre
          </p>
        </motion.div>

          {/* Footer Links */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <button
            onClick={handleGoHome}
            className="hover:text-purple-600 transition-colors"
          >
            ← Volver a todas las salas
          </button>
        </div>
      </div>

      {/* ⚠️ MODAL INVITADO ELIMINADO - Solo registro normal en /auth */}
    </div>
  );
};

export default ChatLandingPage;
