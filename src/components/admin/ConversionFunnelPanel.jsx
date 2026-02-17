import React from 'react';
import { Filter, TrendingUp } from 'lucide-react';

const formatPercent = (value = 0) => `${Number(value || 0).toFixed(1)}%`;

const ConversionFunnelPanel = ({ funnelMetrics }) => {
  const steps = funnelMetrics?.steps || [];
  const overall = funnelMetrics?.overallConversion || 0;
  const days = funnelMetrics?.days || 7;
  const maxCount = steps.length > 0 ? Math.max(...steps.map((s) => s.count || 0), 1) : 1;

  return (
    <div className="glass-effect rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Filter className="w-6 h-6 text-cyan-400" />
            Embudo de Conversión ({days} días)
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Seguimiento por sesión desde entrada hasta primer mensaje.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Conversión total</p>
          <p className="text-2xl font-bold text-cyan-400">{formatPercent(overall)}</p>
        </div>
      </div>

      {steps.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No hay eventos suficientes para construir el embudo aún.
        </p>
      ) : (
        <div className="space-y-3">
          {steps.map((step, idx) => {
            const barWidth = `${Math.max(6, ((step.count || 0) / maxCount) * 100)}%`;
            return (
              <div key={step.key} className="rounded-xl border border-border/60 bg-background/40 p-3">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-6">#{idx + 1}</span>
                    <span className="text-sm font-medium">{step.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-foreground">{step.count}</span>
                    {idx > 0 && (
                      <span className="ml-2 text-xs text-cyan-400">
                        {formatPercent(step.conversionFromPrev)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                    style={{ width: barWidth }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <TrendingUp className="w-3.5 h-3.5" />
        Si una etapa cae fuerte, ahí está la fricción principal a optimizar.
      </div>
    </div>
  );
};

export default ConversionFunnelPanel;
