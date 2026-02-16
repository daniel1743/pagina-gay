import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from 'firebase/firestore';
import { db } from '@/config/firebase';

const ESENCIAS_COLLECTION = 'esencias';
const ESENCIA_DURATION_MS = 5 * 60 * 1000;
const MAX_MESSAGE_LENGTH = 120;
const ACTIVE_ESENCIAS_LIMIT = 15;
const SNAPSHOT_FETCH_LIMIT = 50;
const QUERY_REFRESH_INTERVAL_MS = 30 * 1000;
const PRUNE_INTERVAL_MS = 5 * 1000;

const toMillis = (value) => {
  if (!value) return 0;
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  return 0;
};

const normalizeEsenciaDoc = (docSnap) => {
  const data = docSnap.data() || {};
  const createdAtMs = toMillis(data.createdAt);
  const expiresAtMs = toMillis(data.expiresAt);

  return {
    id: docSnap.id,
    esenciaId: data.esenciaId || docSnap.id,
    userId: data.userId || '',
    username: data.username || 'Usuario',
    avatar: data.avatar || '',
    mensaje: data.mensaje || '',
    createdAt: data.createdAt || null,
    expiresAt: data.expiresAt || null,
    createdAtMs,
    expiresAtMs,
  };
};

const computeActiveEsencias = (esencias) => {
  const nowMs = Date.now();

  return esencias
    .filter((item) => item.expiresAtMs > nowMs)
    .sort((a, b) => b.createdAtMs - a.createdAtMs)
    .slice(0, ACTIVE_ESENCIAS_LIMIT);
};

const normalizeMessage = (mensaje) => {
  if (!mensaje || typeof mensaje !== 'string') {
    throw new Error('El mensaje de esencia es requerido');
  }

  const normalized = mensaje.trim().replace(/\s+/g, ' ');

  if (normalized.length < 3) {
    throw new Error('La esencia debe tener al menos 3 caracteres');
  }

  if (normalized.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`La esencia no puede superar ${MAX_MESSAGE_LENGTH} caracteres`);
  }

  return normalized;
};

/**
 * Crear una esencia con expiración automática de 5 minutos.
 */
export const createEsencia = async (userId, username, avatar, mensaje) => {
  if (!userId || typeof userId !== 'string') {
    throw new Error('userId inválido para crear esencia');
  }

  if (!username || typeof username !== 'string') {
    throw new Error('username inválido para crear esencia');
  }

  const mensajeNormalizado = normalizeMessage(mensaje);
  const nowMs = Date.now();
  const expiresAtMs = nowMs + ESENCIA_DURATION_MS;

  const esenciasRef = collection(db, ESENCIAS_COLLECTION);
  const esenciaRef = doc(esenciasRef);

  const payload = {
    esenciaId: esenciaRef.id,
    userId: userId.trim(),
    username: username.trim().slice(0, 30),
    avatar: typeof avatar === 'string' ? avatar : '',
    mensaje: mensajeNormalizado,
    createdAt: serverTimestamp(),
    expiresAt: Timestamp.fromMillis(expiresAtMs),
  };

  await setDoc(esenciaRef, payload);

  return {
    ...payload,
    id: esenciaRef.id,
    createdAtMs: nowMs,
    expiresAtMs,
  };
};

/**
 * Suscripción en tiempo real de esencias activas.
 * Incluye refresco periódico de query para garantizar expiración visual sin writes externos.
 */
export const subscribeToActiveEsencias = (onUpdate, onError) => {
  if (typeof onUpdate !== 'function') {
    throw new Error('subscribeToActiveEsencias requiere un callback onUpdate');
  }

  const esenciasRef = collection(db, ESENCIAS_COLLECTION);
  let latestEsencias = [];
  let unsubscribeSnapshot = null;
  let usingFallbackQuery = false;

  const emitActive = () => {
    onUpdate(computeActiveEsencias(latestEsencias));
  };

  const applySnapshot = (snapshot) => {
    latestEsencias = snapshot.docs.map(normalizeEsenciaDoc);
    emitActive();
  };

  const startFallbackListener = () => {
    usingFallbackQuery = true;

    const fallbackQuery = query(
      esenciasRef,
      orderBy('createdAt', 'desc'),
      limit(SNAPSHOT_FETCH_LIMIT)
    );

    if (unsubscribeSnapshot) unsubscribeSnapshot();
    unsubscribeSnapshot = onSnapshot(
      fallbackQuery,
      applySnapshot,
      (error) => {
        if (onError) onError(error);
      }
    );
  };

  const startPrimaryListener = () => {
    const nowTimestamp = Timestamp.now();

    const activeQuery = query(
      esenciasRef,
      where('expiresAt', '>', nowTimestamp),
      orderBy('expiresAt', 'asc'),
      orderBy('createdAt', 'desc'),
      limit(SNAPSHOT_FETCH_LIMIT)
    );

    if (unsubscribeSnapshot) unsubscribeSnapshot();
    unsubscribeSnapshot = onSnapshot(
      activeQuery,
      (snapshot) => {
        usingFallbackQuery = false;
        applySnapshot(snapshot);
      },
      (error) => {
        // Fallback para casos de índice faltante u otra incompatibilidad temporal.
        if (error?.code === 'failed-precondition') {
          console.warn('[ESENCIAS] Índice faltante para query principal, usando fallback temporal.');
          startFallbackListener();
          return;
        }

        if (onError) onError(error);
      }
    );
  };

  startPrimaryListener();

  const refreshQueryInterval = setInterval(() => {
    if (!usingFallbackQuery) {
      startPrimaryListener();
      return;
    }
    emitActive();
  }, QUERY_REFRESH_INTERVAL_MS);

  const pruneInterval = setInterval(() => {
    emitActive();
  }, PRUNE_INTERVAL_MS);

  return () => {
    clearInterval(refreshQueryInterval);
    clearInterval(pruneInterval);
    if (unsubscribeSnapshot) unsubscribeSnapshot();
  };
};

