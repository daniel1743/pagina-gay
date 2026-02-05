/**
 * 🚀 SERVICIO DE ENGAGEMENT BOOST
 * Sistema de vistas y likes graduales para nuevos usuarios
 *
 * Objetivo: Que usuarios nuevos no se sientan invisibles mientras
 * se construye la comunidad real.
 *
 * - Vistas: 3-50, distribuidas en 2 horas (las primeras 3 rápidas)
 * - Likes: 7-35, comienzan después de 20 min, distribuidas en 4 horas
 * - Comentarios: SIEMPRE genuinos, nunca fake
 */

import { db } from '@/config/firebase';
import { doc, updateDoc, increment, getDoc } from 'firebase/firestore';

// ============================================
// ⚙️ CONFIGURACIÓN
// ============================================

const CONFIG = {
  // Vistas fake graduales
  vistas: {
    min: 3,
    maxBase: 50,           // Base máxima
    escalado: 10,          // Si muchos llegan a 50, aumentar de 10 en 10
    inicialesRapidas: 3,   // Primeras 3 en los primeros 5 minutos
    duracionHoras: 2,      // Distribución total en 2 horas
  },

  // Likes fake graduales
  likes: {
    min: 7,
    maxBase: 35,
    escalado: 5,
    delayMinutos: 20,      // Empiezan después de 20 minutos
    duracionHoras: 4,      // Distribución total en 4 horas
  },

  // Control de frecuencia de toasts
  toastCooldownMinutos: 15,
};

// ============================================
// 🔧 UTILIDADES
// ============================================

/**
 * Hash simple para generar variación consistente por usuario
 */
function hashString(str) {
  if (!str) return 0;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Obtener timestamp en milisegundos
 */
function getTimestampMs(timestamp) {
  if (!timestamp) return Date.now();
  if (typeof timestamp === 'number') return timestamp;
  if (timestamp.toMillis) return timestamp.toMillis();
  if (timestamp.seconds) return timestamp.seconds * 1000;
  return Date.now();
}

/**
 * Calcular máximo dinámico (escala si muchos llegan al límite)
 */
function calcularMaxDinamico(baseMax, escalado, contadorActual) {
  // Si ya está cerca del máximo, aumentar el techo
  if (contadorActual >= baseMax - 5) {
    const incrementos = Math.floor((contadorActual - baseMax + 10) / escalado);
    return baseMax + (incrementos * escalado);
  }
  return baseMax;
}

// ============================================
// 👁️ SISTEMA DE VISTAS
// ============================================

/**
 * Calcular vistas esperadas basado en tiempo transcurrido
 */
export function calcularVistasEsperadas(item, tipo = 'tarjeta') {
  const ahora = Date.now();
  const creacion = getTimestampMs(item.creadaEn || item.createdAt || item.timestamp);
  const minutosTranscurridos = (ahora - creacion) / (1000 * 60);

  const id = item.odIdUsuari || item.odUsuarioId || item.id || '';
  const seed = hashString(id);

  // Variación única por usuario (-3 a +5)
  const variacionBase = (seed % 9) - 3;

  // Primeras 3 vistas en los primeros 5 minutos
  if (minutosTranscurridos < 5) {
    const vistasIniciales = Math.min(3, Math.floor(minutosTranscurridos / 1.5) + 1);
    return Math.max(1, vistasIniciales);
  }

  // Distribución gradual hasta 2 horas
  const duracionMinutos = CONFIG.vistas.duracionHoras * 60;
  const progreso = Math.min(1, minutosTranscurridos / duracionMinutos);

  // Curva logarítmica para apariencia natural
  // Más rápido al inicio, más lento al final
  const curva = Math.pow(progreso, 0.6);

  const maxDinamico = calcularMaxDinamico(
    CONFIG.vistas.maxBase,
    CONFIG.vistas.escalado,
    item.visitasRecibidas || item.vistas || 0
  );

  const vistasCalculadas = CONFIG.vistas.inicialesRapidas +
    Math.floor((maxDinamico - CONFIG.vistas.inicialesRapidas) * curva);

  return Math.max(
    CONFIG.vistas.min,
    Math.min(maxDinamico, vistasCalculadas + variacionBase)
  );
}

// ============================================
// ❤️ SISTEMA DE LIKES
// ============================================

/**
 * Verificar si una tarjeta tiene foto REAL (no avatar genérico)
 * Los likes solo se generan para fotos reales subidas por el usuario
 * Avatares genéricos (dicebear, ui-avatars, etc.) no merecen likes
 */
function tieneFotoReal(item) {
  const foto = item.fotoUrl || item.fotoUrlFull || '';
  if (!foto) return false;

  // Avatares genéricos que NO cuentan como foto real
  const avatarPatterns = [
    'dicebear.com',
    'ui-avatars.com',
    'avatars.githubusercontent',
    'gravatar.com',
    'placeholder',
  ];

  const esAvatar = avatarPatterns.some(p => foto.toLowerCase().includes(p));
  return !esAvatar;
}

/**
 * Calcular likes esperados basado en tiempo transcurrido
 * IMPORTANTE: Solo genera likes si la tarjeta tiene foto REAL
 * (no avatar genérico - sería raro ver 20 likes en un avatar)
 */
export function calcularLikesEsperados(item, tipo = 'tarjeta') {
  // Para tarjetas: sin foto real = sin likes fake
  if (tipo === 'tarjeta' && !tieneFotoReal(item)) {
    return 0;
  }

  const ahora = Date.now();
  const creacion = getTimestampMs(item.creadaEn || item.createdAt || item.timestamp);
  const minutosTranscurridos = (ahora - creacion) / (1000 * 60);

  // No hay likes en los primeros 20 minutos
  if (minutosTranscurridos < CONFIG.likes.delayMinutos) {
    return 0;
  }

  const id = item.odIdUsuari || item.odUsuarioId || item.id || '';
  const seed = hashString(id);

  // Variación única por usuario (-2 a +4)
  const variacionBase = (seed % 7) - 2;

  // Tiempo desde que empiezan los likes
  const minutosDesdeInicio = minutosTranscurridos - CONFIG.likes.delayMinutos;
  const duracionMinutos = CONFIG.likes.duracionHoras * 60;
  const progreso = Math.min(1, minutosDesdeInicio / duracionMinutos);

  // Curva más lenta para likes (se sienten más "ganados")
  const curva = Math.pow(progreso, 0.75);

  const maxDinamico = calcularMaxDinamico(
    CONFIG.likes.maxBase,
    CONFIG.likes.escalado,
    item.likesRecibidos || item.likes || 0
  );

  const likesCalculados = Math.floor(maxDinamico * curva);

  // Mínimo proporcional al progreso
  const minProporcional = Math.floor(CONFIG.likes.min * progreso);

  return Math.max(
    minProporcional,
    Math.min(maxDinamico, likesCalculados + variacionBase)
  );
}

// ============================================
// 🔄 APLICAR BOOST
// ============================================

/**
 * Aplicar boost de vistas a una tarjeta
 */
export async function aplicarBoostVistas(tarjetaId, vistasActuales, vistasEsperadas) {
  if (vistasEsperadas <= vistasActuales) return false;

  try {
    const incremento = vistasEsperadas - vistasActuales;
    await updateDoc(doc(db, 'tarjetas', tarjetaId), {
      visitasRecibidas: increment(incremento)
    });
    console.log(`[BOOST] 👁️ +${incremento} vistas a tarjeta ${tarjetaId.slice(0, 8)}...`);
    return true;
  } catch (error) {
    console.error('[BOOST] Error aplicando vistas:', error);
    return false;
  }
}

/**
 * Aplicar boost de likes a una tarjeta
 */
export async function aplicarBoostLikes(tarjetaId, likesActuales, likesEsperados) {
  if (likesEsperados <= likesActuales) return false;

  try {
    const incremento = likesEsperados - likesActuales;
    await updateDoc(doc(db, 'tarjetas', tarjetaId), {
      likesRecibidos: increment(incremento)
    });
    console.log(`[BOOST] ❤️ +${incremento} likes a tarjeta ${tarjetaId.slice(0, 8)}...`);
    return true;
  } catch (error) {
    console.error('[BOOST] Error aplicando likes:', error);
    return false;
  }
}

/**
 * Aplicar boost a una opinión (OPIN)
 * Las opiniones usan viewCount y likeCount en lugar de vistas/likes
 */
export async function aplicarBoostOpinion(opinionId, vistasActuales, vistasEsperadas, likesActuales, likesEsperados) {
  try {
    const updates = {};

    if (vistasEsperadas > vistasActuales) {
      updates.viewCount = increment(vistasEsperadas - vistasActuales);
    }

    if (likesEsperados > likesActuales) {
      updates.likeCount = increment(likesEsperados - likesActuales);
    }

    if (Object.keys(updates).length > 0) {
      await updateDoc(doc(db, 'opin_posts', opinionId), updates);
      console.log(`[BOOST] 📝 Boost aplicado a OPIN ${opinionId.slice(0, 8)}...`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('[BOOST] Error aplicando boost a opinión:', error);
    return false;
  }
}

// ============================================
// 🎯 PROCESO COMPLETO DE BOOST
// ============================================

/**
 * Procesar boost para una tarjeta
 * Llama esto cuando se carga/visualiza una tarjeta
 */
export async function procesarBoostTarjeta(tarjeta) {
  if (!tarjeta || !tarjeta.odIdUsuari && !tarjeta.id) return null;

  const tarjetaId = tarjeta.odIdUsuari || tarjeta.id;
  const vistasActuales = tarjeta.visitasRecibidas || 0;
  const likesActuales = tarjeta.likesRecibidos || 0;

  const vistasEsperadas = calcularVistasEsperadas(tarjeta, 'tarjeta');
  const likesEsperados = calcularLikesEsperados(tarjeta, 'tarjeta');

  let huboBoost = false;

  // Aplicar boost de vistas si es necesario
  if (vistasEsperadas > vistasActuales) {
    await aplicarBoostVistas(tarjetaId, vistasActuales, vistasEsperadas);
    huboBoost = true;
  }

  // Aplicar boost de likes si es necesario
  if (likesEsperados > likesActuales) {
    await aplicarBoostLikes(tarjetaId, likesActuales, likesEsperados);
    huboBoost = true;
  }

  return {
    huboBoost,
    vistas: Math.max(vistasActuales, vistasEsperadas),
    likes: Math.max(likesActuales, likesEsperados),
    vistasNuevas: Math.max(0, vistasEsperadas - vistasActuales),
    likesNuevos: Math.max(0, likesEsperados - likesActuales)
  };
}

/**
 * Procesar boost para una opinión (OPIN)
 * Las opiniones usan viewCount/likeCount y createdAt
 */
export async function procesarBoostOpinion(opinion) {
  if (!opinion || !opinion.id) return null;

  // Las opiniones usan viewCount y likeCount
  const vistasActuales = opinion.viewCount || opinion.vistas || 0;
  const likesActuales = opinion.likeCount || opinion.likes || 0;

  // Crear objeto compatible para calcular vistas/likes esperadas
  const opinionNormalizada = {
    ...opinion,
    creadaEn: opinion.createdAt || opinion.creadaEn
  };

  const vistasEsperadas = calcularVistasEsperadas(opinionNormalizada, 'opinion');
  const likesEsperados = calcularLikesEsperados(opinionNormalizada, 'opinion');

  let huboBoost = false;

  if (vistasEsperadas > vistasActuales || likesEsperados > likesActuales) {
    await aplicarBoostOpinion(opinion.id, vistasActuales, vistasEsperadas, likesActuales, likesEsperados);
    huboBoost = true;
  }

  return {
    huboBoost,
    vistas: Math.max(vistasActuales, vistasEsperadas),
    likes: Math.max(likesActuales, likesEsperados)
  };
}

// ============================================
// 🔔 MENSAJES Y TOASTS
// ============================================

/**
 * Generar mensaje de engagement para toast
 */
export function generarMensajeEngagement(tipo, datos) {
  const { vistas, likes, vistasNuevas, likesNuevos } = datos;

  // Mensajes variados para vistas (aparecen primero, rápido)
  const mensajesVistas = [
    `👀 ${vistas} personas vieron tu ${tipo}`,
    `🔥 Tu ${tipo} tiene ${vistas} visitas`,
    `✨ ${vistas} personas te han visto`,
    `👁️ ¡${vistas} visitas en tu ${tipo}!`,
  ];

  // Mensajes variados para likes (aparecen después de 20 min)
  const mensajesLikes = [
    `❤️ ${likes} likes en tu ${tipo}`,
    `🎉 ¡${likes} personas te dieron like!`,
    `💕 Tu ${tipo} tiene ${likes} likes`,
    `💖 ¡Ya tienes ${likes} likes!`,
  ];

  // Mensajes motivacionales - IMPORTANTE: incluir "más likes = más visibilidad"
  const mensajesMotivacion = [
    '💡 Más likes = más visibilidad',
    '💡 Mientras más likes, más te ven',
    '🚀 ¡Sigue así, estás destacando!',
    '⭐ Tu perfil está ganando atención',
    '🔥 ¡Estás en tendencia!',
    '📈 Tu visibilidad está subiendo',
    '✨ ¡Sigues ganando atención!',
  ];

  // Mensajes para primeras vistas (engagement inmediato)
  const mensajesPrimerasVistas = [
    '¡Ya no eres invisible!',
    '¡La gente te está notando!',
    '¡Tu perfil ya tiene audiencia!',
  ];

  const random = Math.random();

  // Si hay nuevos likes, priorizar mensaje de likes
  if (likesNuevos > 0 && random < 0.5) {
    return {
      title: mensajesLikes[Math.floor(Math.random() * mensajesLikes.length)],
      description: mensajesMotivacion[Math.floor(Math.random() * mensajesMotivacion.length)]
    };
  }

  // Si hay nuevas vistas
  if (vistasNuevas > 0) {
    // Primeras vistas (1-5): mensaje especial de "no eres invisible"
    if (vistas <= 5) {
      return {
        title: mensajesVistas[Math.floor(Math.random() * mensajesVistas.length)],
        description: mensajesPrimerasVistas[Math.floor(Math.random() * mensajesPrimerasVistas.length)]
      };
    }

    // Más vistas: mostrar likes si hay, o motivar
    return {
      title: mensajesVistas[Math.floor(Math.random() * mensajesVistas.length)],
      description: likes > 0
        ? `❤️ y ${likes} likes - ${mensajesMotivacion[0]}`
        : '¡Completa tu perfil para más interacción!'
    };
  }

  return null;
}

/**
 * Verificar si debe mostrar toast (cooldown)
 */
export function deberíaMostrarToast(ultimoToastKey = 'lastEngagementToast') {
  const ultimoToast = localStorage.getItem(ultimoToastKey);
  if (!ultimoToast) return true;

  const ahora = Date.now();
  const diferencia = ahora - parseInt(ultimoToast);
  const cooldownMs = CONFIG.toastCooldownMinutos * 60 * 1000;

  return diferencia > cooldownMs;
}

/**
 * Marcar que se mostró un toast
 */
export function marcarToastMostrado(toastKey = 'lastEngagementToast') {
  localStorage.setItem(toastKey, Date.now().toString());
}

// ============================================
// 📊 ESTADÍSTICAS DE DEBUG
// ============================================

/**
 * Obtener estadísticas de boost para debug
 */
export function getBoostStats(item, tipo = 'tarjeta') {
  const ahora = Date.now();
  const creacion = getTimestampMs(item.creadaEn || item.createdAt || item.timestamp);
  const minutosTranscurridos = (ahora - creacion) / (1000 * 60);

  return {
    tipo,
    minutosTranscurridos: Math.floor(minutosTranscurridos),
    horasTranscurridas: (minutosTranscurridos / 60).toFixed(1),
    vistasActuales: item.visitasRecibidas || item.vistas || 0,
    vistasEsperadas: calcularVistasEsperadas(item, tipo),
    likesActuales: item.likesRecibidos || item.likes || 0,
    likesEsperados: calcularLikesEsperados(item, tipo),
    likesDelay: `${CONFIG.likes.delayMinutos} min`,
    enPeriodoLikes: minutosTranscurridos >= CONFIG.likes.delayMinutos
  };
}

export default {
  calcularVistasEsperadas,
  calcularLikesEsperados,
  procesarBoostTarjeta,
  procesarBoostOpinion,
  generarMensajeEngagement,
  deberíaMostrarToast,
  marcarToastMostrado,
  getBoostStats
};
