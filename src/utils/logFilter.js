/**
 * 🔇 Filtro de Logs - Solo mostrar logs importantes de delivery
 *
 * Uso: Agrega ?logs=delivery a la URL para ver solo logs de entrega
 */

// Detectar modo de logs desde URL
const params = new URLSearchParams(window.location.search);
const logMode = params.get('logs'); // ?logs=delivery o ?logs=minimal o ?logs=all

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

function shouldShowLog(args) {
  const message = args.join(' ');

  // Sin modo de logs: mostrar todo (comportamiento por defecto)
  if (!logMode) return true;

  // Modo all: mostrar todo
  if (logMode === 'all') return true;

  // Modo delivery: solo logs de delivery
  if (logMode === 'delivery') {
    return importantKeywords.some(keyword => message.includes(keyword));
  }

  // Modo minimal: ocultar ruido pero mostrar importantes
  if (logMode === 'minimal') {
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
  if (logMode) {
    originalLog(`
╔════════════════════════════════════════════════════════════╗
║              🔇 FILTRO DE LOGS ACTIVADO                    ║
╠════════════════════════════════════════════════════════════╣
║ Modo actual: ${logMode.toUpperCase().padEnd(45)} ║
║                                                            ║
║ Comandos disponibles:                                      ║
║ • setLogMode('delivery')  - Solo logs de entrega          ║
║ • setLogMode('minimal')   - Logs mínimos (por defecto)    ║
║ • setLogMode('all')       - Todos los logs                ║
╚════════════════════════════════════════════════════════════╝
    `);
  }
}

export { logMode };
