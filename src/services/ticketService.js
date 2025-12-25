import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
  getDocs,
  serverTimestamp,
  where,
  limit,
  writeBatch,
  runTransaction
} from 'firebase/firestore';
import { db, auth } from '@/config/firebase';

/**
 * SERVICIO DE TICKETS DE SOPORTE - VERSIÓN EXTENDIDA
 *
 * Características:
 * - Thread de conversación (mensajes staff/user)
 * - Notas internas (solo staff)
 * - Logs de auditoría
 * - Notificaciones al usuario
 * - Búsqueda y filtros avanzados
 * - Asignación de tickets
 * - Cambios de prioridad
 *
 * COMPATIBILIDAD: Mantiene funciones originales para no romper código existente
 */

// ============================================
// CONSTANTES
// ============================================

export const TICKET_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  WAITING_USER: 'waiting_user',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
  SPAM: 'spam'
};

export const TICKET_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

export const TICKET_CATEGORY = {
  GENERAL: 'general',
  USERNAME_CHANGE: 'username_change',
  TECHNICAL: 'technical',
  BILLING: 'billing',
  BUG: 'bug',
  ABUSE: 'abuse',
  FEATURE: 'feature'
};

export const MESSAGE_TYPE = {
  EXTERNAL: 'external', // Visible para usuario
  INTERNAL: 'internal'  // Solo visible para staff
};

export const MESSAGE_AUTHOR = {
  USER: 'user',
  STAFF: 'staff'
};

export const LOG_ACTION = {
  CREATED: 'created',
  STATUS_CHANGE: 'status_change',
  ASSIGNED: 'assigned',
  UNASSIGNED: 'unassigned',
  MESSAGE_SENT: 'message_sent',
  NOTE_ADDED: 'note_added',
  USERNAME_CHANGED: 'username_changed',
  PRIORITY_CHANGED: 'priority_changed',
  CATEGORY_CHANGED: 'category_changed'
};

// ============================================
// CREAR TICKET (MANTIENE COMPATIBILIDAD)
// ============================================

/**
 * Crea un nuevo ticket de soporte
 * COMPATIBILIDAD: Mantiene firma original + agrega funcionalidades nuevas
 * @param {object} ticketData - Datos del ticket
 * @returns {Promise<string>} ID del ticket creado
 */
export const createTicket = async (ticketData) => {
  if (!auth.currentUser) {
    throw new Error('Debes estar autenticado para crear un ticket');
  }

  try {
    const ticketsRef = collection(db, 'tickets');
    const now = serverTimestamp();
    const userUid = auth.currentUser.uid;

    // Crear ticket principal
    const ticket = {
      // Campos originales (compatibilidad)
      userId: userUid,
      username: ticketData.username || 'Usuario',
      email: ticketData.email || '',
      subject: ticketData.subject,
      description: ticketData.description,
      category: ticketData.category || TICKET_CATEGORY.GENERAL,
      priority: ticketData.priority || TICKET_PRIORITY.MEDIUM,
      status: TICKET_STATUS.OPEN,
      attachments: ticketData.attachments || [],
      createdAt: now,
      updatedAt: now,
      resolvedBy: null,
      resolvedAt: null,
      adminNotes: null,

      // Campos nuevos
      userUid: userUid,
      usernameSnapshot: ticketData.username || 'Usuario',
      assignedTo: null,
      lastMessageAt: now
    };

    const docRef = await addDoc(ticketsRef, ticket);
    const ticketId = docRef.id;

    // Crear mensaje inicial (descripción del problema)
    const messagesRef = collection(db, 'tickets', ticketId, 'messages');
    await addDoc(messagesRef, {
      type: MESSAGE_TYPE.EXTERNAL,
      author: MESSAGE_AUTHOR.USER,
      authorUid: userUid,
      authorUsername: ticketData.username || 'Usuario',
      body: ticketData.description,
      attachments: ticketData.attachments || [],
      createdAt: now
    });

    // Crear log de creación
    const logsRef = collection(db, 'tickets', ticketId, 'logs');
    await addDoc(logsRef, {
      action: LOG_ACTION.CREATED,
      actorUid: userUid,
      actorRole: 'user',
      meta: {
        subject: ticketData.subject,
        category: ticketData.category || TICKET_CATEGORY.GENERAL,
        priority: ticketData.priority || TICKET_PRIORITY.MEDIUM
      },
      createdAt: now
    });

    console.log('✅ Ticket creado con ID:', ticketId);
    return ticketId;
  } catch (error) {
    console.error('❌ Error creando ticket:', error);
    throw error;
  }
};

// ============================================
// LEER TICKETS (MANTIENE COMPATIBILIDAD)
// ============================================

/**
 * Obtiene todos los tickets (SOLO ADMIN)
 * COMPATIBILIDAD: Mantiene firma original
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
    console.error('❌ Error getting tickets:', error);
    throw error;
  }
};

/**
 * NUEVO: Obtiene tickets con filtros avanzados
 * @param {Object} filters - Filtros opcionales
 * @returns {Promise<Array>} Lista de tickets filtrados
 */
export const getTicketsAdvanced = async (filters = {}) => {
  try {
    const ticketsRef = collection(db, 'tickets');
    let q = query(ticketsRef);

    // Aplicar filtros
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }

    if (filters.category) {
      q = query(q, where('category', '==', filters.category));
    }

    if (filters.priority) {
      q = query(q, where('priority', '==', filters.priority));
    }

    if (filters.assignedTo) {
      q = query(q, where('assignedTo', '==', filters.assignedTo));
    }

    // Ordenar
    const orderByField = filters.orderBy || 'updatedAt';
    const orderDirection = filters.orderDirection || 'desc';
    q = query(q, orderBy(orderByField, orderDirection));

    // Límite
    if (filters.limit) {
      q = query(q, limit(filters.limit));
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
    console.error('❌ Error getting tickets with filters:', error);
    throw error;
  }
};

/**
 * Obtiene los tickets de un usuario específico
 * COMPATIBILIDAD: Mantiene firma original
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
    console.error('❌ Error getting user tickets:', error);
    throw error;
  }
};

/**
 * NUEVO: Obtener un ticket por ID
 * @param {string} ticketId - ID del ticket
 * @returns {Promise<Object>} Datos del ticket
 */
export const getTicketById = async (ticketId) => {
  try {
    const ticketRef = doc(db, 'tickets', ticketId);
    const ticketSnap = await getDoc(ticketRef);

    if (!ticketSnap.exists()) {
      throw new Error('Ticket no encontrado');
    }

    const data = ticketSnap.data();
    return {
      id: ticketSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      resolvedAt: data.resolvedAt?.toDate?.()?.toISOString() || null,
    };
  } catch (error) {
    console.error('❌ Error getting ticket:', error);
    throw error;
  }
};

/**
 * NUEVO: Suscripción en tiempo real a un ticket
 * @param {string} ticketId - ID del ticket
 * @param {Function} callback - Función callback con los datos
 * @returns {Function} Función para cancelar la suscripción
 */
export const subscribeToTicket = (ticketId, callback) => {
  const ticketRef = doc(db, 'tickets', ticketId);

  return onSnapshot(ticketRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      callback({
        id: snapshot.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        resolvedAt: data.resolvedAt?.toDate?.()?.toISOString() || null,
      });
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('❌ Error en suscripción a ticket:', error);
  });
};

// ============================================
// ACTUALIZAR TICKET (MANTIENE COMPATIBILIDAD)
// ============================================

/**
 * Actualiza el estado de un ticket (SOLO ADMIN)
 * COMPATIBILIDAD: Mantiene firma original
 * @param {string} ticketId - ID del ticket
 * @param {string} newStatus - Nuevo estado
 * @param {string} adminId - ID del admin que resuelve
 * @param {string} adminNotes - Notas del admin (opcional)
 */
export const updateTicketStatus = async (ticketId, newStatus, adminId, adminNotes = null) => {
  try {
    const ticketRef = doc(db, 'tickets', ticketId);
    const now = serverTimestamp();

    const updateData = {
      status: newStatus,
      updatedAt: now,
    };

    if (newStatus === 'resolved' || newStatus === 'closed') {
      updateData.resolvedBy = adminId;
      updateData.resolvedAt = now;
    }

    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }

    await updateDoc(ticketRef, updateData);

    // Crear log de cambio de estado
    const logsRef = collection(db, 'tickets', ticketId, 'logs');
    await addDoc(logsRef, {
      action: LOG_ACTION.STATUS_CHANGE,
      actorUid: adminId,
      actorRole: 'staff',
      meta: {
        newStatus,
        notes: adminNotes
      },
      createdAt: now
    });

    console.log('✅ Estado actualizado a:', newStatus);
  } catch (error) {
    console.error('❌ Error updating ticket status:', error);
    throw error;
  }
};

/**
 * NUEVO: Actualizar estado con más control
 * @param {string} ticketId - ID del ticket
 * @param {string} newStatus - Nuevo estado
 * @param {string} actorUid - UID del que realiza la acción
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<void>}
 */
export const updateTicketStatusAdvanced = async (ticketId, newStatus, actorUid, options = {}) => {
  try {
    const ticket = await getTicketById(ticketId);
    const oldStatus = ticket.status;

    if (oldStatus === newStatus) {
      console.log('ℹ️ El estado ya es el mismo');
      return;
    }

    const now = serverTimestamp();
    const batch = writeBatch(db);

    // Actualizar ticket
    const ticketRef = doc(db, 'tickets', ticketId);
    const updateData = {
      status: newStatus,
      updatedAt: now
    };

    if (newStatus === TICKET_STATUS.RESOLVED || newStatus === TICKET_STATUS.CLOSED) {
      updateData.resolvedBy = actorUid;
      updateData.resolvedAt = now;
    }

    if (options.notes) {
      updateData.adminNotes = options.notes;
    }

    batch.update(ticketRef, updateData);

    // Crear log
    const logsRef = collection(db, 'tickets', ticketId, 'logs');
    const logRef = doc(logsRef);
    batch.set(logRef, {
      action: LOG_ACTION.STATUS_CHANGE,
      actorUid,
      actorRole: 'staff',
      meta: {
        oldStatus,
        newStatus,
        notes: options.notes || null
      },
      createdAt: now
    });

    await batch.commit();

    // Notificar al usuario si se resolvió
    if (newStatus === TICKET_STATUS.RESOLVED && options.notifyUser !== false) {
      await sendTicketNotification(ticket.userId || ticket.userUid, {
        type: 'ticket_resolved',
        ticketId,
        title: 'Tu ticket fue resuelto',
        body: options.notes || 'El equipo de soporte resolvió tu caso.'
      });
    }

    console.log('✅ Estado actualizado:', oldStatus, '→', newStatus);
  } catch (error) {
    console.error('❌ Error actualizando estado avanzado:', error);
    throw error;
  }
};

/**
 * NUEVO: Asignar ticket a un admin/support
 * @param {string} ticketId - ID del ticket
 * @param {string} assignToUid - UID del admin a asignar
 * @param {string} actorUid - UID del que realiza la asignación
 * @returns {Promise<void>}
 */
export const assignTicket = async (ticketId, assignToUid, actorUid) => {
  try {
    const now = serverTimestamp();
    const batch = writeBatch(db);

    // Actualizar ticket
    const ticketRef = doc(db, 'tickets', ticketId);
    batch.update(ticketRef, {
      assignedTo: assignToUid,
      updatedAt: now
    });

    // Crear log
    const logsRef = collection(db, 'tickets', ticketId, 'logs');
    const logRef = doc(logsRef);
    batch.set(logRef, {
      action: LOG_ACTION.ASSIGNED,
      actorUid,
      actorRole: 'staff',
      meta: {
        assignedTo: assignToUid
      },
      createdAt: now
    });

    await batch.commit();

    console.log('✅ Ticket asignado a:', assignToUid);
  } catch (error) {
    console.error('❌ Error asignando ticket:', error);
    throw error;
  }
};

/**
 * NUEVO: Actualizar prioridad del ticket
 * @param {string} ticketId - ID del ticket
 * @param {string} newPriority - Nueva prioridad
 * @param {string} actorUid - UID del que realiza la acción
 * @returns {Promise<void>}
 */
export const updateTicketPriority = async (ticketId, newPriority, actorUid) => {
  try {
    const ticket = await getTicketById(ticketId);
    const oldPriority = ticket.priority;

    const now = serverTimestamp();
    const batch = writeBatch(db);

    // Actualizar ticket
    const ticketRef = doc(db, 'tickets', ticketId);
    batch.update(ticketRef, {
      priority: newPriority,
      updatedAt: now
    });

    // Crear log
    const logsRef = collection(db, 'tickets', ticketId, 'logs');
    const logRef = doc(logsRef);
    batch.set(logRef, {
      action: LOG_ACTION.PRIORITY_CHANGED,
      actorUid,
      actorRole: 'staff',
      meta: {
        oldPriority,
        newPriority
      },
      createdAt: now
    });

    await batch.commit();

    console.log('✅ Prioridad actualizada:', oldPriority, '→', newPriority);
  } catch (error) {
    console.error('❌ Error actualizando prioridad:', error);
    throw error;
  }
};

// ============================================
// MENSAJES (THREAD) - NUEVO
// ============================================

/**
 * Obtener mensajes de un ticket
 * @param {string} ticketId - ID del ticket
 * @returns {Promise<Array>} Lista de mensajes
 */
export const getTicketMessages = async (ticketId) => {
  try {
    const messagesRef = collection(db, 'tickets', ticketId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      };
    });
  } catch (error) {
    console.error('❌ Error obteniendo mensajes:', error);
    throw error;
  }
};

/**
 * Suscribirse a mensajes en tiempo real
 * @param {string} ticketId - ID del ticket
 * @param {Function} callback - Función callback con los mensajes
 * @returns {Function} Función para cancelar la suscripción
 */
export const subscribeToTicketMessages = (ticketId, callback) => {
  const messagesRef = collection(db, 'tickets', ticketId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      };
    });
    callback(messages);
  }, (error) => {
    console.error('❌ Error en suscripción a mensajes:', error);
  });
};

/**
 * Enviar mensaje en un ticket
 * @param {string} ticketId - ID del ticket
 * @param {Object} messageData - Datos del mensaje
 * @returns {Promise<string>} ID del mensaje creado
 */
export const sendTicketMessage = async (ticketId, messageData) => {
  try {
    const {
      type = MESSAGE_TYPE.EXTERNAL,
      author,
      authorUid,
      authorUsername,
      body,
      attachments = []
    } = messageData;

    if (!author || !authorUid || !body) {
      throw new Error('Faltan campos obligatorios en el mensaje');
    }

    const now = serverTimestamp();
    const batch = writeBatch(db);

    // Crear mensaje
    const messagesRef = collection(db, 'tickets', ticketId, 'messages');
    const messageRef = doc(messagesRef);
    batch.set(messageRef, {
      type,
      author,
      authorUid,
      authorUsername: authorUsername || 'Usuario',
      body,
      attachments,
      createdAt: now
    });

    // Actualizar lastMessageAt del ticket
    const ticketRef = doc(db, 'tickets', ticketId);
    batch.update(ticketRef, {
      lastMessageAt: now,
      updatedAt: now
    });

    // Crear log
    const logsRef = collection(db, 'tickets', ticketId, 'logs');
    const logRef = doc(logsRef);
    batch.set(logRef, {
      action: type === MESSAGE_TYPE.INTERNAL ? LOG_ACTION.NOTE_ADDED : LOG_ACTION.MESSAGE_SENT,
      actorUid: authorUid,
      actorRole: author === MESSAGE_AUTHOR.USER ? 'user' : 'staff',
      meta: {
        messageType: type,
        preview: body.substring(0, 100)
      },
      createdAt: now
    });

    await batch.commit();

    // Si es mensaje externo de staff, enviar notificación al usuario
    // IMPORTANTE: También enviar notificación si el usuario se envía un mensaje a sí mismo
    if (type === MESSAGE_TYPE.EXTERNAL && author === MESSAGE_AUTHOR.STAFF) {
      const ticket = await getTicketById(ticketId);
      const userUid = ticket.userId || ticket.userUid;
      // Enviar notificación incluso si es a uno mismo (para que el usuario vea su propio mensaje)
      if (userUid) {
        await sendTicketNotification(userUid, {
          type: 'ticket_reply',
          ticketId,
          title: 'Nueva respuesta en tu ticket',
          body: `Staff respondió: "${body.substring(0, 50)}${body.length > 50 ? '...' : ''}"`
        });
      }
    }

    console.log('✅ Mensaje enviado:', messageRef.id);
    return messageRef.id;
  } catch (error) {
    console.error('❌ Error enviando mensaje:', error);
    throw error;
  }
};

// ============================================
// LOGS Y AUDITORÍA - NUEVO
// ============================================

/**
 * Obtener logs de un ticket
 * @param {string} ticketId - ID del ticket
 * @returns {Promise<Array>} Lista de logs
 */
export const getTicketLogs = async (ticketId) => {
  try {
    const logsRef = collection(db, 'tickets', ticketId, 'logs');
    const q = query(logsRef, orderBy('createdAt', 'desc'));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      };
    });
  } catch (error) {
    console.error('❌ Error obteniendo logs:', error);
    throw error;
  }
};

// ============================================
// NOTIFICACIONES - NUEVO
// ============================================

/**
 * Enviar notificación al usuario sobre su ticket
 * @param {string} userUid - UID del usuario
 * @param {Object} notificationData - Datos de la notificación
 * @returns {Promise<void>}
 */
export const sendTicketNotification = async (userUid, notificationData) => {
  try {
    const { type, ticketId, title, body } = notificationData;

    const notificationsRef = collection(db, 'users', userUid, 'notifications');
    await addDoc(notificationsRef, {
      type,
      ticketId,
      title,
      body,
      read: false,
      timestamp: serverTimestamp(), // ✅ Usar 'timestamp' para compatibilidad con subscribeToNotifications
      createdAt: serverTimestamp() // Mantener también createdAt para referencia
    });

    console.log('✅ Notificación enviada al usuario:', userUid);
  } catch (error) {
    console.error('❌ Error enviando notificación:', error);
    // No lanzar error para no bloquear el flujo principal
  }
};

// ============================================
// BÚSQUEDA - NUEVO
// ============================================

/**
 * Buscar tickets por texto
 * @param {string} searchText - Texto a buscar
 * @returns {Promise<Array>} Tickets encontrados
 */
export const searchTickets = async (searchText) => {
  try {
    const ticketsRef = collection(db, 'tickets');
    const snapshot = await getDocs(ticketsRef);

    const tickets = [];
    const searchLower = searchText.toLowerCase();

    snapshot.forEach((doc) => {
      const data = doc.data();
      const matchesSubject = data.subject?.toLowerCase().includes(searchLower);
      const matchesUsername = (data.username || data.usernameSnapshot)?.toLowerCase().includes(searchLower);
      const matchesId = doc.id.toLowerCase().includes(searchLower);
      const matchesUserId = (data.userId || data.userUid)?.toLowerCase().includes(searchLower);

      if (matchesSubject || matchesUsername || matchesId || matchesUserId) {
        tickets.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          resolvedAt: data.resolvedAt?.toDate?.()?.toISOString() || null,
        });
      }
    });

    return tickets;
  } catch (error) {
    console.error('❌ Error buscando tickets:', error);
    throw error;
  }
};

// ============================================
// ESTADÍSTICAS - NUEVO
// ============================================

/**
 * Obtener estadísticas de tickets
 * @returns {Promise<Object>} Estadísticas
 */
export const getTicketStats = async () => {
  try {
    const ticketsRef = collection(db, 'tickets');
    const snapshot = await getDocs(ticketsRef);

    const stats = {
      total: 0,
      byStatus: {},
      byPriority: {},
      byCategory: {}
    };

    snapshot.forEach((doc) => {
      const data = doc.data();
      stats.total++;

      // Por estado
      stats.byStatus[data.status] = (stats.byStatus[data.status] || 0) + 1;

      // Por prioridad
      stats.byPriority[data.priority] = (stats.byPriority[data.priority] || 0) + 1;

      // Por categoría
      stats.byCategory[data.category] = (stats.byCategory[data.category] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    throw error;
  }
};

// ============================================
// SUSCRIPCIONES (MANTIENE COMPATIBILIDAD)
// ============================================

/**
 * Suscripción en tiempo real a todos los tickets (SOLO ADMIN)
 * COMPATIBILIDAD: Mantiene firma original
 * OPTIMIZADO: Limita a últimos 50 tickets para reducir lecturas
 * @param {function} callback - Función callback que recibe los tickets
 * @param {number} ticketLimit - Límite de tickets (default: 50)
 * @returns {function} Función para desuscribirse
 */
export const subscribeToTickets = (callback, ticketLimit = 50) => {
  const ticketsRef = collection(db, 'tickets');
  const q = query(
    ticketsRef,
    orderBy('createdAt', 'desc'),
    limit(ticketLimit)
  );

  return onSnapshot(q, (snapshot) => {
    const tickets = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        resolvedAt: data.resolvedAt?.toDate?.()?.toISOString() || null,
      };
    });
    callback(tickets);
  }, (error) => {
    console.error('❌ Error subscribing to tickets:', error);
    callback([]);
  });
};

/**
 * Suscripción en tiempo real a tickets de un usuario
 * COMPATIBILIDAD: Mantiene firma original
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
    const tickets = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        resolvedAt: data.resolvedAt?.toDate?.()?.toISOString() || null,
      };
    });
    callback(tickets);
  }, (error) => {
    console.error('❌ Error subscribing to user tickets:', error);
    callback([]);
  });
};

// ============================================
// PLANTILLAS / MACROS - NUEVO
// ============================================

export const QUICK_REPLIES = {
  USERNAME_REQUEST: {
    subject: 'Solicitud de información',
    body: 'Hola! Para cambiar tu nombre de usuario necesito que confirmes:\n\n1. Tu username actual\n2. El nuevo username que deseas\n\nRecuerda que debe tener entre 3-20 caracteres y solo puede contener letras, números y guiones bajos (_).'
  },
  USERNAME_UPDATED: {
    subject: 'Username actualizado',
    body: '¡Listo! Tu nombre de usuario ha sido actualizado exitosamente. Los cambios ya están visibles en tu perfil.'
  },
  MORE_INFO: {
    subject: 'Necesitamos más información',
    body: 'Para poder ayudarte mejor, necesito que me proporciones más detalles sobre tu caso. ¿Podrías enviarnos una captura de pantalla o más información?'
  },
  RESOLVED: {
    subject: 'Caso resuelto',
    body: 'Hemos resuelto tu caso. Si tienes alguna otra consulta, no dudes en abrir un nuevo ticket. ¡Gracias!'
  },
  SPAM: {
    subject: 'Ticket marcado como spam',
    body: 'Este ticket ha sido marcado como spam y será cerrado.'
  }
};
