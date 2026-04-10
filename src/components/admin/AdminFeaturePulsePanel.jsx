import React, { useEffect, useState } from 'react';
import { BarChart3, DoorOpen, MessageSquare, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { getFeaturePulseMetrics } from '@/services/adminFeaturePulseService';

const changeLabel = (current, previous) => {
  const safeCurrent = Number(current || 0);
  const safePrevious = Number(previous || 0);

  if (safePrevious === 0) {
    return safeCurrent > 0 ? '+100%' : '0%';
  }

  const delta = ((safeCurrent - safePrevious) / safePrevious) * 100;
  const prefix = delta > 0 ? '+' : '';
  return `${prefix}${delta.toFixed(1)}%`;
};

const iconByKey = {
  privado: MessageSquare,
  baul: DoorOpen,
  opin: Sparkles,
};

const AdminFeaturePulsePanel = () => {
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [data, setData] = useState({ days: 7, metrics: [], notes: {} });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const nextData = await getFeaturePulseMetrics(days);
        if (!cancelled) {
          setData(nextData);
        }
      } catch (error) {
        console.error('Error cargando panel de pulso de producto:', error);
        if (!cancelled) {
          toast({
            title: 'Error',
            description: 'No se pudo cargar el pulso de producto.',
            variant: 'destructive',
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [days, reloadKey]);

  return (
    <div className="glass-effect rounded-2xl border border-border p-6 space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-cyan-400" />
            Pulso de Producto
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Para ver si la sala empuja actividad hacia privado, Baúl y OPIN, y si esa actividad viene de gente nueva o recurrente.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-lg border border-border bg-background/60 p-1">
            {[7, 14].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setDays(value)}
                className={`rounded-md px-3 py-1.5 text-sm transition ${
                  days === value ? 'bg-cyan-500 text-white' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {value} días
              </button>
            ))}
          </div>

          <Button variant="outline" onClick={() => setReloadKey((current) => current + 1)} disabled={loading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Recargar
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-muted-foreground">Cargando actividad por producto...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            {data.metrics.map((metric) => {
              const Icon = iconByKey[metric.key] || BarChart3;

              return (
                <div key={metric.key} className="rounded-2xl border border-border bg-background/50 p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">{metric.description}</p>
                      <h3 className="mt-1 text-xl font-semibold flex items-center gap-2">
                        <Icon className="w-5 h-5 text-cyan-400" />
                        {metric.label}
                      </h3>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{metric.total}</div>
                      <div className="text-xs text-cyan-400">{changeLabel(metric.total, metric.previousTotal)}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-border/70 bg-background/60 p-3">
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Usuarios</div>
                      <div className="mt-1 text-lg font-semibold">{metric.uniqueUsers}</div>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-background/60 p-3">
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Nuevos</div>
                      <div className="mt-1 text-lg font-semibold text-emerald-400">{metric.nuevos}</div>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-background/60 p-3">
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Recurrentes</div>
                      <div className="mt-1 text-lg font-semibold text-cyan-400">{metric.recurrentes}</div>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>{metric.detail}</p>
                    <p>{metric.measurementNote}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl border border-border/60 bg-background/40 p-4 text-xs text-muted-foreground space-y-1">
            <p>{data.notes?.newVsRecurring}</p>
            <p>{data.notes?.guests}</p>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminFeaturePulsePanel;
