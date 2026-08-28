import { collection, addDoc, getDocs, query, orderBy, where, doc, getDoc, updateDoc, deleteDoc, increment, serverTimestamp, limit } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { supabase, isSupabaseAuthEnabled } from '@/config/supabase';
import { trackThreadCreated, trackForumReply, trackForumVote } from '@/services/ga4Service';

/**
 * Servicio para manejar el foro anónimo
 * Todos los usuarios son anónimos, solo se guarda un ID único
 */

const FORUM_COLLECTION = 'forum_threads';
const REPLIES_COLLECTION = 'forum_replies';

const mapSupabaseThread = (row) => ({ id: row.id, title: row.title, content: row.content, category: row.category, authorId: row.anonymous_id, authorDisplay: row.author_display, replies: row.reply_count || 0, likes: row.like_count || 0, views: row.view_count || 0, createdAt: row.created_at, updatedAt: row.updated_at, timestamp: new Date(row.created_at).getTime() || Date.now() });
const mapSupabaseReply = (row) => ({ id: row.id, threadId: row.thread_id, content: row.content, authorId: row.anonymous_id, authorDisplay: row.author_display, likes: row.like_count || 0, createdAt: row.created_at, timestamp: new Date(row.created_at).getTime() || Date.now() });
const getSupabaseForumActor = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data?.user?.id) throw new Error('Debes estar autenticado para usar el foro');
  return data.user;
};

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
  if (isSupabaseAuthEnabled()) {
    const actor = await getSupabaseForumActor();
    const anonId = anonymousUserId || `anon_${actor.id.slice(0, 8)}`;
    const { data, error } = await supabase.from('forum_threads').insert({ author_id: actor.id, anonymous_id: anonId, author_display: `Usuario Anónimo #${anonId.split('_')[1] || 'comunidad'}`, title: threadData.title, content: threadData.content, category: threadData.category || 'general' }).select('id').single();
    if (error) throw error;
    trackThreadCreated({ userId: anonId, category: threadData.category });
    return data.id;
  }
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
  if (isSupabaseAuthEnabled()) {
    try {
      let request = supabase.from('forum_threads').select('*');
      if (category && category !== 'Todos') request = request.eq('category', category);
      const orderColumn = sortBy === 'popular' ? 'like_count' : sortBy === 'replies' ? 'reply_count' : 'created_at';
      request = request.order(orderColumn, { ascending: false }).limit(Math.max(1, Math.min(Number(maxResults) || 100, 200)));
      const { data, error } = await request; if (error) throw error;
      return (data || []).map(mapSupabaseThread);
    } catch (error) { console.warn('[FORUM] Error leyendo Supabase:', error?.message || error); return []; }
  }
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
  if (isSupabaseAuthEnabled()) {
    const { data, error } = await supabase.from('forum_threads').select('*').eq('id', threadId).maybeSingle();
    if (error) throw error;
    return data ? mapSupabaseThread(data) : null;
  }
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
  if (isSupabaseAuthEnabled()) {
    const actor = await getSupabaseForumActor();
    const anonId = anonymousUserId || `anon_${actor.id.slice(0, 8)}`;
    const { data, error } = await supabase.from('forum_replies').insert({ thread_id: threadId, author_id: actor.id, anonymous_id: anonId, author_display: `Usuario Anónimo #${anonId.split('_')[1] || 'comunidad'}`, content }).select('id').single();
    if (error) throw error;
    trackForumReply({ threadId, userId: anonId });
    return data.id;
  }
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
  if (isSupabaseAuthEnabled()) {
    const { data, error } = await supabase.from('forum_replies').select('*').eq('thread_id', threadId).order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map(mapSupabaseReply);
  }
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
  if (isSupabaseAuthEnabled()) {
    const { error } = await supabase.rpc('toggle_forum_vote', { target_entity_type: 'thread', target_entity_id: threadId, desired: Boolean(isLike) });
    if (error) throw error;
    if (isLike) trackForumVote({ threadId, voteType: 'upvote' });
    return;
  }
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
  if (isSupabaseAuthEnabled()) {
    const { error } = await supabase.rpc('toggle_forum_vote', { target_entity_type: 'reply', target_entity_id: replyId, desired: Boolean(isLike) });
    if (error) throw error;
    if (isLike) trackForumVote({ threadId: replyId, voteType: 'upvote' });
    return;
  }
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
  if (isSupabaseAuthEnabled()) {
    const { error } = await supabase.rpc('increment_forum_view', { target_thread_id: threadId });
    if (error) console.warn('[FORUM] No se pudo registrar vista Supabase:', error.message);
    return;
  }
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
  if (isSupabaseAuthEnabled()) {
    const actor = await getSupabaseForumActor();
    const anonId = customAnonymousId || `admin_${actor.id.slice(0, 8)}`;
    const { data, error } = await supabase.from('forum_threads').insert({ author_id: actor.id, anonymous_id: anonId, author_display: `Usuario Anónimo #${anonId.split('_')[1] || 'comunidad'}`, title: threadData.title, content: threadData.content, category: threadData.category || 'general' }).select('id').single();
    if (error) throw error;
    return data.id;
  }
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
  if (isSupabaseAuthEnabled()) {
    const allowed = {}; ['title', 'content', 'category'].forEach((key) => { if (updates?.[key] !== undefined) allowed[key] = updates[key]; });
    const { error } = await supabase.from('forum_threads').update(allowed).eq('id', threadId);
    if (error) throw error;
    return;
  }
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
  if (isSupabaseAuthEnabled()) {
    const { error } = await supabase.from('forum_threads').delete().eq('id', threadId);
    if (error) throw error;
    return;
  }
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
  if (isSupabaseAuthEnabled()) {
    const actor = await getSupabaseForumActor();
    const anonId = customAnonymousId || `admin_${actor.id.slice(0, 8)}`;
    const { data, error } = await supabase.from('forum_replies').insert({ thread_id: threadId, author_id: actor.id, anonymous_id: anonId, author_display: `Usuario Anónimo #${anonId.split('_')[1] || 'comunidad'}`, content }).select('id').single();
    if (error) throw error;
    return data.id;
  }
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
  if (isSupabaseAuthEnabled()) {
    const allowed = {}; ['content'].forEach((key) => { if (updates?.[key] !== undefined) allowed[key] = updates[key]; });
    const { error } = await supabase.from('forum_replies').update(allowed).eq('id', replyId);
    if (error) throw error;
    return;
  }
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
  if (isSupabaseAuthEnabled()) {
    const { error } = await supabase.from('forum_replies').delete().eq('id', replyId);
    if (error) throw error;
    return;
  }
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
  if (isSupabaseAuthEnabled()) {
    const { data, error } = await supabase.from('forum_threads').select('*').order('created_at', { ascending: false }).limit(500);
    if (error) throw error;
    return (data || []).map(mapSupabaseThread);
  }
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
  if (isSupabaseAuthEnabled()) {
    const { data, error } = await supabase.from('forum_replies').select('*').order('created_at', { ascending: false }).limit(1000);
    if (error) throw error;
    return (data || []).map(mapSupabaseReply);
  }
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

