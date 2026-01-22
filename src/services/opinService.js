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

// 🎨 Colores disponibles para posts OPIN
export const OPIN_COLORS = {
  purple: { name: 'Purple', gradient: 'from-purple-500 to-purple-700', bg: 'bg-purple-500/10', border: 'border-purple-500/50' },
  pink: { name: 'Pink', gradient: 'from-pink-500 to-pink-700', bg: 'bg-pink-500/10', border: 'border-pink-500/50' },
  cyan: { name: 'Cyan', gradient: 'from-cyan-500 to-cyan-700', bg: 'bg-cyan-500/10', border: 'border-cyan-500/50' },
  orange: { name: 'Orange', gradient: 'from-orange-500 to-orange-700', bg: 'bg-orange-500/10', border: 'border-orange-500/50' },
  green: { name: 'Green', gradient: 'from-green-500 to-green-700', bg: 'bg-green-500/10', border: 'border-green-500/50' },
  blue: { name: 'Blue', gradient: 'from-blue-500 to-blue-700', bg: 'bg-blue-500/10', border: 'border-blue-500/50' },
};

/**
 * ✅ Verificar si el usuario puede crear un post
 * Regla: Solo 1 post activo por usuario
 */
export const canCreatePost = async () => {
  if (!auth.currentUser) {
    return { canCreate: false, reason: 'no_auth' };
  }

  // Usuarios invitados NO pueden publicar
  if (auth.currentUser.isAnonymous) {
    return { canCreate: false, reason: 'guest_user' };
  }

  // Verificar si ya tiene un post activo
  const postsRef = collection(db, 'opin_posts');
  const q = query(
    postsRef,
    where('userId', '==', auth.currentUser.uid),
    where('isActive', '==', true),
    limit(1)
  );

  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    return { canCreate: false, reason: 'active_post_exists', existingPost: snapshot.docs[0].data() };
  }

  return { canCreate: true };
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

  // Validar título (opcional)
  if (title && title.length > 50) {
    throw new Error('El título no puede superar 50 caracteres');
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

  // Verificar que no tenga otro post activo
  const canCreate = await canCreatePost();
  if (!canCreate.canCreate) {
    throw new Error('Ya tienes un post activo');
  }

  const now = Timestamp.now();
  const expiresAt = new Timestamp(now.seconds + (24 * 60 * 60), now.nanoseconds); // +24h

  const postData = {
    userId: auth.currentUser.uid,
    username: userProfile.username || 'Anónimo',
    avatar: userProfile.avatar || '',
    profileId: auth.currentUser.uid,
    title: title.trim(),
    text: text.trim(),
    color: color,
    createdAt: serverTimestamp(),
    expiresAt: expiresAt,
    isActive: true,
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

/**
 * ✅ Obtener feed de posts activos
 * Query ULTRA simplificado: NO requiere índice
 */
export const getOpinFeed = async (limitCount = 50) => {
  const postsRef = collection(db, 'opin_posts');
  const now = Timestamp.now();

  // Query MÁS SIMPLE POSIBLE: solo orderBy (NO where)
  // Esto NO requiere ningún índice compuesto
  const q = query(
    postsRef,
    orderBy('createdAt', 'desc'),
    limit(100) // Pedimos más para filtrar en cliente
  );

  const snapshot = await getDocs(q);

  // Filtrar TODO en el cliente
  const posts = snapshot.docs
    .map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))
    .filter(post => {
      // Solo posts activos
      if (!post.isActive) return false;

      // Solo posts NO expirados
      if (post.expiresAt && post.expiresAt.toMillis) {
        return post.expiresAt.toMillis() > now.toMillis();
      }
      return true;
    })
    .slice(0, limitCount); // Limitar resultado final

  console.log(`📥 [OPIN] Feed cargado: ${posts.length} posts activos`);

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
 * ✅ Eliminar post del usuario
 */
export const deleteOpinPost = async (postId) => {
  if (!auth.currentUser) {
    throw new Error('Usuario no autenticado');
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
  console.log('🗑️ [OPIN] Post eliminado:', postId);
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
 * ✅ Obtener tiempo restante hasta expiración
 */
export const getTimeRemaining = (expiresAt) => {
  if (!expiresAt) return '24h';

  const now = Date.now();
  const expiryTime = expiresAt.toMillis ? expiresAt.toMillis() : expiresAt;
  const diffMs = expiryTime - now;

  if (diffMs <= 0) return 'Expirado';

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
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

  if (commentText.length > 500) {
    throw new Error('El comentario no puede superar 500 caracteres');
  }

  // Verificar límite de 100 comentarios
  const commentsRef = collection(db, 'opin_comments');
  const q = query(
    commentsRef,
    where('postId', '==', postId),
    orderBy('createdAt', 'desc'),
    limit(1)
  );

  const snapshot = await getDocs(q);
  const commentCount = snapshot.size;

  if (commentCount >= 100) {
    throw new Error('Este post ya alcanzó el límite de 100 comentarios');
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

  console.log('💬 [OPIN] Comentario agregado:', docRef.id);

  return { commentId: docRef.id, ...commentData };
};

/**
 * ✅ Obtener comentarios de un post
 */
export const getPostComments = async (postId, limitCount = 100) => {
  const commentsRef = collection(db, 'opin_comments');
  const q = query(
    commentsRef,
    where('postId', '==', postId),
    orderBy('createdAt', 'asc'),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);

  const comments = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  console.log(`💬 [OPIN] Comentarios cargados: ${comments.length} para post ${postId}`);

  return comments;
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

  // Solo el autor puede eliminar
  if (commentData.userId !== auth.currentUser.uid) {
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
