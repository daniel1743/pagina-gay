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
 * 🔧 Genera UUID compatible con todos los navegadores
 * Fallback para crypto.randomUUID() que no está disponible en todos los contextos
 */
function generateUUID() {
  // Intentar usar crypto.randomUUID() si está disponible (más seguro)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Fallback: Generar UUID v4 manualmente (compatible con todos los navegadores)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Envía un mensaje a una sala de chat
 * Para usuarios anónimos, usa transacción para incrementar contador
 * ✅ AÑADIDO 2025-12-11: Rate limiting implementado (máx 1 mensaje cada 3 segundos)
 */
export const sendMessage = async (roomId, messageData, isAnonymous = false) => {
  try {
    // ✅ CRÍTICO: Validar que auth.currentUser esté disponible (requerido por Firestore rules)
    // Esto previene errores de permisos cuando se intenta enviar sin autenticación
    if (!auth.currentUser) {
      const error = new Error('Usuario no autenticado. Por favor, espera un momento o recarga la página.');
      error.code = 'auth/user-not-authenticated';
      throw error;
    }

    // ✅ CRÍTICO: Asegurar que userId coincida con auth.currentUser.uid
    // EXCEPTO para mensajes de sistema (moderador, VOC, bots, etc.)
    const isSystemMessage = messageData.userId?.startsWith('system') ||
                           messageData.userId?.startsWith('bot_') ||
                           messageData.userId?.startsWith('ai_') ||
                           messageData.userId?.startsWith('seed_user_');

    if (!isSystemMessage && messageData.userId !== auth.currentUser.uid) {
      console.warn('[SEND] ⚠️ userId no coincide con auth.currentUser.uid, corrigiendo...', {
        providedUserId: messageData.userId,
        authCurrentUserUid: auth.currentUser.uid
      });
      messageData.userId = auth.currentUser.uid;
    }

    // ⚡ VELOCIDAD CRÍTICA: Identificar tipo de remitente (sin logging)
    const isBot = messageData.userId?.startsWith('bot_') ||
                  messageData.userId?.startsWith('ai_') ||
                  messageData.userId?.startsWith('static_bot_') ||
                  messageData.userId === 'system';
    const isRealUser = !isBot;

    // ⚡ RATE LIMITING: Solo para usuarios reales (NO bloquea bots)
    if (isRealUser) {
      const rateLimitCheck = await checkRateLimit(messageData.userId, roomId, messageData.content);
      if (!rateLimitCheck.allowed) {
        throw new Error(rateLimitCheck.error);
      }
    }

    const messagesRef = collection(db, 'rooms', roomId, 'messages');

    // ⚡ TRAZABILIDAD: Auto-crear trace si no existe (sin validaciones pesadas)
    const trace = messageData.trace || {
      origin: isBot ? 'SYSTEM' : 'HUMAN',
      source: isBot ? 'LEGACY_BOT' : 'USER_INPUT',
      actorId: messageData.userId,
      actorType: isBot ? 'BOT' : 'HUMAN',
      system: 'chatService',
      traceId: generateUUID(), // ✅ Compatible con todos los navegadores
      createdAt: Date.now()
    };

    // ⚡ VELOCIDAD MÁXIMA: Preparar mensaje con mínimos datos
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
      read: false,
      replyTo: messageData.replyTo || null,
      trace,
    };

    // ⚡ INSTANTÁNEO: ENVIAR A FIRESTORE INMEDIATAMENTE (sin esperar validaciones pesadas)
    // Firestore offline persistence escribe local primero (WhatsApp-style)
    const docRef = await addDoc(messagesRef, message);

    // ✅ Registrar en cache de rate limiting (instantáneo - memoria)
    recordMessage(messageData.userId, messageData.content);

    // ⚡ BACKGROUND: TODO lo demás se hace SIN bloquear (Promise.all sin await)
    Promise.all([
      // Moderación asíncrona
      isRealUser ? moderateMessage(messageData.content, messageData.userId, messageData.username, roomId).catch(() => {}) : Promise.resolve(),

      // Actualizar contador usuario
      isAnonymous && auth.currentUser
        ? setDoc(doc(db, 'guests', auth.currentUser.uid), { messageCount: increment(1), lastMessageAt: serverTimestamp() }, { merge: true }).catch(() => {})
        : !isAnonymous && !isBot && messageData.userId
          ? updateDoc(doc(db, 'users', messageData.userId), { messageCount: increment(1), lastMessageAt: serverTimestamp() }).catch(() => {})
          : Promise.resolve()
    ]).catch(() => {}); // Ignorar errores de background

    // ⚡ GA4: Tracking en background (no bloqueante)
    const firstMessageKey = `firstMessage_${messageData.userId}`;
    if (!localStorage.getItem(firstMessageKey)) {
      trackFirstMessage({ userId: messageData.userId, roomId, roomName: 'unknown' });
      localStorage.setItem(firstMessageKey, 'true');
    } else {
      trackMessageSent({ userId: messageData.userId, roomId, roomName: 'unknown' });
    }

    return { id: docRef.id, ...message };
  } catch (error) {
    // 🔍 DIAGNÓSTICO: Logging detallado de errores
    console.error('[SEND] ❌ Error enviando mensaje:', {
      error: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack?.split('\n').slice(0, 3).join('\n'),
      roomId,
      userId: messageData.userId,
      username: messageData.username,
      timestamp: new Date().toISOString()
    });
    
    // Logging adicional para errores comunes
    if (error.code === 'permission-denied') {
      console.error('[SEND] 🚨 PERMISO DENEGADO - Verificar Firestore Rules', {
        userId: messageData.userId,
        authCurrentUserUid: auth.currentUser?.uid,
        match: messageData.userId === auth.currentUser?.uid
      });
    } else if (error.code === 'auth/user-not-authenticated') {
      console.error('[SEND] 🚨 USUARIO NO AUTENTICADO - auth.currentUser es null');
    } else if (error.code === 'unavailable') {
      console.error('[SEND] 🚨 FIREBASE NO DISPONIBLE - Problema de conexión');
    } else if (error.message?.includes('rate limit') || error.message?.includes('Espera')) {
      console.error('[SEND] 🚨 RATE LIMIT - Usuario bloqueado temporalmente');
    }
    
    throw error;
  }
};

/**
 * ⚡ Suscripción a mensajes en tiempo real - ULTRA-OPTIMIZADA para velocidad WhatsApp/Telegram
 * Offline persistence funciona automáticamente SIN includeMetadataChanges
 */
export const subscribeToRoomMessages = (roomId, callback, messageLimit = 50) => {
  const messagesRef = collection(db, 'rooms', roomId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'), limitToLast(messageLimit));

  // ⚡ OPTIMIZACIÓN: Logging mínimo para velocidad máxima

  // ✅ SIMPLE y CONFIABLE - sin includeMetadataChanges (causaba bugs)
  // ⚡ OPTIMIZADO: onSnapshot se ejecuta inmediatamente y devuelve datos cached si están disponibles
  return onSnapshot(
    q,
    (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
      }));

      // ⚡ OPTIMIZACIÓN: Sin logging para velocidad máxima
      callback(messages);
    },
    (error) => {
      if (error.name !== 'AbortError' && error.code !== 'cancelled') {
        console.error('[SUBSCRIBE] ❌ Error:', error.code, error.message);
        callback([]);
      }
    },
    { includeMetadataChanges: false } // ⚡ CRÍTICO: No incluir cambios de metadata para mejor rendimiento
  );
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
