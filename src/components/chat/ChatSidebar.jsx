import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Hash, Gamepad2, Users, Heart, User, LogIn, X, RefreshCw, CalendarClock, MessageSquare, Flame, HeartPulse } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ChatSidebar = ({ currentRoom, setCurrentRoom, isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const rooms = [
    { id: 'conversas-libres', name: 'Conversas Libres', icon: <Hash className="w-4 h-4" /> },
    { id: 'gaming', name: 'Gaming', icon: <Gamepad2 className="w-4 h-4" /> },
    { id: 'mas-30', name: '+30', icon: <Users className="w-4 h-4" /> },
    { id: 'amistad', name: 'Amistad', icon: <Heart className="w-4 h-4" /> },
    { id: 'osos-activos', name: 'Osos Activos', icon: <Users className="w-4 h-4" /> },
    { id: 'pasivos-buscando', name: 'Pasivos Buscando', icon: <Users className="w-4 h-4" /> },
    { id: 'versatiles', name: 'Versátiles', icon: <RefreshCw className="w-4 h-4" /> },
    { id: 'quedar-ya', name: 'Quedar Ya', icon: <CalendarClock className="w-4 h-4" /> },
    { id: 'hablar-primero', name: 'Hablar Primero', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'morbosear', name: 'Morbosear', icon: <Flame className="w-4 h-4" /> },
  ];

  const handleRoomChange = (roomId) => {
    setCurrentRoom(roomId);
    onClose();
  };
  
  const handleLogout = () => {
    logout();
    navigate('/');
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={{ x: '-100%' }}
        animate={{ x: isOpen ? 0 : '-100%' }}
        exit={{ x: '-100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed lg:relative w-72 h-full bg-card border-r flex flex-col z-50 lg:translate-x-0"
      >
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
             <div className="w-10 h-10 flex items-center justify-center">
              <HeartPulse className="w-8 h-8 text-accent"/>
            </div>
            <div>
              <h2 className="font-bold text-foreground">Chactivo</h2>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden text-muted-foreground"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide p-4">
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-3 px-2">Salas</h3>
            <div className="space-y-1">
              {rooms.map((room) => (
                <Button
                  key={room.id}
                  variant={currentRoom === room.id ? 'secondary' : 'ghost'}
                  className={`w-full justify-start text-foreground hover:bg-secondary ${currentRoom === room.id ? 'bg-secondary text-cyan-400' : ''}`}
                  onClick={() => handleRoomChange(room.id)}
                >
                  {room.icon}
                  <span className="ml-2">{room.name}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t">
          {user && !user.isGuest ? (
             <div
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary cursor-pointer transition-colors"
              onClick={() => {
                navigate('/profile');
                onClose();
              }}
            >
              <Avatar className="w-10 h-10 border-2 border-accent">
                <AvatarImage src={user.avatar} alt={user.username} />
                <AvatarFallback className="bg-secondary">
                  {user.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {user.username}
                </p>
                <p className="text-xs text-muted-foreground" onClick={handleLogout}>Cerrar Sesión</p>
              </div>
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
          ) : (
            <Button onClick={() => navigate('/auth')} className="w-full magenta-gradient text-white font-bold py-3">
              <LogIn className="w-4 h-4 mr-2" />
              Iniciar Sesión
            </Button>
          )}
        </div>
      </motion.aside>
    </>
  );
};

export default ChatSidebar;