import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Clock, AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';
import { getTimeDistribution } from '@/services/analyticsService';

/**
 * Gráfico de distribución de tiempo en sitio
 * Muestra cuánto tiempo permanecen los usuarios en la plataforma
 * y en qué momento abandonan
 */
export const TimeDistributionChart = () => {
  const [timeData, setTimeData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTimeDistribution();
  }, []);

  const loadTimeDistribution = async () => {
    try {
      const data = await getTimeDistribution();
      setTimeData(data);
    } catch (error) {
      console.error('Error loading time distribution:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-effect p-6 rounded-2xl border border-primary/30">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-primary/20 rounded w-1/3" />
          <div className="h-64 bg-primary/10 rounded" />
        </div>
      </div>
    );
  }

  if (!timeData || timeData.totalUsers === 0) {
    return (
      <div className="glass-effect p-6 rounded-2xl border border-primary/30 text-center">
        <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">No hay datos de tiempo en sitio aún</p>
      </div>
    );
  }

  // Preparar datos para el gráfico
  const chartData = [
    { bucket: '0-3s', label: '0-3 seg', users: timeData.distribution['0-3s'] || 0, color: '#ef4444' },
    { bucket: '3-10s', label: '3-10 seg', users: timeData.distribution['3-10s'] || 0, color: '#f97316' },
    { bucket: '10-30s', label: '10-30 seg', users: timeData.distribution['10-30s'] || 0, color: '#f59e0b' },
    { bucket: '30-60s', label: '30-60 seg', users: timeData.distribution['30-60s'] || 0, color: '#eab308' },
    { bucket: '1-3m', label: '1-3 min', users: timeData.distribution['1-3m'] || 0, color: '#84cc16' },
    { bucket: '3-5m', label: '3-5 min', users: timeData.distribution['3-5m'] || 0, color: '#22c55e' },
    { bucket: '5m+', label: '5+ min', users: timeData.distribution['5m+'] || 0, color: '#10b981' },
  ];

  // Calcular porcentajes
  const chartDataWithPercentage = chartData.map(item => ({
    ...item,
    percentage: timeData.totalUsers > 0 ? ((item.users / timeData.totalUsers) * 100).toFixed(1) : 0
  }));

  // Calcular tasa de abandono temprano (0-3s)
  const earlyAbandonRate = timeData.totalUsers > 0
    ? ((chartData[0].users / timeData.totalUsers) * 100).toFixed(1)
    : 0;

  // Calcular tasa de engagement (más de 1 minuto)
  const engagedUsers = chartData.slice(4).reduce((sum, item) => sum + item.users, 0);
  const engagementRate = timeData.totalUsers > 0
    ? ((engagedUsers / timeData.totalUsers) * 100).toFixed(1)
    : 0;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-primary/30 rounded-lg p-3 shadow-xl">
          <p className="font-semibold mb-1">{data.label}</p>
          <p className="text-sm text-muted-foreground">
            {data.users} usuarios ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-effect p-6 rounded-2xl border border-primary/30"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-400" />
            Distribución de Tiempo en Sitio
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Cuánto tiempo permanecen los usuarios antes de abandonar
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{timeData.totalUsers}</p>
          <p className="text-xs text-muted-foreground">usuarios hoy</p>
        </div>
      </div>

      {/* Métricas clave */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Abandono temprano */}
        <div className={`p-4 rounded-xl border ${
          earlyAbandonRate > 60 ? 'border-red-500/50 bg-red-500/10' :
          earlyAbandonRate > 40 ? 'border-yellow-500/50 bg-yellow-500/10' :
          'border-green-500/50 bg-green-500/10'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className={`w-5 h-5 ${
              earlyAbandonRate > 60 ? 'text-red-400' :
              earlyAbandonRate > 40 ? 'text-yellow-400' :
              'text-green-400'
            }`} />
            <span className="text-sm font-medium">Abandono Temprano</span>
          </div>
          <p className="text-2xl font-bold">{earlyAbandonRate}%</p>
          <p className="text-xs text-muted-foreground mt-1">Salen en 0-3 segundos</p>
        </div>

        {/* Tiempo promedio */}
        <div className="p-4 rounded-xl border border-blue-500/50 bg-blue-500/10">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-medium">Tiempo Promedio</span>
          </div>
          <p className="text-2xl font-bold">{timeData.averageSeconds}s</p>
          <p className="text-xs text-muted-foreground mt-1">
            {timeData.averageSeconds < 30 ? 'Muy bajo' :
             timeData.averageSeconds < 60 ? 'Bajo' :
             timeData.averageSeconds < 180 ? 'Bueno' : 'Excelente'}
          </p>
        </div>

        {/* Engagement */}
        <div className={`p-4 rounded-xl border ${
          engagementRate > 40 ? 'border-green-500/50 bg-green-500/10' :
          engagementRate > 20 ? 'border-yellow-500/50 bg-yellow-500/10' :
          'border-red-500/50 bg-red-500/10'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className={`w-5 h-5 ${
              engagementRate > 40 ? 'text-green-400' :
              engagementRate > 20 ? 'text-yellow-400' :
              'text-red-400'
            }`} />
            <span className="text-sm font-medium">Engagement</span>
          </div>
          <p className="text-2xl font-bold">{engagementRate}%</p>
          <p className="text-xs text-muted-foreground mt-1">Más de 1 minuto</p>
        </div>
      </div>

      {/* Gráfico de barras */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartDataWithPercentage} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.3} />
            <XAxis
              dataKey="label"
              stroke="#888"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#888"
              style={{ fontSize: '12px' }}
              label={{ value: 'Usuarios', angle: -90, position: 'insideLeft', style: { fill: '#888' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="users" radius={[8, 8, 0, 0]}>
              {chartDataWithPercentage.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Alertas e insights */}
      {earlyAbandonRate > 50 && (
        <div className="mt-6 p-4 rounded-xl border border-red-500/50 bg-red-500/10">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-400 mb-1">Alto Abandono Temprano</h4>
              <p className="text-sm text-muted-foreground">
                Más del {earlyAbandonRate}% de usuarios abandonan en los primeros 3 segundos.
                Considera:
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                <li>Mejorar la velocidad de carga</li>
                <li>Clarificar el propósito en los primeros segundos</li>
                <li>Revisar el diseño inicial del landing</li>
                <li>Reducir elementos que distraen</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {engagementRate > 40 && (
        <div className="mt-6 p-4 rounded-xl border border-green-500/50 bg-green-500/10">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-green-400 mb-1">Excelente Engagement</h4>
              <p className="text-sm text-muted-foreground">
                {engagementRate}% de usuarios permanecen más de 1 minuto. ¡Sigue así!
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default TimeDistributionChart;
