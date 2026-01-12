/**
 * 🚀 PERFORMANCE MONITOR - Sistema Completo de Evaluación de Velocidad
 * 
 * Mide tiempos críticos de TODOS los procesos de la aplicación:
 * - Carga de landing pages
 * - Apertura de modales
 * - Autenticación (entrar a sesión)
 * - Navegación entre páginas
 * - Carga de mensajes
 * - Envío de mensajes
 * - Recepción de mensajes
 * - Carga de componentes
 * 
 * ✅ SIEMPRE ACTIVO - No requiere activación manual
 * 📊 Muestra métricas en consola F12 con colores
 * 🎨 Genera resumen visual al final
 */

const STORAGE_KEY = 'chactivo_performance_monitor_enabled';
const SESSION_START_TIME = performance.now(); // Tiempo de inicio de sesión
const PAGE_START_TIME = performance.now(); // Tiempo de inicio de página actual

// Colores para logs
const COLORS = {
  enabled: '#00ff00',
  disabled: '#ff6600',
  timing: '#00bfff',
  success: '#00ff00',
  warning: '#ffaa00',
  error: '#ff0000',
  metric: '#ff00ff',
  info: '#00ffff',
  section: '#ff00ff',
};

// Métricas almacenadas
let metrics = {
  // Landing y navegación
  landingLoad: [],
  pageNavigation: [],
  componentMount: [],
  
  // Modales
  modalOpen: [],
  modalClose: [],
  
  // Autenticación
  guestAuth: [], // signInAsGuest completo
  authStateChange: [], // onAuthStateChanged
  userProfileLoad: [],
  
  // Chat
  chatEntry: [], // Desde modal hasta navegar a chat
  chatLoad: [], // Desde que entra a sala hasta que carga
  messagesLoad: [], // Carga inicial de mensajes
  messagesSubscription: [], // Tiempo hasta recibir primer mensaje
  
  // Mensajes
  messageSent: [],
  messageReceived: [],
  messageRoundtrip: [],
  
  // Interacciones
  buttonClick: [],
  formSubmit: [],
};

// Tiempos temporales para cálculos
let timers = {};
let eventSequence = []; // Secuencia de eventos para análisis

/**
 * ✅ SIEMPRE ACTIVO por defecto (para desarrollo y producción)
 */
export function isPerformanceMonitorEnabled() {
  // En desarrollo, siempre activo
  if (import.meta.env.DEV) return true;
  
  // En producción, verificar localStorage
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === null) {
    // Primera vez - activar por defecto
    localStorage.setItem(STORAGE_KEY, 'true');
    return true;
  }
  return stored === 'true';
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
  showWelcomeMessage();
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
 * Mensaje de bienvenida con instrucciones
 */
function showWelcomeMessage() {
  console.log(
    `%c📊 PERFORMANCE MONITOR - Sistema de Análisis de Velocidad`,
    `color: ${COLORS.info}; font-weight: bold; font-size: 16px; background: #000; padding: 8px 12px; border-radius: 4px;`
  );
  console.log(
    `%cSe están midiendo automáticamente:
    
    ✅ Carga de landing pages
    ✅ Apertura/cierre de modales
    ✅ Autenticación (signInAsGuest)
    ✅ Navegación entre páginas
    ✅ Carga de chat y mensajes
    ✅ Envío y recepción de mensajes
    ✅ Carga de componentes
    
    %cComandos disponibles:
    • window.showPerformanceSummary() - Ver resumen visual
    • window.getPerformanceMetrics() - Ver métricas en consola
    • window.clearPerformanceMetrics() - Limpiar métricas
    • window.enablePerformanceMonitor() - Activar
    • window.disablePerformanceMonitor() - Desactivar`,
    'color: #888; font-size: 12px; line-height: 1.6;',
    'color: #00ff00; font-size: 12px; font-weight: bold;'
  );
}

/**
 * Iniciar medición de un evento
 */
export function startTiming(eventName, metadata = {}) {
  if (!isPerformanceMonitorEnabled()) return null;

  const startTime = performance.now();
  timers[eventName] = startTime;
  
  eventSequence.push({
    type: 'start',
    eventName,
    timestamp: startTime - SESSION_START_TIME,
    metadata,
  });

  console.log(
    `%c⏱️ [${eventName}] Iniciando...`,
    `color: ${COLORS.timing}; font-weight: bold; font-size: 12px;`,
    metadata
  );

  return startTime;
}

/**
 * Finalizar medición de un evento
 */
export function endTiming(eventName, metadata = {}) {
  if (!isPerformanceMonitorEnabled()) return null;

  if (!timers[eventName]) {
    console.warn(`⚠️ No se encontró timer para: ${eventName}`);
    return null;
  }

  const duration = performance.now() - timers[eventName];
  delete timers[eventName];

  // Guardar métrica
  if (metrics[eventName]) {
    metrics[eventName].push({
      duration,
      timestamp: new Date().toISOString(),
      relativeTime: performance.now() - SESSION_START_TIME,
      ...metadata,
    });
  }

  eventSequence.push({
    type: 'end',
    eventName,
    duration,
    timestamp: performance.now() - SESSION_START_TIME,
    metadata,
  });

  // Determinar estado según duración
  const { color, emoji, status, rating } = getPerformanceStatus(duration);

  console.log(
    `%c${emoji} [${eventName}] ${duration.toFixed(2)}ms - ${status} ${rating}`,
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

  // Guardar métrica
  if (metrics[eventName]) {
    metrics[eventName].push({
      duration,
      timestamp: new Date().toISOString(),
      relativeTime: performance.now() - SESSION_START_TIME,
      ...metadata,
    });
  }

  eventSequence.push({
    type: 'event',
    eventName,
    duration,
    timestamp: performance.now() - SESSION_START_TIME,
    metadata,
  });

  const { color, emoji, status, rating } = getPerformanceStatus(duration);

  console.log(
    `%c${emoji} [${eventName}] ${duration.toFixed(2)}ms - ${status} ${rating}`,
    `color: ${color}; font-weight: bold; font-size: 13px;`,
    metadata
  );
}

/**
 * Determinar estado de rendimiento según duración
 */
function getPerformanceStatus(duration) {
  let color, emoji, status, rating;

  if (duration > 3000) {
    color = COLORS.error;
    emoji = '❌';
    status = 'MUY LENTO';
    rating = '⚠️';
  } else if (duration > 1000) {
    color = COLORS.warning;
    emoji = '⚠️';
    status = 'LENTO';
    rating = '🔶';
  } else if (duration > 500) {
    color = COLORS.timing;
    emoji = '🔵';
    status = 'ACEPTABLE';
    rating = '🔷';
  } else {
    color = COLORS.success;
    emoji = '✅';
    status = 'RÁPIDO';
    rating = '🟢';
  }

  return { color, emoji, status, rating };
}

/**
 * Obtener métricas completas con análisis
 */
export function getPerformanceMetrics() {
  console.log(
    `%c${'='.repeat(60)}`,
    `color: ${COLORS.section}; font-weight: bold;`
  );
  console.log(
    `%c📊 REPORTE DE PERFORMANCE - CHACTIVO`,
    `color: ${COLORS.metric}; font-weight: bold; font-size: 18px; background: #000; padding: 8px 16px; border-radius: 4px;`
  );
  console.log(
    `%c${'='.repeat(60)}`,
    `color: ${COLORS.section}; font-weight: bold;`
  );

  const summary = {};
  let totalEvents = 0;
  let slowEvents = 0;

  Object.keys(metrics).forEach((key) => {
    const data = metrics[key];
    if (data.length === 0) return;

    totalEvents += data.length;

    const durations = data.map(m => m.duration);
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);

    // Contar eventos lentos
    const slowCount = durations.filter(d => d > 1000).length;
    slowEvents += slowCount;

    summary[key] = {
      count: data.length,
      avg: avg.toFixed(2),
      min: min.toFixed(2),
      max: max.toFixed(2),
      slowCount,
      slowPercentage: ((slowCount / data.length) * 100).toFixed(1),
      samples: data,
    };

    const avgColor = avg > 1000 ? COLORS.error : avg > 500 ? COLORS.warning : COLORS.success;
    const slowColor = slowCount > 0 ? COLORS.error : COLORS.success;

    console.log(
      `%c📈 ${key.toUpperCase()}`,
      `color: ${COLORS.info}; font-weight: bold; font-size: 14px;`
    );
    console.log(
      `  Muestras: ${data.length} | Promedio: %c${avg.toFixed(2)}ms%c | Min: ${min.toFixed(2)}ms | Max: ${max.toFixed(2)}ms`,
      `color: ${avgColor}; font-weight: bold;`,
      'color: inherit;'
    );
    if (slowCount > 0) {
      console.log(
        `  %c⚠️ Eventos lentos (>1000ms): ${slowCount} (${((slowCount / data.length) * 100).toFixed(1)}%)`,
        `color: ${slowColor}; font-weight: bold;`
      );
    }
    console.log('');
  });

  // Resumen general
  const sessionDuration = ((performance.now() - SESSION_START_TIME) / 1000).toFixed(2);
  
  console.log(
    `%c${'='.repeat(60)}`,
    `color: ${COLORS.section}; font-weight: bold;`
  );
  console.log(
    `%c📊 RESUMEN GENERAL`,
    `color: ${COLORS.metric}; font-weight: bold; font-size: 16px;`
  );
  console.log(
    `  Tiempo total de sesión: ${sessionDuration}s
  Total de eventos: ${totalEvents}
  Eventos lentos: ${slowEvents > 0 ? '%c' + slowEvents + '%c' : '0'} (${totalEvents > 0 ? ((slowEvents / totalEvents) * 100).toFixed(1) : 0}%)`,
    slowEvents > 0 ? `color: ${COLORS.error}; font-weight: bold;` : '',
    'color: inherit;'
  );
  console.log(
    `%c${'='.repeat(60)}`,
    `color: ${COLORS.section}; font-weight: bold;`
  );

  return summary;
}

/**
 * Limpiar todas las métricas
 */
export function clearPerformanceMetrics() {
  metrics = {
    landingLoad: [],
    pageNavigation: [],
    componentMount: [],
    modalOpen: [],
    modalClose: [],
    guestAuth: [],
    authStateChange: [],
    userProfileLoad: [],
    chatEntry: [],
    chatLoad: [],
    messagesLoad: [],
    messagesSubscription: [],
    messageSent: [],
    messageReceived: [],
    messageRoundtrip: [],
    buttonClick: [],
    formSubmit: [],
  };
  
  timers = {};
  eventSequence = [];

  console.log(
    `%c🗑️ MÉTRICAS LIMPIADAS`,
    `color: ${COLORS.warning}; font-weight: bold; font-size: 14px;`
  );
}

/**
 * Mostrar resumen visual en pantalla
 */
export function showPerformanceSummary() {
  const summary = getPerformanceMetrics();
  
  // Crear componente visual
  createVisualSummary(summary);
}

/**
 * Crear componente visual flotante con resumen
 */
function createVisualSummary(summary) {
  // Remover resumen anterior si existe
  const existing = document.getElementById('chactivo-performance-summary');
  if (existing) existing.remove();

  const summaryDiv = document.createElement('div');
  summaryDiv.id = 'chactivo-performance-summary';
  summaryDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 400px;
    max-height: 80vh;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    border: 2px solid #667eea;
    border-radius: 12px;
    padding: 20px;
    color: white;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-size: 13px;
    z-index: 999999;
    box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    overflow-y: auto;
    backdrop-filter: blur(10px);
  `;

  // Header
  const header = document.createElement('div');
  header.style.cssText = 'margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid #667eea;';
  header.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <h2 style="margin: 0; color: #667eea; font-size: 18px; font-weight: bold;">
        📊 Performance Report
      </h2>
      <button id="close-summary" style="background: #ff4444; border: none; color: white; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-weight: bold;">
        ×
      </button>
    </div>
    <p style="margin: 8px 0 0 0; color: #aaa; font-size: 11px;">
      Tiempo de sesión: ${((performance.now() - SESSION_START_TIME) / 1000).toFixed(1)}s
    </p>
  `;
  summaryDiv.appendChild(header);

  // Métricas
  const metricsContainer = document.createElement('div');
  metricsContainer.style.cssText = 'display: flex; flex-direction: column; gap: 12px;';

  Object.keys(summary).forEach((key) => {
    const metric = summary[key];
    const avgNum = parseFloat(metric.avg);
    const avgColor = avgNum > 1000 ? '#ff4444' : avgNum > 500 ? '#ffaa00' : '#00ff00';
    
    const metricCard = document.createElement('div');
    metricCard.style.cssText = `
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      padding: 12px;
    `;
    
    metricCard.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <strong style="color: #00ffff; text-transform: capitalize;">${key.replace(/([A-Z])/g, ' $1').trim()}</strong>
        <span style="color: ${avgColor}; font-weight: bold; font-size: 14px;">
          ${metric.avg}ms
        </span>
      </div>
      <div style="display: flex; gap: 12px; font-size: 11px; color: #aaa;">
        <span>Muestras: ${metric.count}</span>
        <span>Min: ${metric.min}ms</span>
        <span>Max: ${metric.max}ms</span>
      </div>
      ${metric.slowCount > 0 ? `
        <div style="margin-top: 6px; padding: 4px 8px; background: rgba(255,68,68,0.2); border-radius: 4px; font-size: 11px; color: #ffaa00;">
          ⚠️ ${metric.slowCount} eventos lentos (${metric.slowPercentage}%)
        </div>
      ` : ''}
    `;
    
    metricsContainer.appendChild(metricCard);
  });

  summaryDiv.appendChild(metricsContainer);

  // Footer con acciones
  const footer = document.createElement('div');
  footer.style.cssText = 'margin-top: 16px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1); display: flex; gap: 8px;';
  footer.innerHTML = `
    <button id="refresh-summary" style="flex: 1; padding: 8px; background: #667eea; border: none; color: white; border-radius: 6px; cursor: pointer; font-weight: bold;">
      🔄 Actualizar
    </button>
    <button id="clear-summary" style="flex: 1; padding: 8px; background: #ff4444; border: none; color: white; border-radius: 6px; cursor: pointer; font-weight: bold;">
      🗑️ Limpiar
    </button>
  `;
  summaryDiv.appendChild(footer);

  document.body.appendChild(summaryDiv);

  // Event listeners
  document.getElementById('close-summary')?.addEventListener('click', () => {
    summaryDiv.remove();
  });

  document.getElementById('refresh-summary')?.addEventListener('click', () => {
    summaryDiv.remove();
    showPerformanceSummary();
  });

  document.getElementById('clear-summary')?.addEventListener('click', () => {
    clearPerformanceMetrics();
    summaryDiv.remove();
    showPerformanceSummary();
  });

  // Auto-cerrar después de 30 segundos (opcional)
  setTimeout(() => {
    if (document.getElementById('chactivo-performance-summary')) {
      summaryDiv.style.transition = 'opacity 0.5s';
      summaryDiv.style.opacity = '0.5';
    }
  }, 30000);
}

/**
 * Exponer funciones globales para uso en consola
 */
if (typeof window !== 'undefined') {
  window.enablePerformanceMonitor = enablePerformanceMonitor;
  window.disablePerformanceMonitor = disablePerformanceMonitor;
  window.getPerformanceMetrics = getPerformanceMetrics;
  window.clearPerformanceMetrics = clearPerformanceMetrics;
  window.showPerformanceSummary = showPerformanceSummary;
  window.startTiming = startTiming;
  window.endTiming = endTiming;

  // Activar automáticamente al cargar
  if (isPerformanceMonitorEnabled()) {
    showWelcomeMessage();
  }
}

// ============================================
// EVENTOS ESPECÍFICOS PARA MEDICIÓN
// ============================================

/**
 * 1. LANDING LOAD - Carga de landing page
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
        page: 'landing',
      });
    }
  } else {
    // Fallback: usar performance.now() si Navigation Timing no está disponible
    const loadTime = performance.now() - PAGE_START_TIME;
    trackEvent('landingLoad', loadTime, {
      type: 'page_load_fallback',
      url: window.location.href,
    });
  }
}

/**
 * 2. PAGE NAVIGATION - Navegación entre páginas
 */
export function trackPageNavigation(fromPage, toPage, duration) {
  if (!isPerformanceMonitorEnabled()) return;
  trackEvent('pageNavigation', duration, {
    from: fromPage,
    to: toPage,
  });
}

/**
 * 3. MODAL OPEN - Apertura de modal
 */
export function trackModalOpen(startTime) {
  if (!isPerformanceMonitorEnabled()) return;
  const duration = performance.now() - startTime;
  trackEvent('modalOpen', duration, {
    type: 'modal',
  });
}

/**
 * 4. MODAL CLOSE - Cierre de modal
 */
export function trackModalClose(startTime) {
  if (!isPerformanceMonitorEnabled()) return;
  const duration = performance.now() - startTime;
  trackEvent('modalClose', duration, {
    type: 'modal',
  });
}

/**
 * 5. GUEST AUTH - Autenticación de invitado (signInAsGuest completo)
 */
export function trackGuestAuth(startTime, metadata = {}) {
  if (!isPerformanceMonitorEnabled()) return;
  const duration = performance.now() - startTime;
  trackEvent('guestAuth', duration, {
    type: 'authentication',
    method: 'signInAsGuest',
    ...metadata,
  });
}

/**
 * 6. AUTH STATE CHANGE - Cambio de estado de autenticación
 */
export function trackAuthStateChange(startTime, metadata = {}) {
  if (!isPerformanceMonitorEnabled()) return;
  const duration = performance.now() - startTime;
  trackEvent('authStateChange', duration, {
    type: 'authentication',
    ...metadata,
  });
}

/**
 * 7. USER PROFILE LOAD - Carga de perfil de usuario
 */
export function trackUserProfileLoad(startTime, metadata = {}) {
  if (!isPerformanceMonitorEnabled()) return;
  const duration = performance.now() - startTime;
  trackEvent('userProfileLoad', duration, {
    type: 'profile',
    ...metadata,
  });
}

/**
 * 8. CHAT ENTRY - Desde click en modal hasta navegar a chat
 */
export function trackChatEntry(startTime) {
  if (!isPerformanceMonitorEnabled()) return;
  const duration = performance.now() - startTime;
  trackEvent('chatEntry', duration, {
    type: 'navigation',
  });
}

/**
 * 9. CHAT LOAD - Carga completa del chat (desde que entra hasta que está listo)
 */
export function trackChatLoad(startTime) {
  if (!isPerformanceMonitorEnabled()) return;
  const duration = performance.now() - startTime;
  trackEvent('chatLoad', duration, {
    type: 'chat_ready',
  });
}

/**
 * 10. MESSAGES LOAD - Carga inicial de mensajes
 */
export function trackMessagesLoad(startTime, messageCount = 0) {
  if (!isPerformanceMonitorEnabled()) return;
  const duration = performance.now() - startTime;
  trackEvent('messagesLoad', duration, {
    type: 'messages',
    count: messageCount,
  });
}

/**
 * 11. MESSAGES SUBSCRIPTION - Tiempo hasta recibir primer mensaje
 */
export function trackMessagesSubscription(startTime) {
  if (!isPerformanceMonitorEnabled()) return;
  const duration = performance.now() - startTime;
  trackEvent('messagesSubscription', duration, {
    type: 'subscription',
  });
}

/**
 * 12. MESSAGE SENT - Envío de mensaje
 */
export function trackMessageSent(startTime, messageId, metadata = {}) {
  if (!isPerformanceMonitorEnabled()) return;
  const duration = performance.now() - startTime;
  trackEvent('messageSent', duration, {
    type: 'message',
    messageId,
    ...metadata,
  });
}

/**
 * 13. MESSAGE RECEIVED - Recepción de mensaje
 */
export function trackMessageReceived(sentAt, messageId, metadata = {}) {
  if (!isPerformanceMonitorEnabled()) return;
  const duration = Date.now() - sentAt;
  trackEvent('messageReceived', duration, {
    type: 'message',
    messageId,
    ...metadata,
  });
}

/**
 * 14. MESSAGE ROUNDTRIP - Tiempo completo de envío y recepción
 */
export function trackMessageRoundtrip(startTime, messageId, metadata = {}) {
  if (!isPerformanceMonitorEnabled()) return;
  const duration = performance.now() - startTime;
  trackEvent('messageRoundtrip', duration, {
    type: 'message_roundtrip',
    messageId,
    ...metadata,
  });
}

/**
 * 15. COMPONENT MOUNT - Carga de componente
 */
export function trackComponentMount(componentName, startTime) {
  if (!isPerformanceMonitorEnabled()) return;
  const duration = performance.now() - startTime;
  trackEvent('componentMount', duration, {
    type: 'component',
    component: componentName,
  });
}

/**
 * 16. BUTTON CLICK - Click en botón (tiempo de respuesta)
 */
export function trackButtonClick(buttonName, startTime) {
  if (!isPerformanceMonitorEnabled()) return;
  const duration = performance.now() - startTime;
  trackEvent('buttonClick', duration, {
    type: 'interaction',
    button: buttonName,
  });
}

/**
 * 17. FORM SUBMIT - Envío de formulario
 */
export function trackFormSubmit(formName, startTime, duration = null) {
  if (!isPerformanceMonitorEnabled()) return;
  const finalDuration = duration !== null ? duration : performance.now() - startTime;
  trackEvent('formSubmit', finalDuration, {
    type: 'form',
    form: formName,
  });
}

// Exportar por defecto
export default {
  isEnabled: isPerformanceMonitorEnabled,
  enable: enablePerformanceMonitor,
  disable: disablePerformanceMonitor,
  startTiming,
  endTiming,
  trackEvent,
  getMetrics: getPerformanceMetrics,
  clearMetrics: clearPerformanceMetrics,
  showSummary: showPerformanceSummary,

  // Helpers específicos
  trackLandingLoad,
  trackPageNavigation,
  trackModalOpen,
  trackModalClose,
  trackGuestAuth,
  trackAuthStateChange,
  trackUserProfileLoad,
  trackChatEntry,
  trackChatLoad,
  trackMessagesLoad,
  trackMessagesSubscription,
  trackMessageSent,
  trackMessageReceived,
  trackMessageRoundtrip,
  trackComponentMount,
  trackButtonClick,
  trackFormSubmit,
};
