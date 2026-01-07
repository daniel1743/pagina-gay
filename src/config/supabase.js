/**
 * 🔵 CONFIGURACIÓN DE SUPABASE
 * 
 * Configuración centralizada para Supabase
 * Equivalente a src/config/firebase.js pero para Supabase
 */

import { createClient } from '@supabase/supabase-js';

// Validar variables de entorno críticas
const requiredEnvVars = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  const errorMessage = `❌ ERROR: Faltan variables de entorno de Supabase:\n${missingVars.join('\n')}\n\nPor favor, crea un archivo .env con estas variables.`;
  console.error(errorMessage);
  
  // En desarrollo, mostrar alerta
  if (import.meta.env.DEV) {
    alert(errorMessage);
  }
  
  throw new Error(`Variables de entorno de Supabase faltantes: ${missingVars.join(', ')}`);
}

// Configuración de Supabase desde variables de entorno
const supabaseConfig = {
  url: requiredEnvVars.VITE_SUPABASE_URL,
  anonKey: requiredEnvVars.VITE_SUPABASE_ANON_KEY,
};

// Inicializar cliente de Supabase
export const supabase = createClient(
  supabaseConfig.url,
  supabaseConfig.anonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // Usar localStorage en vez de sessionStorage para persistencia
      storage: window.localStorage,
      storageKey: 'supabase.auth.token',
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
    global: {
      headers: {
        'x-client-info': 'chactivo-web',
      },
    },
  }
);

// Verificar conexión en desarrollo
if (import.meta.env.DEV) {
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
export const auth = supabase.auth;
export const db = supabase;
export const storage = supabase.storage;

// Helper para verificar si Supabase está configurado
export const isSupabaseConfigured = () => {
  return !!supabaseConfig.url && !!supabaseConfig.anonKey;
};

// Helper para obtener el usuario actual
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error obteniendo usuario:', error);
    return null;
  }
  return user;
};

// Helper para verificar autenticación
export const isAuthenticated = async () => {
  const user = await getCurrentUser();
  return !!user;
};

export default supabase;


