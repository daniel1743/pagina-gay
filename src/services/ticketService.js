import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
  serverTimestamp,
  where,
  getDocs,
  limit,
} from 'firebase/firestore';
import { db, auth } from '@/config/firebase';

/**
 * Servicio de Tickets de Soporte
 * Permite a usuarios crear tickets y a admins resolverlos
 */

/**
 * Crea un nuevo ticket de soporte
 * @param {object} ticketData - Datos del ticket
 * @returns {Promise<string>} ID del ticket creado
 */
export const createTicket = async (ticketData) => {
  if (!auth.currentUser) {
    throw new Error('Debes estar autenticado para crear un ticket');
  }

  const ticketsRef = collection(db, 'tickets');

  const ticket = {
    userId: auth.currentUser.uid,
    username: ticketData.username || 'Usuario',
    email: ticketData.email || '',
    subject: ticketData.subject,
    description: ticketData.description,
    category: ticketData.category || 'general', // general, technical, billing, bug, feature
    priority: ticketData.priority || 'medium', // low, medium, high, urgent
    status: 'open', // open, in_progress, resolved, closed
    attachments: ticketData.attachments || [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    resolvedBy: null,
    resolvedAt: null,
    adminNotes: null,
  };

  const docRef = await addDoc(ticketsRef, ticket);
  return docRef.id;
};

/**
 * Obtiene todos los tickets (SOLO ADMIN)
 * @param {string} status - Filtrar por estado (opcional)
 * @returns {Promise<Array>} Lista de tickets
 */
export const getAllTickets = async (status = null) => {
  try {
    const ticketsRef = collection(db, 'tickets');
    let q;

    if (status) {
      q = query(ticketsRef, where('status', '==', status), orderBy('createdAt', 'desc'));
    } else {
      q = query(ticketsRef, orderBy('createdAt', 'desc'));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      resolvedAt: doc.data().resolvedAt?.toDate?.()?.toISOString() || null,
    }));
  } catch (error) {
    console.error('Error getting tickets:', error);
    throw error;
  }
};

/**
 * Obtiene los tickets de un usuario específico
 * @param {string} userId - ID del usuario
 * @returns {Promise<Array>} Lista de tickets del usuario
 */
export const getUserTickets = async (userId) => {
  try {
    const ticketsRef = collection(db, 'tickets');
    const q = query(
      ticketsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      resolvedAt: doc.data().resolvedAt?.toDate?.()?.toISOString() || null,
    }));
  } catch (error) {
    console.error('Error getting user tickets:', error);
    throw error;
  }
};

/**
 * Actualiza el estado de un ticket (SOLO ADMIN)
 * @param {string} ticketId - ID del ticket
 * @param {string} newStatus - Nuevo estado
 * @param {string} adminId - ID del admin que resuelve
 * @param {string} adminNotes - Notas del admin (opcional)
 */
export const updateTicketStatus = async (ticketId, newStatus, adminId, adminNotes = null) => {
  try {
    const ticketRef = doc(db, 'tickets', ticketId);
    const updateData = {
      status: newStatus,
      updatedAt: serverTimestamp(),
    };

    if (newStatus === 'resolved' || newStatus === 'closed') {
      updateData.resolvedBy = adminId;
      updateData.resolvedAt = serverTimestamp();
    }

    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }

    await updateDoc(ticketRef, updateData);
  } catch (error) {
    console.error('Error updating ticket status:', error);
    throw error;
  }
};

/**
 * Suscripción en tiempo real a todos los tickets (SOLO ADMIN)
 * OPTIMIZADO: Limita a últimos 50 tickets para reducir lecturas
 * @param {function} callback - Función callback que recibe los tickets
 * @param {number} ticketLimit - Límite de tickets (default: 50)
 * @returns {function} Función para desuscribirse
 */
export const subscribeToTickets = (callback, ticketLimit = 50) => {
  const ticketsRef = collection(db, 'tickets');
  // OPTIMIZACIÓN: Limitar a últimos 50 tickets
  const q = query(
    ticketsRef,
    orderBy('createdAt', 'desc'),
    limit(ticketLimit)
  );

  return onSnapshot(q, (snapshot) => {
    const tickets = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      resolvedAt: doc.data().resolvedAt?.toDate?.()?.toISOString() || null,
    }));
    callback(tickets);
  }, (error) => {
    console.error('Error subscribing to tickets:', error);
    callback([]);
  });
};

/**
 * Suscripción en tiempo real a tickets de un usuario
 * @param {string} userId - ID del usuario
 * @param {function} callback - Función callback que recibe los tickets
 * @returns {function} Función para desuscribirse
 */
export const subscribeToUserTickets = (userId, callback) => {
  const ticketsRef = collection(db, 'tickets');
  const q = query(
    ticketsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const tickets = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      resolvedAt: doc.data().resolvedAt?.toDate?.()?.toISOString() || null,
    }));
    callback(tickets);
  }, (error) => {
    console.error('Error subscribing to user tickets:', error);
    callback([]);
  });
};

