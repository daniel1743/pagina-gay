import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Hash, Gamepad2, Users, Heart, User, LogIn, X, UserCheck, GitFork, UserMinus, Cake, CheckCircle, Lock, Sparkles, Archive } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { subscribeToMultipleRoomCounts } from '@/services/presenceService';
import { colorClasses, getVisibleRoomsForUser } from '@/config/rooms';
import { RegistrationRequiredModal } from '@/components/auth/RegistrationRequiredModal';
import { AuthModal } from '@/components/auth/AuthModal';

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

const ChatSidebar = ({ currentRoom, setCurrentRoom, isOpen, onClose, onOpenBaul, onOpenOpin }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [roomCounts, setRoomCounts] = useState({});
  const [logoSrc, setLogoSrc] = useState("/LOGO-TRASPARENTE.png");
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [pendingRoomId, setPendingRoomId] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // ✅ Detectar si estamos en una sala secundaria
  const isSecondaryRoom = location.pathname.startsWith('/chat-secondary/');

  // Suscribirse a contadores en tiempo real (solo sala principal visible)
  useEffect(() => {
    if (!user) {
      setRoomCounts({});
      return;
    }

    // Suscribirse solo a salas visibles para este usuario (admin ve admin-testing)
    const roomIds = getVisibleRoomsForUser(user).map(room => room.id);
    const unsubscribe = subscribeToMultipleRoomCounts(roomIds, (counts) => {
      setRoomCounts(counts);
    });
    return () => unsubscribe();
  }, [user]);

  const handleRoomChange = (roomId, isSecondary = false) => {
    setCurrentRoom(roomId);
    // ✅ Navegar a sala secundaria si tiene el flag isSecondary
    if (isSecondary) {
      navigate(`/chat-secondary/${roomId}`);
    } else {
      navigate(`/chat/${roomId}`);
    }
    // ✅ Cerrar sidebar automáticamente en móvil al cambiar de sala
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      onClose();
    }
  };
  
  const handleLogout = () => {
    logout();
    navigate('/');
  }

  // 🔒 Usuarios normales: solo sala principal. Admin: principal + admin-testing.
  const visibleRooms = getVisibleRoomsForUser(user);

  return (
    <>
      {/* Modal de autenticación (Login/Registro) */}
      <AuthModal 
        open={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
      
      {/* Modal de registro requerido */}
      <RegistrationRequiredModal
        open={showRegistrationModal}
        onClose={() => {
          setShowRegistrationModal(false);
          setPendingRoomId(null);
        }}
        onContinue={() => {
          if (pendingRoomId) {
            navigate(`/auth?redirect=/chat/${pendingRoomId}`);
          } else {
            navigate('/auth');
          }
        }}
        title="Registro Requerido"
        description="Esta sala requiere estar registrado para mantener un mejor control y seguridad de la comunidad."
      />
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

      {/* Desktop: sidebar siempre visible - Solo en pantallas grandes */}
      {/* ✅ FIX: Usar hidden lg:flex para que no interfiera en móvil y mantenga layout flex en desktop */}
      <aside className="hidden lg:flex w-72 h-full bg-card border-r border-border flex-col flex-shrink-0">
        <div className="flex-shrink-0 p-4 border-b border-border flex items-center justify-between">
          <motion.div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/landing')}
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

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide p-3">
          <div className="mb-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2 px-2">Salas de Chat</h3>
            <div className="space-y-1">
              {visibleRooms.map((room, index) => {
                const IconComponent = room.icon;
                const realUserCount = roomCounts[room.id] || 0;
                
                // ✅ Obtener estado de actividad
                const activityStatus = getRoomActivityStatus(realUserCount);
                
                // 🔒 Verificar si la sala requiere autenticación
                const restrictedRooms = ['mas-30', 'santiago', 'gaming'];
                const isRestrictedRoom = restrictedRooms.includes(room.id);
                const isGuestOrAnonymous = user && (user.isGuest || user.isAnonymous);
                const requiresAuth = isRestrictedRoom && isGuestOrAnonymous;
                
                // ✅ Verificar si la sala está activa (incluyendo salas secundarias)
                const isActive = currentRoom === room.id || 
                  (isSecondaryRoom && room.isSecondary && location.pathname.includes(`/chat-secondary/${room.id}`));

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
                          // Mostrar modal de registro requerido
                          setPendingRoomId(room.id);
                          setShowRegistrationModal(true);
                        } else {
                          handleRoomChange(room.id, room.isSecondary);
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
                            {room.adminOnly && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                                Admin
                              </span>
                            )}
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

          {/* 🎯 OPIN y Baúl - Descubre */}
          <div className="mt-4 mb-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2 px-2">Descubre</h3>
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start text-left h-auto py-2.5 px-3 hover:bg-accent/50 hover:border-l-2 hover:border-purple-500 group"
                onClick={() => {
                  const handled = onOpenOpin ? onOpenOpin() === true : false;
                  if (!handled) navigate('/opin');
                  if (typeof window !== 'undefined' && window.innerWidth < 1024) onClose();
                }}
              >
                <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0 mr-3" />
                <span className="text-sm font-medium text-foreground">Tablón</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-left h-auto py-2.5 px-3 hover:bg-accent/50 hover:border-l-2 hover:border-cyan-500 group"
                onClick={() => {
                  const handled = onOpenBaul ? onOpenBaul() === true : false;
                  if (!handled) navigate('/baul');
                  if (typeof window !== 'undefined' && window.innerWidth < 1024) onClose();
                }}
              >
                <Archive className="w-5 h-5 text-cyan-400 flex-shrink-0 mr-3" />
                <span className="text-sm font-medium text-foreground">Baúl</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-auto flex-shrink-0 p-4 border-t border-border">
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
              <Button onClick={() => setShowAuthModal(true)} className="w-full magenta-gradient text-white font-bold py-3">
                <LogIn className="w-4 h-4 mr-2" />
                Iniciar Sesión
              </Button>
            </motion.div>
          )}
        </div>
      </aside>

      {/* Mobile: sidebar deslizable - Oculto por defecto, se muestra solo cuando isOpen=true */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="lg:hidden fixed left-0 top-0 w-72 h-full bg-card border-r border-border flex flex-col z-50 shadow-2xl"
            style={{ willChange: 'transform' }}
          >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <motion.div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/landing')}
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

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide p-3">
          <div className="mb-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2 px-2">Salas de Chat</h3>
            <div className="space-y-1">
              {visibleRooms.map((room, index) => {
                const IconComponent = room.icon;
                const realUserCount = roomCounts[room.id] || 0;
                
                // ✅ Obtener estado de actividad
                const activityStatus = getRoomActivityStatus(realUserCount);
                
                // 🔒 Verificar si la sala requiere autenticación
                const restrictedRooms = ['mas-30', 'santiago', 'gaming'];
                const isRestrictedRoom = restrictedRooms.includes(room.id);
                const isGuestOrAnonymous = user && (user.isGuest || user.isAnonymous);
                const requiresAuth = isRestrictedRoom && isGuestOrAnonymous;
                
                // ✅ Verificar si la sala está activa (incluyendo salas secundarias)
                const isActive = currentRoom === room.id || 
                  (isSecondaryRoom && room.isSecondary && location.pathname.includes(`/chat-secondary/${room.id}`));

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
                          handleRoomChange(room.id, room.isSecondary);
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
                            {room.adminOnly && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                                Admin
                              </span>
                            )}
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

          {/* 🎯 OPIN y Baúl - Descubre (mobile) */}
          <div className="mt-4 mb-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2 px-2">Descubre</h3>
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start text-left h-auto py-2.5 px-3 hover:bg-accent/50 hover:border-l-2 hover:border-purple-500 group"
                onClick={() => {
                  const handled = onOpenOpin ? onOpenOpin() === true : false;
                  if (!handled) navigate('/opin');
                  onClose();
                }}
              >
                <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0 mr-3" />
                <span className="text-sm font-medium text-foreground">Tablón</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-left h-auto py-2.5 px-3 hover:bg-accent/50 hover:border-l-2 hover:border-cyan-500 group"
                onClick={() => {
                  const handled = onOpenBaul ? onOpenBaul() === true : false;
                  if (!handled) navigate('/baul');
                  onClose();
                }}
              >
                <Archive className="w-5 h-5 text-cyan-400 flex-shrink-0 mr-3" />
                <span className="text-sm font-medium text-foreground">Baúl</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-auto flex-shrink-0 p-4 border-t border-border">
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
              <Button onClick={() => {
                setShowAuthModal(true);
                onClose(); // Cerrar sidebar en móvil al abrir modal
              }} className="w-full magenta-gradient text-white font-bold py-3">
                <LogIn className="w-4 h-4 mr-2" />
                Iniciar Sesión
              </Button>
            </motion.div>
          )}
        </div>
      </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatSidebar;
