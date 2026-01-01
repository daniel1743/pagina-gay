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
  console.log('🔥 [LANDING ROUTE] ========== ENTRADA ==========');

  const { user } = useAuth();

  console.log('🔥 [LANDING ROUTE] User obtenido:', {
    user: user ? 'EXISTS' : 'NULL',
    isGuest: user?.isGuest,
    isAnonymous: user?.isAnonymous,
    userId: user?.id,
    hasChildren: !!children
  });

  console.log('🏠 [LANDING ROUTE] Evaluando acceso:', {
    hasUser: !!user,
    isGuest: user?.isGuest,
    isAnonymous: user?.isAnonymous,
    willRedirect: user && !user.isGuest && !user.isAnonymous
  });

  // ✅ Solo mostrar landing si NO está logueado (incluyendo guests)
  if (user && !user.isGuest && !user.isAnonymous) {
    console.log('🔀 [LANDING ROUTE] Redirigiendo a:', redirectTo);
    return <Navigate to={redirectTo} replace />;
  }

  console.log('✅ [LANDING ROUTE] Mostrando landing page - Renderizando children');
  console.log('🔥 [LANDING ROUTE] Children type:', typeof children, children);
  return children;
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
  console.log('🔥 [MAIN LAYOUT] ========== ENTRADA ==========');

  const { user } = useAuth();

  console.log('🔥 [MAIN LAYOUT] User:', user ? 'EXISTS' : 'NULL');
  console.log('🔥 [MAIN LAYOUT] Children:', !!children, typeof children);

  console.log('🎨 [MAIN LAYOUT] Renderizando layout con children:', !!children);

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
  console.log('🛣️ [APP ROUTES] Renderizando rutas...');
  console.log('📍 [APP ROUTES] URL actual:', window.location.pathname);

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
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

        {/* ✅ SEO: Landing pages específicas optimizadas para CTR - Solo no logueados */}
        <Route path="/global" element={<LandingRoute redirectTo="/home"><MainLayout><GlobalLandingPage /></MainLayout></LandingRoute>} />
        <Route path="/gaming" element={<LandingRoute redirectTo="/home"><MainLayout><GamingLandingPage /></MainLayout></LandingRoute>} />
        <Route path="/mas-30" element={<LandingRoute redirectTo="/home"><MainLayout><Mas30LandingPage /></MainLayout></LandingRoute>} />
        <Route path="/santiago" element={<LandingRoute redirectTo="/home"><MainLayout><SantiagoLandingPage /></MainLayout></LandingRoute>} />
        
        {/* 🌍 Landing pages por país - Rutas internacionales */}
        <Route path="/es" element={<LandingRoute redirectTo="/home"><MainLayout><SpainLandingPage /></MainLayout></LandingRoute>} />
        <Route path="/es/" element={<Navigate to="/es" replace />} />
        <Route path="/br" element={<LandingRoute redirectTo="/home"><MainLayout><BrazilLandingPage /></MainLayout></LandingRoute>} />
        <Route path="/br/" element={<Navigate to="/br" replace />} />
        <Route path="/mx" element={<LandingRoute redirectTo="/home"><MainLayout><MexicoLandingPage /></MainLayout></LandingRoute>} />
        <Route path="/mx/" element={<Navigate to="/mx" replace />} />
        <Route path="/ar" element={<LandingRoute redirectTo="/home"><MainLayout><ArgentinaLandingPage /></MainLayout></LandingRoute>} />
        <Route path="/ar/" element={<Navigate to="/ar" replace />} />

        {/* ✅ REDIRECCIÓN: conversas-libres → global (sala limpia sin spam) */}
        <Route
          path="/chat/conversas-libres"
          element={<Navigate to="/chat/global" replace />}
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
          {splashCompleted && <AppRoutes />}
          {/* <DebugOverlay /> */} {/* Desactivado - Debug Console removido */}
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
