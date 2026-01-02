/**
 * 🔍 ERROR LOGGER - Sistema de detección de errores para F12
 * Captura errores silenciosos de React, hooks, y renderizado
 */

// Capturar errores globales
window.addEventListener('error', (event) => {
  // ✅ Filtrar AbortError de Firebase (cancelaciones normales)
  if (event.error?.name === 'AbortError' || 
      event.message?.includes('AbortError') ||
      event.error?.message?.includes('signal is aborted')) {
    return; // Ignorar silenciosamente
  }

  console.error('🚨 [ERROR GLOBAL]:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
    stack: event.error?.stack
  });
});

// Capturar rechazos de promesas no manejados
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const reasonStr = reason ? String(reason) : '';
  
  // ✅ Filtrar AbortError de Firebase (cancelaciones normales)
  if (reason?.name === 'AbortError' || 
      reasonStr.includes('AbortError') ||
      reasonStr.includes('signal is aborted')) {
    event.preventDefault(); // Prevenir que se muestre en consola
    return;
  }

  console.error('🚨 [PROMISE REJECTION]:', {
    reason: event.reason,
    promise: event.promise
  });
});

// Interceptar console.error para capturar errores de React
const originalError = console.error;
console.error = function(...args) {
  // ✅ Filtrar AbortError de Firebase (cancelaciones normales)
  const errorString = args.join(' ');
  if (errorString.includes('AbortError') || 
      errorString.includes('signal is aborted')) {
    return; // Ignorar silenciosamente
  }

  // Detectar errores de React
  if (errorString.includes('React') ||
      errorString.includes('hook') ||
      errorString.includes('component') ||
      errorString.includes('render')) {
    console.log('🔴 [REACT ERROR DETECTED]:', args);
  }

  // Llamar al original
  originalError.apply(console, args);
};

// Logger de renderizado de componentes
export const logRender = (componentName, props = {}) => {
  console.log(`✅ [RENDER] ${componentName}`, {
    timestamp: new Date().toISOString(),
    props: Object.keys(props)
  });
};

// Logger de hooks
export const logHook = (hookName, value) => {
  console.log(`🎣 [HOOK] ${hookName}:`, value);
};

// Logger de errores custom
export const logError = (context, error) => {
  console.error(`❌ [${context}]:`, {
    message: error.message,
    stack: error.stack,
    error
  });
};

console.log('🔍 Error Logger initialized - All errors will appear in F12 Console');
