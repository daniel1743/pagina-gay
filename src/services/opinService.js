/**
 * 🎯 OPIN Service - Discovery Wall Completo
 *
 * Features completas:
 * - Crear post con título y color
 * - Ver posts
 * - Sistema de likes
 * - Sistema de comentarios (100 max)
 * - Click en perfil
 * - Tracking completo
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  deleteDoc,
  updateDoc,
  increment,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db, auth } from '@/config/firebase';
import { track } from '@/services/eventTrackingService';
import { isBlockedBetween } from '@/services/blockService';

const assertCanInteractWithUser = async (targetUserId) => {
  if (!auth.currentUser || !targetUserId) return;
  const blocked = await isBlockedBetween(auth.currentUser.uid, targetUserId);
  if (blocked) {
    throw new Error('BLOCKED');
  }
};

// 🎨 Colores disponibles para posts OPIN
export const OPIN_COLORS = {
  purple: { name: 'Purple', gradient: 'from-purple-500 to-purple-700', bg: 'bg-purple-500/10', border: 'border-purple-500/50' },
  pink: { name: 'Pink', gradient: 'from-pink-500 to-pink-700', bg: 'bg-pink-500/10', border: 'border-pink-500/50' },
  cyan: { name: 'Cyan', gradient: 'from-cyan-500 to-cyan-700', bg: 'bg-cyan-500/10', border: 'border-cyan-500/50' },
  orange: { name: 'Orange', gradient: 'from-orange-500 to-orange-700', bg: 'bg-orange-500/10', border: 'border-orange-500/50' },
  green: { name: 'Green', gradient: 'from-green-500 to-green-700', bg: 'bg-green-500/10', border: 'border-green-500/50' },
  blue: { name: 'Blue', gradient: 'from-blue-500 to-blue-700', bg: 'bg-blue-500/10', border: 'border-blue-500/50' },
};

// 🔥 Reacciones eróticas/sugestivas para OPIN
export const OPIN_REACTIONS = [
  { emoji: '🔥', label: 'Fuego' },
  { emoji: '🍑', label: 'Peach' },
  { emoji: '🍆', label: 'Berenjena' },
  { emoji: '😈', label: 'Diablito' },
  { emoji: '💦', label: 'Gotas' },
  { emoji: '👅', label: 'Lengua' },
];

/**
 * ✅ Verificar si el usuario puede crear un post
 * Regla: Cooldown de 2 horas entre publicaciones (anti-spam)
 * Sin límite de cantidad - puedes publicar cuantos quieras respetando el cooldown
 */
export const canCreatePost = async () => {
  if (!auth.currentUser) {
    return { canCreate: false, reason: 'no_auth' };
  }

  // Usuarios invitados NO pueden publicar
  if (auth.currentUser.isAnonymous) {
    return { canCreate: false, reason: 'guest_user' };
  }

  const COOLDOWN_HOURS = 2;
  const now = new Date();
  const cooldownAgo = new Date(now.getTime() - COOLDOWN_HOURS * 60 * 60 * 1000);

  // Buscar el último post del usuario
  const postsRef = collection(db, 'opin_posts');

  try {
    const q = query(
      postsRef,
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // Nunca ha publicado, puede crear
      return { canCreate: true, message: 'Primera nota' };
    }

    const lastPost = snapshot.docs[0].data();
    const lastCreatedAt = lastPost.createdAt?.toDate ? lastPost.createdAt.toDate() : new Date(lastPost.createdAt);

    // Verificar si pasó el cooldown
    if (lastCreatedAt > cooldownAgo) {
      const remainingMs = lastCreatedAt.getTime() + (COOLDOWN_HOURS * 60 * 60 * 1000) - now.getTime();
      const remainingMins = Math.ceil(remainingMs / 60000);
      const remainingHours = Math.floor(remainingMins / 60);
      const mins = remainingMins % 60;

      const timeStr = remainingHours > 0 ? `${remainingHours}h ${mins}m` : `${remainingMins}m`;

      console.log(`[OPIN] Cooldown activo: esperar ${timeStr}`);

      return {
        canCreate: false,
        reason: 'cooldown',
        remainingMinutes: remainingMins,
        message: `Espera ${timeStr} para publicar otra nota`
      };
    }

    // Cooldown pasado, puede crear
    return { canCreate: true };

  } catch (indexError) {
    // Si hay error de índice, intentar query más simple
    console.warn('[OPIN] Index no disponible para canCreatePost, usando query simple:', indexError.message);

    const qSimple = query(
      postsRef,
      where('userId', '==', auth.currentUser.uid),
      limit(5)
    );

    const snapshot = await getDocs(qSimple);

    if (snapshot.empty) {
      return { canCreate: true, message: 'Primera nota' };
    }

    // Encontrar el más reciente manualmente
    let lastCreatedAt = null;
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.createdAt) {
        const created = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
        if (!lastCreatedAt || created > lastCreatedAt) {
          lastCreatedAt = created;
        }
      }
    });

    if (lastCreatedAt && lastCreatedAt > cooldownAgo) {
      const remainingMs = lastCreatedAt.getTime() + (COOLDOWN_HOURS * 60 * 60 * 1000) - now.getTime();
      const remainingMins = Math.ceil(remainingMs / 60000);
      const remainingHours = Math.floor(remainingMins / 60);
      const mins = remainingMins % 60;

      const timeStr = remainingHours > 0 ? `${remainingHours}h ${mins}m` : `${remainingMins}m`;

      return {
        canCreate: false,
        reason: 'cooldown',
        remainingMinutes: remainingMins,
        message: `Espera ${timeStr} para publicar otra nota`
      };
    }

    return { canCreate: true };
  }
};

/**
 * ✅ Crear un nuevo post de OPIN
 */
export const createOpinPost = async ({ title = '', text, color = 'purple', userProfile }) => {
  if (!auth.currentUser) {
    throw new Error('Usuario no autenticado');
  }

  if (auth.currentUser.isAnonymous) {
    throw new Error('Los invitados no pueden publicar en OPIN');
  }

  // Validar texto
  if (!text || text.trim().length < 10) {
    throw new Error('El texto debe tener al menos 10 caracteres');
  }

  if (text.length > 500) {
    throw new Error('El texto no puede superar 500 caracteres');
  }

  // Validar color
  if (!OPIN_COLORS[color]) {
    color = 'purple'; // Default
  }

  // Verificar cooldown (2 horas entre publicaciones)
  const canCreate = await canCreatePost();
  if (!canCreate.canCreate) {
    throw new Error(canCreate.message || 'Espera un poco antes de publicar otra nota');
  }

  const now = Timestamp.now();
  const expiresAt = new Timestamp(now.seconds + (60 * 24 * 60 * 60), now.nanoseconds); // +60 días (2 meses)

  const postData = {
    userId: auth.currentUser.uid,
    username: userProfile.username || 'Anónimo',
    avatar: userProfile.avatar || '',
    profileId: auth.currentUser.uid,
    title: '',
    text: text.trim(),
    color: color,
    createdAt: serverTimestamp(),
    expiresAt: expiresAt,
    isActive: true,
    isStable: false, // Posts de usuarios: 60 días. Los estables (admin) tienen isStable: true y no expiran.
    viewCount: 0,
    profileClickCount: 0,
    likeCount: 0,
    likedBy: [],
    commentCount: 0,
  };

  const postsRef = collection(db, 'opin_posts');
  const docRef = await addDoc(postsRef, postData);

  console.log('✅ [OPIN] Post creado:', docRef.id);

  return { postId: docRef.id, ...postData };
};

/** Mínimo de OPINs estables que siempre debe haber en el feed (panel admin) */
export const OPIN_MIN_STABLE = 20;

/**
 * ✅ Obtener feed de posts activos
 * - Mínimo 20 OPINs estables (isStable, sin 24h). Si hay menos, se muestran los que haya.
 * - Luego OPINs de usuarios (24h). Si hay muchos, aplica la regla de 24h.
 * - IMPORTANTE: Si hay menos de 20 OPINs en total, NO se aplica la expiración de 24h
 *   para evitar mostrar un panel vacío.
 * Query sin índice extra: orderBy createdAt, filtrado en cliente.
 */
export const getOpinFeed = async (limitCount = 50) => {
  const postsRef = collection(db, 'opin_posts');
  const now = Timestamp.now();
  const nowMs = now.toMillis();

  const q = query(
    postsRef,
    orderBy('createdAt', 'desc'),
    limit(200)
  );

  const snapshot = await getDocs(q);

  const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

  // Estables: isStable === true, isActive, no expiran
  const stables = all.filter((p) => {
    if (!p.isActive) return false;
    if (p.isStable !== true) return false;
    return true;
  });

  // Todos los posts normales activos (sin aplicar 24h todavía)
  const normalsAll = all.filter((p) => {
    if (!p.isActive) return false;
    if (p.isStable === true) return false;
    return true;
  });

  // Filtrar posts con más de 60 días de antigüedad (basado en createdAt, no expiresAt)
  // Esto permite que posts antiguos con expiresAt de 24h (versión anterior) sigan visibles
  const EXPIRACION_MS = 60 * 24 * 60 * 60 * 1000; // 60 días en ms
  const vigentes = normalsAll.filter((p) => {
    const createdMs = p.createdAt?.toMillis ? p.createdAt.toMillis() : nowMs;
    return (nowMs - createdMs) < EXPIRACION_MS;
  });

  // Usar todos los vigentes (dentro de 60 días)
  let normals = vigentes;

  // Asignar peso BASE a cada post (más compacto para permitir variación)
  const getPostWeight = (post) => {
    if (!post.isStable) {
      // Post real: peso basado en antigüedad (escala reducida)
      const createdMs = post.createdAt?.toMillis ? post.createdAt.toMillis() : nowMs;
      const ageHours = (nowMs - createdMs) / (1000 * 60 * 60);
      if (ageHours < 3) return 60;   // Muy reciente
      if (ageHours < 8) return 50;   // Reciente
      if (ageHours < 16) return 40;  // Medio
      return 30;                      // Viejo
    }
    // Post estable: peso basado en likes + reacciones
    const likes = post.likeCount || 0;
    const totalReactions = Object.values(post.reactionCounts || {}).reduce((sum, c) => sum + (c || 0), 0);
    const engagement = likes + totalReactions;
    if (engagement > 10) return 45;
    if (engagement > 5) return 35;
    if (engagement >= 1) return 25;
    return 15;
  };

  // Combinar todos los posts activos
  const allActive = [...normals, ...stables];

  // Shuffle ponderado: peso + factor aleatorio moderado para variación sin ocultar posts
  const weighted = allActive.map(post => ({
    post,
    score: getPostWeight(post) + Math.random() * 15,
  }));
  weighted.sort((a, b) => b.score - a.score);

  let posts = weighted.map(w => w.post);

  // Garantizar: al menos 3 posts reales en top 10 (si existen)
  const realesEnTop10 = posts.slice(0, 10).filter(p => !p.isStable).length;
  const realesDisponibles = posts.filter(p => !p.isStable);
  if (realesEnTop10 < 3 && realesDisponibles.length >= 3) {
    const top10 = posts.slice(0, 10);
    const resto = posts.slice(10);
    const realesFuera = resto.filter(p => !p.isStable);
    const necesarios = 3 - realesEnTop10;
    const realesASubir = realesFuera.slice(0, necesarios);
    // Insertar posts reales en posiciones aleatorias del top 10
    for (const real of realesASubir) {
      const idx = Math.floor(Math.random() * 10);
      top10.splice(idx, 0, real);
    }
    // Quitar los movidos del resto
    const idsMovidos = new Set(realesASubir.map(r => r.id));
    const restoFiltrado = resto.filter(p => !idsMovidos.has(p.id));
    posts = [...top10, ...restoFiltrado];
  }

  posts = posts.slice(0, limitCount);

  console.log(`📥 [OPIN] Feed ponderado: ${normals.length} reales, ${stables.length} estables, ${posts.length} total`);

  return posts;
};

/**
 * ✅ Incrementar contador de vistas
 */
export const incrementViewCount = async (postId) => {
  const postRef = doc(db, 'opin_posts', postId);

  try {
    await updateDoc(postRef, {
      viewCount: increment(1),
    });
  } catch (error) {
    console.error('Error incrementando viewCount:', error);
  }
};

/**
 * ✅ Incrementar contador de clicks a perfil
 */
export const incrementProfileClickCount = async (postId) => {
  const postRef = doc(db, 'opin_posts', postId);

  try {
    await updateDoc(postRef, {
      profileClickCount: increment(1),
    });
    console.log('📊 [OPIN] Profile click registrado:', postId);
  } catch (error) {
    console.error('Error incrementando profileClickCount:', error);
  }
};

/**
 * ✅ Verificar límite de acciones (editar/eliminar) en 24h
 * Máximo 4 acciones por día
 */
export const checkActionLimit = async () => {
  if (!auth.currentUser) {
    return { canAct: false, remaining: 0, reason: 'no_auth' };
  }

  const userId = auth.currentUser.uid;
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Buscar acciones del usuario en las últimas 24h
  const actionsRef = collection(db, 'opin_actions');
  const q = query(
    actionsRef,
    where('userId', '==', userId),
    where('timestamp', '>=', Timestamp.fromDate(last24h)),
    orderBy('timestamp', 'desc'),
    limit(10)
  );

  try {
    const snapshot = await getDocs(q);
    const actionCount = snapshot.size;
    const remaining = Math.max(0, 4 - actionCount);

    return {
      canAct: actionCount < 4,
      remaining,
      actionCount,
      reason: actionCount >= 4 ? 'limit_reached' : null
    };
  } catch (error) {
    // Si hay error (ej: índice faltante), permitir la acción
    console.warn('[OPIN] Error verificando límite, permitiendo acción:', error);
    return { canAct: true, remaining: 4, actionCount: 0 };
  }
};

/**
 * ✅ Registrar una acción (editar/eliminar)
 */
const logAction = async (actionType, postId) => {
  if (!auth.currentUser) return;

  try {
    const actionsRef = collection(db, 'opin_actions');
    await addDoc(actionsRef, {
      userId: auth.currentUser.uid,
      actionType, // 'edit' o 'delete'
      postId,
      timestamp: serverTimestamp(),
    });
    console.log(`📝 [OPIN] Acción registrada: ${actionType}`);
  } catch (error) {
    console.error('[OPIN] Error registrando acción:', error);
  }
};

/**
 * ✅ Editar post del usuario
 */
export const editOpinPost = async (postId, { title, text, color }) => {
  if (!auth.currentUser) {
    throw new Error('Usuario no autenticado');
  }

  // Verificar límite de acciones
  const limitCheck = await checkActionLimit();
  if (!limitCheck.canAct) {
    throw new Error(`Has alcanzado el límite de 4 ediciones/eliminaciones en 24h. Espera un poco.`);
  }

  const postRef = doc(db, 'opin_posts', postId);
  const postDoc = await getDoc(postRef);

  if (!postDoc.exists()) {
    throw new Error('Post no encontrado');
  }

  const postData = postDoc.data();

  // Solo el autor puede editar
  if (postData.userId !== auth.currentUser.uid) {
    throw new Error('No tienes permiso para editar este post');
  }

  // Validar texto
  if (text && (text.trim().length < 10 || text.length > 500)) {
    throw new Error('El texto debe tener entre 10 y 500 caracteres');
  }

  // Validar título
  if (title && title.length > 50) {
    throw new Error('El título no puede superar 50 caracteres');
  }

  // Actualizar
  const updateData = {
    ...(title !== undefined && { title: title.trim() }),
    ...(text && { text: text.trim() }),
    ...(color && OPIN_COLORS[color] && { color }),
    editedAt: serverTimestamp(),
  };

  await updateDoc(postRef, updateData);

  // Registrar acción
  await logAction('edit', postId);

  console.log('✏️ [OPIN] Post editado:', postId);
  return { success: true, remaining: limitCheck.remaining - 1 };
};

/**
 * ✅ Eliminar post del usuario
 */
export const deleteOpinPost = async (postId) => {
  if (!auth.currentUser) {
    throw new Error('Usuario no autenticado');
  }

  // Verificar límite de acciones
  const limitCheck = await checkActionLimit();
  if (!limitCheck.canAct) {
    throw new Error(`Has alcanzado el límite de 4 ediciones/eliminaciones en 24h. Espera un poco.`);
  }

  const postRef = doc(db, 'opin_posts', postId);
  const postDoc = await getDoc(postRef);

  if (!postDoc.exists()) {
    throw new Error('Post no encontrado');
  }

  const postData = postDoc.data();

  // Solo el autor puede eliminar
  if (postData.userId !== auth.currentUser.uid) {
    throw new Error('No tienes permiso para eliminar este post');
  }

  await deleteDoc(postRef);

  // Registrar acción
  await logAction('delete', postId);

  console.log('🗑️ [OPIN] Post eliminado:', postId);
  return { success: true, remaining: limitCheck.remaining - 1 };
};

/**
 * ✅ Obtener posts del usuario actual
 */
export const getMyOpinPosts = async () => {
  if (!auth.currentUser) {
    return [];
  }

  const postsRef = collection(db, 'opin_posts');
  const q = query(
    postsRef,
    where('userId', '==', auth.currentUser.uid),
    orderBy('createdAt', 'desc'),
    limit(10)
  );

  const snapshot = await getDocs(q);

  const posts = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  return posts;
};

/**
 * ✅ Obtener tiempo restante hasta expiración (uso interno)
 * Nota: En la UI ya no mostramos "Expirado", solo tiempo transcurrido
 */
export const getTimeRemaining = (expiresAt) => {
  if (!expiresAt) return '24h';

  const now = Date.now();
  const expiryTime = expiresAt.toMillis ? expiresAt.toMillis() : expiresAt;
  const diffMs = expiryTime - now;

  // Si expiró, retornar null para que la UI decida qué mostrar
  if (diffMs <= 0) return null;

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
};

/**
 * ✅ Formatear tiempo transcurrido desde creación (para UI)
 */
export const getTimeSinceCreated = (createdAt) => {
  if (!createdAt) return 'reciente';

  const created = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
  const now = new Date();
  const diffMs = now - created;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'ahora';
  if (diffMins < 60) return `hace ${diffMins}m`;
  if (diffHours < 24) return `hace ${diffHours}h`;
  if (diffDays < 7) return `hace ${diffDays}d`;
  if (diffDays < 30) return `hace ${Math.floor(diffDays / 7)}sem`;
  return `hace ${Math.floor(diffDays / 30)}mes`;
};

// ============================================================
// 💜 SISTEMA DE LIKES
// ============================================================

/**
 * ✅ Toggle like en un post (like/unlike)
 */
export const toggleLike = async (postId) => {
  if (!auth.currentUser) {
    throw new Error('Usuario no autenticado');
  }

  if (auth.currentUser.isAnonymous) {
    throw new Error('Los invitados no pueden dar like');
  }

  const postRef = doc(db, 'opin_posts', postId);
  const postDoc = await getDoc(postRef);

  if (!postDoc.exists()) {
    throw new Error('Post no encontrado');
  }

  const postData = postDoc.data();
  await assertCanInteractWithUser(postData.userId);
  const likedBy = postData.likedBy || [];
  const userLiked = likedBy.includes(auth.currentUser.uid);

  if (userLiked) {
    // Unlike
    await updateDoc(postRef, {
      likeCount: increment(-1),
      likedBy: arrayRemove(auth.currentUser.uid),
    });
    console.log('💔 [OPIN] Like removido:', postId);
    return { liked: false };
  } else {
    // Like
    await updateDoc(postRef, {
      likeCount: increment(1),
      likedBy: arrayUnion(auth.currentUser.uid),
    });
    track('opin_like', { post_id: postId, author_id: postData.userId }, { user: { id: auth.currentUser.uid } }).catch(() => {});
    console.log('❤️ [OPIN] Like agregado:', postId);
    return { liked: true };
  }
};

/**
 * ✅ Verificar si el usuario actual dio like a un post
 */
export const hasUserLiked = (post) => {
  if (!auth.currentUser) return false;
  const likedBy = post.likedBy || [];
  return likedBy.includes(auth.currentUser.uid);
};

// ============================================================
// 🔥 SISTEMA DE REACCIONES (Emojis sugestivos)
// ============================================================

/**
 * ✅ Toggle reacción en un post
 * Si ya tiene esa reacción, la quita. Si no, la agrega.
 * Un usuario puede tener múltiples reacciones diferentes en el mismo post.
 */
export const toggleReaction = async (postId, emoji) => {
  if (!auth.currentUser) {
    throw new Error('Usuario no autenticado');
  }

  if (auth.currentUser.isAnonymous) {
    throw new Error('Los invitados no pueden reaccionar');
  }

  // Validar que el emoji sea válido
  const validEmojis = OPIN_REACTIONS.map(r => r.emoji);
  if (!validEmojis.includes(emoji)) {
    throw new Error('Reacción no válida');
  }

  const postRef = doc(db, 'opin_posts', postId);
  const postDoc = await getDoc(postRef);

  if (!postDoc.exists()) {
    throw new Error('Post no encontrado');
  }

  const postData = postDoc.data();
  await assertCanInteractWithUser(postData.userId);
  const reactions = postData.reactions || {};
  const reactionCounts = postData.reactionCounts || {};
  const userId = auth.currentUser.uid;

  // Verificar si el usuario ya tiene esta reacción
  const usersWithReaction = reactions[emoji] || [];
  const hasReaction = usersWithReaction.includes(userId);

  if (hasReaction) {
    // Quitar reacción
    await updateDoc(postRef, {
      [`reactions.${emoji}`]: arrayRemove(userId),
      [`reactionCounts.${emoji}`]: increment(-1),
    });
    console.log(`😐 [OPIN] Reacción ${emoji} removida:`, postId);
    return { reacted: false, emoji };
  } else {
    // Agregar reacción
    await updateDoc(postRef, {
      [`reactions.${emoji}`]: arrayUnion(userId),
      [`reactionCounts.${emoji}`]: increment(1),
    });
    track('opin_reaction', { post_id: postId, author_id: postData.userId, emoji }, { user: { id: userId } }).catch(() => {});
    console.log(`${emoji} [OPIN] Reacción agregada:`, postId);
    return { reacted: true, emoji };
  }
};

/**
 * ✅ Obtener reacciones del usuario actual en un post
 * Retorna array de emojis que el usuario ha usado
 */
export const getUserReactions = (post) => {
  if (!auth.currentUser) return [];
  const reactions = post.reactions || {};
  const userId = auth.currentUser.uid;

  const userReactions = [];
  for (const emoji of Object.keys(reactions)) {
    if (reactions[emoji]?.includes(userId)) {
      userReactions.push(emoji);
    }
  }
  return userReactions;
};

/**
 * ✅ Verificar si el usuario tiene una reacción específica
 */
export const hasUserReacted = (post, emoji) => {
  if (!auth.currentUser) return false;
  const reactions = post.reactions || {};
  const usersWithReaction = reactions[emoji] || [];
  return usersWithReaction.includes(auth.currentUser.uid);
};

/**
 * ✅ Obtener conteo total de reacciones de un post
 */
export const getTotalReactionCount = (post) => {
  const reactionCounts = post.reactionCounts || {};
  return Object.values(reactionCounts).reduce((sum, count) => sum + (count || 0), 0);
};

// ============================================================
// 💬 SISTEMA DE COMENTARIOS
// ============================================================

/**
 * ✅ Agregar comentario a un post
 */
export const addComment = async (postId, commentText) => {
  if (!auth.currentUser) {
    throw new Error('Usuario no autenticado');
  }

  if (auth.currentUser.isAnonymous) {
    throw new Error('Los invitados no pueden comentar');
  }

  if (!commentText || commentText.trim().length < 1) {
    throw new Error('El comentario no puede estar vacío');
  }

  if (commentText.length > 150) {
    throw new Error('El comentario no puede superar 150 caracteres');
  }

  const commentsRef = collection(db, 'opin_comments');

  const postDoc = await getDoc(doc(db, 'opin_posts', postId));
  if (postDoc.exists()) {
    await assertCanInteractWithUser(postDoc.data().userId);
  }

  // Verificar límite de 100 comentarios (sin requerir índice)
  try {
    const qCount = query(
      commentsRef,
      where('postId', '==', postId),
      limit(101)
    );
    const countSnapshot = await getDocs(qCount);

    if (countSnapshot.size >= 100) {
      throw new Error('Este post ya alcanzó el límite de 100 comentarios');
    }
  } catch (countError) {
    // Si falla el conteo, continuar de todos modos (mejor UX)
    console.warn('[OPIN] No se pudo verificar límite de comentarios:', countError.message);
  }

  // Obtener datos del usuario
  const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
  const userData = userDoc.exists() ? userDoc.data() : {};

  const commentData = {
    postId: postId,
    userId: auth.currentUser.uid,
    username: userData.username || 'Usuario',
    avatar: userData.avatar || '',
    comment: commentText.trim(),
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(commentsRef, commentData);

  // Incrementar contador de comentarios en el post
  const postRef = doc(db, 'opin_posts', postId);
  await updateDoc(postRef, {
    commentCount: increment(1),
  });

  track('opin_comment', { post_id: postId, author_id: postDoc.data()?.userId }, { user: { id: auth.currentUser.uid } }).catch(() => {});
  console.log('💬 [OPIN] Comentario agregado:', docRef.id);

  return { id: docRef.id, commentId: docRef.id, ...commentData };
};

/**
 * ✅ Obtener comentarios de un post
 */
export const getPostComments = async (postId, limitCount = 100) => {
  const commentsRef = collection(db, 'opin_comments');

  let snapshot;
  try {
    // Intentar con orderBy (requiere índice)
    const q = query(
      commentsRef,
      where('postId', '==', postId),
      orderBy('createdAt', 'asc'),
      limit(limitCount)
    );
    snapshot = await getDocs(q);
  } catch (indexError) {
    console.warn('[OPIN] Index no disponible para comentarios, usando query simple:', indexError.message);
    // Fallback sin orderBy (no requiere índice)
    const qSimple = query(
      commentsRef,
      where('postId', '==', postId),
      limit(limitCount)
    );
    snapshot = await getDocs(qSimple);
  }

  const comments = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  console.log(`💬 [OPIN] Comentarios cargados: ${comments.length} para post ${postId}`);

  return comments;
};

// ============================================================
// 🛡️ ADMIN – OPIN ESTABLES (mínimo 20, sin 24h)
// Solo desde panel admin. Firestore rules restringen isStable a admin.
// ============================================================

/**
 * ✅ Listar OPINs estables (para panel admin)
 */
export const getStableOpinPosts = async () => {
  const postsRef = collection(db, 'opin_posts');
  const q = query(
    postsRef,
    orderBy('createdAt', 'desc'),
    limit(200)
  );
  const snapshot = await getDocs(q);
  const all = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  const stables = all.filter((p) => p.isStable === true && p.isActive !== false);
  return stables;
};

/**
 * ✅ Crear OPIN estable (solo admin)
 * No expira. Se muestra siempre en feed hasta OPIN_MIN_STABLE.
 *
 * @param {object} params
 * @param {string} params.title - Título opcional
 * @param {string} params.text - Texto del OPIN (requerido)
 * @param {string} params.color - Color del OPIN
 * @param {string} params.customUsername - Username personalizado para seeding (opcional)
 * @param {string} params.customAvatar - Avatar personalizado para seeding (opcional)
 */
export const createStableOpinPost = async ({ title = '', text, color = 'purple', customUsername = '', customAvatar = '' }) => {
  if (!auth.currentUser) {
    throw new Error('Usuario no autenticado');
  }

  if (!text || text.trim().length < 10) {
    throw new Error('El texto debe tener al menos 10 caracteres');
  }
  if (text.length > 500) {
    throw new Error('El texto no puede superar 500 caracteres');
  }
  if (title && title.length > 50) {
    throw new Error('El título no puede superar 50 caracteres');
  }
  const c = OPIN_COLORS[color] ? color : 'purple';

  // Si se proporciona customUsername, usar ese (para seeding desde admin)
  // Si no, usar el username del usuario actual
  let username = customUsername?.trim() || '';
  let avatar = customAvatar?.trim() || '';

  if (!username) {
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        const d = userDoc.data();
        username = d.username || 'Chactivo';
        avatar = avatar || d.avatar || '';
      } else {
        username = 'Chactivo';
      }
    } catch (_) {
      username = 'Chactivo';
    }
  }

  const postsRef = collection(db, 'opin_posts');
  const data = {
    userId: auth.currentUser.uid,
    username,
    avatar,
    profileId: auth.currentUser.uid,
    title: title.trim(),
    text: text.trim(),
    color: c,
    createdAt: serverTimestamp(),
    isActive: true,
    isStable: true,
    isSeeded: !!customUsername, // Marcar si fue creado con username personalizado
    viewCount: 0,
    profileClickCount: 0,
    likeCount: 0,
    likedBy: [],
    commentCount: 0,
  };

  const docRef = await addDoc(postsRef, data);
  console.log('✅ [OPIN] Estable creado:', docRef.id, customUsername ? `(seeded: ${username})` : '');
  return { postId: docRef.id, ...data };
};

/**
 * ✅ Actualizar OPIN estable (solo admin)
 */
export const updateStableOpinPost = async (postId, { title, text, color }) => {
  if (!auth.currentUser) {
    throw new Error('Usuario no autenticado');
  }

  const postRef = doc(db, 'opin_posts', postId);
  const postDoc = await getDoc(postRef);
  if (!postDoc.exists()) {
    throw new Error('Post no encontrado');
  }
  const data = postDoc.data();
  if (data.isStable !== true) {
    throw new Error('Solo se pueden editar OPINs estables desde el panel');
  }

  if (text != null && (text.trim().length < 10 || text.length > 500)) {
    throw new Error('El texto debe tener entre 10 y 500 caracteres');
  }
  if (title != null && title.length > 50) {
    throw new Error('El título no puede superar 50 caracteres');
  }

  const updates = {
    editedAt: serverTimestamp(),
    ...(title !== undefined && { title: title.trim() }),
    ...(text !== undefined && { text: text.trim() }),
    ...(color !== undefined && OPIN_COLORS[color] && { color }),
  };

  await updateDoc(postRef, updates);
  console.log('✏️ [OPIN] Estable actualizado:', postId);
  return { success: true };
};

/**
 * ✅ Eliminar OPIN estable (solo admin)
 */
export const deleteStableOpinPost = async (postId) => {
  if (!auth.currentUser) {
    throw new Error('Usuario no autenticado');
  }

  const postRef = doc(db, 'opin_posts', postId);
  const postDoc = await getDoc(postRef);
  if (!postDoc.exists()) {
    throw new Error('Post no encontrado');
  }
  const data = postDoc.data();
  if (data.isStable !== true) {
    throw new Error('Solo se pueden eliminar OPINs estables desde el panel');
  }

  await deleteDoc(postRef);
  console.log('🗑️ [OPIN] Estable eliminado:', postId);
  return { success: true };
};

// Nombres genéricos para seeding automático
const OPIN_SEED_USERNAMES = [
  'Carlos_28', 'JuanMadrid', 'Alex_BCN', 'DavidGym', 'MiguelVLC',
  'Pablo_Fit', 'Sergio23', 'Andres_M', 'Dani_SEV', 'Ruben_BIO',
  'JorgeNight', 'Mario_Tech', 'Adrian_Art', 'Hugo_Run', 'Iker_MAD',
  'Leo_Gaming', 'Nacho_Cook', 'Raul_Photo', 'Alvaro_29', 'Oscar_BCN'
];

const OPIN_SEED_EXAMPLES = [
  { title: 'Amigos', text: 'Busco amistad para charlar, salir y pasarlo bien. Sin dramas, buena onda.', color: 'purple' },
  { title: 'Citas', text: 'Busco conocer a alguien con quien conectar. Citas tranquilas, café o algo más.', color: 'pink' },
  { title: 'Gaming', text: 'Busco gente para jugar en PC o consola. Coop, competitivo o solo pasar el rato.', color: 'cyan' },
  { title: 'Salir', text: 'Busco plan para salir: bares, fiestas, conciertos. Siempre abierto a sugerencias.', color: 'orange' },
  { title: 'Deportes', text: 'Busco alguien para gym, running o deporte en general. Motivación mutua.', color: 'green' },
  { title: 'Cine y series', text: 'Busco con quien hablar de pelis y series. Recomendaciones y maratones.', color: 'blue' },
  { title: 'Música', text: 'Busco gente con gustos parecidos para hablar de música, ir a conciertos o tocar.', color: 'purple' },
  { title: 'Viajes', text: 'Busco compañía para viajes o planes de escapada. Rutas, playa o ciudad.', color: 'pink' },
  { title: 'Café y charla', text: 'Busco charlar tranquilo, café o té. Conversación sin presión.', color: 'orange' },
  { title: 'Netflix & chill', text: 'Busco plan relajado en casa. Series, películas y buena compañía.', color: 'cyan' },
  { title: 'Fitness', text: 'Busco motivación para entrenar. Gym, yoga o lo que sea, juntos mejor.', color: 'green' },
  { title: 'Noche out', text: 'Busco salir de fiesta. Bares, discos o lo que se arme. Buena vibra.', color: 'blue' },
  { title: 'Cocina', text: 'Busco alguien para cocinar juntos o probar restaurantes. Amante de la comida.', color: 'purple' },
  { title: 'Fotografía', text: 'Busco salir a hacer fotos o hablar de fotografía. Urban, retratos, paisaje.', color: 'pink' },
  { title: 'Libros', text: 'Busco intercambiar recomendaciones de libros y hablar de lo que leemos.', color: 'cyan' },
  { title: 'Mascotas', text: 'Busco gente que ame los animales. Paseos con perros, fotos de gatos, etc.', color: 'orange' },
  { title: 'Tecnología', text: 'Busco hablar de tech, apps, juegos o proyectos. Geek friendly.', color: 'green' },
  { title: 'Arte y cultura', text: 'Busco ir a expos, museos o eventos culturales. Compartir gustos.', color: 'blue' },
  { title: 'Senderismo', text: 'Busco compañía para rutas y naturaleza. Caminatas, miradores, aire libre.', color: 'purple' },
  { title: 'Vida tranquila', text: 'Busco conexión real, sin prisa. Charlas, risas y buenos momentos.', color: 'pink' },
];

/**
 * ✅ Crear OPINs estables de ejemplo hasta completar OPIN_MIN_STABLE (solo admin)
 * Cada OPIN se crea con un username genérico diferente para simular actividad real.
 * @returns {Promise<number>} Número de posts creados
 */
export const seedStableOpinExamples = async () => {
  if (!auth.currentUser) {
    throw new Error('Usuario no autenticado');
  }

  const current = await getStableOpinPosts();
  const need = Math.max(0, OPIN_MIN_STABLE - current.length);
  if (need === 0) {
    return 0;
  }

  let created = 0;
  for (let i = 0; i < need && i < OPIN_SEED_EXAMPLES.length; i++) {
    const ex = OPIN_SEED_EXAMPLES[i];
    // Usar un username genérico diferente para cada OPIN
    const customUsername = OPIN_SEED_USERNAMES[i % OPIN_SEED_USERNAMES.length];

    await createStableOpinPost({
      title: ex.title,
      text: ex.text,
      color: ex.color,
      customUsername, // Usar nombre genérico para seeding
    });
    created++;
  }
  console.log(`🌱 [OPIN] Seed: ${created} estables creados con usernames genéricos`);
  return created;
};

/**
 * ✅ Eliminar comentario (solo el autor)
 */
export const deleteComment = async (commentId) => {
  if (!auth.currentUser) {
    throw new Error('Usuario no autenticado');
  }

  const commentRef = doc(db, 'opin_comments', commentId);
  const commentDoc = await getDoc(commentRef);

  if (!commentDoc.exists()) {
    throw new Error('Comentario no encontrado');
  }

  const commentData = commentDoc.data();

  // Solo el autor puede eliminar (excepto admin replies)
  if (commentData.userId !== auth.currentUser.uid && !commentData.isAdminReply) {
    throw new Error('No tienes permiso para eliminar este comentario');
  }

  await deleteDoc(commentRef);

  // Decrementar contador en el post
  const postRef = doc(db, 'opin_posts', commentData.postId);
  await updateDoc(postRef, {
    commentCount: increment(-1),
  });

  console.log('🗑️ [OPIN] Comentario eliminado:', commentId);
};

// ============================================================
// 👁️ SISTEMA DE PREVIEW DE RESPUESTAS (Modo Espectador)
// ============================================================

/**
 * ✅ Obtener preview de respuestas (primeras 3) - Visible para todos
 * Usado para mostrar respuestas inline en OpinCard sin necesidad de auth
 */
export const getReplyPreview = async (postId, previewLimit = 3) => {
  const commentsRef = collection(db, 'opin_comments');

  let snapshot;
  try {
    const q = query(
      commentsRef,
      where('postId', '==', postId),
      orderBy('createdAt', 'asc'),
      limit(previewLimit)
    );
    snapshot = await getDocs(q);
  } catch (indexError) {
    // Fallback sin orderBy
    const qSimple = query(
      commentsRef,
      where('postId', '==', postId),
      limit(previewLimit)
    );
    snapshot = await getDocs(qSimple);
  }

  const replies = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  return replies;
};

/**
 * ✅ Verificar si el usuario puede ver todas las respuestas
 * Solo usuarios logueados (no guests) pueden ver más de 3
 */
export const canViewAllReplies = () => {
  if (!auth.currentUser) return false;
  if (auth.currentUser.isAnonymous) return false;
  return true;
};

// ============================================================
// 🛡️ ADMIN — Respuestas Editoriales
// ============================================================

/** Nombres predefinidos para respuestas de admin */
export const ADMIN_REPLY_NAMES = [
  // Usuarios anónimos (para simular actividad real)
  'Anónimo',
  'Usuario',
  'Alguien',
  // Nombres genéricos de usuarios
  'Carlos_23',
  'Diego_fit',
  'JuanM',
  'AndresVLC',
  'Pablo_28',
  // Equipo oficial
  'Equipo Chactivo',
  'Moderador',
  'Soporte',
  'Comunidad',
];

/**
 * ✅ Agregar respuesta editorial (Admin)
 * Crea una respuesta como contenido semilla, con nombre personalizado
 * Visible públicamente, indistinguible de respuestas normales en UI
 * Internamente marcado como isAdminReply: true
 *
 * @param {string} postId - ID del OPIN
 * @param {string} text - Texto de la respuesta
 * @param {string} authorName - Nombre a mostrar (ej: "Equipo Chactivo")
 */
export const addAdminReply = async (postId, text, authorName) => {
  if (!auth.currentUser) {
    throw new Error('Usuario no autenticado');
  }

  if (!text || text.trim().length < 1) {
    throw new Error('La respuesta no puede estar vacía');
  }

  if (text.length > 150) {
    throw new Error('La respuesta no puede superar 150 caracteres');
  }

  if (!authorName || authorName.trim().length < 1) {
    throw new Error('Debes especificar un nombre de autor');
  }

  const commentsRef = collection(db, 'opin_comments');

  const replyData = {
    postId: postId,
    userId: auth.currentUser.uid, // Admin que lo creó (para auditoría)
    username: authorName.trim(),
    avatar: '', // Sin avatar para respuestas editoriales (usa inicial)
    comment: text.trim(),
    createdAt: serverTimestamp(),
    isAdminReply: true, // Marca interna - NO mostrar en UI
  };

  const docRef = await addDoc(commentsRef, replyData);

  // Incrementar contador de comentarios en el post
  const postRef = doc(db, 'opin_posts', postId);
  await updateDoc(postRef, {
    commentCount: increment(1),
  });

  console.log('🛡️ [OPIN] Respuesta editorial agregada:', docRef.id, 'como', authorName);

  return { id: docRef.id, ...replyData };
};

/**
 * ✅ Obtener todos los OPINs para panel admin (incluye conteo de respuestas)
 */
export const getOpinPostsForAdmin = async (limitCount = 100) => {
  const postsRef = collection(db, 'opin_posts');

  const q = query(
    postsRef,
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);

  const posts = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Filtrar solo posts activos
  const activePosts = posts.filter(p => p.isActive !== false);

  console.log(`🛡️ [OPIN Admin] ${activePosts.length} posts cargados`);

  return activePosts;
};
