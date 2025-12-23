import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';

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
    const usersRef = collection(db, 'users');
    
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
    // ✅ VALIDAR: Verificar que el username sea único
    const isAvailable = await checkUsernameAvailability(userData.username);
    if (!isAvailable) {
      throw new Error('Este nombre de usuario ya está en uso. Por favor elige otro.');
    }

    const userRef = doc(db, 'users', uid);

    const userProfile = {
      id: uid,
      username: userData.username,
      email: userData.email,
      age: userData.age ? parseInt(userData.age) : null,
      phone: userData.phone || null,
      isPremium: false,
      verified: false,
      isGuest: false,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}`,
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

    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...updates,
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
