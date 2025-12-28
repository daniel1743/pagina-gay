import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, AlertCircle, TrendingDown, TrendingUp, Info, CheckCircle } from 'lucide-react';

/**
 * Componente de alerta inteligente
 */
export const SmartAlert = ({ type = 'info', title, description, icon: CustomIcon, action }) => {
  const alertStyles = {
    warning: {
      border: 'border-yellow-500/50',
      bg: 'bg-yellow-500/10',
      icon: AlertTriangle,
      iconColor: 'text-yellow-400'
    },
    error: {
      border: 'border-red-500/50',
      bg: 'bg-red-500/10',
      icon: AlertCircle,
      iconColor: 'text-red-400'
    },
    info: {
      border: 'border-blue-500/50',
      bg: 'bg-blue-500/10',
      icon: Info,
      iconColor: 'text-blue-400'
    },
    success: {
      border: 'border-green-500/50',
      bg: 'bg-green-500/10',
      icon: CheckCircle,
      iconColor: 'text-green-400'
    },
    danger: {
      border: 'border-red-500/50',
      bg: 'bg-red-500/10',
      icon: TrendingDown,
      iconColor: 'text-red-400'
    },
    positive: {
      border: 'border-green-500/50',
      bg: 'bg-green-500/10',
      icon: TrendingUp,
      iconColor: 'text-green-400'
    }
  };

  const style = alertStyles[type] || alertStyles.info;
  const Icon = CustomIcon || style.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${style.border} ${style.bg} border rounded-xl p-4`}
    >
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${style.iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <h4 className="font-semibold mb-1">{title}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
          {action && (
            <div className="mt-3">
              {action}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Panel de alertas inteligentes con análisis automático
 */
export const SmartAlertsPanel = ({
  analyticsStats,
  yesterdayStats,
  reportStats,
  ticketStats,
  sanctionStats
}) => {
  const alerts = [];

  // Calcular métricas
  const conversionRate = analyticsStats.pageViews > 0
    ? (analyticsStats.registrations / analyticsStats.pageViews) * 100
    : 0;

  const activationRate = analyticsStats.registrations > 0
    ? (analyticsStats.messagesSent / analyticsStats.registrations) * 100
    : 0;

  const bounceRate = analyticsStats.pageViews > 0
    ? (analyticsStats.pageExits / analyticsStats.pageViews) * 100
    : 0;

  // Comparaciones con ayer
  const registrationsChange = yesterdayStats.registrations > 0
    ? ((analyticsStats.registrations - yesterdayStats.registrations) / yesterdayStats.registrations) * 100
    : 0;

  const pageViewsChange = yesterdayStats.pageViews > 0
    ? ((analyticsStats.pageViews - yesterdayStats.pageViews) / yesterdayStats.pageViews) * 100
    : 0;

  // ALERTA 1: Conversión muy baja
  if (conversionRate < 3 && analyticsStats.pageViews > 50) {
    alerts.push({
      type: 'warning',
      title: '⚠️ Tasa de Conversión Baja',
      description: `Solo el ${conversionRate.toFixed(1)}% de visitantes se registra. Considera mejorar los CTAs del landing o reducir fricciones en el registro.`,
      priority: 2
    });
  }

  // ALERTA 2: Caída significativa de registros
  if (registrationsChange < -20 && yesterdayStats.registrations > 5) {
    alerts.push({
      type: 'danger',
      title: '🚨 Caída en Registros',
      description: `Los registros bajaron ${Math.abs(registrationsChange).toFixed(0)}% comparado con ayer. Revisa si hay problemas técnicos o cambios recientes.`,
      priority: 1
    });
  }

  // ALERTA 3: Crecimiento positivo
  if (registrationsChange > 25 && yesterdayStats.registrations > 0) {
    alerts.push({
      type: 'positive',
      title: '🎉 Crecimiento Excelente',
      description: `Los registros aumentaron ${registrationsChange.toFixed(0)}% comparado con ayer. ¡Sigue así!`,
      priority: 3
    });
  }

  // ALERTA 4: Bounce rate alto
  if (bounceRate > 60 && analyticsStats.pageViews > 50) {
    alerts.push({
      type: 'warning',
      title: '📉 Alto Porcentaje de Rebote',
      description: `El ${bounceRate.toFixed(1)}% de visitantes sale sin interactuar. Revisa la velocidad de carga y claridad del mensaje inicial.`,
      priority: 2
    });
  }

  // ALERTA 5: Reportes acumulados
  if (reportStats.pendingReports > 10) {
    alerts.push({
      type: 'warning',
      title: '📋 Reportes Pendientes Acumulados',
      description: `Tienes ${reportStats.pendingReports} reportes sin revisar. Revísalos pronto para mantener la comunidad segura.`,
      priority: 2
    });
  }

  // ALERTA 6: Tickets sin atender
  if (ticketStats.openTickets > 5) {
    alerts.push({
      type: 'warning',
      title: '🎫 Tickets Sin Atender',
      description: `Hay ${ticketStats.openTickets} tickets abiertos esperando respuesta. Los usuarios esperan soporte rápido.`,
      priority: 2
    });
  }

  // ALERTA 7: Activación baja (usuarios que se registran pero no envían mensajes)
  if (activationRate < 30 && analyticsStats.registrations > 10) {
    alerts.push({
      type: 'warning',
      title: '💬 Baja Activación de Usuarios',
      description: `Solo el ${activationRate.toFixed(1)}% de usuarios registrados envía mensajes. Mejora el onboarding y guía inicial.`,
      priority: 2
    });
  }

  // ALERTA 8: Sin tráfico
  if (analyticsStats.pageViews === 0) {
    alerts.push({
      type: 'error',
      title: '🔴 Sin Tráfico Hoy',
      description: 'No se han registrado visualizaciones hoy. Verifica que el tracking esté funcionando correctamente.',
      priority: 1
    });
  }

  // ALERTA 9: Crecimiento sostenido
  if (pageViewsChange > 15 && yesterdayStats.pageViews > 20) {
    alerts.push({
      type: 'success',
      title: '📈 Tráfico en Crecimiento',
      description: `Las visualizaciones aumentaron ${pageViewsChange.toFixed(0)}% vs ayer. El marketing está funcionando.`,
      priority: 3
    });
  }

  // ALERTA 10: Muchas sanciones activas (posible problema de moderación)
  if (sanctionStats.active > 20) {
    alerts.push({
      type: 'info',
      title: '⚖️ Alta Actividad de Moderación',
      description: `Hay ${sanctionStats.active} sanciones activas. Mantén vigilancia sobre la calidad de la comunidad.`,
      priority: 3
    });
  }

  // Ordenar alertas por prioridad (1 = más urgente, 3 = menos urgente)
  alerts.sort((a, b) => a.priority - b.priority);

  if (alerts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-effect rounded-2xl border border-green-500/30 bg-green-500/10 p-6 text-center"
      >
        <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-green-400 mb-2">¡Todo en Orden!</h3>
        <p className="text-sm text-muted-foreground">
          No hay alertas críticas. Tu plataforma está funcionando correctamente.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <AlertTriangle className="w-6 h-6 text-yellow-400" />
        Alertas Inteligentes ({alerts.length})
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {alerts.map((alert, index) => (
          <SmartAlert
            key={index}
            type={alert.type}
            title={alert.title}
            description={alert.description}
            icon={alert.icon}
            action={alert.action}
          />
        ))}
      </div>
    </div>
  );
};

export default SmartAlertsPanel;
