/**
 * 📊 Sistema de Monitoreo de Velocidad del Chat
 * Mide latencia de mensajes para comparar localhost vs producción
 *
 * Métricas clave:
 * - Latencia de envío de mensaje (tiempo hasta que Firestore confirma)
 * - Latencia de snapshot (tiempo hasta recibir mensaje de vuelta)
 * - Round-trip total (tiempo desde envío hasta recepción)
 * - Velocidad promedio, P95, P99, y máxima
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      messageSendLatency: [],      // Tiempo de envío a Firestore
      snapshotLatency: [],          // Tiempo de recepción desde Firestore
      roundTripTime: [],            // Tiempo total (envío + recepción)
      pendingMessages: new Map(),   // Mensajes pendientes (para calcular round-trip)
    };

    this.maxMetricsSize = 100; // Mantener solo las últimas 100 mediciones
    this.environment = import.meta.env.DEV ? 'localhost' : 'production';

    // Listener de snapshots
    this.snapshotStartTime = null;
    this.isFirstSnapshot = true;

    if (import.meta.env.DEV) {
      console.log('📊 [PERFORMANCE] Monitor iniciado:', {
        environment: this.environment,
        maxMetricsSize: this.maxMetricsSize
      });
    }
  }

  /**
   * Medir tiempo de envío de mensaje
   */
  async measureMessageSend(sendFn, messageData) {
    const startTime = performance.now();
    const clientId = messageData.clientId || `msg_${Date.now()}_${Math.random()}`;

    try {
      const result = await sendFn();
      const latency = performance.now() - startTime;

      const metric = {
        timestamp: Date.now(),
        latency: Math.round(latency),
        environment: this.environment,
        clientId,
        success: true,
      };

      this.metrics.messageSendLatency.push(metric);

      // Guardar mensaje pendiente para calcular round-trip
      this.metrics.pendingMessages.set(clientId, {
        sendTime: Date.now(),
        latency,
      });

      // Limitar tamaño de array
      if (this.metrics.messageSendLatency.length > this.maxMetricsSize) {
        this.metrics.messageSendLatency.shift();
      }

      if (import.meta.env.DEV) {
        console.log(`📊 [PERFORMANCE] Mensaje enviado en ${latency.toFixed(0)}ms`, {
          clientId,
          environment: this.environment,
          latency: `${latency.toFixed(0)}ms`
        });
      }

      return { result, latency: Math.round(latency), clientId };
    } catch (error) {
      const latency = performance.now() - startTime;

      const metric = {
        timestamp: Date.now(),
        latency: Math.round(latency),
        environment: this.environment,
        clientId,
        success: false,
        error: error.message,
      };

      this.metrics.messageSendLatency.push(metric);

      console.error(`❌ [PERFORMANCE] Error enviando mensaje (${latency.toFixed(0)}ms):`, error.message);

      throw error;
    }
  }

  /**
   * Registrar latencia de snapshot (cuando se recibe un mensaje)
   */
  recordSnapshotLatency(messages) {
    const now = Date.now();

    // Primera snapshot (carga inicial) - no contar
    if (this.isFirstSnapshot) {
      this.isFirstSnapshot = false;
      this.snapshotStartTime = now;
      return;
    }

    // Calcular latencia de snapshot
    const snapshotLatency = this.snapshotStartTime ? now - this.snapshotStartTime : 0;
    this.snapshotStartTime = now;

    if (snapshotLatency > 0) {
      const metric = {
        timestamp: now,
        latency: snapshotLatency,
        environment: this.environment,
        messageCount: messages.length,
      };

      this.metrics.snapshotLatency.push(metric);

      // Limitar tamaño
      if (this.metrics.snapshotLatency.length > this.maxMetricsSize) {
        this.metrics.snapshotLatency.shift();
      }
    }

    // Calcular round-trip para mensajes propios
    messages.forEach(msg => {
      if (msg.clientId && this.metrics.pendingMessages.has(msg.clientId)) {
        const pending = this.metrics.pendingMessages.get(msg.clientId);
        const roundTripTime = now - pending.sendTime;

        const metric = {
          timestamp: now,
          latency: roundTripTime,
          environment: this.environment,
          clientId: msg.clientId,
        };

        this.metrics.roundTripTime.push(metric);

        // Limitar tamaño
        if (this.metrics.roundTripTime.length > this.maxMetricsSize) {
          this.metrics.roundTripTime.shift();
        }

        // Limpiar mensaje pendiente
        this.metrics.pendingMessages.delete(msg.clientId);

        if (import.meta.env.DEV) {
          console.log(`📊 [PERFORMANCE] Round-trip completo: ${roundTripTime}ms`, {
            clientId: msg.clientId,
            sendLatency: `${pending.latency.toFixed(0)}ms`,
            totalLatency: `${roundTripTime}ms`
          });
        }
      }
    });

    // Limpiar mensajes pendientes antiguos (> 30 segundos)
    const thirtySecondsAgo = now - 30000;
    for (const [clientId, data] of this.metrics.pendingMessages.entries()) {
      if (data.sendTime < thirtySecondsAgo) {
        this.metrics.pendingMessages.delete(clientId);
      }
    }
  }

  /**
   * Calcular estadísticas
   */
  calculateStats(metricArray) {
    if (!metricArray || metricArray.length === 0) {
      return {
        avg: 0,
        min: 0,
        max: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        count: 0,
      };
    }

    const latencies = metricArray.map(m => m.latency).sort((a, b) => a - b);
    const sum = latencies.reduce((acc, val) => acc + val, 0);
    const count = latencies.length;

    return {
      avg: Math.round(sum / count),
      min: latencies[0],
      max: latencies[count - 1],
      p50: latencies[Math.floor(count * 0.5)],
      p95: latencies[Math.floor(count * 0.95)],
      p99: latencies[Math.floor(count * 0.99)],
      count,
    };
  }

  /**
   * Obtener estadísticas completas
   */
  getStats() {
    return {
      environment: this.environment,
      messageSend: this.calculateStats(this.metrics.messageSendLatency),
      snapshot: this.calculateStats(this.metrics.snapshotLatency),
      roundTrip: this.calculateStats(this.metrics.roundTripTime),
      pendingCount: this.metrics.pendingMessages.size,
    };
  }

  /**
   * Obtener métricas en tiempo real (últimos 10 segundos)
   */
  getRecentStats(windowMs = 10000) {
    const now = Date.now();
    const cutoff = now - windowMs;

    const recentSend = this.metrics.messageSendLatency.filter(m => m.timestamp > cutoff);
    const recentSnapshot = this.metrics.snapshotLatency.filter(m => m.timestamp > cutoff);
    const recentRoundTrip = this.metrics.roundTripTime.filter(m => m.timestamp > cutoff);

    return {
      environment: this.environment,
      windowMs,
      messageSend: this.calculateStats(recentSend),
      snapshot: this.calculateStats(recentSnapshot),
      roundTrip: this.calculateStats(recentRoundTrip),
    };
  }

  /**
   * Verificar si hay problemas de velocidad
   */
  checkForIssues() {
    const stats = this.getStats();
    const issues = [];

    // Verificar envío de mensajes
    if (stats.messageSend.avg > 1000) {
      issues.push({
        type: 'send_slow',
        severity: 'warning',
        message: `Envío de mensajes lento: ${stats.messageSend.avg}ms promedio`,
        suggestion: 'Verificar conexión a internet o estado de Firebase',
      });
    }

    if (stats.messageSend.p95 > 2000) {
      issues.push({
        type: 'send_very_slow',
        severity: 'error',
        message: `Envío de mensajes muy lento (P95): ${stats.messageSend.p95}ms`,
        suggestion: 'Posible problema de red o sobrecarga de Firebase',
      });
    }

    // Verificar round-trip
    if (stats.roundTrip.avg > 2000) {
      issues.push({
        type: 'roundtrip_slow',
        severity: 'warning',
        message: `Round-trip lento: ${stats.roundTrip.avg}ms promedio`,
        suggestion: 'Los mensajes tardan en aparecer. Verificar conexión.',
      });
    }

    // Verificar mensajes pendientes
    if (stats.pendingCount > 10) {
      issues.push({
        type: 'pending_high',
        severity: 'error',
        message: `Muchos mensajes pendientes: ${stats.pendingCount}`,
        suggestion: 'Posible problema de sincronización con Firestore',
      });
    }

    return issues;
  }

  /**
   * Resetear métricas
   */
  reset() {
    this.metrics.messageSendLatency = [];
    this.metrics.snapshotLatency = [];
    this.metrics.roundTripTime = [];
    this.metrics.pendingMessages.clear();
    this.isFirstSnapshot = true;
    console.log('📊 [PERFORMANCE] Métricas reseteadas');
  }

  /**
   * Exportar métricas para análisis
   */
  exportMetrics() {
    return {
      environment: this.environment,
      timestamp: Date.now(),
      stats: this.getStats(),
      recentStats: this.getRecentStats(),
      issues: this.checkForIssues(),
      raw: {
        messageSend: this.metrics.messageSendLatency.slice(-20),
        snapshot: this.metrics.snapshotLatency.slice(-20),
        roundTrip: this.metrics.roundTripTime.slice(-20),
      },
    };
  }
}

// Singleton global
let monitorInstance = null;

export const getPerformanceMonitor = () => {
  if (!monitorInstance) {
    monitorInstance = new PerformanceMonitor();
  }
  return monitorInstance;
};

export default PerformanceMonitor;
