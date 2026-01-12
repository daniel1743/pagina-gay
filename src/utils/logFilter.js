/**
 * 🔇 Filtro de Logs - Solo mostrar logs importantes de delivery
 *
 * Comportamiento:
 * - PRODUCCIÓN: Solo errores críticos (sin logs de debugging)
 * - DESARROLLO: Todos los logs (a menos que uses ?logs= en URL)
 *
 * Uso manual: Agrega ?logs=delivery a la URL para ver solo logs de entrega
 */

// ⚡ Detectar si estamos en producción
const isProduction = import.meta.env.PROD;

// Detectar modo de logs desde URL
const params = new URLSearchParams(window.location.search);
const logMode = params.get('logs'); // ?logs=delivery o ?logs=minimal o ?logs=all

// ⚡ En producción, forzar modo silencioso (a menos que se especifique lo contrario)
const effectiveLogMode = isProduction && !logMode ? 'production' : logMode;

// Original console methods
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

// Palabras clave importantes
const importantKeywords = [
  '[DELIVERY]',
  '[SEND]',
  '[RECEIVE]',
  'ACK',
  '📤',
  '📥',
  '✓✓',
  '📬',
  'Mensaje enviado',
  'Mensaje recibido',
  'entregado',
];

// Palabras clave a silenciar
const silenceKeywords = [
  'chunk-',
  '[CHAT PAGE]',
  '[SOUNDS]',
  'AudioContext',
  'Fetch error',
  '[AGE VERIFICATION]',
  '[TIMING]',
  'useEffect',
  'Usuario no disponible',
  '[FIREBASE]',
  '[MAIN]',
  '[APP ROUTES]',
  'seedConversations',
  'Error Logger',
  'IndexedDB',  // ⚡ Suprimir warnings de IndexedDB (heartbeat de Firebase, no-crítico)
  'idb-set',    // ⚡ Suprimir warnings de IndexedDB write errors
];

// ⚡ Palabras clave a silenciar SOLO EN PRODUCCIÓN
const productionSilenceKeywords = [
  '[PERFORMANCE]',
  '[CHAT SERVICE]',
  '[AUTH]',
  '[PRESENCE]',
  '[TRACE',
  '🔄 [TRACE',
  '📊',
  '✅ [',
  '⚡',
  '🔍',
  '📥',
  '📤',
  'Monitor iniciado',
  'Configurando onSnapshot',
  'Snapshot recibido',
  'onAuthStateChanged',
  'Round-trip',
  'clientId',
];

function shouldShowLog(args) {
  const message = args.join(' ');

  // ⚡ MODO PRODUCCIÓN: Silenciar logs de debugging
  if (effectiveLogMode === 'production') {
    // Silenciar todos los logs de debugging
    if (productionSilenceKeywords.some(keyword => message.includes(keyword))) {
      return false;
    }
    // Silenciar ruido general
    if (silenceKeywords.some(keyword => message.includes(keyword))) {
      return false;
    }
    // Solo mostrar logs críticos (errores de usuario, warnings importantes)
    return true;
  }

  // Sin modo de logs: mostrar todo (comportamiento por defecto en desarrollo)
  if (!effectiveLogMode) return true;

  // Modo all: mostrar todo
  if (effectiveLogMode === 'all') return true;

  // Modo delivery: solo logs de delivery
  if (effectiveLogMode === 'delivery') {
    return importantKeywords.some(keyword => message.includes(keyword));
  }

  // Modo minimal: ocultar ruido pero mostrar importantes
  if (effectiveLogMode === 'minimal') {
    // Mostrar logs importantes PRIMERO
    if (importantKeywords.some(keyword => message.includes(keyword))) {
      return true;
    }

    // Silenciar logs conocidos como ruido
    if (silenceKeywords.some(keyword => message.includes(keyword))) {
      return false;
    }

    // Por defecto: mostrar
    return true;
  }

  return true;
}

// Override console methods
if (typeof window !== 'undefined') {
  console.log = (...args) => {
    if (shouldShowLog(args)) {
      originalLog.apply(console, args);
    }
  };

  console.warn = (...args) => {
    if (shouldShowLog(args)) {
      originalWarn.apply(console, args);
    }
  };

  // Errores siempre se muestran
  console.error = (...args) => {
    originalError.apply(console, args);
  };

  // Agregar helper global para cambiar modo
  window.setLogMode = (mode) => {
    const url = new URL(window.location.href);
    url.searchParams.set('logs', mode);
    window.location.href = url.toString();
  };

  // Info inicial
  if (isProduction) {
    // ⚡ En producción: informar que los logs están filtrados
    originalLog(`
╔════════════════════════════════════════════════════════════╗
║         🚀 MODO PRODUCCIÓN - Logs filtrados                ║
╠════════════════════════════════════════════════════════════╣
║ Solo se muestran logs críticos de usuario                 ║
║ Logs de debugging/performance están ocultos               ║
║                                                            ║
║ Para ver todos los logs: ?logs=all en URL                 ║
╚════════════════════════════════════════════════════════════╝
    `);
  } else if (effectiveLogMode) {
    // En desarrollo con filtro manual activado
    originalLog(`
╔════════════════════════════════════════════════════════════╗
║              🔇 FILTRO DE LOGS ACTIVADO                    ║
╠════════════════════════════════════════════════════════════╣
║ Modo actual: ${effectiveLogMode.toUpperCase().padEnd(45)} ║
║                                                            ║
║ Comandos disponibles:                                      ║
║ • setLogMode('delivery')  - Solo logs de entrega          ║
║ • setLogMode('minimal')   - Logs mínimos                  ║
║ • setLogMode('all')       - Todos los logs                ║
╚════════════════════════════════════════════════════════════╝
    `);
  }
}

export { logMode, effectiveLogMode, isProduction };
