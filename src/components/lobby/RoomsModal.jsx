import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Hash, Gamepad2, Heart, Search, Crown, Plus, X, GitFork, UserMinus, UserCheck, Cake, MessageSquare } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { subscribeToMultipleRoomCounts } from '@/services/presenceService';


const roomsData = [
  {
    id: 'santiago',
    name: 'Santiago 🏙️',
    description: 'Gays de Santiago - Capital de Chile',
    icon: Users,
    color: 'cyan'
  },
  {
    id: 'valparaiso',
    name: 'Valparaíso 🌊',
    description: 'Gays de Valparaíso - Puerto y cerros',
    icon: Users,
    color: 'blue'
  },
  {
    id: 'conversas-libres',
    name: 'Conversas Libres',
    description: 'Chat general para todos los temas',
    icon: Hash,
    color: 'teal'
  },
  {
    id: 'amistad',
    name: 'Amistad',
    description: 'Conoce nuevos amigos LGBT+',
    icon: Heart,
    color: 'pink'
  },
  {
    id: 'osos',
    name: 'Osos',
    description: 'Espacio para la comunidad Bear',
    icon: UserCheck,
    color: 'amber'
  },
  {
    id: 'activos-buscando',
    name: 'Activos Buscando',
    description: 'Activos en búsqueda',
    icon: UserCheck,
    color: 'blue'
  },
  {
    id: 'pasivos-buscando',
    name: 'Pasivos Buscando',
    description: 'Pasivos en búsqueda',
    icon: UserCheck,
    color: 'purple'
  },
  {
    id: 'lesbianas',
    name: 'Lesbianas',
    description: 'Sala exclusiva para lesbianas',
    icon: GitFork,
    color: 'fuchsia'
  },
  {
    id: 'menos-30',
    name: 'Menos de 30',
    description: 'Para menores de 30 años',
    icon: UserMinus,
    color: 'green'
  },
  {
    id: 'mas-30',
    name: 'Más de 30',
    description: 'Para mayores de 30 años',
    icon: Users,
    color: 'teal'
  },
  {
    id: 'mas-40',
    name: 'Más de 40',
    description: 'Para mayores de 40 años',
    icon: Cake,
    color: 'orange'
  },
  {
    id: 'mas-50',
    name: 'Más de 50',
    description: 'Para mayores de 50 años',
    icon: Cake,
    color: 'red'
  },
  {
    id: 'gaming',
    name: 'Gaming',
    description: 'Gamers LGBT+ conectando',
    icon: Gamepad2,
    color: 'violet'
  },
];

const colorClasses = {
  cyan: 'text-cyan-400',
  pink: 'text-pink-400',
  amber: 'text-amber-400',
  blue: 'text-blue-400',
  purple: 'text-purple-400',
  fuchsia: 'text-fuchsia-400',
  green: 'text-green-400',
  teal: 'text-teal-400',
  orange: 'text-orange-400',
  red: 'text-red-400',
  violet: 'text-violet-400',
};


const RoomsModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [roomCounts, setRoomCounts] = useState({});

  // Suscribirse a contadores de usuarios en tiempo real
  useEffect(() => {
    const roomIds = roomsData.map(room => room.id);
    const unsubscribe = subscribeToMultipleRoomCounts(roomIds, (counts) => {
      setRoomCounts(counts);
    });

    return () => unsubscribe();
  }, []);

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
              const userCount = roomCounts[room.id] || 0;

              return (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  onClick={() => { onClose(); navigate(`/chat/${room.id}`); }}
                  className="relative glass-effect p-5 rounded-xl flex flex-col gap-3 cursor-pointer hover:border-primary transition-all border group"
                >
                  {/* Icono y Título */}
                  <div className="flex items-center gap-3">
                    <div className={`${colorClasses[room.color]} transition-transform group-hover:scale-110`}>
                      <IconComponent className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">{room.name}</h3>
                  </div>

                  {/* Descripción */}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {room.description}
                  </p>

                  {/* Contador de Usuarios */}
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Users className={`w-4 h-4 ${colorClasses[room.color]}`} />
                      <span className={`text-sm font-bold ${colorClasses[room.color]}`}>
                        {userCount} {userCount === 1 ? 'conectado' : 'conectados'}
                      </span>
                    </div>

                    {/* Indicador de actividad */}
                    {userCount > 0 && (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-xs text-green-500 font-medium">Activo</span>
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
  );
};

export default RoomsModal;