/**
 * 🔍 ERROR LOGGER - Sistema de detección de errores para F12
 * Captura errores silenciosos de React, hooks, y renderizado
 */

// Capturar errores globales
window.addEventListener('error', (event) => {
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
  console.error('🚨 [PROMISE REJECTION]:', {
    reason: event.reason,
    promise: event.promise
  });
});

// Interceptar console.error para capturar errores de React
const originalError = console.error;
console.error = function(...args) {
  // Detectar errores de React
  const errorString = args.join(' ');

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
