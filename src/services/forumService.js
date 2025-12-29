import { collection, addDoc, getDocs, query, orderBy, where, doc, getDoc, updateDoc, deleteDoc, increment, serverTimestamp, limit } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { trackThreadCreated, trackForumReply, trackForumVote } from '@/services/ga4Service';

/**
 * Servicio para manejar el foro anónimo
 * Todos los usuarios son anónimos, solo se guarda un ID único
 */

const FORUM_COLLECTION = 'forum_threads';
const REPLIES_COLLECTION = 'forum_replies';

/**
 * Genera un ID anónimo único para usuarios del foro
 */
const generateAnonymousId = () => {
  return `anon_${Math.floor(Math.random() * 1000000)}`;
};

/**
 * Crea un nuevo thread en el foro
 * @param {object} threadData - { title, content, category }
 * @param {string} anonymousUserId - ID anónimo del usuario (se genera si no se provee)
 * @returns {Promise<string>} ID del thread creado
 */
export const createThread = async (threadData, anonymousUserId = null) => {
  try {
    const anonId = anonymousUserId || generateAnonymousId();
    
    const threadRef = await addDoc(collection(db, FORUM_COLLECTION), {
      title: threadData.title,
      content: threadData.content,
      category: threadData.category,
      authorId: anonId, // ID anónimo único
      authorDisplay: `Usuario Anónimo #${anonId.split('_')[1]}`, // Solo para mostrar
      replies: 0,
      likes: 0,
      views: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // No guardamos datos personales del usuario
    });

    // Track GA4: creación de thread
    trackThreadCreated({
      userId: anonId,
      category: threadData.category
    });

    return threadRef.id;
  } catch (error) {
    console.error('Error creando thread:', error);
    throw error;
  }
};

/**
 * Obtiene todos los threads del foro
 * @param {string} category - Categoría a filtrar (opcional)
 * @param {string} sortBy - 'recent', 'popular', 'replies'
 * @param {number|null} maxResults - Número máximo de resultados (null = sin límite)
 * @returns {Promise<Array>} Array de threads
 */
export const getThreads = async (category = null, sortBy = 'recent', maxResults = null) => {
  try {
    // ✅ CORREGIDO: Construir el query de una sola vez con todos los constraints
    const constraints = [];

    // Filtrar por categoría si se especifica
    if (category && category !== 'Todos') {
      constraints.push(where('category', '==', category));
    }

    // Ordenar
    if (sortBy === 'popular') {
      constraints.push(orderBy('likes', 'desc'));
    } else if (sortBy === 'replies') {
      constraints.push(orderBy('replies', 'desc'));
    } else {
      constraints.push(orderBy('createdAt', 'desc'));
    }

    // Limitar resultados solo si se especifica un límite
    if (maxResults && maxResults > 0) {
      constraints.push(limit(maxResults));
    }

    // Construir y ejecutar el query de una sola vez
    const q = query(collection(db, FORUM_COLLECTION), ...constraints);

    console.log(`📊 [forumService] Query construido - Categoría: ${category || 'TODOS'}, Sort: ${sortBy}, Límite: ${maxResults || 'SIN LÍMITE'}`);

    const snapshot = await getDocs(q);
    const threads = [];

    snapshot.forEach((doc) => {
      threads.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().createdAt?.toMillis() || Date.now(),
      });
    });

    console.log(`✅ [forumService] Threads obtenidos de Firestore: ${threads.length}`);

    // ✅ Ordenamiento secundario en el cliente (por fecha) si es necesario
    if (sortBy === 'popular' || sortBy === 'replies') {
      threads.sort((a, b) => {
        // Primero por el campo principal (likes o replies)
        const primaryDiff = sortBy === 'popular'
          ? (b.likes || 0) - (a.likes || 0)
          : (b.replies || 0) - (a.replies || 0);

        if (primaryDiff !== 0) return primaryDiff;

        // Si son iguales, ordenar por fecha (más reciente primero)
        return (b.timestamp || 0) - (a.timestamp || 0);
      });
    }

    return threads;
  } catch (error) {
    console.error('❌ [forumService] Error obteniendo threads:', error);
    // Fallback a datos locales si hay error
    return [];
  }
};

/**
 * Obtiene un thread específico por ID
 * @param {string} threadId - ID del thread
 * @returns {Promise<object|null>} Thread o null si no existe
 */
export const getThreadById = async (threadId) => {
  try {
    const threadRef = doc(db, FORUM_COLLECTION, threadId);
    const threadSnap = await getDoc(threadRef);

    if (threadSnap.exists()) {
      return {
        id: threadSnap.id,
        ...threadSnap.data(),
        timestamp: threadSnap.data().createdAt?.toMillis() || Date.now(),
      };
    }

    return null;
  } catch (error) {
    console.error('Error obteniendo thread:', error);
    return null;
  }
};

/**
 * Agrega una respuesta a un thread
 * @param {string} threadId - ID del thread
 * @param {string} content - Contenido de la respuesta
 * @param {string} anonymousUserId - ID anónimo del usuario
 * @returns {Promise<string>} ID de la respuesta creada
 */
export const addReply = async (threadId, content, anonymousUserId = null) => {
  try {
    const anonId = anonymousUserId || generateAnonymousId();

    // Crear la respuesta
    const replyRef = await addDoc(collection(db, REPLIES_COLLECTION), {
      threadId: threadId,
      content: content,
      authorId: anonId,
      authorDisplay: `Usuario Anónimo #${anonId.split('_')[1]}`,
      likes: 0,
      createdAt: serverTimestamp(),
    });

    // Incrementar contador de respuestas en el thread
    const threadRef = doc(db, FORUM_COLLECTION, threadId);
    await updateDoc(threadRef, {
      replies: increment(1),
      updatedAt: serverTimestamp(),
    });

    // Track GA4: respuesta en foro
    trackForumReply({
      userId: anonId,
      threadId: threadId
    });

    return replyRef.id;
  } catch (error) {
    console.error('Error agregando respuesta:', error);
    throw error;
  }
};

/**
 * Obtiene todas las respuestas de un thread
 * @param {string} threadId - ID del thread
 * @returns {Promise<Array>} Array de respuestas
 */
export const getReplies = async (threadId) => {
  try {
    const q = query(
      collection(db, REPLIES_COLLECTION),
      where('threadId', '==', threadId),
      orderBy('createdAt', 'asc')
    );

    const snapshot = await getDocs(q);
    const replies = [];

    snapshot.forEach((doc) => {
      replies.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().createdAt?.toMillis() || Date.now(),
      });
    });

    return replies;
  } catch (error) {
    console.error('Error obteniendo respuestas:', error);
    return [];
  }
};

/**
 * Vota por un thread (like)
 * @param {string} threadId - ID del thread
 * @param {boolean} isLike - true para like, false para unlike
 * @returns {Promise<void>}
 */
export const voteThread = async (threadId, isLike = true) => {
  try {
    const threadRef = doc(db, FORUM_COLLECTION, threadId);
    await updateDoc(threadRef, {
      likes: increment(isLike ? 1 : -1),
      updatedAt: serverTimestamp(),
    });

    // Track GA4: voto en thread (solo si es like)
    if (isLike) {
      try {
        trackForumVote({
          threadId: threadId,
          voteType: 'upvote'
        });
      } catch (trackError) {
        // No fallar si el tracking falla
        console.warn('Error tracking vote:', trackError);
      }
    }
  } catch (error) {
    // ✅ Ignorar errores internos de Firestore que no podemos controlar
    if (error?.message?.includes('INTERNAL ASSERTION FAILED') || 
        error?.message?.includes('Unexpected state')) {
      console.warn('Firestore internal error while voting thread, operation may have succeeded');
      // No lanzar el error, asumir que la operación puede haber tenido éxito
      return;
    }
    console.error('Error votando thread:', error);
    throw error;
  }
};

/**
 * Vota por una respuesta (like)
 * @param {string} replyId - ID de la respuesta
 * @param {boolean} isLike - true para like, false para unlike
 * @returns {Promise<void>}
 */
export const voteReply = async (replyId, isLike = true) => {
  try {
    const replyRef = doc(db, REPLIES_COLLECTION, replyId);
    await updateDoc(replyRef, {
      likes: increment(isLike ? 1 : -1),
    });

    // Track GA4: voto en reply (solo si es like)
    if (isLike) {
      try {
        trackForumVote({
          threadId: replyId,
          voteType: 'upvote'
        });
      } catch (trackError) {
        // No fallar si el tracking falla
        console.warn('Error tracking vote:', trackError);
      }
    }
  } catch (error) {
    // ✅ Ignorar errores internos de Firestore que no podemos controlar
    if (error?.message?.includes('INTERNAL ASSERTION FAILED') || 
        error?.message?.includes('Unexpected state')) {
      console.warn('Firestore internal error while voting reply, operation may have succeeded');
      // No lanzar el error, asumir que la operación puede haber tenido éxito
      return;
    }
    console.error('Error votando respuesta:', error);
    throw error;
  }
};

/**
 * Incrementa las vistas de un thread
 * @param {string} threadId - ID del thread
 * @returns {Promise<void>}
 */
export const incrementViews = async (threadId) => {
  try {
    const threadRef = doc(db, FORUM_COLLECTION, threadId);
    await updateDoc(threadRef, {
      views: increment(1),
    });
  } catch (error) {
    console.error('Error incrementando vistas:', error);
    // No lanzar error, es solo tracking
  }
};

/**
 * ========================================
 * FUNCIONES DE ADMINISTRACIÓN DEL FORO
 * ========================================
 */

/**
 * Crea un thread con ID anónimo personalizado (para admin)
 * @param {object} threadData - { title, content, category }
 * @param {string} customAnonymousId - ID anónimo personalizado
 * @returns {Promise<string>} ID del thread creado
 */
export const createThreadAsAdmin = async (threadData, customAnonymousId = null) => {
  try {
    const anonId = customAnonymousId || generateAnonymousId();
    
    const threadRef = await addDoc(collection(db, FORUM_COLLECTION), {
      title: threadData.title,
      content: threadData.content,
      category: threadData.category || 'Preguntas',
      authorId: anonId,
      authorDisplay: `Usuario Anónimo #${anonId.split('_')[1]}`,
      replies: 0,
      likes: threadData.likes || 0,
      views: threadData.views || 0,
      createdAt: threadData.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
      isAdminCreated: true, // Marca para identificar posts creados por admin
    });

    return threadRef.id;
  } catch (error) {
    console.error('Error creando thread como admin:', error);
    throw error;
  }
};

/**
 * Actualiza un thread (solo admin)
 * @param {string} threadId - ID del thread
 * @param {object} updates - Campos a actualizar
 * @returns {Promise<void>}
 */
export const updateThreadAsAdmin = async (threadId, updates) => {
  try {
    const threadRef = doc(db, FORUM_COLLECTION, threadId);
    await updateDoc(threadRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error actualizando thread:', error);
    throw error;
  }
};

/**
 * Elimina un thread y todas sus respuestas (solo admin)
 * @param {string} threadId - ID del thread
 * @returns {Promise<void>}
 */
export const deleteThreadAsAdmin = async (threadId) => {
  try {
    // Eliminar todas las respuestas del thread
    const repliesQuery = query(
      collection(db, REPLIES_COLLECTION),
      where('threadId', '==', threadId)
    );
    const repliesSnapshot = await getDocs(repliesQuery);
    
    const deleteRepliesPromises = repliesSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deleteRepliesPromises);

    // Eliminar el thread
    const threadRef = doc(db, FORUM_COLLECTION, threadId);
    await deleteDoc(threadRef);
  } catch (error) {
    console.error('Error eliminando thread:', error);
    throw error;
  }
};

/**
 * Crea una respuesta con ID anónimo personalizado (para admin)
 * @param {string} threadId - ID del thread
 * @param {string} content - Contenido de la respuesta
 * @param {string} customAnonymousId - ID anónimo personalizado
 * @returns {Promise<string>} ID de la respuesta creada
 */
export const addReplyAsAdmin = async (threadId, content, customAnonymousId = null) => {
  try {
    const anonId = customAnonymousId || generateAnonymousId();

    // Crear la respuesta
    const replyRef = await addDoc(collection(db, REPLIES_COLLECTION), {
      threadId: threadId,
      content: content,
      authorId: anonId,
      authorDisplay: `Usuario Anónimo #${anonId.split('_')[1]}`,
      likes: 0,
      createdAt: serverTimestamp(),
      isAdminCreated: true, // Marca para identificar respuestas creadas por admin
    });

    // Incrementar contador de respuestas en el thread
    const threadRef = doc(db, FORUM_COLLECTION, threadId);
    await updateDoc(threadRef, {
      replies: increment(1),
      updatedAt: serverTimestamp(),
    });

    return replyRef.id;
  } catch (error) {
    console.error('Error agregando respuesta como admin:', error);
    throw error;
  }
};

/**
 * Actualiza una respuesta (solo admin)
 * @param {string} replyId - ID de la respuesta
 * @param {object} updates - Campos a actualizar
 * @returns {Promise<void>}
 */
export const updateReplyAsAdmin = async (replyId, updates) => {
  try {
    const replyRef = doc(db, REPLIES_COLLECTION, replyId);
    await updateDoc(replyRef, updates);
  } catch (error) {
    console.error('Error actualizando respuesta:', error);
    throw error;
  }
};

/**
 * Elimina una respuesta (solo admin)
 * @param {string} replyId - ID de la respuesta
 * @param {string} threadId - ID del thread (para decrementar contador)
 * @returns {Promise<void>}
 */
export const deleteReplyAsAdmin = async (replyId, threadId) => {
  try {
    // Eliminar la respuesta
    const replyRef = doc(db, REPLIES_COLLECTION, replyId);
    await deleteDoc(replyRef);

    // Decrementar contador de respuestas en el thread
    if (threadId) {
      const threadRef = doc(db, FORUM_COLLECTION, threadId);
      const threadSnap = await getDoc(threadRef);
      if (threadSnap.exists()) {
        const currentReplies = threadSnap.data().replies || 0;
        await updateDoc(threadRef, {
          replies: Math.max(0, currentReplies - 1),
          updatedAt: serverTimestamp(),
        });
      }
    }
  } catch (error) {
    console.error('Error eliminando respuesta:', error);
    throw error;
  }
};

/**
 * Obtiene todos los threads (para admin - sin límites)
 * @returns {Promise<Array>} Array de todos los threads
 */
export const getAllThreadsAsAdmin = async () => {
  try {
    const q = query(collection(db, FORUM_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const threads = [];

    snapshot.forEach((doc) => {
      threads.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().createdAt?.toMillis() || Date.now(),
      });
    });

    return threads;
  } catch (error) {
    console.error('Error obteniendo threads como admin:', error);
    return [];
  }
};

/**
 * Obtiene todas las respuestas de todos los threads (para admin)
 * @returns {Promise<Array>} Array de todas las respuestas
 */
export const getAllRepliesAsAdmin = async () => {
  try {
    const q = query(collection(db, REPLIES_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const replies = [];

    snapshot.forEach((doc) => {
      replies.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().createdAt?.toMillis() || Date.now(),
      });
    });

    return replies;
  } catch (error) {
    console.error('Error obteniendo respuestas como admin:', error);
    return [];
  }
};

