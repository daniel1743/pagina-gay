import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';

/**
 * Crea o actualiza el perfil de usuario en Firestore
 */
export const createUserProfile = async (uid, userData) => {
  try {
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
 */
export const updateUserProfile = async (uid, updates) => {
  try {
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
