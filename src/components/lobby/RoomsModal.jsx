import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Hash, Gamepad2, Heart, Search, Crown, Plus, X, GitFork, UserMinus, UserCheck, Cake, MessageSquare, Lock } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { subscribeToMultipleRoomCounts } from '@/services/presenceService';
import { roomsData, colorClasses } from '@/config/rooms';
import { RegistrationRequiredModal } from '@/components/auth/RegistrationRequiredModal';

/**
 * ✅ SISTEMA DE ESTADOS DE ACTIVIDAD
 * Determina el estado de actividad de una sala basado en usuarios reales
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

const RoomsModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [pendingRoomId, setPendingRoomId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roomCounts, setRoomCounts] = useState({});

  // ✅ MODIFICADO: Usuarios anónimos pueden ver el modal pero solo acceder a "conversas-libres"
  // No redirigimos automáticamente, permitimos que vean las salas disponibles

  // Suscribirse a contadores de usuarios en tiempo real (solo si está registrado)
  useEffect(() => {
    if (!user || user.isAnonymous || user.isGuest) return;
    
    const roomIds = roomsData.map(room => room.id);
    const unsubscribe = subscribeToMultipleRoomCounts(roomIds, (counts) => {
      setRoomCounts(counts);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredRooms = roomsData.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleCreateRoom = () => {
    if (!user) return; // Protección si user es null

    if (user.isPremium) {
      toast({
        title: '🚧 Función en desarrollo',
        description: 'Pronto podrás crear tus propias salas.',
      });
    } else {
      toast({
        title: '👑 Función Premium',
        description: 'Hazte Premium para crear tus propias salas de chat.',
        action: <Button onClick={() => { onClose(); navigate('/premium'); }}>Ver Premium</Button>,
      });
    }
  };

  return (
    <>
      {/* Modal de registro requerido */}
      <RegistrationRequiredModal
        open={showRegistrationModal}
        onClose={() => {
          setShowRegistrationModal(false);
          setPendingRoomId(null);
        }}
        onContinue={() => {
          onClose(); // Cerrar modal de salas primero
          if (pendingRoomId) {
            navigate(`/auth?redirect=/chat/${pendingRoomId}`);
          } else {
            navigate('/auth');
          }
        }}
        title="Registro Requerido"
        description="Esta sala requiere estar registrado para mantener un mejor control y seguridad de la comunidad."
      />
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border text-foreground max-w-4xl rounded-2xl p-0">
        <DialogHeader className="p-6">
          <DialogTitle className="text-3xl font-extrabold flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-cyan-400" />
            Salas de Chat
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Elige una sala y únete a la conversación en tiempo real.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6">
          {/* Buscador */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar una sala..."
                className="w-full bg-background border-2 border-border rounded-full pl-12 pr-4 py-3 text-lg placeholder:text-muted-foreground focus:border-primary transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={handleCreateRoom} className="cyan-gradient text-black font-bold whitespace-nowrap">
              <Plus className="mr-2 h-5 w-5" />
              Crear {user && !user.isPremium && <Crown className="ml-2 h-4 w-4" />}
            </Button>
          </div>

          {/* Grid de Tarjetas */}
          <div className="max-h-[60vh] overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-2 scrollbar-hide">
            {filteredRooms.map((room, index) => {
              const IconComponent = room.icon;
              const realUserCount = roomCounts[room.id] || 0;

              // ✅ Obtener estado de actividad
              const activityStatus = getRoomActivityStatus(realUserCount);

              const isAnonymousUser = user && (user.isAnonymous || user.isGuest);
              const isGlobalRoom = room.id === 'global'; // Sala principal nueva
              // 🔒 Salas restringidas: mas-30, santiago, gaming requieren autenticación
              const restrictedRooms = ['mas-30', 'santiago', 'gaming'];
              const isRestrictedRoom = restrictedRooms.includes(room.id);
              const canAccess = !isRestrictedRoom || !isAnonymousUser; // Solo usuarios registrados pueden acceder a salas restringidas

              const handleRoomClick = () => {
                if (!canAccess) {
                  // Mostrar modal de registro requerido
                  setPendingRoomId(room.id);
                  setShowRegistrationModal(true);
                  return;
                }
                onClose();
                navigate(`/chat/${room.id}`);
              };

              return (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  onClick={handleRoomClick}
                  className={`relative glass-effect p-5 rounded-xl flex flex-col gap-3 cursor-pointer transition-all border group ${
                    !canAccess ? 'opacity-75 hover:opacity-90 hover:border-orange-500' : 'hover:border-primary'
                  }`}
                >
                  {/* Icono y Título */}
                  <div className="flex items-center gap-3">
                    <div className={`${colorClasses[room.color]} transition-transform group-hover:scale-110`}>
                      <IconComponent className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-foreground">{room.name}</h3>
                        {!canAccess && (
                          <Lock className="w-4 h-4 text-orange-500" />
                        )}
                      </div>
                      {!canAccess && (
                        <p className="text-xs text-orange-500 mt-1">Requiere registro</p>
                      )}
                    </div>
                  </div>

                  {/* Descripción */}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {room.description}
                  </p>

                  {/* ✅ Indicador de actividad con estados */}
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-border">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🔥</span>
                      <span className={`text-sm font-bold ${colorClasses[room.color]}`}>
                        {activityStatus.status ? `${activityStatus.status}` : 'Únete y rompe el hielo'}
                      </span>
                    </div>

                    {/* Indicador de actividad con puntos y pulsación */}
                    {activityStatus.status && (
                      <div className="flex items-center gap-1.5">
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
                        <span className={`text-xs font-semibold ${
                          activityStatus.color === 'green' 
                            ? 'text-green-500' 
                            : 'text-orange-500'
                        }`}>
                          {activityStatus.pulseIntensity >= 3 ? 'A reventar' : 'Entra ahora'}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Mensaje si no hay resultados */}
          {filteredRooms.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-semibold text-foreground">No se encontraron salas</p>
              <p className="text-sm text-muted-foreground">Intenta con otro término de búsqueda</p>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 z-50 text-muted-foreground hover:text-foreground"
        >
          <X className="w-6 h-6" />
        </Button>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default RoomsModal;