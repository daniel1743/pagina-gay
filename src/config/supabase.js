/**
 * 🔵 CONFIGURACIÓN DE SUPABASE
 *
 * Configuración centralizada para Supabase
 * Equivalente a src/config/firebase.js pero para Supabase
 */

import { createClient } from '@supabase/supabase-js';

// ⚠️ Validar variables de entorno (OPCIONAL - no rompe la app si faltan)
const requiredEnvVars = {
  VITE_ENABLE_SUPABASE: import.meta.env.VITE_ENABLE_SUPABASE,
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => key !== 'VITE_ENABLE_SUPABASE' && !value)
  .map(([key]) => key);

const supabaseEnabledByFlag = String(requiredEnvVars.VITE_ENABLE_SUPABASE || '').toLowerCase() === 'true';

if (missingVars.length > 0) {
  const errorMessage = `⚠️ [SUPABASE] Variables faltantes: ${missingVars.join(', ')}`;
  console.warn(errorMessage);
  console.warn('⚠️ [SUPABASE] La app funcionará sin Supabase (solo Firebase)');

  // ⚠️ NO ROMPER LA APP - Solo advertir en consola
  // La funcionalidad de Supabase estará deshabilitada pero Firebase funcionará
}

// Configuración de Supabase desde variables de entorno
const supabaseConfig = {
  url: requiredEnvVars.VITE_SUPABASE_URL,
  anonKey: requiredEnvVars.VITE_SUPABASE_ANON_KEY,
};

// ✅ Inicializar cliente de Supabase SOLO si las variables existen
let supabase = null;

if (!supabaseEnabledByFlag) {
  console.warn('⚠️ [SUPABASE] Deshabilitado por flag (VITE_ENABLE_SUPABASE!=true). Firebase sigue activo.');
} else if (supabaseConfig.url && supabaseConfig.anonKey) {
  supabase = createClient(
    supabaseConfig.url,
    supabaseConfig.anonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window?.localStorage,
        storageKey: 'supabase.auth.token',
      },
      global: {
        headers: {
          'x-client-info': 'chactivo-web',
        },
      },
    }
  );
} else {
  console.warn('⚠️ [SUPABASE] Cliente no inicializado - Variables faltantes');
}

export { supabase };

// Verificar conexión en desarrollo (solo si Supabase está configurado)
if (import.meta.env.DEV && supabase) {
  console.log('✅ [SUPABASE] ========================================');
  console.log('✅ [SUPABASE] Cliente inicializado');
  console.log('✅ [SUPABASE] URL:', supabaseConfig.url);
  console.log('✅ [SUPABASE] Auth persistente: localStorage');
  console.log('✅ [SUPABASE] ========================================');

  // Verificar conexión
  supabase
    .from('_health')
    .select('*')
    .limit(1)
    .then(() => {
      console.log('✅ [SUPABASE] Conexión verificada');
    })
    .catch((error) => {
      console.warn('⚠️ [SUPABASE] No se pudo verificar conexión (puede ser normal):', error.message);
    });
}

// Exportar servicios individuales para compatibilidad con código existente
// ⚠️ Pueden ser null si Supabase no está configurado
export const auth = supabase?.auth || null;
export const db = supabase || null;
export const storage = supabase?.storage || null;

// Helper para verificar si Supabase está configurado
export const isSupabaseConfigured = () => {
  return !!supabase && !!supabaseConfig.url && !!supabaseConfig.anonKey && supabaseEnabledByFlag;
};

export const isSupabaseEnabled = () => supabaseEnabledByFlag;

// Helper para obtener el usuario actual
export const getCurrentUser = async () => {
  if (!supabase) {
    console.warn('⚠️ [SUPABASE] Cliente no disponible');
    return null;
  }
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error obteniendo usuario:', error);
    return null;
  }
  return user;
};

// Helper para verificar autenticación
export const isAuthenticated = async () => {
  if (!supabase) return false;
  const user = await getCurrentUser();
  return !!user;
};

export default supabase;


