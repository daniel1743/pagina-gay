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
  setDoc,
} from 'firebase/firestore';
import { db, auth } from '@/config/firebase';

/**
 * Servicio de Recompensas y Reconocimiento
 * Permite a admins premiar a usuarios destacados
 */

/**
 * Tipos de recompensas disponibles
 */
export const REWARD_TYPES = {
  PREMIUM_1_MONTH: 'premium_1_month',
  VERIFIED_1_MONTH: 'verified_1_month',
  SPECIAL_AVATAR: 'special_avatar_1_month',
  FEATURED_USER: 'featured_user', // Usuario destacado
  MODERATOR_1_MONTH: 'moderator_1_month',
  PRO_USER: 'pro_user', // Paquete PRO: 2da foto, tarjeta destacada, borde arcoíris, badge PRO
};

/**
 * Razones de recompensa
 */
export const REWARD_REASONS = {
  TOP_ACTIVE: 'top_active', // Usuario más activo
  TOP_MESSAGES: 'top_messages', // Más mensajes
  TOP_FORUM: 'top_forum', // Más participación en foro
  HELPFUL: 'helpful', // Usuario servicial
  COMMUNITY_BUILDER: 'community_builder', // Constructor de comunidad
  AMBASSADOR: 'ambassador', // Embajador
  PRO_RECOGNITION: 'pro_recognition', // Reconocimiento PRO por participación activa
  OTHER: 'other',
};

/**
 * Crea una recompensa para un usuario
 * @param {object} rewardData - Datos de la recompensa
 * @returns {Promise<string>} ID de la recompensa creada
 */
export const createReward = async (rewardData) => {
  if (!auth.currentUser) {
    throw new Error('Debes estar autenticado');
  }

  const rewardsRef = collection(db, 'rewards');

  // Calcular fecha de expiración (1 mes por defecto)
  const expirationDate = new Date();
  expirationDate.setMonth(expirationDate.getMonth() + 1);

  const reward = {
    userId: rewardData.userId,
    username: rewardData.username,
    type: rewardData.type, // premium_1_month, verified_1_month, etc.
    reason: rewardData.reason, // top_active, top_messages, etc.
    reasonDescription: rewardData.reasonDescription || '',
    duration: 30, // Días (1 mes)
    expiresAt: expirationDate,
    issuedBy: auth.currentUser.uid,
    issuedByUsername: rewardData.issuedByUsername || 'Admin',
    status: 'active', // active, expired, revoked
    createdAt: serverTimestamp(),
    revokedAt: null,
    revokedBy: null,
    notes: rewardData.notes || '',
    metrics: rewardData.metrics || {}, // Métricas del usuario al momento del premio
  };

  const docRef = await addDoc(rewardsRef, reward);

  // Aplicar la recompensa al perfil del usuario
  await applyRewardToUser(rewardData.userId, reward.type, expirationDate);

  return docRef.id;
};

/**
 * Aplica la recompensa al perfil del usuario
 * @param {string} userId - ID del usuario
 * @param {string} rewardType - Tipo de recompensa
 * @param {Date} expiresAt - Fecha de expiración
 */
export const applyRewardToUser = async (userId, rewardType, expiresAt) => {
  try {
    const userRef = doc(db, 'users', userId);
    const updates = {};

    switch (rewardType) {
      case REWARD_TYPES.PREMIUM_1_MONTH:
        updates.isPremium = true;
        updates.premiumUntil = expiresAt;
        updates.premiumType = 'reward';
        break;

      case REWARD_TYPES.VERIFIED_1_MONTH:
        updates.verified = true;
        updates.verifiedUntil = expiresAt;
        updates.verificationType = 'reward';
        break;

      case REWARD_TYPES.SPECIAL_AVATAR:
        updates.hasSpecialAvatar = true;
        updates.specialAvatarUntil = expiresAt;
        updates.specialAvatarType = 'reward';
        break;

      case REWARD_TYPES.FEATURED_USER:
        updates.isFeatured = true;
        updates.featuredUntil = expiresAt;
        break;

      case REWARD_TYPES.MODERATOR_1_MONTH:
        updates.isModerator = true;
        updates.moderatorUntil = expiresAt;
        break;

      case REWARD_TYPES.PRO_USER:
        updates.isProUser = true;
        updates.proUntil = expiresAt;
        updates.canUploadSecondPhoto = true;
        updates.hasFeaturedCard = true;
        updates.hasRainbowBorder = true;
        updates.hasProBadge = true;
        break;

      default:
        console.warn('Tipo de recompensa desconocido:', rewardType);
    }

    if (Object.keys(updates).length > 0) {
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      // Si es PRO, también actualizar la tarjeta del Baúl
      if (rewardType === REWARD_TYPES.PRO_USER) {
        try {
          const tarjetaRef = doc(db, 'tarjetas', userId);
          const tarjetaSnap = await getDoc(tarjetaRef);
          if (tarjetaSnap.exists()) {
            await updateDoc(tarjetaRef, {
              isProUser: true,
              proUntil: expiresAt,
              canUploadSecondPhoto: true,
              hasFeaturedCard: true,
              hasRainbowBorder: true,
              hasProBadge: true,
            });
          }
        } catch (tarjetaError) {
          console.warn('No se pudo actualizar tarjeta PRO:', tarjetaError);
        }
      }
    }
  } catch (error) {
    console.error('Error applying reward to user:', error);
  }
};

/**
 * Obtiene todas las recompensas activas de un usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<Array>} Lista de recompensas activas
 */
export const getUserActiveRewards = async (userId) => {
  try {
    const rewardsRef = collection(db, 'rewards');
    const q = query(
      rewardsRef,
      where('userId', '==', userId),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      expiresAt: doc.data().expiresAt?.toDate?.()?.toISOString() || null,
    }));
  } catch (error) {
    console.error('Error getting user rewards:', error);
    return [];
  }
};

/**
 * Obtiene todas las recompensas (SOLO ADMIN)
 * @param {string} status - Filtrar por estado (opcional)
 * @returns {Promise<Array>} Lista de recompensas
 */
export const getAllRewards = async (status = null) => {
  try {
    const rewardsRef = collection(db, 'rewards');
    let q;

    if (status) {
      q = query(
        rewardsRef,
        where('status', '==', status),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
    } else {
      q = query(
        rewardsRef,
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
    console.error('Error getting rewards:', error);
    return [];
  }
};

/**
 * Revoca una recompensa (SOLO ADMIN)
 * @param {string} rewardId - ID de la recompensa
 * @param {string} adminId - ID del admin que revoca
 * @param {string} reason - Razón de la revocación
 */
export const revokeReward = async (rewardId, adminId, reason = '') => {
  try {
    const rewardRef = doc(db, 'rewards', rewardId);
    const rewardSnap = await getDoc(rewardRef);

    if (!rewardSnap.exists()) {
      throw new Error('Recompensa no encontrada');
    }

    const rewardData = rewardSnap.data();

    // Actualizar recompensa
    await updateDoc(rewardRef, {
      status: 'revoked',
      revokedAt: serverTimestamp(),
      revokedBy: adminId,
      revokeReason: reason,
    });

    // Remover beneficio del usuario
    await removeRewardFromUser(rewardData.userId, rewardData.type);

    return true;
  } catch (error) {
    console.error('Error revoking reward:', error);
    throw error;
  }
};

/**
 * Remueve una recompensa del perfil del usuario
 * @param {string} userId - ID del usuario
 * @param {string} rewardType - Tipo de recompensa
 */
export const removeRewardFromUser = async (userId, rewardType) => {
  try {
    const userRef = doc(db, 'users', userId);
    const updates = {};

    switch (rewardType) {
      case REWARD_TYPES.PREMIUM_1_MONTH:
        updates.isPremium = false;
        updates.premiumUntil = null;
        updates.premiumType = null;
        break;

      case REWARD_TYPES.VERIFIED_1_MONTH:
        updates.verified = false;
        updates.verifiedUntil = null;
        updates.verificationType = null;
        break;

      case REWARD_TYPES.SPECIAL_AVATAR:
        updates.hasSpecialAvatar = false;
        updates.specialAvatarUntil = null;
        break;

      case REWARD_TYPES.FEATURED_USER:
        updates.isFeatured = false;
        updates.featuredUntil = null;
        break;

      case REWARD_TYPES.MODERATOR_1_MONTH:
        updates.isModerator = false;
        updates.moderatorUntil = null;
        break;

      case REWARD_TYPES.PRO_USER:
        updates.isProUser = false;
        updates.proUntil = null;
        updates.canUploadSecondPhoto = false;
        updates.hasFeaturedCard = false;
        updates.hasRainbowBorder = false;
        updates.hasProBadge = false;
        break;

      default:
        console.warn('Tipo de recompensa desconocido:', rewardType);
    }

    if (Object.keys(updates).length > 0) {
      await updateDoc(userRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      // Si es PRO, también limpiar la tarjeta del Baúl
      if (rewardType === REWARD_TYPES.PRO_USER) {
        try {
          const tarjetaRef = doc(db, 'tarjetas', userId);
          const tarjetaSnap = await getDoc(tarjetaRef);
          if (tarjetaSnap.exists()) {
            await updateDoc(tarjetaRef, {
              isProUser: false,
              proUntil: null,
              canUploadSecondPhoto: false,
              hasFeaturedCard: false,
              hasRainbowBorder: false,
              hasProBadge: false,
            });
          }
        } catch (tarjetaError) {
          console.warn('No se pudo limpiar tarjeta PRO:', tarjetaError);
        }
      }
    }
  } catch (error) {
    console.error('Error removing reward from user:', error);
  }
};

/**
 * Suscripción en tiempo real a todas las recompensas (SOLO ADMIN)
 * @param {function} callback - Función callback que recibe las recompensas
 * @returns {function} Función para desuscribirse
 */
export const subscribeToRewards = (callback) => {
  const rewardsRef = collection(db, 'rewards');
  const q = query(
    rewardsRef,
    orderBy('createdAt', 'desc'),
    limit(100)
  );

  return onSnapshot(q, (snapshot) => {
    const rewards = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      expiresAt: doc.data().expiresAt?.toDate?.()?.toISOString() || null,
      revokedAt: doc.data().revokedAt?.toDate?.()?.toISOString() || null,
    }));
    callback(rewards);
  }, (error) => {
    console.error('Error subscribing to rewards:', error);
    callback([]);
  });
};

/**
 * Obtiene estadísticas de recompensas
 * @returns {Promise<object>} Estadísticas
 */
export const getRewardStats = async () => {
  try {
    const rewardsRef = collection(db, 'rewards');
    const snapshot = await getDocs(query(rewardsRef));

    const rewards = snapshot.docs.map(doc => doc.data());

    return {
      total: rewards.length,
      active: rewards.filter(r => r.status === 'active').length,
      premium: rewards.filter(r => r.type === REWARD_TYPES.PREMIUM_1_MONTH).length,
      verified: rewards.filter(r => r.type === REWARD_TYPES.VERIFIED_1_MONTH).length,
      specialAvatar: rewards.filter(r => r.type === REWARD_TYPES.SPECIAL_AVATAR).length,
      featured: rewards.filter(r => r.type === REWARD_TYPES.FEATURED_USER).length,
      pro: rewards.filter(r => r.type === REWARD_TYPES.PRO_USER).length,
      revoked: rewards.filter(r => r.status === 'revoked').length,
    };
  } catch (error) {
    console.error('Error getting reward stats:', error);
    return {
      total: 0,
      active: 0,
      premium: 0,
      verified: 0,
      specialAvatar: 0,
      featured: 0,
      pro: 0,
      revoked: 0,
    };
  }
};

/**
 * Obtiene el TOP 20 de usuarios más activos (SOLO ADMIN)
 * Calcula basado en mensajes, tiempo activo, threads, y sin sanciones
 * @returns {Promise<Array>} Top 20 usuarios
 */
export const getTop20ActiveUsers = async () => {
  try {
    // Obtener todos los usuarios
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    const usersWithMetrics = [];

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;

      // Excluir usuarios anónimos, invitados, y administradores
      if (userData.isGuest || userData.isAnonymous || userData.role === 'admin') {
        continue;
      }

      // Verificar que no tenga sanciones activas
      const sanctionsRef = collection(db, 'sanctions');
      const sanctionsQuery = query(
        sanctionsRef,
        where('userId', '==', userId),
        where('status', '==', 'active')
      );
      const sanctionsSnapshot = await getDocs(sanctionsQuery);

      // Si tiene sanciones activas, excluir
      if (!sanctionsSnapshot.empty) {
        continue;
      }

      // Contar mensajes del usuario
      const messagesCount = await countUserMessages(userId);

      // Contar threads creados
      const threadsCount = await countUserThreads(userId);

      // Contar replies en foro
      const repliesCount = await countUserForumReplies(userId);

      // Calcular tiempo activo (si existe)
      const totalActiveTime = userData.totalActiveTime || 0;

      // Calcular score de actividad
      const activityScore = (
        messagesCount * 1 +
        threadsCount * 3 +
        repliesCount * 2 +
        (totalActiveTime / 3600) * 0.5 // Horas * 0.5
      );

      usersWithMetrics.push({
        id: userId,
        username: userData.username,
        avatar: userData.avatar,
        isPremium: userData.isPremium || false,
        verified: userData.verified || false,
        email: userData.email,
        createdAt: userData.createdAt?.toDate?.()?.toISOString() || null,
        metrics: {
          messagesCount,
          threadsCount,
          repliesCount,
          totalActiveTime: Math.floor(totalActiveTime / 60), // Minutos
          activityScore: Math.round(activityScore),
        },
      });
    }

    // Ordenar por score de actividad
    usersWithMetrics.sort((a, b) => b.metrics.activityScore - a.metrics.activityScore);

    // Retornar top 20
    return usersWithMetrics.slice(0, 20);
  } catch (error) {
    console.error('Error getting top 20 users:', error);
    return [];
  }
};

/**
 * Helper: Cuenta mensajes de un usuario
 */
const countUserMessages = async (userId) => {
  try {
    // Esto requeriría iterar por todas las salas, lo cual es costoso
    // Por ahora, retornamos 0 y se puede implementar con un campo en el perfil
    // que se incremente cada vez que el usuario envía un mensaje
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    return userSnap.data()?.messageCount || 0;
  } catch (error) {
    return 0;
  }
};

/**
 * Helper: Cuenta threads de un usuario
 */
const countUserThreads = async (userId) => {
  try {
    const threadsRef = collection(db, 'forum_threads');
    const q = query(threadsRef, where('authorId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    return 0;
  }
};

/**
 * Helper: Cuenta replies de un usuario
 */
const countUserForumReplies = async (userId) => {
  try {
    const repliesRef = collection(db, 'forum_replies');
    const q = query(repliesRef, where('authorId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    return 0;
  }
};
