import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import PageLoader from '@/components/ui/PageLoader';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay'; // ✅ FASE 2: Overlay de loading

// ⚡ CRITICAL COMPONENTS - Cargados síncronamente (necesarios para primera carga)
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import LandingLayout from '@/components/layout/LandingLayout';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { PrivateChatProvider } from '@/contexts/PrivateChatContext';
import GlobalPrivateChatWindow from '@/components/chat/GlobalPrivateChatWindow';
import RewardReceivedModal from '@/components/rewards/RewardReceivedModal';
import PWASplashScreen from '@/components/pwa/PWASplashScreen';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { useVersionChecker } from '@/hooks/useVersionChecker';
import { useSessionTracking } from '@/hooks/useSessionTracking';
import { subscribeToUserRewards, REWARD_TYPES } from '@/services/rewardsService';
import PerformanceSummaryButton from '@/components/PerformanceSummaryButton'; // 📊 Performance Monitor Button
import GlobalLandingPage from '@/pages/GlobalLandingPage'; // Landing principal - crítica para SEO
import ChatBottomNav from '@/components/chat/ChatBottomNav';

// 🚀 SEO LANDING MINIMALISTA - 1 segundo y redirige al chat
import SEOLanding, {
  SEOLandingChile,
  SEOLandingArgentina,
  SEOLandingMexico,
  SEOLandingEspana,
  SEOLandingBrasil
} from '@/components/seo/SEOLanding';

// ⚡ CODE SPLITTING - Lazy loading de páginas (reducción de 80% del bundle inicial)
// Estas páginas se cargan solo cuando el usuario navega a ellas
const LobbyPage = lazy(() => import('@/pages/LobbyPage'));
const AuthPage = lazy(() => import('@/pages/AuthPage'));
const ChatPage = lazy(() => import('@/pages/ChatPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const PremiumPage = lazy(() => import('@/pages/PremiumPage'));
const AdminPage = lazy(() => import('@/pages/AdminPage'));
const AdminTicketsPage = lazy(() => import('@/pages/AdminTicketsPage'));
const TicketDetailPage = lazy(() => import('@/pages/TicketDetailPage'));
const AdminCleanup = lazy(() => import('@/pages/AdminCleanup'));
const SeedConversaciones = lazy(() => import('@/pages/SeedConversaciones'));
const AnonymousChatPage = lazy(() => import('@/pages/AnonymousChatPage'));
const AnonymousForumPage = lazy(() => import('@/pages/AnonymousForumPage'));
const ThreadDetailPage = lazy(() => import('@/pages/ThreadDetailPage'));
const GamingLandingPage = lazy(() => import('@/pages/GamingLandingPage'));
const Mas30LandingPage = lazy(() => import('@/pages/Mas30LandingPage'));
const SantiagoLandingPage = lazy(() => import('@/pages/SantiagoLandingPage'));
const SpainLandingPage = lazy(() => import('@/pages/SpainLandingPage'));
const BrazilLandingPage = lazy(() => import('@/pages/BrazilLandingPage'));
const MexicoLandingPage = lazy(() => import('@/pages/MexicoLandingPage'));
const ArgentinaLandingPage = lazy(() => import('@/pages/ArgentinaLandingPage'));
const TestLandingPage = lazy(() => import('@/pages/TestLandingPage'));
const TestModalPage = lazy(() => import('@/pages/TestModalPage'));
const FAQPage = lazy(() => import('@/pages/FAQPage'));
const BaulPage = lazy(() => import('@/pages/BaulPage'));
const ProfileViewPage = lazy(() => import('@/pages/ProfileViewPage'));

// 🎯 OPIN - Discovery Wall
const OpinFeedPage = lazy(() => import('@/pages/OpinFeedPage'));
const OpinComposerPage = lazy(() => import('@/pages/OpinComposerPage'));

// ✅ Componentes que usan useAuth deben estar dentro del AuthProvider
function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user && !user.isGuest ? children : <Navigate to="/auth" />;
}

function LandingRoute({ children, redirectTo = '/home' }) {
  const { user } = useAuth();

  // ✅ Solo mostrar landing si NO está logueado (incluyendo guests)
  if (user && !user.isGuest && !user.isAnonymous) {
    return <Navigate to={redirectTo} replace />;
  }

  // ✅ Wrapper de seguridad con ErrorBoundary
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

function HomeRoute({ children }) {
  const { user } = useAuth();
  // ✅ Solo mostrar home si está logueado (NO guests)
  if (!user || user.isGuest || user.isAnonymous) {
    return <Navigate to="/chat/principal" replace />;
  }
  return children;
}

function MainLayout({ children }) {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      <style>{`
        :root {
          ${user?.theme?.colors || ''}
        }
        body {
          ${user?.theme?.font ? `font-family: ${user.theme.font};` : ''}
        }
      `}</style>
      <Header />
      <main className="flex-1 pt-16 sm:pt-20 pb-16 lg:pb-0">{children}</main>
      <Footer />
      <ChatBottomNav />
    </div>
  );
}

// Layout especial para OPIN - sin padding-top cuando usuario no está logueado
function OpinLayout({ children }) {
  const { user } = useAuth();
  const isReadOnlyMode = !user || user.isAnonymous || user.isGuest;

  return (
    <div className="flex flex-col min-h-screen">
      <style>{`
        :root {
          ${user?.theme?.colors || ''}
        }
        body {
          ${user?.theme?.font ? `font-family: ${user.theme.font};` : ''}
        }
      `}</style>
      <Header />
      <main className={`flex-1 pb-16 lg:pb-0 ${isReadOnlyMode ? '' : 'pt-16 sm:pt-20'}`}>{children}</main>
      <Footer />
      <ChatBottomNav />
    </div>
  );
}

// ⚡ OPTIMIZACIÓN CRÍTICA: LoadingOverlay DESHABILITADO para VELOCIDAD FLASH
// La navegación optimista permite que el usuario entre al chat INSTANTÁNEAMENTE
// sin esperar a que Firebase complete (que puede tardar 155+ segundos)
function AppWithOverlay() {
  // const { guestAuthInProgress } = useAuth(); // Ya no necesitamos este estado

  return (
    <>
      <PrivateChatProvider>
        <RewardInboxListener />
        <AppRoutes />
        {/* Chat privado persistente: no se cierra al navegar entre secciones */}
        <GlobalPrivateChatWindow />
      </PrivateChatProvider>
      {/* ⚡ LoadingOverlay DESHABILITADO - Bloqueaba la UI por 155+ segundos */}
      {/* <LoadingOverlay show={guestAuthInProgress} /> */}
    </>
  );
}

function SessionTracker() {
  useSessionTracking();
  return null;
}

function RewardInboxListener() {
  const { user, refreshProfile } = useAuth();
  const [pendingRewards, setPendingRewards] = useState([]);
  const [currentReward, setCurrentReward] = useState(null);
  const seenInSessionRef = useRef(new Set());

  useEffect(() => {
    if (!user?.id || user?.isGuest || user?.isAnonymous) {
      setPendingRewards([]);
      setCurrentReward(null);
      return () => {};
    }

    const seenKey = `rewards_seen_ids:${user.id}`;

    const getSeenRewardIds = () => {
      try {
        const raw = localStorage.getItem(seenKey);
        const parsed = raw ? JSON.parse(raw) : [];
        return new Set(Array.isArray(parsed) ? parsed : []);
      } catch {
        return new Set();
      }
    };

    const unsubscribe = subscribeToUserRewards(user.id, (userRewards) => {
      const seenIds = getSeenRewardIds();

      const unseenActiveRewards = (userRewards || [])
        .filter((reward) =>
          reward?.status === 'active' &&
          reward?.id &&
          !seenIds.has(reward.id) &&
          !seenInSessionRef.current.has(reward.id)
        )
        .sort((a, b) => {
          const aTs = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTs = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bTs - aTs;
        });

      setPendingRewards(unseenActiveRewards);
    });

    return () => unsubscribe();
  }, [user?.id, user?.isGuest, user?.isAnonymous]);

  useEffect(() => {
    if (!currentReward && pendingRewards.length > 0) {
      setCurrentReward(pendingRewards[0]);
    }
  }, [pendingRewards, currentReward]);

  const handleAcceptReward = () => {
    if (!currentReward?.id || !user?.id) {
      setCurrentReward(null);
      return;
    }

    seenInSessionRef.current.add(currentReward.id);

    const seenKey = `rewards_seen_ids:${user.id}`;
    try {
      const raw = localStorage.getItem(seenKey);
      const parsed = raw ? JSON.parse(raw) : [];
      const seenList = Array.isArray(parsed) ? parsed : [];
      if (!seenList.includes(currentReward.id)) {
        seenList.push(currentReward.id);
      }
      localStorage.setItem(seenKey, JSON.stringify(seenList.slice(-200)));
    } catch {
      localStorage.setItem(seenKey, JSON.stringify([currentReward.id]));
    }

    if (currentReward.type === REWARD_TYPES.PRO_USER) {
      localStorage.setItem(`pro_congrats_seen:${user.id}`, 'true');
    }

    // Refrescar perfil para que se muestren arcoíris, badge, segunda foto, etc.
    refreshProfile?.();

    const acceptedId = currentReward.id;
    setCurrentReward(null);
    setPendingRewards((prev) => prev.filter((reward) => reward.id !== acceptedId));
  };

  return (
    <RewardReceivedModal
      isOpen={Boolean(currentReward)}
      reward={currentReward}
      onAccept={handleAcceptReward}
      username={user?.username || 'Usuario'}
    />
  );
}

// ✅ Componente de rutas que está dentro del AuthProvider
function AppRoutes() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      {/* ⚡ SUSPENSE: Maneja la carga de componentes lazy */}
      <Suspense fallback={<PageLoader />}>
        <Routes>
        {/* 🧪 PÁGINA DE PRUEBA - SIN wrappers (funciona correctamente) */}
        <Route path="/test" element={<TestLandingPage />} />
        {/* 🧪 MODAL DE PRUEBA - Solo modal de nickname */}
        <Route path="/test-modal" element={<TestModalPage />} />
        
        {/* 🚀 SEO LANDING MINIMALISTA - Google indexa, usuario ve 1 segundo y entra al chat */}

        {/* ✅ RUTA PRINCIPAL: SEO Landing Chile (1 seg) → /chat/principal */}
        <Route path="/" element={<SEOLandingChile />} />
        <Route path="/landing" element={<SEOLandingChile />} />
        <Route path="/chat-gay-chile" element={<SEOLandingChile />} />
        <Route path="/chat-gay-chile/" element={<SEOLandingChile />} />

        {/* 🌍 RUTAS REGIONALES: SEO Landing específica → chat regional */}
        <Route path="/argentina" element={<SEOLandingArgentina />} />
        <Route path="/ar" element={<SEOLandingArgentina />} />
        <Route path="/modal-arg" element={<SEOLandingArgentina />} />

        <Route path="/brasil" element={<SEOLandingBrasil />} />
        <Route path="/br" element={<SEOLandingBrasil />} />
        <Route path="/modal-br" element={<SEOLandingBrasil />} />

        <Route path="/mexico" element={<SEOLandingMexico />} />
        <Route path="/mx" element={<SEOLandingMexico />} />
        <Route path="/modal-mx" element={<SEOLandingMexico />} />

        <Route path="/españa" element={<SEOLandingEspana />} />
        <Route path="/es" element={<SEOLandingEspana />} />
        <Route path="/modal-es" element={<SEOLandingEspana />} />
        <Route path="/es-test" element={<SEOLandingEspana />} />

        {/* Trailing slashes - redirigen a la landing correspondiente */}
        <Route path="/es/" element={<SEOLandingEspana />} />
        <Route path="/mx/" element={<SEOLandingMexico />} />
        <Route path="/ar/" element={<SEOLandingArgentina />} />
        <Route path="/br/" element={<SEOLandingBrasil />} />
        <Route path="/argentina/" element={<SEOLandingArgentina />} />
        <Route path="/brasil/" element={<SEOLandingBrasil />} />
        <Route path="/mexico/" element={<SEOLandingMexico />} />
        <Route path="/españa/" element={<SEOLandingEspana />} />
        
        {/* ✅ ARQUITECTURA: Home solo para usuarios logueados */}
        <Route path="/home" element={<HomeRoute><MainLayout><LobbyPage /></MainLayout></HomeRoute>} />
        <Route path="/inicio" element={<HomeRoute><MainLayout><LobbyPage /></MainLayout></HomeRoute>} />
        {/* ✅ MANTENER: /lobby como alias de /home para compatibilidad */}
        <Route path="/lobby" element={<HomeRoute><MainLayout><LobbyPage /></MainLayout></HomeRoute>} />
        
        <Route path="/auth" element={<AuthPage />} />
        
        {/* FAQ Page - Public access */}
        <Route path="/faq" element={<MainLayout><FAQPage /></MainLayout>} />
        <Route path="/preguntas-frecuentes" element={<MainLayout><FAQPage /></MainLayout>} />

        {/* 🚀 LANDINGS ESPECÍFICAS - Contenido único para mejor SEO */}
        <Route path="/global" element={<LandingRoute><LandingLayout><GlobalLandingPage /></LandingLayout></LandingRoute>} />
        <Route path="/gaming" element={<LandingRoute redirectTo="/chat/principal"><LandingLayout><GamingLandingPage /></LandingLayout></LandingRoute>} />
        <Route path="/video-chat-gay" element={<LandingRoute redirectTo="/chat/principal"><LandingLayout><GamingLandingPage /></LandingLayout></LandingRoute>} />
        <Route path="/video-chat-gay/" element={<LandingRoute redirectTo="/chat/principal"><LandingLayout><GamingLandingPage /></LandingLayout></LandingRoute>} />
        <Route path="/mas-30" element={<LandingRoute redirectTo="/chat/principal"><LandingLayout><Mas30LandingPage /></LandingLayout></LandingRoute>} />
        <Route path="/santiago" element={<LandingRoute redirectTo="/chat/principal"><LandingLayout><SantiagoLandingPage /></LandingLayout></LandingRoute>} />

        {/* ✅ REDIRECCIÓN: conversas-libres → principal (sala limpia sin spam) */}
        <Route
          path="/chat/conversas-libres"
          element={<Navigate to="/chat/principal" replace />}
        />

        {/* ✅ SEO: Mantener compatibilidad con URLs indexadas - global → principal */}
        <Route
          path="/chat/global"
          element={<Navigate to="/chat/principal" replace />}
        />

        <Route path="/chat/:roomId" element={<ChatPage />} />
        <Route path="/chat-secondary/:roomId" element={<Navigate to="/chat/principal" replace />} />
        <Route path="/anonymous-chat" element={<AnonymousChatPage />} />
        <Route path="/anonymous-forum" element={<AnonymousForumPage />} />
        <Route path="/foro-gay" element={<AnonymousForumPage />} />
        <Route path="/foro-gay/" element={<AnonymousForumPage />} />
        <Route path="/thread/:threadId" element={<MainLayout><ThreadDetailPage /></MainLayout>} />

        {/* 🎯 BAÚL - Página independiente */}
        <Route path="/baul" element={<MainLayout><BaulPage /></MainLayout>} />

        {/* 🎯 OPIN - Discovery Wall */}
        <Route path="/opin" element={<OpinLayout><OpinFeedPage /></OpinLayout>} />
        <Route
          path="/opin/new"
          element={
            <PrivateRoute>
              <MainLayout><OpinComposerPage /></MainLayout>
            </PrivateRoute>
          }
        />

        <Route path="/profile/:userId" element={<MainLayout><ProfileViewPage /></MainLayout>} />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <MainLayout><ProfilePage /></MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/premium"
          element={
            <PrivateRoute>
              <MainLayout><PremiumPage /></MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <MainLayout><AdminPage /></MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/tickets"
          element={
            <PrivateRoute>
              <MainLayout><AdminTicketsPage /></MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/tickets/:ticketId"
          element={
            <PrivateRoute>
              <MainLayout><TicketDetailPage /></MainLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/seed-conversaciones"
          element={
            <PrivateRoute>
              <SeedConversaciones />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/cleanup"
          element={
            <PrivateRoute>
              <AdminCleanup />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/chat/principal" />} />
        </Routes>
      </Suspense>
      <Toaster />
      {/* 📊 Performance Monitor - Botón flotante para ver resumen */}
      {import.meta.env.DEV && <PerformanceSummaryButton />}
    </Router>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(false);
  const [splashCompleted, setSplashCompleted] = useState(false);

  // 🔄 Sistema de auto-actualización: Verifica nuevas versiones y limpia cache automáticamente
  useVersionChecker({
    checkInterval: 60000, // Verificar cada 60 segundos
    autoReload: true // Recargar automáticamente si hay nueva versión
  });

  useEffect(() => {
    // Detectar si está corriendo como PWA
    const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                  window.navigator.standalone ||
                  document.referrer.includes('android-app://');

    // Mostrar splash solo en PWA y solo la primera vez en cada sesión
    const hasShownSplash = sessionStorage.getItem('splashShown');

    if (isPWA && !hasShownSplash) {
      setShowSplash(true);
      sessionStorage.setItem('splashShown', 'true');
    } else {
      setSplashCompleted(true);
    }
  }, []);

  const handleSplashComplete = () => {
    setSplashCompleted(true);
  };

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <SessionTracker />
          {showSplash && !splashCompleted && (
            <PWASplashScreen onComplete={handleSplashComplete} />
          )}
          {(!showSplash || splashCompleted) && <AppWithOverlay />}
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
