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
} from 'firebase/firestore';
import { db, auth } from '@/config/firebase';

/**
 * Envía un mensaje a una sala de chat
 * Para usuarios anónimos, usa transacción para incrementar contador
 */
export const sendMessage = async (roomId, messageData, isAnonymous = false) => {
  try {
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

    if (isAnonymous && auth.currentUser) {
      // Para usuarios anónimos: usar transacción para incrementar contador
      const result = await runTransaction(db, async (transaction) => {
        const guestRef = doc(db, 'guests', auth.currentUser.uid);
        const guestDoc = await transaction.get(guestRef);

        const currentCount = guestDoc.exists() ? (guestDoc.data().messageCount || 0) : 0;

        // Incrementar contador
        transaction.set(guestRef, { messageCount: currentCount + 1 }, { merge: true });

        // Crear mensaje
        const newMessageRef = doc(messagesRef);
        transaction.set(newMessageRef, message);

        return { id: newMessageRef.id, ...message };
      });

      return result;
    } else {
      // Para usuarios registrados: crear mensaje directamente
      const docRef = await addDoc(messagesRef, message);
      return { id: docRef.id, ...message };
    }
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Suscribe a mensajes de una sala en tiempo real
 */
export const subscribeToRoomMessages = (roomId, callback) => {
  const messagesRef = collection(db, 'rooms', roomId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
    }));
    callback(messages);
  }, (error) => {
    console.error('Error subscribing to messages:', error);
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
