/**
 * 🏅 BADGE SERVICE — Sistema de badges de identidad
 *
 * Badges basados en participación en eventos:
 * - Nuevo (0 eventos)
 * - Participante (1+)
 * - Activo (3+)
 * - Regular (10+)
 * - Veterano (25+)
 * - Anfitrión (50+)
 *
 * Badge cacheado en documento de usuario. Se actualiza al participar en eventos.
 */

import { doc, getDoc, updateDoc, increment as firestoreIncrement } from 'firebase/firestore';
import { db } from '@/config/firebase';

// ═══════════════════════════════════════════════════════════════════
// DEFINICIÓN DE BADGES
// ═══════════════════════════════════════════════════════════════════

export const BADGE_LEVELS = [
  { min: 50, badge: 'Anfitrión', color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30' },
  { min: 25, badge: 'Veterano', color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30' },
  { min: 10, badge: 'Regular', color: 'text-purple-400', bg: 'bg-purple-500/15', border: 'border-purple-500/30' },
  { min: 3,  badge: 'Activo', color: 'text-green-400', bg: 'bg-green-500/15', border: 'border-green-500/30' },
  { min: 1,  badge: 'Participante', color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/30' },
  { min: 0,  badge: 'Nuevo', color: 'text-gray-400', bg: 'bg-gray-500/15', border: 'border-gray-500/30' },
];

/**
 * Calcula el badge según cantidad de eventos participados
 */
export function calculateBadge(eventosParticipados) {
  const count = eventosParticipados || 0;
  for (const level of BADGE_LEVELS) {
    if (count >= level.min) return level.badge;
  }
  return 'Nuevo';
}

/**
 * Obtiene la configuración visual de un badge
 */
export function getBadgeConfig(badge) {
  return BADGE_LEVELS.find(l => l.badge === badge) || BADGE_LEVELS[BADGE_LEVELS.length - 1];
}

// ═══════════════════════════════════════════════════════════════════
// FIRESTORE
// ═══════════════════════════════════════════════════════════════════

// Cache local para evitar lecturas repetidas
const badgeCache = new Map();

/**
 * Obtiene el badge de un usuario (cache → Firestore)
 */
export async function getUserBadge(userId) {
  if (!userId) return 'Nuevo';

  // Cache local
  const cached = badgeCache.get(userId);
  if (cached && (Date.now() - cached._at) < 300_000) {
    return cached.badge;
  }

  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const badge = userDoc.data().badge || 'Nuevo';
      badgeCache.set(userId, { badge, _at: Date.now() });
      return badge;
    }
  } catch (err) {
    console.warn('[BADGE] Error leyendo badge:', err.message);
  }

  return 'Nuevo';
}

/**
 * Incrementa eventosParticipados y recalcula badge
 */
export async function incrementEventosParticipados(userId) {
  if (!userId) return;

  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return;

    const currentCount = (userSnap.data().eventosParticipados || 0) + 1;
    const newBadge = calculateBadge(currentCount);

    await updateDoc(userRef, {
      eventosParticipados: firestoreIncrement(1),
      badge: newBadge,
    });

    // Actualizar cache
    badgeCache.set(userId, { badge: newBadge, _at: Date.now() });

    console.log(`[BADGE] ${userId}: ${currentCount} eventos → ${newBadge}`);
    return newBadge;
  } catch (err) {
    console.warn('[BADGE] Error incrementando:', err.message);
  }
}

// Limpiar cache periódicamente
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of badgeCache) {
    if (now - val._at > 600_000) badgeCache.delete(key);
  }
}, 300_000);
