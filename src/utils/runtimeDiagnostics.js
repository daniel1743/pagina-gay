const MAX_DIAGNOSTIC_HISTORY = 25;

const getWindowScope = () => (typeof window !== 'undefined' ? window : null);

const buildTraceId = (prefix = 'trace') => (
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
);

const trimHistory = (items = []) => items.slice(0, MAX_DIAGNOSTIC_HISTORY);

const buildSnapshot = (bucket = {}) => ({
  lastSuccess: bucket.lastSuccess || null,
  lastError: bucket.lastError || null,
  pendingCount: Object.keys(bucket.pending || {}).length,
  history: Array.isArray(bucket.history) ? bucket.history.slice(0, 10) : [],
});

const ensureDiagnosticsStore = () => {
  const win = getWindowScope();
  if (!win) return null;

  if (!win.__chactivoDiagnostics) {
    win.__chactivoDiagnostics = {
      ai: {
        pending: {},
        history: [],
        lastSuccess: null,
        lastError: null,
      },
      api: {
        history: [],
        lastSuccess: null,
        lastError: null,
      },
    };
  }

  if (typeof win.chactivoAIStatus !== 'function') {
    win.chactivoAIStatus = () => {
      const store = ensureDiagnosticsStore();
      const snapshot = buildSnapshot(store?.ai || {});
      console.group('[CHACTIVO_AI_STATUS]');
      console.log(snapshot);
      console.table(snapshot.history);
      console.groupEnd();
      return snapshot;
    };
  }

  if (typeof win.chactivoAPIStatus !== 'function') {
    win.chactivoAPIStatus = () => {
      const store = ensureDiagnosticsStore();
      const snapshot = buildSnapshot(store?.api || {});
      console.group('[CHACTIVO_API_STATUS]');
      console.log(snapshot);
      console.table(snapshot.history);
      console.groupEnd();
      return snapshot;
    };
  }

  if (typeof win.chactivoEnablePrivateChatDebug !== 'function') {
    win.chactivoEnablePrivateChatDebug = (enabled = true) => {
      try {
        win.localStorage.setItem('chactivo:debug:private-chat', enabled ? '1' : '0');
      } catch {
        // noop
      }
      return enabled;
    };
  }

  return win.__chactivoDiagnostics;
};

const pushHistoryEntry = (bucket, entry) => {
  bucket.history = trimHistory([entry, ...(Array.isArray(bucket.history) ? bucket.history : [])]);
};

export const startAITrace = ({ source = 'unknown', provider = 'unknown', action = 'request', meta = {} } = {}) => {
  const store = ensureDiagnosticsStore();
  const traceId = buildTraceId('ai');

  if (store) {
    store.ai.pending[traceId] = {
      traceId,
      source,
      provider,
      action,
      meta,
      startedAt: Date.now(),
      startedAtIso: new Date().toISOString(),
    };
  }

  return traceId;
};

export const finishAITrace = (traceId, { summary = '', meta = {} } = {}) => {
  const store = ensureDiagnosticsStore();
  if (!store || !traceId || !store.ai.pending[traceId]) return null;

  const pending = store.ai.pending[traceId];
  delete store.ai.pending[traceId];

  const entry = {
    traceId,
    source: pending.source,
    provider: pending.provider,
    action: pending.action,
    status: 'ok',
    startedAtIso: pending.startedAtIso,
    finishedAtIso: new Date().toISOString(),
    latencyMs: Math.max(0, Date.now() - Number(pending.startedAt || Date.now())),
    summary: summary || 'IA respondió correctamente',
    ...pending.meta,
    ...meta,
  };

  store.ai.lastSuccess = entry;
  pushHistoryEntry(store.ai, entry);
  console.info(
    `[CHACTIVO_AI_OK] ${entry.source}/${entry.provider} ${entry.action} ${entry.latencyMs}ms${entry.summary ? ` - ${entry.summary}` : ''}`
  );
  return entry;
};

export const failAITrace = (traceId, { error = null, summary = '', meta = {} } = {}) => {
  const store = ensureDiagnosticsStore();
  const pending = store?.ai?.pending?.[traceId] || null;
  if (store?.ai?.pending?.[traceId]) {
    delete store.ai.pending[traceId];
  }

  const entry = {
    traceId: traceId || buildTraceId('ai'),
    source: pending?.source || meta.source || 'unknown',
    provider: pending?.provider || meta.provider || 'unknown',
    action: pending?.action || meta.action || 'request',
    status: 'error',
    startedAtIso: pending?.startedAtIso || null,
    finishedAtIso: new Date().toISOString(),
    latencyMs: pending?.startedAt ? Math.max(0, Date.now() - Number(pending.startedAt)) : null,
    summary: summary || error?.message || String(error || 'Error de IA'),
    errorMessage: error?.message || String(error || 'Error desconocido'),
    ...pending?.meta,
    ...meta,
  };

  if (store) {
    store.ai.lastError = entry;
    pushHistoryEntry(store.ai, entry);
  }

  console.warn(
    `[CHACTIVO_AI_ERROR] ${entry.source}/${entry.provider} ${entry.action}${entry.latencyMs != null ? ` ${entry.latencyMs}ms` : ''} - ${entry.summary}`
  );
  return entry;
};

export const recordAPISignal = ({ source = 'unknown', action = 'request', status = 'ok', summary = '', meta = {}, error = null } = {}) => {
  const store = ensureDiagnosticsStore();
  const entry = {
    traceId: buildTraceId('api'),
    source,
    action,
    status,
    atIso: new Date().toISOString(),
    summary: summary || (status === 'ok' ? 'API respondió correctamente' : error?.message || 'API con error'),
    errorMessage: error?.message || null,
    ...meta,
  };

  if (store) {
    if (status === 'ok') store.api.lastSuccess = entry;
    else store.api.lastError = entry;
    pushHistoryEntry(store.api, entry);
  }

  if (status === 'ok') {
    console.info(`[CHACTIVO_API_OK] ${source}/${action}${entry.summary ? ` - ${entry.summary}` : ''}`);
  } else {
    console.warn(`[CHACTIVO_API_ERROR] ${source}/${action} - ${entry.summary}`);
  }

  return entry;
};

export const isPrivateChatDebugEnabled = () => {
  const win = getWindowScope();
  if (!win) return false;
  try {
    return win.localStorage.getItem('chactivo:debug:private-chat') === '1';
  } catch {
    return false;
  }
};

export const publishPrivateChatDebug = (label, payload = {}, error = null) => {
  const win = getWindowScope();
  const debugEnabled = isPrivateChatDebugEnabled();

  const entry = {
    label,
    at: new Date().toISOString(),
    ...payload,
    ...(error ? {
      error: {
        code: error?.code || null,
        message: error?.message || String(error || 'Unknown error'),
        name: error?.name || null,
      },
    } : {}),
  };

  if (!win) return entry;
  if (!debugEnabled && !error) return entry;

  win.__lastPrivateChatDebug = entry;
  const history = Array.isArray(win.__privateChatDebugHistory) ? win.__privateChatDebugHistory : [];
  win.__privateChatDebugHistory = trimHistory([entry, ...history]);

  if (typeof win.printPrivateChatDebug !== 'function') {
    win.printPrivateChatDebug = () => {
      const latest = win.__lastPrivateChatDebug || null;
      console.group('[PRIVATE_CHAT_DEBUG]');
      console.log(latest);
      console.table(win.__privateChatDebugHistory || []);
      console.groupEnd();
      return latest;
    };
  }

  if (error) console.error('[PRIVATE_CHAT_DEBUG]', entry);
  else console.info('[PRIVATE_CHAT_DEBUG]', entry);
  return entry;
};
