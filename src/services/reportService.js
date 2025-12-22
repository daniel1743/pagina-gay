import {
  collection,
  addDoc,
  query,
  orderBy,
  getDocs,
  serverTimestamp,
  where,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { db, auth } from '@/config/firebase';
import { createSystemNotification, NOTIFICATION_TYPES } from '@/services/systemNotificationsService';

/**
 * Crea una nueva denuncia en Firestore
 * @param {object} reportData - Datos de la denuncia
 * @returns {Promise<string>} ID de la denuncia creada
 */
export const createReport = async (reportData) => {
  if (!auth.currentUser) {
    throw new Error('Debes estar autenticado para enviar una denuncia');
  }

  const reportsRef = collection(db, 'reports');

  const report = {
    reporterId: auth.currentUser.uid,
    reporterUsername: reportData.reporterUsername || 'Anónimo',
    type: reportData.type, // 'acoso', 'violencia', 'drogas', 'ventas', 'otras'
    otherType: reportData.otherType || null,
    description: reportData.description,
    targetUsername: reportData.targetUsername,
    targetId: reportData.targetId || null,
    roomId: reportData.roomId || null,
    messageId: reportData.messageId || null,
    evidence: reportData.evidence || [], // URLs de capturas
    status: 'pending', // 'pending', 'reviewing', 'resolved', 'dismissed'
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    reviewedBy: null,
    reviewNotes: null,
  };

  const docRef = await addDoc(reportsRef, report);
  
  // ✅ NUEVO: Enviar notificación automática al usuario que reportó
  try {
    await createSystemNotification(auth.currentUser.uid, {
      type: NOTIFICATION_TYPES.ANNOUNCEMENT,
      title: '📋 Reporte Recibido',
      message: `Tu reporte ha sido recibido y está en manos de nuestro equipo de administradores. Te mantendremos informado sobre el progreso de tu caso.`,
      icon: '📋',
      link: null,
      priority: 'high',
      createdBy: 'system',
    });
  } catch (error) {
    console.error('Error enviando notificación de reporte recibido:', error);
    // No lanzar error, el reporte ya se creó exitosamente
  }
  
  return docRef.id;
};

/**
 * Obtiene todas las denuncias (SOLO ADMIN)
 * @param {string} status - Filtrar por estado (opcional)
 * @returns {Promise<Array>} Lista de denuncias
 */
export const getAllReports = async (status = null) => {
  const reportsRef = collection(db, 'reports');

  let q;
  if (status) {
    q = query(
      reportsRef,
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
  } else {
    q = query(reportsRef, orderBy('createdAt', 'desc'));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
    updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || null,
  }));
};

/**
 * Obtiene las denuncias de un usuario específico
 * @param {string} userId - ID del usuario
 * @returns {Promise<Array>} Lista de denuncias del usuario
 */
export const getUserReports = async (userId) => {
  const reportsRef = collection(db, 'reports');
  const q = query(
    reportsRef,
    where('reporterId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
  }));
};

/**
 * Actualiza el estado de una denuncia (SOLO ADMIN)
 * @param {string} reportId - ID de la denuncia
 * @param {string} newStatus - Nuevo estado
 * @param {string} reviewNotes - Notas del revisor
 * @param {string} reporterId - ID del usuario que reportó (para enviar notificación)
 * @returns {Promise<void>}
 */
export const updateReportStatus = async (reportId, newStatus, reviewNotes = null, reporterId = null) => {
  if (!auth.currentUser) {
    throw new Error('Debes estar autenticado');
  }

  const reportRef = doc(db, 'reports', reportId);

  await updateDoc(reportRef, {
    status: newStatus,
    reviewedBy: auth.currentUser.uid,
    reviewNotes: reviewNotes,
    updatedAt: serverTimestamp(),
  });

  // ✅ NUEVO: Enviar notificación al usuario según el estado
  if (reporterId) {
    try {
      let notificationMessage = '';
      let notificationTitle = '';
      
      switch (newStatus) {
        case 'reviewing':
          notificationTitle = '🔍 Caso en Proceso';
          notificationMessage = 'Tu reporte está siendo analizado por nuestro equipo. Estaremos en comunicación contigo pronto.';
          break;
        case 'resolved':
          notificationTitle = '✅ Caso Resuelto';
          notificationMessage = 'Tu reporte ha sido resuelto. Gracias por ayudarnos a mantener Chactivo seguro.';
          break;
        case 'rejected':
          notificationTitle = '❌ Caso Rechazado';
          notificationMessage = 'Tu reporte ha sido revisado y no se encontraron suficientes evidencias para proceder. Si tienes más información, puedes crear un nuevo reporte.';
          break;
        default:
          return; // No enviar notificación para otros estados
      }

      await createSystemNotification(reporterId, {
        type: NOTIFICATION_TYPES.ANNOUNCEMENT,
        title: notificationTitle,
        message: notificationMessage,
        icon: newStatus === 'resolved' ? '✅' : newStatus === 'rejected' ? '❌' : '🔍',
        link: null,
        priority: 'high',
        createdBy: auth.currentUser.uid,
      });
    } catch (error) {
      console.error('Error enviando notificación de cambio de estado:', error);
      // No lanzar error, el estado ya se actualizó
    }
  }
};

/**
 * Obtiene estadísticas de denuncias
 * @returns {Promise<object>} Estadísticas
 */
export const getReportStats = async () => {
  const reportsRef = collection(db, 'reports');
  const snapshot = await getDocs(reportsRef);

  const stats = {
    total: snapshot.size,
    pending: 0,
    reviewing: 0,
    resolved: 0,
    dismissed: 0,
    byType: {
      acoso: 0,
      violencia: 0,
      drogas: 0,
      ventas: 0,
      otras: 0,
    },
  };

  snapshot.docs.forEach(doc => {
    const data = doc.data();
    stats[data.status]++;
    stats.byType[data.type]++;
  });

  return stats;
};
