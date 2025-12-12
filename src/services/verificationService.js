import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db, auth } from '@/config/firebase';

/**
 * Servicio de Verificación de Cuenta
 * Requisitos:
 * - 30 días consecutivos conectándose para verificar
 * - Máximo 3 días sin conexión para mantener verificación
 */

/**
 * Registra la conexión del usuario (debe llamarse cada vez que el usuario inicia sesión)
 * @param {string} userId - ID del usuario
 */
export const recordUserConnection = async (userId) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const connectionRef = doc(db, 'user_connections', userId);
    
    const connectionSnap = await getDoc(connectionRef);
    const connectionData = connectionSnap.exists() ? connectionSnap.data() : {
      userId,
      consecutiveDays: 0,
      lastConnectionDate: null,
      longestStreak: 0,
      totalDays: 0,
      verified: false,
      verifiedAt: null,
      createdAt: serverTimestamp(),
    };

    const lastConnection = connectionData.lastConnectionDate 
      ? new Date(connectionData.lastConnectionDate) 
      : null;
    
    const todayDate = new Date(today);
    const daysSinceLastConnection = lastConnection
      ? Math.floor((todayDate - lastConnection) / (1000 * 60 * 60 * 24))
      : null;

    let newConsecutiveDays = connectionData.consecutiveDays || 0;
    let shouldLoseVerification = false;

    // Si es el primer día o se conectó ayer (día consecutivo)
    if (!lastConnection || daysSinceLastConnection === 1) {
      newConsecutiveDays = (connectionData.consecutiveDays || 0) + 1;
    } 
    // Si pasó más de 1 día pero menos de 4 días (rompió racha pero no pierde verificación)
    else if (daysSinceLastConnection > 1 && daysSinceLastConnection < 4) {
      newConsecutiveDays = 1; // Reinicia contador
    }
    // Si pasó 4 o más días (pierde verificación si estaba verificado)
    else if (daysSinceLastConnection >= 4) {
      newConsecutiveDays = 1; // Reinicia contador
      if (connectionData.verified) {
        shouldLoseVerification = true;
      }
    }
    // Si se conecta el mismo día, no cambia nada
    else if (daysSinceLastConnection === 0) {
      newConsecutiveDays = connectionData.consecutiveDays || 0;
    }

    // Actualizar racha más larga
    const longestStreak = Math.max(
      connectionData.longestStreak || 0,
      newConsecutiveDays
    );

    // Actualizar total de días (solo si es un día nuevo)
    const totalDays = daysSinceLastConnection === 0 
      ? connectionData.totalDays || 0
      : (connectionData.totalDays || 0) + 1;

    // Actualizar datos de conexión
    const updateData = {
      userId,
      consecutiveDays: newConsecutiveDays,
      lastConnectionDate: today,
      longestStreak,
      totalDays,
      lastUpdated: serverTimestamp(),
    };

    // Si pierde verificación
    if (shouldLoseVerification) {
      updateData.verified = false;
      updateData.verifiedAt = null;
      updateData.verificationLostAt = serverTimestamp();
    }

    await setDoc(connectionRef, updateData, { merge: true });

    // Si cumple 30 días consecutivos y no está verificado, verificar automáticamente
    if (newConsecutiveDays >= 30 && !connectionData.verified && !shouldLoseVerification) {
      await verifyUser(userId);
      return {
        consecutiveDays: newConsecutiveDays,
        verified: true,
        lostVerification: false,
        canVerify: true,
        justVerified: true, // Indica que acaba de verificarse
      };
    }

    // Si está verificado, verificar que no haya pasado más de 3 días
    if (connectionData.verified && !shouldLoseVerification) {
      if (daysSinceLastConnection !== null && daysSinceLastConnection > 3) {
        await unverifyUser(userId);
        return {
          consecutiveDays: newConsecutiveDays,
          verified: false,
          lostVerification: true,
          canVerify: false,
        };
      }
    }

    return {
      consecutiveDays: newConsecutiveDays,
      verified: shouldLoseVerification ? false : connectionData.verified,
      lostVerification: shouldLoseVerification,
      canVerify: newConsecutiveDays >= 30,
    };
  } catch (error) {
    console.error('Error recording user connection:', error);
    return null;
  }
};

/**
 * Verifica a un usuario (se llama automáticamente cuando cumple 30 días)
 * @param {string} userId - ID del usuario
 */
export const verifyUser = async (userId) => {
  try {
    const connectionRef = doc(db, 'user_connections', userId);
    const userRef = doc(db, 'users', userId);

    // Actualizar en user_connections
    await updateDoc(connectionRef, {
      verified: true,
      verifiedAt: serverTimestamp(),
    });

    // Actualizar en users
    await updateDoc(userRef, {
      verified: true,
      verifiedAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error('Error verifying user:', error);
    return false;
  }
};

/**
 * Desverifica a un usuario (se llama cuando pasa más de 3 días sin conexión)
 * @param {string} userId - ID del usuario
 */
export const unverifyUser = async (userId) => {
  try {
    const connectionRef = doc(db, 'user_connections', userId);
    const userRef = doc(db, 'users', userId);

    // Actualizar en user_connections
    await updateDoc(connectionRef, {
      verified: false,
      verifiedAt: null,
      verificationLostAt: serverTimestamp(),
    });

    // Actualizar en users
    await updateDoc(userRef, {
      verified: false,
      verifiedAt: null,
    });

    return true;
  } catch (error) {
    console.error('Error unverifying user:', error);
    return false;
  }
};

/**
 * Obtiene el estado de verificación del usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<object>} Estado de verificación
 */
export const getUserVerificationStatus = async (userId) => {
  try {
    const connectionRef = doc(db, 'user_connections', userId);
    const connectionSnap = await getDoc(connectionRef);

    if (!connectionSnap.exists()) {
      return {
        verified: false,
        consecutiveDays: 0,
        daysUntilVerification: 30,
        canVerify: false,
        longestStreak: 0,
        totalDays: 0,
      };
    }

    const data = connectionSnap.data();
    const consecutiveDays = data.consecutiveDays || 0;
    const daysUntilVerification = Math.max(0, 30 - consecutiveDays);

    return {
      verified: data.verified || false,
      consecutiveDays,
      daysUntilVerification,
      canVerify: consecutiveDays >= 30,
      longestStreak: data.longestStreak || 0,
      totalDays: data.totalDays || 0,
      lastConnectionDate: data.lastConnectionDate,
      verifiedAt: data.verifiedAt,
    };
  } catch (error) {
    console.error('Error getting verification status:', error);
    return null;
  }
};

/**
 * Verifica si el usuario puede mantener su verificación
 * (no debe pasar más de 3 días sin conectarse)
 * @param {string} userId - ID del usuario
 * @returns {Promise<boolean>} true si puede mantener, false si pierde verificación
 */
export const checkVerificationMaintenance = async (userId) => {
  try {
    const connectionRef = doc(db, 'user_connections', userId);
    const connectionSnap = await getDoc(connectionRef);

    if (!connectionSnap.exists()) {
      return false;
    }

    const data = connectionSnap.data();
    
    if (!data.verified) {
      return false; // No está verificado, no hay nada que mantener
    }

    if (!data.lastConnectionDate) {
      return false; // No tiene fecha de última conexión
    }

    const lastConnection = new Date(data.lastConnectionDate);
    const today = new Date();
    const daysSinceLastConnection = Math.floor((today - lastConnection) / (1000 * 60 * 60 * 24));

    // Si pasó más de 3 días, pierde verificación
    if (daysSinceLastConnection > 3) {
      await unverifyUser(userId);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking verification maintenance:', error);
    return false;
  }
};

