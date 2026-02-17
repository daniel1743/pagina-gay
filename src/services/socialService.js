import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  orderBy,
  setDoc,
  limit,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { isBlockedBetween } from '@/services/blockService';

/**
 * Envía un mensaje directo a otro usuario
 * El mensaje aparece en las notificaciones del destinatario
 */
export const sendDirectMessage = async (fromUserId, toUserId, content) => {
  try {
    const blocked = await isBlockedBetween(fromUserId, toUserId);
    if (blocked) {
      throw new Error('BLOCKED');
    }

    // Obtener datos del remitente
    const fromUserDoc = await getDoc(doc(db, 'users', fromUserId));
    const fromUserData = fromUserDoc.data();

    const messageData = {
      from: fromUserId,
      fromUsername: fromUserData?.username || 'Usuario',
      fromAvatar: fromUserData?.avatar || '',
      fromIsPremium: fromUserData?.isPremium || false,
      to: toUserId,
      content,
      type: 'direct_message',
      read: false,
      timestamp: serverTimestamp(),
    };

    // Guardar en la colección de notificaciones del destinatario
    await addDoc(collection(db, 'users', toUserId, 'notifications'), messageData);

    // También guardar en la bandeja de enviados del remitente
    await addDoc(collection(db, 'users', fromUserId, 'sent_messages'), {
      ...messageData,
      read: true, // El remitente ya lo "leyó" porque lo envió
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending direct message:', error);
    throw error;
  }
};

/**
 * Envía una solicitud de chat privado
 * La solicitud aparece en las notificaciones del destinatario con opciones Aceptar/Rechazar
 */
export const sendPrivateChatRequest = async (fromUserId, toUserId) => {
  try {
    const blocked = await isBlockedBetween(fromUserId, toUserId);
    if (blocked) {
      throw new Error('BLOCKED');
    }

    // Obtener datos del remitente
    const fromUserDoc = await getDoc(doc(db, 'users', fromUserId));
    const fromUserData = fromUserDoc.data();

    const requestData = {
      from: fromUserId,
      fromUsername: fromUserData?.username || 'Usuario',
      fromAvatar: fromUserData?.avatar || '',
      fromIsPremium: fromUserData?.isPremium || false,
      to: toUserId,
      content: `${fromUserData?.username || 'Un usuario'} quiere conectar contigo en chat privado`,
      type: 'private_chat_request',
      status: 'pending', // pending | accepted | rejected
      read: false,
      timestamp: serverTimestamp(),
    };

    // Guardar en notificaciones del destinatario
    const notificationRef = await addDoc(
      collection(db, 'users', toUserId, 'notifications'),
      requestData
    );

    return { success: true, requestId: notificationRef.id };
  } catch (error) {
    console.error('Error sending private chat request:', error);
    throw error;
  }
};

/**
 * Crear u obtener chat privado directo entre dos usuarios
 * Sin solicitud previa (flujo rápido desde Baúl)
 */
export const getOrCreatePrivateChat = async (userAId, userBId) => {
  if (!userAId || !userBId) {
    throw new Error('Missing user ids');
  }
  if (userAId === userBId) {
    throw new Error('Cannot create chat with self');
  }
  const blocked = await isBlockedBetween(userAId, userBId);
  if (blocked) {
    throw new Error('BLOCKED');
  }

  const chatsRef = collection(db, 'private_chats');
  const q = query(
    chatsRef,
    where('participants', 'array-contains', userAId),
    limit(50)
  );

  const snapshot = await getDocs(q);
  const existing = snapshot.docs.find((docSnap) => {
    const data = docSnap.data();
    return Array.isArray(data.participants) && data.participants.includes(userBId);
  });

  if (existing) {
    return { chatId: existing.id, created: false };
  }

  const sortedIds = [userAId, userBId].sort();
  const chatId = `${sortedIds[0]}_${sortedIds[1]}`;
  const chatRef = doc(chatsRef, chatId);

  await setDoc(chatRef, {
    participants: sortedIds,
    createdAt: serverTimestamp(),
    lastMessage: null,
    active: true,
  });

  return { chatId, created: true };
};

/**
 * Envía un mensaje dentro de un chat privado existente
 */
export const sendMessageToPrivateChat = async (chatId, { userId, username, avatar, content }) => {
  if (!chatId || !userId || !content?.trim()) {
    throw new Error('Missing chatId, userId or content');
  }
  const messagesRef = collection(db, 'private_chats', chatId, 'messages');
  await addDoc(messagesRef, {
    userId,
    username: username || 'Usuario',
    avatar: avatar || '',
    content: content.trim(),
    type: 'text',
    timestamp: serverTimestamp(),
  });
};

/**
 * Deja un comentario de perfil a otro usuario
 * Se entrega como notificación específica al destinatario
 */
export const sendProfileComment = async (fromUserId, toUserId, content) => {
  try {
    const blocked = await isBlockedBetween(fromUserId, toUserId);
    if (blocked) {
      throw new Error('BLOCKED');
    }

    const fromUserDoc = await getDoc(doc(db, 'users', fromUserId));
    const fromUserData = fromUserDoc.data();

    const commentData = {
      from: fromUserId,
      fromUsername: fromUserData?.username || 'Usuario',
      fromAvatar: fromUserData?.avatar || '',
      fromIsPremium: fromUserData?.isPremium || false,
      to: toUserId,
      content,
      type: 'profile_comment',
      read: false,
      timestamp: serverTimestamp(),
    };

    await addDoc(collection(db, 'users', toUserId, 'notifications'), commentData);
    await addDoc(collection(db, 'users', fromUserId, 'sent_messages'), {
      ...commentData,
      read: true,
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending profile comment:', error);
    throw error;
  }
};

/**
 * Actualiza el estado "escribiendo..." en chat privado
 * Se guarda en /private_chats/{chatId}/typing/{userId}
 */
export const updatePrivateChatTypingStatus = async (
  chatId,
  userId,
  isTyping,
  username = 'Usuario'
) => {
  if (!chatId || !userId) return;

  // Usar roomPresence para evitar dependencia de nuevas reglas en private_chats/typing
  const typingRef = doc(db, 'roomPresence', `private_${chatId}`, 'users', userId);

  if (isTyping) {
    await setDoc(
      typingRef,
      {
        userId,
        username,
        isTyping: true,
        typingChatId: chatId,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return;
  }

  // Cuando deja de escribir, eliminamos el documento para evitar "ghost typing"
  await deleteDoc(typingRef).catch(() => {});
};

/**
 * Suscribe estados de escritura de otros participantes
 */
export const subscribeToPrivateChatTyping = (chatId, currentUserId, callback) => {
  if (!chatId) {
    callback([]);
    return () => {};
  }

  const typingRef = collection(db, 'roomPresence', `private_${chatId}`, 'users');
  const STALE_MS = 10000;

  return onSnapshot(
    typingRef,
    (snapshot) => {
      const now = Date.now();
      const typingUsers = snapshot.docs
        .map((docSnap) => {
          const data = docSnap.data() || {};
          const updatedAtMs = data.updatedAt?.toMillis?.() || 0;
          return {
            id: docSnap.id,
            userId: data.userId || docSnap.id,
            username: data.username || 'Usuario',
            isTyping: data.isTyping === true,
            updatedAtMs,
          };
        })
        .filter((item) => item.userId !== currentUserId)
        .filter((item) => item.isTyping)
        .filter((item) => !item.updatedAtMs || now - item.updatedAtMs <= STALE_MS);

      callback(typingUsers);
    },
    (error) => {
      const isTransientError =
        error?.name === 'AbortError' ||
        error?.code === 'cancelled' ||
        error?.code === 'unavailable' ||
        error?.message?.includes('WebChannelConnection') ||
        error?.message?.includes('transport errored');

      if (!isTransientError) {
        console.error('Error subscribing to private chat typing:', error);
      }
      callback([]);
    }
  );
};

/**
 * Responde a una solicitud de chat privado
 */
export const respondToPrivateChatRequest = async (
  userId,
  notificationId,
  accepted
) => {
  try {
    const notificationRef = doc(db, 'users', userId, 'notifications', notificationId);

    await updateDoc(notificationRef, {
      status: accepted ? 'accepted' : 'rejected',
      read: true,
      respondedAt: serverTimestamp(),
    });

    // Si fue aceptada, crear la sala de chat privado
    if (accepted) {
      const notificationDoc = await getDoc(notificationRef);
      const notificationData = notificationDoc.data();
      const blocked = await isBlockedBetween(notificationData.from, userId);
      if (blocked) {
        throw new Error('BLOCKED');
      }

      // Crear sala de chat privado con ambos usuarios
      const privateChatRef = doc(collection(db, 'private_chats'));
      await setDoc(privateChatRef, {
        participants: [notificationData.from, userId],
        createdAt: serverTimestamp(),
        lastMessage: null,
        active: true,
      });

      // Obtener datos del usuario que aceptó
      const acceptedUserDoc = await getDoc(doc(db, 'users', userId));
      const acceptedUserData = acceptedUserDoc.data();

      // Enviar notificación al usuario que envió la solicitud original
      // para que se le abra automáticamente la ventana de chat
      await addDoc(collection(db, 'users', notificationData.from, 'notifications'), {
        from: userId,
        fromUsername: acceptedUserData?.username || 'Usuario',
        fromAvatar: acceptedUserData?.avatar || '',
        fromIsPremium: acceptedUserData?.isPremium || false,
        to: notificationData.from,
        type: 'private_chat_accepted',
        chatId: privateChatRef.id,
        read: false,
        timestamp: serverTimestamp(),
      });

      return { success: true, chatId: privateChatRef.id };
    }

    return { success: true };
  } catch (error) {
    console.error('Error responding to private chat request:', error);
    throw error;
  }
};

/**
 * Agrega un usuario a favoritos (máximo 15)
 */
export const addToFavorites = async (userId, targetUserId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const currentFavorites = userDoc.data()?.favorites || [];

    if (currentFavorites.length >= 15) {
      throw new Error('FAVORITES_LIMIT_REACHED');
    }

    await updateDoc(userRef, {
      favorites: arrayUnion(targetUserId),
    });

    return { success: true };
  } catch (error) {
    console.error('Error adding to favorites:', error);
    throw error;
  }
};

/**
 * Elimina un usuario de favoritos
 */
export const removeFromFavorites = async (userId, targetUserId) => {
  try {
    const userRef = doc(db, 'users', userId);

    await updateDoc(userRef, {
      favorites: arrayRemove(targetUserId),
    });

    return { success: true };
  } catch (error) {
    console.error('Error removing from favorites:', error);
    throw error;
  }
};

/**
 * Suscribe a las notificaciones del usuario en tiempo real
 */
export const subscribeToNotifications = (userId, callback) => {
  const notificationsRef = collection(db, 'users', userId, 'notifications');
  const q = query(
    notificationsRef,
    orderBy('timestamp', 'desc'),
    limit(100)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const notifications = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
      }))
      .filter((item) => item.read !== true); // mantener comportamiento de "solo no leídas"

      callback(notifications);
    },
    (error) => {
      // ✅ Ignorar errores transitorios de Firestore WebChannel (errores 400 internos)
      const isTransientError = 
        error.name === 'AbortError' ||
        error.code === 'cancelled' ||
        error.code === 'unavailable' ||
        error.message?.includes('WebChannelConnection') ||
        error.message?.includes('transport errored') ||
        error.message?.includes('RPC') ||
        error.message?.includes('stream') ||
        error.message?.includes('INTERNAL ASSERTION FAILED') ||
        error.message?.includes('Unexpected state');

      if (!isTransientError) {
        console.error('Error subscribing to notifications:', error);
      }
      // Los errores transitorios se ignoran silenciosamente - Firestore se reconectará automáticamente
    }
  );
};

/**
 * Marca una notificación como leída
 */
export const markNotificationAsRead = async (userId, notificationId) => {
  try {
    const notificationRef = doc(db, 'users', userId, 'notifications', notificationId);

    await updateDoc(notificationRef, {
      read: true,
      readAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Obtiene la lista de favoritos del usuario con sus datos
 */
export const getFavorites = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const favoriteIds = userDoc.data()?.favorites || [];

    if (favoriteIds.length === 0) {
      return [];
    }

    // Obtener datos de cada favorito
    const favoritesData = await Promise.all(
      favoriteIds.map(async (favId) => {
        const favDoc = await getDoc(doc(db, 'users', favId));
        return {
          id: favId,
          ...favDoc.data(),
        };
      })
    );

    return favoritesData;
  } catch (error) {
    console.error('Error getting favorites:', error);
    throw error;
  }
};
