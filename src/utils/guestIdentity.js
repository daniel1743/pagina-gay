/**
 * SISTEMA DE IDENTIDAD PERSISTENTE PARA INVITADOS
 *
 * Objetivo: Mantener una identidad consistente para usuarios invitados
 * entre sesiones, sin depender de Firebase UID ni pedir datos repetidamente.
 *
 * Principios:
 * - guestId único e inmutable (UUID v4)
 * - Persistencia en localStorage
 * - Experiencia sin fricción al reingresar
 */

import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'chactivo_guest_identity';
const TEMP_STORAGE_KEY = 'chactivo_guest_temp'; // Temporal del modal

/**
 * Estructura de datos de identidad:
 * {
 *   guestId: string (UUID v4 - INMUTABLE),
 *   nombre: string,
 *   avatar: string (URL),
 *   createdAt: number (timestamp),
 *   lastSeen: number (timestamp),
 *   firebaseUid: string | null (opcional, para sincronización)
 * }
 */

/**
 * Genera un avatar aleatorio único basado en el guestId
 */
function generateAvatar(guestId) {
  const styles = ['avataaars', 'bottts', 'pixel-art', 'adventurer', 'micah'];
  const randomStyle = styles[Math.floor(Math.random() * styles.length)];
  return `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${guestId}`;
}

/**
 * Obtiene la identidad persistente del invitado desde localStorage
 * @returns {Object|null} - Objeto de identidad o null si no existe
 */
export function getGuestIdentity() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const identity = JSON.parse(stored);

    // Validar que tenga los campos esenciales
    if (!identity.guestId || !identity.nombre || !identity.avatar) {
      console.warn('[GuestIdentity] Identidad corrupta, eliminando...');
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    // Actualizar lastSeen
    identity.lastSeen = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));

    return identity;
  } catch (error) {
    console.error('[GuestIdentity] Error leyendo identidad:', error);
    return null;
  }
}

/**
 * Crea y guarda una nueva identidad de invitado
 * @param {Object} data - { nombre, avatar? }
 * @returns {Object} - Identidad creada
 */
export function createGuestIdentity({ nombre, avatar = null }) {
  const guestId = uuidv4();
  const identity = {
    guestId,
    nombre: nombre || 'Invitado',
    avatar: avatar || generateAvatar(guestId),
    createdAt: Date.now(),
    lastSeen: Date.now(),
    firebaseUid: null, // Se actualizará cuando se autentique con Firebase
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
    console.log('[GuestIdentity] ✅ Identidad creada:', identity.guestId);
    return identity;
  } catch (error) {
    console.error('[GuestIdentity] Error guardando identidad:', error);
    return identity; // Devolver aunque no se haya guardado
  }
}

/**
 * Actualiza el nombre del invitado (mantiene guestId inmutable)
 * @param {string} nuevoNombre
 * @returns {Object|null} - Identidad actualizada o null si no existe
 */
export function updateGuestName(nuevoNombre) {
  const identity = getGuestIdentity();
  if (!identity) {
    console.warn('[GuestIdentity] No hay identidad para actualizar');
    return null;
  }

  identity.nombre = nuevoNombre;
  identity.lastSeen = Date.now();

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
    console.log('[GuestIdentity] ✅ Nombre actualizado:', nuevoNombre);
    return identity;
  } catch (error) {
    console.error('[GuestIdentity] Error actualizando nombre:', error);
    return identity;
  }
}

/**
 * Actualiza el avatar del invitado
 * @param {string} nuevoAvatar - URL del avatar
 * @returns {Object|null} - Identidad actualizada o null si no existe
 */
export function updateGuestAvatar(nuevoAvatar) {
  const identity = getGuestIdentity();
  if (!identity) {
    console.warn('[GuestIdentity] No hay identidad para actualizar');
    return null;
  }

  identity.avatar = nuevoAvatar;
  identity.lastSeen = Date.now();

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
    console.log('[GuestIdentity] ✅ Avatar actualizado');
    return identity;
  } catch (error) {
    console.error('[GuestIdentity] Error actualizando avatar:', error);
    return identity;
  }
}

/**
 * Asocia la identidad del invitado con un UID de Firebase
 * (Útil para sincronización con Firestore)
 * @param {string} firebaseUid
 * @returns {Object|null}
 */
export function linkGuestToFirebase(firebaseUid) {
  const identity = getGuestIdentity();
  if (!identity) {
    console.warn('[GuestIdentity] No hay identidad para vincular');
    return null;
  }

  identity.firebaseUid = firebaseUid;
  identity.lastSeen = Date.now();

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
    console.log('[GuestIdentity] ✅ Vinculado con Firebase:', firebaseUid);
    return identity;
  } catch (error) {
    console.error('[GuestIdentity] Error vinculando Firebase:', error);
    return identity;
  }
}

/**
 * Elimina la identidad del invitado (logout)
 */
export function clearGuestIdentity() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TEMP_STORAGE_KEY);
    localStorage.removeItem('guest_session_backup'); // Legacy
    localStorage.removeItem('guest_session_temp'); // Legacy
    console.log('[GuestIdentity] ✅ Identidad eliminada');
  } catch (error) {
    console.error('[GuestIdentity] Error eliminando identidad:', error);
  }
}

/**
 * Verifica si existe una identidad válida
 * @returns {boolean}
 */
export function hasGuestIdentity() {
  const identity = getGuestIdentity();
  return identity !== null;
}

/**
 * Guarda datos temporales del modal (antes de crear la identidad permanente)
 * Útil para cuando el usuario llena el modal pero aún no se autentica
 * @param {Object} data - { nombre, avatar }
 */
export function saveTempGuestData(data) {
  try {
    localStorage.setItem(TEMP_STORAGE_KEY, JSON.stringify({
      ...data,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('[GuestIdentity] Error guardando temp data:', error);
  }
}

/**
 * Obtiene datos temporales del modal
 * @returns {Object|null}
 */
export function getTempGuestData() {
  try {
    const stored = localStorage.getItem(TEMP_STORAGE_KEY);
    if (!stored) return null;

    const data = JSON.parse(stored);

    // Verificar que no sea muy antiguo (> 5 minutos)
    if (Date.now() - data.timestamp > 5 * 60 * 1000) {
      localStorage.removeItem(TEMP_STORAGE_KEY);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[GuestIdentity] Error leyendo temp data:', error);
    return null;
  }
}

/**
 * Limpia datos temporales
 */
export function clearTempGuestData() {
  try {
    localStorage.removeItem(TEMP_STORAGE_KEY);
  } catch (error) {
    console.error('[GuestIdentity] Error limpiando temp data:', error);
  }
}

/**
 * Migra datos del sistema legacy al nuevo sistema
 * (Para compatibilidad con el código anterior)
 */
export function migrateLegacyGuestData() {
  try {
    // Si ya existe identidad nueva, no migrar
    if (hasGuestIdentity()) return;

    // Buscar datos legacy
    const legacyBackup = localStorage.getItem('guest_session_backup');
    const legacyTemp = localStorage.getItem('guest_session_temp');

    let dataToMigrate = null;

    // Priorizar tempBackup (más reciente)
    if (legacyTemp) {
      try {
        dataToMigrate = JSON.parse(legacyTemp);
      } catch {}
    } else if (legacyBackup) {
      try {
        dataToMigrate = JSON.parse(legacyBackup);
      } catch {}
    }

    if (dataToMigrate && dataToMigrate.username && dataToMigrate.avatar) {
      const newIdentity = createGuestIdentity({
        nombre: dataToMigrate.username,
        avatar: dataToMigrate.avatar
      });

      // Vincular con Firebase UID si existe
      if (dataToMigrate.uid) {
        linkGuestToFirebase(dataToMigrate.uid);
      }

      console.log('[GuestIdentity] ✅ Datos legacy migrados');

      // Limpiar datos legacy
      localStorage.removeItem('guest_session_backup');
      localStorage.removeItem('guest_session_temp');
    }
  } catch (error) {
    console.error('[GuestIdentity] Error migrando datos legacy:', error);
  }
}

/**
 * Debug: Imprimir estado actual de la identidad
 */
export function debugGuestIdentity() {
  const identity = getGuestIdentity();
  console.log('=== DEBUG GUEST IDENTITY ===');
  console.log('Existe identidad:', hasGuestIdentity());
  console.log('Datos:', identity);
  console.log('Temp data:', getTempGuestData());
  console.log('===========================');
}
