import { auth, db } from '@/config/firebase';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc, increment } from 'firebase/firestore';

/**
 * 🚫 ANTI-SPAM SERVICE
 * Sistema inteligente de detección y prevención de spam
 */

// 🚨 EMERGENCIA: Anti-spam MENOS ESTRICTO (04/01/2026)
// Problema: Chat paralizado, usuarios bloqueados injustamente
const CONFIG = {
  // Spam por duplicados
  MAX_DUPLICATE_WARNINGS: 10, // ⚠️ 10 advertencias (más permisivo)
  DUPLICATE_THRESHOLD: 10, // ⚠️ 10 mensajes iguales = advertencia (era 4)
  DUPLICATE_BAN_THRESHOLD: 15, // ⚠️ 15+ mensajes = expulsión (era 5)
  DUPLICATE_MEMORY_MS: 5 * 60 * 1000, // 5 minutos de memoria

  // Expulsión temporal
  TEMP_BAN_DURATION_MS: 5 * 60 * 1000, // ⚠️ 5 minutos de expulsión (era 15)

  // Detección de números
  PHONE_PATTERNS: [
    /\+?56\s?9\s?\d{4}\s?\d{4}/g, // +56 9 1234 5678
    /\+?569\d{8}/g, // +56912345678
    /9\d{8}/g, // 912345678
    /\d{9}/g, // 912345678 sin +56
    /\(\+?56\)\s?9\s?\d{8}/g, // (+56) 912345678
  ],

  // Palabras/frases prohibidas
  FORBIDDEN_WORDS: [
    // Redes sociales
    'instagram', 'insta', 'ig:', '@ig',
    'whatsapp', 'whats', 'wsp', 'wasap',
    'telegram', 'tele', 'tg:',
    'facebook', 'face', 'fb',
    'snapchat', 'snap',
    'tiktok', 'tik tok',
    'twitter', 'x.com',

    // Formas de compartir contacto
    'mi numero', 'mi número', 'mi num', 'mi fono',
    'mi cel', 'mi celular', 'mi teléfono', 'mi telefono',
    'mandame', 'mándame', 'enviame', 'envíame',
    'agregame', 'agrégame', 'añademe', 'añádeme',
    'escribeme', 'escríbeme',

    // Spam comercial
    'vendo', 'compro', 'ofrezco',
    'precio', 'pago', 'cobro',
    'onlyfans', 'only fans', 'of:',

    // Drogas
    'vendo drogas', 'vendo marihuana', 'vendo cocaina', 'vendo coca',
    'compro drogas', 'compro marihuana', 'compro cocaina',
  ],

  // Excepciones (palabras OK aunque contengan palabras prohibidas)
  EXCEPTIONS: [
    'hola', 'hola hola', // Saludos normales
    'jaja', 'jajaja', 'jajajaja', // Risas
    'ok', 'ok ok', // Confirmaciones
    'si', 'si si', 'sí', 'sí sí', // Afirmaciones
    'no', 'no no', // Negaciones
  ],
};

/**
 * 📊 HISTORIAL DE MENSAJES POR USUARIO
 * Guarda los últimos mensajes de cada usuario en memoria
 */
const userMessageHistory = new Map();

/**
 * 🚀 CACHE DE BANS TEMPORALES (para velocidad máxima)
 * Guarda los bans en memoria para evitar consultas lentas a Firestore
 * Map de userId → { isBanned: boolean, expiresAt: timestamp, reason: string }
 */
const tempBanCache = new Map();

/**
 * 🔍 CLASE: Entrada del historial de mensajes
 */
class MessageEntry {
  constructor(content, timestamp = Date.now()) {
    this.content = content.toLowerCase().trim();
    this.timestamp = timestamp;
    this.count = 1;
  }
}

/**
 * 📝 OBTENER HISTORIAL DE USUARIO
 */
function getUserHistory(userId) {
  if (!userMessageHistory.has(userId)) {
    userMessageHistory.set(userId, []);
  }
  return userMessageHistory.get(userId);
}

/**
 * 🧹 LIMPIAR MENSAJES ANTIGUOS DEL HISTORIAL
 */
function cleanOldMessages(userId) {
  const history = getUserHistory(userId);
  const now = Date.now();
  const filtered = history.filter(
    entry => (now - entry.timestamp) < CONFIG.DUPLICATE_MEMORY_MS
  );
  userMessageHistory.set(userId, filtered);
}

/**
 * ✅ VERIFICAR SI UN MENSAJE ES EXCEPCIÓN
 * (Ej: "hola hola" está OK, no es spam)
 */
function isException(message) {
  const normalized = message.toLowerCase().trim();
  return CONFIG.EXCEPTIONS.some(exception =>
    normalized === exception || normalized.startsWith(exception + ' ')
  );
}

/**
 * 🔢 DETECTAR NÚMEROS DE TELÉFONO
 */
function containsPhoneNumber(message) {
  // Limpiar espacios extras
  const cleaned = message.replace(/\s+/g, ' ');

  for (const pattern of CONFIG.PHONE_PATTERNS) {
    if (pattern.test(cleaned)) {
      return true;
    }
  }

  return false;
}

/**
 * 🚫 DETECTAR PALABRAS PROHIBIDAS
 */
function containsForbiddenWords(message) {
  const normalized = message.toLowerCase();

  for (const word of CONFIG.FORBIDDEN_WORDS) {
    // Buscar palabra completa (no dentro de otras palabras)
    const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(normalized)) {
      return { found: true, word };
    }
  }

  return { found: false, word: null };
}

/**
 * 🔁 DETECTAR SPAM POR DUPLICADOS
 * Retorna: { isSpam: boolean, count: number, shouldWarn: boolean, shouldBan: boolean }
 */
function checkDuplicateSpam(userId, message) {
  // Limpiar historial antiguo
  cleanOldMessages(userId);

  const history = getUserHistory(userId);
  const normalized = message.toLowerCase().trim();

  // Buscar si este mensaje ya existe en el historial
  const existing = history.find(entry => entry.content === normalized);

  if (existing) {
    existing.count++;
    existing.timestamp = Date.now(); // Actualizar timestamp

    return {
      isSpam: existing.count >= CONFIG.DUPLICATE_THRESHOLD,
      count: existing.count,
      shouldWarn: existing.count === CONFIG.DUPLICATE_THRESHOLD,
      shouldBan: existing.count >= CONFIG.DUPLICATE_BAN_THRESHOLD,
    };
  } else {
    // Nuevo mensaje - agregarlo al historial
    history.push(new MessageEntry(normalized));
    return {
      isSpam: false,
      count: 1,
      shouldWarn: false,
      shouldBan: false,
    };
  }
}

/**
 * ⚠️ REGISTRAR ADVERTENCIA DE SPAM
 */
async function recordSpamWarning(userId, username, reason, roomId) {
  try {
    if (!auth.currentUser) return;

    const warningsRef = doc(db, 'spam_warnings', userId);
    const warningsDoc = await getDoc(warningsRef);

    const now = Date.now();

    if (warningsDoc.exists()) {
      const data = warningsDoc.data();
      const newCount = (data.count || 0) + 1;

      await updateDoc(warningsRef, {
        count: increment(1),
        lastWarning: serverTimestamp(),
        lastReason: reason,
        lastRoom: roomId,
        warnings: [
          ...(data.warnings || []),
          {
            reason,
            timestamp: now,
            roomId,
          }
        ].slice(-10), // Mantener solo las últimas 10 advertencias
      });

      return { count: newCount, isNew: false };
    } else {
      await setDoc(warningsRef, {
        userId,
        username,
        count: 1,
        lastWarning: serverTimestamp(),
        lastReason: reason,
        lastRoom: roomId,
        warnings: [{
          reason,
          timestamp: now,
          roomId,
        }],
        createdAt: serverTimestamp(),
      });

      return { count: 1, isNew: true };
    }
  } catch (error) {
    console.error('[ANTI-SPAM] Error registrando advertencia:', error);
    return { count: 0, isNew: false };
  }
}

/**
 * 🔨 APLICAR EXPULSIÓN TEMPORAL
 */
async function applyTempBan(userId, username, reason, roomId) {
  try {
    if (!auth.currentUser) return false;

    const bansRef = doc(db, 'temp_bans', userId);
    const now = Date.now();
    const expiresAt = now + CONFIG.TEMP_BAN_DURATION_MS;

    await setDoc(bansRef, {
      userId,
      username,
      reason,
      roomId,
      bannedAt: serverTimestamp(),
      expiresAt: expiresAt,
      duration: CONFIG.TEMP_BAN_DURATION_MS,
      type: 'spam',
    });

    // 🚀 ACTUALIZAR CACHE inmediatamente para verificaciones futuras
    const remainingMinutes = Math.ceil(CONFIG.TEMP_BAN_DURATION_MS / (60 * 1000));
    tempBanCache.set(userId, {
      isBanned: true,
      reason,
      expiresAt,
      remainingMinutes,
    });

    console.log(`🔨 [ANTI-SPAM] Usuario ${username} expulsado temporalmente por ${reason}`);
    return true;
  } catch (error) {
    console.error('[ANTI-SPAM] Error aplicando expulsión:', error);
    return false;
  }
}

/**
 * ✅ VERIFICAR SI USUARIO ESTÁ EXPULSADO (ULTRA RÁPIDO CON CACHE)
 * 🚀 OPTIMIZACIÓN CRÍTICA: Usa cache en memoria para evitar consultas lentas a Firestore
 */
export async function checkTempBan(userId) {
  try {
    if (!userId) return { isBanned: false };

    const now = Date.now();

    // 🚀 PASO 1: Verificar CACHE primero (INSTANTÁNEO - 0ms)
    const cachedBan = tempBanCache.get(userId);
    if (cachedBan) {
      // Verificar si el ban en cache ya expiró
      if (cachedBan.expiresAt && cachedBan.expiresAt < now) {
        // Ban expirado - limpiar cache
        tempBanCache.delete(userId);
        return { isBanned: false };
      }

      // Ban activo en cache
      const remainingMs = cachedBan.expiresAt - now;
      const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));

      return {
        isBanned: true,
        reason: cachedBan.reason,
        expiresAt: cachedBan.expiresAt,
        remainingMinutes,
      };
    }

    // 🐌 PASO 2: Si NO está en cache, consultar Firestore UNA SOLA VEZ
    // (Esto solo pasa la primera vez que se verifica un usuario)
    const bansRef = doc(db, 'temp_bans', userId);
    const banDoc = await getDoc(bansRef);

    if (!banDoc.exists()) {
      // No hay ban - guardar en cache (negativo) por 60 segundos para evitar consultas repetidas
      tempBanCache.set(userId, { isBanned: false, expiresAt: now + 60000 });
      return { isBanned: false };
    }

    const data = banDoc.data();

    // Verificar si el ban ya expiró
    if (data.expiresAt && data.expiresAt < now) {
      // Ban expirado - limpiar cache y retornar
      tempBanCache.delete(userId);
      return { isBanned: false };
    }

    // Ban activo - GUARDAR EN CACHE para futuras verificaciones
    const remainingMs = data.expiresAt - now;
    const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));

    const banInfo = {
      isBanned: true,
      reason: data.reason,
      expiresAt: data.expiresAt,
      remainingMinutes,
    };

    // Guardar en cache para próximas verificaciones (INSTANTÁNEAS)
    tempBanCache.set(userId, banInfo);

    return banInfo;
  } catch (error) {
    // 🔍 DIAGNÓSTICO: Logging mejorado del error
    if (error.code === 'permission-denied') {
      // Error de permisos - normal para usuarios que no son admin
      // Guardar en cache negativo por 60s para evitar consultas repetidas
      tempBanCache.set(userId, { isBanned: false, expiresAt: Date.now() + 60000 });
      console.debug('[ANTI-SPAM] ⚠️ Sin permisos para verificar temp_bans (usando cache)');
    } else {
      // Otros errores - loguear para diagnóstico
      console.error('[ANTI-SPAM] Error verificando expulsión:', {
        code: error.code,
        message: error.message,
        userId
      });
    }
    // ⚠️ IMPORTANTE: Retornar { isBanned: false } para no bloquear mensajes si falla la verificación
    return { isBanned: false };
  }
}

/**
 * 🛡️ VALIDAR MENSAJE COMPLETO
 * Retorna: { allowed: boolean, reason: string, type: string, action: string }
 */
export async function validateMessage(message, userId, username, roomId) {
  try {
    const trimmed = message.trim();

    // 1. Verificar si está expulsado
    const banCheck = await checkTempBan(userId);
    if (banCheck.isBanned) {
      return {
        allowed: false,
        reason: `Estás temporalmente expulsado por spam. Podrás chatear en ${banCheck.remainingMinutes} minutos.`,
        type: 'temp_ban',
        action: 'block',
      };
    }

    // 2. Verificar excepciones (ej: "hola hola" está OK)
    if (isException(trimmed)) {
      return { allowed: true };
    }

    // 3. Detectar números de teléfono
    if (containsPhoneNumber(trimmed)) {
      await recordSpamWarning(userId, username, 'Número de teléfono', roomId);
      return {
        allowed: false,
        reason: 'Los números de teléfono están prohibidos',
        type: 'phone_number',
        action: 'block',
        details: 'Por seguridad y privacidad, no se permite compartir números de teléfono en el chat público. Usa los chats privados para intercambiar contacto.',
      };
    }

    // 4. Detectar palabras prohibidas
    const forbiddenCheck = containsForbiddenWords(trimmed);
    if (forbiddenCheck.found) {
      await recordSpamWarning(userId, username, `Palabra prohibida: ${forbiddenCheck.word}`, roomId);

      // Determinar tipo de contenido prohibido
      let specificReason = 'Esta frase está prohibida';
      if (['instagram', 'whatsapp', 'telegram', 'facebook', 'snapchat', 'tiktok', 'twitter'].some(word => forbiddenCheck.word.includes(word))) {
        specificReason = 'Las redes sociales están prohibidas';
      } else if (['vendo', 'compro', 'ofrezco', 'precio', 'pago', 'onlyfans'].some(word => forbiddenCheck.word.includes(word))) {
        specificReason = 'El contenido comercial está prohibido';
      } else if (forbiddenCheck.word.includes('droga')) {
        specificReason = 'El contenido ilegal está prohibido';
      }

      return {
        allowed: false,
        reason: specificReason,
        type: 'forbidden_word',
        action: 'block',
        details: `La palabra "${forbiddenCheck.word}" viola las normas del chat. Tu mensaje no será enviado.`,
      };
    }

    // 🚫 DESACTIVADO: Detección de spam por duplicados (causaba expulsiones injustas)
    // Los usuarios pueden repetir mensajes normalmente en conversaciones reales
    // El rate limiting en rateLimitService.js ya previene spam masivo
    //
    // const duplicateCheck = checkDuplicateSpam(userId, trimmed);
    // if (duplicateCheck.shouldBan) { ... }
    // if (duplicateCheck.shouldWarn) { ... }

    // ✅ Mensaje válido
    return { allowed: true };

  } catch (error) {
    console.error('[ANTI-SPAM] Error validando mensaje:', error);
    // Si falla la validación, permitir mensaje (fail-safe)
    return { allowed: true };
  }
}

/**
 * 🧹 LIMPIAR HISTORIAL DE USUARIO
 * (Llamar cuando usuario sale del chat)
 */
export function clearUserHistory(userId) {
  userMessageHistory.delete(userId);
}

/**
 * 📊 OBTENER ESTADÍSTICAS DE SPAM
 */
export function getSpamStats() {
  const stats = {
    totalUsers: userMessageHistory.size,
    totalMessages: 0,
    duplicates: 0,
    cachedBans: tempBanCache.size,
  };

  for (const [userId, history] of userMessageHistory.entries()) {
    history.forEach(entry => {
      stats.totalMessages += entry.count;
      if (entry.count > 1) {
        stats.duplicates += entry.count - 1;
      }
    });
  }

  return stats;
}

/**
 * 🧹 LIMPIAR CACHE DE BANS EXPIRADOS
 * (Llamar periódicamente para liberar memoria)
 */
function cleanupBanCache() {
  const now = Date.now();
  let cleanedCount = 0;

  for (const [userId, banInfo] of tempBanCache.entries()) {
    // Limpiar bans expirados
    if (banInfo.expiresAt && banInfo.expiresAt < now) {
      tempBanCache.delete(userId);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    console.debug(`🧹 [ANTI-SPAM] ${cleanedCount} bans expirados limpiados del cache`);
  }
}

// Limpiar cache de bans cada 60 segundos
setInterval(cleanupBanCache, 60000);
