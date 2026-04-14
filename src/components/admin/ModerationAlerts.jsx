import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Shield, X, CheckCircle, Eye, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  subscribeToModerationAlerts,
  resolveModerationAlert,
  getModerationStats,
  subscribeToContactSafetyAlerts,
  reviewContactSafetyAlert,
} from '@/services/moderationService';
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
  harassment: 'Acoso',
  minor_risk: 'Riesgo de Menor',
  minor_ambiguous: 'Menor Ambiguo',
  drug_meetup: 'Droga + Encuentro',
  drugs: 'Drogas',
  violence: 'Violencia',
  external_contact: 'Contacto Externo',
  coercion: 'Coerción',
  high_risk_ai: 'Riesgo Alto IA',
};

const CONTACT_EVENT_LABELS = {
  blocked_attempt: 'Bloqueo de contacto',
  share_requested: 'Solicitud de compartir',
  share_accepted: 'Solicitud aceptada',
  share_rejected: 'Solicitud rechazada',
  share_revoked: 'Contacto revocado',
};

const CONTACT_SURFACE_LABELS = {
  opin: 'OPIN',
  private_chat: 'Privado',
};

const getContactRiskSeverity = (alert) => {
  if ((alert?.riskScore || 0) >= 10) return 'critical';
  if ((alert?.riskScore || 0) >= 6) return 'high';
  if ((alert?.riskScore || 0) >= 3) return 'medium';
  return 'low';
};

export default function ModerationAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [contactAlerts, setContactAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [selectedContactAlert, setSelectedContactAlert] = useState(null);

  useEffect(() => {
    const unsubscribeModeration = subscribeToModerationAlerts((newAlerts) => {
      setAlerts(newAlerts);
    });
    const unsubscribeContactSafety = subscribeToContactSafetyAlerts((newAlerts) => {
      setContactAlerts(newAlerts);
    });

    getModerationStats().then(setStats);

    return () => {
      unsubscribeModeration();
      unsubscribeContactSafety();
    };
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

  const handleReviewContactAlert = async (userId) => {
    try {
      await reviewContactSafetyAlert(userId);
      toast({
        title: "Riesgo revisado",
        description: "La alerta de contacto quedó marcada como revisada",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo marcar la revisión",
        variant: "destructive",
      });
    }
  };

  const pendingAlerts = alerts.filter(a => a.status === 'pending');
  const criticalAlerts = pendingAlerts.filter(a => a.severity === 'critical' || a.type === 'suicide' || a.type === 'self_harm');
  const criticalContactAlerts = contactAlerts.filter((alert) => getContactRiskSeverity(alert) === 'critical');
  const pendingContactReview = contactAlerts.filter((alert) => !alert.lastReviewedAt);

  return (
    <div className="space-y-4">
      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
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
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="text-sm text-slate-400">Riesgo Contacto</div>
            <div className="text-2xl font-bold text-orange-400">{contactAlerts.length}</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="text-sm text-slate-400">Sin Revisar</div>
            <div className="text-2xl font-bold text-cyan-400">{pendingContactReview.length}</div>
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

      {/* Riesgo de contacto externo */}
      <div className="bg-slate-800/50 rounded-lg border border-slate-700">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-orange-400" />
            <h3 className="font-bold text-white">Riesgo de Contacto Externo</h3>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Solo usuarios con `riskScore` relevante. Consulta limitada para bajo consumo.
          </p>
        </div>
        <ScrollArea className="h-72">
          <div className="p-4 space-y-3">
            {contactAlerts.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                No hay usuarios con reincidencia relevante
              </div>
            ) : (
              contactAlerts.map((alert) => {
                const severity = getContactRiskSeverity(alert);
                return (
                  <div
                    key={alert.userId}
                    className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 hover:border-orange-500/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedContactAlert(alert)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={SEVERITY_COLORS[severity]}>
                            riesgo {alert.riskScore}
                          </Badge>
                          <span className="font-semibold text-white">{alert.username}</span>
                        </div>
                        <div className="text-sm text-slate-300">
                          Bloqueos: {alert.blockedAttempts} total
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          OPIN: {alert.blockedAttemptsOpin} · Privado: {alert.blockedAttemptsPrivate}
                        </div>
                        <div className="text-xs text-slate-500 mt-2">
                          Último evento: {CONTACT_EVENT_LABELS[alert.lastEventType] || alert.lastEventType || 'sin dato'}
                          {alert.lastSurface ? ` · ${CONTACT_SURFACE_LABELS[alert.lastSurface] || alert.lastSurface}` : ''}
                        </div>
                        {alert.lastEventAt && (
                          <div className="text-xs text-slate-500">
                            {formatDistanceToNow(alert.lastEventAt.toDate(), { addSuffix: true, locale: es })}
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReviewContactAlert(alert.userId);
                        }}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Revisado
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
        {criticalContactAlerts.length > 0 && (
          <div className="border-t border-slate-700 px-4 py-3 text-sm text-red-300">
            {criticalContactAlerts.length} usuario(s) con riesgo crítico de fuga de contacto.
          </div>
        )}
      </div>

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

      {selectedContactAlert && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectedContactAlert(null)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full mx-4 border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Detalle Riesgo de Contacto</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedContactAlert(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-slate-400">Usuario</div>
                <div className="font-semibold text-white">{selectedContactAlert.username}</div>
                <div className="text-xs text-slate-500">ID: {selectedContactAlert.userId}</div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Risk score</div>
                <Badge className={SEVERITY_COLORS[getContactRiskSeverity(selectedContactAlert)]}>
                  {selectedContactAlert.riskScore}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900/50 rounded p-3">
                  <div className="text-xs text-slate-400">Bloqueos OPIN</div>
                  <div className="text-lg font-semibold text-white">{selectedContactAlert.blockedAttemptsOpin}</div>
                </div>
                <div className="bg-slate-900/50 rounded p-3">
                  <div className="text-xs text-slate-400">Bloqueos Privado</div>
                  <div className="text-lg font-semibold text-white">{selectedContactAlert.blockedAttemptsPrivate}</div>
                </div>
                <div className="bg-slate-900/50 rounded p-3">
                  <div className="text-xs text-slate-400">Solicitudes</div>
                  <div className="text-lg font-semibold text-white">{selectedContactAlert.shareRequests}</div>
                </div>
                <div className="bg-slate-900/50 rounded p-3">
                  <div className="text-xs text-slate-400">Aceptadas</div>
                  <div className="text-lg font-semibold text-white">{selectedContactAlert.shareAccepted}</div>
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Último evento</div>
                <div className="text-white">
                  {CONTACT_EVENT_LABELS[selectedContactAlert.lastEventType] || selectedContactAlert.lastEventType || 'sin dato'}
                </div>
                <div className="text-xs text-slate-500">
                  {CONTACT_SURFACE_LABELS[selectedContactAlert.lastSurface] || selectedContactAlert.lastSurface || 'sin superficie'}
                </div>
              </div>
              {selectedContactAlert.lastBlockedType && (
                <div>
                  <div className="text-sm text-slate-400">Patrón detectado</div>
                  <div className="text-white">{selectedContactAlert.lastBlockedType}</div>
                </div>
              )}
              {selectedContactAlert.lastAdminNotes && (
                <div>
                  <div className="text-sm text-slate-400">Notas admin</div>
                  <div className="text-white">{selectedContactAlert.lastAdminNotes}</div>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    handleReviewContactAlert(selectedContactAlert.userId);
                    setSelectedContactAlert(null);
                  }}
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Marcar como Revisado
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}





