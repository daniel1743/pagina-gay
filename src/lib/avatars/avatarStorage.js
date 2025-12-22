import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/config/firebase';

/**
 * Servicio de almacenamiento de selección de avatar
 * Guarda en Firebase Firestore (y fallback a localStorage)
 */

/**
 * Guarda la selección de avatar del usuario
 * @param {object} avatarData - Datos del avatar seleccionado { id, seed, style, svg }
 * @param {string} userId - ID del usuario (opcional, usa auth.currentUser si no se provee)
 * @returns {Promise<boolean>} true si se guardó exitosamente
 */
export const saveAvatarSelection = async (avatarData, userId = null) => {
  try {
    const currentUserId = userId || auth.currentUser?.uid;
    
    if (!currentUserId) {
      // Fallback a localStorage si no hay usuario autenticado
      console.warn('No hay usuario autenticado, guardando en localStorage');
      const avatarDataLocal = {
        seed: avatarData.seed,
        style: avatarData.style,
        svg: avatarData.svg,
        id: avatarData.id,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem('user_avatar', JSON.stringify(avatarDataLocal));
      return true;
    }

    // Guardar en Firestore
    const userRef = doc(db, 'users', currentUserId);
    
    // Actualizar perfil del usuario con la selección de avatar
    await updateDoc(userRef, {
      avatar: avatarData.svg, // Guardar SVG completo
      avatarSeed: avatarData.seed,
      avatarStyle: avatarData.style,
      avatarId: avatarData.id,
      updatedAt: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error('Error guardando selección de avatar:', error);
    
    // Fallback a localStorage en caso de error
    try {
      const avatarDataLocal = {
        seed: avatarData.seed,
        style: avatarData.style,
        svg: avatarData.svg,
        id: avatarData.id,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem('user_avatar', JSON.stringify(avatarDataLocal));
      return true;
    } catch (localError) {
      console.error('Error guardando en localStorage:', localError);
      return false;
    }
  }
};

/**
 * Carga la selección de avatar del usuario
 * @param {string} userId - ID del usuario (opcional)
 * @returns {Promise<object|null>} Datos del avatar o null si no existe
 */
export const loadAvatarSelection = async (userId = null) => {
  try {
    const currentUserId = userId || auth.currentUser?.uid;
    
    if (!currentUserId) {
      // Cargar desde localStorage si no hay usuario
      const stored = localStorage.getItem('user_avatar');
      if (stored) {
        return JSON.parse(stored);
      }
      return null;
    }

    // Cargar desde Firestore
    const userRef = doc(db, 'users', currentUserId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      
      // Si tiene avatarSeed y avatarStyle, reconstruir objeto
      if (userData.avatarSeed && userData.avatarStyle) {
        return {
          id: userData.avatarId || null,
          seed: userData.avatarSeed,
          style: userData.avatarStyle,
          svg: userData.avatar || null,
          updatedAt: userData.updatedAt?.toDate?.()?.toISOString() || null,
        };
      }
      
      // Si solo tiene avatar (URL o SVG), intentar extraer información
      if (userData.avatar) {
        return {
          id: null,
          seed: userData.username || 'default',
          style: 'avataaars',
          svg: userData.avatar,
          updatedAt: null,
        };
      }
    }

    // Fallback a localStorage
    const stored = localStorage.getItem('user_avatar');
    if (stored) {
      return JSON.parse(stored);
    }

    return null;
  } catch (error) {
    console.error('Error cargando selección de avatar:', error);
    
    // Fallback a localStorage
    try {
      const stored = localStorage.getItem('user_avatar');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (localError) {
      console.error('Error cargando de localStorage:', localError);
    }
    
    return null;
  }
};

