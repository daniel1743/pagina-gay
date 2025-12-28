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
import { checkRateLimit, recordMessage } from '@/services/rateLimitService';
import { recordUserMessageOrder } from '@/services/multiProviderAIConversation';

/**
 * Envía un mensaje a una sala de chat
 * Para usuarios anónimos, usa transacción para incrementar contador
 * ✅ AÑADIDO 2025-12-11: Rate limiting implementado (máx 1 mensaje cada 3 segundos)
 */
export const sendMessage = async (roomId, messageData, isAnonymous = false) => {
  try {
    // 🔍 RASTREADOR DE MENSAJES: Identificar tipo de remitente
    const isBot = messageData.userId?.startsWith('bot_') ||
                  messageData.userId?.startsWith('ai_') ||
                  messageData.userId?.startsWith('static_bot_') ||
                  messageData.userId === 'system';
    const isAI = (messageData.userId?.startsWith('bot_') || messageData.userId?.startsWith('ai_')) &&
                 !messageData.userId?.includes('join');
    const isRealUser = !isBot;

    const messageType = isAI ? '🤖 IA' : (isBot ? '⚠️ BOT' : '✅ USUARIO REAL');

    // 🔍 RASTREADOR MEJORADO: Incluir stack trace para identificar origen
    const stackTrace = new Error().stack;
    const callerLine = stackTrace.split('\n')[2] || 'unknown';
    
    console.log(`
╔════════════════════════════════════════════════════════════╗
║           📤 RASTREADOR DE MENSAJES                        ║
╠════════════════════════════════════════════════════════════╣
║ 📍 FUNCIÓN: sendMessage()                                  ║
║ 🏠 Sala: ${roomId.padEnd(20)}                          ║
║ 👤 Remitente: ${messageData.username.padEnd(16)} │ Tipo: ${messageType.padEnd(15)} ║
║ 💬 Mensaje: "${messageData.content.substring(0,40).padEnd(40)}" ║
║ 🆔 UserID: ${messageData.userId.substring(0,20).padEnd(20)}                  ║
║ 👻 Anónimo: ${(isAnonymous ? 'SÍ' : 'NO').padEnd(18)}          ║
║ 📍 Origen: ${callerLine.substring(0, 50).padEnd(50)} ║
╚════════════════════════════════════════════════════════════╝
    `);
    
    // 🚨 ALERTA ESPECIAL: Si es un mensaje de IA/Bot, mostrar stack completo
    if (isAI || isBot) {
      console.group(`🚨 MENSAJE DE IA/BOT DETECTADO - STACK TRACE COMPLETO`);
      console.log(`Remitente: ${messageData.username} (${messageData.userId})`);
      console.log(`Mensaje: "${messageData.content}"`);
      console.log(`Stack trace completo:`, stackTrace);
      console.groupEnd();
    }

    // 🛡️ RATE LIMITING PROFESIONAL: Máximo 3 mensajes cada 10 segundos
    // 🔥 DETECCIÓN DE DUPLICADOS: Si repite 1 mensaje → MUTE INMEDIATO
    const rateLimitCheck = await checkRateLimit(messageData.userId, roomId, messageData.content);

    if (!rateLimitCheck.allowed) {
      console.warn(`🚫 [RATE LIMIT] Mensaje bloqueado de ${messageData.username} (${messageData.userId})`);
      console.warn(`Razón: ${rateLimitCheck.error}`);

      throw new Error(rateLimitCheck.error);
    }

    console.log(`✅ [RATE LIMIT] Usuario ${messageData.username} pasó verificación`);

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
      trace, // 🔍 TRAZABILIDAD: Incluir metadata completa
    };

    // Verificar si es el primer mensaje del usuario (para GA4)
    const firstMessageKey = `firstMessage_${messageData.userId}`;
    const hasSeenFirstMessage = localStorage.getItem(firstMessageKey);

    if (isAnonymous && auth.currentUser) {
      // OPTIMIZACIÓN: Enviar mensaje primero (rápido), actualizar contador después (asíncrono)
      const docRef = await addDoc(messagesRef, message);

      // ✅ Registrar mensaje enviado en cache de rate limiting (con contenido para detectar duplicados)
      recordMessage(messageData.userId, messageData.content);

      // 🔥 NUEVO: Registrar mensaje en orden para que IAs también esperen su turno
      if (isRealUser) {
        recordUserMessageOrder(roomId, messageData.userId);
      }

      console.log(`✅ [MENSAJE ENVIADO] ${messageData.username} (anónimo) → "${messageData.content.substring(0,30)}..."`);

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

      // ✅ Registrar mensaje enviado en cache de rate limiting (con contenido para detectar duplicados)
      recordMessage(messageData.userId, messageData.content);

      // 🔥 NUEVO: Registrar mensaje en orden para que IAs también esperen su turno
      if (isRealUser) {
        recordUserMessageOrder(roomId, messageData.userId);
      }

      console.log(`✅ [MENSAJE ENVIADO] ${messageData.username} (${messageType}) → "${messageData.content.substring(0,30)}..."`)

      // ✅ Incrementar contador de mensajes para usuarios registrados (para sistema de recompensas)
      if (messageData.userId && !isAnonymous && !isBot) {
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
