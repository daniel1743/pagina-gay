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
import { supabase, isSupabaseAuthEnabled } from '@/config/supabase';

// ═══════════════════════════════════════════════════════════════════
// CREAR EVENTO
// ═══════════════════════════════════════════════════════════════════

/**
 * Crear un nuevo evento programado
 * @param {Object} eventData - { nombre, descripcion, fechaInicio (Date), duracionMinutos }
 * @returns {Object} evento creado con id
 */
export async function crearEvento({ nombre, descripcion, fechaInicio, duracionMinutos }) {
  if (isSupabaseAuthEnabled()) {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.id) throw new Error('Debes estar autenticado');
    if (!nombre?.trim()) throw new Error('El nombre es obligatorio');
    if (!fechaInicio) throw new Error('La fecha de inicio es obligatoria');
    if (!duracionMinutos || duracionMinutos < 5) throw new Error('Duración mínima: 5 minutos');
    const inicioMs = fechaInicio instanceof Date ? fechaInicio.getTime() : Number(fechaInicio);
    const finMs = inicioMs + Number(duracionMinutos) * 60 * 1000;
    const roomId = `evento_${inicioMs}_${crypto.randomUUID().slice(0, 8)}`;
    const { data, error } = await supabase.from('events').insert({ name: nombre.trim(), description: (descripcion || '').trim(), room_id: roomId, starts_at: new Date(inicioMs).toISOString(), ends_at: new Date(finMs).toISOString(), duration_minutes: Number(duracionMinutos), created_by: authData.user.id }).select('*').single();
    if (error) throw error;
    return mapSupabaseEvent(data);
  }
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
  if (isSupabaseAuthEnabled()) {
    try {
      const { data, error } = await supabase.from('events').select('*').eq('active', true).order('starts_at', { ascending: true }).limit(100);
      if (error) throw error;
      return (data || []).map(mapSupabaseEvent).filter((event) => !isEventoFinalizado(event) || (Date.now() - new Date(event.fechaFin).getTime()) < 3600000);
    } catch (error) {
      console.warn('[EVENTOS] Error obteniendo eventos Supabase:', error?.message || error);
      return [];
    }
  }
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
  if (isSupabaseAuthEnabled()) {
    const { data, error } = await supabase.from('events').select('*').order('starts_at', { ascending: false }).limit(100);
    if (error) throw error;
    return (data || []).map(mapSupabaseEvent);
  }
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
  if (isSupabaseAuthEnabled()) {
    const { data, error } = await supabase.from('events').select('*').eq('id', eventoId).maybeSingle();
    if (error) throw error;
    return data ? mapSupabaseEvent(data) : null;
  }
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
  if (isSupabaseAuthEnabled()) {
    let active = true;
    const load = async () => { const events = await obtenerEventosVisibles(); if (active) callback(events); };
    void load();
    const channel = supabase.channel('events-public').on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => { void load(); }).subscribe();
    return () => { active = false; void supabase.removeChannel(channel); };
  }
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

  if (isSupabaseAuthEnabled()) {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user?.id !== user.id || authData.user.is_anonymous) return false;
      const { error } = await supabase.from('event_attendees').upsert({ event_id: eventoId, user_id: user.id }, { onConflict: 'event_id,user_id' });
      if (error) throw error;
      return true;
    } catch (error) {
      console.warn('[EVENTOS] Error uniéndose en Supabase:', error?.message || error);
      return false;
    }
  }

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
  if (isSupabaseAuthEnabled()) {
    const { count, error } = await supabase.from('event_attendees').select('user_id', { count: 'exact', head: true }).eq('event_id', eventoId);
    if (error) throw error;
    return Number(count || 0);
  }
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

const mapSupabaseEvent = (row) => ({
  id: row.id,
  nombre: row.name,
  descripcion: row.description || '',
  roomId: row.room_id,
  fechaInicio: row.starts_at,
  fechaFin: row.ends_at,
  duracionMinutos: row.duration_minutes,
  creadoPor: row.created_by,
  creadoEn: row.created_at,
  activo: row.active,
  estado: row.status,
  asistentesCount: Number(row.attendees_count || 0),
});

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
  if (!roomId?.startsWith?.('evento_') || !user?.id) return null;
  if (isSupabaseAuthEnabled()) {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user?.id !== user.id || authData.user.is_anonymous) return null;
      const { data: event, error: eventError } = await supabase.from('events').select('id').eq('room_id', roomId).maybeSingle();
      if (eventError) throw eventError;
      if (!event) return null;
      const { error } = await supabase.from('event_attendees').upsert({ event_id: event.id, user_id: user.id }, { onConflict: 'event_id,user_id' });
      if (error) throw error;
      return event.id;
    } catch (error) {
      console.warn('[EVENTOS] Error registrando participación Supabase:', error?.message || error);
      return null;
    }
  }
  if (!auth.currentUser) return null;

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

  if (isSupabaseAuthEnabled()) {
    const [attendees, messages, replies, presence, latest] = await Promise.all([
      supabase.from('event_attendees').select('user_id', { count: 'exact', head: true }).eq('event_id', evento.id),
      supabase.from('messages').select('id', { count: 'exact', head: true }).eq('room_id', evento.roomId).is('deleted_at', null),
      supabase.from('messages').select('id', { count: 'exact', head: true }).eq('room_id', evento.roomId).not('reply_to', 'is', null).is('deleted_at', null),
      supabase.from('room_presence').select('user_id', { count: 'exact', head: true }).eq('room_id', evento.roomId).gt('last_seen_at', new Date(Date.now() - 10 * 60 * 1000).toISOString()),
      supabase.from('messages').select('created_at').eq('room_id', evento.roomId).is('deleted_at', null).order('created_at', { ascending: false }).limit(1),
    ]);
    const errors = [attendees, messages, replies, presence, latest].map((item) => item.error).filter(Boolean);
    if (errors.length) throw errors[0];
    const participantes = Number(attendees.count || 0);
    const mensajes = Number(messages.count || 0);
    const respuestas = Number(replies.count || 0);
    const conexionesActivas = Number(presence.count || 0);
    const duracionHoras = Math.max((Number(evento.duracionMinutos) || 60) / 60, 0.25);
    const mensajesPorHora = Number((mensajes / duracionHoras).toFixed(1));
    const ultimaActividadMs = latest.data?.[0]?.created_at ? new Date(latest.data[0].created_at).getTime() : 0;
    return { participantes, mensajes, respuestas, conexionesActivas, tasaRespuesta: mensajes > 0 ? Math.round((respuestas / mensajes) * 100) : 0, mensajesPorHora, traficoNivel: clasificarTrafico(mensajesPorHora), interesNivel: clasificarInteres(participantes), huboInteres: participantes > 0 || mensajes > 0, ultimaActividadMs };
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
  if (isSupabaseAuthEnabled()) {
    const { error } = await supabase.from('events').update({ active: false, status: 'cancelado' }).eq('id', eventoId);
    if (error) throw error;
    return true;
  }
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
  if (isSupabaseAuthEnabled()) {
    const { error } = await supabase.from('events').delete().eq('id', eventoId);
    if (error) throw error;
    return true;
  }
  try {
    await deleteDoc(doc(db, 'eventos', eventoId));
    console.log('[EVENTOS] Evento eliminado:', eventoId);
    return true;
  } catch (error) {
    console.error('[EVENTOS] Error eliminando evento:', error);
    return false;
  }
}
