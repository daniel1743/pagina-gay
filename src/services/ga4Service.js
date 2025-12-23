/**
 * Google Analytics 4 (GA4) Service
 * Maneja todos los eventos personalizados para tracking de conversiones
 *
 * IMPORTANTE: Antes de usar en producción, reemplaza 'G-XXXXXXXXXX'
 * en index.html con tu ID de medición real de GA4
 */

/**
 * Verifica si GA4 está cargado
 */
const isGA4Available = () => {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
};

/**
 * Trackea un evento personalizado en GA4
 * @param {string} eventName - Nombre del evento
 * @param {object} params - Parámetros del evento
 */
const trackEvent = (eventName, params = {}) => {
  if (!isGA4Available()) {
    console.warn('GA4 no está disponible. Evento no enviado:', eventName);
    return;
  }

  try {
    window.gtag('event', eventName, params);
    console.log(`[GA4] Evento enviado: ${eventName}`, params);
  } catch (error) {
    console.error('Error enviando evento a GA4:', error);
  }
};

/**
 * EVENTOS DE CONVERSIÓN PRINCIPALES
 */

/**
 * Trackea cuando un usuario completa el registro
 * @param {object} userData - Datos del usuario (sin información sensible)
 */
export const trackRegistration = (userData = {}) => {
  trackEvent('sign_up', {
    method: userData.method || 'email', // email, google, phone
    user_id: userData.userId || null,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Trackea cuando un usuario inicia sesión
 * @param {object} userData - Datos del usuario
 */
export const trackLogin = (userData = {}) => {
  trackEvent('login', {
    method: userData.method || 'email',
    user_id: userData.userId || null,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Trackea cuando un usuario envía su primer mensaje
 * @param {object} messageData - Datos del mensaje (sin contenido)
 */
export const trackFirstMessage = (messageData = {}) => {
  trackEvent('first_message', {
    user_id: messageData.userId || null,
    room_id: messageData.roomId || null,
    room_name: messageData.roomName || null,
    timestamp: new Date().toISOString(),
    value: 1.0, // Valor de conversión
  });
};

/**
 * Trackea cuando un usuario está activo por más de 5 minutos
 * @param {object} userData - Datos del usuario
 */
export const trackUserActive5Min = (userData = {}) => {
  trackEvent('user_active_5min', {
    user_id: userData.userId || null,
    session_duration: 300, // 5 minutos en segundos
    timestamp: new Date().toISOString(),
    value: 0.5, // Menor valor que first_message pero aún valioso
  });
};

/**
 * Trackea cuando un usuario crea un thread en el foro
 * @param {object} threadData - Datos del thread
 */
export const trackThreadCreated = (threadData = {}) => {
  trackEvent('thread_created', {
    user_id: threadData.userId || null,
    category: threadData.category || null,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Trackea cuando un usuario se une a una sala de chat
 * @param {object} roomData - Datos de la sala
 */
export const trackRoomJoin = (roomData = {}) => {
  trackEvent('room_join', {
    user_id: roomData.userId || null,
    room_id: roomData.roomId || null,
    room_name: roomData.roomName || null,
    timestamp: new Date().toISOString(),
  });
};

/**
 * EVENTOS DE ENGAGEMENT
 */

/**
 * Trackea cuando un usuario envía un mensaje (después del primero)
 * @param {object} messageData - Datos del mensaje
 */
export const trackMessageSent = (messageData = {}) => {
  trackEvent('message_sent', {
    user_id: messageData.userId || null,
    room_id: messageData.roomId || null,
    room_name: messageData.roomName || null,
    message_count: messageData.messageCount || 1,
  });
};

/**
 * Trackea cuando un usuario responde en el foro
 * @param {object} replyData - Datos de la respuesta
 */
export const trackForumReply = (replyData = {}) => {
  trackEvent('forum_reply', {
    user_id: replyData.userId || null,
    thread_id: replyData.threadId || null,
    category: replyData.category || null,
  });
};

/**
 * Trackea cuando un usuario vota en el foro
 * @param {object} voteData - Datos del voto
 */
export const trackForumVote = (voteData = {}) => {
  trackEvent('forum_vote', {
    user_id: voteData.userId || null,
    thread_id: voteData.threadId || null,
    vote_type: voteData.voteType || 'upvote', // upvote, downvote
  });
};

/**
 * EVENTOS DE RETENCIÓN
 */

/**
 * Trackea cuando un usuario regresa después de 24 horas
 * @param {object} userData - Datos del usuario
 */
export const trackUserReturn = (userData = {}) => {
  trackEvent('user_return', {
    user_id: userData.userId || null,
    days_since_last_visit: userData.daysSinceLastVisit || 0,
    timestamp: new Date().toISOString(),
  });
};

/**
 * EVENTOS DE PREMIUM/MONETIZACIÓN
 */

/**
 * Trackea cuando un usuario ve la página de Premium
 */
export const trackPremiumPageView = () => {
  trackEvent('premium_page_view', {
    timestamp: new Date().toISOString(),
  });
};

/**
 * Trackea cuando un usuario hace clic en "Actualizar a Premium"
 */
export const trackPremiumClick = () => {
  trackEvent('premium_click', {
    timestamp: new Date().toISOString(),
  });
};

/**
 * Trackea cuando un usuario completa una compra Premium
 * @param {object} purchaseData - Datos de la compra
 */
export const trackPremiumPurchase = (purchaseData = {}) => {
  trackEvent('purchase', {
    transaction_id: purchaseData.transactionId || null,
    value: purchaseData.value || 0,
    currency: 'CLP',
    items: [
      {
        item_id: 'premium_monthly',
        item_name: 'Chactivo Premium',
        price: purchaseData.value || 0,
      }
    ],
  });
};

/**
 * EVENTOS DE NAVEGACIÓN
 */

/**
 * Trackea visualizaciones de páginas específicas
 * @param {string} pagePath - Ruta de la página
 * @param {string} pageTitle - Título de la página
 */
export const trackPageView = (pagePath, pageTitle) => {
  if (!isGA4Available()) return;

  window.gtag('config', 'G-XXXXXXXXXX', {
    page_path: pagePath,
    page_title: pageTitle,
  });
};

/**
 * EVENTOS DE SALIDA/CONVERSIÓN NEGATIVA
 */

/**
 * Trackea cuando un usuario sale de la página
 * @param {object} exitData - Datos de salida
 */
export const trackPageExit = (exitData = {}) => {
  trackEvent('page_exit', {
    page_path: exitData.pagePath || window.location.pathname,
    time_on_page: exitData.timeOnPage || 0,
    timestamp: new Date().toISOString(),
  });
};

/**
 * EVENTOS DE ERROR/DEBUGGING
 */

/**
 * Trackea errores de la aplicación (opcional para debugging)
 * @param {object} errorData - Datos del error
 */
export const trackError = (errorData = {}) => {
  trackEvent('app_error', {
    error_message: errorData.message || 'Unknown error',
    error_type: errorData.type || 'runtime',
    page_path: window.location.pathname,
    timestamp: new Date().toISOString(),
  });
};

/**
 * HELPER: Trackea tiempo de sesión
 * Llama esto cuando el usuario cierra la app o después de X minutos
 * @param {number} duration - Duración en segundos
 */
export const trackSessionDuration = (duration) => {
  trackEvent('session_duration', {
    duration_seconds: duration,
    duration_minutes: Math.floor(duration / 60),
    timestamp: new Date().toISOString(),
  });
};

/**
 * CONFIGURACIÓN DE USER PROPERTIES
 */

/**
 * Establece propiedades del usuario en GA4
 * @param {object} properties - Propiedades del usuario
 */
export const setUserProperties = (properties = {}) => {
  if (!isGA4Available()) return;

  window.gtag('set', 'user_properties', {
    is_premium: properties.isPremium || false,
    user_age_group: properties.ageGroup || 'unknown', // 18-24, 25-34, 35-44, 45+
    signup_date: properties.signupDate || null,
    total_messages: properties.totalMessages || 0,
  });
};

/**
 * EVENTOS ESPECÍFICOS DE CHACTIVO
 */

/**
 * Trackea cuando un usuario crea una sala personalizada
 * @param {object} roomData - Datos de la sala
 */
export const trackCustomRoomCreated = (roomData = {}) => {
  trackEvent('custom_room_created', {
    user_id: roomData.userId || null,
    room_name: roomData.roomName || null,
    timestamp: new Date().toISOString(),
    value: 2.0, // Alta intención de engagement
  });
};

/**
 * Trackea cuando un usuario reporta contenido
 * @param {object} reportData - Datos del reporte
 */
export const trackContentReport = (reportData = {}) => {
  trackEvent('content_report', {
    user_id: reportData.userId || null,
    report_type: reportData.reportType || null,
    reported_user_id: reportData.reportedUserId || null,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Trackea cuando un usuario abre el ticket de soporte
 * @param {object} ticketData - Datos del ticket
 */
export const trackSupportTicket = (ticketData = {}) => {
  trackEvent('support_ticket', {
    user_id: ticketData.userId || null,
    category: ticketData.category || null,
    priority: ticketData.priority || null,
    timestamp: new Date().toISOString(),
  });
};

/**
 * TRACKING DE FUENTE DE TRÁFICO (Para Google Ads)
 */

/**
 * Trackea de dónde viene el usuario (para medir ROI de ads)
 * @param {string} source - Fuente del tráfico (google, facebook, direct, etc.)
 * @param {string} campaign - Nombre de la campaña
 */
export const trackTrafficSource = (source, campaign = null) => {
  trackEvent('traffic_source', {
    source: source,
    campaign: campaign,
    landing_page: window.location.pathname,
    timestamp: new Date().toISOString(),
  });
};

// Exportar helper para verificar si GA4 está disponible
export { isGA4Available };

export default {
  // Conversiones principales
  trackRegistration,
  trackLogin,
  trackFirstMessage,
  trackUserActive5Min,
  trackThreadCreated,
  trackRoomJoin,

  // Engagement
  trackMessageSent,
  trackForumReply,
  trackForumVote,

  // Retención
  trackUserReturn,

  // Premium
  trackPremiumPageView,
  trackPremiumClick,
  trackPremiumPurchase,

  // Navegación
  trackPageView,
  trackPageExit,

  // Errores
  trackError,
  trackSessionDuration,

  // Propiedades de usuario
  setUserProperties,

  // Específicos de Chactivo
  trackCustomRoomCreated,
  trackContentReport,
  trackSupportTicket,
  trackTrafficSource,

  // Helper
  isGA4Available,
};
