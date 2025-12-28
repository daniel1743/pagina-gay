import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

/**
 * Gráfico de líneas para mostrar tendencias
 */
export const TrendLineChart = ({ data, dataKeys, colors, title }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No hay datos disponibles
      </div>
    );
  }

  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            {dataKeys.map((key, index) => (
              <linearGradient key={key.key} id={`color${key.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors[index]} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={colors[index]} stopOpacity={0.1}/>
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.3} />
          <XAxis
            dataKey="date"
            stroke="#888"
            tick={{ fill: '#888', fontSize: 12 }}
            tickFormatter={(value) => {
              const date = new Date(value);
              return `${date.getDate()}/${date.getMonth() + 1}`;
            }}
          />
          <YAxis
            stroke="#888"
            tick={{ fill: '#888', fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#fff'
            }}
            labelFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
            }}
          />
          <Legend
            wrapperStyle={{ color: '#888' }}
          />
          {dataKeys.map((key, index) => (
            <Area
              key={key.key}
              type="monotone"
              dataKey={key.key}
              name={key.name}
              stroke={colors[index]}
              strokeWidth={2}
              fill={`url(#color${key.key})`}
              activeDot={{ r: 6 }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Gráfico de barras comparativo
 */
export const ComparisonBarChart = ({ data, dataKeys, colors, title }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No hay datos disponibles
      </div>
    );
  }

  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.3} />
          <XAxis
            dataKey="date"
            stroke="#888"
            tick={{ fill: '#888', fontSize: 12 }}
            tickFormatter={(value) => {
              const date = new Date(value);
              return `${date.getDate()}/${date.getMonth() + 1}`;
            }}
          />
          <YAxis
            stroke="#888"
            tick={{ fill: '#888', fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#fff'
            }}
            labelFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
            }}
          />
          <Legend
            wrapperStyle={{ color: '#888' }}
          />
          {dataKeys.map((key, index) => (
            <Bar
              key={key.key}
              dataKey={key.key}
              name={key.name}
              fill={colors[index]}
              radius={[8, 8, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Mini gráfico de tendencia (sparkline) para mostrar dentro de cards
 */
export const MiniTrendChart = ({ data, color = '#8884d8' }) => {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

/**
 * Componente de KPI con tendencia
 */
export const KPICard = ({
  icon: Icon,
  value,
  label,
  change,
  changeLabel = 'vs ayer',
  color = 'blue',
  trendData = []
}) => {
  const isPositive = change >= 0;
  const colorClasses = {
    blue: 'border-blue-500/30 text-blue-400',
    green: 'border-green-500/30 text-green-400',
    purple: 'border-purple-500/30 text-purple-400',
    cyan: 'border-cyan-500/30 text-cyan-400',
    yellow: 'border-yellow-500/30 text-yellow-400',
    red: 'border-red-500/30 text-red-400',
    orange: 'border-orange-500/30 text-orange-400',
  };

  const trendColors = {
    blue: '#60a5fa',
    green: '#4ade80',
    purple: '#c084fc',
    cyan: '#22d3ee',
    yellow: '#facc15',
    red: '#f87171',
    orange: '#fb923c',
  };

  return (
    <div className={`glass-effect p-6 rounded-2xl border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-8 h-8 ${colorClasses[color].split(' ')[1]}`} />
        {isPositive ? (
          <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
          </svg>
        ) : change !== 0 ? (
          <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        )}
      </div>

      <h3 className="text-3xl font-bold mb-1">{value}</h3>
      <p className="text-sm text-muted-foreground mb-2">{label}</p>

      {change !== undefined && (
        <div className="flex items-center gap-2 text-sm">
          <span className={`font-medium ${isPositive ? 'text-green-400' : change !== 0 ? 'text-red-400' : 'text-gray-400'}`}>
            {isPositive && '+'}{change.toFixed(1)}%
          </span>
          <span className="text-muted-foreground text-xs">{changeLabel}</span>
        </div>
      )}

      {trendData.length > 0 && (
        <div className="mt-3 -mb-2">
          <MiniTrendChart data={trendData} color={trendColors[color]} />
        </div>
      )}
    </div>
  );
};

export default { TrendLineChart, ComparisonBarChart, MiniTrendChart, KPICard };
