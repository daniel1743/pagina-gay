import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, LogIn, ChevronDown, Circle, HeartPulse, Sun, Moon, CheckCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/use-toast';

const Header = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const handleStatusChange = (status) => {
    toast({
      title: '🚧 Función en desarrollo',
      description: `Pronto podrás cambiar tu estado a "${status}".`,
    });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b">
      <div className="container mx-auto px-4 flex items-center justify-between h-20">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-10 h-10 flex items-center justify-center">
            <HeartPulse className="w-9 h-9 text-[#E4007C]"/>
          </div>
          <h1 className="text-2xl font-bold text-foreground hidden sm:block">Chactivo</h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-accent" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </Button>

          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-cyan-400" onClick={() => toast({ title: '🚧 Notificaciones en desarrollo', description: '¡Pronto verás tus notificaciones aquí!' })}>
            <Bell className="w-6 h-6" />
          </Button>

          {user && !user.isGuest ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 cursor-pointer">
                  <div className={`rounded-full ${user.isPremium ? 'premium-avatar-ring' : ''}`}>
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.avatar} alt={user.username} />
                      <AvatarFallback className="bg-secondary">{user.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-semibold text-foreground flex items-center gap-1">
                      {user.username}
                      {user.isPremium && <CheckCircle className="w-4 h-4 text-cyan-400"/>}
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
                <DropdownMenuLabel>Estado</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleStatusChange('Conectado')}>
                  <Circle className="w-2 h-2 mr-2 text-green-400 fill-current" /> Conectado
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange('Desconectado')}>
                  <Circle className="w-2 h-2 mr-2 text-gray-500 fill-current" /> Desconectado
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  if (user.isPremium) handleStatusChange('Oculto');
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
    </header>
  );
};

export default Header;