import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

/**
 * Componente de chat tipo WhatsApp para administradores
 * Permite chatear directamente con usuarios que han reportado casos
 */
const AdminChatWindow = ({ isOpen, onClose, targetUserId, targetUsername, targetAvatar, reportId }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Crear ID único para la conversación (admin + usuario reportante)
  const chatId = `admin_chat_${user?.id}_${targetUserId}`;

  // Suscribirse a mensajes en tiempo real
  useEffect(() => {
    if (!isOpen || !targetUserId) return;

    const messagesRef = collection(db, 'adminChats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || new Date(),
      }));
      setMessages(chatMessages);
    }, (error) => {
      console.error('Error suscribiéndose a mensajes:', error);
    });

    return () => unsubscribe();
  }, [isOpen, targetUserId, chatId]);

  // Scroll automático al final
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Enviar mensaje
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const messagesRef = collection(db, 'adminChats', chatId, 'messages');
      await addDoc(messagesRef, {
        senderId: user.id,
        senderUsername: user.username,
        senderAvatar: user.avatar,
        isAdmin: true,
        content: newMessage.trim(),
        timestamp: serverTimestamp(),
        reportId: reportId || null,
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error enviando mensaje:', error);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed bottom-4 right-4 w-96 h-[600px] bg-card border-2 border-primary/30 rounded-2xl shadow-2xl flex flex-col z-50"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/20 to-accent/20 p-4 rounded-t-2xl border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border-2 border-primary">
              <AvatarImage src={targetAvatar} alt={targetUsername} />
              <AvatarFallback className="bg-secondary">
                {targetUsername?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-foreground">{targetUsername}</h3>
              <p className="text-xs text-muted-foreground">Chat de soporte</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background/50">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Inicia la conversación con {targetUsername}
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isAdmin = msg.isAdmin || msg.senderId === user?.id;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                      isAdmin
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-muted text-foreground rounded-bl-sm'
                    }`}
                  >
                    {!isAdmin && (
                      <p className="text-xs font-semibold mb-1 opacity-80">
                        {msg.senderUsername}
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString('es-CL', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-card">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1"
              disabled={isSending}
            />
            <Button
              type="submit"
              disabled={!newMessage.trim() || isSending}
              className="bg-primary hover:bg-primary/90"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </motion.div>
    </AnimatePresence>
  );
};

export default AdminChatWindow;

