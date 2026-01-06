import { useState, useEffect } from 'react';
import { getPerformanceMonitor } from '@/services/performanceMonitor';

/**
 * 📊 Panel de Diagnóstico de Velocidad del Chat
 *
 * Muestra métricas en tiempo real:
 * - Latencia de envío de mensajes
 * - Latencia de recepción (snapshots)
 * - Round-trip total
 * - Alertas de velocidad
 *
 * Útil para comparar localhost vs producción
 */
export default function PerformanceDashboard() {
  const [stats, setStats] = useState(null);
  const [recentStats, setRecentStats] = useState(null);
  const [issues, setIssues] = useState([]);
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    const perfMonitor = getPerformanceMonitor();

    // Actualizar cada 2 segundos
    const interval = setInterval(() => {
      setStats(perfMonitor.getStats());
      setRecentStats(perfMonitor.getRecentStats(10000)); // Últimos 10 segundos
      setIssues(perfMonitor.checkForIssues());
    }, 2000);

    // Primera carga
    setStats(perfMonitor.getStats());
    setRecentStats(perfMonitor.getRecentStats(10000));
    setIssues(perfMonitor.checkForIssues());

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  const formatLatency = (value) => {
    if (value === 0 || value === undefined) return '-';
    return `${value}ms`;
  };

  const getLatencyColor = (value) => {
    if (!value || value === 0) return 'text-gray-400';
    if (value < 500) return 'text-green-400';
    if (value < 1000) return 'text-yellow-400';
    if (value < 2000) return 'text-orange-400';
    return 'text-red-400';
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'error':
        return 'bg-red-500/20 border-red-500 text-red-300';
      case 'warning':
        return 'bg-yellow-500/20 border-yellow-500 text-yellow-300';
      default:
        return 'bg-blue-500/20 border-blue-500 text-blue-300';
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-black/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-lg border border-gray-700 hover:bg-black/80 transition-colors flex items-center gap-2"
        >
          <span className="text-lg">📊</span>
          <span className="text-sm">
            {recentStats?.roundTrip?.avg > 0
              ? `${recentStats.roundTrip.avg}ms`
              : 'Monitor'}
          </span>
          {issues.length > 0 && (
            <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {issues.length}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black/90 backdrop-blur-sm text-white rounded-lg shadow-2xl border border-gray-700 w-[400px] max-h-[600px] overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 sticky top-0 bg-black/90 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-xl">📊</span>
          <h3 className="font-bold text-sm">Monitor de Velocidad</h3>
          {stats && (
            <span className="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded">
              {stats.environment}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(true)}
            className="text-gray-400 hover:text-white transition-colors text-xs"
            title="Minimizar"
          >
            ➖
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-white transition-colors text-xs"
            title="Cerrar"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Alertas */}
      {issues.length > 0 && (
        <div className="p-4 space-y-2 border-b border-gray-700">
          {issues.map((issue, index) => (
            <div
              key={index}
              className={`text-xs p-2 rounded border ${getSeverityColor(issue.severity)}`}
            >
              <div className="font-semibold mb-1">{issue.message}</div>
              <div className="text-xs opacity-80">{issue.suggestion}</div>
            </div>
          ))}
        </div>
      )}

      {/* Métricas Recientes (últimos 10 segundos) */}
      {recentStats && (
        <div className="p-4 border-b border-gray-700">
          <div className="text-xs text-gray-400 mb-3 font-semibold uppercase">
            Últimos 10 segundos
          </div>
          <div className="space-y-3">
            {/* Envío de mensaje */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">Envío</span>
                <span className={`text-sm font-mono font-bold ${getLatencyColor(recentStats.messageSend.avg)}`}>
                  {formatLatency(recentStats.messageSend.avg)}
                </span>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="text-gray-500">
                  P95: <span className={getLatencyColor(recentStats.messageSend.p95)}>{formatLatency(recentStats.messageSend.p95)}</span>
                </span>
                <span className="text-gray-500">
                  Max: <span className={getLatencyColor(recentStats.messageSend.max)}>{formatLatency(recentStats.messageSend.max)}</span>
                </span>
                <span className="text-gray-500">
                  n={recentStats.messageSend.count}
                </span>
              </div>
            </div>

            {/* Recepción (snapshot) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">Recepción</span>
                <span className={`text-sm font-mono font-bold ${getLatencyColor(recentStats.snapshot.avg)}`}>
                  {formatLatency(recentStats.snapshot.avg)}
                </span>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="text-gray-500">
                  P95: <span className={getLatencyColor(recentStats.snapshot.p95)}>{formatLatency(recentStats.snapshot.p95)}</span>
                </span>
                <span className="text-gray-500">
                  Max: <span className={getLatencyColor(recentStats.snapshot.max)}>{formatLatency(recentStats.snapshot.max)}</span>
                </span>
                <span className="text-gray-500">
                  n={recentStats.snapshot.count}
                </span>
              </div>
            </div>

            {/* Round-trip total */}
            <div className="pt-2 border-t border-gray-800">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400 font-semibold">Round-trip Total</span>
                <span className={`text-lg font-mono font-bold ${getLatencyColor(recentStats.roundTrip.avg)}`}>
                  {formatLatency(recentStats.roundTrip.avg)}
                </span>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="text-gray-500">
                  P95: <span className={getLatencyColor(recentStats.roundTrip.p95)}>{formatLatency(recentStats.roundTrip.p95)}</span>
                </span>
                <span className="text-gray-500">
                  Max: <span className={getLatencyColor(recentStats.roundTrip.max)}>{formatLatency(recentStats.roundTrip.max)}</span>
                </span>
                <span className="text-gray-500">
                  n={recentStats.roundTrip.count}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas Globales */}
      {stats && (
        <div className="p-4 border-b border-gray-700">
          <div className="text-xs text-gray-400 mb-3 font-semibold uppercase">
            Histórico (últimas {stats.messageSend.count} mediciones)
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Envío promedio:</span>
              <span className={`font-mono ${getLatencyColor(stats.messageSend.avg)}`}>
                {formatLatency(stats.messageSend.avg)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Recepción promedio:</span>
              <span className={`font-mono ${getLatencyColor(stats.snapshot.avg)}`}>
                {formatLatency(stats.snapshot.avg)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Round-trip promedio:</span>
              <span className={`font-mono ${getLatencyColor(stats.roundTrip.avg)}`}>
                {formatLatency(stats.roundTrip.avg)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Mensajes pendientes:</span>
              <span className="font-mono">{stats.pendingCount || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Acciones */}
      <div className="p-4 flex gap-2">
        <button
          onClick={() => {
            const perfMonitor = getPerformanceMonitor();
            const exported = perfMonitor.exportMetrics();
            console.log('📊 Métricas exportadas:', exported);

            // Descargar como JSON
            const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `performance-metrics-${Date.now()}.json`;
            a.click();
          }}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 px-3 rounded transition-colors"
        >
          Exportar JSON
        </button>
        <button
          onClick={() => {
            const perfMonitor = getPerformanceMonitor();
            perfMonitor.reset();
            setStats(null);
            setRecentStats(null);
            setIssues([]);
          }}
          className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-xs py-2 px-3 rounded transition-colors"
        >
          Resetear
        </button>
      </div>

      {/* Footer */}
      <div className="p-3 bg-gray-900 text-xs text-gray-500 text-center border-t border-gray-800">
        Actualización cada 2 segundos
      </div>
    </div>
  );
}
