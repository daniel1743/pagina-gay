import {
  collection,
  query,
  orderBy,
  getDocs,
  serverTimestamp,
  where,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { db, auth } from '@/config/firebase';
import { supabase, isSupabaseAuthEnabled } from '@/config/supabase';
import { createSystemNotification, NOTIFICATION_TYPES } from '@/services/systemNotificationsService';

/**
 * Crea una nueva denuncia en Supabase cuando el flujo Supabase-first está configurado
 * @param {object} reportData - Datos de la denuncia
 * @returns {Promise<string>} ID de la denuncia creada
 */
export const createReport = async (reportData) => {
  if (!isSupabaseAuthEnabled()) {
    throw new Error('SUPABASE_REQUIRED_FOR_REPORTS');
  }

  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user?.id) throw new Error('Debes estar autenticado para enviar una denuncia');
  const reason = reportData.reason || reportData.type || reportData.reasonKey || 'other';
  const description = reportData.description || (reason ? `Reporte: ${reason}` : 'Reporte enviado');
  const safeDescription = description.length >= 10 ? description : `Reporte: ${description}`;
  const { data, error } = await supabase.from('reports').insert({
    reporter_id: authData.user.id,
    reported_user_id: reportData.reportedUserId || reportData.targetId || null,
    message_id: reportData.messageId || null,
    private_message_id: reportData.privateMessageId || null,
    reason: String(reason).slice(0, 120),
    details: String(safeDescription).slice(0, 1000),
    status: 'open',
  }).select('id').single();
  if (error) throw error;
  try {
    await createSystemNotification(authData.user.id, {
      type: NOTIFICATION_TYPES.ANNOUNCEMENT,
      title: 'Reporte recibido',
      message: 'Tu reporte fue registrado y pasa a revisión según la configuración del sitio.',
      icon: '📋',
      priority: 'high',
      createdBy: 'system',
    });
  } catch (notificationError) {
    console.warn('[REPORTS] No se pudo crear el aviso Supabase:', notificationError?.message || notificationError);
  }
  return data.id;
};

/**
 * Obtiene todas las denuncias (SOLO ADMIN)
 * @param {string} status - Filtrar por estado (opcional)
 * @returns {Promise<Array>} Lista de denuncias
 */
export const getAllReports = async (status = null) => {
  if (isSupabaseAuthEnabled()) {
    let request = supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(200);
    if (status) request = request.eq('status', status === 'pending' ? 'open' : status);
    const { data, error } = await request;
    if (error) throw error;
    return (data || []).map((row) => ({ id: row.id, reporterId: row.reporter_id, reportedUserId: row.reported_user_id, messageId: row.message_id, privateMessageId: row.private_message_id, reason: row.reason, description: row.details, status: row.status, createdAt: row.created_at, resolvedAt: row.resolved_at }));
  }
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
  if (isSupabaseAuthEnabled()) {
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user?.id !== userId) return [];
    const { data, error } = await supabase.from('reports').select('*').eq('reporter_id', userId).order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    return (data || []).map((row) => ({ id: row.id, reporterId: row.reporter_id, reportedUserId: row.reported_user_id, messageId: row.message_id, privateMessageId: row.private_message_id, reason: row.reason, description: row.details, status: row.status, createdAt: row.created_at, resolvedAt: row.resolved_at }));
  }
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
  if (isSupabaseAuthEnabled()) {
    const { data, error } = await supabase.rpc('admin_update_report_status', { target_report_id: reportId, next_status: newStatus === 'rejected' ? 'dismissed' : newStatus, reviewer_notes: reviewNotes });
    if (error) throw error;
    return Boolean(data);
  }
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
        case 'reviewed':
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
  if (isSupabaseAuthEnabled()) {
    const rows = await getAllReports();
    const stats = { total: rows.length, pending: 0, reviewing: 0, resolved: 0, dismissed: 0, byType: { acoso: 0, violencia: 0, drogas: 0, ventas: 0, otras: 0 } };
    rows.forEach((row) => {
      const status = row.status === 'open' ? 'pending' : row.status;
      if (Object.prototype.hasOwnProperty.call(stats, status)) stats[status] += 1;
      if (Object.prototype.hasOwnProperty.call(stats.byType, row.reason)) stats.byType[row.reason] += 1;
    });
    return stats;
  }
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
    const status = data.status === 'open' ? 'pending' : data.status;
    stats[status]++;
    if (data.type && stats.byType[data.type] !== undefined) {
      stats.byType[data.type]++;
    }
  });

  return stats;
};
