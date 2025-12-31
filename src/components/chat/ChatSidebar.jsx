import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Hash, Gamepad2, Users, Heart, User, LogIn, X, UserCheck, GitFork, UserMinus, Cake, CheckCircle, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { subscribeToMultipleRoomCounts } from '@/services/presenceService';
import { roomsData, colorClasses } from '@/config/rooms';

/**
 * ✅ SISTEMA DE ESTADOS DE ACTIVIDAD
 * Determina el estado de actividad de una sala basado en usuarios reales
 * 
 * Estados:
 * - 0 usuarios: Sin indicador
 * - 1-5 usuarios: "ACTIVA" con punto verde
 * - 6-15 usuarios: "MUY ACTIVA" con punto naranja y pulsación suave
 * - 16+ usuarios: "MUY ACTIVA" con punto naranja y pulsación intensa (a reventar)
 */
const getRoomActivityStatus = (realUserCount) => {
  if (realUserCount === 0) {
    return { status: null, color: null, pulseIntensity: 0 };
  } else if (realUserCount >= 1 && realUserCount <= 5) {
    return { status: 'ACTIVA', color: 'green', pulseIntensity: 1 };
  } else if (realUserCount >= 6 && realUserCount <= 15) {
    return { status: 'MUY ACTIVA', color: 'orange', pulseIntensity: 2 };
  } else {
    return { status: 'MUY ACTIVA', color: 'orange', pulseIntensity: 3 };
  }
};

const ChatSidebar = ({ currentRoom, setCurrentRoom, isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [roomCounts, setRoomCounts] = useState({});
  const [logoSrc, setLogoSrc] = useState("/LOGO-TRASPARENTE.png");

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
                
                // ✅ Obtener estado de actividad
                const activityStatus = getRoomActivityStatus(realUserCount);
                
                // 🔒 Verificar si la sala requiere autenticación
                const restrictedRooms = ['mas-30', 'santiago', 'gaming'];
                const isRestrictedRoom = restrictedRooms.includes(room.id);
                const isGuestOrAnonymous = user && (user.isGuest || user.isAnonymous);
                const requiresAuth = isRestrictedRoom && isGuestOrAnonymous;
                
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
                          : requiresAuth
                          ? 'opacity-60 hover:opacity-80 hover:bg-accent/30'
                          : 'hover:bg-accent/50 hover:border-l-2 hover:border-accent'
                      }`}
                      onClick={() => {
                        if (requiresAuth) {
                          // Mostrar toast y redirigir a auth
                          navigate('/auth?redirect=/chat/' + room.id);
                        } else {
                          setCurrentRoom(room.id);
                        }
                      }}
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
                            {requiresAuth && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="flex items-center gap-1"
                              >
                                <Lock className="w-3 h-3 text-muted-foreground" />
                              </motion.div>
                            )}
                          </div>
                          {/* ✅ Mostrar indicador de actividad si hay usuarios */}
                          {activityStatus.status && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <motion.div
                                className={`w-2 h-2 rounded-full ${
                                  activityStatus.color === 'green' 
                                    ? 'bg-green-500' 
                                    : 'bg-orange-500'
                                }`}
                                animate={
                                  activityStatus.pulseIntensity >= 2
                                    ? {
                                        scale: activityStatus.pulseIntensity === 3 
                                          ? [1, 1.8, 1, 1.8, 1]
                                          : [1, 1.5, 1],
                                        opacity: activityStatus.pulseIntensity === 3
                                          ? [1, 0.4, 1, 0.4, 1]
                                          : [1, 0.6, 1],
                                        boxShadow: activityStatus.pulseIntensity === 3
                                          ? [
                                              '0 0 0 0 rgba(249, 115, 22, 0.7)',
                                              '0 0 0 8px rgba(249, 115, 22, 0)',
                                              '0 0 0 0 rgba(249, 115, 22, 0.7)',
                                              '0 0 0 8px rgba(249, 115, 22, 0)',
                                              '0 0 0 0 rgba(249, 115, 22, 0.7)'
                                            ]
                                          : [
                                              '0 0 0 0 rgba(249, 115, 22, 0.7)',
                                              '0 0 0 6px rgba(249, 115, 22, 0)',
                                              '0 0 0 0 rgba(249, 115, 22, 0.7)'
                                            ]
                                      }
                                    : {
                                        scale: [1, 1.2, 1],
                                        opacity: [1, 0.8, 1]
                                      }
                                }
                                transition={{
                                  duration: activityStatus.pulseIntensity === 3 ? 1.2 : activityStatus.pulseIntensity === 2 ? 1.5 : 2,
                                  repeat: Infinity,
                                  ease: "easeInOut"
                                }}
                              />
                              <span className={`text-[10px] font-semibold ${
                                activityStatus.color === 'green' 
                                  ? 'text-green-500' 
                                  : 'text-orange-500'
                              }`}>
                                {activityStatus.status}
                              </span>
                            </div>
                          )}
                          {requiresAuth && (
                            <span className="text-[9px] text-muted-foreground mt-0.5 block">
                              Requiere registro
                            </span>
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
                
                // ✅ Obtener estado de actividad
                const activityStatus = getRoomActivityStatus(realUserCount);
                
                // 🔒 Verificar si la sala requiere autenticación
                const restrictedRooms = ['mas-30', 'santiago', 'gaming'];
                const isRestrictedRoom = restrictedRooms.includes(room.id);
                const isGuestOrAnonymous = user && (user.isGuest || user.isAnonymous);
                const requiresAuth = isRestrictedRoom && isGuestOrAnonymous;
                
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
                          : requiresAuth
                          ? 'opacity-60 hover:opacity-80 hover:bg-accent/30'
                          : 'hover:bg-accent/50 hover:border-l-2 hover:border-accent'
                      }`}
                      onClick={() => {
                        if (requiresAuth) {
                          navigate('/auth?redirect=/chat/' + room.id);
                          onClose();
                        } else {
                          handleRoomChange(room.id);
                        }
                      }}
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
                            {requiresAuth && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="flex items-center gap-1"
                              >
                                <Lock className="w-3 h-3 text-muted-foreground" />
                              </motion.div>
                            )}
                          </div>
                          {/* ✅ Mostrar indicador de actividad si hay usuarios */}
                          {activityStatus.status && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <motion.div
                                className={`w-2 h-2 rounded-full ${
                                  activityStatus.color === 'green' 
                                    ? 'bg-green-500' 
                                    : 'bg-orange-500'
                                }`}
                                animate={
                                  activityStatus.pulseIntensity >= 2
                                    ? {
                                        scale: activityStatus.pulseIntensity === 3 
                                          ? [1, 1.8, 1, 1.8, 1]
                                          : [1, 1.5, 1],
                                        opacity: activityStatus.pulseIntensity === 3
                                          ? [1, 0.4, 1, 0.4, 1]
                                          : [1, 0.6, 1],
                                        boxShadow: activityStatus.pulseIntensity === 3
                                          ? [
                                              '0 0 0 0 rgba(249, 115, 22, 0.7)',
                                              '0 0 0 8px rgba(249, 115, 22, 0)',
                                              '0 0 0 0 rgba(249, 115, 22, 0.7)',
                                              '0 0 0 8px rgba(249, 115, 22, 0)',
                                              '0 0 0 0 rgba(249, 115, 22, 0.7)'
                                            ]
                                          : [
                                              '0 0 0 0 rgba(249, 115, 22, 0.7)',
                                              '0 0 0 6px rgba(249, 115, 22, 0)',
                                              '0 0 0 0 rgba(249, 115, 22, 0.7)'
                                            ]
                                      }
                                    : {
                                        scale: [1, 1.2, 1],
                                        opacity: [1, 0.8, 1]
                                      }
                                }
                                transition={{
                                  duration: activityStatus.pulseIntensity === 3 ? 1.2 : activityStatus.pulseIntensity === 2 ? 1.5 : 2,
                                  repeat: Infinity,
                                  ease: "easeInOut"
                                }}
                              />
                              <span className={`text-[10px] font-semibold ${
                                activityStatus.color === 'green' 
                                  ? 'text-green-500' 
                                  : 'text-orange-500'
                              }`}>
                                {activityStatus.status}
                              </span>
                            </div>
                          )}
                          {requiresAuth && (
                            <span className="text-[9px] text-muted-foreground mt-0.5 block">
                              Requiere registro
                            </span>
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