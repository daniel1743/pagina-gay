import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Hash, Gamepad2, Users, Heart, User, LogIn, X, UserCheck, GitFork, UserMinus, Cake, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { subscribeToMultipleRoomCounts } from '@/services/presenceService';
import { roomsData, colorClasses } from '@/config/rooms';

/**
 * ✅ SISTEMA INTELIGENTE DE CONTADOR DE USUARIOS
 * Calcula el número de usuarios a mostrar con boost estratégico para hacer que las salas parezcan activas
 * 
 * Estrategias:
 * 1. Si hay 0-2 usuarios reales → Agregar 25-50 usuarios ficticios (consistente por sala)
 * 2. Si hay 3-10 usuarios reales → Agregar 15-30 usuarios ficticios
 * 3. Si hay 11+ usuarios reales → Solo mostrar reales (ya parece activa)
 * 4. Usa hash del roomId para consistencia (mismo número siempre)
 */
const calculateDisplayUserCount = (realUserCount, roomId) => {
  // Si ya hay muchos usuarios reales, no agregar ficticios
  if (realUserCount >= 11) {
    return realUserCount;
  }

  // Generar hash consistente basado en el ID de la sala
  const hashCode = roomId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  // Calcular boost según cantidad de usuarios reales
  let fictitiousUsers;
  if (realUserCount === 0) {
    // 0 usuarios → Agregar 30-60 ficticios
    fictitiousUsers = 30 + Math.abs(hashCode % 31);
  } else if (realUserCount <= 2) {
    // 1-2 usuarios → Agregar 25-45 ficticios
    fictitiousUsers = 25 + Math.abs(hashCode % 21);
  } else if (realUserCount <= 5) {
    // 3-5 usuarios → Agregar 15-30 ficticios
    fictitiousUsers = 15 + Math.abs(hashCode % 16);
  } else {
    // 6-10 usuarios → Agregar 10-20 ficticios
    fictitiousUsers = 10 + Math.abs(hashCode % 11);
  }

  return realUserCount + fictitiousUsers;
};

const ChatSidebar = ({ currentRoom, setCurrentRoom, isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [roomCounts, setRoomCounts] = useState({});

  // Suscribirse a contadores en tiempo real (todos los usuarios pueden ver)
  useEffect(() => {
    if (!user) {
      setRoomCounts({});
      return;
    }

    const roomIds = roomsData.map(room => room.id);
    const unsubscribe = subscribeToMultipleRoomCounts(roomIds, (counts) => {
      setRoomCounts(counts);
    });
    return () => unsubscribe();
  }, [user]);

  const handleRoomChange = (roomId) => {
    setCurrentRoom(roomId);
    // ✅ Cerrar sidebar automáticamente en móvil al cambiar de sala
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      onClose();
    }
  };
  
  const handleLogout = () => {
    logout();
    navigate('/');
  }

  return (
    <>
      {/* Overlay/Backdrop para móvil - Solo visible cuando sidebar está abierto */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
            onTouchStart={onClose}
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
              <img src="/LOGO-TRASPARENTE.png" alt="Chactivo Logo" className="w-10 h-10 object-contain" />
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
                
                // ✅ SISTEMA INTELIGENTE: Calcular usuarios mostrados con boost estratégico
                const userCount = calculateDisplayUserCount(realUserCount, room.id);
                
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
                            {/* ✅ Siempre mostrar contador (incluso si es 0, mostrará boost) */}
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className={`text-sm font-extrabold px-2.5 py-1 rounded-full min-w-[2.5rem] text-center shadow-md ${
                                isActive
                                  ? 'bg-primary/30 text-white ' + colorClasses[room.color]
                                  : 'bg-primary/40 text-white font-bold'
                              }`}
                            >
                              {userCount}
                            </motion.span>
                          </div>
                          {/* ✅ Siempre mostrar indicador "Activo" si hay usuarios (reales o boost) */}
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
                              <span className="text-[10px] text-green-500">
                                {realUserCount > 0 ? 'Activo' : 'Reciente'}
                              </span>
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
                className={`${
                  user.role === 'admin'
                    ? 'admin-avatar-ring'
                    : user.verified
                      ? 'verified-avatar-ring'
                      : user.isPremium
                        ? 'premium-avatar-ring'
                        : ''
                }`}
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
                <p className="text-sm font-semibold text-foreground truncate flex items-center gap-1">
                  {user.username}
                  {(user.isPremium || user.role === 'admin') && (
                    <CheckCircle className="w-3 h-3 text-[#FFD700] flex-shrink-0" />
                  )}
                  {user.verified && !user.isPremium && user.role !== 'admin' && (
                    <CheckCircle className="w-3 h-3 text-[#1DA1F2] flex-shrink-0" />
                  )}
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

      {/* Mobile: sidebar deslizable - Oculto por defecto, se muestra solo cuando isOpen=true */}
      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="lg:hidden fixed left-0 top-0 w-72 h-full bg-card border-r border-border flex flex-col z-50 shadow-2xl"
        style={{ willChange: 'transform' }}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <motion.div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
             <div className="w-10 h-10 flex items-center justify-center">
              <img src="/LOGO-TRASPARENTE.png" alt="Chactivo Logo" className="w-10 h-10 object-contain" />
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
                                className={`text-sm font-extrabold px-2.5 py-1 rounded-full min-w-[2.5rem] text-center shadow-md ${
                                  isActive
                                    ? 'bg-primary/30 text-white ' + colorClasses[room.color]
                                    : 'bg-primary/40 text-white font-bold'
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
                className={`${
                  user.role === 'admin'
                    ? 'admin-avatar-ring'
                    : user.verified
                      ? 'verified-avatar-ring'
                      : user.isPremium
                        ? 'premium-avatar-ring'
                        : ''
                }`}
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
                <p className="text-sm font-semibold text-foreground truncate flex items-center gap-1">
                  {user.username}
                  {(user.isPremium || user.role === 'admin') && (
                    <CheckCircle className="w-3 h-3 text-[#FFD700] flex-shrink-0" />
                  )}
                  {user.verified && !user.isPremium && user.role !== 'admin' && (
                    <CheckCircle className="w-3 h-3 text-[#1DA1F2] flex-shrink-0" />
                  )}
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