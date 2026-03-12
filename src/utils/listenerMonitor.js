const MONITOR_STORAGE_KEY = 'chactivo_listener_monitor_logs_enabled';
const STARTED_AT_MS = Date.now();

const activeListeners = new Map();
const activeCountByGroup = new Map();
const activeCountByModule = new Map();
const stats = {
  totalStarted: 0,
  totalStopped: 0,
  peakActive: 0,
};

let sequence = 0;

const safeString = (value, fallback = 'unknown') => {
  const normalized = String(value ?? '').trim();
  return normalized || fallback;
};

const isBrowser = () => typeof window !== 'undefined';

const getLogsEnabled = () => {
  if (!isBrowser()) return false;
  try {
    return localStorage.getItem(MONITOR_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

const toGroupKey = (moduleName, typeName, keyName) =>
  `${moduleName}::${typeName}::${keyName}`;

const incrementMapCount = (targetMap, key) => {
  const current = targetMap.get(key) || 0;
  targetMap.set(key, current + 1);
};

const decrementMapCount = (targetMap, key) => {
  const current = targetMap.get(key) || 0;
  if (current <= 1) {
    targetMap.delete(key);
    return;
  }
  targetMap.set(key, current - 1);
};

const maybeLog = (label, payload) => {
  if (!getLogsEnabled()) return;
  console.log(`[LISTENER_MONITOR] ${label}`, payload);
};

export const trackListenerStart = ({
  module = 'unknown',
  type = 'onSnapshot',
  key = 'unknown',
  shared = false,
} = {}) => {
  const moduleName = safeString(module);
  const typeName = safeString(type);
  const keyName = safeString(key);
  const groupKey = toGroupKey(moduleName, typeName, keyName);
  const token = `lst_${Date.now()}_${++sequence}`;

  const meta = {
    token,
    module: moduleName,
    type: typeName,
    key: keyName,
    groupKey,
    shared: Boolean(shared),
    startedAtMs: Date.now(),
  };

  activeListeners.set(token, meta);
  incrementMapCount(activeCountByGroup, groupKey);
  incrementMapCount(activeCountByModule, moduleName);

  stats.totalStarted += 1;
  if (activeListeners.size > stats.peakActive) {
    stats.peakActive = activeListeners.size;
  }

  maybeLog('start', {
    token,
    module: moduleName,
    type: typeName,
    key: keyName,
    totalActive: activeListeners.size,
  });

  return token;
};

export const trackListenerStop = (token) => {
  const tokenId = safeString(token, '');
  if (!tokenId) return;

  const meta = activeListeners.get(tokenId);
  if (!meta) return;

  activeListeners.delete(tokenId);
  decrementMapCount(activeCountByGroup, meta.groupKey);
  decrementMapCount(activeCountByModule, meta.module);
  stats.totalStopped += 1;

  maybeLog('stop', {
    token: tokenId,
    module: meta.module,
    type: meta.type,
    key: meta.key,
    totalActive: activeListeners.size,
  });
};

const mapToSortedArray = (targetMap, keyLabel) =>
  Array.from(targetMap.entries())
    .map(([key, count]) => ({ [keyLabel]: key, count }))
    .sort((a, b) => b.count - a.count || String(a[keyLabel]).localeCompare(String(b[keyLabel])));

export const getListenerMetrics = (options = {}) => {
  const includeActiveListeners = Boolean(options?.includeActiveListeners);
  const now = Date.now();

  const payload = {
    generatedAt: new Date(now).toISOString(),
    uptimeMs: now - STARTED_AT_MS,
    totalActive: activeListeners.size,
    totalStarted: stats.totalStarted,
    totalStopped: stats.totalStopped,
    peakActive: stats.peakActive,
    byModule: mapToSortedArray(activeCountByModule, 'module'),
    byGroup: mapToSortedArray(activeCountByGroup, 'group'),
  };

  if (includeActiveListeners) {
    payload.activeListeners = Array.from(activeListeners.values())
      .map((item) => ({
        ...item,
        ageMs: now - item.startedAtMs,
      }))
      .sort((a, b) => b.ageMs - a.ageMs);
  }

  return payload;
};

export const printListenerMetrics = () => {
  const metrics = getListenerMetrics({ includeActiveListeners: true });
  console.log('[LISTENER_MONITOR] summary', {
    generatedAt: metrics.generatedAt,
    totalActive: metrics.totalActive,
    totalStarted: metrics.totalStarted,
    totalStopped: metrics.totalStopped,
    peakActive: metrics.peakActive,
  });

  if (metrics.byModule.length > 0) {
    console.table(metrics.byModule);
  }

  if (metrics.byGroup.length > 0) {
    console.table(metrics.byGroup.slice(0, 20));
  }

  if (Array.isArray(metrics.activeListeners) && metrics.activeListeners.length > 0) {
    console.table(
      metrics.activeListeners.map((item) => ({
        token: item.token,
        module: item.module,
        type: item.type,
        key: item.key,
        shared: item.shared,
        ageMs: item.ageMs,
      }))
    );
  }

  return metrics;
};

export const resetListenerMetrics = () => {
  activeListeners.clear();
  activeCountByGroup.clear();
  activeCountByModule.clear();
  stats.totalStarted = 0;
  stats.totalStopped = 0;
  stats.peakActive = 0;
};

export const enableListenerMonitorLogs = () => {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(MONITOR_STORAGE_KEY, '1');
  } catch {
    // noop
  }
};

export const disableListenerMonitorLogs = () => {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(MONITOR_STORAGE_KEY, '0');
  } catch {
    // noop
  }
};

if (isBrowser()) {
  window.getListenerMetrics = getListenerMetrics;
  window.printListenerMetrics = printListenerMetrics;
  window.resetListenerMetrics = resetListenerMetrics;
  window.enableListenerMonitorLogs = enableListenerMonitorLogs;
  window.disableListenerMonitorLogs = disableListenerMonitorLogs;
}

