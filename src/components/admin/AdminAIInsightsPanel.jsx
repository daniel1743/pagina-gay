import React, { useEffect, useState } from 'react';
import { AlertTriangle, Bot, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { generateAdminRoomHistoryReport } from '@/services/adminRoomHistoryService';
import {
  buildLocalChactivoAssistantInsight,
  generateChactivoAssistantInsight,
  isChactivoAssistantAvailable,
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

const DAILY_REMOTE_ANALYSIS_LIMIT = 4;
const BUDGET_STORAGE_KEY = 'chactivo_assistant_daily_budget_v1';

function getBudgetDateKey() {
  return new Date().toISOString().slice(0, 10);
}

function readDailyBudgetUsage() {
  try {
    const raw = window.localStorage.getItem(BUDGET_STORAGE_KEY);
    if (!raw) return { dateKey: getBudgetDateKey(), used: 0 };
    const parsed = JSON.parse(raw);
    if (parsed?.dateKey !== getBudgetDateKey()) {
      return { dateKey: getBudgetDateKey(), used: 0 };
    }
    return {
      dateKey: getBudgetDateKey(),
      used: Number.isFinite(Number(parsed?.used)) ? Number(parsed.used) : 0,
    };
  } catch {
    return { dateKey: getBudgetDateKey(), used: 0 };
  }
}

function writeDailyBudgetUsage(used) {
  window.localStorage.setItem(
    BUDGET_STORAGE_KEY,
    JSON.stringify({
      dateKey: getBudgetDateKey(),
      used,
    })
  );
}

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
  const [question, setQuestion] = useState('');
  const [localInsight, setLocalInsight] = useState(null);
  const [assistantInsight, setAssistantInsight] = useState(null);
  const [loadingLocal, setLoadingLocal] = useState(false);
  const [loadingAssistant, setLoadingAssistant] = useState(false);
  const [dailyBudgetUsed, setDailyBudgetUsed] = useState(() => readDailyBudgetUsage().used);

  const assistantAvailable = isChactivoAssistantAvailable();
  const dailyBudgetRemaining = Math.max(DAILY_REMOTE_ANALYSIS_LIMIT - dailyBudgetUsed, 0);

  useEffect(() => {
    setLocalInsight(null);
    setAssistantInsight(null);
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
      setAssistantInsight(null);
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

  const handleAssistantAnalysis = async () => {
    setLoadingAssistant(true);
    try {
      const insightBase =
        localInsight && localInsight.roomId === selectedRoom && localInsight.windowKey === selectedWindow
          ? localInsight
          : await buildLocalInsight();

      if (!insightBase) return;

      if (!assistantAvailable) {
        toast({
          title: 'DeepSeek no esta activo',
          description: 'Se dejo disponible el resumen local. La consulta remota no puede ejecutarse desde este frontend.',
          variant: 'destructive',
        });
        return;
      }

      if (dailyBudgetRemaining <= 0) {
        toast({
          title: 'Cupo diario agotado',
          description: `Ya usaste ${DAILY_REMOTE_ANALYSIS_LIMIT} consultas remotas hoy. Puedes seguir usando el resumen local sin costo IA.`,
          variant: 'destructive',
        });
        return;
      }

      const nextAssistantInsight = await generateChactivoAssistantInsight({
        roomId: selectedRoom,
        compactContext: insightBase.compactContext,
        question,
      });
      setAssistantInsight(nextAssistantInsight);
      const nextUsed = dailyBudgetUsed + 1;
      writeDailyBudgetUsage(nextUsed);
      setDailyBudgetUsed(nextUsed);
    } catch (error) {
      console.error('Error consultando Chactivo Assistant:', error);
      toast({
        title: 'No se pudo consultar a Chactivo Assistant',
        description: error?.message || 'Fallo la llamada a DeepSeek.',
        variant: 'destructive',
      });
    } finally {
      setLoadingAssistant(false);
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
              Modo economico: primero resume localmente la ventana corta y solo consulta DeepSeek cuando tu lo pides.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-background/40 px-4 py-3 text-sm">
            <div className="font-semibold">Estado IA remota</div>
            <div className={assistantAvailable ? 'text-emerald-300' : 'text-yellow-300'}>
              {assistantAvailable ? 'DeepSeek disponible en frontend' : 'Sin DeepSeek activo en frontend'}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Cupo remoto hoy: {dailyBudgetRemaining}/{DAILY_REMOTE_ANALYSIS_LIMIT}
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

          <div>
            <label className="mb-2 block text-sm font-medium text-muted-foreground">Pregunta puntual para la IA</label>
            <Textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ejemplo: como estuvo la sala hoy, que fallo y que debo corregir primero sin gastar mucho."
              className="min-h-[96px]"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={buildLocalInsight} disabled={loadingLocal || loadingAssistant} className="gap-2">
            {loadingLocal ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Resumen local
          </Button>

          <Button
            onClick={handleAssistantAnalysis}
            disabled={loadingLocal || loadingAssistant || dailyBudgetRemaining <= 0}
            variant="outline"
            className="gap-2"
          >
            {loadingAssistant ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Preguntar a Chactivo Assistant
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

      {assistantInsight && (
        <div className="glass-effect rounded-2xl border border-cyan-500/30 p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold">Respuesta de Chactivo Assistant</h3>
              <p className="mt-1 text-sm text-muted-foreground">{assistantInsight.summary}</p>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Health score</div>
              <div className="text-2xl font-bold text-cyan-300">{assistantInsight.healthScore ?? '-'}</div>
            </div>
          </div>

          <div className="mb-6 rounded-xl border border-border bg-background/40 p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Estado estimado</div>
            <div className="mt-2 text-lg font-semibold capitalize">{assistantInsight.state || 'mixed'}</div>
            {assistantInsight.answerToQuestion ? <p className="mt-3 text-sm leading-6">{assistantInsight.answerToQuestion}</p> : null}
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <SectionList
              title="Hallazgos IA"
              items={assistantInsight.topFindings}
              emptyText="Sin hallazgos devueltos por IA."
              renderItem={(item) => <p className="text-sm leading-6">{item}</p>}
            />

            <SectionList
              title="Riesgos IA"
              items={assistantInsight.risks}
              emptyText="Sin riesgos devueltos por IA."
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
              title="Oportunidades IA"
              items={assistantInsight.opportunities}
              emptyText="Sin oportunidades devueltas por IA."
              renderItem={(item) => (
                <div className="space-y-2">
                  <div className="font-semibold">{item.title}</div>
                  <p className="text-sm text-muted-foreground">{item.detail}</p>
                </div>
              )}
            />

            <SectionList
              title="Acciones propuestas IA"
              items={assistantInsight.nextActions}
              emptyText="Sin acciones devueltas por IA."
              renderItem={(item) => <p className="text-sm leading-6">{item}</p>}
            />
          </div>
        </div>
      )}
    </div>
  );
}
