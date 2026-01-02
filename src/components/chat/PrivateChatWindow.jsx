import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, X, Shield, PhoneOff, User, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/use-toast';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';

const PrivateChatWindow = ({ user, partner, onClose, chatId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Suscribirse a mensajes en tiempo real
  useEffect(() => {
    if (!chatId) return;

    const messagesRef = collection(db, 'private_chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
      }));
      setMessages(newMessages);
    }, (error) => {
      console.error('Error subscribing to private chat messages:', error);
    });

    return () => unsubscribe();
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !chatId) return;

    try {
      const messagesRef = collection(db, 'private_chats', chatId, 'messages');

      await addDoc(messagesRef, {
        userId: user.id,
        username: user.username,
        avatar: user.avatar,
        content: newMessage.trim(),
        type: 'text',
        timestamp: serverTimestamp(),
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending private message:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive",
      });
    }
  };

  // ✅ Función para enviar mensaje de sistema cuando termina el chat
  const sendLeaveNotification = async () => {
    if (!chatId) return;

    try {
      const messagesRef = collection(db, 'private_chats', chatId, 'messages');

      await addDoc(messagesRef, {
        userId: 'system',
        username: 'Sistema',
        avatar: '',
        content: `${user.username} ha terminado la conversación`,
        type: 'system',
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error sending leave notification:', error);
      // No mostrar error al usuario, solo loguearlo
    }
  };

  const handleBlockUser = () => {
    sendLeaveNotification(); // Notificar antes de bloquear (fire and forget)
    toast({
        title: `Has bloqueado a ${partner.username}`,
        description: 'No recibirás más mensajes de este usuario.',
        variant: 'destructive',
    });
    onClose();
  };

  const handleVisitProfile = () => {
    toast({ title: `🚧 Pronto podrás visitar el perfil de ${partner.username}` });
  };

  const handleLeaveChat = () => {
    sendLeaveNotification(); // Notificar antes de salir (fire and forget)
    toast({ title: `Has abandonado el chat con ${partner.username}` });
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={(isOpen) => {
      if (!isOpen) {
        // Solo enviar notificación si realmente se está cerrando
        sendLeaveNotification();
        onClose();
      }
    }}>
      <DialogContent
        className="p-0 max-w-[360px] h-[480px] flex flex-col gap-0 bg-card border rounded-lg shadow-2xl overflow-hidden"
      >
        {/* ✅ Títulos ocultos para accesibilidad */}
        <VisuallyHidden>
          <DialogTitle>Chat privado con {partner.username}</DialogTitle>
          <DialogDescription>
            Conversación privada entre tú y {partner.username}
          </DialogDescription>
        </VisuallyHidden>
      <header className="bg-secondary p-3 flex items-center justify-between shrink-0 rounded-t-lg">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={partner.avatar} alt={partner.username} />
            <AvatarFallback>{partner.username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="font-bold text-foreground">{partner.username}</span>
        </div>
        <div className="flex items-center gap-1">
           <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground"><MoreVertical className="w-5 h-5"/></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border text-foreground">
                <DropdownMenuItem onClick={handleVisitProfile}><User className="w-4 h-4 mr-2"/>Visitar Perfil</DropdownMenuItem>
                <DropdownMenuItem onClick={handleBlockUser} className="text-red-500 focus:text-red-500"><Shield className="w-4 h-4 mr-2"/>Bloquear Usuario</DropdownMenuItem>
                <DropdownMenuItem onClick={handleLeaveChat}><PhoneOff className="w-4 h-4 mr-2"/>Dejar Chat</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              sendLeaveNotification();
              onClose();
            }}
            className="w-8 h-8 text-muted-foreground"
            title="Cerrar chat"
          >
            <X className="w-5 h-5"/>
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-hide">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <p className="text-muted-foreground text-sm mb-2">
              No hay mensajes aún
            </p>
            <p className="text-muted-foreground/70 text-xs">
              Envía el primer mensaje para comenzar la conversación
            </p>
          </div>
        ) : (
         <AnimatePresence>
            {messages.map((msg) => {
                const isOwn = msg.userId === user.id;
                const isSystem = msg.type === 'system';

                // Mensaje de sistema (notificación de que alguien terminó el chat)
                if (isSystem) {
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex justify-center my-2"
                    >
                      <div className="px-3 py-1.5 rounded-full bg-muted/50 border border-border">
                        <p className="text-xs text-muted-foreground text-center">
                          {msg.content}
                        </p>
                      </div>
                    </motion.div>
                  );
                }

                // Mensaje normal
                return (
                    <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                         <div className={`
                           px-4 py-2 rounded-2xl max-w-[75%] break-words
                           ${isOwn
                             ? 'magenta-gradient text-white'
                             : 'bg-secondary text-foreground border border-border'
                           }
                         `}>
                            <p className="text-sm">{msg.content}</p>
                         </div>
                    </motion.div>
                );
            })}
         </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-3 border-t shrink-0">
        <div className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe un mensaje privado..."
            className="flex-1 bg-secondary border-input rounded-full px-4 focus:border-accent"
          />
          <Button type="submit" size="icon" className="rounded-full magenta-gradient text-white">
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </form>
      </DialogContent>
    </Dialog>
  );
};

export default PrivateChatWindow;