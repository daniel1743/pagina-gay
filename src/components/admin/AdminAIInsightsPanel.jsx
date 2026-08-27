import React, { useEffect, useState } from 'react';
import { AlertTriangle, Bot, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { generateAdminRoomHistoryReport } from '@/services/adminRoomHistoryService';
import {
  buildLocalChactivoAssistantInsight,
} from '@/services/chactivoAssistantService';

const ROOM_OPTIONS = [
  { value: 'principal', label: 'Sala Principal' },
  { value: 'santiago', label: 'Santiago' },
  { value: 'mas-30', label: 'Mas 30' },
  { value: 'amistad', label: 'Amistad' },
  { value: 'osos-activos', label: 'Osos Activos' },
  { value: 'pasivos-buscando', label: 'Pasivos Buscando' },
  { value: 'versatiles', label: 'Versatiles' },
  { value: 'quedar-ya', label: 'Quedar Ya' },
  { value: 'hablar-primero', label: 'Hablar Primero' },
  { value: 'morbosear', label: 'Morbosear' },
];

const METRIC_LABELS = [
  { key: 'totalMessages', label: 'Mensajes' },
  { key: 'uniqueUsers', label: 'Usuarios aprox.' },
  { key: 'messagesPerUser', label: 'Msgs/usuario' },
  { key: 'repeatedPhraseGroups', label: 'Frases repetidas' },
];

const SIGNAL_LABELS = [
  { key: 'minorRisk', label: 'Menor' },
  { key: 'contactEscape', label: 'Contacto externo' },
  { key: 'drugRisk', label: 'Drogas' },
  { key: 'violenceHate', label: 'Odio/violencia' },
  { key: 'fastIntent', label: 'Busqueda rapida' },
];

const WINDOW_OPTIONS = [
  { value: 'today', label: 'Solo hoy' },
  { value: '24h', label: 'Ultimas 24h' },
  { value: '7d', label: 'Ultimos 7 dias' },
];

function getWindowLabel(windowKey) {
  return WINDOW_OPTIONS.find((item) => item.value === windowKey)?.label || 'Ultimos 7 dias';
}

function extractTimestampMs(message) {
  if (message?.timestampIso) {
    const parsed = new Date(message.timestampIso).getTime();
    if (!Number.isNaN(parsed)) return parsed;
  }
  const fallback = Number(message?.createdAtMs || 0);
  return Number.isNaN(fallback) ? 0 : fallback;
}

function filterMessagesByWindow(messages = [], windowKey = '7d') {
  if (!Array.isArray(messages) || windowKey === '7d') return Array.isArray(messages) ? messages : [];

  const now = Date.now();
  let minTimestamp = 0;

  if (windowKey === '24h') {
    minTimestamp = now - 24 * 60 * 60 * 1000;
  } else if (windowKey === 'today') {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    minTimestamp = start.getTime();
  }

  return messages.filter((message) => extractTimestampMs(message) >= minTimestamp);
}

function RiskBadge({ level }) {
  const normalized = String(level || 'medium').toLowerCase();
  const className =
    normalized === 'critical'
      ? 'border-red-500/40 bg-red-500/10 text-red-300'
      : normalized === 'high'
        ? 'border-orange-500/40 bg-orange-500/10 text-orange-300'
        : normalized === 'low'
          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
          : 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300';

  return (
    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold uppercase tracking-wide ${className}`}>
      {normalized}
    </span>
  );
}

function SectionList({ title, items, emptyText, renderItem }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-4">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      {Array.isArray(items) && items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={`${title}-${index}`} className="rounded-lg border border-border/60 bg-background/50 p-3">
              {renderItem(item)}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      )}
    </div>
  );
}

export default function AdminAIInsightsPanel({
  analyticsStats,
  yesterdayStats,
  reportStats,
  ticketStats,
  sanctionStats,
  mostUsedFeatures,
  exitPages,
}) {
  const [selectedRoom, setSelectedRoom] = useState('principal');
  const [selectedWindow, setSelectedWindow] = useState('today');
  const [localInsight, setLocalInsight] = useState(null);
  const [loadingLocal, setLoadingLocal] = useState(false);


  useEffect(() => {
    setLocalInsight(null);
  }, [selectedRoom, selectedWindow]);

  const buildLocalInsight = async () => {
    setLoadingLocal(true);
    try {
      const report = await generateAdminRoomHistoryReport(selectedRoom, 7);
      const filteredReport = {
        ...report,
        messages: filterMessagesByWindow(report?.messages, selectedWindow),
      };
      const nextInsight = buildLocalChactivoAssistantInsight({
        roomId: selectedRoom,
        windowKey: selectedWindow,
        windowLabel: getWindowLabel(selectedWindow),
        report: filteredReport,
        analyticsStats,
        yesterdayStats,
        reportStats,
        ticketStats,
        sanctionStats,
        mostUsedFeatures,
        exitPages,
      });
      setLocalInsight(nextInsight);
        return nextInsight;
    } catch (error) {
      console.error('Error generando resumen local admin IA:', error);
      toast({
        title: 'No se pudo analizar la sala',
        description: error?.message || 'Fallo la carga del contexto base.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoadingLocal(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-effect rounded-2xl border border-border p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <h2 className="flex items-center gap-2 text-2xl font-bold">
              <Bot className="h-6 w-6 text-cyan-400" />
              Chactivo Assistant
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Analisis admin bajo demanda. No escucha en tiempo real, no corre solo y no manda el historial completo al modelo.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Modo local: resume una ventana corta sin enviar el historial a proveedores externos.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-background/40 px-4 py-3 text-sm">
            <div className="font-semibold">Estado del análisis</div>
            <div className="text-emerald-300">Modo local disponible</div>
            <div className="mt-2 text-xs text-muted-foreground">
              No se envían mensajes ni claves a proveedores externos.
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[220px_220px_1fr]">
          <div>
            <label className="mb-2 block text-sm font-medium text-muted-foreground">Sala</label>
            <select
              value={selectedRoom}
              onChange={(event) => setSelectedRoom(event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {ROOM_OPTIONS.map((room) => (
                <option key={room.value} value={room.value}>
                  {room.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-muted-foreground">Ventana</label>
            <select
              value={selectedWindow}
              onChange={(event) => setSelectedWindow(event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {WINDOW_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={buildLocalInsight} disabled={loadingLocal} className="gap-2">
            {loadingLocal ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Resumen local
          </Button>

        </div>
      </div>

      {localInsight && (
        <div className="glass-effect rounded-2xl border border-border p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold">Lectura local</h3>
              <p className="mt-1 text-sm text-muted-foreground">{localInsight.summary}</p>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <div>Sala: {localInsight.roomId}</div>
              <div>Ventana: {localInsight.windowLabel}</div>
              <div>Fuente: analisis local</div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {METRIC_LABELS.map((metric) => (
              <div key={metric.key} className="rounded-xl border border-border bg-background/40 p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">{metric.label}</div>
                <div className="mt-2 text-2xl font-bold">{localInsight.metrics?.[metric.key] ?? 0}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-5">
            {SIGNAL_LABELS.map((signal) => (
              <div key={signal.key} className="rounded-xl border border-border bg-background/40 p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">{signal.label}</div>
                <div className="mt-2 text-xl font-bold">{localInsight.signalCounters?.[signal.key] ?? 0}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            <SectionList
              title="Hallazgos"
              items={localInsight.topFindings}
              emptyText="Sin hallazgos destacados."
              renderItem={(item) => <p className="text-sm leading-6">{item}</p>}
            />

            <SectionList
              title="Riesgos"
              items={localInsight.risks}
              emptyText="Sin riesgos destacados."
              renderItem={(risk) => (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold">{risk.title}</div>
                    <RiskBadge level={risk.level} />
                  </div>
                  <p className="text-sm text-muted-foreground">{risk.detail}</p>
                </div>
              )}
            />

            <SectionList
              title="Oportunidades"
              items={localInsight.opportunities}
              emptyText="Sin oportunidades destacadas."
              renderItem={(item) => (
                <div className="space-y-2">
                  <div className="font-semibold">{item.title}</div>
                  <p className="text-sm text-muted-foreground">{item.detail}</p>
                </div>
              )}
            />

            <SectionList
              title="Siguientes pasos"
              items={localInsight.nextActions}
              emptyText="Sin acciones propuestas."
              renderItem={(item) => <p className="text-sm leading-6">{item}</p>}
            />
          </div>

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            <SectionList
              title="Comunas dominantes"
              items={localInsight.topComunas}
              emptyText="Sin comunas dominantes en la muestra."
              renderItem={(item) => (
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span>{item.comuna}</span>
                  <span className="font-semibold">{item.count}</span>
                </div>
              )}
            />

            <SectionList
              title="Frases repetidas"
              items={localInsight.repeatedPhrases}
              emptyText="Sin repeticion dominante."
              renderItem={(item) => (
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate">{item.text}</span>
                  <span className="font-semibold">x{item.count}</span>
                </div>
              )}
            />
          </div>

          <div className="mt-6 rounded-xl border border-border bg-background/40 p-4">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-300" />
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Muestras representativas enviables a IA</h3>
            </div>
            {localInsight.riskySamples?.length > 0 ? (
              <div className="space-y-3">
                {localInsight.riskySamples.map((sample) => (
                  <div key={sample.id || `${sample.username}-${sample.content}`} className="rounded-lg border border-border/60 bg-background/50 p-3 text-sm">
                    <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">{sample.tags.join(', ')}</div>
                    <div>{sample.content}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hubo muestras riesgosas relevantes en esta corrida.</p>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
