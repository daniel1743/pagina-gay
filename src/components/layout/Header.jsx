import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, LogIn, ChevronDown, Circle, HeartPulse, Sun, Moon, CheckCircle, Shield } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import ComingSoonModal from '@/components/ui/ComingSoonModal';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

const Header = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState({ name: '', description: '' });
  const [isAdmin, setIsAdmin] = useState(false);

  // Verificar si el usuario es admin (consulta Firestore si no está en user.role)
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user || user.isGuest || user.isAnonymous) {
        setIsAdmin(false);
        return;
      }

      // Primero verificar si ya está en el objeto user
      if (user.role === 'admin' || user.role === 'administrator') {
        setIsAdmin(true);
        return;
      }

      // Si no está, consultar Firestore directamente
      try {
        const userDoc = await getDoc(doc(db, 'users', user.id));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const role = userData.role;
          setIsAdmin(role === 'admin' || role === 'administrator');
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

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b">
      <div className="container mx-auto px-4 flex items-center justify-between h-20">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-10 h-10 flex items-center justify-center">
            <HeartPulse className="w-9 h-9 text-[#E4007C]"/>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Chactivo</h1>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-400 to-orange-500 text-gray-900 rounded-md shadow-sm animate-pulse">
              Beta
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-accent"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
          >
            {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-cyan-400 relative"
            onClick={() => handleFeatureComingSoon('el sistema de notificaciones', 'Podrás recibir alertas de mensajes privados, menciones y eventos de la comunidad en tiempo real.')}
            aria-label="Ver notificaciones (próximamente)"
          >
            <Bell className="w-6 h-6" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#E4007C] rounded-full animate-pulse"></span>
          </Button>

          {user && !user.isGuest ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 cursor-pointer">
                  <div className={`rounded-full ${
                    (user.role === 'admin' || user.role === 'administrator')
                      ? 'admin-avatar-ring'
                      : user.verified
                        ? 'verified-avatar-ring'
                        : user.isPremium
                          ? 'premium-avatar-ring'
                          : ''
                  }`}>
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.avatar} alt={user.username} />
                      <AvatarFallback className="bg-secondary">{user.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-semibold text-foreground flex items-center gap-1">
                      {user.username}
                      {(user.isPremium || user.role === 'admin' || user.role === 'administrator') && (
                        <CheckCircle className="w-4 h-4 text-[#FFD700]"/>
                      )}
                      {user.verified && !user.isPremium && user.role !== 'admin' && user.role !== 'administrator' && (
                        <CheckCircle className="w-4 h-4 text-[#1DA1F2]"/>
                      )}
                    </span>
                    <span className="text-xs text-green-400 flex items-center gap-1">
                      <Circle className="w-2 h-2 fill-current" /> Conectado
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground hidden md:block" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border text-foreground">
                <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigate('/profile')}>Perfil</DropdownMenuItem>
                <DropdownMenuSeparator />

                {/* Panel Admin - Solo visible para administradores */}
                {isAdmin && (
                  <>
                    <DropdownMenuItem onClick={() => navigate('/admin')} className="text-purple-400 hover:text-purple-300">
                      <Shield className="w-4 h-4 mr-2" />
                      Panel Admin
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}

                <DropdownMenuLabel>Estado</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleFeatureComingSoon('cambiar tu estado', 'Próximamente podrás mostrar si estás Conectado, Desconectado u Oculto.')}>
                  <Circle className="w-2 h-2 mr-2 text-green-400 fill-current" /> Conectado
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFeatureComingSoon('cambiar tu estado', 'Próximamente podrás mostrar si estás Conectado, Desconectado u Oculto.')}>
                  <Circle className="w-2 h-2 mr-2 text-gray-500 fill-current" /> Desconectado
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  if (user.isPremium) handleFeatureComingSoon('modo oculto', 'Función exclusiva Premium que te permite navegar sin ser visto.');
                  else navigate('/premium');
                }}>
                  <Circle className="w-2 h-2 mr-2 text-purple-400 fill-current" /> Oculto {user.isPremium ? '' : '👑'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-400 focus:text-red-400">Cerrar Sesión</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => navigate('/auth')} className="magenta-gradient text-white font-bold py-2 px-4 rounded-lg">
              <LogIn className="w-4 h-4 mr-2" />
              Iniciar Sesión
            </Button>
          )}
        </div>
      </div>

      <ComingSoonModal
        isOpen={showComingSoon}
        onClose={() => setShowComingSoon(false)}
        feature={comingSoonFeature.name}
        description={comingSoonFeature.description}
      />
    </header>
  );
};

export default Header;