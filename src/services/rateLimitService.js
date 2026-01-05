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

// 🚨 EMERGENCIA: Rate limiting DESACTIVADO TEMPORALMENTE (04/01/2026)
// Problema: Chat paralizado, mensajes no se envían
// TODO: Reactivar con valores más razonables después de verificar
const RATE_LIMIT = {
  MAX_MESSAGES: 999,      // ⚠️ SIN LÍMITE (temporal)
  WINDOW_SECONDS: 10,
  MIN_INTERVAL_MS: 50,    // ⚠️ CASI INSTANTÁNEO (50ms en lugar de 100ms)
  MUTE_DURATION: 1 * 60,
  MAX_DUPLICATES: 999     // ⚠️ SIN LÍMITE (temporal)
};

// Cache en memoria para rendimiento (evita leer Firestore constantemente)
const messageCache = new Map(); // userId → array de timestamps
const muteCache = new Map();    // userId → timestamp de fin de mute
const contentCache = new Map(); // userId → array de últimos contenidos (para detectar duplicados repetidos)
const duplicateCount = new Map(); // userId → contador de duplicados consecutivos

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
 * Desmutea un usuario (limpia mute de cache y Firestore)
 */
export const unmuteUser = async (userId) => {
  if (!userId) return;

  try {
    // Limpiar de Firestore
    const muteDocRef = doc(db, 'muted_users', userId);
    const muteDoc = await getDoc(muteDocRef);
    if (muteDoc.exists()) {
      await setDoc(muteDocRef, {
        muteEnd: new Date(Date.now() - 1000), // Establecer en el pasado para que expire
        reason: 'MANUAL_UNMUTE'
      }, { merge: true });
    }

    // Limpiar cache
    muteCache.delete(userId);
    contentCache.delete(userId); // También limpiar contenido duplicado
    duplicateCount.delete(userId);

    console.log(`✅ [RATE LIMIT] Usuario ${userId} DESMUTEADO manualmente`);
  } catch (error) {
    console.error('Error desmuteando usuario:', error);
  }
};

/**
 * 🚀 Verifica rate limit ULTRA RÁPIDO usando SOLO cache en memoria
 * NO consulta Firestore = instantáneo como WhatsApp
 *
 * @param {string} userId - ID del usuario
 * @param {string} roomId - ID de la sala (no usado, solo por compatibilidad)
 * @param {string} content - Contenido del mensaje (para detectar duplicados)
 * @returns {object} { allowed: boolean, error?: string }
 */
export const checkRateLimit = async (userId, roomId, content = '') => {
  if (!userId) {
    return { allowed: false, error: 'Usuario no identificado' };
  }

  const now = Date.now();

  // 1. ⚡ VERIFICACIÓN RÁPIDA: Mute cache (solo en memoria)
  const cachedMuteEnd = muteCache.get(userId);
  if (cachedMuteEnd && now < cachedMuteEnd) {
    const remainingSeconds = Math.ceil((cachedMuteEnd - now) / 1000);
    return {
      allowed: false,
      error: `Estás silenciado. Espera ${remainingSeconds}s.`,
      remainingSeconds
    };
  } else if (cachedMuteEnd) {
    muteCache.delete(userId); // Limpiar mute expirado
  }

  // 2. ⚡ ANTI-DOBLE-CLICK: Verificar intervalo mínimo desde último mensaje
  const userMessages = messageCache.get(userId) || [];
  if (userMessages.length > 0) {
    const lastMessageTime = userMessages[userMessages.length - 1];
    const timeSinceLastMessage = now - lastMessageTime;

    if (timeSinceLastMessage < RATE_LIMIT.MIN_INTERVAL_MS) {
      console.warn(`⏱️ [RATE LIMIT] Usuario ${userId} enviando muy rápido: ${timeSinceLastMessage}ms desde último mensaje`);
      return {
        allowed: false,
        error: 'Espera un momento antes de enviar otro mensaje.',
        remainingMs: RATE_LIMIT.MIN_INTERVAL_MS - timeSinceLastMessage
      };
    }
  }

  // 🚫 DESACTIVADO: Detección de duplicados (causaba expulsiones injustas)
  // Los usuarios son expulsados por decir "hola" repetidamente en conversaciones normales
  //
  // const recentContents = contentCache.get(userId) || [];
  // const normalizedContent = content ? content.trim().toLowerCase() : '';
  // if (normalizedContent && recentContents.length > 0) {
  //   const duplicateCount = recentContents.filter(c => c === normalizedContent).length;
  //   if (duplicateCount >= RATE_LIMIT.MAX_DUPLICATES) {
  //     await muteUser(userId, RATE_LIMIT.MUTE_DURATION);
  //     return { allowed: false, error: '...' };
  //   }
  // }

  // 🚫 DESACTIVADO: Rate limiting por volumen (causaba expulsiones injustas)
  // Los valores de 999 mensajes aún pueden causar problemas en casos extremos
  //
  // const windowStart = now - (RATE_LIMIT.WINDOW_SECONDS * 1000);
  // const recentMessages = userMessages.filter(ts => ts > windowStart);
  // if (recentMessages.length >= RATE_LIMIT.MAX_MESSAGES) {
  //   await muteUser(userId, RATE_LIMIT.MUTE_DURATION);
  //   return { allowed: false, error: '...' };
  // }

  // ✅ PERMITIR - Sin consultas a Firestore = INSTANTÁNEO
  return { allowed: true };
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

  // 🔥 MEJORADO: Guardar últimos contenidos para detectar duplicados repetidos
  if (content) {
    const normalizedContent = content.trim().toLowerCase();
    if (!contentCache.has(userId)) {
      contentCache.set(userId, []);
    }
    
    const contents = contentCache.get(userId);
    contents.push(normalizedContent);
    
    // Mantener solo los últimos 5 contenidos para detectar repeticiones
    if (contents.length > 5) {
      contents.shift();
    }
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

  // ✅ Cambiado a console.debug para reducir ruido en consola (solo visible si se activa "Verbose" en DevTools)
  console.debug(`🧹 [RATE LIMIT] Cache limpiado: ${messageCache.size} usuarios con mensajes, ${muteCache.size} muteados`);
};

// Limpiar cache cada 30 segundos
setInterval(cleanupCache, 30000);
