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
} from 'firebase/firestore';
import { db, auth } from '@/config/firebase';
import { trackMessageSent, trackFirstMessage } from '@/services/ga4Service';
import { checkRateLimit, recordMessage, unmuteUser } from '@/services/rateLimitService';
import { moderateMessage } from '@/services/moderationService';

// Persistencia de envíos pendientes (cuando la red falla)
const pendingMessages = [];
let isFlushingQueue = false;

const isNetworkError = (error) => {
  return (
    error?.code === 'unavailable' ||
    error?.message?.toLowerCase?.().includes('network') ||
    error?.message?.toLowerCase?.().includes('fetch') ||
    error?.name === 'TypeError'
  );
};

const flushPendingMessages = async () => {
  if (isFlushingQueue || pendingMessages.length === 0) return;
  isFlushingQueue = true;

  for (let i = 0; i < pendingMessages.length; ) {
    const item = pendingMessages[i];
    try {
      await sendMessage(item.roomId, item.messageData, item.isAnonymous, true);
      pendingMessages.splice(i, 1);
    } catch (error) {
      if (isNetworkError(error)) {
        i++;
        break; // salimos para reintentar luego
      } else {
        console.error('[SEND][QUEUE] Error permanente, descartando mensaje:', error?.message);
        pendingMessages.splice(i, 1);
      }
    }
  }

  isFlushingQueue = false;
};

// Reintentos periódicos y al recuperar conexión
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    flushPendingMessages().catch(() => {});
  });
  setInterval(() => {
    flushPendingMessages().catch(() => {});
  }, 5000);
}

/**
 * 🔧 Genera UUID compatible con todos los navegadores
 * Fallback para crypto.randomUUID() que no está disponible en todos los contextos
 */
export function generateUUID() {
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
 * Envío directo (sin cola) - usado internamente
 */
const doSendMessage = async (roomId, messageData, isAnonymous = false) => {
  // 🔍 DIAGNÓSTICO: Logging detallado para identificar problemas localhost → producción
  if (import.meta.env.DEV) {
    const diagnosticInfo = {
      timestamp: new Date().toISOString(),
      roomId,
      hasAuth: !!auth,
      hasCurrentUser: !!auth.currentUser,
      currentUserUid: auth.currentUser?.uid,
      currentUserEmail: auth.currentUser?.email,
      messageDataUserId: messageData.userId,
      messageDataUsername: messageData.username,
      userIdsMatch: messageData.userId === auth.currentUser?.uid,
      isAnonymous,
      firebaseProjectId: db.app.options.projectId,
      firebaseAuthDomain: auth.app.options.authDomain,
      usingEmulator: import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true'
    };
    console.log('🔍 [DIAGNÓSTICO] Estado antes de enviar mensaje:', diagnosticInfo);
  }

  // ⚠️ Validar que auth.currentUser está disponible (requerido por Firestore rules)
  if (!auth.currentUser) {
    const error = new Error('Usuario no autenticado. Por favor, espera un momento o recarga la página.');
    error.code = 'auth/user-not-authenticated';
    
    // 🔍 DIAGNÓSTICO: Información adicional cuando falla autenticación
    if (import.meta.env.DEV) {
      console.error('🔍 [DIAGNÓSTICO] Error de autenticación:', {
        hasAuth: !!auth,
        authState: auth.currentUser,
        firebaseProjectId: db.app.options.projectId,
        usingEmulator: import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true',
        suggestion: 'Verifica que estés autenticado y que VITE_USE_FIREBASE_EMULATOR=false si quieres usar producción'
      });
    }
    
    throw error;
  }

  // Asegurar que userId coincida con auth.currentUser.uid (excepto mensajes de sistema)
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

  // Identificar tipo de remitente
  const isBot = messageData.userId?.startsWith('bot_') ||
                messageData.userId?.startsWith('ai_') ||
                messageData.userId?.startsWith('static_bot_') ||
                messageData.userId === 'system';
  const isRealUser = !isBot;

  // RATE LIMITING deshabilitado temporalmente
  // if (isRealUser) {
  //   const rateLimitCheck = await checkRateLimit(messageData.userId, roomId, messageData.content);
  //   if (!rateLimitCheck.allowed) {
  //     throw new Error(rateLimitCheck.error);
  //   }
  // }

  const messagesRef = collection(db, 'rooms', roomId, 'messages');

  // Trazabilidad mínima
  const trace = messageData.trace || {
    origin: isBot ? 'SYSTEM' : 'HUMAN',
    source: isBot ? 'LEGACY_BOT' : 'USER_INPUT',
    actorId: messageData.userId,
    actorType: isBot ? 'BOT' : 'HUMAN',
    system: 'chatService',
    traceId: generateUUID(),
    createdAt: Date.now()
  };

  // Payload de mensaje
  const message = {
    clientId: messageData.clientId || null,
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

  // Enviar a Firestore (persistencia local primero)
  const docRef = await addDoc(messagesRef, message);

  // Cache rate limiting (memoria)
  recordMessage(messageData.userId, messageData.content);

  // Tareas en background
  Promise.all([
    isRealUser ? moderateMessage(messageData.content, messageData.userId, messageData.username, roomId).catch(() => {}) : Promise.resolve(),
    isAnonymous && auth.currentUser
      ? setDoc(doc(db, 'guests', auth.currentUser.uid), { messageCount: increment(1), lastMessageAt: serverTimestamp() }, { merge: true }).catch(() => {})
      : !isAnonymous && !isBot && messageData.userId
        ? updateDoc(doc(db, 'users', messageData.userId), { messageCount: increment(1), lastMessageAt: serverTimestamp() }).catch(() => {})
        : Promise.resolve()
  ]).catch(() => {});

  // GA4 tracking en background
  const firstMessageKey = `firstMessage_${messageData.userId}`;
  if (!localStorage.getItem(firstMessageKey)) {
    trackFirstMessage({ userId: messageData.userId, roomId, roomName: 'unknown' });
    localStorage.setItem(firstMessageKey, 'true');
  } else {
    trackMessageSent({ userId: messageData.userId, roomId, roomName: 'unknown' });
  }

  return { id: docRef.id, ...message };
};

/**
 * Envío resiliente: usa cola cuando hay fallos de red
 */
export const sendMessage = async (roomId, messageData, isAnonymous = false, skipQueue = false) => {
  try {
    return await doSendMessage(roomId, { ...messageData }, isAnonymous);
  } catch (error) {
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

    if (error.code === 'permission-denied') {
      console.error('[SEND] 🚫 PERMISO DENEGADO - Verificar Firestore Rules', {
        userId: messageData.userId,
        authCurrentUserUid: auth.currentUser?.uid,
        match: messageData.userId === auth.currentUser?.uid,
        firebaseProjectId: db.app.options.projectId,
        usingEmulator: import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true',
        suggestion: 'Verifica que userId === auth.currentUser.uid y que las reglas de Firestore estén desplegadas'
      });
    } else if (error.code === 'auth/user-not-authenticated') {
      console.error('[SEND] 🛑 USUARIO NO AUTENTICADO - auth.currentUser es null');
    } else if (error.code === 'unavailable') {
      console.error('[SEND] 🌐 FIREBASE NO DISPONIBLE - Problema de conexión');
    } else if (error.message?.includes('rate limit') || error.message?.includes('Espera')) {
      console.error('[SEND] ⏳ RATE LIMIT - Usuario bloqueado temporalmente');
    }

    // Cola solo para errores de red y cuando no estamos en un flush
    if (!skipQueue && isNetworkError(error)) {
      pendingMessages.push({ roomId, messageData, isAnonymous });
      console.warn('[SEND][QUEUE] Mensaje en cola por problema de red. Total en cola:', pendingMessages.length);
      flushPendingMessages().catch(() => {});
      return { queued: true };
    }

    throw error;
  }
};

/**
 * Suscripción a mensajes en tiempo real - orden estable (nuevo->viejo en query, se invierte en cliente)
 */
export const subscribeToRoomMessages = (roomId, callback, messageLimit = 200) => {
  const messagesRef = collection(db, 'rooms', roomId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(messageLimit));

  return onSnapshot(
    q,
    (snapshot) => {
      const messages = snapshot.docs.map(doc => {
        const data = doc.data();
        const timestampMs = data.timestamp?.toMillis?.() ?? Date.now();
        return {
          id: doc.id,
          ...data,
          timestampMs,
          timestamp: data.timestamp ?? null,
        };
      });

      const orderedMessages = messages.reverse();
      callback(orderedMessages);
    },
    (error) => {
      // ✅ Ignorar errores transitorios de Firestore WebChannel (errores 400 internos)
      // Estos son errores de conexión internos que Firestore maneja automáticamente
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
        // Solo loguear errores reales que necesitan atención
        console.error('[SUBSCRIBE] ❌ Error:', error.code, error.message);
        callback([]);
      }
      // Los errores transitorios se ignoran silenciosamente - Firestore se reconectará automáticamente
    },
    { includeMetadataChanges: false }
  );
};

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

    const batch = [];
    snapshot.docs.forEach(doc => {
      batch.push(updateDoc(doc.ref, { read: true }));
    });

    await Promise.all(batch);
  } catch (error) {
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
