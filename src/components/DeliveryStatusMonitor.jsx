import { useState, useEffect } from 'react';
import { getDeliveryService } from '@/services/messageDeliveryService';

/**
 * 📊 Monitor Visual de Estado de Entrega
 * Muestra en tiempo real si los mensajes están llegando a otros dispositivos
 */
export default function DeliveryStatusMonitor() {
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const deliveryService = getDeliveryService();

    const interval = setInterval(() => {
      // Obtener últimos 5 mensajes enviados
      const allMessages = Array.from(deliveryService.pendingMessages.values())
        .sort((a, b) => b.sentAt - a.sentAt)
        .slice(0, 5);

      setMessages(allMessages);
      setStats(deliveryService.getDeliveryStats());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent': return 'bg-gray-500';
      case 'delivered': return 'bg-blue-500';
      case 'read': return 'bg-green-500';
      case 'suspended': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'sent': return '✓ Enviado';
      case 'delivered': return '✓✓ Entregado';
      case 'read': return '✓✓ Leído';
      case 'suspended': return '⚠️ Suspendido';
      default: return '⏳ Enviando';
    }
  };

  const formatTime = (ms) => {
    if (!ms) return '-';
    return `${ms}ms`;
  };

  if (messages.length === 0 && !stats) return null;

  return (
    <div className="fixed bottom-20 right-4 z-40 bg-black/95 backdrop-blur-sm text-white rounded-lg shadow-2xl border border-gray-700 w-[350px] p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold uppercase text-gray-300">Estado de Entrega</h3>
        <div className="text-[10px] text-gray-500">Últimos 5 mensajes</div>
      </div>

      {/* Estadísticas globales */}
      {stats && (
        <div className="grid grid-cols-3 gap-2 mb-3 text-center">
          <div className="bg-gray-800 rounded p-2">
            <div className="text-xs text-gray-400">Enviados</div>
            <div className="text-lg font-bold">{stats.totalSent}</div>
          </div>
          <div className="bg-blue-900/50 rounded p-2">
            <div className="text-xs text-gray-400">Entregados</div>
            <div className="text-lg font-bold text-blue-400">{stats.delivered}</div>
          </div>
          <div className="bg-gray-800 rounded p-2">
            <div className="text-xs text-gray-400">Promedio</div>
            <div className="text-sm font-mono text-yellow-400">{formatTime(stats.avgDeliveryTime)}</div>
          </div>
        </div>
      )}

      {/* Lista de mensajes */}
      <div className="space-y-1.5">
        {messages.map((msg) => (
          <div
            key={msg.messageId}
            className="bg-gray-800/50 rounded p-2 flex items-center justify-between text-xs"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2 h-2 rounded-full ${getStatusColor(msg.status)}`} />
                <span className="font-mono text-[10px] text-gray-400">
                  {msg.messageId.substring(0, 8)}
                </span>
              </div>
              <div className="text-[11px] text-gray-300">{getStatusLabel(msg.status)}</div>
            </div>

            <div className="text-right text-[10px]">
              {msg.status === 'delivered' && msg.deliveredAt && (
                <div className="text-green-400 font-mono">
                  {formatTime(msg.deliveredAt - msg.sentAt)}
                </div>
              )}
              {msg.status === 'suspended' && (
                <div className="text-red-400">
                  No llegó
                </div>
              )}
              {msg.status === 'sent' && (
                <div className="text-yellow-400 animate-pulse">
                  Esperando...
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {messages.length === 0 && (
        <div className="text-center text-xs text-gray-500 py-4">
          Envía un mensaje para ver el estado de entrega
        </div>
      )}

      {/* Leyenda */}
      <div className="mt-3 pt-2 border-t border-gray-700 text-[10px] text-gray-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gray-500" />
            Enviado
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Entregado
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Suspendido
          </span>
        </div>
      </div>
    </div>
  );
}
