import {
  collection,
  addDoc,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  getDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  setDoc,
} from 'firebase/firestore';
import { db } from '@/config/firebase';

/**
 * Envía un mensaje directo a otro usuario
 * El mensaje aparece en las notificaciones del destinatario
 */
export const sendDirectMessage = async (fromUserId, toUserId, content) => {
  try {
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
    where('read', '==', false),
    orderBy('timestamp', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const notifications = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
      }));
      callback(notifications);
    },
    (error) => {
      console.error('Error subscribing to notifications:', error);
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
