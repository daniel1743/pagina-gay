import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import LobbyPage from '@/pages/LobbyPage';
import AuthPage from '@/pages/AuthPage';
import ChatPage from '@/pages/ChatPage';
import ProfilePage from '@/pages/ProfilePage';
import PremiumPage from '@/pages/PremiumPage';
import AdminPage from '@/pages/AdminPage';
import AdminTicketsPage from '@/pages/AdminTicketsPage';
import TicketDetailPage from '@/pages/TicketDetailPage';
import AdminCleanup from '@/pages/AdminCleanup';
import SeedConversaciones from '@/pages/SeedConversaciones';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import LandingLayout from '@/components/layout/LandingLayout';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import AnonymousChatPage from '@/pages/AnonymousChatPage';
import AnonymousForumPage from '@/pages/AnonymousForumPage';
import ThreadDetailPage from '@/pages/ThreadDetailPage';
import GamingLandingPage from '@/pages/GamingLandingPage';
import Mas30LandingPage from '@/pages/Mas30LandingPage';
import SantiagoLandingPage from '@/pages/SantiagoLandingPage';
import GlobalLandingPage from '@/pages/GlobalLandingPage';
import SpainLandingPage from '@/pages/SpainLandingPage';
import BrazilLandingPage from '@/pages/BrazilLandingPage';
import MexicoLandingPage from '@/pages/MexicoLandingPage';
import ArgentinaLandingPage from '@/pages/ArgentinaLandingPage';
import TestLandingPage from '@/pages/TestLandingPage';
import TestModalPage from '@/pages/TestModalPage';
import FAQPage from '@/pages/FAQPage';
import { ThemeProvider } from '@/contexts/ThemeContext';
import PWASplashScreen from '@/components/pwa/PWASplashScreen';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
// import DebugOverlay from '@/components/DebugOverlay'; // Desactivado - Debug Console removido

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
    return <Navigate to="/landing" replace />;
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
      <main className="flex-1 pt-16 sm:pt-20">{children}</main>
      <Footer />
    </div>
  );
}

// ✅ Componente de rutas que está dentro del AuthProvider
function AppRoutes() {
  // 🔍 Debug: Log de la ruta actual
  React.useEffect(() => {
    console.log('🛣️ [APP ROUTES] Ruta actual:', window.location.pathname);
  }, []);

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        {/* 🧪 PÁGINA DE PRUEBA - SIN wrappers (funciona correctamente) */}
        <Route path="/test" element={<TestLandingPage />} />
        {/* 🧪 MODAL DE PRUEBA - Solo modal de nickname */}
        <Route path="/test-modal" element={<TestModalPage />} />
        
        {/* 🌍 LANDING PAGES INTERNACIONALES - RUTAS FUNCIONALES (Modal simple con SEO completo) */}
        {/* ✅ Estas rutas funcionan correctamente y están listas para producción */}
        <Route path="/modal-arg" element={<ArgentinaLandingPage />} />
        <Route path="/modal-br" element={<BrazilLandingPage />} />
        <Route path="/modal-mx" element={<MexicoLandingPage />} />
        <Route path="/modal-es" element={<SpainLandingPage />} />

        {/* 🔄 REDIRECCIONES: Rutas antiguas redirigen a las nuevas funcionales */}
        {/* Esto mantiene compatibilidad con URLs antiguas y SEO existente */}
        <Route path="/argentina" element={<Navigate to="/modal-arg" replace />} />
        <Route path="/ar" element={<Navigate to="/modal-arg" replace />} />
        <Route path="/brasil" element={<Navigate to="/modal-br" replace />} />
        <Route path="/br" element={<Navigate to="/modal-br" replace />} />
        <Route path="/mexico" element={<Navigate to="/modal-mx" replace />} />
        <Route path="/mx" element={<Navigate to="/modal-mx" replace />} />
        <Route path="/españa" element={<Navigate to="/modal-es" replace />} />
        <Route path="/es" element={<Navigate to="/modal-es" replace />} />
        <Route path="/es-test" element={<Navigate to="/modal-es" replace />} />
        
        {/* Redirecciones con trailing slash - Redirigen a las nuevas rutas funcionales */}
        <Route path="/es/" element={<Navigate to="/modal-es" replace />} />
        <Route path="/mx/" element={<Navigate to="/modal-mx" replace />} />
        <Route path="/ar/" element={<Navigate to="/modal-arg" replace />} />
        <Route path="/br/" element={<Navigate to="/modal-br" replace />} />
        <Route path="/argentina/" element={<Navigate to="/modal-arg" replace />} />
        <Route path="/brasil/" element={<Navigate to="/modal-br" replace />} />
        <Route path="/mexico/" element={<Navigate to="/modal-mx" replace />} />
        <Route path="/españa/" element={<Navigate to="/modal-es" replace />} />

        {/* ⚠️ RUTAS ANTIGUAS COMENTADAS - NO ESTÁN EN USO HASTA QUE SE REPAREN */}
        {/* 
        ❌ NO FUNCIONAL - Comentado hasta reparar
        Estas rutas causaban problemas de renderizado (pantalla blanca).
        Se mantienen comentadas para referencia futura.
        Las rutas antiguas ahora redirigen automáticamente a las nuevas funcionales.
        
        <Route path="/es" element={<SpainLandingPage />} />
        <Route path="/mx" element={<MexicoLandingPage />} />
        <Route path="/ar" element={<ArgentinaLandingPage />} />
        <Route path="/br" element={<BrazilLandingPage />} />
        <Route path="/argentina" element={<ArgentinaLandingPage />} />
        <Route path="/brasil" element={<BrazilLandingPage />} />
        <Route path="/es-test" element={<SpainLandingPage />} />
        */}

        {/* ✅ ARQUITECTURA: Landing solo para usuarios no logueados */}
        <Route path="/landing" element={<LandingRoute redirectTo="/home"><MainLayout><GlobalLandingPage /></MainLayout></LandingRoute>} />
        {/* ✅ REDIRECCIÓN: / → /landing para mantener compatibilidad */}
        <Route path="/" element={<Navigate to="/landing" replace />} />
        
        {/* ✅ ARQUITECTURA: Home solo para usuarios logueados */}
        <Route path="/home" element={<HomeRoute><MainLayout><LobbyPage /></MainLayout></HomeRoute>} />
        <Route path="/inicio" element={<HomeRoute><MainLayout><LobbyPage /></MainLayout></HomeRoute>} />
        {/* ✅ MANTENER: /lobby como alias de /home para compatibilidad */}
        <Route path="/lobby" element={<HomeRoute><MainLayout><LobbyPage /></MainLayout></HomeRoute>} />
        
        <Route path="/auth" element={<AuthPage />} />
        
        {/* FAQ Page - Public access */}
        <Route path="/faq" element={<MainLayout><FAQPage /></MainLayout>} />
        <Route path="/preguntas-frecuentes" element={<MainLayout><FAQPage /></MainLayout>} />

        {/* ✅ SEO: Landing pages específicas optimizadas para CTR - Solo no logueados */}
        <Route path="/global" element={<LandingRoute redirectTo="/home"><MainLayout><GlobalLandingPage /></MainLayout></LandingRoute>} />
        <Route path="/gaming" element={<LandingRoute redirectTo="/home"><MainLayout><GamingLandingPage /></MainLayout></LandingRoute>} />
        <Route path="/mas-30" element={<LandingRoute redirectTo="/home"><MainLayout><Mas30LandingPage /></MainLayout></LandingRoute>} />
        <Route path="/santiago" element={<LandingRoute redirectTo="/home"><MainLayout><SantiagoLandingPage /></MainLayout></LandingRoute>} />

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
        <Route path="/anonymous-chat" element={<AnonymousChatPage />} />
        <Route path="/anonymous-forum" element={<AnonymousForumPage />} />
        <Route path="/thread/:threadId" element={<MainLayout><ThreadDetailPage /></MainLayout>} />
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
        <Route path="*" element={<Navigate to="/landing" />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(false);
  const [splashCompleted, setSplashCompleted] = useState(false);

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
          {showSplash && !splashCompleted && (
            <PWASplashScreen onComplete={handleSplashComplete} />
          )}
          {(!showSplash || splashCompleted) && <AppRoutes />}
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
