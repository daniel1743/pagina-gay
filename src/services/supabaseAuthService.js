/**
 * 🔵 SERVICIO DE AUTENTICACIÓN CON SUPABASE
 * 
 * Servicio para manejar autenticación usando Supabase
 * Equivalente a Firebase Auth pero con Supabase
 */

import { supabase } from '@/config/supabase';

const ensureSupabaseAuth = () => {
  if (!supabase?.auth) {
    throw new Error('SUPABASE_DISABLED_USE_FIREBASE');
  }
  return supabase.auth;
};

/**
 * Registrar nuevo usuario con email y contraseña
 */
export const signUpWithEmail = async (email, password, userData = {}) => {
  try {
    const auth = ensureSupabaseAuth();
    const { data, error } = await auth.signUp({
      email,
      password,
      options: {
        data: userData, // Datos adicionales del usuario
      },
    });

    if (error) {
      console.error('Error en signUp:', error);
      throw error;
    }

    return { user: data.user, session: data.session, error: null };
  } catch (error) {
    return { user: null, session: null, error };
  }
};

/**
 * Iniciar sesión con email y contraseña
 */
export const signInWithEmail = async (email, password) => {
  try {
    const auth = ensureSupabaseAuth();
    const { data, error } = await auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Error en signIn:', error);
      throw error;
    }

    return { user: data.user, session: data.session, error: null };
  } catch (error) {
    return { user: null, session: null, error };
  }
};

/**
 * Iniciar sesión como invitado (anónimo)
 */
export const signInAnonymously = async (userData = {}) => {
  try {
    const auth = ensureSupabaseAuth();
    const { data, error } = await auth.signInAnonymously({
      options: {
        data: userData,
      },
    });

    if (error) {
      console.error('Error en signInAnonymously:', error);
      throw error;
    }

    return { user: data.user, session: data.session, error: null };
  } catch (error) {
    return { user: null, session: null, error };
  }
};

/**
 * Cerrar sesión
 */
export const signOut = async () => {
  try {
    const auth = ensureSupabaseAuth();
    const { error } = await auth.signOut();
    
    if (error) {
      console.error('Error en signOut:', error);
      throw error;
    }

    return { error: null };
  } catch (error) {
    return { error };
  }
};

/**
 * Obtener usuario actual
 */
export const getCurrentUser = async () => {
  try {
    const auth = ensureSupabaseAuth();
    const { data: { user }, error } = await auth.getUser();
    
    if (error) {
      console.error('Error obteniendo usuario:', error);
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error en getCurrentUser:', error);
    return null;
  }
};

/**
 * Obtener sesión actual
 */
export const getCurrentSession = async () => {
  try {
    const auth = ensureSupabaseAuth();
    const { data: { session }, error } = await auth.getSession();
    
    if (error) {
      console.error('Error obteniendo sesión:', error);
      return null;
    }

    return session;
  } catch (error) {
    console.error('Error en getCurrentSession:', error);
    return null;
  }
};

/**
 * Escuchar cambios en el estado de autenticación
 */
export const onAuthStateChanged = (callback) => {
  try {
    const auth = ensureSupabaseAuth();
    return auth.onAuthStateChange((event, session) => {
      callback(session?.user || null, event);
    });
  } catch {
    callback?.(null, 'SUPABASE_DISABLED_USE_FIREBASE');
    return () => {};
  }
};

/**
 * Actualizar perfil del usuario
 */
export const updateUserProfile = async (updates) => {
  try {
    const auth = ensureSupabaseAuth();
    const { data, error } = await auth.updateUser({
      data: updates,
    });

    if (error) {
      console.error('Error actualizando perfil:', error);
      throw error;
    }

    return { user: data.user, error: null };
  } catch (error) {
    return { user: null, error };
  }
};

/**
 * Cambiar contraseña
 */
export const updatePassword = async (newPassword) => {
  try {
    const auth = ensureSupabaseAuth();
    const { data, error } = await auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error('Error actualizando contraseña:', error);
      throw error;
    }

    return { user: data.user, error: null };
  } catch (error) {
    return { user: null, error };
  }
};

/**
 * Enviar email de recuperación de contraseña
 */
export const resetPassword = async (email) => {
  try {
    const auth = ensureSupabaseAuth();
    const { data, error } = await auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      console.error('Error enviando email de recuperación:', error);
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export default {
  signUpWithEmail,
  signInWithEmail,
  signInAnonymously,
  signOut,
  getCurrentUser,
  getCurrentSession,
  onAuthStateChanged,
  updateUserProfile,
  updatePassword,
  resetPassword,
};


