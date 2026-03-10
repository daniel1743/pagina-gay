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
  deleteDoc,
  where,
  limit,
  writeBatch,
} from 'firebase/firestore';
import { ref as storageRef, deleteObject } from 'firebase/storage';
import { db, auth, storage } from '@/config/firebase';
import { trackMessageSent, trackFirstMessage } from '@/services/ga4Service';
import { checkRateLimit, recordMessage, unmuteUser } from '@/services/rateLimitService';
import { moderateMessage } from '@/services/moderationService';
import { validateMessage as sanitizeMessage } from '@/services/antiSpamService';
import { getPerformanceMonitor } from '@/services/performanceMonitor';
import { getDeliveryService } from '@/services/messageDeliveryService';
import { traceEvent, TRACE_EVENTS, isMessageTraceEnabled } from '@/utils/messageTrace';

const FAST_REPLY_WINDOW_MS = 120000;
const DEFAULT_MESSAGE_REACTIONS = {
  like: 0,
  dislike: 0,
  fire: 0,
  heart: 0,
  devil: 0,
};
const ALLOWED_REACTION_TYPES = new Set(['like', 'dislike', 'fire', 'heart', 'devil']);
const MAX_BULK_DELETE_BATCH = 200;
const MESSAGE_CACHE_TTL_MS = 60 * 1000;
const messageSnapshotCache = new Map();

const normalizeRoomScope = (roomScope = 'rooms') => {
  if (roomScope === 'secondary' || roomScope === 'secondary-rooms') {
    return 'secondary-rooms';
  }
  return 'rooms';
};

const getRoomMessagesCollectionRef = (roomId, roomScope = 'rooms') =>
  collection(db, normalizeRoomScope(roomScope), roomId, 'messages');

const getRoomMessageDocRef = (roomId, messageId, roomScope = 'rooms') =>
  doc(db, normalizeRoomScope(roomScope), roomId, 'messages', messageId);

const extractMessageMediaPaths = (message = {}) => {
  const paths = new Set();

  if (Array.isArray(message.media)) {
    message.media.forEach((item) => {
      if (item && typeof item.path === 'string' && item.path.trim()) {
        paths.add(item.path.trim());
      }
    });
  }

  ['imagePath', 'voicePath', 'storagePath'].forEach((field) => {
    if (typeof message[field] === 'string' && message[field].trim()) {
      paths.add(message[field].trim());
    }
  });

  return Array.from(paths);
};

const isStorageNotFoundError = (error) => {
  const code = error?.code || '';
  const msg = String(error?.message || '').toLowerCase();
  return (
    code === 'storage/object-not-found' ||
    code === 404 ||
    msg.includes('object-not-found') ||
    msg.includes('no such object')
  );
};

const buildConversationPairKey = (userIdA, userIdB) => {
  const a = userIdA || 'unknown_a';
  const b = userIdB || 'unknown_b';
  return [a, b].sort().join('__');
};

const annotateFastReplyHighlights = (orderedMessages = []) => {
  if (!Array.isArray(orderedMessages) || orderedMessages.length === 0) {
    return orderedMessages;
  }

  const messageById = new Map();
  orderedMessages.forEach((message) => {
    if (message?.id) messageById.set(message.id, message);
  });

  const repliedMessageIds = new Set();
  const highlightedPairs = new Set();

  return orderedMessages.map((message) => {
    const replyToMessageId = message?.replyTo?.messageId;
    if (!replyToMessageId) return message;

    // Solo cuenta la primera respuesta directa a ese mensaje.
    if (repliedMessageIds.has(replyToMessageId)) return message;
    repliedMessageIds.add(replyToMessageId);

    const targetMessage = messageById.get(replyToMessageId);
    if (!targetMessage) return message;

    if (!message.timestampMs || !targetMessage.timestampMs) return message;

    const deltaMs = message.timestampMs - targetMessage.timestampMs;
    if (deltaMs < 0 || deltaMs > FAST_REPLY_WINDOW_MS) return message;

    if (!message.userId || !targetMessage.userId) return message;
    if (message.userId === targetMessage.userId) return message;

    // Evita repetir badge múltiples veces para la misma conversación activa.
    const pairKey = buildConversationPairKey(message.userId, targetMessage.userId);
    if (highlightedPairs.has(pairKey)) return message;
    highlightedPairs.add(pairKey);

    return {
      ...message,
      quickReplyHighlight: {
        key: `${pairKey}:${replyToMessageId}`,
        pairKey,
        triggerMessageId: replyToMessageId,
        replyMessageId: message.id,
        deltaMs,
        deltaSeconds: Math.round(deltaMs / 1000),
      },
    };
  });
};

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

const isAutomatedSenderId = (userId = '') => {
  return userId.startsWith('bot_') ||
         userId.startsWith('ai_') ||
         userId.startsWith('seed_user_') ||
         userId.startsWith('static_bot_');
};

/**
 * Envío directo (sin cola) - usado internamente
 */
const doSendMessage = async (roomId, messageData, isAnonymous = false) => {
  // Diagnósticos desactivados para reducir logs
  const messageType = messageData.type || 'text';
  const isTextMessage = messageType === 'text';

  // ✅ ESTRATEGIA DE CAPTACIÓN: Permitir usuarios NO autenticados PERMANENTEMENTE
  // Reducir fricción - usuarios pueden chatear en sala principal sin registrarse
  // Restricciones para usuarios NO autenticados:
  // - NO pueden enviar mensajes privados (requiere autenticación)
  // - NO pueden enviar links externos
  // - NO pueden enviar imágenes/voz (solo texto)
  // - NO pueden personalizar avatar (avatar genérico)

  // ✅ NO hay restricción de tiempo - usuarios NO autenticados pueden chatear siempre
  // (La conversión a usuario registrado se incentiva con funciones premium)

  // Asegurar que userId coincida con auth.currentUser.uid (excepto mensajes de sistema y usuarios no autenticados)
  const isSystemMessage = messageData.userId?.startsWith('system') ||
                         messageData.userId?.startsWith('bot_') ||
                         messageData.userId?.startsWith('ai_') ||
                         messageData.userId?.startsWith('seed_user_');

  // 🔒 Hard-block: nunca permitir bots/IA/seed en la sala principal.
  if (roomId === 'principal' && isAutomatedSenderId(messageData.userId || '')) {
    throw new Error('Bots bloqueados en sala principal');
  }

  // Para usuarios autenticados, validar que userId coincida
  if (auth.currentUser && !isSystemMessage && messageData.userId !== auth.currentUser.uid) {
    console.warn('[SEND] ⚠️ userId no coincide con auth.currentUser.uid, corrigiendo...', {
      providedUserId: messageData.userId,
      authCurrentUserUid: auth.currentUser.uid
    });
    messageData.userId = auth.currentUser.uid;
  }
  
  // Para usuarios NO autenticados, generar un userId temporal único
  if (!auth.currentUser && !isSystemMessage) {
    // Generar ID temporal basado en IP/sesión (se guarda en localStorage)
    const unauthenticatedUserId = `unauthenticated_${localStorage.getItem('session_id') || `temp_${Date.now()}_${Math.random()}`}`;
    if (!localStorage.getItem('session_id')) {
      localStorage.setItem('session_id', unauthenticatedUserId.split('_')[1]);
    }
    messageData.userId = unauthenticatedUserId;
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
  // ✅ FIX: Validar que username no sea undefined (Firestore no acepta undefined)
  const username = messageData.username || 'Usuario';
  if (!username || username === 'undefined') {
    console.error('[SEND] ❌ ERROR: username es inválido:', messageData.username);
    throw new Error('Username es requerido para enviar mensajes');
  }

  // ⚠️ VALIDAR LINKS: Usuarios no autenticados NO pueden enviar links de texto
  if (!auth.currentUser && isTextMessage) {
    const linkPattern = /(https?:\/\/|www\.|@|#)/i;
    if (linkPattern.test(messageData.content)) {
      throw new Error('Los usuarios no registrados no pueden enviar links. Regístrate para compartir enlaces.');
    }
  }

  // 🛡️ MODERACIÓN ANTI-EXTRACCIÓN (enforcement real previo a Firestore)
  if (isTextMessage) {
    try {
      const sanitizeResult = await sanitizeMessage(
        messageData.content,
        messageData.userId,
        messageData.username || 'Usuario',
        roomId,
        { dryRun: false }
      );

      if (!sanitizeResult.allowed) {
        const blockedError = new Error(sanitizeResult.reason || 'Mensaje bloqueado por moderación');
        blockedError.code = 'content-blocked';
        blockedError.moderation = sanitizeResult;
        throw blockedError;
      }

      messageData.content = sanitizeResult.content || String(messageData.content || '').trim();
    } catch (sanitizeError) {
      // La moderación no puede quedar en fail-open para bypass de seguridad
      throw sanitizeError;
    }
  }

  // ✅ GARANTIZAR AVATAR: Nunca enviar null, siempre tener un avatar válido
  const ensureAvatar = (avatar, username) => {
    if (avatar && avatar.trim() && !avatar.includes('undefined')) {
      return avatar;
    }
    // Fallback: Generar avatar basado en username usando DiceBear
    const seed = username || 'guest';
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
  };

  // ✅ Asegurar que traceId se propague correctamente
  const finalTraceId = messageData.traceId || trace?.traceId || trace.traceId;
  if (finalTraceId) {
    trace.traceId = finalTraceId;
  }

  const message = {
    clientId: messageData.clientId || null,
    userId: messageData.userId,
    senderUid: auth.currentUser?.uid || messageData.senderUid || null,
    username, // ✅ Validado arriba
    avatar: ensureAvatar(messageData.avatar, username), // ✅ NUNCA null
    isPremium: messageData.isPremium || false,
    isProUser: messageData.isProUser || false, // ⚡ Usuario PRO (premio: arcoíris, badge)
    hasRainbowBorder: messageData.hasRainbowBorder || false,
    hasProBadge: messageData.hasProBadge || false,
    hasFeaturedCard: messageData.hasFeaturedCard || false,
    canUploadSecondPhoto: messageData.canUploadSecondPhoto || false,
    badge: messageData.badge || 'Nuevo', // 🏅 Badge de participación en eventos
    roleBadge: messageData.roleBadge || null,
    comuna: messageData.comuna || null,
    content: messageData.content,
    type: messageType,
    // ✅ Usar serverTimestamp() para sincronización correcta entre clientes
    timestamp: serverTimestamp(),
    reactions: { ...DEFAULT_MESSAGE_REACTIONS },
    read: false,
    replyTo: messageData.replyTo || null,
    trace,
    _unauthenticated: !auth.currentUser, // ⚠️ Marca para identificar usuarios no autenticados (para UI)
    // 📬 Campos de verificación de entrega (sistema de checks)
    status: 'sent', // sent | delivered | read
    deliveredTo: [], // Array de userIds que recibieron el mensaje
    readBy: [], // Array de userIds que leyeron el mensaje
    deliveredAt: null, // Timestamp de primera entrega
    readAt: null, // Timestamp de primera lectura
    ...(Array.isArray(messageData.media) && messageData.media.length > 0 ? { media: messageData.media } : {}),
  };

  // ⏱️ TIMING: Registrar timestamp de envío para medir velocidad
  const sendTimestamp = Date.now();
  const sendTimeISO = new Date().toISOString();

  // Logs de debug desactivados

  // 🔍 TRACE: Intentando escribir en Firestore (dentro de doSendMessage)
  const traceId = messageData.traceId || trace?.traceId || generateUUID();
  traceEvent(TRACE_EVENTS.FIREBASE_WRITE_ATTEMPT, {
    traceId,
    roomId,
    userId: messageData.userId,
    username: username,
    content: messageData.content?.substring(0, 50),
    messagePath: `rooms/${roomId}/messages`,
  });

  // Enviar a Firestore (persistencia local primero)
  let docRef;
  try {
    // 🔧 TIMEOUT AUMENTADO: 30s para tolerar alta latencia de Firestore
    // ✅ ESTRATEGIA: Esperar pacientemente, NO lanzar error si responde tarde
    const addDocWithTimeout = (ref, data, timeoutMs = 30000) => {
      return new Promise(async (resolve, reject) => {
        let timeoutReached = false;

        const timeoutId = setTimeout(() => {
          timeoutReached = true;
          // ⚠️ NO rechazar - solo loguear advertencia
          console.warn(`⏳ addDoc tardó más de ${timeoutMs}ms pero seguimos esperando...`);
        }, timeoutMs);

        try {
          const result = await addDoc(ref, data);
          clearTimeout(timeoutId);

          if (timeoutReached) {
            console.warn(`✅ addDoc respondió después de ${timeoutMs}ms - mensaje guardado OK`);
          }

          resolve(result);
        } catch (error) {
          clearTimeout(timeoutId);
          reject(error);
        }
      });
    };

    docRef = await addDocWithTimeout(messagesRef, message);
    
    // 🔍 TRACE: Escritura en Firestore exitosa
    traceEvent(TRACE_EVENTS.FIREBASE_WRITE_SUCCESS, {
      traceId,
      messageId: docRef.id,
      roomId,
      userId: messageData.userId,
      firestoreId: docRef.id,
    });
  } catch (addDocError) {
    console.error('❌ Error enviando mensaje:', {
      error: addDocError,
      code: addDocError.code,
      message: addDocError.message,
      name: addDocError.name,
      stack: addDocError.stack,
      // 🔍 Información adicional de diagnóstico
      firebaseConnected: !!db,
      authConnected: !!auth,
      currentUser: auth.currentUser?.uid || 'NO AUTH',
      messagesRefPath: `rooms/${roomId}/messages`,
    });
    throw addDocError; // Re-lanzar para que el catch externo lo maneje
  }

  // ⏱️ TIMING: Calcular tiempo de envío a Firestore
  const firestoreSendTime = Date.now() - sendTimestamp;

  // 📬 Registrar mensaje en servicio de delivery para tracking
  const deliveryService = getDeliveryService();
  deliveryService.registerOutgoingMessage(docRef.id, {
    ...messageData,
    roomId,
  });

  // 🔍 Log detallado de mensaje enviado CON VELOCIDAD
  // ✅ HABILITADO TEMPORALMENTE PARA DEBUGGING URGENTE
  const isAuthenticated = !!auth.currentUser;
  console.log(
    `%c📤 ${isAuthenticated ? '🔐 LOGUEADO' : '👤 NO LOGUEADO'} → Mensaje enviado`,
    `color: ${isAuthenticated ? '#00ff00' : '#ffaa00'}; font-weight: bold; font-size: 14px; background: ${isAuthenticated ? '#001100' : '#332200'}; padding: 4px 8px; border-radius: 4px;`,
    {
      '👤 Usuario': username,
      '🔑 Tipo': isAuthenticated ? 'AUTENTICADO ✅' : 'NO AUTENTICADO ⚠️',
      '💬 Mensaje': messageData.content.substring(0, 50) + (messageData.content.length > 50 ? '...' : ''),
      '🆔 MessageID': docRef.id,
      '🏠 Sala': roomId,
      '⏱️ Tiempo': `${firestoreSendTime}ms`,
      '📅 Hora': sendTimeISO,
    }
  );

  // Cache rate limiting (memoria)
  recordMessage(messageData.userId, messageData.content);

  // Tareas en background
  Promise.all([
    isRealUser && isTextMessage
      ? moderateMessage(messageData.content, messageData.userId, messageData.username, roomId).catch(() => {})
      : Promise.resolve(),
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
 * 📊 Incluye monitoreo de rendimiento
 */
export const sendMessage = async (roomId, messageData, isAnonymous = false, skipQueue = false) => {
  // 📊 Medir velocidad de envío
  const perfMonitor = getPerformanceMonitor();

  try {
    const { result, latency } = await perfMonitor.measureMessageSend(
      () => doSendMessage(roomId, { ...messageData }, isAnonymous),
      messageData
    );
    return result;
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

    // ❌ COLA DESHABILITADA (07/01/2026) - ESTABILIZACIÓN
    // Reintentos automáticos causaban loops y estados inconsistentes
    // ESTRATEGIA: Si falla, falla. El usuario puede reintentar manualmente.
    // NO agregamos a cola, NO flusheamos, NO reintentos automáticos.

    // ⚠️ COMENTADO - Cola de pendingMessages deshabilitada
    // if (!skipQueue && isNetworkError(error)) {
    //   pendingMessages.push({ roomId, messageData, isAnonymous });
    //   console.warn('[SEND][QUEUE] Mensaje en cola por problema de red. Total en cola:', pendingMessages.length);
    //   flushPendingMessages().catch(() => {});
    //   return { queued: true };
    // }

    console.error('❌ [SEND] Mensaje NO enviado - sin reintentos automáticos');
    throw error;
  }
};

/**
 * Envío especializado para botEngine.
 * Usa el flujo estándar de sendMessage, pero fuerza trazabilidad BOT.
 */
export const sendBotMessageFromEngine = async (roomId, messageData = {}) => {
  if (roomId !== 'admin-testing') {
    throw new Error(`BOT_ENGINE bloqueado: roomId "${roomId}" no permitido`);
  }

  const username = messageData.username || 'bot_engine';
  const userId = messageData.userId || `bot_${username}`;
  const avatar = messageData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`;

  return sendMessage(
    roomId,
    {
      ...messageData,
      userId,
      username,
      avatar,
      isPremium: false,
      trace: {
        origin: 'BOT',
        source: 'BOT_ENGINE',
        actorId: userId,
        actorType: 'BOT_CONVERSATION',
        system: 'botEngine',
        traceId: generateUUID(),
        createdAt: Date.now(),
      },
    },
    false
  );
};


/**
 * Procesa un snapshot de Firestore y devuelve mensajes ordenados (viejo->nuevo)
 */
const processSnapshotToMessages = (snapshot, roomId) => {
  const receiveTimestamp = Date.now();
  const messages = [];
  for (let i = 0; i < snapshot.docs.length; i++) {
    const d = snapshot.docs[i];
    const data = d.data();
    const timestampMs = data.timestamp?.toMillis?.() ?? null;
    messages.push({
      id: d.id,
      ...data,
      timestampMs,
      timestamp: data.timestamp ?? null,
      _receiveLatency: timestampMs ? receiveTimestamp - timestampMs : null,
    });
  }
  const orderedMessages = [];
  for (let i = messages.length - 1; i >= 0; i--) orderedMessages.push(messages[i]);
  return annotateFastReplyHighlights(orderedMessages);
};

const getCacheKey = (roomId, messageLimit) => `${roomId}:${messageLimit}`;

const readCachedMessages = (roomId, messageLimit) => {
  const cacheKey = getCacheKey(roomId, messageLimit);
  const memCached = messageSnapshotCache.get(cacheKey);
  const now = Date.now();
  if (memCached && (now - memCached.savedAt) <= MESSAGE_CACHE_TTL_MS) {
    return memCached.messages;
  }

  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(`chat_snapshot_cache:${cacheKey}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.savedAt || !Array.isArray(parsed.messages)) return null;
    if ((now - parsed.savedAt) > MESSAGE_CACHE_TTL_MS) return null;
    messageSnapshotCache.set(cacheKey, {
      savedAt: parsed.savedAt,
      messages: parsed.messages,
    });
    return parsed.messages;
  } catch {
    return null;
  }
};

const writeCachedMessages = (roomId, messageLimit, messages) => {
  const cacheKey = getCacheKey(roomId, messageLimit);
  const savedAt = Date.now();
  messageSnapshotCache.set(cacheKey, { savedAt, messages });

  if (typeof window === 'undefined') return;
  try {
    const serializableMessages = messages.map((msg) => ({
      ...msg,
      timestamp: null, // evitar serializar objetos Timestamp de Firestore
    }));
    sessionStorage.setItem(
      `chat_snapshot_cache:${cacheKey}`,
      JSON.stringify({ savedAt, messages: serializableMessages })
    );
  } catch {
    // Ignore cache storage issues (quota/serialization)
  }
};

/**
 * Suscripción a mensajes en tiempo real - orden estable (nuevo->viejo en query, se invierte en cliente)
 * ⚡ Carga inicial con getDocs para mostrar mensajes de inmediato; onSnapshot para tiempo real
 */
export const subscribeToRoomMessages = (roomId, callback, messageLimit = 60) => {
  const messagesRef = collection(db, 'rooms', roomId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(messageLimit));
  const traceEnabled = isMessageTraceEnabled();

  // onSnapshot ya entrega datos iniciales inmediatamente — getDocs redundante eliminado
  const cached = readCachedMessages(roomId, messageLimit);
  if (Array.isArray(cached) && cached.length > 0) {
    callback(cached);
  }

  const perfMonitor = getPerformanceMonitor();

  const unsubscribe = onSnapshot(
    q,
    {
      includeMetadataChanges: false, // solo cambios reales
    },
    (snapshot) => {
      const orderedMessages = processSnapshotToMessages(snapshot, roomId);

      perfMonitor.recordSnapshotLatency(orderedMessages);
      writeCachedMessages(roomId, messageLimit, orderedMessages);

      // 🔍 TRACE: Callback ejecutado con mensajes recibidos
      if (traceEnabled) {
        traceEvent(TRACE_EVENTS.CALLBACK_EXECUTED, {
          roomId,
          messageCount: orderedMessages.length,
          messageIds: orderedMessages.slice(-5).map((m) => m.id),
          fromCache: snapshot.metadata.fromCache,
          hasPendingWrites: snapshot.metadata.hasPendingWrites,
        });
      }

      callback(orderedMessages);
    },
    (error) => {
      console.error(`[CHAT SERVICE] ❌ ERROR en onSnapshot para sala ${roomId}:`, {
        name: error.name,
        code: error.code,
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      
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
        console.error(`[CHAT SERVICE] 🚨 ERROR NO TRANSITORIO para sala ${roomId}:`, error.code, error.message);
        console.error('[SUBSCRIBE] 🔍 Detalles completos:', {
          code: error.code,
          message: error.message,
          roomId,
          timestamp: new Date().toISOString(),
          error: error
        });
        // Evitar throw dentro de callback de onSnapshot para no romper el loop de render.
        // El componente superior ya mantiene el último estado estable.
      } else {
        console.warn(`[CHAT SERVICE] ⚠️ Error transitorio ignorado para sala ${roomId}:`, error.code);
      }
    }
  );

  return unsubscribe;
};

export const addReactionToMessage = async (roomId, messageId, reactionType) => {
  console.log('[REACTION SERVICE] 📥 Recibido:', { roomId, messageId, reactionType });

  if (!roomId || !messageId || !reactionType) {
    const error = new Error('Parámetros inválidos para reacción');
    console.error('[REACTION SERVICE] ❌', error.message, { roomId, messageId, reactionType });
    throw error;
  }

  if (!ALLOWED_REACTION_TYPES.has(reactionType)) {
    const error = new Error('INVALID_REACTION_TYPE');
    console.warn('[REACTION SERVICE] ⚠️ Tipo de reacción no permitido:', reactionType);
    throw error;
  }

  if (!auth.currentUser || auth.currentUser.isAnonymous) {
    const error = new Error('REQUIRES_REGISTERED_USER');
    console.warn('[REACTION SERVICE] ⚠️ Reacción bloqueada para invitado/anónimo');
    throw error;
  }

  try {
    const messageRef = doc(db, 'rooms', roomId, 'messages', messageId);
    await updateDoc(messageRef, {
      [`reactions.${reactionType}`]: increment(1),
    });

    const updatedSnap = await getDoc(messageRef);
    if (!updatedSnap.exists()) {
      throw new Error(`Mensaje ${messageId} no encontrado en sala ${roomId}`);
    }

    const persistedReactions = updatedSnap.data()?.reactions || { ...DEFAULT_MESSAGE_REACTIONS };
    console.log('[REACTION SERVICE] ✅ Reacción guardada:', persistedReactions);
    return persistedReactions;
  } catch (error) {
    console.error('[REACTION SERVICE] ❌ Error:', error.message, error.code);
    throw error;
  }
};

export const deleteMessageWithMedia = async (
  roomId,
  messageId,
  messageData = null,
  options = {}
) => {
  if (!roomId || !messageId) {
    throw new Error('INVALID_DELETE_PARAMS');
  }

  if (!auth.currentUser || auth.currentUser.isAnonymous) {
    throw new Error('REQUIRES_REGISTERED_USER');
  }

  const roomScope = normalizeRoomScope(options?.roomScope);
  const isAdminDelete = Boolean(options?.isAdmin);
  const messageRef = getRoomMessageDocRef(roomId, messageId, roomScope);
  let effectiveMessage = messageData || null;

  if (!effectiveMessage || !effectiveMessage.userId) {
    const snap = await getDoc(messageRef);
    if (!snap.exists()) {
      throw new Error('MESSAGE_NOT_FOUND');
    }
    effectiveMessage = { id: snap.id, ...snap.data() };
  }

  if (!isAdminDelete && effectiveMessage.userId !== auth.currentUser.uid) {
    throw new Error('NOT_MESSAGE_OWNER');
  }

  await deleteDoc(messageRef);

  const mediaPaths = extractMessageMediaPaths(effectiveMessage).filter((path) => path.startsWith('chat_media/'));
  await Promise.all(mediaPaths.map(async (path) => {
    try {
      await deleteObject(storageRef(storage, path));
    } catch (error) {
      if (!isStorageNotFoundError(error)) {
        console.warn('[DELETE][MEDIA] No se pudo borrar asset de Storage:', path, error?.message || error);
      }
    }
  }));
};

const deleteMessageDocsAndMedia = async (docsToDelete = []) => {
  if (!Array.isArray(docsToDelete) || docsToDelete.length === 0) {
    return 0;
  }

  const batch = writeBatch(db);
  const mediaPaths = [];

  docsToDelete.forEach((docSnap) => {
    const data = docSnap.data() || {};
    batch.delete(docSnap.ref);
    mediaPaths.push(
      ...extractMessageMediaPaths(data).filter((path) => path.startsWith('chat_media/'))
    );
  });

  await batch.commit();

  await Promise.all(
    mediaPaths.map(async (path) => {
      try {
        await deleteObject(storageRef(storage, path));
      } catch (error) {
        if (!isStorageNotFoundError(error)) {
          console.warn('[DELETE][MEDIA] No se pudo borrar asset de Storage:', path, error?.message || error);
        }
      }
    })
  );

  return docsToDelete.length;
};

export const deleteUserMessagesInRoom = async (
  roomId,
  targetUserId,
  options = {}
) => {
  if (!roomId || !targetUserId) {
    throw new Error('INVALID_DELETE_PARAMS');
  }

  if (!auth.currentUser || auth.currentUser.isAnonymous) {
    throw new Error('REQUIRES_REGISTERED_USER');
  }

  if (!options?.isAdmin) {
    throw new Error('ADMIN_REQUIRED');
  }

  const roomScope = normalizeRoomScope(options?.roomScope);
  const messagesRef = getRoomMessagesCollectionRef(roomId, roomScope);
  let deletedCount = 0;

  while (true) {
    const snapshot = await getDocs(
      query(
        messagesRef,
        where('userId', '==', targetUserId),
        limit(MAX_BULK_DELETE_BATCH)
      )
    );

    if (snapshot.empty) break;

    deletedCount += await deleteMessageDocsAndMedia(snapshot.docs);

    if (snapshot.size < MAX_BULK_DELETE_BATCH) {
      break;
    }
  }

  return { deletedCount };
};

export const deleteAllMessagesInRoom = async (roomId, options = {}) => {
  if (!roomId) {
    throw new Error('INVALID_DELETE_PARAMS');
  }

  if (!auth.currentUser || auth.currentUser.isAnonymous) {
    throw new Error('REQUIRES_REGISTERED_USER');
  }

  if (!options?.isAdmin) {
    throw new Error('ADMIN_REQUIRED');
  }

  const roomScope = normalizeRoomScope(options?.roomScope);
  const messagesRef = getRoomMessagesCollectionRef(roomId, roomScope);
  const includeSystem = Boolean(options?.includeSystem ?? true);
  let deletedCount = 0;

  while (true) {
    const snapshot = await getDocs(query(messagesRef, limit(MAX_BULK_DELETE_BATCH)));

    if (snapshot.empty) break;

    const docsToDelete = includeSystem
      ? snapshot.docs
      : snapshot.docs.filter((docSnap) => {
          const data = docSnap.data() || {};
          const userId = String(data.userId || '');
          return userId !== 'system' && !userId.startsWith('system_');
        });

    if (docsToDelete.length > 0) {
      deletedCount += await deleteMessageDocsAndMedia(docsToDelete);
    }

    if (snapshot.size < MAX_BULK_DELETE_BATCH) {
      break;
    }
  }

  return { deletedCount };
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
      reactions: { ...DEFAULT_MESSAGE_REACTIONS },
    };

    await addDoc(messagesRef, welcomeMessage);
  } catch (error) {
    console.error('Error creating welcome message:', error);
    throw error;
  }
};

// ========================================
// 🆕 SALAS SECUNDARIAS: Funciones para chat secundario
// ========================================

/**
 * Envío directo para salas secundarias (sin cola) - usado internamente
 */
const doSendSecondaryMessage = async (roomId, messageData, isAnonymous = false) => {
  // Misma lógica que doSendMessage pero con colección 'secondary-rooms'
  const isSystemMessage = messageData.userId?.startsWith('system') ||
                         messageData.userId?.startsWith('bot_') ||
                         messageData.userId?.startsWith('ai_') ||
                         messageData.userId?.startsWith('seed_user_');

  if (auth.currentUser && !isSystemMessage && messageData.userId !== auth.currentUser.uid) {
    console.warn('[SEND SECONDARY] ⚠️ userId no coincide con auth.currentUser.uid, corrigiendo...');
    messageData.userId = auth.currentUser.uid;
  }
  
  if (!auth.currentUser && !isSystemMessage) {
    const unauthenticatedUserId = `unauthenticated_${localStorage.getItem('session_id') || `temp_${Date.now()}_${Math.random()}`}`;
    if (!localStorage.getItem('session_id')) {
      localStorage.setItem('session_id', unauthenticatedUserId.split('_')[1]);
    }
    messageData.userId = unauthenticatedUserId;
  }

  const isBot = messageData.userId?.startsWith('bot_') ||
                messageData.userId?.startsWith('ai_') ||
                messageData.userId?.startsWith('static_bot_') ||
                messageData.userId === 'system';

  // Usar colección 'secondary-rooms' en lugar de 'rooms'
  const messagesRef = collection(db, 'secondary-rooms', roomId, 'messages');

  const trace = messageData.trace || {
    origin: isBot ? 'SYSTEM' : 'HUMAN',
    source: isBot ? 'LEGACY_BOT' : 'USER_INPUT',
    actorId: messageData.userId,
    actorType: isBot ? 'BOT' : 'HUMAN',
    system: 'chatService',
    traceId: generateUUID(),
    createdAt: Date.now()
  };

  const username = messageData.username || 'Usuario';
  if (!username || username === 'undefined') {
    console.error('[SEND SECONDARY] ❌ ERROR: username es inválido:', messageData.username);
    throw new Error('Username es requerido para enviar mensajes');
  }

  if (!auth.currentUser) {
    const linkPattern = /(https?:\/\/|www\.|@|#)/i;
    if (linkPattern.test(messageData.content)) {
      throw new Error('Los usuarios no registrados no pueden enviar links. Regístrate para compartir enlaces.');
    }
  }

  // 🛡️ MODERACIÓN ANTI-EXTRACCIÓN (enforcement real en salas secundarias)
  try {
    const sanitizeResult = await sanitizeMessage(
      messageData.content,
      messageData.userId,
      messageData.username || 'Usuario',
      roomId,
      { dryRun: false }
    );

    if (!sanitizeResult.allowed) {
      const blockedError = new Error(sanitizeResult.reason || 'Mensaje bloqueado por moderación');
      blockedError.code = 'content-blocked';
      blockedError.moderation = sanitizeResult;
      throw blockedError;
    }

    messageData.content = sanitizeResult.content || String(messageData.content || '').trim();
  } catch (sanitizeError) {
    throw sanitizeError;
  }

  const ensureAvatar = (avatar, username) => {
    if (avatar && avatar.trim() && !avatar.includes('undefined')) {
      return avatar;
    }
    const seed = username || 'guest';
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
  };

  const message = {
    clientId: messageData.clientId || null,
    userId: messageData.userId,
    senderUid: auth.currentUser?.uid || messageData.senderUid || null,
    username,
    avatar: ensureAvatar(messageData.avatar, username),
    isPremium: messageData.isPremium || false,
    isProUser: messageData.isProUser || false,
    hasRainbowBorder: messageData.hasRainbowBorder || false,
    hasProBadge: messageData.hasProBadge || false,
    hasFeaturedCard: messageData.hasFeaturedCard || false,
    canUploadSecondPhoto: messageData.canUploadSecondPhoto || false,
    content: messageData.content,
    type: messageData.type || 'text',
    timestamp: serverTimestamp(),
    reactions: { ...DEFAULT_MESSAGE_REACTIONS },
    read: false,
    replyTo: messageData.replyTo || null,
    trace,
    _unauthenticated: !auth.currentUser,
    status: 'sent',
    deliveredTo: [],
    readBy: [],
    deliveredAt: null,
    readAt: null,
  };

  const sendTimestamp = Date.now();
  let docRef;
  
  try {
    const addDocWithTimeout = (ref, data, timeoutMs = 15000) => {
      return new Promise(async (resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error(`⏱️ TIMEOUT: addDoc tardó más de ${timeoutMs}ms`));
        }, timeoutMs);

        try {
          const result = await addDoc(ref, data);
          clearTimeout(timeoutId);
          resolve(result);
        } catch (error) {
          clearTimeout(timeoutId);
          reject(error);
        }
      });
    };

    docRef = await addDocWithTimeout(messagesRef, message);
  } catch (addDocError) {
    console.error('❌ Error enviando mensaje a sala secundaria:', addDocError);
    throw addDocError;
  }

  const firestoreSendTime = Date.now() - sendTimestamp;
  const deliveryService = getDeliveryService();
  deliveryService.registerOutgoingMessage(docRef.id, {
    ...messageData,
    roomId: `secondary-${roomId}`,
  });

  const isAuthenticated = !!auth.currentUser;
  console.log(
    `%c📤 ${isAuthenticated ? '🔐 LOGUEADO' : '👤 NO LOGUEADO'} → Mensaje enviado (SECUNDARIA)`,
    `color: ${isAuthenticated ? '#00ff00' : '#ffaa00'}; font-weight: bold;`,
    {
      '👤 Usuario': username,
      '🆔 MessageID': docRef.id,
      '🏠 Sala': `secondary-${roomId}`,
      '⏱️ Tiempo': `${firestoreSendTime}ms`,
    }
  );

  recordMessage(messageData.userId, messageData.content);

  return { id: docRef.id, ...message };
};

/**
 * Envía un mensaje a una sala secundaria
 * Usa la colección 'secondary-rooms' en lugar de 'rooms'
 */
export const sendSecondaryMessage = async (roomId, messageData, isAnonymous = false, skipQueue = false) => {
  const perfMonitor = getPerformanceMonitor();

  try {
    const { result, latency } = await perfMonitor.measureMessageSend(
      () => doSendSecondaryMessage(roomId, { ...messageData }, isAnonymous),
      messageData
    );
    return result;
  } catch (error) {
    console.error('[SEND SECONDARY] ❌ Error enviando mensaje:', error);

    if (!skipQueue && isNetworkError(error)) {
      // Podríamos agregar una cola separada para secundarias si es necesario
      console.warn('[SEND SECONDARY][QUEUE] Mensaje en cola por problema de red');
      throw error; // Por ahora, solo relanzar el error
    }

    throw error;
  }
};

/**
 * Suscripción a mensajes en tiempo real para salas secundarias
 * Usa la colección 'secondary-rooms' en lugar de 'rooms'
 */
export const subscribeToSecondaryRoomMessages = (roomId, callback, messageLimit = 60) => {
  const messagesRef = collection(db, 'secondary-rooms', roomId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(messageLimit));

  const perfMonitor = getPerformanceMonitor();

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const orderedMessages = processSnapshotToMessages(snapshot, roomId);

      perfMonitor.recordSnapshotLatency(orderedMessages);

      callback(orderedMessages);
    },
    (error) => {
      console.error('Error en suscripción a sala secundaria:', error);
      callback([]);
    }
  );

  return unsubscribe;
};

/**
 * Marca mensajes como leídos en salas secundarias
 */
export const markSecondaryMessagesAsRead = async (roomId, currentUserId) => {
  try {
    const messagesRef = collection(db, 'secondary-rooms', roomId, 'messages');
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
    console.error('Error marking secondary messages as read:', error);
  }
};

/**
 * Agrega reacción a mensaje en sala secundaria
 */
export const addReactionToSecondaryMessage = async (roomId, messageId, reaction) => {
  try {
    if (!ALLOWED_REACTION_TYPES.has(reaction)) {
      throw new Error('INVALID_REACTION_TYPE');
    }

    const messageRef = doc(db, 'secondary-rooms', roomId, 'messages', messageId);
    await updateDoc(messageRef, {
      [`reactions.${reaction}`]: increment(1),
    });

    const updatedSnap = await getDoc(messageRef);
    if (!updatedSnap.exists()) {
      throw new Error('Mensaje no encontrado');
    }

    return updatedSnap.data()?.reactions || { ...DEFAULT_MESSAGE_REACTIONS };
  } catch (error) {
    console.error('Error adding reaction to secondary message:', error);
    throw error;
  }
};
