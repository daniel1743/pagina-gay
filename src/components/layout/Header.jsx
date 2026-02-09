import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, LogIn, ChevronDown, Circle, Sun, Moon, CheckCircle, Shield, Heart, MessageSquare, BarChart3, Archive, Sparkles } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import ComingSoonModal from '@/components/ui/ComingSoonModal';
import SystemNotificationsPanel from '@/components/notifications/SystemNotificationsPanel';
import ActivityDashboardModal from '@/components/dashboard/ActivityDashboardModal';
import { AvatarMenu } from '@/components/layout/AvatarMenu'; // ⚡ NUEVO: Menu unificado para todos los usuarios
// ⚠️ MODAL COMENTADO - Usamos entrada directa como invitado (sin opciones)
// import { EntryOptionsModal } from '@/components/auth/EntryOptionsModal';
// ⚠️ MODAL INVITADO ELIMINADO - Solo registro normal
// import { GuestUsernameModal } from '@/components/auth/GuestUsernameModal';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { subscribeToSystemNotifications } from '@/services/systemNotificationsService';
import { motion, AnimatePresence } from 'framer-motion';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState({ name: '', description: '' });
  const [isAdmin, setIsAdmin] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [showBetaPulse, setShowBetaPulse] = useState(true);
  const [logoSrc, setLogoSrc] = useState("/LOGO-TRASPARENTE.png");
  // ⚠️ MODAL COMENTADO - Ya no usamos EntryOptionsModal
  // const [showEntryModal, setShowEntryModal] = useState(false);
  // ⚠️ MODAL INVITADO ELIMINADO - Solo registro normal
  // const [showGuestModal, setShowGuestModal] = useState(false);
  const [showActivityDashboard, setShowActivityDashboard] = useState(false);

  // Desactivar animación del badge Beta después de 5 segundos
  useEffect(() => {
    const timer = setTimeout(() => setShowBetaPulse(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Verificar si el usuario es admin (consulta Firestore si no está en user.role)
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user || user.isGuest || user.isAnonymous) {
        setIsAdmin(false);
        return;
      }

      // Primero verificar si ya está en el objeto user
      if (user.role === 'admin' || user.role === 'administrator' || user.role === 'superAdmin') {
        setIsAdmin(true);
        return;
      }

      // Si no está, consultar Firestore directamente
      try {
        const userDoc = await getDoc(doc(db, 'users', user.id));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const role = userData.role;
          setIsAdmin(role === 'admin' || role === 'administrator' || role === 'superAdmin');
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error checking admin role:', error);
        setIsAdmin(false);
      }
    };

    checkAdminRole();
  }, [user]);

  const handleFeatureComingSoon = (featureName, description = '') => {
    setComingSoonFeature({ name: featureName, description });
    setShowComingSoon(true);
  };

  // ⚠️ MODAL COMENTADO - Ya no usamos EntryOptionsModal, entrada directa
  // const handleContinueWithoutRegister = () => {
  //   setShowEntryModal(false);
  //   setTimeout(() => {
  //     setShowGuestModal(true);
  //   }, 150);
  // };

  // ⚡ NUEVO: Suscribirse a notificaciones para TODOS (invitados + registrados)
  useEffect(() => {
    if (!user) {
      setUnreadNotificationsCount(0);
      return;
    }

    // ⚠️ NO suscribirse si el ID es temporal (esperar a que Firebase responda con ID real)
    if (user.id?.startsWith('temp_')) {
      console.log('[Header] ⏳ Esperando ID real de Firebase antes de suscribirse a notificaciones...');
      setUnreadNotificationsCount(0);
      return;
    }

    console.log('[Header] ✅ Suscribiéndose a notificaciones con ID real:', user.id);

    // ✅ Suscribirse solo cuando tengamos ID real de Firebase
    const unsubscribe = subscribeToSystemNotifications(user.id, (notifications) => {
      const unreadCount = notifications.filter(n => !n.read).length;
      setUnreadNotificationsCount(unreadCount);
    });

    return () => unsubscribe();
  }, [user]);

  const navItems = [
    { id: 'chat', label: 'Chat', icon: MessageSquare, to: '/chat/principal', active: location.pathname.startsWith('/chat') },
    { id: 'baul', label: 'Baúl', icon: Archive, to: '/baul', active: location.pathname.startsWith('/baul') },
    { id: 'opin', label: 'OPIN', icon: Sparkles, to: '/opin', active: location.pathname.startsWith('/opin') },
  ];

  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-b m-0 p-0 shadow-sm" style={{ backdropFilter: 'blur(12px)' }}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 sm:h-20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => {
            // ✅ Usuarios registrados → /home, invitados/guests → /chat/principal
            if (user && !user.isGuest && !user.isAnonymous) {
              navigate('/home');
            } else {
              navigate('/chat/principal');
            }
          }}>
            <div className="w-10 h-10 flex items-center justify-center">
              {logoSrc ? (
                <img 
                  src={logoSrc} 
                  alt="Chactivo Logo" 
                  className="w-10 h-10 object-contain" 
                  onError={() => {
                    // Intentar logo alternativo si el principal falla
                    if (logoSrc === "/LOGO-TRASPARENTE.png") {
                      setLogoSrc("/LOGO_CHACTIVO.png");
                    } else {
                      // Si también falla, mostrar fallback
                      setLogoSrc("");
                    }
                  }}
                />
              ) : (
                <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                  <span className="text-white font-bold text-lg">C</span>
                </div>
              )}
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">Chactivo</h1>
              <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-400 to-orange-500 text-gray-900 rounded-md shadow-sm ${showBetaPulse ? 'animate-pulse' : ''}`}>
                Beta
              </span>
            </div>
          </div>

          {user && (
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.active;
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className={`h-9 px-3 gap-2 ${isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    onClick={() => navigate(item.to)}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Button>
                );
              })}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* ✅ Navbar dinámica - Mostrar para TODOS los usuarios (invitados + registrados) */}
          {user && (
            <>
              {/* Botón de tema - solo para usuarios registrados */}
              {!user.isGuest && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-accent hover:bg-transparent"
                  onClick={toggleTheme}
                  aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
                >
                  {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
                </Button>
              )}

              {/* ⚡ NUEVO: Notificaciones para TODOS (invitados + registrados) */}
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-cyan-400 hover:bg-transparent relative"
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label="Ver notificaciones"
              >
                <Bell className="w-6 h-6" />
                {unreadNotificationsCount > 0 && (
                  <AnimatePresence>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1 bg-[#E4007C] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                    >
                      {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                    </motion.div>
                  </AnimatePresence>
                )}
              </Button>
            </>
          )}

          {/* ⚡ NUEVO: AvatarMenu unificado para TODOS los usuarios (guest + registered) */}
          {user ? (
            <AvatarMenu />
          ) : (
            /* ✅ FASE URGENTE: CTAs para visitantes - Navbar que VENDE */
            <>
              {/* CTA principal: Entrar gratis */}
              <Button
                onClick={() => {
                  // Si el usuario está logueado, ir directo al chat
                  if (user && !user.isGuest && !user.isAnonymous) {
                    navigate('/chat/principal');
                  } else if (user && (user.isGuest || user.isAnonymous)) {
                    // Usuario ya anónimo/guest - ir directo al chat
                    navigate('/chat/principal');
                  } else {
                    // No hay usuario - redirigir a registro normal
                    navigate('/auth', { state: { redirectTo: '/chat/principal' } });
                  }
                }}
                className="magenta-gradient text-white font-bold px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg shadow-lg hover:shadow-[#E4007C]/50 transition-all hover:scale-105"
              >
                🚀 <span className="ml-1.5">ENTRAR GRATIS</span>
              </Button>
            </>
          )}
        </div>
      </div>

      <ComingSoonModal
        isOpen={showComingSoon}
        onClose={() => setShowComingSoon(false)}
        feature={comingSoonFeature.name}
        description={comingSoonFeature.description}
      />

      {/* Panel de Notificaciones */}
      <SystemNotificationsPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        onNotificationCountChange={setUnreadNotificationsCount}
      />

      {/* Dashboard de Actividad */}
      {user && !user.isGuest && (
        <ActivityDashboardModal
          isOpen={showActivityDashboard}
          onClose={() => setShowActivityDashboard(false)}
          userId={user.id}
        />
      )}

      {/* ⚠️ MODAL COMENTADO - EntryOptionsModal eliminado, entrada directa como invitado */}
      {/* <EntryOptionsModal
        open={showEntryModal}
        onClose={() => setShowEntryModal(false)}
        chatRoomId="principal"
        onContinueWithoutRegister={handleContinueWithoutRegister}
      /> */}

      {/* ⚠️ MODAL INVITADO ELIMINADO - Solo registro normal en /auth */}
    </header>
  );
};

export default Header;
