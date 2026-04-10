import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/config/firebase';

const BAUL_EVENT_TYPES = ['baul_view'];
const OPIN_EVENT_TYPES = [
  'opin_feed_view',
  'opin_view',
  'opin_like',
  'opin_comment',
  'opin_reaction',
  'opin_status_updated',
  'opin_follow_toggle',
];

const formatDateKey = (date) => date.toISOString().split('T')[0];

const getDayKeys = (days, offsetDays = 0) => {
  const safeDays = Math.max(1, Math.min(Number(days || 7), 30));
  const today = new Date();
  const keys = [];

  for (let i = 0; i < safeDays; i += 1) {
    const date = new Date(today);
    date.setDate(date.getDate() - offsetDays - i);
    keys.push(formatDateKey(date));
  }

  return keys.reverse();
};

const toMillis = (value) => {
  if (!value) return 0;
  if (typeof value?.toMillis === 'function') return value.toMillis();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

const sumCustomEvents = (statsDocs, eventTypes) => (
  statsDocs.reduce((total, statsDoc) => (
    total + eventTypes.reduce((inner, eventType) => (
      inner + Number(statsDoc?.customEvents?.[eventType] || 0)
    ), 0)
  ), 0)
);

const getUsersByEventTypes = (events, eventTypes) => {
  const allowed = new Set(eventTypes);
  const users = new Set();

  events.forEach((event) => {
    if (!allowed.has(event.type) || !event.userId) return;
    users.add(String(event.userId));
  });

  return users;
};

const splitNewVsRecurring = (currentUsers, previousUsers) => {
  let recurrent = 0;
  let nuevos = 0;

  currentUsers.forEach((userId) => {
    if (previousUsers.has(userId)) {
      recurrent += 1;
    } else {
      nuevos += 1;
    }
  });

  return { nuevos, recurrentes: recurrent };
};

const getPrivateChatActivityTimestamp = (chatData = {}) => {
  const lastMessageAt = toMillis(chatData.lastMessageAt);
  const updatedAt = toMillis(chatData.updatedAt);
  const createdAt = toMillis(chatData.createdAt);
  return Math.max(lastMessageAt, updatedAt, createdAt);
};

const readStatsDocs = async (dayKeys) => {
  const snapshots = await Promise.all(
    dayKeys.map((dayKey) => getDoc(doc(db, 'analytics_stats', dayKey)))
  );

  return snapshots.map((snapshot, index) => (
    snapshot.exists()
      ? snapshot.data()
      : { date: dayKeys[index], customEvents: {} }
  ));
};

const readAnalyticsEventsBetween = async (startKey, endKey) => {
  const eventsRef = collection(db, 'analytics_events');
  const snapshot = await getDocs(query(
    eventsRef,
    where('date', '>=', startKey),
    where('date', '<=', endKey),
  ));

  return snapshot.docs.map((eventDoc) => eventDoc.data());
};

const buildPrivateFeatureMetrics = async (days) => {
  const chatsSnapshot = await getDocs(collection(db, 'private_chats'));
  const now = Date.now();
  const windowMs = days * 24 * 60 * 60 * 1000;
  const currentStart = now - windowMs;
  const previousStart = currentStart - windowMs;

  const currentUsers = new Set();
  const previousUsers = new Set();
  let currentActiveChats = 0;
  let previousActiveChats = 0;

  chatsSnapshot.forEach((chatDoc) => {
    const data = chatDoc.data() || {};
    const participants = Array.isArray(data.participants) ? data.participants.map(String) : [];
    const activityMs = getPrivateChatActivityTimestamp(data);

    if (!activityMs) return;

    if (activityMs >= currentStart && activityMs <= now) {
      currentActiveChats += 1;
      participants.forEach((participant) => currentUsers.add(participant));
      return;
    }

    if (activityMs >= previousStart && activityMs < currentStart) {
      previousActiveChats += 1;
      participants.forEach((participant) => previousUsers.add(participant));
    }
  });

  return {
    key: 'privado',
    label: 'Privado',
    description: 'Conversaciones privadas activas',
    total: currentActiveChats,
    previousTotal: previousActiveChats,
    uniqueUsers: currentUsers.size,
    ...splitNewVsRecurring(currentUsers, previousUsers),
    detail: `${currentActiveChats} chats con movimiento en ${days} días`,
    measurementNote: 'Sale de private_chats activos, no de eventos de página.',
  };
};

const buildTrackedFeatureMetrics = ({
  key,
  label,
  description,
  currentStats,
  previousStats,
  currentEvents,
  previousEvents,
  eventTypes,
  detailLabel,
}) => {
  const currentUsers = getUsersByEventTypes(currentEvents, eventTypes);
  const previousUsers = getUsersByEventTypes(previousEvents, eventTypes);

  return {
    key,
    label,
    description,
    total: sumCustomEvents(currentStats, eventTypes),
    previousTotal: sumCustomEvents(previousStats, eventTypes),
    uniqueUsers: currentUsers.size,
    ...splitNewVsRecurring(currentUsers, previousUsers),
    detail: `${detailLabel} en la ventana actual`,
    measurementNote: 'Nuevos/recurrentes cuentan usuarios registrados con tracking detallado.',
  };
};

export async function getFeaturePulseMetrics(days = 7) {
  const safeDays = Number(days) === 14 ? 14 : 7;

  const currentDayKeys = getDayKeys(safeDays, 0);
  const previousDayKeys = getDayKeys(safeDays, safeDays);

  const [currentStats, previousStats, currentEvents, previousEvents, privateMetrics] = await Promise.all([
    readStatsDocs(currentDayKeys),
    readStatsDocs(previousDayKeys),
    readAnalyticsEventsBetween(currentDayKeys[0], currentDayKeys[currentDayKeys.length - 1]),
    readAnalyticsEventsBetween(previousDayKeys[0], previousDayKeys[previousDayKeys.length - 1]),
    buildPrivateFeatureMetrics(safeDays),
  ]);

  const baulMetrics = buildTrackedFeatureMetrics({
    key: 'baul',
    label: 'Baúl',
    description: 'Entradas e interés hacia el Baúl',
    currentStats,
    previousStats,
    currentEvents,
    previousEvents,
    eventTypes: BAUL_EVENT_TYPES,
    detailLabel: 'visitas al Baúl',
  });

  const opinMetrics = buildTrackedFeatureMetrics({
    key: 'opin',
    label: 'OPIN',
    description: 'Uso del feed y reacciones OPIN',
    currentStats,
    previousStats,
    currentEvents,
    previousEvents,
    eventTypes: OPIN_EVENT_TYPES,
    detailLabel: 'interacciones OPIN',
  });

  return {
    days: safeDays,
    metrics: [privateMetrics, baulMetrics, opinMetrics],
    notes: {
      newVsRecurring: 'Nuevo = usuario registrado activo en esta ventana sin actividad en la ventana anterior equivalente.',
      guests: 'Los invitados entran en el volumen total cuando hay customEvents, pero no siempre en nuevos/recurrentes si no hay userId persistente.',
    },
  };
}
