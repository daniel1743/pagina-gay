import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  collection,
  addDoc,
  serverTimestamp,
  runTransaction,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { LOG_ACTION } from './ticketService';

/**
 * SERVICIO DE ACCIONES ADMINISTRATIVAS
 *
 * Funciones para que admins ejecuten acciones operativas desde tickets:
 * - Cambio de username (con validación y actualización de índices)
 * - Cambio de email
 * - Gestión de roles
 * - Auditoría completa
 *
 * SEGURIDAD: Todas las operaciones requieren rol admin verificado
 */

// ============================================
// VALIDACIONES
// ============================================

/**
 * Validar formato de username
 * @param {string} username - Username a validar
 * @returns {Object} { valid: boolean, error: string }
 */
export const validateUsername = (username) => {
  if (!username || typeof username !== 'string') {
    return { valid: false, error: 'Username es requerido' };
  }

  const trimmed = username.trim();

  // Longitud
  if (trimmed.length < 3) {
    return { valid: false, error: 'Username debe tener al menos 3 caracteres' };
  }

  if (trimmed.length > 20) {
    return { valid: false, error: 'Username no puede exceder 20 caracteres' };
  }

  // Formato: solo letras, números y guiones bajos
  const validFormat = /^[a-zA-Z0-9_]+$/.test(trimmed);
  if (!validFormat) {
    return { valid: false, error: 'Username solo puede contener letras, números y guiones bajos (_)' };
  }

  // No puede empezar con número
  if (/^\d/.test(trimmed)) {
    return { valid: false, error: 'Username no puede empezar con un número' };
  }

  // Palabras prohibidas
  const prohibited = ['admin', 'system', 'bot', 'moderator', 'staff', 'support'];
  const lowerUsername = trimmed.toLowerCase();
  if (prohibited.some(word => lowerUsername.includes(word))) {
    return { valid: false, error: 'Username contiene palabras reservadas' };
  }

  return { valid: true, error: null };
};

/**
 * Verificar disponibilidad de username
 * @param {string} username - Username a verificar
 * @param {string} excludeUid - UID del usuario a excluir (opcional, para updates)
 * @returns {Promise<boolean>} true si está disponible
 */
export const checkUsernameAvailability = async (username, excludeUid = null) => {
  try {
    const usernameLower = username.toLowerCase();
    const usernameRef = doc(db, 'usernames', usernameLower);
    const usernameSnap = await getDoc(usernameRef);

    // Si no existe, está disponible
    if (!usernameSnap.exists()) {
      return true;
    }

    // Si existe pero es del mismo usuario (update), está disponible
    const data = usernameSnap.data();
    if (excludeUid && data.uid === excludeUid) {
      return true;
    }

    // Ya está tomado por otro usuario
    return false;
  } catch (error) {
    console.error('❌ Error verificando disponibilidad:', error);
    throw error;
  }
};

// ============================================
// CAMBIO DE USERNAME
// ============================================

/**
 * Cambiar username de un usuario (TRANSACCIÓN ATÓMICA)
 * @param {string} userId - UID del usuario
 * @param {string} newUsername - Nuevo username
 * @param {string} adminUid - UID del admin que ejecuta
 * @param {string} ticketId - ID del ticket asociado (opcional)
 * @returns {Promise<Object>} { success: boolean, oldUsername: string, newUsername: string }
 */
export const changeUsername = async (userId, newUsername, adminUid, ticketId = null) => {
  try {
    // 1. Validar formato
    const validation = validateUsername(newUsername);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const newUsernameLower = newUsername.toLowerCase();

    // 2. Verificar disponibilidad
    const isAvailable = await checkUsernameAvailability(newUsername, userId);
    if (!isAvailable) {
      throw new Error('Username no disponible, ya está en uso');
    }

    // 3. Ejecutar transacción atómica
    const result = await runTransaction(db, async (transaction) => {
      // Obtener usuario actual
      const userRef = doc(db, 'users', userId);
      const userSnap = await transaction.get(userRef);

      if (!userSnap.exists()) {
        throw new Error('Usuario no encontrado');
      }

      const userData = userSnap.data();
      const oldUsername = userData.username;
      const oldUsernameLower = oldUsername?.toLowerCase();

      // Si es el mismo username, no hacer nada
      if (oldUsernameLower === newUsernameLower) {
        return {
          success: true,
          skipped: true,
          oldUsername,
          newUsername
        };
      }

      // Actualizar documento del usuario
      transaction.update(userRef, {
        username: newUsername,
        updatedAt: serverTimestamp()
      });

      // Crear nuevo índice de username
      const newUsernameRef = doc(db, 'usernames', newUsernameLower);
      transaction.set(newUsernameRef, {
        uid: userId,
        createdAt: serverTimestamp()
      });

      // Eliminar índice viejo si existe
      if (oldUsernameLower && oldUsernameLower !== newUsernameLower) {
        const oldUsernameRef = doc(db, 'usernames', oldUsernameLower);
        transaction.delete(oldUsernameRef);
      }

      return {
        success: true,
        skipped: false,
        oldUsername,
        newUsername
      };
    });

    // 4. Si hay ticket asociado, registrar log
    if (ticketId && !result.skipped) {
      const logsRef = collection(db, 'tickets', ticketId, 'logs');
      await addDoc(logsRef, {
        action: LOG_ACTION.USERNAME_CHANGED,
        actorUid: adminUid,
        actorRole: 'staff',
        meta: {
          userId,
          oldUsername: result.oldUsername,
          newUsername: result.newUsername
        },
        createdAt: serverTimestamp()
      });
    }

    console.log('✅ Username cambiado:', result.oldUsername, '→', result.newUsername);
    return result;
  } catch (error) {
    console.error('❌ Error cambiando username:', error);
    throw error;
  }
};

/**
 * Validar y preparar cambio de username (preview antes de ejecutar)
 * @param {string} userId - UID del usuario
 * @param {string} newUsername - Nuevo username
 * @returns {Promise<Object>} { valid, available, currentUsername, errors }
 */
export const validateUsernameChange = async (userId, newUsername) => {
  try {
    const result = {
      valid: false,
      available: false,
      currentUsername: null,
      newUsername: newUsername,
      errors: []
    };

    // Obtener username actual
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      result.errors.push('Usuario no encontrado');
      return result;
    }

    result.currentUsername = userSnap.data().username;

    // Validar formato
    const validation = validateUsername(newUsername);
    if (!validation.valid) {
      result.errors.push(validation.error);
      return result;
    }

    result.valid = true;

    // Verificar disponibilidad
    const isAvailable = await checkUsernameAvailability(newUsername, userId);
    result.available = isAvailable;

    if (!isAvailable) {
      result.errors.push('Username no disponible');
    }

    return result;
  } catch (error) {
    console.error('❌ Error validando username:', error);
    throw error;
  }
};

// ============================================
// OTRAS ACCIONES ADMINISTRATIVAS
// ============================================

/**
 * Cambiar email de un usuario
 * @param {string} userId - UID del usuario
 * @param {string} newEmail - Nuevo email
 * @param {string} adminUid - UID del admin
 * @param {string} ticketId - ID del ticket (opcional)
 * @returns {Promise<Object>}
 */
export const changeUserEmail = async (userId, newEmail, adminUid, ticketId = null) => {
  try {
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      throw new Error('Formato de email inválido');
    }

    // Actualizar usuario
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error('Usuario no encontrado');
    }

    const oldEmail = userSnap.data().email;

    await updateDoc(userRef, {
      email: newEmail,
      updatedAt: serverTimestamp()
    });

    // Registrar log en ticket si aplica
    if (ticketId) {
      const logsRef = collection(db, 'tickets', ticketId, 'logs');
      await addDoc(logsRef, {
        action: 'email_changed',
        actorUid: adminUid,
        actorRole: 'staff',
        meta: {
          userId,
          oldEmail,
          newEmail
        },
        createdAt: serverTimestamp()
      });
    }

    console.log('✅ Email cambiado:', oldEmail, '→', newEmail);
    return {
      success: true,
      oldEmail,
      newEmail
    };
  } catch (error) {
    console.error('❌ Error cambiando email:', error);
    throw error;
  }
};

/**
 * Actualizar rol de usuario (admin, support, user)
 * @param {string} userId - UID del usuario
 * @param {string} newRole - Nuevo rol
 * @param {string} adminUid - UID del admin
 * @returns {Promise<Object>}
 */
export const updateUserRole = async (userId, newRole, adminUid) => {
  try {
    const validRoles = ['user', 'support', 'admin'];
    if (!validRoles.includes(newRole)) {
      throw new Error('Rol inválido. Debe ser: user, support o admin');
    }

    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error('Usuario no encontrado');
    }

    const oldRole = userSnap.data().role || 'user';

    await updateDoc(userRef, {
      role: newRole,
      updatedAt: serverTimestamp()
    });

    console.log('✅ Rol actualizado:', oldRole, '→', newRole);
    return {
      success: true,
      oldRole,
      newRole
    };
  } catch (error) {
    console.error('❌ Error actualizando rol:', error);
    throw error;
  }
};

/**
 * Resetear límite de mensajes de guest
 * @param {string} userId - UID del usuario
 * @param {string} adminUid - UID del admin
 * @param {string} ticketId - ID del ticket (opcional)
 * @returns {Promise<Object>}
 */
export const resetGuestMessageLimit = async (userId, adminUid, ticketId = null) => {
  try {
    const userRef = doc(db, 'users', userId);

    await updateDoc(userRef, {
      messageCount: 0,
      updatedAt: serverTimestamp()
    });

    // Registrar en ticket
    if (ticketId) {
      const logsRef = collection(db, 'tickets', ticketId, 'logs');
      await addDoc(logsRef, {
        action: 'message_limit_reset',
        actorUid: adminUid,
        actorRole: 'staff',
        meta: {
          userId
        },
        createdAt: serverTimestamp()
      });
    }

    console.log('✅ Límite de mensajes reseteado para:', userId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error reseteando límite:', error);
    throw error;
  }
};

/**
 * Eliminar sanción de un usuario
 * @param {string} userId - UID del usuario
 * @param {string} sanctionId - ID de la sanción
 * @param {string} adminUid - UID del admin
 * @param {string} reason - Razón de la eliminación
 * @returns {Promise<Object>}
 */
export const removeSanction = async (userId, sanctionId, adminUid, reason) => {
  try {
    const sanctionRef = doc(db, 'users', userId, 'sanctions', sanctionId);
    const sanctionSnap = await getDoc(sanctionRef);

    if (!sanctionSnap.exists()) {
      throw new Error('Sanción no encontrada');
    }

    // Actualizar sanción como inactiva en vez de eliminar (auditoría)
    await updateDoc(sanctionRef, {
      status: 'revoked',
      revokedBy: adminUid,
      revokedAt: serverTimestamp(),
      revokeReason: reason
    });

    console.log('✅ Sanción revocada:', sanctionId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error revocando sanción:', error);
    throw error;
  }
};

// ============================================
// BÚSQUEDA Y UTILIDADES
// ============================================

/**
 * Obtener información completa de un usuario
 * @param {string} userId - UID del usuario
 * @returns {Promise<Object>} Información del usuario
 */
export const getUserInfo = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error('Usuario no encontrado');
    }

    const data = userSnap.data();
    return {
      id: userSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null
    };
  } catch (error) {
    console.error('❌ Error obteniendo info de usuario:', error);
    throw error;
  }
};

/**
 * Buscar usuario por username
 * @param {string} username - Username a buscar
 * @returns {Promise<Object|null>} Información del usuario o null
 */
export const findUserByUsername = async (username) => {
  try {
    const usernameLower = username.toLowerCase();
    const usernameRef = doc(db, 'usernames', usernameLower);
    const usernameSnap = await getDoc(usernameRef);

    if (!usernameSnap.exists()) {
      return null;
    }

    const { uid } = usernameSnap.data();
    return await getUserInfo(uid);
  } catch (error) {
    console.error('❌ Error buscando usuario:', error);
    throw error;
  }
};

/**
 * Verificar si un usuario es admin/support
 * @param {string} userId - UID del usuario
 * @returns {Promise<Object>} { isAdmin, isSupport, role }
 */
export const checkUserRole = async (userId) => {
  try {
    const userInfo = await getUserInfo(userId);
    const role = userInfo.role || 'user';

    return {
      isAdmin: role === 'admin',
      isSupport: role === 'support' || role === 'admin',
      role
    };
  } catch (error) {
    console.error('❌ Error verificando rol:', error);
    return {
      isAdmin: false,
      isSupport: false,
      role: 'user'
    };
  }
};

// ============================================
// LOGS PARA AUDITORÍA
// ============================================

/**
 * Registrar acción administrativa en logs globales
 * @param {string} action - Tipo de acción
 * @param {string} adminUid - UID del admin
 * @param {Object} meta - Metadata de la acción
 * @returns {Promise<void>}
 */
export const logAdminAction = async (action, adminUid, meta) => {
  try {
    const logsRef = collection(db, 'admin_logs');
    await addDoc(logsRef, {
      action,
      adminUid,
      meta,
      timestamp: serverTimestamp()
    });

    console.log('✅ Acción admin registrada:', action);
  } catch (error) {
    console.error('❌ Error registrando acción:', error);
    // No lanzar error para no bloquear flujo principal
  }
};

// ============================================
// ACCIONES EN BATCH (MÚLTIPLES USUARIOS)
// ============================================

/**
 * Actualizar múltiples usuarios en batch
 * @param {Array} updates - Array de { userId, updates }
 * @param {string} adminUid - UID del admin
 * @returns {Promise<Object>} { success: number, failed: number, errors: Array }
 */
export const batchUpdateUsers = async (updates, adminUid) => {
  try {
    const batch = writeBatch(db);
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (const update of updates) {
      try {
        const userRef = doc(db, 'users', update.userId);
        batch.update(userRef, {
          ...update.updates,
          updatedAt: serverTimestamp()
        });
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          userId: update.userId,
          error: error.message
        });
      }
    }

    await batch.commit();

    console.log('✅ Batch update completado:', results);
    return results;
  } catch (error) {
    console.error('❌ Error en batch update:', error);
    throw error;
  }
};

// ============================================
// VALIDACIONES DE SEGURIDAD
// ============================================

/**
 * Verificar que el admin tiene permisos para la acción
 * @param {string} adminUid - UID del admin
 * @param {string} requiredRole - Rol requerido ('admin' o 'support')
 * @returns {Promise<boolean>}
 */
export const verifyAdminPermission = async (adminUid, requiredRole = 'support') => {
  try {
    const roleCheck = await checkUserRole(adminUid);

    if (requiredRole === 'admin') {
      return roleCheck.isAdmin;
    }

    return roleCheck.isSupport; // support o admin
  } catch (error) {
    console.error('❌ Error verificando permisos:', error);
    return false;
  }
};

/**
 * Wrapper seguro para ejecutar acciones admin
 * @param {Function} action - Función a ejecutar
 * @param {string} adminUid - UID del admin
 * @param {string} requiredRole - Rol requerido
 * @returns {Promise<any>}
 */
export const executeAdminAction = async (action, adminUid, requiredRole = 'support') => {
  try {
    const hasPermission = await verifyAdminPermission(adminUid, requiredRole);

    if (!hasPermission) {
      throw new Error('No tienes permisos para ejecutar esta acción');
    }

    return await action();
  } catch (error) {
    console.error('❌ Error ejecutando acción admin:', error);
    throw error;
  }
};
