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
import { getPerformanceMonitor } from '@/services/performanceMonitor';
import { getDeliveryService } from '@/services/messageDeliveryService';

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
  // 🔍 DIAGNÓSTICO: Logging detallado para identificar problemas localhost → producción
  // if (import.meta.env.DEV) {
  //   const diagnosticInfo = {
  //     timestamp: new Date().toISOString(),
  //     roomId,
  //     hasAuth: !!auth,
  //     hasCurrentUser: !!auth.currentUser,
  //     currentUserUid: auth.currentUser?.uid,
  //     currentUserEmail: auth.currentUser?.email,
  //     messageDataUserId: messageData.userId,
  //     messageDataUsername: messageData.username,
  //     userIdsMatch: messageData.userId === auth.currentUser?.uid,
  //     isAnonymous,
  //     firebaseProjectId: db.app.options.projectId,
  //     firebaseAuthDomain: auth.app.options.authDomain,
  //     usingEmulator: import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true'
  //   };
  //   console.log('🔍 [DIAGNÓSTICO] Estado antes de enviar mensaje:', diagnosticInfo);
  // }

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

  // ⚠️ VALIDAR LINKS: Usuarios no autenticados NO pueden enviar links
  if (!auth.currentUser) {
    const linkPattern = /(https?:\/\/|www\.|@|#)/i;
    if (linkPattern.test(messageData.content)) {
      throw new Error('Los usuarios no registrados no pueden enviar links. Regístrate para compartir enlaces.');
    }
  }

  const message = {
    clientId: messageData.clientId || null,
    userId: messageData.userId,
    senderUid: auth.currentUser?.uid || messageData.senderUid || null,
    username, // ✅ Validado arriba
    avatar: messageData.avatar || null,
    isPremium: messageData.isPremium || false,
    content: messageData.content,
    type: messageData.type || 'text',
    // ✅ USUARIOS NO AUTENTICADOS: usar timestamp del servidor siempre que sea posible
    // Firestore acepta timestamp sin auth si las reglas lo permiten
    timestamp: serverTimestamp(),
    reactions: { like: 0, dislike: 0 },
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
  };

  // ⏱️ TIMING: Registrar timestamp de envío para medir velocidad
  const sendTimestamp = Date.now();
  const sendTimeISO = new Date().toISOString();

  // Enviar a Firestore (persistencia local primero)
  const docRef = await addDoc(messagesRef, message);

  // ⏱️ TIMING: Calcular tiempo de envío a Firestore
  const firestoreSendTime = Date.now() - sendTimestamp;

  // 📬 Registrar mensaje en servicio de delivery para tracking
  const deliveryService = getDeliveryService();
  deliveryService.registerOutgoingMessage(docRef.id, {
    ...messageData,
    roomId,
  });

  // 🔍 Log detallado de mensaje enviado CON VELOCIDAD
  // 🔍 PRUEBA 6 ENERO: DESACTIVADO - Causaba sobrecarga en consola
  // const isAuthenticated = !!auth.currentUser;
  // console.log(
  //   `%c📤 ${isAuthenticated ? '🔐 LOGUEADO' : '👤 NO LOGUEADO'} → Mensaje enviado`,
  //   `color: ${isAuthenticated ? '#00ff00' : '#ffaa00'}; font-weight: bold; font-size: 14px; background: ${isAuthenticated ? '#001100' : '#332200'}; padding: 4px 8px; border-radius: 4px;`,
  //   {
  //     '👤 Usuario': username,
  //     '🔑 Tipo': isAuthenticated ? 'AUTENTICADO ✅' : 'NO AUTENTICADO ⚠️',
  //     '💬 Mensaje': messageData.content.substring(0, 50) + (messageData.content.length > 50 ? '...' : ''),
  //     '🆔 MessageID': docRef.id,
  //     '🏠 Sala': roomId,
  //     '⏱️ Tiempo': `${firestoreSendTime}ms`,
  //     '📅 Hora': sendTimeISO,
  //   }
  // );

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
 * ⚡ OPTIMIZADO: Límite reducido a 50 para mejorar velocidad (antes 200 causaba 11+ segundos de latencia)
 */
export const subscribeToRoomMessages = (roomId, callback, messageLimit = 50) => {
  const messagesRef = collection(db, 'rooms', roomId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(messageLimit));

  // ⚡ OPTIMIZACIÓN CRÍTICA: Medir tiempo de entrega para diagnosticar retrasos
  let lastSnapshotTime = Date.now();
  let isFirstSnapshot = true; // Primera snapshot puede ser más lenta (carga inicial)

  // 📊 Obtener monitor de rendimiento
  const perfMonitor = getPerformanceMonitor();

  return onSnapshot(
    q,
    (snapshot) => {
      const snapshotReceivedTime = Date.now();
      const timeSinceLastSnapshot = snapshotReceivedTime - lastSnapshotTime;
      lastSnapshotTime = snapshotReceivedTime;

      // ⚡ OPTIMIZACIÓN: Primera snapshot puede ser lenta (carga inicial), no alertar
      // ⚡ OPTIMIZACIÓN: Primera snapshot puede ser lenta (carga inicial), no alertar
      const isFirstSnapshotNow = isFirstSnapshot;
      if (isFirstSnapshot) {
        isFirstSnapshot = false;
        // Primera snapshot: solo loguear en modo debug explícito
        // if (import.meta.env.VITE_DEBUG_MESSAGES === 'true') {
        //   console.log('[SUBSCRIBE] 📨 Snapshot inicial (carga inicial):', {
        //     docsCount: snapshot.docs.length,
        //     roomId,
        //     fromCache: snapshot.metadata.fromCache
        //   });
        // }
      }

      // 🔍 DIAGNÓSTICO: Alertar si hay retraso REAL (> 3 segundos) o viene de caché
      // ⚡ UMBRAL REDUCIDO: De 5s a 3s para detectar problemas más rápido
      const isActuallySlow = timeSinceLastSnapshot > 3000; // ⚠️ Alertar si > 3 segundos
      const isFromCache = snapshot.metadata.fromCache;
      const isVerySlow = timeSinceLastSnapshot > 10000; // 🔴 CRÍTICO si > 10 segundos

      // ⚠️ ALERTA: Solo si hay retraso REAL (> 3 segundos) o viene de caché (datos no en tiempo real)
      // Ignorar primera snapshot (carga inicial es normal que sea lenta)
      // ⚠️ ALERTA: Solo si hay retraso REAL (> 3 segundos) o viene de caché (datos no en tiempo real)
      // Ignorar primera snapshot (carga inicial es normal que sea lenta)
      // if ((isActuallySlow || isFromCache) && !isFirstSnapshotNow) {
      //   const logLevel = isVerySlow ? 'error' : 'warn';
      //   const logMethod = isVerySlow ? console.error : console.warn;
      //   const emoji = isVerySlow ? '🔴' : '⚠️';
      //   
      //   logMethod(`${emoji} [${isVerySlow ? 'MUY LENTO' : 'LENTO'}] Snapshot recibido:`, {
      //     docsCount: snapshot.docs.length,
      //     roomId,
      //     timeSinceLastSnapshot: `${timeSinceLastSnapshot}ms`,
      //     fromCache: isFromCache,
      //     hasPendingWrites: snapshot.metadata.hasPendingWrites,
      //     timestamp: new Date().toISOString(),
      //     ...(isVerySlow ? {
      //       suggestion: 'Posibles causas: conexión lenta, demasiados mensajes, o problemas de red. Verificar conexión a internet y reducir límite de mensajes si es necesario.'
      //     } : {})
      //   });
      // }

      // ⚡ OPTIMIZACIÓN: Procesar mensajes de forma más eficiente
      const startProcessTime = performance.now();
      
      // ⚡ OPTIMIZACIÓN: Usar for loop en vez de map para mejor rendimiento con muchos docs
      // ⏱️ TIMING: Registrar cuando se reciben los mensajes
      const receiveTimestamp = Date.now();
      const messages = [];
      for (let i = 0; i < snapshot.docs.length; i++) {
        const doc = snapshot.docs[i];
        const data = doc.data();
        const timestampMs = data.timestamp?.toMillis?.() ?? null;
        
        // ⏱️ TIMING: Calcular latencia si el mensaje tiene timestamp del servidor
        let latency = null;
        if (timestampMs) {
          latency = receiveTimestamp - timestampMs;
        }
        
        messages.push({
          id: doc.id,
          ...data,
          timestampMs,
          timestamp: data.timestamp ?? null,
          _receiveLatency: latency, // Latencia en ms desde que se creó hasta que llegó
        });
      }

      // ⚡ OPTIMIZACIÓN: Invertir array en lugar de usar reverse() (más eficiente)
      const orderedMessages = [];
      for (let i = messages.length - 1; i >= 0; i--) {
        orderedMessages.push(messages[i]);
      }
      
      const processTime = performance.now() - startProcessTime;
      
      // ⚠️ ALERTA: Solo si el procesamiento toma más de 50ms (bloqueo real)
      if (processTime > 50) {
        // console.warn(`⚠️ [LENTO] Procesamiento de mensajes tomó ${processTime.toFixed(2)}ms (puede estar bloqueando)`);
      }

      // 📊 Registrar latencia de snapshot en el monitor
      perfMonitor.recordSnapshotLatency(orderedMessages);

      // 📬 Procesar mensajes para delivery tracking y enviar ACKs
      const deliveryService = getDeliveryService();
      orderedMessages.forEach(msg => {
        // Procesar actualización de delivery para mensajes propios
        deliveryService.processMessageUpdate(msg);

        // 🔍 Log cuando recibimos mensaje de otro usuario CON VELOCIDAD
        // 🔍 PRUEBA 6 ENERO: DESACTIVADO - Causaba sobrecarga en consola (se ejecuta por cada mensaje)
        // const isMessageFromAuth = !msg._unauthenticated && msg.senderUid;
        // const currentUserIsAuth = !!auth.currentUser;

        // console.log(
        //   `%c📥 ${currentUserIsAuth ? '🔐 YO LOGUEADO' : '👤 YO NO LOGUEADO'} ← ${isMessageFromAuth ? '🔐 DE LOGUEADO' : '👤 DE NO LOGUEADO'}`,
        //   `color: #00aaff; font-weight: bold; font-size: 13px; background: #001122; padding: 3px 6px; border-radius: 4px;`,
        //   {
        //     '👤 De': msg.username,
        //     '🔑 Remitente tipo': isMessageFromAuth ? 'AUTENTICADO ✅' : 'NO AUTENTICADO ⚠️',
        //     '💬 Mensaje': msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : ''),
        //     '🆔 MessageID': msg.id,
        //     '📅 Hora': new Date(msg.timestampMs).toLocaleTimeString(),
        //   }
        // );

        if (auth.currentUser && msg.userId !== auth.currentUser.uid) {
          const latency = msg._receiveLatency;
          const latencyColor = latency && latency < 1000 ? '#00ff00' : latency && latency < 3000 ? '#ffaa00' : '#ff0000';
          const latencyEmoji = latency && latency < 1000 ? '⚡' : latency && latency < 3000 ? '⚠️' : '🐌';


          // ⚡ CLOCK SKEW DETECTION & LOGGING DESACTIVADO POR PERFORMANCE
          // const isClockSkew = latency && latency > 3600000;
          // ... Logs comentados previamente ...

          // ⚠️ LOGS COMENTADOS: Causaban sobrecarga en consola con cientos de mensajes
          // if (isClockSkew) {
          //    console.log(
          //     `%c🕒 [RECEPCIÓN] Mensaje recibido - (Reloj desincronizado)`,
          //     `color: #999; font-weight: normal; font-size: 11px`,
          //     {
          //       id: msg.id.substring(0, 8),
          //       diff: `${(latency / 3600000).toFixed(1)} horas`,
          //       note: 'Tu reloj va adelantado respecto al servidor'
          //     }
          //    );
          // } else {
          //   console.log(
          //     `%c${latencyEmoji} [RECEPCIÓN] Mensaje recibido - Velocidad: ${latency ? latency + 'ms' : 'N/A'}`,
          //     `color: ${latencyColor}; font-weight: bold; font-size: 13px`,
          //     {
          //       messageId: msg.id.substring(0, 8) + '...',
          //       from: msg.username,
          //       content: msg.content?.substring(0, 30) + (msg.content?.length > 30 ? '...' : ''),
          //       roomId,
          //       '⏱️ Latencia total': latency ? `${latency}ms (${(latency / 1000).toFixed(2)}s)` : 'N/A',
          //       '📊 Velocidad': latency ? (latency < 1000 ? '⚡ RÁPIDO' : latency < 3000 ? '⚠️ NORMAL' : '🐌 LENTO') : 'N/A',
          //       '📅 Recibido a las': new Date().toISOString(),
          //     }
          //   );
          // }

          // Enviar ACK para mensajes de otros usuarios (background)
          deliveryService.markAsDelivered(roomId, msg.id, auth.currentUser.uid)
            .catch(() => {}); // Ignorar errores silenciosamente
        }
      });

      // ⚡ CRÍTICO: Ejecutar callback INMEDIATAMENTE (sin delays)
      callback(orderedMessages);
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
        console.error('[SUBSCRIBE] ❌ Error:', error.code, error.message);
        console.error('[SUBSCRIBE] 🔍 Detalles:', {
          code: error.code,
          message: error.message,
          roomId,
          timestamp: new Date().toISOString()
        });
        callback([]);
      }
    },
    { 
      includeMetadataChanges: false // ⚡ OPTIMIZACIÓN: false = solo cambios reales, más rápido
    }
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
