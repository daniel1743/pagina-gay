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
import { validateMessage as sanitizeMessage } from '@/services/antiSpamService';
import { getPerformanceMonitor } from '@/services/performanceMonitor';
import { getDeliveryService } from '@/services/messageDeliveryService';
import { traceEvent, TRACE_EVENTS } from '@/utils/messageTrace';

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
  // Diagnósticos desactivados para reducir logs

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

  // 📱 SANITIZAR NÚMEROS DE WHATSAPP/TELÉFONO
  // Los números se reemplazan automáticamente con CTA de chat privado
  try {
    const sanitizeResult = await sanitizeMessage(
      messageData.content,
      messageData.userId,
      messageData.username || 'Usuario',
      roomId
    );

    if (sanitizeResult.wasModified) {
      console.log(`[SEND] 📱 Números de WhatsApp sanitizados para ${messageData.username}:`, {
        numbersFound: sanitizeResult.numbersFound,
        hasContactIntent: sanitizeResult.hasContactIntent
      });
      // Reemplazar el contenido con la versión sanitizada
      messageData.content = sanitizeResult.content;
    }
  } catch (sanitizeError) {
    // FAIL-SAFE: Si falla la sanitización, continuar con el mensaje original
    console.warn('[SEND] ⚠️ Error en sanitización (continuando):', sanitizeError.message);
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
    content: messageData.content,
    type: messageData.type || 'text',
    // ✅ Usar serverTimestamp() para sincronización correcta entre clientes
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

// 🔍 DIAGNÓSTICO: Contador global de listeners activos (para debugging)
if (typeof window !== 'undefined') {
  window.__activeFirestoreListeners = window.__activeFirestoreListeners || 0;
}

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
  return orderedMessages;
};

/**
 * Suscripción a mensajes en tiempo real - orden estable (nuevo->viejo en query, se invierte en cliente)
 * ⚡ Carga inicial con getDocs para mostrar mensajes de inmediato; onSnapshot para tiempo real
 */
export const subscribeToRoomMessages = (roomId, callback, messageLimit = 60) => {
  console.log(`[CHAT SERVICE] 🔍 Iniciando suscripción a sala ${roomId} con límite ${messageLimit}`);
  const messagesRef = collection(db, 'rooms', roomId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(messageLimit));
  
  console.log(`[CHAT SERVICE] 📡 Query configurada: rooms/${roomId}/messages, ordenado por timestamp desc, límite ${messageLimit}`);

  // ⚡ CARGA INMEDIATA: getDocs para mostrar mensajes lo antes posible (evita esperar minutos al onSnapshot)
  getDocs(q)
    .then((snapshot) => {
      const ordered = processSnapshotToMessages(snapshot, roomId);
      if (ordered.length > 0) {
        console.log(`[CHAT SERVICE] ⚡ getDocs inicial: ${ordered.length} mensajes para sala ${roomId}`);
        callback(ordered);
      }
    })
    .catch((err) => {
      console.warn('[CHAT SERVICE] getDocs inicial falló, esperando onSnapshot:', err?.message);
    });

  // ⚡ OPTIMIZACIÓN CRÍTICA: Medir tiempo de entrega para diagnosticar retrasos
  let lastSnapshotTime = Date.now();
  let isFirstSnapshot = true; // Primera snapshot puede ser más lenta (carga inicial)

  // 📊 Obtener monitor de rendimiento
  const perfMonitor = getPerformanceMonitor();

  console.log(`[CHAT SERVICE] 🎯 Configurando onSnapshot para sala ${roomId}...`);
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      console.log(`[CHAT SERVICE] 📥 Snapshot recibido para sala ${roomId}:`, {
        docsCount: snapshot.docs.length,
        empty: snapshot.empty,
        fromCache: snapshot.metadata.fromCache,
        hasPendingWrites: snapshot.metadata.hasPendingWrites,
        isFirstSnapshot: isFirstSnapshot
      });
      const snapshotReceivedTime = Date.now();
      const timeSinceLastSnapshot = snapshotReceivedTime - lastSnapshotTime;
      lastSnapshotTime = snapshotReceivedTime;

      // ⚡ OPTIMIZACIÓN: Primera snapshot puede ser lenta (carga inicial), no alertar
      const isFirstSnapshotNow = isFirstSnapshot;
      if (isFirstSnapshot) {
        isFirstSnapshot = false;
      }
      // Logs de actualización desactivados para reducir spam en consola

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

      const startProcessTime = performance.now();
      const orderedMessages = processSnapshotToMessages(snapshot, roomId);
      
      console.log(`[CHAT SERVICE] ✅ Mensajes procesados: ${orderedMessages.length} mensajes ordenados para sala ${roomId}`);
      if (orderedMessages.length > 0) {
        console.log(`[CHAT SERVICE] 📝 Primer mensaje:`, {
          id: orderedMessages[0].id,
          username: orderedMessages[0].username,
          content: orderedMessages[0].content?.substring(0, 50),
          timestamp: orderedMessages[0].timestamp?.toMillis?.() || 'N/A'
        });
        console.log(`[CHAT SERVICE] 📝 Último mensaje:`, {
          id: orderedMessages[orderedMessages.length - 1].id,
          username: orderedMessages[orderedMessages.length - 1].username,
          content: orderedMessages[orderedMessages.length - 1].content?.substring(0, 50),
          timestamp: orderedMessages[orderedMessages.length - 1].timestamp?.toMillis?.() || 'N/A'
        });
      } else {
        console.warn(`[CHAT SERVICE] ⚠️ ARRAY VACÍO: No se procesaron mensajes para sala ${roomId} aunque snapshot tenía ${snapshot.docs.length} documentos`);
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

      // ❌ DESHABILITADO TEMPORALMENTE - Loop infinito de Firebase (07/01/2026)
      // markAsDelivered ejecutaba escrituras por cada mensaje recibido
      // Causaba miles de escrituras adicionales en cada snapshot
      // TODO: Re-habilitar con batch writes y throttling agresivo
      const shouldProcessDelivery = false; // ✅ DESHABILITADO temporalmente

      // ❌ COMENTADO - Loop infinito
      // const shouldProcessDelivery = !snapshot.metadata.hasPendingWrites && !isFirstSnapshotNow;

      if (shouldProcessDelivery) {
        orderedMessages.forEach(msg => {
          // Procesar actualización de delivery para mensajes propios
          deliveryService.processMessageUpdate(msg);

          if (auth.currentUser && msg.userId !== auth.currentUser.uid) {
            // ⚠️ FIX: Solo marcar como delivered si NO lo hemos hecho antes
            // Usar un Set para trackear mensajes ya procesados
            if (!window.__deliveredMessages) {
              window.__deliveredMessages = new Set();
            }

            const deliveryKey = `${roomId}:${msg.id}:${auth.currentUser.uid}`;
            if (!window.__deliveredMessages.has(deliveryKey)) {
              window.__deliveredMessages.add(deliveryKey);

              // Enviar ACK para mensajes de otros usuarios (background)
              deliveryService.markAsDelivered(roomId, msg.id, auth.currentUser.uid)
                .catch(() => {}); // Ignorar errores silenciosamente
            }
          }
        });
      }

      // 🔍 TRACE: Callback ejecutado con mensajes recibidos
      traceEvent(TRACE_EVENTS.CALLBACK_EXECUTED, {
        roomId,
        messageCount: orderedMessages.length,
        messageIds: orderedMessages.slice(-5).map(m => m.id), // Últimos 5 IDs
        fromCache: snapshot.metadata.fromCache,
        hasPendingWrites: snapshot.metadata.hasPendingWrites,
      });

      // ⚡ CRÍTICO: Ejecutar callback INMEDIATAMENTE (sin delays)
      console.log(`[CHAT SERVICE] 📨 Ejecutando callback con ${orderedMessages.length} mensajes para sala ${roomId}`);
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
        // ⚠️ CRÍTICO: No devolver array vacío silenciosamente - esto oculta el problema
        // callback([]);
        throw error; // Re-lanzar para que el componente pueda manejarlo
      } else {
        console.warn(`[CHAT SERVICE] ⚠️ Error transitorio ignorado para sala ${roomId}:`, error.code);
      }
    },
    {
      includeMetadataChanges: false // ⚡ OPTIMIZACIÓN: false = solo cambios reales, más rápido
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

  try {
    const messageRef = doc(db, 'rooms', roomId, 'messages', messageId);

    // Verificar que el documento existe
    const messageSnap = await getDoc(messageRef);
    if (!messageSnap.exists()) {
      throw new Error(`Mensaje ${messageId} no encontrado en sala ${roomId}`);
    }

    // Obtener reacciones actuales o inicializar
    const currentData = messageSnap.data();
    const currentReactions = currentData.reactions || { like: 0, dislike: 0 };

    // Actualizar con el nuevo valor
    const newReactions = {
      ...currentReactions,
      [reactionType]: (currentReactions[reactionType] || 0) + 1
    };

    await updateDoc(messageRef, { reactions: newReactions });
    console.log('[REACTION SERVICE] ✅ Reacción guardada:', newReactions);

    return newReactions;
  } catch (error) {
    console.error('[REACTION SERVICE] ❌ Error:', error.message, error.code);
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

  // 📱 SANITIZAR NÚMEROS DE WHATSAPP/TELÉFONO (Salas secundarias)
  try {
    const sanitizeResult = await sanitizeMessage(
      messageData.content,
      messageData.userId,
      messageData.username || 'Usuario',
      roomId
    );

    if (sanitizeResult.wasModified) {
      console.log(`[SEND SECONDARY] 📱 Números sanitizados para ${messageData.username}`);
      messageData.content = sanitizeResult.content;
    }
  } catch (sanitizeError) {
    console.warn('[SEND SECONDARY] ⚠️ Error en sanitización:', sanitizeError.message);
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
    content: messageData.content,
    type: messageData.type || 'text',
    timestamp: serverTimestamp(),
    reactions: { like: 0, dislike: 0 },
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

  let lastSnapshotTime = Date.now();
  let isFirstSnapshot = true;

  const perfMonitor = getPerformanceMonitor();

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const snapshotReceivedTime = Date.now();
      const timeSinceLastSnapshot = snapshotReceivedTime - lastSnapshotTime;
      lastSnapshotTime = snapshotReceivedTime;

      const isFirstSnapshotNow = isFirstSnapshot;
      if (isFirstSnapshot) {
        isFirstSnapshot = false;
      }

      const startProcessTime = performance.now();
      const receiveTimestamp = Date.now();
      const messages = [];
      
      for (let i = 0; i < snapshot.docs.length; i++) {
        const doc = snapshot.docs[i];
        const data = doc.data();
        const timestampMs = data.timestamp?.toMillis?.() ?? null;
        
        let latency = null;
        if (timestampMs) {
          latency = receiveTimestamp - timestampMs;
        }
        
        messages.push({
          id: doc.id,
          ...data,
          timestampMs,
          timestamp: data.timestamp ?? null,
          _receiveLatency: latency,
        });
      }

      // Invertir para mostrar más antiguos primero
      messages.reverse();
      
      const processTime = performance.now() - startProcessTime;
      perfMonitor.recordMetric('messageProcessing', processTime);

      callback(messages);
    },
    (error) => {
      console.error('Error en suscripción a sala secundaria:', error);
      callback([]);
    }
  );

  if (typeof window !== 'undefined') {
    window.__activeFirestoreListeners = (window.__activeFirestoreListeners || 0) + 1;
  }

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
    const messageRef = doc(db, 'secondary-rooms', roomId, 'messages', messageId);
    const messageDoc = await getDoc(messageRef);
    
    if (!messageDoc.exists()) {
      throw new Error('Mensaje no encontrado');
    }

    const currentData = messageDoc.data();
    const currentReactions = currentData.reactions || { like: 0, dislike: 0 };
    
    // Incrementar reacción
    const newReactions = {
      ...currentReactions,
      [reaction]: (currentReactions[reaction] || 0) + 1
    };

    await updateDoc(messageRef, { reactions: newReactions });
  } catch (error) {
    console.error('Error adding reaction to secondary message:', error);
    throw error;
  }
};
