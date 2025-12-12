import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Zap, Heart, Flame, X, MessageSquare, User, Send, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/config/firebase';
import {
  getCurrentLocation,
  requestAndSaveLocation,
  checkLocationPermission,
} from '@/services/geolocationService';
import { filterAndSortByProximity, formatDistance } from '@/utils/geohash';

/**
 * Tarjeta de usuario (estilo Grindr)
 * Muestra avatar opaco, distancia, rol y botones de interacción
 */
const UserCard = ({ user, onInteraction, onMessageClick }) => {
  const getRoleColor = (role) => {
    if (!role) return 'bg-gray-500';

    switch(role.toLowerCase()) {
      case 'activo':
      case 'top':
        return 'bg-blue-500';
      case 'versátil':
      case 'versatil':
      case 'vers':
        return 'bg-purple-500';
      case 'versátil pasivo':
      case 'versatil pasivo':
        return 'bg-pink-500';
      case 'pasivo':
      case 'bottom':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Formatear distancia
  const distanceText = user.distanceText || formatDistance(user.distance);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative group cursor-pointer"
    >
      {/* Card con avatar opaco */}
      <div className="aspect-[3/4] rounded-2xl overflow-hidden relative bg-gradient-to-br from-gray-700 to-gray-900 border border-gray-600">

        {/* Avatar opaco centrado */}
        <div className="absolute inset-0 flex items-center justify-center">
          <User className="w-24 h-24 text-gray-500 opacity-40" />
        </div>

        {/* Gradiente inferior para texto */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30" />

        {/* Estado online/offline (si está disponible) */}
        {user.isOnline !== undefined && (
          <div className="absolute top-3 right-3">
            <div className={`w-4 h-4 rounded-full border-2 border-white ${user.isOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
          </div>
        )}

        {/* Distancia */}
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 text-xs text-white font-medium">
          <MapPin className="w-3 h-3" />
          <span>{distanceText}</span>
        </div>

        {/* Rol (si está disponible) */}
        {user.role && (
          <div className={`absolute top-10 left-3 ${getRoleColor(user.role)} text-white px-2 py-1 rounded-full text-xs font-semibold`}>
            {user.role}
          </div>
        )}

        {/* Info del usuario */}
        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
          <h3 className="text-lg font-bold truncate">
            {user.username}{user.age ? `, ${user.age}` : ''}
          </h3>
          {user.bio && (
            <p className="text-xs text-gray-300 truncate">{user.bio}</p>
          )}
        </div>

        {/* Botones de interacción (hover) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileHover={{ opacity: 1, y: 0 }}
          className="absolute bottom-14 left-0 right-0 flex justify-center gap-2 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); onInteraction(user, 'zap'); }}
            className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-full shadow-lg"
            title="Zap"
          >
            <Zap className="w-4 h-4" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); onInteraction(user, 'heart'); }}
            className="bg-pink-500 hover:bg-pink-600 text-white p-2 rounded-full shadow-lg"
            title="Me gusta"
          >
            <Heart className="w-4 h-4" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); onInteraction(user, 'flame'); }}
            className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-full shadow-lg"
            title="Fuego"
          >
            <Flame className="w-4 h-4" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); onMessageClick(user); }}
            className="bg-cyan-500 hover:bg-cyan-600 text-white p-2 rounded-full shadow-lg"
            title="Enviar mensaje"
          >
            <MessageSquare className="w-4 h-4" />
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
};

/**
 * Modal de mensaje personalizado
 */
const MessageModal = ({ isOpen, onClose, targetUser, onSend }) => {
  const [message, setMessage] = useState('');
  const maxChars = 60;

  const handleSend = () => {
    if (message.trim().length === 0) {
      toast({
        title: "Error",
        description: "El mensaje no puede estar vacío",
        variant: "destructive",
      });
      return;
    }

    onSend(targetUser, message);
    setMessage('');
    onClose();
  };

  if (!isOpen || !targetUser) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-magenta-400 bg-clip-text text-transparent">
            <MessageSquare className="inline w-5 h-5 mr-2 text-cyan-400" />
            Mensaje para {targetUser.username}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-2">
            Rompe el hielo con un mensaje personalizado (máx. {maxChars} caracteres)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="relative">
            <Input
              value={message}
              onChange={(e) => {
                if (e.target.value.length <= maxChars) {
                  setMessage(e.target.value);
                }
              }}
              placeholder="Escribe tu mensaje aquí..."
              className="pr-16 bg-secondary border-border"
              maxLength={maxChars}
            />
            <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${message.length >= maxChars ? 'text-red-400' : 'text-muted-foreground'}`}>
              {message.length}/{maxChars}
            </span>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              onClick={onClose}
              variant="outline"
              className="border-border"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSend}
              className="bg-gradient-to-r from-cyan-500 to-magenta-500 hover:opacity-90"
            >
              <Send className="w-4 h-4 mr-2" />
              Enviar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Modal de Usuarios Cercanos (estilo Grindr)
 * OPTIMIZADO: Solo carga usuarios con ubicación y los ordena por distancia
 */
const NearbyUsersModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [permission, setPermission] = useState('prompt');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedUserForMessage, setSelectedUserForMessage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      initializeLocation();
    }
  }, [isOpen]);

  /**
   * Inicializa la ubicación del usuario
   */
  const initializeLocation = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Verificar permisos
      const perm = await checkLocationPermission();
      setPermission(perm);

      if (perm === 'denied') {
        setError('Permiso de ubicación denegado. Habilítalo en la configuración de tu navegador.');
        setLoading(false);
        return;
      }

      // 2. Obtener ubicación del usuario
      let location;
      try {
        location = await getCurrentLocation();
        setUserLocation({
          latitude: location.latitude,
          longitude: location.longitude,
        });

        // 3. Guardar ubicación en Firestore si no está guardada
        if (user && !user.locationEnabled) {
          await requestAndSaveLocation(user.id);
        }
      } catch (locationError) {
        console.error('Error obteniendo ubicación:', locationError);
        setError(locationError.message);
        setLoading(false);
        return;
      }

      // 4. Cargar usuarios cercanos de Firestore
      await loadNearbyUsersFromFirestore(location.latitude, location.longitude);

    } catch (err) {
      console.error('Error inicializando ubicación:', err);
      setError('Error cargando usuarios cercanos. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Carga usuarios con ubicación desde Firestore
   * OPTIMIZADO: Solo lee usuarios que tienen locationEnabled: true
   */
  const loadNearbyUsersFromFirestore = async (userLat, userLon) => {
    try {
      const usersRef = collection(db, 'users');

      // OPTIMIZACIÓN: Solo buscar usuarios con ubicación habilitada
      const q = query(
        usersRef,
        where('locationEnabled', '==', true),
        limit(100) // Límite de 100 usuarios cercanos
      );

      const querySnapshot = await getDocs(q);

      const usersData = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data();

        // Filtrar al usuario actual
        if (doc.id === user.id) return;

        // Verificar que tenga ubicación
        if (!userData.location || !userData.location.latitude || !userData.location.longitude) {
          return;
        }

        usersData.push({
          id: doc.id,
          username: userData.username,
          age: userData.age,
          bio: userData.bio,
          role: userData.role,
          location: userData.location,
          isOnline: userData.isOnline || false,
        });
      });

      console.log(`📍 Encontrados ${usersData.length} usuarios con ubicación`);

      // OPTIMIZACIÓN: Calcular distancias en cliente (sin reads adicionales)
      const sortedUsers = filterAndSortByProximity(
        usersData,
        userLat,
        userLon,
        50 // Máximo 50km de distancia
      );

      setNearbyUsers(sortedUsers);

      if (sortedUsers.length === 0) {
        setError('No hay usuarios cercanos en este momento. ¡Vuelve más tarde!');
      }

    } catch (error) {
      console.error('Error loading nearby users:', error);
      setError('Error cargando usuarios cercanos');
    }
  };

  /**
   * Maneja las interacciones (zap, heart, flame)
   */
  const handleInteraction = (targetUser, type) => {
    const icons = {
      zap: '⚡',
      heart: '❤️',
      flame: '🔥'
    };

    const messages = {
      zap: 'un Zap',
      heart: 'un Me Gusta',
      flame: 'un Fuego'
    };

    toast({
      title: `${icons[type]} ¡Interacción enviada!`,
      description: `Le diste ${messages[type]} a ${targetUser.username}`,
      duration: 3000,
    });

    // TODO: Enviar notificación al otro usuario vía Firebase
    console.log(`${user.username} dio ${messages[type]} a ${targetUser.username}`);
  };

  /**
   * Abre el modal de mensaje
   */
  const handleMessageClick = (targetUser) => {
    setSelectedUserForMessage(targetUser);
    setShowMessageModal(true);
  };

  /**
   * Envía el mensaje personalizado
   */
  const handleSendMessage = (targetUser, message) => {
    toast({
      title: "💬 Mensaje enviado",
      description: `Tu mensaje ha sido enviado a ${targetUser.username}`,
      duration: 3000,
    });

    // TODO: Enviar mensaje al otro usuario vía Firebase
    console.log(`${user.username} envió mensaje a ${targetUser.username}: "${message}"`);
  };

  /**
   * Reintenta cargar ubicación
   */
  const handleRetry = () => {
    setError(null);
    initializeLocation();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] bg-card border-border overflow-hidden p-0">
          <DialogHeader className="p-6 pb-4 border-b border-border sticky top-0 bg-card z-10">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-magenta-400 bg-clip-text text-transparent">
                <MapPin className="inline w-6 h-6 mr-2 text-cyan-400" />
                Usuarios Cercanos
              </DialogTitle>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground p-2 hover:bg-secondary rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <DialogDescription className="text-sm text-muted-foreground mt-2">
              {!loading && nearbyUsers.length > 0 && (
                `${nearbyUsers.length} usuarios cerca de ti • Ordenados por distancia`
              )}
              {loading && 'Buscando usuarios cercanos...'}
              {error && 'Error cargando usuarios'}
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Loading state */}
            {loading && (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <Loader2 className="animate-spin h-12 w-12 text-cyan-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">Buscando usuarios cercanos...</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {permission === 'prompt' && 'Solicitando permiso de ubicación...'}
                    {permission === 'granted' && 'Cargando usuarios...'}
                  </p>
                </div>
              </div>
            )}

            {/* Error state */}
            {!loading && error && (
              <div className="flex items-center justify-center py-20">
                <div className="text-center max-w-md">
                  <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Error</h3>
                  <p className="text-muted-foreground mb-4">{error}</p>
                  <Button onClick={handleRetry} className="bg-cyan-500 hover:bg-cyan-600">
                    Intentar de Nuevo
                  </Button>
                </div>
              </div>
            )}

            {/* Users grid */}
            {!loading && !error && nearbyUsers.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <AnimatePresence>
                  {nearbyUsers.map((nearbyUser) => (
                    <UserCard
                      key={nearbyUser.id}
                      user={nearbyUser}
                      onInteraction={handleInteraction}
                      onMessageClick={handleMessageClick}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Empty state */}
            {!loading && !error && nearbyUsers.length === 0 && (
              <div className="flex items-center justify-center py-20">
                <div className="text-center max-w-md">
                  <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay usuarios cercanos</h3>
                  <p className="text-muted-foreground">
                    No encontramos usuarios con ubicación habilitada cerca de ti.
                    ¡Vuelve más tarde!
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de mensaje personalizado */}
      <MessageModal
        isOpen={showMessageModal}
        onClose={() => {
          setShowMessageModal(false);
          setSelectedUserForMessage(null);
        }}
        targetUser={selectedUserForMessage}
        onSend={handleSendMessage}
      />
    </>
  );
};

export default NearbyUsersModal;
