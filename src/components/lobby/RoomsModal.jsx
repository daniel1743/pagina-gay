import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Crown, Plus, X, MessageSquare, Lock } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { roomsData, colorClasses, getVisibleRoomsForUser } from '@/config/rooms';
import { RegistrationRequiredModal } from '@/components/auth/RegistrationRequiredModal';

const RoomsModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [pendingRoomId, setPendingRoomId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  // La presencia no se consulta aquí: no mostramos contadores sin una fuente real validada.

  // 🔒 Usuario normal: principal. Admin: principal + admin-testing.
  const visibleRooms = getVisibleRoomsForUser(user);
  const filteredRooms = visibleRooms.filter(room =>
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="cv-surface-elevated border text-foreground max-w-4xl rounded-2xl p-0">
        <DialogHeader className="p-6">
          <DialogTitle className="text-3xl font-extrabold flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-cyan-400" />
            Chat Principal
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Selecciona una sala para participar. La actividad puede variar y no se representa con contadores de relleno.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6">
          {/* Buscador */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar en el chat principal..."
                className="cv-field w-full rounded-full pl-12 pr-4 py-3 text-lg transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={handleCreateRoom} className="cv-button-secondary whitespace-nowrap">
              <Plus className="mr-2 h-5 w-5" />
              Crear {user && !user.isPremium && <Crown className="ml-2 h-4 w-4" />}
            </Button>
          </div>

          {/* Grid de Tarjetas */}
          <div className="max-h-[60vh] overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-2 scrollbar-hide">
            {filteredRooms.map((room, index) => {
              const IconComponent = room.icon;
              const isAnonymousUser = user && (user.isAnonymous || user.isGuest);
              // 🔒 Salas restringidas: mas-30, santiago, gaming requieren autenticación
              const restrictedRooms = ['mas-30', 'santiago', 'gaming'];
              const isRestrictedRoom = restrictedRooms.includes(room.id);

              // 🌍 SALAS INTERNACIONALES: España, Brasil, México, Argentina bloqueadas para guests
              // Usa la propiedad room.disabled de rooms.js para detectar salas internacionales
              const isDisabledForGuests = room.disabled && isAnonymousUser;

              // Usuario puede acceder si:
              // 1. No es sala restringida, O es usuario registrado (para restringidas)
              // 2. Y NO es sala disabled para guests (internacionales)
              const canAccess = (!isRestrictedRoom || !isAnonymousUser) && !isDisabledForGuests;

              const handleRoomClick = () => {
                if (!canAccess) {
                  // Cerrar el modal de salas primero, luego mostrar modal de registro
                  onClose();
                  // Pequeño delay para que se cierre el modal de salas antes de abrir el de registro
                  setTimeout(() => {
                    setPendingRoomId(room.id);
                    setShowRegistrationModal(true);
                  }, 100);
                  return;
                }
                onClose();
                navigate(`/chat/${room.id}`);
              };

              return (
                <motion.button
                  type="button"
                  key={room.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  onClick={handleRoomClick}
                  className={`cv-card cv-card-interactive relative w-full text-left p-5 rounded-xl flex flex-col gap-3 cursor-pointer transition-all group ${
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
                        <p className="text-xs text-orange-500 mt-1">
                          {room.disabledMessage || 'Requiere registro'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Descripción */}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {room.description}
                  </p>

                  <div className="mt-auto flex items-center justify-between border-t border-border pt-2">
                    <span className="text-sm font-medium text-muted-foreground">Actividad no disponible</span>
                    <span className="text-xs text-muted-foreground">Compruébala dentro de la sala</span>
                  </div>
                </motion.button>
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
          className="cv-icon-button absolute top-4 right-4 z-50"
        >
          <X className="w-6 h-6" />
        </Button>
      </DialogContent>
    </Dialog>

      {/* Modal de registro requerido - Renderizado fuera del Dialog principal */}
      <RegistrationRequiredModal
        open={showRegistrationModal}
        onClose={() => {
          setShowRegistrationModal(false);
          setPendingRoomId(null);
        }}
        onContinue={() => {
          setShowRegistrationModal(false);
          if (pendingRoomId) {
            navigate(`/auth?redirect=/chat/${pendingRoomId}`);
          } else {
            navigate('/auth');
          }
        }}
        title="Registro Requerido"
        description="Esta sala requiere estar registrado para mantener un mejor control y seguridad de la comunidad."
      />
    </>
  );
};

export default RoomsModal;
