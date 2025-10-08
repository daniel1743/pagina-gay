import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, Home, ArrowLeft } from 'lucide-react';

const roomNames = {
  'conversas-libres': 'Conversas Libres',
  'gaming': 'Gaming',
  'mas-30': '+30',
  'amistad': 'Amistad',
  'osos-activos': 'Osos Activos',
  'pasivos-buscando': 'Pasivos Buscando',
  'versatiles': 'Versátiles',
  'quedar-ya': 'Quedar Ya',
  'hablar-primero': 'Hablar Primero',
  'morbosear': 'Morbosear',
};

const ChatHeader = ({ currentRoom, onMenuClick }) => {
  const navigate = useNavigate();

  return (
    <header className="bg-card border-b p-4 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="text-muted-foreground hover:text-cyan-400"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden text-muted-foreground"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="font-bold text-foreground text-lg">
            # {roomNames[currentRoom] || 'Sala de Chat'}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="text-muted-foreground hover:text-cyan-400"
        >
          <Home className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
};

export default ChatHeader;