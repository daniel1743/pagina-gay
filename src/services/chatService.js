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
import { checkRateLimit, recordMessage, unmuteUser } from '@/services/rateLimitService';
import { moderateMessage } from '@/services/moderationService';

/**
 * Envía un mensaje a una sala de chat
 * Para usuarios anónimos, usa transacción para incrementar contador
 * ✅ AÑADIDO 2025-12-11: Rate limiting implementado (máx 1 mensaje cada 3 segundos)
 */
export const sendMessage = async (roomId, messageData, isAnonymous = false) => {
  // 🚀 PRODUCCIÓN: Logging eliminado para máxima velocidad
  // Solo loguear en desarrollo (import.meta.env.DEV)
  if (import.meta.env.DEV) {
    console.group('🔥 [SEND MESSAGE] DEBUG');
    console.log('Room:', roomId, '| User:', messageData.username);
    console.groupEnd();
  }

  try {
    // 🔍 RASTREADOR DE MENSAJES: Identificar tipo de remitente
    const isBot = messageData.userId?.startsWith('bot_') ||
                  messageData.userId?.startsWith('ai_') ||
                  messageData.userId?.startsWith('static_bot_') ||
                  messageData.userId === 'system';
    const isAI = (messageData.userId?.startsWith('bot_') || messageData.userId?.startsWith('ai_')) &&
                 !messageData.userId?.includes('join');
    const isRealUser = !isBot;

    // 🚀 OPTIMIZACIÓN: Sin logging en producción

    // 🚀 RATE LIMITING ULTRA RÁPIDO: Solo para usuarios reales (NO IAs)
    // ✅ EXCLUIR IAs del rate limiting - tienen su propio sistema de control
    if (isRealUser) {
      // 🚀 OPTIMIZACIÓN: Rate limit ahora usa SOLO cache en memoria (sin Firestore)
      const rateLimitCheck = await checkRateLimit(messageData.userId, roomId, messageData.content);

      if (!rateLimitCheck.allowed) {
        throw new Error(rateLimitCheck.error);
      }
    }

    // ✅ IMPORTANTE: Registrar mensaje SOLO después de que se envíe exitosamente (ver abajo)

    const messagesRef = collection(db, 'rooms', roomId, 'messages');

    // 🔍 TRAZABILIDAD: Determinar origen del mensaje
    let trace = messageData.trace;
    
    // Si no viene trace, crear uno (mensaje humano)
    if (!trace) {
      const isBot = messageData.userId?.startsWith('bot_') ||
                    messageData.userId?.startsWith('ai_') ||
                    messageData.userId?.startsWith('static_bot_') ||
                    messageData.userId === 'system';
      
      if (isBot) {
        // Mensaje de bot/legacy sin trace - marcar como LEGACY_BOT
        trace = {
          origin: 'SYSTEM',
          source: 'LEGACY_BOT',
          actorId: messageData.userId,
          actorType: 'BOT',
          system: 'unknown',
          traceId: crypto.randomUUID(),
          createdAt: Date.now()
        };
      } else {
        // Mensaje humano real
        trace = {
          origin: 'HUMAN',
          source: 'USER_INPUT',
          actorId: messageData.userId,
          actorType: 'HUMAN',
          system: 'chatService',
          traceId: crypto.randomUUID(),
          createdAt: Date.now()
        };
      }
    }
    
    // 🚨 VALIDACIÓN: Rechazar mensajes sin trace (regla de oro)
    if (!trace || !trace.origin || !trace.source || !trace.actorId) {
      console.error('🚨 MENSAJE BLOQUEADO: Sin trazabilidad completa', {
        userId: messageData.userId,
        username: messageData.username,
        content: messageData.content?.substring(0, 50),
        trace: messageData.trace
      });
      throw new Error('Mensaje sin trazabilidad bloqueado: falta metadata de origen');
    }

    const message = {
      userId: messageData.userId,
      senderUid: auth.currentUser?.uid || messageData.senderUid || null,
      username: messageData.username,
      avatar: messageData.avatar,
      isPremium: messageData.isPremium || false,
      content: messageData.content,
      type: messageData.type || 'text',
      timestamp: serverTimestamp(),
      reactions: { like: 0, dislike: 0 },
      read: false, // Para doble check
      replyTo: messageData.replyTo || null, // 💬 REPLY: { messageId, username, content }
      trace, // 🔍 TRAZABILIDAD: Incluir metadata completa
    };

    // Verificar si es el primer mensaje del usuario (para GA4)
    const firstMessageKey = `firstMessage_${messageData.userId}`;
    const hasSeenFirstMessage = localStorage.getItem(firstMessageKey);

    if (isAnonymous && auth.currentUser) {
      // 🚀 OPTIMIZACIÓN: Sin logging, envío directo
      const docRef = await addDoc(messagesRef, message);

      // ✅ Registrar mensaje enviado en cache de rate limiting (instantáneo - en memoria)
      recordMessage(messageData.userId, messageData.content);

      // 🚀 OPERACIONES NO BLOQUEANTES (segundo plano)
      // Moderación asíncrona (no espera respuesta)
      if (isRealUser) {
        moderateMessage(
          messageData.content,
          messageData.userId,
          messageData.username,
          roomId
        ).catch(err => console.error('[MODERACIÓN] Error:', err));
      }

      // Actualizar contador en segundo plano
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
      // 🚀 OPTIMIZACIÓN: Envío directo sin logging
      const docRef = await addDoc(messagesRef, message);

      // ✅ Registrar mensaje enviado en cache de rate limiting (instantáneo - en memoria)
      recordMessage(messageData.userId, messageData.content);

      // 🚀 OPERACIONES NO BLOQUEANTES (segundo plano)
      // Moderación asíncrona (no espera respuesta)
      if (isRealUser) {
        moderateMessage(
          messageData.content,
          messageData.userId,
          messageData.username,
          roomId
        ).catch(err => console.error('[MODERACIÓN] Error:', err));
      }

      // Incrementar contador en segundo plano
      if (messageData.userId && !isAnonymous && !isBot) {
        const userRef = doc(db, 'users', messageData.userId);
        updateDoc(userRef, {
          messageCount: increment(1),
          lastMessageAt: serverTimestamp(),
        }).catch(err => console.error('Error updating user count:', err));
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
    // 🚀 PRODUCCIÓN: Solo loguear en desarrollo
    if (import.meta.env.DEV) {
      console.error('[SEND MESSAGE] Error:', error.message);
    }
    throw error;
  }
};

/**
 * Suscribe a mensajes de una sala en tiempo real
 * ✅ ACTUALIZADO: Carga los últimos 100 mensajes para mejor experiencia
 */
export const subscribeToRoomMessages = (roomId, callback, messageLimit = 100) => {
  // 🚀 OPTIMIZACIÓN: Sin logging, máxima velocidad
  const messagesRef = collection(db, 'rooms', roomId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'), limitToLast(messageLimit));

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
    }));
    callback(messages);
  }, (error) => {
    if (error.name !== 'AbortError' && error.code !== 'cancelled') {
      if (import.meta.env.DEV) console.error('[SUBSCRIBE] Error:', error.code);
      callback([]);
    }
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
