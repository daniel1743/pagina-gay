import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  updateDoc,
  increment,
  runTransaction,
  setDoc,
  getDoc,
  getDocs,
  where,
  limit,
  limitToLast,
} from 'firebase/firestore';
import { db, auth } from '@/config/firebase';
import { trackMessageSent, trackFirstMessage } from '@/services/ga4Service';

/**
 * Envía un mensaje a una sala de chat
 * Para usuarios anónimos, usa transacción para incrementar contador
 * ✅ AÑADIDO 2025-12-11: Rate limiting implementado (máx 1 mensaje cada 2 segundos)
 */
export const sendMessage = async (roomId, messageData, isAnonymous = false) => {
  try {
    // ✅ Rate Limiting: Verificar última vez que envió mensaje
    const rateLimitKey = `lastMessage_${messageData.userId}`;
    const lastMessageTime = parseInt(localStorage.getItem(rateLimitKey) || '0');
    const now = Date.now();
    const timeSinceLastMessage = now - lastMessageTime;

    // Permitir máximo 1 mensaje cada 2 segundos (30 mensajes/minuto)
    if (timeSinceLastMessage < 2000) {
      const waitTime = Math.ceil((2000 - timeSinceLastMessage) / 1000);
      throw new Error(`Por favor espera ${waitTime} segundo(s) antes de enviar otro mensaje.`);
    }

    // Actualizar timestamp del último mensaje
    localStorage.setItem(rateLimitKey, now.toString());

    const messagesRef = collection(db, 'rooms', roomId, 'messages');

    const message = {
      userId: messageData.userId,
      username: messageData.username,
      avatar: messageData.avatar,
      isPremium: messageData.isPremium || false,
      content: messageData.content,
      type: messageData.type || 'text',
      timestamp: serverTimestamp(),
      reactions: { like: 0, dislike: 0 },
      read: false, // Para doble check
    };

    // Verificar si es el primer mensaje del usuario (para GA4)
    const firstMessageKey = `firstMessage_${messageData.userId}`;
    const hasSeenFirstMessage = localStorage.getItem(firstMessageKey);

    if (isAnonymous && auth.currentUser) {
      // OPTIMIZACIÓN: Enviar mensaje primero (rápido), actualizar contador después (asíncrono)
      const docRef = await addDoc(messagesRef, message);

      // Actualizar contador en segundo plano sin bloquear
      setDoc(
        doc(db, 'guests', auth.currentUser.uid),
        { messageCount: increment(1), lastMessageAt: serverTimestamp() },
        { merge: true }
      ).catch(err => console.error('Error updating guest count:', err));

      // Track GA4: primer mensaje si no se ha enviado antes
      if (!hasSeenFirstMessage) {
        trackFirstMessage({
          userId: messageData.userId,
          roomId: roomId,
          roomName: 'unknown' // Se puede pasar desde el componente si es necesario
        });
        localStorage.setItem(firstMessageKey, 'true');
      } else {
        trackMessageSent({
          userId: messageData.userId,
          roomId: roomId,
          roomName: 'unknown'
        });
      }

      return { id: docRef.id, ...message };
    } else {
      // Para usuarios registrados: crear mensaje directamente
      const docRef = await addDoc(messagesRef, message);

      // ✅ Incrementar contador de mensajes para usuarios registrados (para sistema de recompensas)
      if (messageData.userId && !isAnonymous) {
        const userRef = doc(db, 'users', messageData.userId);
        updateDoc(userRef, {
          messageCount: increment(1),
          lastMessageAt: serverTimestamp(),
        }).catch(err => console.error('Error updating user message count:', err));
      }

      // Track GA4: primer mensaje si no se ha enviado antes
      if (!hasSeenFirstMessage) {
        trackFirstMessage({
          userId: messageData.userId,
          roomId: roomId,
          roomName: 'unknown'
        });
        localStorage.setItem(firstMessageKey, 'true');
      } else {
        trackMessageSent({
          userId: messageData.userId,
          roomId: roomId,
          roomName: 'unknown'
        });
      }

      return { id: docRef.id, ...message };
    }
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Suscribe a mensajes de una sala en tiempo real
 * ✅ ACTUALIZADO: Carga los últimos 100 mensajes para mejor experiencia
 */
export const subscribeToRoomMessages = (roomId, callback, messageLimit = 100) => {
  const messagesRef = collection(db, 'rooms', roomId, 'messages');

  // limitToLast obtiene los últimos N documentos ordenados por timestamp
  const q = query(
    messagesRef,
    orderBy('timestamp', 'asc'),
    limitToLast(messageLimit)
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
    }));
    callback(messages);
  }, (error) => {
    // ✅ Ignorar AbortError (normal cuando se cancela una suscripción)
    if (error.name === 'AbortError' || error.code === 'cancelled') {
      // No hacer nada, la suscripción fue cancelada intencionalmente
      return;
    }
    console.error('Error subscribing to messages:', error);
    callback([]);
  });
};

/**
 * Añade reacción a un mensaje
 */
export const addReactionToMessage = async (roomId, messageId, reactionType) => {
  try {
    const messageRef = doc(db, 'rooms', roomId, 'messages', messageId);

    await updateDoc(messageRef, {
      [`reactions.${reactionType}`]: increment(1)
    });
  } catch (error) {
    console.error('Error adding reaction:', error);
    throw error;
  }
};

/**
 * Marca mensajes como leídos (doble check)
 * Marca todos los mensajes de la sala que NO sean del usuario actual
 */
export const markMessagesAsRead = async (roomId, currentUserId) => {
  try {
    const messagesRef = collection(db, 'rooms', roomId, 'messages');
    const q = query(
      messagesRef,
      where('read', '==', false),
      where('userId', '!=', currentUserId)
    );

    const snapshot = await getDocs(q);

    // Actualizar en lotes (batch) para mejor performance
    const batch = [];
    snapshot.docs.forEach(doc => {
      batch.push(updateDoc(doc.ref, { read: true }));
    });

    await Promise.all(batch);
  } catch (error) {
    // Error silencioso - no es crítico si falla
    console.error('Error marking messages as read:', error);
  }
};

/**
 * Crea mensaje de bienvenida de sistema (solo una vez)
 */
export const createWelcomeMessage = async (roomId, welcomeText) => {
  try {
    const messagesRef = collection(db, 'rooms', roomId, 'messages');

    const welcomeMessage = {
      userId: 'system',
      username: 'Chactivo',
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=Chactivo`,
      content: welcomeText,
      type: 'system',
      timestamp: serverTimestamp(),
      reactions: {},
    };

    await addDoc(messagesRef, welcomeMessage);
  } catch (error) {
    console.error('Error creating welcome message:', error);
    throw error;
  }
};
