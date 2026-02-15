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
} from 'firebase/firestore';
import { db, auth } from '@/config/firebase';
import { isEventoActivo, isEventoProgramado, isEventoFinalizado } from '@/utils/eventosUtils';

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
    const q = query(eventosRef, where('activo', '==', true), orderBy('fechaInicio', 'asc'));
    const snapshot = await getDocs(q);

    const eventos = [];
    snapshot.forEach(docSnap => {
      const evento = { id: docSnap.id, ...docSnap.data() };
      // Solo incluir activos y programados (no finalizados hace más de 1 hora)
      if (!isEventoFinalizado(evento) || (Date.now() - (evento.fechaFin?.toMillis?.() || 0)) < 3600000) {
        eventos.push(evento);
      }
    });

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
  const q = query(eventosRef, where('activo', '==', true), orderBy('fechaInicio', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const eventos = [];
    snapshot.forEach(docSnap => {
      const evento = { id: docSnap.id, ...docSnap.data() };
      // Incluir activos y programados
      if (!isEventoFinalizado(evento) || (Date.now() - (evento.fechaFin?.toMillis?.() || 0)) < 3600000) {
        eventos.push(evento);
      }
    });
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
    await setDoc(asistRef, {
      userId: user.id,
      username: user.username || 'Usuario',
      joinedAt: serverTimestamp(),
    });

    // Incrementar contador
    await updateDoc(doc(db, 'eventos', eventoId), {
      asistentesCount: (await contarAsistentes(eventoId)),
    }).catch(() => {});

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
