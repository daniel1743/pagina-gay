/**
 * 📬 Servicio de Verificación de Entrega de Mensajes
 *
 * Sistema de acknowledgment (ACK) similar a WhatsApp:
 * - ✓ 1 check gris: Mensaje enviado (salió del cliente)
 * - ✓✓ 2 checks grises: Mensaje entregado (recibido por otro cliente)
 * - ✓✓ 2 checks azules: Mensaje leído
 *
 * Estados del mensaje:
 * - sending: Enviando a Firebase
 * - sent: Enviado exitosamente
 * - delivered: Entregado a al menos un usuario
 * - read: Leído por al menos un usuario
 * - failed: Falló el envío
 * - suspended: Suspendido (timeout)
 */

import { doc, updateDoc, arrayUnion, getDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/config/firebase';
import { supabase, isSupabaseAuthEnabled } from '@/config/supabase';

class MessageDeliveryService {
  constructor() {
    // Tracking de mensajes propios pendientes de entrega
    this.pendingMessages = new Map();
    // Tracking de ACKs recibidos
    this.deliveryLogs = [];
    // Timeout para detectar mensajes suspendidos (30 segundos)
    this.deliveryTimeout = 30000;

    if (import.meta.env.DEV) {
      console.log('📬 [DELIVERY] Servicio de entrega inicializado');
    }
  }

  /**
   * Registrar mensaje propio enviado (para tracking)
   */
  registerOutgoingMessage(messageId, messageData) {
    const now = Date.now();
    const tracking = {
      messageId,
      clientId: messageData.clientId,
      sentAt: now,
      deliveredAt: null,
      readAt: null,
      status: 'sent',
      userId: messageData.userId,
      roomId: messageData.roomId,
    };

    this.pendingMessages.set(messageId, tracking);

    // Log inicial
    // console.log('📤 [DELIVERY] Mensaje enviado:', {
    //   messageId,
    //   clientId: messageData.clientId,
    //   sentAt: new Date(now).toISOString(),
    //   status: 'sent ✓',
    // });

    // Timeout para detectar mensaje suspendido
    setTimeout(() => {
      if (this.pendingMessages.has(messageId)) {
        const msg = this.pendingMessages.get(messageId);
        if (msg.status === 'sent') {
          msg.status = 'suspended';
          // ⚠️ LOG COMENTADO: Causaba sobrecarga en consola
          // console.warn('⚠️ [DELIVERY] Mensaje suspendido (no entregado):', {
          //   messageId,
          //   sentAt: new Date(msg.sentAt).toISOString(),
          //   timeElapsed: `${Date.now() - msg.sentAt}ms`,
          //   suggestion: 'El mensaje no llegó a otros usuarios. Verificar conexión.',
          // });
        }
      }
    }, this.deliveryTimeout);
  }

  /**
   * Marcar mensaje como entregado (cuando otro usuario lo recibe)
   */
  async markAsDelivered(roomId, messageId, receiverUserId) {
    if (isSupabaseAuthEnabled()) {
      if (!messageId || !receiverUserId) return;
      const { error } = await supabase.from('message_receipts').upsert({ message_id: messageId, user_id: receiverUserId, delivered_at: new Date().toISOString() }, { onConflict: 'message_id,user_id' });
      if (error) console.warn('[DELIVERY] Error de receipt entregado Supabase:', error.message);
      return;
    }
    try {
      // Solo marcar si no soy el remitente
      const messageRef = doc(db, 'rooms', roomId, 'messages', messageId);
      const messageSnap = await getDoc(messageRef);

      if (!messageSnap.exists()) {
        // ⚠️ LOG COMENTADO: Causaba sobrecarga en consola
        // console.warn('⚠️ [DELIVERY] Mensaje no encontrado:', messageId);
        return;
      }

      const messageData = messageSnap.data();

      // No enviar ACK a mensajes propios
      if (messageData.userId === auth.currentUser?.uid) {
        return;
      }

      // ⚠️ LOG COMENTADO: Causaba sobrecarga en consola (loop con cada mensaje)
      // console.log('📬 [DELIVERY] Enviando ACK para mensaje:', {
      //   messageId: messageId.substring(0, 8),
      //   from: messageData.username,
      //   to: receiverUserId.substring(0, 8),
      // });

      // Actualizar deliveredTo array
      await updateDoc(messageRef, {
        deliveredTo: arrayUnion(receiverUserId),
        deliveredAt: serverTimestamp(), // Primera entrega
        status: 'delivered',
      });

      // ⚠️ LOG COMENTADO: Causaba sobrecarga en consola (loop con cada mensaje)
      // console.log('✓✓ [DELIVERY] ACK enviado exitosamente:', {
      //   messageId: messageId.substring(0, 8),
      //   deliveredToCount: (messageData.deliveredTo?.length || 0) + 1,
      // });
    } catch (error) {
      // Log de errores para diagnóstico
      console.error('❌ [DELIVERY] Error marcando como entregado:', {
        messageId: messageId?.substring(0, 8),
        error: error.message,
        code: error.code,
      });
    }
  }

  /**
   * Marcar mensaje como leído
   */
  async markAsRead(roomId, messageId, readerUserId) {
    if (isSupabaseAuthEnabled()) {
      if (!messageId || !readerUserId) return;
      const { error } = await supabase.from('message_receipts').upsert({ message_id: messageId, user_id: readerUserId, read_at: new Date().toISOString() }, { onConflict: 'message_id,user_id' });
      if (error) console.warn('[DELIVERY] Error de receipt leído Supabase:', error.message);
      return;
    }
    try {
      const messageRef = doc(db, 'rooms', roomId, 'messages', messageId);
      const messageSnap = await getDoc(messageRef);

      if (!messageSnap.exists()) return;

      const messageData = messageSnap.data();

      // No marcar como leído mensajes propios
      if (messageData.userId === auth.currentUser?.uid) {
        return;
      }

      // Actualizar readBy array
      await updateDoc(messageRef, {
        readBy: arrayUnion(readerUserId),
        readAt: serverTimestamp(), // Primera lectura
        status: 'read',
      });

      // console.log('✓✓ [DELIVERY] Mensaje marcado como leído:', {
      //   messageId,
      //   readerUserId,
      //   senderUserId: messageData.userId,
      // });
    } catch (error) {
      if (import.meta.env.DEV && error.code !== 'permission-denied') {
        console.debug('⚠️ [DELIVERY] Error marcando como leído:', error.message);
      }
    }
  }

  /**
   * Procesar actualización de mensaje (cuando recibimos snapshot)
   */
  processMessageUpdate(message) {
    // Si es un mensaje propio que estaba pendiente
    if (this.pendingMessages.has(message.id)) {
      const tracking = this.pendingMessages.get(message.id);
      const now = Date.now();

      // Detectar si fue entregado
      if (message.deliveredTo && message.deliveredTo.length > 0 && tracking.status === 'sent') {
        tracking.status = 'delivered';
        tracking.deliveredAt = now;

        const deliveryTime = now - tracking.sentAt;

        // console.log('✓✓ [DELIVERY] Mensaje entregado:', {
        //   messageId: message.id,
        //   sentAt: new Date(tracking.sentAt).toISOString(),
        //   deliveredAt: new Date(now).toISOString(),
        //   deliveryTime: `${deliveryTime}ms`,
        //   deliveredTo: message.deliveredTo.length + ' usuario(s)',
        //   status: 'delivered ✓✓',
        // });

        // Guardar en log
        this.deliveryLogs.push({
          messageId: message.id,
          sentAt: tracking.sentAt,
          deliveredAt: now,
          deliveryTime,
          status: 'delivered',
        });
      }

      // Detectar si fue leído
      if (message.readBy && message.readBy.length > 0 && tracking.status !== 'read') {
        tracking.status = 'read';
        tracking.readAt = now;

        const readTime = now - tracking.sentAt;

        // console.log('✓✓ [DELIVERY] Mensaje leído:', {
        //   messageId: message.id,
        //   sentAt: new Date(tracking.sentAt).toISOString(),
        //   readAt: new Date(now).toISOString(),
        //   readTime: `${readTime}ms`,
        //   readBy: message.readBy.length + ' usuario(s)',
        //   status: 'read ✓✓ (azul)',
        // });

        // Actualizar log
        const logIndex = this.deliveryLogs.findIndex(l => l.messageId === message.id);
        if (logIndex !== -1) {
          this.deliveryLogs[logIndex].readAt = now;
          this.deliveryLogs[logIndex].readTime = readTime;
          this.deliveryLogs[logIndex].status = 'read';
        }
      }
    }
  }

  /**
   * Obtener estadísticas de entrega
   */
  getDeliveryStats() {
    const stats = {
      totalSent: this.pendingMessages.size,
      delivered: 0,
      read: 0,
      suspended: 0,
      avgDeliveryTime: 0,
      avgReadTime: 0,
    };

    let deliveryTimes = [];
    let readTimes = [];

    for (const tracking of this.pendingMessages.values()) {
      if (tracking.status === 'delivered' || tracking.status === 'read') {
        stats.delivered++;
        if (tracking.deliveredAt) {
          deliveryTimes.push(tracking.deliveredAt - tracking.sentAt);
        }
      }

      if (tracking.status === 'read') {
        stats.read++;
        if (tracking.readAt) {
          readTimes.push(tracking.readAt - tracking.sentAt);
        }
      }

      if (tracking.status === 'suspended') {
        stats.suspended++;
      }
    }

    stats.avgDeliveryTime = deliveryTimes.length > 0
      ? Math.round(deliveryTimes.reduce((a, b) => a + b, 0) / deliveryTimes.length)
      : 0;

    stats.avgReadTime = readTimes.length > 0
      ? Math.round(readTimes.reduce((a, b) => a + b, 0) / readTimes.length)
      : 0;

    return stats;
  }

  /**
   * Obtener logs de entrega (últimos 50)
   */
  getDeliveryLogs() {
    return this.deliveryLogs.slice(-50);
  }

  /**
   * Resetear tracking
   */
  reset() {
    this.pendingMessages.clear();
    this.deliveryLogs = [];
    console.log('📬 [DELIVERY] Tracking reseteado');
  }

  /**
   * Exportar datos de entrega
   */
  exportDeliveryData() {
    return {
      timestamp: Date.now(),
      stats: this.getDeliveryStats(),
      logs: this.getDeliveryLogs(),
      pendingMessages: Array.from(this.pendingMessages.values()),
    };
  }
}

// Singleton
let deliveryServiceInstance = null;

export const getDeliveryService = () => {
  if (!deliveryServiceInstance) {
    deliveryServiceInstance = new MessageDeliveryService();
  }
  return deliveryServiceInstance;
};

export default MessageDeliveryService;
