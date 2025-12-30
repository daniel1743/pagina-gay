import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Shield, X, CheckCircle, Eye, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { subscribeToModerationAlerts, resolveModerationAlert, getModerationStats } from '@/services/moderationService';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from '@/components/ui/use-toast';

const SEVERITY_COLORS = {
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
  critical: 'bg-red-500/20 text-red-400 border-red-500/50'
};

const TYPE_LABELS = {
  hate_speech: 'Discurso de Odio',
  offensive: 'Contenido Ofensivo',
  suicide: 'Suicidio',
  self_harm: 'Autolesión',
  harassment: 'Acoso'
};

export default function ModerationAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);

  useEffect(() => {
    // Suscribirse a alertas
    const unsubscribe = subscribeToModerationAlerts((newAlerts) => {
      setAlerts(newAlerts);
    });

    // Cargar estadísticas
    getModerationStats().then(setStats);

    return () => unsubscribe();
  }, []);

  const handleResolve = async (alertId) => {
    try {
      await resolveModerationAlert(alertId);
      toast({
        title: "Alerta Resuelta",
        description: "La alerta ha sido marcada como resuelta",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo resolver la alerta",
        variant: "destructive",
      });
    }
  };

  const pendingAlerts = alerts.filter(a => a.status === 'pending');
  const criticalAlerts = pendingAlerts.filter(a => a.severity === 'critical' || a.type === 'suicide' || a.type === 'self_harm');

  return (
    <div className="space-y-4">
      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="text-sm text-slate-400">Total Alertas</div>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="text-sm text-slate-400">Pendientes</div>
            <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="text-sm text-slate-400">Resueltas</div>
            <div className="text-2xl font-bold text-green-400">{stats.resolved}</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="text-sm text-slate-400">Críticas</div>
            <div className="text-2xl font-bold text-red-400">{criticalAlerts.length}</div>
          </div>
        </div>
      )}

      {/* Alertas Críticas */}
      {criticalAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/50 rounded-lg p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h3 className="font-bold text-red-400">🚨 Alertas Críticas ({criticalAlerts.length})</h3>
          </div>
          <ScrollArea className="h-48">
            <div className="space-y-2">
              {criticalAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-slate-900/50 rounded p-3 border border-red-500/30 cursor-pointer hover:bg-slate-900/70"
                  onClick={() => setSelectedAlert(alert)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">{TYPE_LABELS[alert.type] || alert.type}</div>
                      <div className="text-sm text-slate-400">{alert.username}</div>
                    </div>
                    <Badge className={SEVERITY_COLORS[alert.severity]}>
                      {alert.severity}
                    </Badge>
                  </div>
                  {alert.needsHelp && (
                    <div className="mt-2 text-sm text-red-400 font-semibold">
                      ⚠️ Necesita Ayuda Inmediata
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </motion.div>
      )}

      {/* Lista de Alertas */}
      <div className="bg-slate-800/50 rounded-lg border border-slate-700">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-white">Todas las Alertas</h3>
          </div>
        </div>
        <ScrollArea className="h-96">
          <div className="p-4 space-y-3">
            <AnimatePresence>
              {pendingAlerts.length === 0 ? (
                <div className="text-center text-slate-400 py-8">
                  No hay alertas pendientes
                </div>
              ) : (
                pendingAlerts.map((alert) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 hover:border-purple-500/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedAlert(alert)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={SEVERITY_COLORS[alert.severity]}>
                            {alert.severity}
                          </Badge>
                          <span className="font-semibold text-white">
                            {TYPE_LABELS[alert.type] || alert.type}
                          </span>
                        </div>
                        <div className="text-sm text-slate-300 mb-1">
                          <strong>{alert.username}</strong> en sala <strong>{alert.roomId}</strong>
                        </div>
                        <div className="text-sm text-slate-400 mb-2 line-clamp-2">
                          "{alert.message}"
                        </div>
                        {alert.reason && (
                          <div className="text-xs text-slate-500 mb-2">
                            {alert.reason}
                          </div>
                        )}
                        {alert.needsHelp && (
                          <div className="text-sm text-red-400 font-semibold mb-2">
                            ⚠️ Necesita Ayuda Inmediata
                          </div>
                        )}
                        <div className="text-xs text-slate-500">
                          {alert.createdAt && formatDistanceToNow(alert.createdAt.toDate(), { addSuffix: true, locale: es })}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResolve(alert.id);
                        }}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Resolver
                      </Button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>

      {/* Modal de Detalle */}
      {selectedAlert && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectedAlert(null)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full mx-4 border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Detalle de Alerta</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedAlert(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-slate-400">Tipo</div>
                <div className="font-semibold text-white">
                  {TYPE_LABELS[selectedAlert.type] || selectedAlert.type}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Severidad</div>
                <Badge className={SEVERITY_COLORS[selectedAlert.severity]}>
                  {selectedAlert.severity}
                </Badge>
              </div>
              <div>
                <div className="text-sm text-slate-400">Usuario</div>
                <div className="font-semibold text-white">{selectedAlert.username}</div>
                <div className="text-xs text-slate-500">ID: {selectedAlert.userId}</div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Sala</div>
                <div className="font-semibold text-white">{selectedAlert.roomId}</div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Mensaje</div>
                <div className="bg-slate-900/50 rounded p-3 text-white font-mono text-sm">
                  {selectedAlert.message}
                </div>
              </div>
              {selectedAlert.reason && (
                <div>
                  <div className="text-sm text-slate-400">Razón</div>
                  <div className="text-white">{selectedAlert.reason}</div>
                </div>
              )}
              {selectedAlert.needsHelp && (
                <div className="bg-red-500/10 border border-red-500/50 rounded p-4">
                  <div className="flex items-center gap-2 text-red-400 font-semibold">
                    <AlertTriangle className="w-5 h-5" />
                    <span>⚠️ Esta persona necesita ayuda inmediata</span>
                  </div>
                  <div className="mt-2 text-sm text-slate-300">
                    Se recomienda contactar con servicios de ayuda profesional.
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    handleResolve(selectedAlert.id);
                    setSelectedAlert(null);
                  }}
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Marcar como Resuelta
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}




