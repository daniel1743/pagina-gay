import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, Shield, Sparkles, MessageCircle, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import RoomPreviewCard from '@/components/lobby/RoomPreviewCard';
import RoomCard from '@/components/lobby/RoomCard';
import FeatureCard from '@/components/lobby/FeatureCard';
import GlobalStats from '@/components/lobby/GlobalStats';
import { GuestUsernameModal } from '@/components/auth/GuestUsernameModal';
import QuickSignupModal from '@/components/auth/QuickSignupModal';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { trackPageView, trackPageExit } from '@/services/analyticsService';
import { useCanonical } from '@/hooks/useCanonical';
import { subscribeToMultipleRoomCounts } from '@/services/presenceService';
import { roomsData } from '@/config/rooms';

/**
 * ✅ LOBBY PAGE OPTIMIZADO - Versión UX Mejorada
 * Basado en: HOME_UX_AUDIT.md + HOME_UX_DESIGN_PROPOSAL.md
 *
 * Cambios principales:
 * - Eliminado: Carrusel de imágenes, hero masivo, testimonios completos
 * - Agregado: Sección "Recomendado para ti", Tabs de categorías
 * - Mejorado: Acceso directo a salas, jerarquía visual clara
 */

const LobbyPage = () => {
  useCanonical('/');
  const navigate = useNavigate();
  const { user } = useAuth();

  // Estados
  const [roomCounts, setRoomCounts] = useState({});
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showQuickSignup, setShowQuickSignup] = useState(false);
  const [targetRoom, setTargetRoom] = useState(null);
  const [activeTab, setActiveTab] = useState('chile');

  // Determinar qué mostrar según el usuario
  const showHeroSection = !user; // Solo para visitantes
  const showWelcomeBack = user && !user.isGuest && !user.isAnonymous;

  // Suscribirse a contadores de usuarios en tiempo real
  useEffect(() => {
    const roomIds = roomsData.map(room => room.id);
    const unsubscribe = subscribeToMultipleRoomCounts(roomIds, (counts) => {
      setRoomCounts(counts);
    });
    return () => unsubscribe();
  }, []);

  // Track page view
  useEffect(() => {
    trackPageView('/lobby', 'Chat Gay Chile - Chactivo');
    return () => trackPageExit('/lobby', 0);
  }, []);

  // ✅ FUNCIÓN: Obtener salas recomendadas
  const getRecommendedRooms = () => {
    const recommended = [];

    // 1. Siempre: Chat Global
    const globalRoom = roomsData.find(r => r.id === 'global');
    recommended.push({
      ...globalRoom,
      reason: 'Sala más activa',
      userCount: roomCounts['global'] || 0,
      priority: 1
    });

    // 2. Santiago (por defecto para Chile)
    const santiagoRoom = roomsData.find(r => r.id === 'santiago');
    if (santiagoRoom) {
      recommended.push({
        ...santiagoRoom,
        reason: 'Popular en tu área',
        userCount: roomCounts['santiago'] || 0,
        priority: 2
      });
    }

    // 3. Gaming (si hay usuarios activos) o Más de 30
    const gamingRoom = roomsData.find(r => r.id === 'gaming');
    const mas30Room = roomsData.find(r => r.id === 'mas-30');
    const gamingCount = roomCounts['gaming'] || 0;

    if (gamingCount > 0) {
      recommended.push({
        ...gamingRoom,
        reason: '🎮 Gamers activos',
        userCount: gamingCount,
        priority: 3
      });
    } else {
      recommended.push({
        ...mas30Room,
        reason: 'Comunidad madura',
        userCount: roomCounts['mas-30'] || 0,
        priority: 3
      });
    }

    return recommended.slice(0, 3);
  };

  // ✅ FUNCIÓN: Categorizar salas
  const categorizeRooms = () => {
    return {
      chile: roomsData.filter(r =>
        ['global', 'santiago', 'mas-30', 'gaming'].includes(r.id)
      ),
      paises: roomsData.filter(r =>
        ['es-main', 'br-main', 'mx-main', 'ar-main'].includes(r.id)
      ),
      temas: roomsData.filter(r =>
        ['gaming'].includes(r.id)
      ),
    };
  };

  const categorizedRooms = categorizeRooms();

  // ✅ FUNCIÓN: Entrar a sala (con o sin registro)
  const handleEnterRoom = (roomId) => {
    // Usuarios logueados: entrar directamente
    if (user && !user.isAnonymous && !user.isGuest) {
      navigate(`/chat/${roomId}`);
      return;
    }

    // Usuarios nuevos/guests: pedir username primero
    setTargetRoom(roomId);
    setShowGuestModal(true);
  };

  // Callback después de elegir username
  const handleGuestUsernameSet = () => {
    setShowGuestModal(false);
    if (targetRoom) {
      toast({
        title: "¡Bienvenido!",
        description: `Entrando a ${roomsData.find(r => r.id === targetRoom)?.name}...`,
      });
      navigate(`/chat/${targetRoom}`);
      setTargetRoom(null);
    }
  };

  return (
    <>
      <div className="w-full min-h-screen pb-16 sm:pb-20">

        {/* ✅ A) BLOQUE SUPERIOR - Solo para visitantes */}
        {showHeroSection && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative px-4 sm:px-6 lg:px-8 py-12 sm:py-16 mb-12 sm:mb-16"
          >
            <div className="max-w-4xl mx-auto text-center">
              {/* Título principal */}
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 sm:mb-6 leading-tight"
              >
                <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Elige una sala y entra ahora
                </span>
              </motion.h1>

              {/* Subtexto */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-base sm:text-lg text-muted-foreground mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed"
              >
                Sin registro obligatorio • Anónimo • Conversaciones reales en vivo
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6"
              >
                {/* CTA Primario */}
                <Button
                  onClick={() => handleEnterRoom('global')}
                  className="magenta-gradient text-white font-extrabold text-lg sm:text-xl px-10 sm:px-14 py-6 sm:py-7 rounded-2xl shadow-2xl hover:shadow-[#E4007C]/70 hover:scale-105 transition-all w-full sm:w-auto min-h-[60px]"
                >
                  ⚡ Entrar a Chat Global
                </Button>

                {/* CTA Secundario */}
                <Button
                  onClick={() => {
                    const section = document.getElementById('explorar-salas');
                    section?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  variant="outline"
                  className="border-2 border-cyan-500/40 text-cyan-400 font-semibold text-base sm:text-lg px-6 sm:px-10 py-5 sm:py-6 rounded-xl hover:bg-cyan-500/10 hover:border-cyan-500 transition-all w-full sm:w-auto"
                >
                  Ver todas las salas →
                </Button>
              </motion.div>

              {/* Indicador de estado */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-sm text-gray-400"
              >
                💚 Modo Invitado (sin registro) •{' '}
                <button
                  onClick={() => setShowQuickSignup(true)}
                  className="text-cyan-400 hover:underline"
                >
                  Iniciar sesión
                </button>
              </motion.div>
            </div>
          </motion.section>
        )}

        {/* ✅ WELCOME BACK - Solo para usuarios logueados */}
        {showWelcomeBack && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 mb-8"
          >
            <div className="glassmorphism-card rounded-2xl p-6 sm:p-8 border border-primary/20">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                ¡Hola de vuelta, {user?.username}! 👋
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground mb-6">
                ¿Listo para seguir chateando?
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => handleEnterRoom('global')}
                  className="magenta-gradient text-white font-bold text-lg px-8 py-5 rounded-xl"
                >
                  🔥 Continuar en Chat Global
                </Button>
                <Button
                  onClick={() => {
                    const section = document.getElementById('explorar-salas');
                    section?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  variant="outline"
                  className="border-cyan-500/40 text-cyan-400 px-8 py-5 rounded-xl"
                >
                  Explorar otras salas
                </Button>
              </div>
            </div>
          </motion.section>
        )}

        {/* ✅ B) RECOMENDADO PARA TI */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 mb-12"
        >
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
              Recomendado para ti
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground">
              Salas más populares para empezar
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {getRecommendedRooms().map((room, index) => (
              <RoomPreviewCard
                key={room.id}
                room={room}
                highlighted={room.priority === 1} // Global destacado
                onClick={() => handleEnterRoom(room.id)}
                index={index}
              />
            ))}
          </div>
        </motion.section>

        {/* ✅ C) EXPLORAR POR CATEGORÍAS */}
        <motion.section
          id="explorar-salas"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 mb-12"
        >
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
              Explorar por categorías
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground">
              Encuentra la sala perfecta para ti
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
              <TabsTrigger value="chile">🇨🇱 Chile</TabsTrigger>
              <TabsTrigger value="paises">🌎 Países</TabsTrigger>
              <TabsTrigger value="temas">🎯 Temas</TabsTrigger>
            </TabsList>

            <TabsContent value="chile">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {categorizedRooms.chile.map((room, index) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    userCount={roomCounts[room.id] || 0}
                    onClick={() => handleEnterRoom(room.id)}
                    index={index}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="paises">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {categorizedRooms.paises.map((room, index) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    userCount={roomCounts[room.id] || 0}
                    onClick={() => handleEnterRoom(room.id)}
                    index={index}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="temas">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {categorizedRooms.temas.map((room, index) => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    userCount={roomCounts[room.id] || 0}
                    onClick={() => handleEnterRoom(room.id)}
                    index={index}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </motion.section>

        {/* ✅ D) COMUNIDAD (Foro + Gaming) */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 mb-12"
        >
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">
              Comunidad
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground">
              Espacios especializados para conectar
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Foro */}
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              onClick={() => navigate('/anonymous-forum')}
              className="glassmorphism-card p-6 sm:p-8 rounded-2xl cursor-pointer border border-green-500/30 hover:border-green-500/60 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2 text-green-400">
                    Foro Gay Chile Anónimo
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3 leading-relaxed">
                    Comparte experiencias, pide consejos, encuentra apoyo. 100% anónimo y seguro.
                  </p>
                  <div className="flex items-center gap-2 text-sm font-semibold text-green-400">
                    <span>🔒 100% anónimo</span>
                    <span>•</span>
                    <span>💬 Comunidad activa</span>
                    <span>→</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Gaming */}
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              onClick={() => navigate('/gaming')}
              className="glassmorphism-card p-6 sm:p-8 rounded-2xl cursor-pointer border border-purple-500/30 hover:border-purple-500/60 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center flex-shrink-0">
                  <Gamepad2 className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2 text-purple-400">
                    Chat Gay Gamers Chile 🎮
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-3 leading-relaxed">
                    Conecta con gamers LGBT+. Squad, torneos, diversión sin toxicidad.
                  </p>
                  <div className="flex items-center gap-2 text-sm font-semibold text-purple-400">
                    <span>🎮 50+ activos</span>
                    <span>•</span>
                    <span>⚡ Activo 24/7</span>
                    <span>→</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* ✅ E) TRUST SIGNALS COMPACTO */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 mb-12"
        >
          <div className="glass-effect p-6 sm:p-8 rounded-2xl border border-cyan-500/20 text-center">
            {/* Rating */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-2xl font-bold text-yellow-400">4.8/5</span>
              <span className="text-sm text-muted-foreground">(247 opiniones)</span>
            </div>

            {/* Testimonio destacado */}
            <blockquote className="italic text-base text-gray-300 mb-3 leading-relaxed">
              "Finalmente un chat sin spam ni bots. Privacidad real, no promesas vacías."
            </blockquote>
            <p className="text-sm text-cyan-400 font-semibold mb-4">- Diego, 31 años • Santiago</p>

            {/* Link a más testimonios */}
            <a
              href="/about#testimonios"
              className="text-sm text-cyan-400 hover:underline font-medium inline-flex items-center gap-1"
            >
              Ver más testimonios
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </motion.section>

        {/* ✅ F) FOOTER SECUNDARIO */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 mb-12"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              title="Hazte Premium 💎"
              description="Avatares exclusivos, badges especiales y acceso prioritario."
              onClick={() => navigate('/premium')}
              variant="default"
              stats={{ label: "💎 Beneficios exclusivos", icon: Sparkles }}
              accentColor="purple"
              index={0}
            />

            <FeatureCard
              title="Centro de Seguridad"
              description="Reporta comportamiento inadecuado de forma anónima."
              onClick={() => toast({ title: "Centro de Seguridad", description: "Modal próximamente" })}
              variant="default"
              stats={{ label: "⚠️ Denuncia anónima", icon: Shield }}
              accentColor="orange"
              index={1}
            />

            <FeatureCard
              title="Acerca de Chactivo"
              description="Conoce al creador, misión, valores y por qué somos diferentes."
              onClick={() => navigate('/about')}
              variant="default"
              stats={{ label: "💜 Nuestra historia", icon: MessageSquare }}
              accentColor="cyan"
              index={2}
            />
          </div>
        </motion.section>

        {/* ✅ GlobalStats - Solo para usuarios logueados */}
        {user && <GlobalStats />}

      </div>

      {/* ✅ MOBILE STICKY CTA */}
      {showHeroSection && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1, duration: 0.4 }}
          className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-background via-background to-transparent md:hidden"
        >
          <Button
            onClick={() => handleEnterRoom('global')}
            className="w-full magenta-gradient text-white font-bold text-lg py-6 rounded-xl shadow-2xl hover:shadow-[#E4007C]/70"
          >
            ⚡ Entrar a Chat Global
          </Button>
        </motion.div>
      )}

      {/* ✅ MODALES */}
      <GuestUsernameModal
        isOpen={showGuestModal}
        onClose={() => {
          setShowGuestModal(false);
          setTargetRoom(null);
        }}
        onSuccess={handleGuestUsernameSet}
      />

      <QuickSignupModal
        isOpen={showQuickSignup}
        onClose={() => setShowQuickSignup(false)}
        onSuccess={() => {
          setShowQuickSignup(false);
          toast({
            title: "¡Registro exitoso!",
            description: "Bienvenido a Chactivo 🎉",
          });
        }}
      />
    </>
  );
};

export default LobbyPage;
