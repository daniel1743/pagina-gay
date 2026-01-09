/**
 * Performance Monitor - Sistema de evaluación de velocidad
 *
 * Mide tiempos críticos de la aplicación:
 * 1. Carga del landing
 * 2. Apertura del modal
 * 3. Entrada a sala
 * 4. Carga de la sala
 * 5. Envío y recepción de mensajes
 *
 * Uso:
 * - Activar: window.enablePerformanceMonitor()
 * - Desactivar: window.disablePerformanceMonitor()
 * - Ver métricas: window.getPerformanceMetrics()
 */

const STORAGE_KEY = 'chactivo_performance_monitor_enabled';
const METRICS_KEY = 'chactivo_performance_metrics';

// Colores para logs
const COLORS = {
  enabled: '#00ff00',
  disabled: '#ff6600',
  timing: '#00bfff',
  success: '#00ff00',
  warning: '#ffaa00',
  error: '#ff0000',
  metric: '#ff00ff',
};

// Métricas almacenadas
let metrics = {
  landingLoad: [],
  modalOpen: [],
  chatEntry: [],
  chatLoad: [],
  messageSent: [],
  messageReceived: [],
  messageRoundtrip: [],
};

// Tiempos temporales para cálculos
let timers = {};

/**
 * Verifica si el monitor está habilitado
 */
export function isPerformanceMonitorEnabled() {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

/**
 * Habilitar el monitor de performance
 */
export function enablePerformanceMonitor() {
  localStorage.setItem(STORAGE_KEY, 'true');
  console.log(
    `%c🚀 PERFORMANCE MONITOR ACTIVADO`,
    `color: ${COLORS.enabled}; font-weight: bold; font-size: 14px; background: #000; padding: 4px 8px; border-radius: 4px;`
  );
  console.log(
    `%cSe medirán los siguientes eventos:
    ✅ Carga del landing
    ✅ Apertura del modal
    ✅ Entrada a sala
    ✅ Carga de la sala
    ✅ Envío de mensajes
    ✅ Recepción de mensajes

    Para ver métricas: window.getPerformanceMetrics()
    Para desactivar: window.disablePerformanceMonitor()`,
    'color: #888; font-size: 12px;'
  );
}

/**
 * Deshabilitar el monitor de performance
 */
export function disablePerformanceMonitor() {
  localStorage.setItem(STORAGE_KEY, 'false');
  console.log(
    `%c⏸️ PERFORMANCE MONITOR DESACTIVADO`,
    `color: ${COLORS.disabled}; font-weight: bold; font-size: 14px; background: #000; padding: 4px 8px; border-radius: 4px;`
  );
}

/**
 * Iniciar medición de un evento
 */
export function startTiming(eventName) {
  if (!isPerformanceMonitorEnabled()) return;

  timers[eventName] = performance.now();
  console.log(
    `%c⏱️ [${eventName}] Iniciando medición...`,
    `color: ${COLORS.timing}; font-weight: bold;`
  );
}

/**
 * Finalizar medición de un evento
 */
export function endTiming(eventName, metadata = {}) {
  if (!isPerformanceMonitorEnabled()) return;

  if (!timers[eventName]) {
    console.warn(`⚠️ No se encontró timer para: ${eventName}`);
    return;
  }

  const duration = performance.now() - timers[eventName];
  delete timers[eventName];

  // Guardar métrica (usar eventName directamente, ya está en camelCase)
  if (metrics[eventName]) {
    metrics[eventName].push({
      duration,
      timestamp: new Date().toISOString(),
      ...metadata,
    });
  }

  // Determinar color según duración
  let color = COLORS.success;
  let emoji = '✅';
  let status = 'EXCELENTE';

  if (duration > 3000) {
    color = COLORS.error;
    emoji = '❌';
    status = 'MUY LENTO';
  } else if (duration > 1000) {
    color = COLORS.warning;
    emoji = '⚠️';
    status = 'LENTO';
  } else if (duration > 500) {
    color = COLORS.timing;
    emoji = '🔵';
    status = 'ACEPTABLE';
  }

  console.log(
    `%c${emoji} [${eventName}] ${duration.toFixed(2)}ms - ${status}`,
    `color: ${color}; font-weight: bold; font-size: 13px;`,
    metadata
  );

  return duration;
}

/**
 * Medir evento instantáneo (sin start/end)
 */
export function trackEvent(eventName, duration, metadata = {}) {
  if (!isPerformanceMonitorEnabled()) return;

  // Guardar métrica (usar eventName directamente, ya está en camelCase)
  if (metrics[eventName]) {
    metrics[eventName].push({
      duration,
      timestamp: new Date().toISOString(),
      ...metadata,
    });
  }

  // Determinar color según duración
  let color = COLORS.success;
  let emoji = '✅';
  let status = 'EXCELENTE';

  if (duration > 3000) {
    color = COLORS.error;
    emoji = '❌';
    status = 'MUY LENTO';
  } else if (duration > 1000) {
    color = COLORS.warning;
    emoji = '⚠️';
    status = 'LENTO';
  } else if (duration > 500) {
    color = COLORS.timing;
    emoji = '🔵';
    status = 'ACEPTABLE';
  }

  console.log(
    `%c${emoji} [${eventName}] ${duration.toFixed(2)}ms - ${status}`,
    `color: ${color}; font-weight: bold; font-size: 13px;`,
    metadata
  );
}

/**
 * Obtener métricas completas
 */
export function getPerformanceMetrics() {
  console.log(
    `%c📊 PERFORMANCE METRICS`,
    `color: ${COLORS.metric}; font-weight: bold; font-size: 16px; background: #000; padding: 6px 12px; border-radius: 4px;`
  );

  const summary = {};

  Object.keys(metrics).forEach((key) => {
    const data = metrics[key];
    if (data.length === 0) return;

    const durations = data.map(m => m.duration);
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);

    summary[key] = {
      count: data.length,
      avg: avg.toFixed(2) + 'ms',
      min: min.toFixed(2) + 'ms',
      max: max.toFixed(2) + 'ms',
      samples: data,
    };

    console.log(
      `%c📈 ${key}:`,
      'color: #00bfff; font-weight: bold; font-size: 14px;',
      `\n  Muestras: ${data.length}`,
      `\n  Promedio: ${avg.toFixed(2)}ms`,
      `\n  Mínimo: ${min.toFixed(2)}ms`,
      `\n  Máximo: ${max.toFixed(2)}ms`
    );
  });

  return summary;
}

/**
 * Limpiar todas las métricas
 */
export function clearPerformanceMetrics() {
  metrics = {
    landingLoad: [],
    modalOpen: [],
    chatEntry: [],
    chatLoad: [],
    messageSent: [],
    messageReceived: [],
    messageRoundtrip: [],
  };

  console.log(
    `%c🗑️ MÉTRICAS LIMPIADAS`,
    `color: ${COLORS.warning}; font-weight: bold;`
  );
}

/**
 * Exponer funciones globales para uso en consola
 */
if (typeof window !== 'undefined') {
  window.enablePerformanceMonitor = enablePerformanceMonitor;
  window.disablePerformanceMonitor = disablePerformanceMonitor;
  window.getPerformanceMetrics = getPerformanceMetrics;
  window.clearPerformanceMetrics = clearPerformanceMetrics;

  // Mostrar estado inicial
  if (isPerformanceMonitorEnabled()) {
    console.log(
      `%c⚡ Performance Monitor está ACTIVO`,
      `color: ${COLORS.enabled}; font-weight: bold;`
    );
  }
}

// Eventos específicos para medición

/**
 * 1. LANDING LOAD - Desde que se hace click en enlace hasta que landing carga
 */
export function trackLandingLoad() {
  if (!isPerformanceMonitorEnabled()) return;

  // Usar Navigation Timing API
  if (window.performance && window.performance.timing) {
    const timing = window.performance.timing;
    const loadTime = timing.loadEventEnd - timing.navigationStart;

    if (loadTime > 0) {
      trackEvent('landingLoad', loadTime, {
        type: 'page_load',
        url: window.location.href,
      });
    }
  }
}

/**
 * 2. MODAL OPEN - Desde click "ENTRAR GRATIS" hasta que modal aparece
 */
export function trackModalOpen(startTime) {
  if (!isPerformanceMonitorEnabled()) return;

  const duration = performance.now() - startTime;
  trackEvent('modalOpen', duration, {
    type: 'modal',
  });
}

/**
 * 3. CHAT ENTRY - Desde click "Continuar" en modal hasta entrar a sala
 */
export function trackChatEntry(startTime) {
  if (!isPerformanceMonitorEnabled()) return;

  const duration = performance.now() - startTime;
  trackEvent('chatEntry', duration, {
    type: 'navigation',
  });
}

/**
 * 4. CHAT LOAD - Desde que entra a sala hasta que sala está completamente cargada
 */
export function trackChatLoad(startTime) {
  if (!isPerformanceMonitorEnabled()) return;

  const duration = performance.now() - startTime;
  trackEvent('chatLoad', duration, {
    type: 'chat_ready',
  });
}

/**
 * 5. MESSAGE SENT - Tiempo de envío de mensaje
 */
export function trackMessageSent(startTime, messageId) {
  if (!isPerformanceMonitorEnabled()) return;

  const duration = performance.now() - startTime;
  trackEvent('messageSent', duration, {
    type: 'message',
    messageId,
  });
}

/**
 * 6. MESSAGE RECEIVED - Tiempo de recepción de mensaje
 */
export function trackMessageReceived(sentAt, messageId) {
  if (!isPerformanceMonitorEnabled()) return;

  const duration = Date.now() - sentAt;
  trackEvent('messageReceived', duration, {
    type: 'message',
    messageId,
  });
}

/**
 * 7. MESSAGE ROUNDTRIP - Tiempo completo de envío y recepción
 */
export function trackMessageRoundtrip(startTime, messageId) {
  if (!isPerformanceMonitorEnabled()) return;

  const duration = performance.now() - startTime;
  trackEvent('messageRoundtrip', duration, {
    type: 'message_roundtrip',
    messageId,
  });
}

// Exportar por defecto un objeto con todas las funciones
export default {
  isEnabled: isPerformanceMonitorEnabled,
  enable: enablePerformanceMonitor,
  disable: disablePerformanceMonitor,
  startTiming,
  endTiming,
  trackEvent,
  getMetrics: getPerformanceMetrics,
  clearMetrics: clearPerformanceMetrics,

  // Helpers específicos
  trackLandingLoad,
  trackModalOpen,
  trackChatEntry,
  trackChatLoad,
  trackMessageSent,
  trackMessageReceived,
  trackMessageRoundtrip,
};
