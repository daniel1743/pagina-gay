import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  limit,
} from 'firebase/firestore';
import { db, auth } from '@/config/firebase';

/**
 * Servicio de Sanciones y Expulsiones
 * Permite a admins sancionar o expulsar usuarios por violar normas
 */

/**
 * Tipos de sanciones disponibles
 */
export const SANCTION_TYPES = {
  WARNING: 'warning',           // Advertencia
  TEMP_BAN: 'temp_ban',         // Suspensión temporal
  PERM_BAN: 'perm_ban',         // Expulsión permanente
  MUTE: 'mute',                 // Silenciar (no puede enviar mensajes)
  RESTRICT: 'restrict',         // Restricción de funciones
};

/**
 * Razones de sanción
 */
export const SANCTION_REASONS = {
  SPAM: 'spam',
  HARASSMENT: 'harassment',
  INAPPROPRIATE_CONTENT: 'inappropriate_content',
  PROFANITY: 'profanity',
  FAKE_ACCOUNT: 'fake_account',
  VIOLENCE_THREATS: 'violence_threats',
  ILLEGAL_CONTENT: 'illegal_content',
  OTHER: 'other',
};

/**
 * Crea una sanción para un usuario
 * @param {object} sanctionData - Datos de la sanción
 * @returns {Promise<string>} ID de la sanción creada
 */
export const createSanction = async (sanctionData) => {
  if (!auth.currentUser) {
    throw new Error('Debes estar autenticado');
  }

  const sanctionsRef = collection(db, 'sanctions');

  const sanction = {
    userId: sanctionData.userId,
    username: sanctionData.username,
    type: sanctionData.type, // warning, temp_ban, perm_ban, mute, restrict
    reason: sanctionData.reason, // spam, harassment, etc.
    reasonDescription: sanctionData.reasonDescription || '',
    duration: sanctionData.duration || null, // En días para temp_ban
    expiresAt: sanctionData.expiresAt || null, // Timestamp de expiración
    issuedBy: auth.currentUser.uid,
    issuedByUsername: sanctionData.issuedByUsername || 'Admin',
    status: 'active', // active, expired, revoked
    createdAt: serverTimestamp(),
    revokedAt: null,
    revokedBy: null,
    notes: sanctionData.notes || '',
  };

  const docRef = await addDoc(sanctionsRef, sanction);
  
  // Si es ban permanente o temporal, actualizar estado del usuario
  if (sanction.type === SANCTION_TYPES.PERM_BAN || sanction.type === SANCTION_TYPES.TEMP_BAN) {
    await updateUserBanStatus(sanctionData.userId, true, sanction.type);
  }

  return docRef.id;
};

/**
 * Actualiza el estado de ban de un usuario
 * @param {string} userId - ID del usuario
 * @param {boolean} isBanned - Si está baneado
 * @param {string} banType - Tipo de ban
 */
export const updateUserBanStatus = async (userId, isBanned, banType) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isBanned: isBanned,
      banType: isBanned ? banType : null,
      bannedAt: isBanned ? serverTimestamp() : null,
    });
  } catch (error) {
    console.error('Error updating user ban status:', error);
  }
};

/**
 * Obtiene todas las sanciones activas de un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Array>} Lista de sanciones activas
 */
export const getUserActiveSanctions = async (userId) => {
  try {
    const sanctionsRef = collection(db, 'sanctions');
    // Simplificar query para evitar necesidad de índice compuesto
    // Primero filtrar por userId, luego filtrar en memoria por status
    const q = query(
      sanctionsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const allSanctions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      expiresAt: doc.data().expiresAt?.toDate?.()?.toISOString() || null,
    }));
    
    // Filtrar por status activo en memoria
    return allSanctions.filter(s => s.status === 'active');
  } catch (error) {
    // Si la query falla (por ejemplo, falta índice), intentar sin orderBy
    if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
      try {
        const sanctionsRef = collection(db, 'sanctions');
        const q = query(
          sanctionsRef,
          where('userId', '==', userId)
        );
        const snapshot = await getDocs(q);
        const allSanctions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          expiresAt: doc.data().expiresAt?.toDate?.()?.toISOString() || null,
        }));
        // Filtrar por status activo y ordenar en memoria
        return allSanctions
          .filter(s => s.status === 'active')
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } catch (fallbackError) {
        console.error('Error getting user sanctions (fallback):', fallbackError);
        return [];
      }
    }
    console.error('Error getting user sanctions:', error);
    return [];
  }
};

/**
 * Obtiene todas las sanciones (SOLO ADMIN)
 * @param {string} status - Filtrar por estado (opcional)
 * @returns {Promise<Array>} Lista de sanciones
 */
export const getAllSanctions = async (status = null) => {
  try {
    const sanctionsRef = collection(db, 'sanctions');
    let q;

    if (status) {
      q = query(
        sanctionsRef,
        where('status', '==', status),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
    } else {
      q = query(
        sanctionsRef,
        orderBy('createdAt', 'desc'),
        limit(100)
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      expiresAt: doc.data().expiresAt?.toDate?.()?.toISOString() || null,
      revokedAt: doc.data().revokedAt?.toDate?.()?.toISOString() || null,
    }));
  } catch (error) {
    console.error('Error getting sanctions:', error);
    return [];
  }
};

/**
 * Revoca una sanción (SOLO ADMIN)
 * @param {string} sanctionId - ID de la sanción
 * @param {string} adminId - ID del admin que revoca
 * @param {string} reason - Razón de la revocación
 */
export const revokeSanction = async (sanctionId, adminId, reason = '') => {
  try {
    const sanctionRef = doc(db, 'sanctions', sanctionId);
    const sanctionSnap = await getDoc(sanctionRef);
    
    if (!sanctionSnap.exists()) {
      throw new Error('Sanción no encontrada');
    }

    const sanctionData = sanctionSnap.data();
    
    // Actualizar sanción
    await updateDoc(sanctionRef, {
      status: 'revoked',
      revokedAt: serverTimestamp(),
      revokedBy: adminId,
      revokeReason: reason,
    });

    // Si era un ban, actualizar estado del usuario
    if (sanctionData.type === SANCTION_TYPES.PERM_BAN || sanctionData.type === SANCTION_TYPES.TEMP_BAN) {
      await updateUserBanStatus(sanctionData.userId, false, null);
    }

    return true;
  } catch (error) {
    console.error('Error revoking sanction:', error);
    throw error;
  }
};

/**
 * Verifica si un usuario está baneado o tiene sanciones activas
 * @param {string} userId - ID del usuario
 * @returns {Promise<object>} Estado de sanciones
 */
export const checkUserSanctions = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return { isBanned: false, sanctions: [] };
    }

    const userData = userSnap.data();
    const activeSanctions = await getUserActiveSanctions(userId);

    // Verificar si hay bans expirados que deben actualizarse
    const now = new Date();
    for (const sanction of activeSanctions) {
      if (sanction.expiresAt && new Date(sanction.expiresAt) < now) {
        // La sanción expiró, actualizar estado
        const sanctionRef = doc(db, 'sanctions', sanction.id);
        await updateDoc(sanctionRef, {
          status: 'expired',
        });
        
        if (sanction.type === SANCTION_TYPES.TEMP_BAN) {
          await updateUserBanStatus(userId, false, null);
        }
      }
    }

    return {
      isBanned: userData.isBanned || false,
      banType: userData.banType || null,
      sanctions: activeSanctions.filter(s => {
        if (s.expiresAt) {
          return new Date(s.expiresAt) > now;
        }
        return true;
      }),
    };
  } catch (error) {
    console.error('Error checking user sanctions:', error);
    return { isBanned: false, sanctions: [] };
  }
};

/**
 * Suscripción en tiempo real a todas las sanciones (SOLO ADMIN)
 * @param {function} callback - Función callback que recibe las sanciones
 * @returns {function} Función para desuscribirse
 */
export const subscribeToSanctions = (callback) => {
  const sanctionsRef = collection(db, 'sanctions');
  const q = query(
    sanctionsRef,
    orderBy('createdAt', 'desc'),
    limit(100)
  );

  return onSnapshot(q, (snapshot) => {
    const sanctions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      expiresAt: doc.data().expiresAt?.toDate?.()?.toISOString() || null,
      revokedAt: doc.data().revokedAt?.toDate?.()?.toISOString() || null,
    }));
    callback(sanctions);
  }, (error) => {
    console.error('Error subscribing to sanctions:', error);
    callback([]);
  });
};

/**
 * Obtiene estadísticas de sanciones
 * @returns {Promise<object>} Estadísticas
 */
export const getSanctionStats = async () => {
  try {
    const sanctionsRef = collection(db, 'sanctions');
    const snapshot = await getDocs(query(sanctionsRef));
    
    const sanctions = snapshot.docs.map(doc => doc.data());
    
    return {
      total: sanctions.length,
      active: sanctions.filter(s => s.status === 'active').length,
      warnings: sanctions.filter(s => s.type === SANCTION_TYPES.WARNING).length,
      tempBans: sanctions.filter(s => s.type === SANCTION_TYPES.TEMP_BAN).length,
      permBans: sanctions.filter(s => s.type === SANCTION_TYPES.PERM_BAN).length,
      mutes: sanctions.filter(s => s.type === SANCTION_TYPES.MUTE).length,
      revoked: sanctions.filter(s => s.status === 'revoked').length,
    };
  } catch (error) {
    console.error('Error getting sanction stats:', error);
    return {
      total: 0,
      active: 0,
      warnings: 0,
      tempBans: 0,
      permBans: 0,
      mutes: 0,
      revoked: 0,
    };
  }
};

