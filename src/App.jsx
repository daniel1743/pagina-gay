import React from 'react';
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
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import AnonymousChatPage from '@/pages/AnonymousChatPage';
import AnonymousForumPage from '@/pages/AnonymousForumPage';
import ThreadDetailPage from '@/pages/ThreadDetailPage';
import GamingLandingPage from '@/pages/GamingLandingPage';
import Mas30LandingPage from '@/pages/Mas30LandingPage';
import SantiagoLandingPage from '@/pages/SantiagoLandingPage';
import GlobalLandingPage from '@/pages/GlobalLandingPage';
import { ThemeProvider } from '@/contexts/ThemeContext';

// ✅ Componentes que usan useAuth deben estar dentro del AuthProvider
function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user && !user.isGuest ? children : <Navigate to="/auth" />;
}

function LandingRoute({ children, redirectTo }) {
  const { user } = useAuth();
  if (user) {
    return <Navigate to={redirectTo} replace />;
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
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Routes>
        <Route path="/" element={<MainLayout><LobbyPage /></MainLayout>} />
        <Route path="/auth" element={<AuthPage />} />

        {/* ✅ SEO: Landing pages específicas optimizadas para CTR */}
        <Route path="/global" element={<LandingRoute redirectTo="/chat/global"><MainLayout><GlobalLandingPage /></MainLayout></LandingRoute>} />
        <Route path="/gaming" element={<LandingRoute redirectTo="/chat/gaming"><MainLayout><GamingLandingPage /></MainLayout></LandingRoute>} />
        <Route path="/mas-30" element={<LandingRoute redirectTo="/chat/mas-30"><MainLayout><Mas30LandingPage /></MainLayout></LandingRoute>} />
        <Route path="/santiago" element={<LandingRoute redirectTo="/chat/santiago"><MainLayout><SantiagoLandingPage /></MainLayout></LandingRoute>} />

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
          path="/admin/cleanup"
          element={
            <PrivateRoute>
              <AdminCleanup />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;