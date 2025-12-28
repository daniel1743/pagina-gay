import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { TrendingUp, ExternalLink, Search, Share2, Mail, Globe } from 'lucide-react';
import { getTrafficSources } from '@/services/analyticsService';

/**
 * Gráfico de fuentes de tráfico (UTMs)
 * Muestra de dónde vienen los usuarios
 */
export const TrafficSourcesChart = () => {
  const [trafficData, setTrafficData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrafficSources();
  }, []);

  const loadTrafficSources = async () => {
    try {
      const data = await getTrafficSources();
      setTrafficData(data);
    } catch (error) {
      console.error('Error loading traffic sources:', error);
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

  if (!trafficData || trafficData.totalUsers === 0) {
    return (
      <div className="glass-effect p-6 rounded-2xl border border-primary/30 text-center">
        <Globe className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">No hay datos de fuentes de tráfico aún</p>
        <p className="text-xs text-muted-foreground mt-2">
          Asegúrate de agregar parámetros UTM a tus enlaces de marketing
        </p>
      </div>
    );
  }

  // Iconos para cada fuente
  const sourceIcons = {
    'google': Search,
    'facebook': Share2,
    'instagram': Share2,
    'twitter': Share2,
    'email': Mail,
    'direct': Globe,
    'other': ExternalLink,
  };

  // Colores para el gráfico de pastel
  const COLORS = {
    'google': '#4285F4',
    'facebook': '#1877F2',
    'instagram': '#E4405F',
    'twitter': '#1DA1F2',
    'email': '#EA4335',
    'direct': '#34A853',
    'other': '#FBBC05',
  };

  // Preparar datos para el gráfico
  const chartData = Object.entries(trafficData.sources).map(([source, count]) => ({
    name: source.charAt(0).toUpperCase() + source.slice(1),
    value: count,
    percentage: ((count / trafficData.totalUsers) * 100).toFixed(1),
    color: COLORS[source] || COLORS.other,
  })).sort((a, b) => b.value - a.value);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-primary/30 rounded-lg p-3 shadow-xl">
          <p className="font-semibold mb-1">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.value} usuarios ({data.payload.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }) => {
    if (parseFloat(percentage) < 5) return null; // No mostrar si es menos del 5%

    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {percentage}%
      </text>
    );
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
            <TrendingUp className="w-6 h-6 text-purple-400" />
            Fuentes de Tráfico
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            De dónde vienen tus usuarios hoy
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{trafficData.totalUsers}</p>
          <p className="text-xs text-muted-foreground">usuarios rastreados</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de pastel */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Lista de fuentes */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-muted-foreground mb-4">Detalle por Fuente</h4>
          {chartData.map((source, index) => {
            const IconComponent = sourceIcons[source.name.toLowerCase()] || ExternalLink;
            return (
              <motion.div
                key={source.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 rounded-lg border border-primary/20 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${source.color}20` }}
                  >
                    <IconComponent className="w-5 h-5" style={{ color: source.color }} />
                  </div>
                  <div>
                    <p className="font-semibold">{source.name}</p>
                    <p className="text-xs text-muted-foreground">{source.value} usuarios</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold" style={{ color: source.color }}>
                    {source.percentage}%
                  </p>
                  {/* Barra de progreso */}
                  <div className="w-24 h-1.5 bg-background/50 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${source.percentage}%`,
                        backgroundColor: source.color
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Top campaigns si existen */}
      {trafficData.campaigns && Object.keys(trafficData.campaigns).length > 0 && (
        <div className="mt-6 pt-6 border-t border-primary/20">
          <h4 className="font-semibold text-sm text-muted-foreground mb-3">Campañas Más Exitosas</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(trafficData.campaigns)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 6)
              .map(([campaign, count], index) => (
                <div
                  key={campaign}
                  className="p-3 rounded-lg border border-primary/20 bg-primary/5"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate flex-1">{campaign}</p>
                    <span className="ml-2 text-lg font-bold text-primary">{count}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {((count / trafficData.totalUsers) * 100).toFixed(1)}% del tráfico
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Consejos para tracking */}
      {chartData.find(s => s.name.toLowerCase() === 'direct')?.percentage > 70 && (
        <div className="mt-6 p-4 rounded-xl border border-yellow-500/50 bg-yellow-500/10">
          <div className="flex items-start gap-3">
            <ExternalLink className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-400 mb-1">Mejora tu Tracking</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Más del 70% de tu tráfico aparece como "Direct". Esto puede significar:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Los usuarios escriben directamente la URL</li>
                <li>Falta agregar parámetros UTM a tus campañas</li>
                <li>El tracking no está capturando correctamente las fuentes</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-3">
                💡 Agrega parámetros UTM a tus enlaces: <code className="bg-background/50 px-2 py-1 rounded">?utm_source=facebook&utm_campaign=diciembre</code>
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default TrafficSourcesChart;
