/**
 * 🛡️ RATE LIMITING SERVICE - ANTI-SPAM PROFESIONAL
 *
 * Implementa rate limiting estricto para prevenir spam masivo:
 * - Máximo 3 mensajes cada 10 segundos
 * - Mute automático de 10 minutos si excede
 * - Almacenamiento en Firestore (no se puede evadir)
 */

import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/config/firebase';

// Configuración del rate limiting
const RATE_LIMIT = {
  MAX_MESSAGES: 3,        // Máximo de mensajes permitidos
  WINDOW_SECONDS: 10,     // En ventana de 10 segundos
  MUTE_DURATION: 10 * 60  // Mute por 10 minutos (600 segundos)
};

// Cache en memoria para rendimiento (evita leer Firestore constantemente)
const messageCache = new Map(); // userId → array de timestamps
const muteCache = new Map();    // userId → timestamp de fin de mute
const contentCache = new Map(); // userId → último contenido enviado (para detectar duplicados)

/**
 * Verifica si un usuario está muteado
 */
export const isUserMuted = async (userId) => {
  if (!userId) return false;

  // 1. Verificar cache primero (rápido)
  const cachedMuteEnd = muteCache.get(userId);
  if (cachedMuteEnd) {
    const now = Date.now();
    if (now < cachedMuteEnd) {
      const remainingSeconds = Math.ceil((cachedMuteEnd - now) / 1000);
      console.log(`🔇 Usuario ${userId} está muteado. Quedan ${remainingSeconds}s`);
      return {
        muted: true,
        remainingSeconds,
        reason: 'SPAM_RATE_LIMIT'
      };
    } else {
      // Mute expiró, limpiar cache
      muteCache.delete(userId);
    }
  }

  // 2. Verificar Firestore (por si acaso)
  try {
    const muteDoc = await getDoc(doc(db, 'muted_users', userId));
    if (muteDoc.exists()) {
      const data = muteDoc.data();
      const muteEnd = data.muteEnd?.toMillis() || 0;
      const now = Date.now();

      if (now < muteEnd) {
        const remainingSeconds = Math.ceil((muteEnd - now) / 1000);
        muteCache.set(userId, muteEnd); // Actualizar cache
        console.log(`🔇 Usuario ${userId} está muteado (desde Firestore). Quedan ${remainingSeconds}s`);
        return {
          muted: true,
          remainingSeconds,
          reason: data.reason || 'SPAM_RATE_LIMIT'
        };
      }
    }
  } catch (error) {
    console.error('Error verificando mute:', error);
  }

  return { muted: false };
};

/**
 * Mutea un usuario por exceder rate limit
 */
export const muteUser = async (userId, durationSeconds = RATE_LIMIT.MUTE_DURATION) => {
  if (!userId) return;

  const now = Date.now();
  const muteEnd = now + (durationSeconds * 1000);

  try {
    // Guardar en Firestore
    await setDoc(doc(db, 'muted_users', userId), {
      userId,
      muteStart: serverTimestamp(),
      muteEnd: new Date(muteEnd),
      reason: 'SPAM_RATE_LIMIT',
      messageCount: RATE_LIMIT.MAX_MESSAGES + 1,
      createdAt: serverTimestamp()
    });

    // Actualizar cache
    muteCache.set(userId, muteEnd);

    console.warn(`🔇 [RATE LIMIT] Usuario ${userId} MUTEADO por ${durationSeconds}s (spam detectado)`);
  } catch (error) {
    console.error('Error muteando usuario:', error);
  }
};

/**
 * Verifica rate limit ANTES de enviar mensaje
 *
 * @param {string} userId - ID del usuario
 * @param {string} roomId - ID de la sala
 * @param {string} content - Contenido del mensaje (para detectar duplicados)
 * @returns {object} { allowed: boolean, error?: string }
 */
export const checkRateLimit = async (userId, roomId, content = '') => {
  if (!userId) {
    return { allowed: false, error: 'Usuario no identificado' };
  }

  // 0. 🔥 NUEVO: Detectar mensajes duplicados (si repite 1 mensaje → MUTE INMEDIATO)
  const lastContent = contentCache.get(userId);
  if (lastContent && content && lastContent.trim().toLowerCase() === content.trim().toLowerCase()) {
    console.error(`🚨 [DUPLICATE DETECTED] Usuario ${userId} envió mensaje duplicado: "${content.substring(0, 50)}"`);

    // MUTEAR INMEDIATAMENTE por spam
    await muteUser(userId, RATE_LIMIT.MUTE_DURATION);

    return {
      allowed: false,
      error: `No puedes enviar el mismo mensaje dos veces. Espera ${RATE_LIMIT.MUTE_DURATION / 60} minutos.`,
      remainingSeconds: RATE_LIMIT.MUTE_DURATION
    };
  }

  // 1. Verificar si está muteado
  const muteStatus = await isUserMuted(userId);
  if (muteStatus.muted) {
    return {
      allowed: false,
      error: `Fuiste silenciado por spam. Intenta en ${muteStatus.remainingSeconds}s.`,
      remainingSeconds: muteStatus.remainingSeconds
    };
  }

  // 2. Obtener timestamps de mensajes recientes desde Firestore
  const now = Date.now();
  const windowStart = now - (RATE_LIMIT.WINDOW_SECONDS * 1000);

  try {
    // Consultar mensajes recientes del usuario en esta sala
    const messagesRef = collection(db, 'rooms', roomId, 'messages');
    const q = query(
      messagesRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      firestoreLimit(RATE_LIMIT.MAX_MESSAGES + 1)
    );

    const snapshot = await getDocs(q);
    const recentMessages = [];

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const timestamp = data.timestamp?.toMillis() || 0;

      // Solo contar mensajes dentro de la ventana de tiempo
      if (timestamp > windowStart) {
        recentMessages.push(timestamp);
      }
    });

    console.log(`📊 [RATE LIMIT] Usuario ${userId}: ${recentMessages.length}/${RATE_LIMIT.MAX_MESSAGES} mensajes en últimos ${RATE_LIMIT.WINDOW_SECONDS}s`);

    // 3. Verificar si excedió el límite
    if (recentMessages.length >= RATE_LIMIT.MAX_MESSAGES) {
      console.warn(`🚨 [RATE LIMIT] Usuario ${userId} EXCEDIÓ límite: ${recentMessages.length} mensajes en ${RATE_LIMIT.WINDOW_SECONDS}s`);

      // MUTEAR AUTOMÁTICAMENTE
      await muteUser(userId, RATE_LIMIT.MUTE_DURATION);

      return {
        allowed: false,
        error: `Has enviado demasiados mensajes muy rápido. Espera ${RATE_LIMIT.MUTE_DURATION / 60} minutos.`,
        remainingSeconds: RATE_LIMIT.MUTE_DURATION
      };
    }

    // 4. Permitir mensaje
    return { allowed: true };

  } catch (error) {
    console.error('Error verificando rate limit:', error);
    // En caso de error, permitir mensaje (fail-open)
    return { allowed: true };
  }
};

/**
 * Registra mensaje enviado en cache (para rendimiento y detección de duplicados)
 *
 * @param {string} userId - ID del usuario
 * @param {string} content - Contenido del mensaje
 */
export const recordMessage = (userId, content = '') => {
  if (!userId) return;

  const now = Date.now();

  // Registrar timestamp
  if (!messageCache.has(userId)) {
    messageCache.set(userId, []);
  }

  const messages = messageCache.get(userId);
  messages.push(now);

  // Mantener solo los últimos MAX_MESSAGES timestamps
  if (messages.length > RATE_LIMIT.MAX_MESSAGES) {
    messages.shift();
  }

  // 🔥 NUEVO: Guardar contenido del mensaje para detectar duplicados
  if (content) {
    contentCache.set(userId, content);
  }
};

/**
 * Limpia cache de mensajes antiguos (ejecutar periódicamente)
 */
export const cleanupCache = () => {
  const now = Date.now();
  const windowMs = RATE_LIMIT.WINDOW_SECONDS * 1000;

  // Limpiar mensajes antiguos
  for (const [userId, timestamps] of messageCache.entries()) {
    const recentMessages = timestamps.filter(ts => now - ts < windowMs);
    if (recentMessages.length === 0) {
      messageCache.delete(userId);
    } else {
      messageCache.set(userId, recentMessages);
    }
  }

  // Limpiar mutes expirados
  for (const [userId, muteEnd] of muteCache.entries()) {
    if (now >= muteEnd) {
      muteCache.delete(userId);
    }
  }

  console.log(`🧹 [RATE LIMIT] Cache limpiado: ${messageCache.size} usuarios con mensajes, ${muteCache.size} muteados`);
};

// Limpiar cache cada 30 segundos
setInterval(cleanupCache, 30000);
