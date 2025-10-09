import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Hash, Gamepad2, Heart, Search, Crown, Plus, X, GitFork, UserMinus, UserCheck, Cake } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';


const roomsData = [
  { id: 'conversas-libres', name: 'Conversas Libres', icon: <Hash className="w-5 h-5 text-[#00FFFF]" />, users: 42 },
  { id: 'amistad', name: 'Amistad', icon: <Heart className="w-5 h-5 text-[#00FFFF]" />, users: 31 },
  { id: 'osos', name: 'Osos', icon: <UserCheck className="w-5 h-5 text-[#00FFFF]" />, users: 18 },
  { id: 'activos-buscando', name: 'Activos Buscando', icon: <UserCheck className="w-5 h-5 text-[#00FFFF]" />, users: 22 },
  { id: 'pasivos-buscando', name: 'Pasivos Buscando', icon: <UserCheck className="w-5 h-5 text-[#00FFFF]" />, users: 25 },
  { id: 'lesbianas', name: 'Lesbianas', icon: <GitFork className="w-5 h-5 text-[#00FFFF]" />, users: 19 },
  { id: 'menos-30', name: '-30', icon: <UserMinus className="w-5 h-5 text-[#00FFFF]" />, users: 55 },
  { id: 'mas-30', name: '+30', icon: <Users className="w-5 h-5 text-[#00FFFF]" />, users: 15 },
  { id: 'mas-40', name: '+40', icon: <Cake className="w-5 h-5 text-[#00FFFF]" />, users: 28 },
  { id: 'mas-50', name: '+50', icon: <Cake className="w-5 h-5 text-[#00FFFF]" />, users: 12 },
  { id: 'gaming', name: 'Gaming', icon: <Gamepad2 className="w-5 h-5 text-[#00FFFF]" />, users: 23 },
];


const RoomsModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

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
      <DialogContent className="bg-[#22203a] border-[#413e62] text-white max-w-2xl rounded-2xl p-0">
        <DialogHeader className="p-6">
          <DialogTitle className="text-3xl font-extrabold bg-gradient-to-r from-[#E4007C] to-[#00FFFF] bg-clip-text text-transparent">
            Salas de Chat
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Elige una sala y únete a la conversación o crea la tuya.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6">
          <div className="flex gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar una sala..."
                className="w-full bg-[#2C2A4A] border-2 border-[#413e62] rounded-full pl-12 pr-4 py-3 text-lg placeholder:text-gray-400 focus:border-[#E4007C] transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={handleCreateRoom} className="cyan-gradient text-black font-bold">
              <Plus className="mr-2 h-5 w-5" />
              Crear Sala {user && !user.isPremium && <Crown className="ml-2 h-4 w-4" />}
            </Button>
          </div>

          <div className="max-h-[50vh] overflow-y-auto space-y-3 pr-2 scrollbar-hide">
            {filteredRooms.map((room, index) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                onClick={() => { onClose(); navigate(`/chat/${room.id}`); }}
                className="glass-effect p-4 rounded-xl flex items-center justify-between cursor-pointer hover:border-[#E4007C] transition-all"
              >
                <div className="flex items-center gap-4">
                  {room.icon}
                  <span className="text-xl font-bold text-gray-100">{room.name}</span>
                </div>
                <div className="flex items-center gap-2 text-[#00FFFF]">
                  <Users className="w-5 h-5" />
                  <span className="font-bold">{room.users}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X className="w-6 h-6" />
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default RoomsModal;