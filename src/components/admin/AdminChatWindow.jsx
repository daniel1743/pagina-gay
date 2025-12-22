import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createSystemNotification, NOTIFICATION_TYPES } from '@/services/systemNotificationsService';

/**
 * Componente de chat tipo WhatsApp para administradores
 * Permite chatear directamente con usuarios que han reportado casos
 */
const AdminChatWindow = ({ isOpen, onClose, targetUserId, targetUsername, targetAvatar, reportId }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isUserActive, setIsUserActive] = useState(true);
  const [validatedUsername, setValidatedUsername] = useState(targetUsername || '');
  const [isLoadingUsername, setIsLoadingUsername] = useState(false);
  const messagesEndRef = useRef(null);

  // ✅ CRÍTICO: Validar y obtener nombre de usuario OBLIGATORIO
  useEffect(() => {
    if (!isOpen || !targetUserId) return;

    const validateAndGetUsername = async () => {
      // Si ya tenemos un username válido, usarlo
      if (targetUsername && targetUsername.trim()) {
        setValidatedUsername(targetUsername.trim());
        return;
      }

      // Si no hay username, obtenerlo de Firestore
      setIsLoadingUsername(true);
      try {
        const userDocRef = doc(db, 'users', targetUserId);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const username = userData.username || userData.displayName || null;
          
          if (username && username.trim()) {
            setValidatedUsername(username.trim());
          } else {
            // Si no hay username, cerrar el chat y mostrar error
            console.error('Usuario sin nombre de usuario:', targetUserId);
            onClose();
            return;
          }
        } else {
          // Si no existe el usuario, intentar obtenerlo del reporte
          if (reportId) {
            const reportDocRef = doc(db, 'reports', reportId);
            const reportDoc = await getDoc(reportDocRef);
            if (reportDoc.exists()) {
              const reportData = reportDoc.data();
              const username = reportData.reporterUsername || null;
              if (username && username.trim()) {
                setValidatedUsername(username.trim());
              } else {
                console.error('No se pudo obtener nombre de usuario del reporte');
                onClose();
                return;
              }
            }
          }
        }
      } catch (error) {
        console.error('Error validando nombre de usuario:', error);
        onClose();
      } finally {
        setIsLoadingUsername(false);
      }
    };

    validateAndGetUsername();
  }, [isOpen, targetUserId, targetUsername, reportId, onClose]);

  // ✅ MEJORADO: ID de chat más simple y consistente
  // Ordenar IDs para que admin-user y user-admin sean el mismo chat
  const chatIds = [user?.id, targetUserId].sort();
  const chatId = `admin_chat_${chatIds[0]}_${chatIds[1]}`;

  // ✅ NUEVO: Verificar si el usuario está activo cuando se abre el chat
  useEffect(() => {
    if (!isOpen || !targetUserId) return;

    const checkUserActivity = async () => {
      try {
        // Verificar si el usuario está en alguna sala activa (últimos 5 minutos)
        const roomsRef = collection(db, 'roomPresence');
        const roomsSnapshot = await getDocs(roomsRef);
        
        let userFound = false;
        const now = Date.now();
        const ACTIVE_THRESHOLD = 5 * 60 * 1000; // 5 minutos

        for (const roomDoc of roomsSnapshot.docs) {
          const usersRef = collection(db, 'roomPresence', roomDoc.id, 'users');
          const userDoc = await getDoc(doc(usersRef, targetUserId));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const lastSeen = userData.lastSeen?.toMillis?.() || 0;
            if (lastSeen && (now - lastSeen) <= ACTIVE_THRESHOLD) {
              userFound = true;
              break;
            }
          }
        }

        setIsUserActive(userFound);

        // Si el usuario no está activo, enviar notificación
        if (!userFound) {
          try {
            await createSystemNotification(targetUserId, {
              type: NOTIFICATION_TYPES.ANNOUNCEMENT,
              title: '💬 Mensaje de Administrador',
              message: `Un administrador quiere chatear contigo sobre tu reporte. Haz clic aquí para abrir el chat de soporte.`,
              icon: '💬',
              link: `/admin-chat?chatId=${chatId}`,
              priority: 'high',
              createdBy: user?.id || 'system',
            });
          } catch (error) {
            console.error('Error enviando notificación:', error);
          }
        }
      } catch (error) {
        console.error('Error verificando actividad del usuario:', error);
      }
    };

    checkUserActivity();
  }, [isOpen, targetUserId, chatId, user?.id]);

  // Suscribirse a mensajes en tiempo real (solo si tenemos username validado)
  useEffect(() => {
    if (!isOpen || !targetUserId || !chatId || !validatedUsername || isLoadingUsername) return;

    // Asegurar que el documento del chat existe (solo si tenemos username validado)
    if (validatedUsername) {
      const chatDocRef = doc(db, 'adminChats', chatId);
      setDoc(chatDocRef, {
        participants: [user?.id, targetUserId],
        adminId: user?.id,
        adminUsername: user?.username || 'Admin',
        userId: targetUserId,
        username: validatedUsername, // ✅ CRÍTICO: Guardar username para identificación
        reportId: reportId || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true }).catch(err => {
        // Ignorar error si ya existe
        if (err.code !== 'permission-denied') {
          console.error('Error creando chat:', err);
        }
      });
    }

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
      // Ignorar AbortError (normal cuando se cancela)
      if (error.name !== 'AbortError' && error.code !== 'cancelled') {
        console.error('Error suscribiéndose a mensajes:', error);
      }
    });

    return () => unsubscribe();
  }, [isOpen, targetUserId, chatId, user?.id, reportId, validatedUsername, isLoadingUsername]);

  // Scroll automático al final
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Enviar mensaje (solo si tenemos username validado)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending || !validatedUsername) return;

    setIsSending(true);
    try {
      const messagesRef = collection(db, 'adminChats', chatId, 'messages');
      await addDoc(messagesRef, {
        senderId: user.id,
        senderUsername: user.username || 'Admin', // ✅ Asegurar que admin tenga username
        senderAvatar: user.avatar,
        isAdmin: true,
        recipientId: targetUserId,
        recipientUsername: validatedUsername, // ✅ Username del usuario objetivo (OBLIGATORIO)
        content: newMessage.trim(),
        timestamp: serverTimestamp(),
        reportId: reportId || null,
      });

      // Actualizar el documento del chat con el username validado
      const chatDocRef = doc(db, 'adminChats', chatId);
      await setDoc(chatDocRef, {
        userId: targetUserId,
        username: validatedUsername, // ✅ Guardar username para referencia futura
        updatedAt: serverTimestamp(),
      }, { merge: true });

      setNewMessage('');
    } catch (error) {
      console.error('Error enviando mensaje:', error);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  // ✅ Validación: No mostrar chat si no hay username
  if (!validatedUsername && !isLoadingUsername) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed bottom-4 right-4 w-96 max-h-[85vh] bg-card border-2 border-primary/30 rounded-2xl shadow-2xl flex flex-col z-[9999]"
        style={{ height: '600px' }}
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
              <h3 className="font-semibold text-foreground">
                {validatedUsername || targetUsername || 'Usuario'}
                {isLoadingUsername && <span className="text-xs text-muted-foreground ml-2">(cargando...)</span>}
              </h3>
              <p className="text-xs text-muted-foreground">
                ID: {targetUserId?.substring(0, 8)}... | {' '}
                {isUserActive ? (
                  <span className="text-green-400">● Activo</span>
                ) : (
                  <span className="text-gray-400">○ Inactivo</span>
                )}
              </p>
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
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background/50 min-h-0">
          {isLoadingUsername ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground mb-3 animate-pulse" />
              <p className="text-sm text-muted-foreground">
                Validando usuario...
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Inicia la conversación con {validatedUsername}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Usuario identificado: {validatedUsername}
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
              placeholder={`Escribe un mensaje a ${validatedUsername || 'usuario'}...`}
              className="flex-1"
              disabled={isSending || !validatedUsername || isLoadingUsername}
            />
            <Button
              type="submit"
              disabled={!newMessage.trim() || isSending || !validatedUsername || isLoadingUsername}
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

