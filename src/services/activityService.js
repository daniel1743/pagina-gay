import { collection, query, where, getDocs, getDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';

/**
 * Obtiene estadísticas de actividad del usuario para hoy
 */
export const getUserActivityStats = async (userId) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    
    const todayStartTimestamp = Timestamp.fromDate(todayStart);
    const todayEndTimestamp = Timestamp.fromDate(todayEnd);

    // 1. Contar mensajes enviados hoy
    const messagesCount = await countMessagesToday(userId, todayStartTimestamp, todayEndTimestamp);

    // 2. Contar interacciones únicas (personas con las que habló)
    const uniqueInteractions = await countUniqueInteractions(userId, todayStartTimestamp, todayEndTimestamp);

    // 3. Contar cuántos usuarios lo tienen en favoritos
    const favoriteCount = await countFavoriteAdds(userId);

    // 4. Contar conversaciones privadas activas
    const privateChatsCount = await countPrivateChats(userId);

    // 5. Encontrar persona con la que más habló
    const topConversationPartner = await getTopConversationPartner(userId, todayStartTimestamp, todayEndTimestamp);

    return {
      messagesSent: messagesCount,
      uniqueInteractions,
      favoriteCount,
      privateChatsCount,
      topConversationPartner,
    };
  } catch (error) {
    console.error('Error getting user activity stats:', error);
    throw error;
  }
};

/**
 * Cuenta mensajes enviados hoy en salas públicas
 * Nota: Por limitaciones de índices de Firestore, simplificamos a contar todos los mensajes del usuario
 */
const countMessagesToday = async (userId, startDate, endDate) => {
  try {
    // Para simplificar y evitar problemas de índices, contamos mensajes recientes del usuario
    // En producción, esto se puede optimizar con índices compuestos
    const roomsSnapshot = await getDocs(collection(db, 'rooms'));
    let totalMessages = 0;

    for (const roomDoc of roomsSnapshot.docs) {
      try {
        const messagesRef = collection(db, 'rooms', roomDoc.id, 'messages');
        const messagesQuery = query(
          messagesRef,
          where('userId', '==', userId)
        );

        const messagesSnapshot = await getDocs(messagesQuery);
        
        // Filtrar por fecha en el cliente (menos eficiente pero más compatible)
        messagesSnapshot.forEach(doc => {
          const messageData = doc.data();
          const messageDate = messageData.timestamp?.toDate?.() || new Date(0);
          if (messageDate >= startDate.toDate() && messageDate < endDate.toDate()) {
            totalMessages++;
          }
        });
      } catch (error) {
        // Si la sala no tiene mensajes o hay error, continuar
        continue;
      }
    }

    return totalMessages;
  } catch (error) {
    console.error('Error counting messages:', error);
    return 0;
  }
};

/**
 * Cuenta interacciones únicas (usuarios diferentes en las salas donde el usuario habló hoy)
 */
const countUniqueInteractions = async (userId, startDate, endDate) => {
  try {
    const roomsSnapshot = await getDocs(collection(db, 'rooms'));
    const uniqueUserIds = new Set();
    const roomsWhereUserSpoke = new Set();

    // Primero, identificar las salas donde el usuario habló hoy
    for (const roomDoc of roomsSnapshot.docs) {
      try {
        const messagesRef = collection(db, 'rooms', roomDoc.id, 'messages');
        const messagesQuery = query(messagesRef, where('userId', '==', userId));
        const messagesSnapshot = await getDocs(messagesQuery);
        
        let userSpokeInRoom = false;
        messagesSnapshot.forEach(doc => {
          const messageData = doc.data();
          const messageDate = messageData.timestamp?.toDate?.() || new Date(0);
          if (messageDate >= startDate.toDate() && messageDate < endDate.toDate()) {
            userSpokeInRoom = true;
          }
        });

        if (userSpokeInRoom) {
          roomsWhereUserSpoke.add(roomDoc.id);
        }
      } catch (error) {
        continue;
      }
    }

    // Luego, contar usuarios únicos en esas salas
    for (const roomId of roomsWhereUserSpoke) {
      try {
        const messagesRef = collection(db, 'rooms', roomId, 'messages');
        const messagesSnapshot = await getDocs(messagesRef);
        
        messagesSnapshot.forEach(doc => {
          const messageData = doc.data();
          if (messageData.userId && messageData.userId !== userId) {
            const messageDate = messageData.timestamp?.toDate?.() || new Date(0);
            if (messageDate >= startDate.toDate() && messageDate < endDate.toDate()) {
              uniqueUserIds.add(messageData.userId);
            }
          }
        });
      } catch (error) {
        continue;
      }
    }

    return uniqueUserIds.size;
  } catch (error) {
    console.error('Error counting unique interactions:', error);
    return 0;
  }
};

/**
 * Cuenta cuántos usuarios tienen a este usuario en favoritos
 */
const countFavoriteAdds = async (userId) => {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    let count = 0;

    usersSnapshot.forEach(userDoc => {
      const userData = userDoc.data();
      if (userData.favorites && Array.isArray(userData.favorites) && userData.favorites.includes(userId)) {
        count++;
      }
    });

    return count;
  } catch (error) {
    console.error('Error counting favorites:', error);
    return 0;
  }
};

/**
 * Cuenta conversaciones privadas activas
 */
const countPrivateChats = async (userId) => {
  try {
    const privateChatsSnapshot = await getDocs(collection(db, 'private_chats'));
    let count = 0;

    privateChatsSnapshot.forEach(chatDoc => {
      const chatData = chatDoc.data();
      if (chatData.participants && Array.isArray(chatData.participants) && chatData.participants.includes(userId)) {
        count++;
      }
    });

    return count;
  } catch (error) {
    console.error('Error counting private chats:', error);
    return 0;
  }
};

/**
 * Encuentra la persona con la que más habló (basado en mensajes en privado)
 */
const getTopConversationPartner = async (userId, startDate, endDate) => {
  try {
    const privateChatsSnapshot = await getDocs(collection(db, 'private_chats'));
    const partnerMessageCounts = {};

    for (const chatDoc of privateChatsSnapshot.docs) {
      const chatData = chatDoc.data();
      if (!chatData.participants || !chatData.participants.includes(userId)) {
        continue;
      }

      const partnerId = chatData.participants.find(id => id !== userId);
      if (!partnerId) continue;

      // Contar mensajes en este chat privado
      try {
        const messagesRef = collection(db, 'private_chats', chatDoc.id, 'messages');
        const messagesSnapshot = await getDocs(messagesRef);
        
        let messageCount = 0;
        messagesSnapshot.forEach(doc => {
          const messageData = doc.data();
          const messageDate = messageData.timestamp?.toDate?.() || new Date(0);
          if (messageDate >= startDate.toDate() && messageDate < endDate.toDate()) {
            messageCount++;
          }
        });

        if (!partnerMessageCounts[partnerId]) {
          partnerMessageCounts[partnerId] = { id: partnerId, messageCount: 0 };
        }
        partnerMessageCounts[partnerId].messageCount += messageCount;
      } catch (error) {
        continue;
      }
    }

    // Encontrar el partner con más mensajes
    let topPartner = null;
    let maxMessages = 0;

    for (const partnerId in partnerMessageCounts) {
      if (partnerMessageCounts[partnerId].messageCount > maxMessages) {
        maxMessages = partnerMessageCounts[partnerId].messageCount;
        topPartner = partnerMessageCounts[partnerId];
      }
    }

    if (topPartner && topPartner.id) {
      // Obtener datos del usuario
      const userDoc = await getDoc(doc(db, 'users', topPartner.id));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          userId: topPartner.id,
          username: userData.username || 'Usuario',
          avatar: userData.avatar || '',
          messageCount: topPartner.messageCount,
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting top conversation partner:', error);
    return null;
  }
};

