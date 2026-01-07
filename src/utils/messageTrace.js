/**
 * 🔍 SISTEMA DE TRAZABILIDAD DE MENSAJES
 * 
 * Rastrea el flujo completo de un mensaje desde que se escribe hasta que se renderiza
 * en otros clientes. Diseñado para identificar exactamente dónde se rompe la cadena.
 * 
 * ACTIVACIÓN:
 * - En desarrollo: automáticamente activo
 * - En producción: activar con localStorage.setItem('ENABLE_MESSAGE_TRACE', 'true')
 * 
 * USO:
 * - Ver logs en consola (F12)
 * - Buscar por traceId para seguir un mensaje específico
 * - Ver el flujo completo paso a paso
 */

// ✅ Estado global del sistema de tracing
let isTracingEnabled = false;
let traceHistory = [];
const MAX_TRACE_HISTORY = 1000; // Limitar historial para no consumir memoria

// ✅ Inicializar sistema de tracing
const initTracing = () => {
  // Activar en desarrollo o si está explícitamente habilitado
  const isDev = import.meta.env.DEV;
  const explicitEnabled = localStorage.getItem('ENABLE_MESSAGE_TRACE') === 'true';
  isTracingEnabled = isDev || explicitEnabled;

  if (isTracingEnabled) {
    console.log('%c🔍 [MESSAGE TRACE] Sistema de trazabilidad ACTIVADO', 
      'color: #00ff00; font-weight: bold; font-size: 14px;');
    console.log('%c📋 [MESSAGE TRACE] Todos los eventos de mensajes serán rastreados', 
      'color: #00ff00; font-size: 12px;');
  }
};

// ✅ Inicializar al cargar el módulo
initTracing();

/**
 * Eventos del pipeline de mensajes
 */
export const TRACE_EVENTS = {
  USER_INPUT_TYPED: 'USER_INPUT_TYPED',
  UI_LOCAL_RENDER: 'UI_LOCAL_RENDER',
  SEND_HANDLER_TRIGGERED: 'SEND_HANDLER_TRIGGERED',
  PAYLOAD_VALIDATED: 'PAYLOAD_VALIDATED',
  PAYLOAD_VALIDATION_FAILED: 'PAYLOAD_VALIDATION_FAILED',
  FIREBASE_WRITE_ATTEMPT: 'FIREBASE_WRITE_ATTEMPT',
  FIREBASE_WRITE_SUCCESS: 'FIREBASE_WRITE_SUCCESS',
  FIREBASE_WRITE_FAIL: 'FIREBASE_WRITE_FAIL',
  REMOTE_LISTENER_TRIGGERED: 'REMOTE_LISTENER_TRIGGERED',
  REMOTE_PAYLOAD_RECEIVED: 'REMOTE_PAYLOAD_RECEIVED',
  REMOTE_UI_RENDER: 'REMOTE_UI_RENDER',
  OPTIMISTIC_MESSAGE_CREATED: 'OPTIMISTIC_MESSAGE_CREATED',
  OPTIMISTIC_MESSAGE_REPLACED: 'OPTIMISTIC_MESSAGE_REPLACED',
  CALLBACK_EXECUTED: 'CALLBACK_EXECUTED',
  STATE_UPDATED: 'STATE_UPDATED',
};

/**
 * Registrar un evento de trazabilidad
 * @param {string} event - Tipo de evento (TRACE_EVENTS)
 * @param {object} data - Datos del evento
 * @param {string} traceId - ID único del mensaje (opcional, se genera si no se proporciona)
 */
export const traceEvent = (event, data = {}, traceId = null) => {
  if (!isTracingEnabled) return;

  const timestamp = Date.now();
  const eventTraceId = traceId || data.traceId || data.clientId || `trace_${timestamp}_${Math.random()}`;
  
  const traceEntry = {
    event,
    traceId: eventTraceId,
    timestamp,
    timestampISO: new Date().toISOString(),
    data: {
      ...data,
      // Agregar información del contexto
      roomId: data.roomId || 'unknown',
      userId: data.userId || 'unknown',
      messageId: data.messageId || data.id || 'unknown',
      content: data.content ? data.content.substring(0, 50) + (data.content.length > 50 ? '...' : '') : 'N/A',
    },
    stack: new Error().stack?.split('\n').slice(2, 5).join('\n'), // Stack trace limitado
  };

  // Agregar al historial
  traceHistory.push(traceEntry);
  if (traceHistory.length > MAX_TRACE_HISTORY) {
    traceHistory.shift(); // Eliminar el más antiguo
  }

  // ✅ Log con formato visual
  const emoji = getEventEmoji(event);
  const color = getEventColor(event);
  
  console.log(
    `%c${emoji} [TRACE:${event}]`,
    `color: ${color}; font-weight: bold; font-size: 12px;`,
    {
      traceId: eventTraceId,
      timestamp: new Date(traceEntry.timestamp).toLocaleTimeString(),
      ...traceEntry.data,
    }
  );

  // ✅ Log detallado expandible
  console.groupCollapsed(
    `%c${emoji} [TRACE:${event}] Detalles`,
    `color: ${color}; font-weight: bold;`
  );
  console.log('📋 Datos completos:', traceEntry.data);
  console.log('🕐 Timestamp:', traceEntry.timestampISO);
  console.log('🔗 Trace ID:', eventTraceId);
  if (traceEntry.stack) {
    console.log('📍 Stack:', traceEntry.stack);
  }
  console.groupEnd();

  return eventTraceId;
};

/**
 * Obtener emoji para cada tipo de evento
 */
const getEventEmoji = (event) => {
  const emojiMap = {
    [TRACE_EVENTS.USER_INPUT_TYPED]: '⌨️',
    [TRACE_EVENTS.UI_LOCAL_RENDER]: '🖥️',
    [TRACE_EVENTS.SEND_HANDLER_TRIGGERED]: '🚀',
    [TRACE_EVENTS.PAYLOAD_VALIDATED]: '✅',
    [TRACE_EVENTS.PAYLOAD_VALIDATION_FAILED]: '❌',
    [TRACE_EVENTS.FIREBASE_WRITE_ATTEMPT]: '📤',
    [TRACE_EVENTS.FIREBASE_WRITE_SUCCESS]: '✅',
    [TRACE_EVENTS.FIREBASE_WRITE_FAIL]: '❌',
    [TRACE_EVENTS.REMOTE_LISTENER_TRIGGERED]: '📡',
    [TRACE_EVENTS.REMOTE_PAYLOAD_RECEIVED]: '📥',
    [TRACE_EVENTS.REMOTE_UI_RENDER]: '🖼️',
    [TRACE_EVENTS.OPTIMISTIC_MESSAGE_CREATED]: '⚡',
    [TRACE_EVENTS.OPTIMISTIC_MESSAGE_REPLACED]: '🔄',
    [TRACE_EVENTS.CALLBACK_EXECUTED]: '🔄',
    [TRACE_EVENTS.STATE_UPDATED]: '📊',
  };
  return emojiMap[event] || '🔍';
};

/**
 * Obtener color para cada tipo de evento
 */
const getEventColor = (event) => {
  const colorMap = {
    [TRACE_EVENTS.USER_INPUT_TYPED]: '#00aaff',
    [TRACE_EVENTS.UI_LOCAL_RENDER]: '#00ff00',
    [TRACE_EVENTS.SEND_HANDLER_TRIGGERED]: '#ffaa00',
    [TRACE_EVENTS.PAYLOAD_VALIDATED]: '#00ff00',
    [TRACE_EVENTS.PAYLOAD_VALIDATION_FAILED]: '#ff0000',
    [TRACE_EVENTS.FIREBASE_WRITE_ATTEMPT]: '#ff8800',
    [TRACE_EVENTS.FIREBASE_WRITE_SUCCESS]: '#00ff00',
    [TRACE_EVENTS.FIREBASE_WRITE_FAIL]: '#ff0000',
    [TRACE_EVENTS.REMOTE_LISTENER_TRIGGERED]: '#8800ff',
    [TRACE_EVENTS.REMOTE_PAYLOAD_RECEIVED]: '#0088ff',
    [TRACE_EVENTS.REMOTE_UI_RENDER]: '#00ff88',
    [TRACE_EVENTS.OPTIMISTIC_MESSAGE_CREATED]: '#ffff00',
    [TRACE_EVENTS.OPTIMISTIC_MESSAGE_REPLACED]: '#ff00ff',
    [TRACE_EVENTS.CALLBACK_EXECUTED]: '#00ffff',
    [TRACE_EVENTS.STATE_UPDATED]: '#8888ff',
  };
  return colorMap[event] || '#ffffff';
};

/**
 * Obtener todos los eventos de un traceId específico
 * @param {string} traceId - ID del mensaje a rastrear
 */
export const getTraceForMessage = (traceId) => {
  const traces = traceHistory.filter(t => 
    t.traceId === traceId || 
    t.data.traceId === traceId ||
    t.data.clientId === traceId ||
    t.data.messageId === traceId ||
    t.data.id === traceId
  );
  
  console.group(`%c🔍 [TRACE] Eventos para ${traceId}`, 'color: #00ffff; font-weight: bold; font-size: 14px;');
  traces.forEach((trace, index) => {
    console.log(
      `%c${getEventEmoji(trace.event)} [${index + 1}] ${trace.event}`,
      `color: ${getEventColor(trace.event)}; font-weight: bold;`,
      {
        timestamp: new Date(trace.timestamp).toLocaleTimeString(),
        ...trace.data,
      }
    );
  });
  console.groupEnd();
  
  return traces;
};

/**
 * Obtener el flujo completo de un mensaje
 * @param {string} traceId - ID del mensaje
 */
export const getMessageFlow = (traceId) => {
  const traces = getTraceForMessage(traceId);
  
  if (traces.length === 0) {
    console.warn(`⚠️ [TRACE] No se encontraron eventos para ${traceId}`);
    return null;
  }

  // Analizar el flujo
  const flow = {
    traceId,
    events: traces,
    startTime: traces[0]?.timestamp,
    endTime: traces[traces.length - 1]?.timestamp,
    duration: traces.length > 1 ? traces[traces.length - 1].timestamp - traces[0].timestamp : 0,
    completed: false,
    brokenAt: null,
  };

  // Verificar si el flujo está completo
  const hasWriteSuccess = traces.some(t => t.event === TRACE_EVENTS.FIREBASE_WRITE_SUCCESS);
  const hasRemoteReceived = traces.some(t => t.event === TRACE_EVENTS.REMOTE_PAYLOAD_RECEIVED);
  const hasRemoteRender = traces.some(t => t.event === TRACE_EVENTS.REMOTE_UI_RENDER);

  flow.completed = hasWriteSuccess && hasRemoteReceived && hasRemoteRender;

  // Identificar dónde se rompió
  if (!hasWriteSuccess) {
    flow.brokenAt = 'FIREBASE_WRITE';
  } else if (!hasRemoteReceived) {
    flow.brokenAt = 'REMOTE_LISTENER';
  } else if (!hasRemoteRender) {
    flow.brokenAt = 'REMOTE_UI_RENDER';
  }

  // Mostrar resumen
  console.group(`%c📊 [TRACE] Resumen del flujo para ${traceId}`, 'color: #00ffff; font-weight: bold; font-size: 14px;');
  console.log('✅ Completado:', flow.completed ? 'SÍ' : 'NO');
  if (flow.brokenAt) {
    console.error('❌ Se rompió en:', flow.brokenAt);
  }
  console.log('⏱️ Duración:', `${flow.duration}ms`);
  console.log('📋 Eventos:', traces.length);
  console.log('🔄 Flujo completo:', traces.map(t => t.event).join(' → '));
  console.groupEnd();

  return flow;
};

/**
 * Limpiar historial de traces
 */
export const clearTraceHistory = () => {
  traceHistory = [];
  console.log('%c🧹 [TRACE] Historial limpiado', 'color: #ffaa00; font-weight: bold;');
};

/**
 * Exportar historial completo
 */
export const exportTraceHistory = () => {
  const exportData = {
    timestamp: new Date().toISOString(),
    totalTraces: traceHistory.length,
    traces: traceHistory,
  };
  
  console.log('%c📥 [TRACE] Historial exportado', 'color: #00ff00; font-weight: bold;');
  console.table(traceHistory.map(t => ({
    event: t.event,
    traceId: t.traceId,
    timestamp: new Date(t.timestamp).toLocaleTimeString(),
    roomId: t.data.roomId,
    userId: t.data.userId,
    messageId: t.data.messageId,
  })));
  
  return exportData;
};

// ✅ Exponer funciones globales para debugging
if (typeof window !== 'undefined') {
  window.messageTrace = {
    getTraceForMessage,
    getMessageFlow,
    clearTraceHistory,
    exportTraceHistory,
    enable: () => {
      localStorage.setItem('ENABLE_MESSAGE_TRACE', 'true');
      isTracingEnabled = true;
      console.log('%c✅ [TRACE] Sistema activado manualmente', 'color: #00ff00; font-weight: bold;');
    },
    disable: () => {
      localStorage.removeItem('ENABLE_MESSAGE_TRACE');
      isTracingEnabled = false;
      console.log('%c⏸️ [TRACE] Sistema desactivado', 'color: #ffaa00; font-weight: bold;');
    },
    status: () => {
      console.log('%c📊 [TRACE] Estado del sistema', 'color: #00ffff; font-weight: bold;');
      console.log('Activo:', isTracingEnabled);
      console.log('Total de traces:', traceHistory.length);
      console.log('Últimos 5 eventos:', traceHistory.slice(-5));
    },
  };
}

export default {
  traceEvent,
  TRACE_EVENTS,
  getTraceForMessage,
  getMessageFlow,
  clearTraceHistory,
  exportTraceHistory,
};

