import React, { useState, useEffect } from 'react';
import { KPICard } from './AnalyticsCharts';
import { getUniqueUsersToday } from '@/services/analyticsService';

/**
 * KPI Card con segmentación de usuarios únicos
 * Muestra tooltip al hacer hover con información de usuarios únicos
 */
export const SegmentedKPICard = ({
  icon,
  value,
  label,
  change,
  changeLabel,
  color,
  trendData,
  eventType, // 'logins', 'registrations', 'messagesSent'
  showSegmentation = true
}) => {
  const [uniqueUsers, setUniqueUsers] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (showSegmentation && eventType) {
      loadUniqueUsers();
    }
  }, [eventType, showSegmentation]);

  const loadUniqueUsers = async () => {
    try {
      const data = await getUniqueUsersToday();
      setUniqueUsers(data);
    } catch (error) {
      console.error('Error loading unique users:', error);
    }
  };

  const getSegmentationData = () => {
    if (!uniqueUsers || !eventType) return null;

    const eventTypeMap = {
      'logins': {
        total: value,
        unique: uniqueUsers.uniqueLogins,
        label: 'logins'
      },
      'registrations': {
        total: value,
        unique: uniqueUsers.uniqueRegistrations,
        label: 'registros'
      },
      'messagesSent': {
        total: value,
        unique: uniqueUsers.uniqueMessageSenders,
        label: 'mensajes'
      }
    };

    return eventTypeMap[eventType];
  };

  const segmentationData = getSegmentationData();

  return (
    <div className="relative">
      <div
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="cursor-help"
      >
        <KPICard
          icon={icon}
          value={value}
          label={label}
          change={change}
          changeLabel={changeLabel}
          color={color}
          trendData={trendData}
        />
      </div>

      {/* Tooltip con segmentación */}
      {showTooltip && segmentationData && showSegmentation && (
        <div className="absolute z-50 top-full left-1/2 transform -translate-x-1/2 mt-2 w-80 bg-background/95 backdrop-blur-sm border border-primary/30 rounded-xl p-4 shadow-2xl">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-primary/20 pb-2">
              <h4 className="font-semibold text-sm">Segmentación de Usuarios</h4>
              <span className="text-xs text-muted-foreground">Hoy</span>
            </div>

            {/* Total eventos */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total de {segmentationData.label}:</span>
              <span className="font-bold text-lg">{segmentationData.total.toLocaleString()}</span>
            </div>

            {/* Usuarios únicos */}
            <div className="flex items-center justify-between bg-primary/10 rounded-lg p-2">
              <span className="text-sm font-medium">Usuarios únicos:</span>
              <span className="font-bold text-lg text-primary">{segmentationData.unique.toLocaleString()}</span>
            </div>

            {/* Promedio por usuario */}
            {segmentationData.unique > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Promedio por usuario:</span>
                <span className="font-semibold">{(segmentationData.total / segmentationData.unique).toFixed(1)}</span>
              </div>
            )}

            {/* Descripción interpretativa */}
            <div className="pt-2 border-t border-primary/20">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {segmentationData.unique === 1 && segmentationData.total > 1 ? (
                  <span className="text-yellow-400">⚠️ Todos los {segmentationData.label} fueron realizados por <strong>1 solo usuario</strong></span>
                ) : segmentationData.unique === segmentationData.total ? (
                  <span className="text-green-400">✅ Cada {segmentationData.label.slice(0, -1)} fue realizado por un <strong>usuario diferente</strong></span>
                ) : (
                  <span>
                    {segmentationData.total} {segmentationData.label} fueron realizados por <strong>{segmentationData.unique} {segmentationData.unique === 1 ? 'persona' : 'personas'}</strong>
                  </span>
                )}
              </p>
            </div>

            {/* Indicador visual */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Distribución</span>
                <span className="font-medium">{segmentationData.unique > 0 ? ((segmentationData.unique / segmentationData.total) * 100).toFixed(0) : 0}% únicos</span>
              </div>
              <div className="h-2 bg-background/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary/50 rounded-full transition-all"
                  style={{ width: `${segmentationData.unique > 0 ? (segmentationData.unique / segmentationData.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Flecha del tooltip */}
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-background/95 border-l border-t border-primary/30 rotate-45" />
        </div>
      )}
    </div>
  );
};

export default SegmentedKPICard;
