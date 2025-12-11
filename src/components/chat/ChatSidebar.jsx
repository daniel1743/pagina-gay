import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Hash, Gamepad2, Users, Heart, User, LogIn, X, UserCheck, GitFork, UserMinus, Cake, HeartPulse } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { subscribeToMultipleRoomCounts } from '@/services/presenceService';
import { roomsData, colorClasses } from '@/config/rooms';

const ChatSidebar = ({ currentRoom, setCurrentRoom, isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [roomCounts, setRoomCounts] = useState({});

  // Suscribirse a contadores en tiempo real
  useEffect(() => {
    const roomIds = roomsData.map(room => room.id);
    const unsubscribe = subscribeToMultipleRoomCounts(roomIds, (counts) => {
      setRoomCounts(counts);
    });
    return () => unsubscribe();
  }, []);

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

      {/* Desktop: sidebar siempre visible */}
      <aside className="hidden lg:flex lg:static w-72 h-full bg-card border-r border-border flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <motion.div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
             <div className="w-10 h-10 flex items-center justify-center">
              <HeartPulse className="w-8 h-8 text-accent"/>
            </div>
            <div>
              <h2 className="font-bold text-foreground">Chactivo</h2>
            </div>
          </motion.div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide p-3">
          <div className="mb-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2 px-2">Salas de Chat</h3>
            <div className="space-y-1">
              {roomsData.map((room, index) => {
                const IconComponent = room.icon;
                const realUserCount = roomCounts[room.id] || 0;
                
                // Usar solo el número real de usuarios conectados
                const userCount = realUserCount;
                
                const isActive = currentRoom === room.id;

                return (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                  >
                    <Button
                      variant="ghost"
                      className={`w-full justify-start text-left h-auto py-2.5 px-3 group transition-all duration-200 ${
                        isActive
                          ? 'bg-primary/10 border-l-2 border-primary text-primary hover:bg-primary/15'
                          : 'hover:bg-accent/50 hover:border-l-2 hover:border-accent'
                      }`}
                      onClick={() => setCurrentRoom(room.id)}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ type: 'spring', stiffness: 400 }}
                        >
                          <IconComponent className={`w-5 h-5 flex-shrink-0 ${isActive ? colorClasses[room.color] : 'text-muted-foreground group-hover:' + colorClasses[room.color]}`} />
                        </motion.div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-sm font-medium truncate ${isActive ? 'text-foreground' : 'text-foreground group-hover:text-foreground'}`}>
                              {room.name}
                            </span>
                            {userCount > 0 && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                                  isActive
                                    ? 'bg-primary/20 ' + colorClasses[room.color]
                                    : 'bg-accent text-muted-foreground'
                                }`}
                              >
                                {userCount}
                              </motion.span>
                            )}
                          </div>
                          {userCount > 0 && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <motion.div
                                className="w-1.5 h-1.5 rounded-full bg-green-500"
                                animate={{
                                  scale: [1, 1.3, 1],
                                  opacity: [1, 0.7, 1]
                                }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "easeInOut"
                                }}
                              />
                              <span className="text-[10px] text-green-500">Activo</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border">
          {user && !user.isGuest ? (
            <motion.div
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors group"
              onClick={() => navigate('/profile')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                className={`${user.isPremium ? 'premium-avatar-ring' : ''}`}
                whileHover={{ rotate: [0, -5, 5, -5, 0] }}
                transition={{ duration: 0.5 }}
              >
                <Avatar className="w-10 h-10 border-2 border-accent">
                  <AvatarImage src={user.avatar} alt={user.username} />
                  <AvatarFallback className="bg-secondary">
                    {user.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {user.username}
                </p>
                <motion.p
                  className="text-xs text-muted-foreground hover:text-red-400 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLogout();
                  }}
                  whileHover={{ x: 2 }}
                >
                  Cerrar Sesión
                </motion.p>
              </div>
              <motion.div
                whileHover={{ x: 3 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <User className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
              </motion.div>
            </motion.div>
          ) : (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button onClick={() => navigate('/auth')} className="w-full magenta-gradient text-white font-bold py-3">
                <LogIn className="w-4 h-4 mr-2" />
                Iniciar Sesión
              </Button>
            </motion.div>
          )}
        </div>
      </aside>

      {/* Mobile: sidebar deslizable */}
      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="lg:hidden fixed w-72 h-full bg-card border-r border-border flex flex-col z-50"
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <motion.div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
             <div className="w-10 h-10 flex items-center justify-center">
              <HeartPulse className="w-8 h-8 text-accent"/>
            </div>
            <div>
              <h2 className="font-bold text-foreground">Chactivo</h2>
            </div>
          </motion.div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide p-3">
          <div className="mb-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2 px-2">Salas de Chat</h3>
            <div className="space-y-1">
              {roomsData.map((room, index) => {
                const IconComponent = room.icon;
                const realUserCount = roomCounts[room.id] || 0;
                
                // Usar solo el número real de usuarios conectados
                const userCount = realUserCount;
                
                const isActive = currentRoom === room.id;

                return (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.03 }}
                  >
                    <Button
                      variant="ghost"
                      className={`w-full justify-start text-left h-auto py-2.5 px-3 group transition-all duration-200 ${
                        isActive
                          ? 'bg-primary/10 border-l-2 border-primary text-primary hover:bg-primary/15'
                          : 'hover:bg-accent/50 hover:border-l-2 hover:border-accent'
                      }`}
                      onClick={() => handleRoomChange(room.id)}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ type: 'spring', stiffness: 400 }}
                        >
                          <IconComponent className={`w-5 h-5 flex-shrink-0 ${isActive ? colorClasses[room.color] : 'text-muted-foreground group-hover:' + colorClasses[room.color]}`} />
                        </motion.div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-sm font-medium truncate ${isActive ? 'text-foreground' : 'text-foreground group-hover:text-foreground'}`}>
                              {room.name}
                            </span>
                            {userCount > 0 && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                                  isActive
                                    ? 'bg-primary/20 ' + colorClasses[room.color]
                                    : 'bg-accent text-muted-foreground'
                                }`}
                              >
                                {userCount}
                              </motion.span>
                            )}
                          </div>
                          {userCount > 0 && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <motion.div
                                className="w-1.5 h-1.5 rounded-full bg-green-500"
                                animate={{
                                  scale: [1, 1.3, 1],
                                  opacity: [1, 0.7, 1]
                                }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "easeInOut"
                                }}
                              />
                              <span className="text-[10px] text-green-500">Activo</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border">
          {user && !user.isGuest ? (
            <motion.div
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors group"
              onClick={() => {
                navigate('/profile');
                onClose();
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                className={`${user.isPremium ? 'premium-avatar-ring' : ''}`}
                whileHover={{ rotate: [0, -5, 5, -5, 0] }}
                transition={{ duration: 0.5 }}
              >
                <Avatar className="w-10 h-10 border-2 border-accent">
                  <AvatarImage src={user.avatar} alt={user.username} />
                  <AvatarFallback className="bg-secondary">
                    {user.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {user.username}
                </p>
                <motion.p
                  className="text-xs text-muted-foreground hover:text-red-400 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLogout();
                  }}
                  whileHover={{ x: 2 }}
                >
                  Cerrar Sesión
                </motion.p>
              </div>
              <motion.div
                whileHover={{ x: 3 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <User className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
              </motion.div>
            </motion.div>
          ) : (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button onClick={() => navigate('/auth')} className="w-full magenta-gradient text-white font-bold py-3">
                <LogIn className="w-4 h-4 mr-2" />
                Iniciar Sesión
              </Button>
            </motion.div>
          )}
        </div>
      </motion.aside>
    </>
  );
};

export default ChatSidebar;