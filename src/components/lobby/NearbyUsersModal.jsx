import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Zap, Heart, Flame, X, MessageSquare, User, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { getDistance } from 'geolib';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Datos de usuarios simulados cercanos (máximo 1000m)
const generateNearbyUsers = (userLocation) => {
  const roles = ['Activo', 'Versátil', 'Versátil Pasivo', 'Pasivo'];

  // Ubicación base: Santiago Centro (-33.4489, -70.6693)
  // Cada 0.001 de latitud/longitud ≈ 111 metros
  const users = [
    { id: 1, name: 'Carlos', age: 28, bio: 'Amante del gym', online: true, lat: -33.4489, lon: -70.6693, role: 'Activo' },
    { id: 2, name: 'Mateo', age: 25, bio: 'Gamer', online: true, lat: -33.4495, lon: -70.6695, role: 'Activo' },
    { id: 3, name: 'Diego', age: 30, bio: 'Chef profesional', online: false, lat: -33.4492, lon: -70.6698, role: 'Activo' },
    { id: 4, name: 'Sebastián', age: 27, bio: 'Fotógrafo', online: true, lat: -33.4485, lon: -70.6690, role: 'Activo' },
    { id: 5, name: 'Andrés', age: 32, bio: 'Ingeniero', online: false, lat: -33.4480, lon: -70.6688, role: 'Activo' },
    { id: 6, name: 'Felipe', age: 24, bio: 'Estudiante', online: true, lat: -33.4493, lon: -70.6700, role: 'Versátil' },
    { id: 7, name: 'Nicolás', age: 29, bio: 'Músico', online: true, lat: -33.4478, lon: -70.6685, role: 'Versátil' },
    { id: 8, name: 'Javier', age: 26, bio: 'Diseñador', online: false, lat: -33.4497, lon: -70.6697, role: 'Versátil Pasivo' },
    { id: 9, name: 'Lucas', age: 31, bio: 'Médico', online: true, lat: -33.4482, lon: -70.6695, role: 'Pasivo' },
    { id: 10, name: 'Martín', age: 28, bio: 'Abogado', online: false, lat: -33.4490, lon: -70.6692, role: 'Pasivo' },
  ];

  // Calcular distancia para cada usuario y filtrar solo los que están a menos de 1000m
  return users.map(user => ({
    ...user,
    distance: userLocation ? getDistance(
      { latitude: userLocation.lat, longitude: userLocation.lon },
      { latitude: user.lat, longitude: user.lon }
    ) : 0
  }))
  .filter(user => user.distance <= 1000) // Solo usuarios a máximo 1000m
  .sort((a, b) => a.distance - b.distance);
};

const UserCard = ({ user, onInteraction, onMessageClick }) => {
  const getRoleColor = (role) => {
    switch(role) {
      case 'Activo': return 'bg-blue-500';
      case 'Versátil': return 'bg-purple-500';
      case 'Versátil Pasivo': return 'bg-pink-500';
      case 'Pasivo': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

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

        {/* Estado online/offline */}
        <div className="absolute top-3 right-3">
          <div className={`w-4 h-4 rounded-full border-2 border-white ${user.online ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>

        {/* Distancia */}
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 text-xs text-white">
          <MapPin className="w-3 h-3" />
          <span>{user.distance}m</span>
        </div>

        {/* Rol */}
        <div className={`absolute top-10 left-3 ${getRoleColor(user.role)} text-white px-2 py-1 rounded-full text-xs font-semibold`}>
          {user.role}
        </div>

        {/* Info del usuario */}
        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
          <h3 className="text-lg font-bold">{user.name}, {user.age}</h3>
          <p className="text-xs text-gray-300 truncate">{user.bio}</p>
        </div>

        {/* Botones de interacción */}
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

// Modal de mensaje personalizado
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
            Mensaje para {targetUser.name}
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

const NearbyUsersModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedUserForMessage, setSelectedUserForMessage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      getUserLocation();
    }
  }, [isOpen]);

  const getUserLocation = () => {
    setLoading(true);

    // Por ahora, siempre usar Santiago Centro para que los usuarios simulados siempre aparezcan
    // En producción, esto usaría la ubicación real del usuario
    const defaultLocation = { lat: -33.4489, lon: -70.6693 };
    setUserLocation(defaultLocation);
    setNearbyUsers(generateNearbyUsers(defaultLocation));
    setLoading(false);

    /* CÓDIGO ORIGINAL COMENTADO - Descomentar en producción
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          };
          setUserLocation(location);
          setNearbyUsers(generateNearbyUsers(location));
          setLoading(false);
        },
        (error) => {
          // Si falla, usar ubicación por defecto (Santiago Centro)
          const defaultLocation = { lat: -33.4489, lon: -70.6693 };
          setUserLocation(defaultLocation);
          setNearbyUsers(generateNearbyUsers(defaultLocation));
          setLoading(false);

          toast({
            title: "Ubicación no disponible",
            description: "Mostrando usuarios en Santiago Centro",
            variant: "default",
          });
        }
      );
    } else {
      // Si no hay geolocalización, usar ubicación por defecto
      const defaultLocation = { lat: -33.4489, lon: -70.6693 };
      setUserLocation(defaultLocation);
      setNearbyUsers(generateNearbyUsers(defaultLocation));
      setLoading(false);
    }
    */
  };

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
      description: `Le diste ${messages[type]} a ${targetUser.name}`,
      duration: 3000,
    });

    // Aquí podrías enviar la notificación al otro usuario vía Firebase
    console.log(`${user.username} dio ${messages[type]} a ${targetUser.name}`);
  };

  const handleMessageClick = (targetUser) => {
    setSelectedUserForMessage(targetUser);
    setShowMessageModal(true);
  };

  const handleSendMessage = (targetUser, message) => {
    toast({
      title: "💬 Mensaje enviado",
      description: `Tu mensaje ha sido enviado a ${targetUser.name}`,
      duration: 3000,
    });

    // Aquí podrías enviar el mensaje al otro usuario vía Firebase
    console.log(`${user.username} envió mensaje a ${targetUser.name}: "${message}"`);
  };

  return (
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
            {nearbyUsers.length} usuarios cerca de ti • Ordenados por distancia
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Buscando usuarios cercanos...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <AnimatePresence>
                {nearbyUsers.map((nearbyUser, index) => (
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
        </div>
      </DialogContent>

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
    </Dialog>
  );
};

export default NearbyUsersModal;
