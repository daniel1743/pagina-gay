import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot, getDocs, doc, updateDoc, limit } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { auth } from '@/config/firebase';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/config/firebase';
import { recordAPISignal } from '@/utils/runtimeDiagnostics';
import { supabase, isSupabaseAuthEnabled } from '@/config/supabase';

// Moderación local únicamente. No se leen claves privadas ni se hacen llamadas
// a proveedores externos desde el navegador.
const LOCAL_MODERATION_PATTERNS = [
  { type: 'minor_risk', severity: 'critical', pattern: /\b(soy menor|menor de edad|1[0-7]\s*a[nñ]os)\b/i },
  { type: 'violence', severity: 'high', pattern: /\b(te voy a matar|matarte|apu[nñ]alar|te voy a golpear)\b/i },
  { type: 'hate_speech', severity: 'high', pattern: /\b(homofob|transfob|racist|nazi)\w*\b/i },
  { type: 'external_contact', severity: 'medium', pattern: /\b(whatsapp|telegram|discord|instagram|correo)\b/i },
];

const CONTACT_SAFETY_ALERT_LIMIT = 20;
const CONTACT_SAFETY_RISK_MIN = 3;
const createModerationIncidentAlertCallable = httpsCallable(functions, 'createModerationIncidentAlert');

export const createModerationIncidentAlert = async (payload) => {
  if (isSupabaseAuthEnabled()) {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.id) return { success: false, skipped: true };
    const { data, error } = await supabase.rpc('record_moderation_event', {
      target_user_id: authData.user.id,
      event_type: 'moderation_incident',
      event_metadata: {
        type: String(payload?.type || 'unknown').slice(0, 80),
        severity: String(payload?.severity || 'medium').slice(0, 40),
        roomId: String(payload?.roomId || 'global').slice(0, 100),
        reason: String(payload?.reason || '').slice(0, 240),
        detectedBy: String(payload?.detectedBy || 'local').slice(0, 80),
        autoAction: String(payload?.autoAction || '').slice(0, 80),
      },
    });
    if (error) throw error;
    return { success: true, id: data };
  }
  try {
    const result = await createModerationIncidentAlertCallable(payload);
    recordAPISignal({
      source: 'moderation',
      action: 'createModerationIncidentAlert',
      status: 'ok',
      summary: 'Callable de moderación respondió',
    });
    return result.data;
  } catch (error) {
    recordAPISignal({
      source: 'moderation',
      action: 'createModerationIncidentAlert',
      status: 'error',
      summary: error?.message || 'Falló callable de moderación',
      error,
    });
    throw error;
  }
};

/**
 * 🔍 MODERACIÓN: Analiza mensaje con ChatGPT para detectar contenido sensible
 */
export const moderateMessage = async (message) => {
  const content = String(message || '').trim();
  if (!content) return { safe: true, detectedBy: 'local' };

  const violation = LOCAL_MODERATION_PATTERNS.find(({ pattern }) => pattern.test(content));
  if (!violation) return { safe: true, detectedBy: 'local' };

  return {
    safe: false,
    type: violation.type,
    severity: violation.severity,
    reason: 'Señal detectada por reglas locales; requiere revisión según las políticas de la comunidad.',
    detectedBy: 'local',
  };
};

/**
 * 🚨 Crear alerta de moderación en Firestore
 */
const createModerationAlert = async ({ type, severity, userId, username, message, roomId, reason, needsHelp }) => {
  try {
    if (!auth.currentUser) {
      console.error('[MODERACIÓN] No hay usuario autenticado para crear alerta');
      return;
    }

    const alertsRef = collection(db, 'moderation_alerts');
    await addDoc(alertsRef, {
      type,
      severity,
      userId,
      username,
      message,
      roomId,
      reason,
      needsHelp,
      status: 'pending',
      createdAt: serverTimestamp(),
      detectedBy: 'openai_moderation',
      detectedAt: serverTimestamp()
    });

    console.log(`[MODERACIÓN] 🚨 Alerta creada: ${type} (${severity}) - Usuario: ${username}`);
  } catch (error) {
    console.error('[MODERACIÓN] Error creando alerta:', error);
  }
};

/**
 * 📋 Suscribirse a alertas de moderación (para panel admin)
 */
export const subscribeToModerationAlerts = (callback) => {
  const alertsRef = collection(db, 'moderation_alerts');
  const q = query(alertsRef, orderBy('createdAt', 'desc'), orderBy('severity', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const alerts = [];
    snapshot.forEach((doc) => {
      alerts.push({ id: doc.id, ...doc.data() });
    });
    callback(alerts);
  }, (error) => {
    // Ignorar errores de cancelación
    if (error.code !== 'cancelled' && error.name !== 'AbortError') {
      console.error('[MODERACIÓN] Error suscribiéndose a alertas:', error);
    }
  });
};

/**
 * ✅ Marcar alerta como resuelta
 */
export const resolveModerationAlert = async (alertId, adminNotes = '') => {
  try {
    const alertRef = doc(db, 'moderation_alerts', alertId);
    await updateDoc(alertRef, {
      status: 'resolved',
      resolvedAt: serverTimestamp(),
      resolvedBy: auth.currentUser?.uid,
      adminNotes
    });
    console.log(`[MODERACIÓN] ✅ Alerta ${alertId} resuelta`);
  } catch (error) {
    console.error('[MODERACIÓN] Error resolviendo alerta:', error);
    throw error;
  }
};

/**
 * 📊 Obtener estadísticas de moderación
 */
export const getModerationStats = async () => {
  try {
    const alertsRef = collection(db, 'moderation_alerts');
    const q = query(alertsRef);
    const snapshot = await getDocs(q);

    const stats = {
      total: 0,
      pending: 0,
      resolved: 0,
      byType: {},
      bySeverity: {}
    };

    snapshot.forEach((doc) => {
      const data = doc.data();
      stats.total++;
      
      if (data.status === 'pending') stats.pending++;
      if (data.status === 'resolved') stats.resolved++;

      stats.byType[data.type] = (stats.byType[data.type] || 0) + 1;
      stats.bySeverity[data.severity] = (stats.bySeverity[data.severity] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error('[MODERACIÓN] Error obteniendo estadísticas:', error);
    return null;
  }
};

/**
 * 📵 Riesgo de contacto externo: usuarios con reincidencia
 */
export const subscribeToContactSafetyAlerts = (callback) => {
  const usersRef = collection(db, 'users');
  const q = query(
    usersRef,
    where('contactSafety.riskScore', '>=', CONTACT_SAFETY_RISK_MIN),
    orderBy('contactSafety.riskScore', 'desc'),
    limit(CONTACT_SAFETY_ALERT_LIMIT)
  );

  return onSnapshot(q, (snapshot) => {
    const alerts = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() || {};
      const contactSafety = data.contactSafety || {};
      alerts.push({
        id: docSnap.id,
        userId: docSnap.id,
        username: data.username || data.displayName || 'Usuario',
        avatar: data.avatar || '',
        riskScore: Number(contactSafety.riskScore || 0),
        blockedAttempts: Number(contactSafety.blockedAttempts || 0),
        blockedAttemptsOpin: Number(contactSafety.blockedAttemptsOpin || 0),
        blockedAttemptsPrivate: Number(contactSafety.blockedAttemptsPrivate || 0),
        shareRequests: Number(contactSafety.shareRequests || 0),
        shareAccepted: Number(contactSafety.shareAccepted || 0),
        shareRejected: Number(contactSafety.shareRejected || 0),
        shareRevoked: Number(contactSafety.shareRevoked || 0),
        lastEventType: contactSafety.lastEventType || null,
        lastSurface: contactSafety.lastSurface || null,
        lastBlockedType: contactSafety.lastBlockedType || null,
        lastEventAt: contactSafety.lastEventAt || null,
        lastReviewedAt: contactSafety.lastReviewedAt || null,
        lastReviewedBy: contactSafety.lastReviewedBy || null,
        lastAdminNotes: contactSafety.lastAdminNotes || '',
      });
    });
    callback(alerts);
  }, (error) => {
    if (error.code !== 'cancelled' && error.name !== 'AbortError') {
      console.error('[MODERACIÓN] Error suscribiéndose a riesgo de contacto:', error);
    }
  });
};

/**
 * ✅ Marcar riesgo de contacto como revisado
 */
export const reviewContactSafetyAlert = async (userId, adminNotes = '') => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      'contactSafety.lastReviewedAt': serverTimestamp(),
      'contactSafety.lastReviewedBy': auth.currentUser?.uid || null,
      'contactSafety.lastAdminNotes': adminNotes || '',
    });
  } catch (error) {
    console.error('[MODERACIÓN] Error marcando riesgo de contacto como revisado:', error);
    throw error;
  }
};

