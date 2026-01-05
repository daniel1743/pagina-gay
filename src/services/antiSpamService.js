import { auth, db } from '@/config/firebase';
import { doc, setDoc, getDoc, deleteDoc, serverTimestamp, updateDoc, increment } from 'firebase/firestore';

/**
 * 🛡️ ANTI-SPAM SERVICE (VERSIÓN MÍNIMA - 2026)
 * Configurado para máxima tolerancia y cero bloqueos accidentales.
 */

const CONFIG = {
  // ⏳ Expulsión temporal (5 minutos es suficiente para calmar)
  TEMP_BAN_DURATION_MS: 5 * 60 * 1000,

  // 🗣️ Excepciones: Palabras que SIEMPRE pasan (aunque tengan signos o mayúsculas)
  EXCEPTIONS: [
    'hola', 'alo', 'hol', 'ola', 'holis', 'wena', 'buenas', // Saludos
    'jaja', 'jsjs', 'jeje', 'lol', 'xd', // Risas
    'si', 'no', 'ok', 'ya', 'bueno', 'gracias', 'dale', // Respuestas cortas
    'que', 'k', 'q', 'y', 'o' // Conectores
  ],

  // 📱 Detección de números (Solo formatos muy obvios para Chile)
  PHONE_PATTERNS: [
    /\+56\s?9\s?\d{8}/g,       // +56 9 12345678
    /\+569\d{8}/g,             // +56912345678
    // Solo detectamos 9 dígitos si tienen espacios alrededor (evita códigos de pedido)
    /(?:^|\s)9\d{8}(?:\s|$)/g, 
  ],

  // 🚫 Palabras/frases prohibidas (Lista segura sin palabras cortas)
  FORBIDDEN_WORDS: [
    // Redes sociales (Solo dominios o intenciones claras)
    'instagram.com', 'sigueme en insta', '@ig',
    'whatsapp.com', 'wa.me', '+569',
    't.me/', 'telegram.org',
    'facebook.com', 'grupo de face',
    'tiktok.com', '@tiktok',
    'onlyfans', 'only fans', 'of.com',

    // Spam comercial / Contacto directo
    'mi numero es', 'mi número es', 
    'hablame al', 'agregame al', 'escribeme al',
    'vendo contenido', 'vendo pack', 'paso pack',

    // Ilegal (Frases completas para evitar errores)
    'vendo droga', 'vendo coca', 'vendo mari', 'compro droga'
  ],
};

/**
 * 🚀 CACHE DE BANS (Memoria RAM)
 * Evita leer Firestore en cada mensaje
 */
const tempBanCache = new Map();

/**
 * 🧹 LIMPIAR TEXTO PARA ANALIZAR
 * Elimina signos para comparar "Hola!!!" con "hola"
 */
function cleanText(text) {
  return text.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quita tildes
    .replace(/[^a-z0-9\s]/g, "") // Quita signos (bdeja solo letras y nums)
    .trim();
}

/**
 * ✅ VERIFICAR SI ES EXCEPCIÓN
 * Permite "Hola!!!", "Hola...", "HOLA"
 */
function isException(message) {
  const cleaned = cleanText(message);
  
  // 1. Coincidencia exacta o palabra suelta
  const words = cleaned.split(' ');
  return words.some(word => CONFIG.EXCEPTIONS.includes(word));
}

/**
 * 🔢 DETECTAR NÚMEROS DE TELÉFONO
 */
function containsPhoneNumber(message) {
  for (const pattern of CONFIG.PHONE_PATTERNS) {
    if (pattern.test(message)) return true;
  }
  return false;
}

/**
 * 🚫 DETECTAR PALABRAS PROHIBIDAS
 */
function containsForbiddenWords(message) {
  const normalized = message.toLowerCase();
  
  for (const word of CONFIG.FORBIDDEN_WORDS) {
    if (normalized.includes(word)) {
      return { found: true, word };
    }
  }
  return { found: false, word: null };
}

/**
 * ⚠️ REGISTRAR ADVERTENCIA (Sin bloquear inmediatamente)
 */
async function recordSpamWarning(userId, username, reason, roomId) {
  try {
    if (!auth.currentUser) return;
    const warningsRef = doc(db, 'spam_warnings', userId);
    // Solo actualizamos contador, lógica simple
    await setDoc(warningsRef, {
      userId, username,
      lastWarning: serverTimestamp(),
      lastReason: reason,
      count: increment(1)
    }, { merge: true });
  } catch (error) {
    console.error('Error warning:', error);
  }
}

/**
 * 🧹 LIMPIAR BAN (Función auxiliar)
 */
export async function clearUserTempBan(userId) {
  if (!userId) return;
  tempBanCache.delete(userId);
  try {
    await deleteDoc(doc(db, 'temp_bans', userId));
  } catch (e) { console.error(e); }
}

/**
 * 🛡️ VERIFICAR SI ESTÁ BANEADO (Con Cache)
 */
export async function checkTempBan(userId) {
  if (!userId) return { isBanned: false };

  const now = Date.now();
  
  // 1. Revisar Cache
  const cached = tempBanCache.get(userId);
  if (cached) {
    if (cached.expiresAt > now) {
      const remainingMinutes = Math.ceil((cached.expiresAt - now) / 60000);
      return { isBanned: true, reason: cached.reason, remainingMinutes };
    } else {
      tempBanCache.delete(userId); // Expiró
    }
  }

  // 2. Si no está en cache, revisamos DB (Solo si sospechamos)
  // Para optimizar, asumimos NO baneado si no está en cache local en esta sesión,
  // pero hacemos una lectura rápida por seguridad si es la primera vez.
  try {
    const banDoc = await getDoc(doc(db, 'temp_bans', userId));
    if (banDoc.exists()) {
      const data = banDoc.data();
      if (data.expiresAt > now) {
        // Guardar en cache
        const remainingMinutes = Math.ceil((data.expiresAt - now) / 60000);
        tempBanCache.set(userId, { ...data, remainingMinutes });
        return { isBanned: true, reason: data.reason, remainingMinutes };
      } else {
        // Limpiar DB si expiró
        await deleteDoc(doc(db, 'temp_bans', userId));
      }
    }
  } catch (error) {
    console.warn('Error checking ban:', error);
  }

  return { isBanned: false };
}

/**
 * 🛡️ VALIDAR MENSAJE (FUNCIÓN PRINCIPAL)
 */
export async function validateMessage(message, userId, username, roomId) {
  try {
    // FAIL-SAFE: Mensajes vacíos no se procesan, pero no se bloquean
    if (!message || !message.trim()) return { allowed: true };

    const trimmed = message.trim();

    // 1. Revisar Excepciones PRIMERO (Para desbloquear el "Hola" inmediatamente)
    // Si dice "Hola", lo dejamos pasar aunque tenga flags menores
    if (isException(trimmed)) {
      return { allowed: true };
    }

    // 2. Verificar Ban activo
    const banCheck = await checkTempBan(userId);
    if (banCheck.isBanned) {
      console.warn(`[SPAM] Usuario baneado intentando hablar: ${username}`);
      return {
        allowed: false,
        reason: `Espera ${banCheck.remainingMinutes} min para escribir.`,
        type: 'temp_ban',
        action: 'block',
      };
    }

    // 3. Detectar Teléfonos
    if (containsPhoneNumber(trimmed)) {
      console.warn(`[SPAM] Teléfono detectado: ${trimmed}`);
      await recordSpamWarning(userId, username, 'Teléfono', roomId);
      return {
        allowed: false,
        reason: 'Por seguridad, no compartas números de teléfono aquí.',
        type: 'phone_number',
        action: 'block',
      };
    }

    // 4. Palabras Prohibidas
    const forbidden = containsForbiddenWords(trimmed);
    if (forbidden.found) {
      console.warn(`[SPAM] Palabra prohibida: ${forbidden.word}`);
      await recordSpamWarning(userId, username, 'Palabra prohibida', roomId);
      return {
        allowed: false,
        reason: 'Esa palabra/enlace no está permitida.',
        type: 'forbidden_word',
        action: 'block',
      };
    }

    // ✅ Todo limpio
    return { allowed: true };

  } catch (error) {
    console.error('[ANTI-SPAM CRITICAL ERROR]:', error);
    // 🚨 FAIL-SAFE: Si el antispam falla, DEJAR PASAR el mensaje
    // Es mejor permitir un spam que bloquear a todos los usuarios.
    return { allowed: true };
  }
}

/**
 * 🗑️ Limpieza periódica de memoria
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of tempBanCache) {
    if (val.expiresAt < now) tempBanCache.delete(key);
  }
}, 60000);