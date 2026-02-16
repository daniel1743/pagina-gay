/**
 * 📅 SERVICIO DE EVENTOS
 * CRUD completo para eventos programados con salas automáticas
 * 100% client-side, sin Cloud Functions
 */

import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  limit,
  getCountFromServer,
} from 'firebase/firestore';
import { db, auth } from '@/config/firebase';
import { isEventoFinalizado } from '@/utils/eventosUtils';
import { incrementEventosParticipados } from '@/services/badgeService';

// ═══════════════════════════════════════════════════════════════════
// CREAR EVENTO
// ═══════════════════════════════════════════════════════════════════

/**
 * Crear un nuevo evento programado
 * @param {Object} eventData - { nombre, descripcion, fechaInicio (Date), duracionMinutos }
 * @returns {Object} evento creado con id
 */
export async function crearEvento({ nombre, descripcion, fechaInicio, duracionMinutos }) {
  if (!auth.currentUser) throw new Error('Debes estar autenticado');
  if (!nombre?.trim()) throw new Error('El nombre es obligatorio');
  if (!fechaInicio) throw new Error('La fecha de inicio es obligatoria');
  if (!duracionMinutos || duracionMinutos < 5) throw new Error('Duración mínima: 5 minutos');

  const inicioMs = fechaInicio instanceof Date ? fechaInicio.getTime() : fechaInicio;
  const finMs = inicioMs + (duracionMinutos * 60 * 1000);
  const roomId = `evento_${inicioMs}`;

  const eventoData = {
    nombre: nombre.trim(),
    descripcion: (descripcion || '').trim(),
    roomId,
    fechaInicio: Timestamp.fromMillis(inicioMs),
    fechaFin: Timestamp.fromMillis(finMs),
    duracionMinutos,
    creadoPor: auth.currentUser.uid,
    creadoEn: serverTimestamp(),
    activo: true,
    estado: 'programado',
    asistentesCount: 0,
  };

  const docRef = await addDoc(collection(db, 'eventos'), eventoData);
  console.log('[EVENTOS] Evento creado:', docRef.id, roomId);

  return { id: docRef.id, ...eventoData };
}

// ═══════════════════════════════════════════════════════════════════
// OBTENER EVENTOS
// ═══════════════════════════════════════════════════════════════════

/**
 * Obtener todos los eventos activos y programados (no finalizados)
 */
export async function obtenerEventosVisibles() {
  try {
    const eventosRef = collection(db, 'eventos');
    const q = query(eventosRef, where('activo', '==', true));
    const snapshot = await getDocs(q);

    const eventos = [];
    snapshot.forEach(docSnap => {
      const evento = { id: docSnap.id, ...docSnap.data() };
      // Solo incluir activos y programados (no finalizados hace más de 1 hora)
      if (!isEventoFinalizado(evento) || (Date.now() - (evento.fechaFin?.toMillis?.() || 0)) < 3600000) {
        eventos.push(evento);
      }
    });

    // Ordenar por fechaInicio en cliente
    eventos.sort((a, b) => (a.fechaInicio?.toMillis?.() || 0) - (b.fechaInicio?.toMillis?.() || 0));
    return eventos;
  } catch (error) {
    console.error('[EVENTOS] Error obteniendo eventos:', error);
    return [];
  }
}

/**
 * Obtener todos los eventos (para admin)
 */
export async function obtenerTodosLosEventos() {
  try {
    const eventosRef = collection(db, 'eventos');
    const q = query(eventosRef, orderBy('fechaInicio', 'desc'), limit(50));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
  } catch (error) {
    console.error('[EVENTOS] Error obteniendo todos los eventos:', error);
    return [];
  }
}

/**
 * Obtener un evento por ID
 */
export async function obtenerEventoPorId(eventoId) {
  try {
    const docSnap = await getDoc(doc(db, 'eventos', eventoId));
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() };
  } catch (error) {
    console.error('[EVENTOS] Error obteniendo evento:', error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════
// SUSCRIPCIÓN REAL-TIME
// ═══════════════════════════════════════════════════════════════════

/**
 * Suscribirse a eventos activos/programados en tiempo real
 * @param {Function} callback - Recibe array de eventos
 * @returns {Function} unsubscribe
 */
export function suscribirseAEventos(callback) {
  const eventosRef = collection(db, 'eventos');
  // Solo filtrar por activo, ordenar en cliente (evita necesidad de composite index)
  const q = query(eventosRef, where('activo', '==', true));

  return onSnapshot(q, (snapshot) => {
    const eventos = [];
    snapshot.forEach(docSnap => {
      const evento = { id: docSnap.id, ...docSnap.data() };
      // Incluir activos y programados
      if (!isEventoFinalizado(evento) || (Date.now() - (evento.fechaFin?.toMillis?.() || 0)) < 3600000) {
        eventos.push(evento);
      }
    });
    // Ordenar por fechaInicio en cliente
    eventos.sort((a, b) => (a.fechaInicio?.toMillis?.() || 0) - (b.fechaInicio?.toMillis?.() || 0));
    callback(eventos);
  }, (error) => {
    console.error('[EVENTOS] Error en suscripción:', error);
    callback([]);
  });
}

// ═══════════════════════════════════════════════════════════════════
// ASISTENTES
// ═══════════════════════════════════════════════════════════════════

/**
 * Registrar asistencia a un evento
 */
export async function unirseAEvento(eventoId, user) {
  if (!eventoId || !user?.id) return false;

  try {
    const asistRef = doc(db, 'eventos', eventoId, 'asistentes', user.id);

    // Verificar si ya estaba registrado (para no incrementar badge dos veces)
    const existingSnap = await getDoc(asistRef);
    const yaRegistrado = existingSnap.exists();

    await setDoc(asistRef, {
      userId: user.id,
      username: user.username || 'Usuario',
      joinedAt: serverTimestamp(),
    });

    // Incrementar contador de asistentes
    await updateDoc(doc(db, 'eventos', eventoId), {
      asistentesCount: (await contarAsistentes(eventoId)),
    }).catch(() => {});

    // 🏅 Incrementar badge solo la primera vez que se une a este evento
    if (!yaRegistrado) {
      incrementEventosParticipados(user.id).catch(() => {});
    }

    console.log('[EVENTOS] Usuario unido a evento:', eventoId);
    return true;
  } catch (error) {
    console.error('[EVENTOS] Error uniéndose a evento:', error);
    return false;
  }
}

/**
 * Contar asistentes de un evento
 */
export async function contarAsistentes(eventoId) {
  try {
    const snapshot = await getDocs(collection(db, 'eventos', eventoId, 'asistentes'));
    return snapshot.size;
  } catch {
    return 0;
  }
}

// ═══════════════════════════════════════════════════════════════════
// MÉTRICAS / DASHBOARD ADMIN
// ═══════════════════════════════════════════════════════════════════

const getTimestampMs = (value) => {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  if (value.toMillis) return value.toMillis();
  if (value.seconds) return value.seconds * 1000;
  return new Date(value).getTime() || 0;
};

const clasificarTrafico = (mensajesPorHora) => {
  if (mensajesPorHora <= 0) return 'sin-trafico';
  if (mensajesPorHora < 15) return 'bajo';
  if (mensajesPorHora < 40) return 'medio';
  return 'alto';
};

const clasificarInteres = (participantes) => {
  if (participantes <= 0) return 'sin-interes';
  if (participantes < 5) return 'bajo';
  if (participantes < 15) return 'medio';
  return 'alto';
};

const safeCount = async (queryRef, fallback = null) => {
  try {
    const countSnap = await getCountFromServer(queryRef);
    return countSnap?.data?.()?.count || 0;
  } catch (error) {
    if (fallback) {
      try {
        return await fallback();
      } catch {
        return 0;
      }
    }
    return 0;
  }
};

/**
 * Registrar participación cuando un usuario entra a una sala de evento.
 * Esto permite medir interés/participantes aunque no pulse "Recordarme".
 */
export async function registrarParticipacionEvento(roomId, user) {
  if (!roomId?.startsWith?.('evento_') || !user?.id || !auth.currentUser) return null;

  try {
    const eventosRef = collection(db, 'eventos');
    const q = query(eventosRef, where('roomId', '==', roomId), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const eventoDoc = snapshot.docs[0];
    await setDoc(doc(db, 'eventos', eventoDoc.id, 'asistentes', user.id), {
      userId: user.id,
      username: user.username || 'Usuario',
      joinedAt: serverTimestamp(),
      source: 'room_entry',
    }, { merge: true });

    return eventoDoc.id;
  } catch (error) {
    console.error('[EVENTOS] Error registrando participación en sala de evento:', error);
    return null;
  }
}

/**
 * Obtener métricas operativas de un evento para dashboard de admin.
 */
export async function obtenerMetricasEvento(evento) {
  if (!evento?.id || !evento?.roomId) {
    return {
      participantes: 0,
      mensajes: 0,
      respuestas: 0,
      conexionesActivas: 0,
      tasaRespuesta: 0,
      mensajesPorHora: 0,
      traficoNivel: 'sin-trafico',
      interesNivel: 'sin-interes',
      huboInteres: false,
      ultimaActividadMs: 0,
    };
  }

  const asistentesRef = collection(db, 'eventos', evento.id, 'asistentes');
  const mensajesRef = collection(db, 'rooms', evento.roomId, 'messages');
  const presenciaRef = collection(db, 'roomPresence', evento.roomId, 'users');

  const respuestasQuery = query(mensajesRef, where('replyTo', '!=', null));
  const ultimoMensajeQuery = query(mensajesRef, orderBy('timestamp', 'desc'), limit(1));

  const [participantes, mensajes, respuestas, conexionesActivas, ultimoMensajeSnap] = await Promise.all([
    safeCount(asistentesRef, async () => (await getDocs(asistentesRef)).size),
    safeCount(mensajesRef, async () => (await getDocs(mensajesRef)).size),
    safeCount(respuestasQuery, async () => {
      const allMsgs = await getDocs(mensajesRef);
      let total = 0;
      allMsgs.forEach((docSnap) => {
        if (docSnap.data()?.replyTo) total += 1;
      });
      return total;
    }),
    safeCount(presenciaRef, async () => (await getDocs(presenciaRef)).size),
    getDocs(ultimoMensajeQuery).catch(() => null),
  ]);

  const duracionHoras = Math.max((Number(evento.duracionMinutos) || 60) / 60, 0.25);
  const mensajesPorHora = Number((mensajes / duracionHoras).toFixed(1));
  const tasaRespuesta = mensajes > 0 ? Math.round((respuestas / mensajes) * 100) : 0;
  const traficoNivel = clasificarTrafico(mensajesPorHora);
  const interesNivel = clasificarInteres(participantes);
  const huboInteres = participantes > 0 || mensajes > 0;

  let ultimaActividadMs = 0;
  if (ultimoMensajeSnap && !ultimoMensajeSnap.empty) {
    ultimaActividadMs = getTimestampMs(ultimoMensajeSnap.docs[0].data()?.timestamp);
  }

  return {
    participantes,
    mensajes,
    respuestas,
    conexionesActivas,
    tasaRespuesta,
    mensajesPorHora,
    traficoNivel,
    interesNivel,
    huboInteres,
    ultimaActividadMs,
  };
}

/**
 * Obtener métricas para una lista de eventos (mapa por eventId).
 */
export async function obtenerMetricasEventos(eventos = []) {
  if (!Array.isArray(eventos) || eventos.length === 0) return {};

  const entries = await Promise.all(
    eventos.map(async (evento) => {
      const metricas = await obtenerMetricasEvento(evento);
      return [evento.id, metricas];
    })
  );

  return Object.fromEntries(entries);
}

// ═══════════════════════════════════════════════════════════════════
// ADMIN: EDITAR / ELIMINAR
// ═══════════════════════════════════════════════════════════════════

/**
 * Desactivar un evento (soft delete)
 */
export async function desactivarEvento(eventoId) {
  try {
    await updateDoc(doc(db, 'eventos', eventoId), { activo: false });
    console.log('[EVENTOS] Evento desactivado:', eventoId);
    return true;
  } catch (error) {
    console.error('[EVENTOS] Error desactivando evento:', error);
    return false;
  }
}

/**
 * Eliminar evento permanentemente
 */
export async function eliminarEvento(eventoId) {
  try {
    await deleteDoc(doc(db, 'eventos', eventoId));
    console.log('[EVENTOS] Evento eliminado:', eventoId);
    return true;
  } catch (error) {
    console.error('[EVENTOS] Error eliminando evento:', error);
    return false;
  }
}
