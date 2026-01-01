import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, MessageSquare, Reply, User, Hash, Zap, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { roomsData } from '@/config/rooms';
import { sendMessage } from '@/services/chatService';
import { useAuth } from '@/contexts/AuthContext';
import { createAvatar } from '@dicebear/core';
import { avataaars, adventurer, bottts, funEmoji, lorelei, micah } from '@dicebear/collection';
import { serverTimestamp } from 'firebase/firestore';

// ~30 nombres comunes para usar
const COMMON_USERNAMES = [
  'Carlos28', 'Miguel25', 'Javier30', 'Andrés27', 'Luis24',
  'Roberto29', 'Diego26', 'Fernando31', 'Sergio23', 'Pablo28',
  'Ricardo25', 'Mario32', 'Alejandro27', 'Gonzalo24', 'Héctor29',
  'Cristian26', 'Eduardo30', 'Felipe25', 'Daniel28', 'Sebastián27',
  'Juan26', 'Pedro29', 'Manuel24', 'José30', 'Antonio28',
  'Francisco27', 'Rodrigo25', 'Gabriel26', 'Nicolás29', 'Matías24'
];

// Respuestas rápidas
const QUICK_RESPONSES = {
  greetings: [
    'Hola, cómo estás?',
    'Hola, qué buscas?',
    'Hola, todo bien?',
    'Hola, qué tal?',
    'Hola, cómo va?'
  ],
  searches: [
    'Verga y tú?',
    'Busco activo',
    'Busco pasivo',
    'Algo casual',
    'Alguien activo?'
  ],
  responses: [
    'También, bueno yo doy verga',
    'Yo busco activo',
    'Sí, yo también',
    'Perfecto, dónde estás?',
    'Interesante, cuéntame más'
  ],
  explicit: [
    'Soy activo, me mide 22cm',
    'Busco culo rico',
    'Tengo verga grande',
    'Soy pasivo caliente',
    'Quiero coger ya'
  ],
  locations: [
    'Santiago centro',
    'Providencia',
    'Maipú',
    'Las Condes',
    'Baquedano'
  ],
  scort: [
    'Hola, soy scort',
    'Me mide 22cm, soy activo',
    '50k la hora',
    'Santiago centro, tú?',
    'Disponible ahora'
  ]
};

// Estilos de avatar disponibles
const AVATAR_STYLES = [
  { name: 'avataaars', style: avataaars },
  { name: 'adventurer', style: adventurer },
  { name: 'bottts', style: bottts },
  { name: 'fun-emoji', style: funEmoji },
  { name: 'lorelei', style: lorelei },
  { name: 'micah', style: micah },
];

const MessageGenerator = () => {
  const { user } = useAuth();
  const [selectedRoom, setSelectedRoom] = useState('principal');
  const [selectedUsername, setSelectedUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [messageText, setMessageText] = useState('');
  const [responseText, setResponseText] = useState('');
  const [activeTab, setActiveTab] = useState('write');
  const [isSending, setIsSending] = useState(false);

  // Generar avatar cuando se selecciona username
  useEffect(() => {
    if (selectedUsername) {
      // Si es el username del admin, usar su avatar real
      if (selectedUsername === (user?.username || 'Yo')) {
        setAvatarUrl(user?.avatar || '');
        setSelectedAvatar('admin_real');
      } else {
        generateAvatar(selectedUsername);
      }
    }
  }, [selectedUsername, user]);

  // Generar avatar aleatorio para un username
  const generateAvatar = (username) => {
    const styleIndex = username.length % AVATAR_STYLES.length;
    const style = AVATAR_STYLES[styleIndex];
    const seed = username.toLowerCase().replace(/\s/g, '');
    
    const avatar = createAvatar(style.style, {
      seed: seed,
      size: 128,
    });
    
    const svg = avatar.toString();
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    setAvatarUrl(url);
    setSelectedAvatar(seed);
  };

  // Enviar mensaje normal
  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      toast({
        title: "Error",
        description: "Escribe un mensaje antes de enviar",
        variant: "destructive",
      });
      return;
    }

    if (!selectedUsername) {
      toast({
        title: "Error",
        description: "Selecciona un username",
        variant: "destructive",
      });
      return;
    }

    await sendMessageAsUser(selectedRoom, selectedUsername, messageText, avatarUrl);
    setMessageText('');
  };

  // Enviar respuesta
  const handleSendResponse = async () => {
    if (!responseText.trim()) {
      toast({
        title: "Error",
        description: "Escribe una respuesta antes de enviar",
        variant: "destructive",
      });
      return;
    }

    if (!selectedUsername) {
      toast({
        title: "Error",
        description: "Selecciona un username",
        variant: "destructive",
      });
      return;
    }

    await sendMessageAsUser(selectedRoom, selectedUsername, responseText, avatarUrl);
    setResponseText('');
  };

  // Enviar mensaje como otro usuario
  const sendMessageAsUser = async (roomId, username, content, avatar) => {
    setIsSending(true);
    try {
      // Si el username es el del admin, usar su userId real
      // Si no, generar un userId de bot que pase las reglas de Firestore
      const isAdminUsername = username === (user?.username || 'Yo');
      const userId = isAdminUsername 
        ? user.id 
        : `bot_admin_${username.toLowerCase().replace(/\s/g, '_')}_${Date.now()}`;
      
      const messageData = {
        userId: userId,
        username: username,
        avatar: avatar || generateDefaultAvatar(username),
        content: content.trim(),
        type: 'text',
        timestamp: serverTimestamp(),
        senderUid: user.id, // El admin que está enviando (requerido por reglas)
        trace: {
          origin: 'ADMIN',
          source: 'MESSAGE_GENERATOR',
          actorId: userId,
          actorType: isAdminUsername ? 'ADMIN' : 'ADMIN_GENERATED',
          system: 'adminMessageGenerator',
          traceId: `admin_msg_${Date.now()}`,
          createdAt: Date.now(),
          adminId: user.id,
          adminUsername: user.username
        }
      };

      await sendMessage(roomId, messageData, false);
      
      toast({
        title: "✅ Mensaje enviado",
        description: `Mensaje de ${username} enviado a ${roomsData.find(r => r.id === roomId)?.name || roomId}`,
      });
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el mensaje",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  // Generar avatar por defecto si no hay uno
  const generateDefaultAvatar = (username) => {
    const styleIndex = username.length % AVATAR_STYLES.length;
    const style = AVATAR_STYLES[styleIndex];
    const seed = username.toLowerCase().replace(/\s/g, '');
    
    const avatar = createAvatar(style.style, {
      seed: seed,
      size: 128,
    });
    
    const svg = avatar.toString();
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    return URL.createObjectURL(blob);
  };

  // Insertar respuesta rápida
  const insertQuickResponse = (text) => {
    if (activeTab === 'write') {
      setMessageText(prev => prev ? `${prev} ${text}` : text);
    } else {
      setResponseText(prev => prev ? `${prev} ${text}` : text);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect p-6 rounded-lg border border-purple-500/30"
      >
        <div className="flex items-center gap-3 mb-6">
          <MessageSquare className="w-6 h-6 text-purple-400" />
          <h2 className="text-2xl font-bold text-white">Generador de Mensajes</h2>
        </div>

        {/* Selector de Sala */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-sm font-medium text-purple-300 mb-2 block">
              <Hash className="w-4 h-4 inline mr-2" />
              Sala de Chat
            </label>
            <Select value={selectedRoom} onValueChange={setSelectedRoom}>
              <SelectTrigger className="bg-background/50 border-purple-500/30">
                <SelectValue placeholder="Selecciona una sala" />
              </SelectTrigger>
              <SelectContent>
                {roomsData.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selector de Username */}
          <div>
            <label className="text-sm font-medium text-purple-300 mb-2 block">
              <User className="w-4 h-4 inline mr-2" />
              Username
            </label>
            <Select value={selectedUsername} onValueChange={setSelectedUsername}>
              <SelectTrigger className="bg-background/50 border-purple-500/30">
                <SelectValue placeholder="Selecciona un username" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={user?.username || 'Yo'}>
                  {user?.username || 'Yo'} (Tú)
                </SelectItem>
                {COMMON_USERNAMES.map((username) => (
                  <SelectItem key={username} value={username}>
                    {username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Preview de Avatar y Username */}
        {selectedUsername && (
          <div className="flex items-center gap-3 mb-6 p-4 bg-background/30 rounded-lg border border-purple-500/20">
            <Avatar className="w-12 h-12 border-2 border-purple-400">
              <AvatarImage src={avatarUrl} alt={selectedUsername} />
              <AvatarFallback>{selectedUsername[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-white">{selectedUsername}</p>
              <p className="text-sm text-purple-300">
                {selectedUsername === (user?.username || 'Yo') ? 'Tu cuenta' : 'Usuario ficticio'}
              </p>
            </div>
          </div>
        )}

        {/* Tabs: Escritura y Respuesta */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="write">
              <MessageSquare className="w-4 h-4 mr-2" />
              Escritura
            </TabsTrigger>
            <TabsTrigger value="response">
              <Reply className="w-4 h-4 mr-2" />
              Respuesta
            </TabsTrigger>
          </TabsList>

          {/* Tab: Escritura Normal */}
          <TabsContent value="write" className="space-y-4">
            <div>
              <label className="text-sm font-medium text-purple-300 mb-2 block">
                Mensaje
              </label>
              <Textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Escribe tu mensaje aquí..."
                className="bg-background/50 border-purple-500/30 min-h-[120px] text-white"
                rows={4}
              />
            </div>

            <Button
              onClick={handleSendMessage}
              disabled={isSending || !messageText.trim() || !selectedUsername}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSending ? 'Enviando...' : 'Enviar Mensaje'}
            </Button>
          </TabsContent>

          {/* Tab: Respuesta */}
          <TabsContent value="response" className="space-y-4">
            <div>
              <label className="text-sm font-medium text-purple-300 mb-2 block">
                Respuesta
              </label>
              <Textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Escribe una respuesta a una conversación existente..."
                className="bg-background/50 border-purple-500/30 min-h-[120px] text-white"
                rows={4}
              />
            </div>

            <Button
              onClick={handleSendResponse}
              disabled={isSending || !responseText.trim() || !selectedUsername}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <Reply className="w-4 h-4 mr-2" />
              {isSending ? 'Enviando...' : 'Enviar Respuesta'}
            </Button>
          </TabsContent>
        </Tabs>

        {/* Respuestas Rápidas */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Respuestas Rápidas</h3>
          </div>

          <div className="space-y-3">
            {Object.entries(QUICK_RESPONSES).map(([category, responses]) => (
              <div key={category}>
                <p className="text-sm font-medium text-purple-300 mb-2 capitalize">
                  {category === 'greetings' && 'Saludos'}
                  {category === 'searches' && 'Búsquedas'}
                  {category === 'responses' && 'Respuestas'}
                  {category === 'explicit' && 'Explícito'}
                  {category === 'locations' && 'Ubicaciones'}
                  {category === 'scort' && 'Scort'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {responses.map((response, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="cursor-pointer hover:bg-purple-500/20 border-purple-500/30 text-purple-200"
                      onClick={() => insertQuickResponse(response)}
                    >
                      <Smile className="w-3 h-3 mr-1" />
                      {response}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MessageGenerator;

