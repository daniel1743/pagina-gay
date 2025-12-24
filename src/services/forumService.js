import { collection, addDoc, getDocs, query, orderBy, where, doc, getDoc, updateDoc, increment, serverTimestamp, limit } from 'firebase/firestore';
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
    let q = query(collection(db, FORUM_COLLECTION));

    // Filtrar por categoría si se especifica
    if (category && category !== 'Todos') {
      q = query(q, where('category', '==', category));
    }

    // Ordenar
    // ✅ Simplificado: solo ordenar por un campo para evitar índices compuestos complejos
    // El ordenamiento secundario se hace en el cliente
    if (sortBy === 'popular') {
      q = query(q, orderBy('likes', 'desc'));
    } else if (sortBy === 'replies') {
      q = query(q, orderBy('replies', 'desc'));
    } else {
      q = query(q, orderBy('createdAt', 'desc'));
    }

    // Limitar resultados solo si se especifica un límite
    if (maxResults && maxResults > 0) {
      q = query(q, limit(maxResults));
    }

    const snapshot = await getDocs(q);
    const threads = [];

    snapshot.forEach((doc) => {
      threads.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().createdAt?.toMillis() || Date.now(),
      });
    });

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
    console.error('Error obteniendo threads:', error);
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
      trackForumVote({
        threadId: threadId,
        voteType: 'upvote'
      });
    }
  } catch (error) {
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
      trackForumVote({
        threadId: replyId,
        voteType: 'upvote'
      });
    }
  } catch (error) {
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

