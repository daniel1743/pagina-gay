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
import { arrayUnion, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import PerformanceSummaryButton from '@/components/PerformanceSummaryButton'; // 📊 Performance Monitor Button
import GlobalLandingPage from '@/pages/GlobalLandingPage'; // Landing principal - crítica para SEO
import ChatBottomNav from '@/components/chat/ChatBottomNav';

// 🚀 SEO LANDING MINIMALISTA - 1 segundo y redirige al chat
import SEOLanding, {
  SEOLandingHome,
  SEOLandingChile,
  SEOLandingArgentina,
  SEOLandingMexico,
  SEOLandingEspana,
  SEOLandingBrasil,
  SEOLandingSantiagoCentro,
  SEOLandingCDMX,
  SEOLandingBuenosAires,
  SEOLandingMadrid,
  SEOLandingSaoPaulo
} from '@/components/seo/SEOLanding';
import NoindexRouteNotice from '@/components/seo/NoindexRouteNotice';

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
const ThreadDetailPage = lazy(() => import('@/pages/ThreadDetailPage'));
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
const HeteroLandingPage = lazy(() => import('@/pages/HeteroLandingPage'));
const CommunityPolicyPage = lazy(() => import('@/pages/CommunityPolicyPage'));

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

function PremiumAccessRoute() {
  const { user } = useAuth();
  const isRegisteredUser = user && !user.isGuest && !user.isAnonymous;

  if (isRegisteredUser) {
    return (
      <MainLayout>
        <PremiumPage />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <NoindexRouteNotice
        title="Premium en revisión | Chactivo"
        description="Página informativa no indexable para Premium mientras la compra pública sigue en preparación."
        badge="No indexable"
        heading="Premium todavía no está operativo como compra pública"
        body="La ruta se mantiene visible para compatibilidad interna, pero hoy no se trabaja como destino SEO ni como checkout público estable. Si quieres usar Chactivo ahora, entra al chat principal."
        footnote="Temporalmente /premium queda fuera del sitemap porque la compra aún no está habilitada en producción y no conviene indexar una promesa incompleta."
        primaryLabel="Entrar al chat principal"
        primaryHref="/chat/principal"
        secondaryLabel="Ir a acceso"
        secondaryHref="/auth?redirect=/premium"
      />
    </MainLayout>
  );
}

// Layout especial para OPIN - sin padding-top cuando usuario no está logueado
function OpinLayout({ children }) {
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
      <main className="flex-1 pb-16 lg:pb-0">{children}</main>
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
  const seenInProfileRef = useRef(new Set());

  useEffect(() => {
    if (!user?.id || user?.isGuest || user?.isAnonymous) {
      seenInProfileRef.current = new Set();
      return;
    }

    let cancelled = false;

    const loadSeenFromProfile = async () => {
      try {
        const userSnap = await getDoc(doc(db, 'users', user.id));
        if (!userSnap.exists() || cancelled) return;

        const rawIds = userSnap.data()?.rewardModalSeenIds;
        const ids = Array.isArray(rawIds) ? rawIds.filter((id) => typeof id === 'string' && id.trim()) : [];
        seenInProfileRef.current = new Set(ids);
      } catch (error) {
        console.warn('[REWARDS] No se pudo cargar rewardModalSeenIds del perfil:', error?.message || error);
      }
    };

    loadSeenFromProfile();

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.isGuest, user?.isAnonymous]);

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
          !seenInProfileRef.current.has(reward.id) &&
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

    // Persistencia robusta: guardar también en perfil del usuario (evita re-show tras limpieza de cache/localStorage)
    updateDoc(doc(db, 'users', user.id), {
      rewardModalSeenIds: arrayUnion(currentReward.id),
      rewardModalSeenUpdatedAt: serverTimestamp(),
    }).catch((error) => {
      console.warn('[REWARDS] No se pudo persistir rewardModalSeenIds en perfil:', error?.message || error);
    });
    seenInProfileRef.current.add(currentReward.id);

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

        {/* ✅ CONSOLIDACIÓN SEO: / como superficie principal; aliases se consolidan hacia / */}
        <Route path="/" element={<SEOLandingHome />} />
        <Route path="/gay" element={<Navigate to="/" replace />} />
        <Route path="/gay/" element={<Navigate to="/" replace />} />
        <Route path="/landing" element={<Navigate to="/" replace />} />
        <Route path="/landing/" element={<Navigate to="/" replace />} />
        <Route path="/chat-gay-chile" element={<SEOLandingChile />} />
        <Route path="/chat-gay-chile/" element={<SEOLandingChile />} />
        <Route path="/chat-gay-santiago-centro" element={<SEOLandingSantiagoCentro />} />
        <Route path="/chat-gay-santiago-centro/" element={<SEOLandingSantiagoCentro />} />

        {/* 🧭 NUEVO VERTICAL HETERO: segmentación por intención sin mezclar con páginas gay */}
        <Route path="/hetero" element={<HeteroLandingPage variant="home" />} />
        <Route path="/hetero/" element={<HeteroLandingPage variant="home" />} />
        <Route path="/hetero/chat" element={<HeteroLandingPage variant="chat" />} />
        <Route path="/hetero/chat/" element={<HeteroLandingPage variant="chat" />} />
        <Route path="/hetero/amistad" element={<HeteroLandingPage variant="amistad" />} />
        <Route path="/hetero/amistad/" element={<HeteroLandingPage variant="amistad" />} />

        {/* 🌍 RUTAS REGIONALES: SEO Landing específica → chat regional */}
        <Route path="/argentina" element={<SEOLandingArgentina />} />
        <Route path="/ar" element={<SEOLandingArgentina />} />
        <Route path="/modal-arg" element={<Navigate to="/ar" replace />} />
        <Route path="/modal-arg/" element={<Navigate to="/ar" replace />} />

        <Route path="/brasil" element={<SEOLandingBrasil />} />
        <Route path="/br" element={<SEOLandingBrasil />} />
        <Route path="/modal-br" element={<Navigate to="/br" replace />} />
        <Route path="/modal-br/" element={<Navigate to="/br" replace />} />

        <Route path="/mexico" element={<SEOLandingMexico />} />
        <Route path="/mx" element={<SEOLandingMexico />} />
        <Route path="/mx/cdmx" element={<SEOLandingCDMX />} />
        <Route path="/modal-mx" element={<Navigate to="/mx" replace />} />
        <Route path="/modal-mx/" element={<Navigate to="/mx" replace />} />

        <Route path="/españa" element={<SEOLandingEspana />} />
        <Route path="/es" element={<SEOLandingEspana />} />
        <Route path="/es/madrid" element={<SEOLandingMadrid />} />
        <Route path="/modal-es" element={<Navigate to="/es" replace />} />
        <Route path="/modal-es/" element={<Navigate to="/es" replace />} />
        <Route path="/es-test" element={<SEOLandingEspana />} />

        {/* Trailing slashes - redirigen a la landing correspondiente */}
        <Route path="/es/" element={<SEOLandingEspana />} />
        <Route path="/mx/" element={<SEOLandingMexico />} />
        <Route path="/ar/" element={<SEOLandingArgentina />} />
        <Route path="/br/" element={<SEOLandingBrasil />} />
        <Route path="/mx/cdmx/" element={<SEOLandingCDMX />} />
        <Route path="/ar/buenos-aires" element={<SEOLandingBuenosAires />} />
        <Route path="/ar/buenos-aires/" element={<SEOLandingBuenosAires />} />
        <Route path="/es/madrid/" element={<SEOLandingMadrid />} />
        <Route path="/br/sao-paulo" element={<SEOLandingSaoPaulo />} />
        <Route path="/br/sao-paulo/" element={<SEOLandingSaoPaulo />} />
        <Route path="/argentina/" element={<SEOLandingArgentina />} />
        <Route path="/brasil/" element={<SEOLandingBrasil />} />
        <Route path="/mexico/" element={<SEOLandingMexico />} />
        <Route path="/españa/" element={<SEOLandingEspana />} />
        <Route path="/argentina/buenos-aires" element={<SEOLandingBuenosAires />} />
        <Route path="/argentina/buenos-aires/" element={<SEOLandingBuenosAires />} />
        <Route path="/brasil/sao-paulo" element={<SEOLandingSaoPaulo />} />
        <Route path="/brasil/sao-paulo/" element={<SEOLandingSaoPaulo />} />
        
        {/* ✅ ARQUITECTURA: Home solo para usuarios logueados */}
        <Route path="/home" element={<HomeRoute><MainLayout><LobbyPage /></MainLayout></HomeRoute>} />
        <Route path="/inicio" element={<HomeRoute><MainLayout><LobbyPage /></MainLayout></HomeRoute>} />
        {/* ✅ MANTENER: /lobby como alias de /home para compatibilidad */}
        <Route path="/lobby" element={<HomeRoute><MainLayout><LobbyPage /></MainLayout></HomeRoute>} />
        
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/normas-comunidad" element={<MainLayout><CommunityPolicyPage /></MainLayout>} />
        
        {/* FAQ Page - Public access */}
        <Route path="/faq" element={<MainLayout><FAQPage /></MainLayout>} />
        <Route path="/preguntas-frecuentes" element={<MainLayout><FAQPage /></MainLayout>} />

        {/* 🚀 LANDINGS ESPECÍFICAS - Contenido único para mejor SEO */}
        <Route path="/global" element={<LandingRoute><LandingLayout><GlobalLandingPage /></LandingLayout></LandingRoute>} />
        {/* ⏸️ TEMPORAL: gaming oculto */}
        <Route path="/gaming" element={<Navigate to="/chat/principal" replace />} />
        <Route path="/video-chat-gay" element={<Navigate to="/chat/principal" replace />} />
        <Route path="/video-chat-gay/" element={<Navigate to="/chat/principal" replace />} />
        <Route path="/mas-30" element={<LandingRoute redirectTo="/chat/principal"><LandingLayout><Mas30LandingPage /></LandingLayout></LandingRoute>} />
        <Route path="/santiago" element={<LandingRoute redirectTo="/chat/principal"><LandingLayout><SantiagoLandingPage /></LandingLayout></LandingRoute>} />

        {/* ✅ REDIRECCIÓN: conversas-libres → principal (sala limpia sin spam) */}
        <Route
          path="/chat/conversas-libres"
          element={
            <MainLayout>
              <NoindexRouteNotice
                title="Conversas Libres migró a la sala principal | Chactivo"
                description="Ruta legacy no indexable conservada para compatibilidad tras la consolidación de salas."
                badge="Ruta legacy"
                heading="Esta conversación ya se consolidó en la sala principal"
                body="La antigua ruta de conversas libres ya no funciona como sala separada. Se mantiene solo para no romper enlaces viejos, pero no se indexa ni se promociona por separado."
              />
            </MainLayout>
          }
        />
        <Route
          path="/chat/conversas-libres/"
          element={
            <MainLayout>
              <NoindexRouteNotice
                title="Conversas Libres migró a la sala principal | Chactivo"
                description="Ruta legacy no indexable conservada para compatibilidad tras la consolidación de salas."
                badge="Ruta legacy"
                heading="Esta conversación ya se consolidó en la sala principal"
                body="La antigua ruta de conversas libres ya no funciona como sala separada. Se mantiene solo para no romper enlaces viejos, pero no se indexa ni se promociona por separado."
              />
            </MainLayout>
          }
        />

        <Route
          path="/chat"
          element={
            <MainLayout>
              <NoindexRouteNotice
                title="Entrada general al chat | Chactivo"
                description="Página informativa no indexable para la ruta genérica /chat."
                badge="Ruta genérica"
                heading="La entrada genérica /chat no es un destino SEO independiente"
                body="La superficie pública y estable del producto es la sala principal. Esta ruta se conserva para compatibilidad y navegación interna, pero no debe indexarse como página propia."
              />
            </MainLayout>
          }
        />
        <Route
          path="/chat/"
          element={
            <MainLayout>
              <NoindexRouteNotice
                title="Entrada general al chat | Chactivo"
                description="Página informativa no indexable para la ruta genérica /chat."
                badge="Ruta genérica"
                heading="La entrada genérica /chat no es un destino SEO independiente"
                body="La superficie pública y estable del producto es la sala principal. Esta ruta se conserva para compatibilidad y navegación interna, pero no debe indexarse como página propia."
              />
            </MainLayout>
          }
        />

        {/* ✅ SEO: Mantener compatibilidad con URLs indexadas - global → principal */}
        <Route
          path="/chat/global"
          element={
            <MainLayout>
              <NoindexRouteNotice
                title="Chat global consolidado | Chactivo"
                description="Ruta histórica no indexable. El chat global fue consolidado en la sala principal."
                badge="Ruta histórica"
                heading="El antiguo chat global ya no vive como sala separada"
                body="Esta URL se conserva para enlaces históricos, pero la conversación fue consolidada en la sala principal para concentrar actividad real y evitar fragmentación."
              />
            </MainLayout>
          }
        />
        <Route
          path="/chat/global/"
          element={
            <MainLayout>
              <NoindexRouteNotice
                title="Chat global consolidado | Chactivo"
                description="Ruta histórica no indexable. El chat global fue consolidado en la sala principal."
                badge="Ruta histórica"
                heading="El antiguo chat global ya no vive como sala separada"
                body="Esta URL se conserva para enlaces históricos, pero la conversación fue consolidada en la sala principal para concentrar actividad real y evitar fragmentación."
              />
            </MainLayout>
          }
        />
        <Route path="/chat/hablar-primero" element={<Navigate to="/chat/principal" replace />} />
        <Route path="/chat/hablar-primero/" element={<Navigate to="/chat/principal" replace />} />
        <Route path="/chat/mas-30" element={<Navigate to="/mas-30" replace />} />
        <Route path="/chat/mas-30/" element={<Navigate to="/mas-30" replace />} />
        <Route path="/chat/santiago" element={<Navigate to="/santiago" replace />} />
        <Route path="/chat/santiago/" element={<Navigate to="/santiago" replace />} />
        <Route path="/chat/es-main" element={<Navigate to="/es" replace />} />
        <Route path="/chat/es-main/" element={<Navigate to="/es" replace />} />
        <Route path="/chat/br-main" element={<Navigate to="/br" replace />} />
        <Route path="/chat/br-main/" element={<Navigate to="/br" replace />} />
        <Route path="/chat/mx-main" element={<Navigate to="/mx" replace />} />
        <Route path="/chat/mx-main/" element={<Navigate to="/mx" replace />} />
        <Route path="/chat/ar-main" element={<Navigate to="/ar" replace />} />
        <Route path="/chat/ar-main/" element={<Navigate to="/ar" replace />} />
        <Route
          path="/chat/amistad"
          element={
            <MainLayout>
              <NoindexRouteNotice
                title="Sala amistad archivada | Chactivo"
                description="Ruta legacy no indexable. La antigua sala amistad ya no existe como superficie independiente."
                badge="Sala archivada"
                heading="La sala amistad ya no se trabaja como destino separado"
                body="Esta URL quedó como residuo de una arquitectura anterior. Hoy la actividad útil se concentra en la sala principal y por eso esta ruta se mantiene solo como compatibilidad legacy."
              />
            </MainLayout>
          }
        />
        <Route
          path="/chat/amistad/"
          element={
            <MainLayout>
              <NoindexRouteNotice
                title="Sala amistad archivada | Chactivo"
                description="Ruta legacy no indexable. La antigua sala amistad ya no existe como superficie independiente."
                badge="Sala archivada"
                heading="La sala amistad ya no se trabaja como destino separado"
                body="Esta URL quedó como residuo de una arquitectura anterior. Hoy la actividad útil se concentra en la sala principal y por eso esta ruta se mantiene solo como compatibilidad legacy."
              />
            </MainLayout>
          }
        />
        <Route
          path="/chat/quedar-ya"
          element={
            <MainLayout>
              <NoindexRouteNotice
                title="Sala quedar ya archivada | Chactivo"
                description="Ruta legacy no indexable. La antigua sala quedar ya ya no existe como destino independiente."
                badge="Sala archivada"
                heading="La sala quedar ya ya no está activa como superficie propia"
                body="La ruta se conserva para no romper enlaces antiguos, pero ya no se indexa ni se promueve. La conversación activa está consolidada en la sala principal."
              />
            </MainLayout>
          }
        />
        <Route
          path="/chat/quedar-ya/"
          element={
            <MainLayout>
              <NoindexRouteNotice
                title="Sala quedar ya archivada | Chactivo"
                description="Ruta legacy no indexable. La antigua sala quedar ya ya no existe como destino independiente."
                badge="Sala archivada"
                heading="La sala quedar ya ya no está activa como superficie propia"
                body="La ruta se conserva para no romper enlaces antiguos, pero ya no se indexa ni se promueve. La conversación activa está consolidada en la sala principal."
              />
            </MainLayout>
          }
        />

        {/* ⏸️ TEMPORAL: sala gaming oculta */}
        <Route path="/chat/gaming" element={<Navigate to="/chat/principal" replace />} />
        <Route path="/chat/gaming/" element={<Navigate to="/chat/principal" replace />} />
        <Route path="/chat/:roomId" element={<ChatPage />} />
        <Route path="/chat-secondary/:roomId" element={<Navigate to="/chat/principal" replace />} />
        <Route path="/anonymous-chat" element={<AnonymousChatPage />} />
        {/* ⏸️ TEMPORAL: foro oculto */}
        <Route path="/anonymous-forum" element={<Navigate to="/chat/principal" replace />} />
        <Route path="/anonymous-forum/" element={<Navigate to="/chat/principal" replace />} />
        <Route path="/foro-gay" element={<Navigate to="/chat/principal" replace />} />
        <Route path="/foro-gay/" element={<Navigate to="/chat/principal" replace />} />
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
          element={<PremiumAccessRoute />}
        />
        <Route
          path="/premium/"
          element={<PremiumAccessRoute />}
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
