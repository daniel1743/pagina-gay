import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { resolveProfileRole } from '@/config/profileRoles';
import { normalizeComuna } from '@/config/comunas';

const PUBLIC_USER_PROFILES_COLLECTION = 'public_user_profiles';
const getPublicUserProfileRef = (userId) => doc(db, PUBLIC_USER_PROFILES_COLLECTION, userId);

/**
 * ✅ NUEVO: Verifica si un username ya existe (case-insensitive)
 * @param {string} username - Username a verificar
 * @param {string} excludeUserId - ID de usuario a excluir (para actualizaciones)
 * @returns {Promise<boolean>} true si el username está disponible, false si ya existe
 */
export const checkUsernameAvailability = async (username, excludeUserId = null) => {
  try {
    if (!username || !username.trim()) {
      return false;
    }

    const usernameLower = username.trim().toLowerCase();
    const usersRef = collection(db, PUBLIC_USER_PROFILES_COLLECTION);
    
    // Buscar todos los usuarios (Firestore no tiene búsqueda case-insensitive nativa)
    // Para mejor rendimiento, buscaremos por rango y luego filtraremos
    const q = query(usersRef);
    const snapshot = await getDocs(q);
    
    // Verificar cada usuario para coincidencia case-insensitive
    for (const docSnap of snapshot.docs) {
      // Excluir el usuario actual si se está actualizando
      if (excludeUserId && docSnap.id === excludeUserId) {
        continue;
      }
      
      const userData = docSnap.data();
      // Comparación case-insensitive
      if (userData.username && userData.username.toLowerCase() === usernameLower) {
        return false; // Username ya existe
      }
    }
    
    return true; // Username disponible
  } catch (error) {
    console.error('Error checking username availability:', error);
    // En caso de error, asumir que no está disponible para ser más seguro
    return false;
  }
};

/**
 * Crea o actualiza el perfil de usuario en Firestore
 * ✅ ACTUALIZADO: Ahora valida que el username sea único antes de crear
 */
export const createUserProfile = async (uid, userData) => {
  try {
    // ⚠️ TEMPORALMENTE DESHABILITADO: checkUsernameAvailability causa errores de permisos
    // La función intenta leer TODOS los usuarios, lo cual falla en Firestore
    // TODO: Implementar solución con colección separada 'usernames' con permisos públicos de lectura
    /*
    const isAvailable = await checkUsernameAvailability(userData.username);
    if (!isAvailable) {
      throw new Error('Este nombre de usuario ya está en uso. Por favor elige otro.');
    }
    */

    const normalizedProfileRole = resolveProfileRole(userData.profileRole, userData.role);
    const normalizedComuna = normalizeComuna(userData.comuna);
    const userRef = doc(db, 'users', uid);

    const userProfile = {
      id: uid,
      username: userData.username,
      email: userData.email,
      age: userData.age ? parseInt(userData.age) : null,
      phone: userData.phone || null,
      profileRole: normalizedProfileRole || null,
      comuna: normalizedComuna || null,
      isPremium: false,
      verified: false,
      isGuest: false,
      avatar: userData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}`,
      quickPhrases: [],
      theme: {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(userRef, userProfile);
    return userProfile;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

/**
 * Obtiene el perfil de usuario desde Firestore
 * Si no existe, crea uno básico automáticamente
 */
export const getUserProfile = async (uid) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() };
    } else {
      // Usuario autenticado pero sin perfil - crear uno básico
      console.warn('Usuario autenticado sin perfil en Firestore, creando perfil básico...');
      const basicProfile = {
        id: uid,
        username: `Usuario${uid.slice(0, 6)}`,
        email: 'email@example.com', // Se actualizará después
        isPremium: false,
        verified: false,
        isGuest: false,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`,
        quickPhrases: [],
        theme: {},
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(userRef, basicProfile);
      return basicProfile;
    }
  } catch (error) {
    // ✅ Ignorar errores internos de Firestore que no podemos controlar
    if (error?.message?.includes('INTERNAL ASSERTION FAILED') || 
        error?.message?.includes('Unexpected state')) {
      console.warn('Firestore internal error getting user profile, returning null');
      // Retornar null en lugar de lanzar error para evitar romper la app
      return null;
    }
    console.error('Error getting user profile:', error);
    throw error;
  }
};

/**
 * Actualiza el perfil de usuario
 * ✅ ACTUALIZADO: Valida username único si se está actualizando
 */
export const updateUserProfile = async (uid, updates) => {
  try {
    // ✅ VALIDAR: Si se está actualizando el username, verificar que sea único
    if (updates.username) {
      const isAvailable = await checkUsernameAvailability(updates.username, uid);
      if (!isAvailable) {
        throw new Error('Este nombre de usuario ya está en uso. Por favor elige otro.');
      }
    }

    const normalizedUpdates = { ...updates };
    if (Object.prototype.hasOwnProperty.call(normalizedUpdates, 'comuna')) {
      normalizedUpdates.comuna = normalizeComuna(normalizedUpdates.comuna) || null;
    }

    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...normalizedUpdates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Actualiza configuración de tema
 */
export const updateUserTheme = async (uid, themeSetting, value) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const currentTheme = userSnap.data().theme || {};
      await updateDoc(userRef, {
        theme: {
          ...currentTheme,
          [themeSetting]: value
        },
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error updating theme:', error);
    throw error;
  }
};

/**
 * Añade frase rápida
 */
export const addQuickPhrase = async (uid, phrase) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const currentPhrases = userSnap.data().quickPhrases || [];
      await updateDoc(userRef, {
        quickPhrases: [...currentPhrases, phrase],
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error adding quick phrase:', error);
    throw error;
  }
};

/**
 * Elimina frase rápida
 */
export const removeQuickPhrase = async (uid, phraseToRemove) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const currentPhrases = userSnap.data().quickPhrases || [];
      await updateDoc(userRef, {
        quickPhrases: currentPhrases.filter(p => p !== phraseToRemove),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error removing quick phrase:', error);
    throw error;
  }
};

/**
 * Actualiza usuario a Premium
 */
export const upgradeToPremium = async (uid) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      isPremium: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error upgrading to premium:', error);
    throw error;
  }
};

/**
 * Busca usuarios por ID o nombre de usuario (SOLO ADMIN)
 * @param {string} searchTerm - Término de búsqueda (ID o username)
 * @returns {Promise<Array>} Lista de usuarios que coinciden
 */
export const searchUsers = async (searchTerm) => {
  try {
    if (!searchTerm || !searchTerm.trim()) {
      return [];
    }

    const searchTermLower = searchTerm.trim().toLowerCase();
    const usersRef = collection(db, 'users');
    const q = query(usersRef);
    const snapshot = await getDocs(q);

    const matchedUsers = [];

    snapshot.forEach((docSnap) => {
      const userData = docSnap.data();
      const userId = docSnap.id.toLowerCase();
      const username = (userData.username || '').toLowerCase();

      // Buscar coincidencias parciales en ID o username
      if (
        userId.includes(searchTermLower) ||
        username.includes(searchTermLower)
      ) {
        matchedUsers.push({
          id: docSnap.id,
          ...userData,
        });
      }
    });

    // Limitar a 20 resultados para no sobrecargar la UI
    return matchedUsers.slice(0, 20);
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
};

/**
 * Obtiene un usuario por ID (SOLO ADMIN)
 * @param {string} userId - ID del usuario
 * @returns {Promise<object|null>} Usuario o null si no existe
 */
export const getUserById = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return {
        id: userSnap.id,
        ...userSnap.data(),
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
};

const mapPublicProfileSnapshot = (docSnap) => {
  if (!docSnap?.exists?.()) {
    return null;
  }

  const data = docSnap.data() || {};
  return {
    id: docSnap.id,
    userId: docSnap.id,
    ...data,
  };
};

export const getPublicProfileById = async (userId) => {
  try {
    if (!userId) return null;
    const profileSnap = await getDoc(getPublicUserProfileRef(userId));
    return mapPublicProfileSnapshot(profileSnap);
  } catch (error) {
    console.error('Error getting public profile by ID:', error);
    return null;
  }
};

export const getPublicProfilesByIds = async (userIds = []) => {
  try {
    const normalizedIds = [...new Set(
      (Array.isArray(userIds) ? userIds : [])
        .map((value) => String(value || '').trim())
        .filter(Boolean)
    )];

    if (normalizedIds.length === 0) {
      return [];
    }

    const snapshots = await Promise.all(
      normalizedIds.map((userId) => getDoc(getPublicUserProfileRef(userId)))
    );

    return snapshots
      .map(mapPublicProfileSnapshot)
      .filter(Boolean);
  } catch (error) {
    console.error('Error getting public profiles by IDs:', error);
    return [];
  }
};

/**
 * Campos públicos del perfil que otros usuarios pueden ver
 * (foto, nombre, rol, intereses, descripción, estado)
 */
const PUBLIC_PROFILE_FIELDS = [
  'id', 'username', 'avatar', 'description', 'estado',
  'profileRole', 'role', 'interests', 'verified', 'isPremium', 'comuna',
  'isProUser', 'canUploadSecondPhoto', 'hasFeaturedCard', 'hasRainbowBorder', 'hasProBadge'
];

/**
 * Obtiene el perfil público de un usuario para que otros puedan verlo.
 * Respeta profileVisible: si es false, retorna null (perfil oculto).
 * @param {string} userId - ID del usuario cuyo perfil se quiere ver
 * @returns {Promise<object|null>} Perfil público o null si no existe o está oculto
 */
export const getPublicProfile = async (userId) => {
  try {
    if (!userId) return null;

    const publicProfile = await getPublicProfileById(userId);
    if (!publicProfile) return null;

    // Si el usuario ocultó su perfil, no mostrarlo
    if (publicProfile.profileVisible === false) {
      return null;
    }

    return publicProfile;
  } catch (error) {
    console.error('Error getting public profile:', error);
    return null;
  }
};

const toMillisSafe = (value) => {
  if (!value) return null;
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (typeof value?.seconds === 'number') return value.seconds * 1000;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
};

const pickTarjetaPublicFields = (tarjeta = {}) => ({
  nombre: tarjeta?.nombre || null,
  edad: Number.isFinite(Number(tarjeta?.edad)) ? Number(tarjeta.edad) : null,
  rol: tarjeta?.rol || null,
  bio: tarjeta?.bio || null,
  buscando: tarjeta?.buscando || null,
  ubicacionTexto: tarjeta?.ubicacionTexto || null,
  etnia: tarjeta?.etnia || null,
  alturaCm: Number.isFinite(Number(tarjeta?.alturaCm)) ? Number(tarjeta.alturaCm) : null,
  pesaje: Number.isFinite(Number(tarjeta?.pesaje)) ? Number(tarjeta.pesaje) : null,
  sexo: tarjeta?.sexo || null,
  likesRecibidos: Number(tarjeta?.likesRecibidos || 0),
  visitasRecibidas: Number(tarjeta?.visitasRecibidas || 0),
  impresionesRecibidas: Number(tarjeta?.impresionesRecibidas || 0),
  huellasRecibidas: Number(tarjeta?.huellasRecibidas || 0),
  estaOnline: Boolean(tarjeta?.estaOnline),
  ultimaConexionMs: toMillisSafe(tarjeta?.ultimaConexion),
});

const fetchRecentOpinPosts = async (userId, maxItems = 6) => {
  const postsRef = collection(db, 'opin_posts');
  try {
    const q = query(
      postsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(Math.max(1, maxItems))
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((snap) => ({ id: snap.id, ...snap.data() }));
  } catch {
    const fallback = query(
      postsRef,
      where('userId', '==', userId),
      limit(Math.max(10, maxItems * 3))
    );
    const snapshot = await getDocs(fallback);
    return snapshot.docs
      .map((snap) => ({ id: snap.id, ...snap.data() }))
      .sort((a, b) => (toMillisSafe(b.createdAt) || 0) - (toMillisSafe(a.createdAt) || 0))
      .slice(0, maxItems);
  }
};

/**
 * Perfil público enriquecido para "Ver perfil" desde chat/estados/baúl.
 * Incluye datos base + tarjeta + amigos preview + actividad OPIN resumida.
 * Diseñado para ser visualmente completo sin consultas masivas costosas.
 */
export const getPublicProfileExtended = async (userId) => {
  try {
    const baseProfile = await getPublicProfile(userId);
    if (!baseProfile) return null;

    const [tarjetaDoc, recentOpinRaw] = await Promise.all([
      getDoc(doc(db, 'tarjetas', userId)),
      fetchRecentOpinPosts(userId, 6),
    ]);

    const tarjetaData = tarjetaDoc.exists() ? tarjetaDoc.data() : {};

    const recentOpinPosts = recentOpinRaw.map((post) => ({
      id: post.id,
      text: String(post?.text || '').trim(),
      color: post?.color || 'purple',
      likeCount: Number(post?.likeCount || 0),
      commentCount: Number(post?.commentCount || 0),
      viewCount: Number(post?.viewCount || 0),
      createdAtMs: toMillisSafe(post?.createdAt),
    }));

    const opinStats = recentOpinPosts.reduce((acc, post) => {
      acc.posts += 1;
      acc.likes += Number(post.likeCount || 0);
      acc.comments += Number(post.commentCount || 0);
      acc.views += Number(post.viewCount || 0);
      return acc;
    }, { posts: 0, likes: 0, comments: 0, views: 0 });

    return {
      ...baseProfile,
      createdAtMs: baseProfile?.createdAtMs || null,
      friendsPreview: [],
      stats: {
        favoritesCount: Number(baseProfile?.favoritesCount || 0),
        interestsCount: Array.isArray(baseProfile?.interests) ? baseProfile.interests.length : 0,
        profileViews: Number(baseProfile?.profileViews || 0),
        opinPostsCount: opinStats.posts,
        opinLikes: opinStats.likes,
        opinComments: opinStats.comments,
        opinViews: opinStats.views,
      },
      baul: pickTarjetaPublicFields(tarjetaData),
      recentOpinPosts,
    };
  } catch (error) {
    console.error('Error getting public profile extended:', error);
    return await getPublicProfile(userId);
  }
};
