import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

  const handleBlockUser = () => {
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
    toast({ title: `Has abandonado el chat con ${partner.username}` });
    onClose();
  }

  return (
    <motion.div
      initial={{ y: "100%", opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: "100%", opacity: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      className="fixed bottom-4 right-4 sm:right-24 w-[360px] h-[480px] bg-card border rounded-t-lg shadow-2xl flex flex-col z-50"
    >
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
          <Button variant="ghost" size="icon" onClick={onClose} className="w-8 h-8 text-muted-foreground"><X className="w-5 h-5"/></Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-hide">
         <AnimatePresence>
            {messages.map((msg) => {
                const isOwn = msg.userId === user.id;
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
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-3 border-t">
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
    </motion.div>
  );
};

export default PrivateChatWindow;