import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import LobbyPage from '@/pages/LobbyPage';
import AuthPage from '@/pages/AuthPage';
import ChatPage from '@/pages/ChatPage';
import ProfilePage from '@/pages/ProfilePage';
import PremiumPage from '@/pages/PremiumPage';
import AdminPage from '@/pages/AdminPage';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import AnonymousChatPage from '@/pages/AnonymousChatPage';
import AnonymousForumPage from '@/pages/AnonymousForumPage';
import { ThemeProvider } from '@/contexts/ThemeContext';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user && !user.isGuest ? children : <Navigate to="/auth" />;
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

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
              <Route path="/" element={<MainLayout><LobbyPage /></MainLayout>} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/chat/:roomId" element={<ChatPage />} />
              <Route path="/anonymous-chat" element={<AnonymousChatPage />} />
              <Route path="/anonymous-forum" element={<AnonymousForumPage />} />
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
              <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          <Toaster />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;