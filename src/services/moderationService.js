import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { auth } from '@/config/firebase';

const PROVIDERS = {
  openai: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    apiUrl: import.meta.env.VITE_OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions',
    model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini'
  }
};

/**
 * 🔍 MODERACIÓN: Analiza mensaje con ChatGPT para detectar contenido sensible
 */
export const moderateMessage = async (message, userId, username, roomId) => {
  try {
    const provider = PROVIDERS.openai;
    if (!provider?.apiKey || !provider?.apiUrl) {
      console.warn('[MODERACIÓN] OpenAI no configurado, saltando moderación');
      return { safe: true };
    }

    const moderationPrompt = `Eres un moderador de contenido para una plataforma de chat LGBT. Analiza el siguiente mensaje y determina si contiene:

1. ODIO/DISCRIMINACIÓN: insultos homofóbicos, transfóbicos, racistas, misóginos, o cualquier forma de odio
2. OFENSAS: lenguaje ofensivo, acoso, bullying
3. SUICIDIO/AUTOLESIÓN: menciones de suicidio, autolesión, ideación suicida, planes de suicidio
4. ACOSO: acoso repetitivo, amenazas, intimidación

Mensaje a analizar: "${message}"

Responde SOLO con un JSON válido en este formato:
{
  "safe": true/false,
  "type": "hate_speech" | "offensive" | "suicide" | "self_harm" | "harassment" | null,
  "severity": "low" | "medium" | "high" | "critical" | null,
  "reason": "explicación breve del problema detectado" | null,
  "needsHelp": true/false (solo true si es suicidio/autolesión)
}

Si el mensaje es seguro, responde: {"safe": true, "type": null, "severity": null, "reason": null, "needsHelp": false}
Si detectas algún problema, responde con el JSON correspondiente.`;

    const response = await fetch(provider.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [
          {
            role: 'system',
            content: 'Eres un moderador de contenido experto. Analiza mensajes y responde SOLO con JSON válido, sin texto adicional.'
          },
          {
            role: 'user',
            content: moderationPrompt
          }
        ],
        temperature: 0.3, // Baja temperatura para respuestas más consistentes
        max_tokens: 200
      })
    });

    if (!response.ok) {
      console.error('[MODERACIÓN] Error en API:', response.status);
      return { safe: true }; // Si falla, asumir seguro para no bloquear
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim() || '{}';
    
    // Intentar parsear JSON (puede venir con markdown)
    let moderationResult;
    try {
      // Limpiar markdown si existe
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      moderationResult = JSON.parse(cleanContent);
    } catch (e) {
      console.error('[MODERACIÓN] Error parseando respuesta:', content);
      return { safe: true };
    }

    // Si no es seguro, crear alerta
    if (!moderationResult.safe && moderationResult.type) {
      await createModerationAlert({
        type: moderationResult.type,
        severity: moderationResult.severity || 'medium',
        userId,
        username,
        message,
        roomId,
        reason: moderationResult.reason,
        needsHelp: moderationResult.needsHelp || false
      });

      // Si es suicidio/autolesión, ofrecer ayuda
      if (moderationResult.needsHelp && (moderationResult.type === 'suicide' || moderationResult.type === 'self_harm')) {
        console.warn('[MODERACIÓN] 🚨 ALERTA CRÍTICA: Suicidio/autolesión detectado');
        // Esto se manejará en el componente de chat para mostrar ayuda
      }
    }

    return moderationResult;
  } catch (error) {
    console.error('[MODERACIÓN] Error:', error);
    return { safe: true }; // Si falla, asumir seguro
  }
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

