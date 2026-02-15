import { auth } from '@/config/firebase';
import {
  trackEvent as trackAnalyticsEvent,
  trackPageView as trackAnalyticsPageView,
  trackPageExit as trackAnalyticsPageExit,
  trackRoomJoined as trackAnalyticsRoomJoined,
  trackMessageSent as trackAnalyticsMessageSent,
  trackUserLogin as trackAnalyticsLogin,
  trackUserRegister as trackAnalyticsRegister,
} from '@/services/analyticsService';
import {
  trackRegistration,
  trackLogin,
  trackFirstMessage,
  trackMessageSent as trackGA4MessageSent,
  trackRoomJoin,
  trackUserReturn,
  trackPageView as trackGA4PageView,
  trackPageExit as trackGA4PageExit,
  trackContentReport,
  trackSupportTicket,
} from '@/services/ga4Service';

const SESSION_ID_KEY = 'chactivo_session_id';
const SESSION_START_KEY = 'chactivo_session_start';
const LAST_SEEN_KEY = 'chactivo_last_seen';

const generateSessionId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

export const getSessionId = () => {
  if (typeof sessionStorage === 'undefined') return 'server';
  let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
};

const getUserMeta = (user) => {
  const authUser = auth.currentUser;
  return {
    userId: user?.id || authUser?.uid || null,
    isGuest: !!user?.isGuest,
    isAnonymous: !!(user?.isAnonymous || authUser?.isAnonymous),
    isAuthenticated: !!authUser,
  };
};

const dispatchGA4 = (eventType, payload) => {
  switch (eventType) {
    case 'user_register':
      trackRegistration({ method: payload.method, userId: payload.userId });
      break;
    case 'user_login':
      trackLogin({ method: payload.method, userId: payload.userId });
      break;
    case 'first_message':
      trackFirstMessage({ userId: payload.userId, roomId: payload.roomId, roomName: payload.roomName });
      break;
    case 'message_sent':
      trackGA4MessageSent({ userId: payload.userId, roomId: payload.roomId, roomName: payload.roomName });
      break;
    case 'room_joined':
      trackRoomJoin({ userId: payload.userId, roomId: payload.roomId, roomName: payload.roomName });
      break;
    case 'return_visit':
      trackUserReturn({ userId: payload.userId, daysSinceLastVisit: payload.days_since_last || 0 });
      break;
    case 'page_view':
      trackGA4PageView(payload.pagePath || payload.page_path, payload.pageTitle || payload.page_title);
      break;
    case 'page_exit':
      trackGA4PageExit({ pagePath: payload.pagePath || payload.page_path, timeOnPage: payload.timeOnPage || payload.time_on_page || 0 });
      break;
    case 'content_report':
      trackContentReport({
        userId: payload.reporter_id,
        reportedUserId: payload.reported_user_id,
        reportType: payload.context,
      });
      break;
    case 'support_ticket':
      trackSupportTicket({
        userId: payload.userId,
        category: payload.category,
        priority: payload.priority,
      });
      break;
    default:
      break;
  }
};

export const track = async (eventType, data = {}, options = {}) => {
  const sessionId = getSessionId();
  const userMeta = getUserMeta(options.user);

  const payload = {
    sessionId,
    ...userMeta,
    ...data,
  };

  await trackAnalyticsEvent(eventType, payload);
  dispatchGA4(eventType, payload);
};

export const trackPageView = async (pagePath, pageTitle, options = {}) => {
  const sessionId = getSessionId();
  const userMeta = getUserMeta(options.user);

  await trackAnalyticsPageView(pagePath, pageTitle);
  dispatchGA4('page_view', { pagePath, pageTitle, sessionId, ...userMeta });
};

export const trackPageExit = async (pagePath, timeOnPage = 0, options = {}) => {
  const sessionId = getSessionId();
  const userMeta = getUserMeta(options.user);

  await trackAnalyticsPageExit(pagePath, timeOnPage);
  dispatchGA4('page_exit', { pagePath, timeOnPage, sessionId, ...userMeta });
};

export const trackRoomJoined = async (roomId, options = {}) => {
  const sessionId = getSessionId();
  const userMeta = getUserMeta(options.user);

  await trackAnalyticsRoomJoined(roomId);
  dispatchGA4('room_joined', { roomId, roomName: options.roomName || null, sessionId, ...userMeta });
};

export const trackMessageSent = async (roomId, options = {}) => {
  const sessionId = getSessionId();
  const userMeta = getUserMeta(options.user);

  await trackAnalyticsMessageSent(roomId, userMeta.userId || null);
  dispatchGA4('message_sent', { roomId, roomName: options.roomName || null, sessionId, ...userMeta });
};

export const trackUserLogin = async (method = 'email', options = {}) => {
  const sessionId = getSessionId();
  const userMeta = getUserMeta(options.user);
  await trackAnalyticsLogin(userMeta.userId, method);
  dispatchGA4('user_login', { method, sessionId, ...userMeta });
};

export const trackUserRegister = async (method = 'email', options = {}) => {
  const sessionId = getSessionId();
  const userMeta = getUserMeta(options.user);
  await trackAnalyticsRegister(userMeta.userId, method);
  dispatchGA4('user_register', { method, sessionId, ...userMeta });
};

export const startSession = (options = {}) => {
  if (typeof sessionStorage === 'undefined') return null;
  const existing = sessionStorage.getItem(SESSION_START_KEY);
  if (existing) return { sessionId: getSessionId(), startedAt: Number(existing) };

  const startedAt = Date.now();
  const sessionId = getSessionId();
  sessionStorage.setItem(SESSION_START_KEY, String(startedAt));

  track('session_start', { started_at: startedAt }, options).catch(() => {});

  const lastSeen = localStorage.getItem(LAST_SEEN_KEY);
  if (lastSeen) {
    const daysSinceLast = Math.floor((startedAt - Number(lastSeen)) / (1000 * 60 * 60 * 24));
    track('return_visit', { days_since_last: daysSinceLast }, options).catch(() => {});
  }

  return { sessionId, startedAt };
};

export const endSession = (options = {}) => {
  if (typeof sessionStorage === 'undefined') return null;
  const startedAtRaw = sessionStorage.getItem(SESSION_START_KEY);
  const startedAt = startedAtRaw ? Number(startedAtRaw) : Date.now();
  const durationMs = Math.max(0, Date.now() - startedAt);

  track('session_end', { duration_ms: durationMs }, options).catch(() => {});
  localStorage.setItem(LAST_SEEN_KEY, String(Date.now()));

  return { durationMs };
};

export default {
  track,
  trackPageView,
  trackPageExit,
  trackRoomJoined,
  trackMessageSent,
  trackUserLogin,
  trackUserRegister,
  startSession,
  endSession,
  getSessionId,
};
