import { startAITrace, finishAITrace, failAITrace } from '@/utils/runtimeDiagnostics';

const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;
const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = import.meta.env.VITE_DEEPSEEK_MODEL || 'deepseek-chat';

const CONTACT_ESCAPE_REGEX = /\b(whatsapp|wsp|wapp|telegram|signal|discord|instagram|ig\b|teams|gmail|hotmail|outlook|correo|numero|n[uú]mero|celu|celular)\b|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const MINOR_RISK_REGEX = /\b(soy menor|menor de edad|tengo\s*(1[0-7])\b|(1[0-7])\s*a[nñ]os\b|31 al rev[eé]s|-8 a[nñ]os)\b/i;
const DRUG_RISK_REGEX = /\b(droga|drogas|tusi|coca|cocaina|coca[ií]na|mota|porro|saque|poppers?|ketamina)\b/i;
const VIOLENCE_HATE_REGEX = /\b(matar|matarte|pegar|golpear|apu[nñ]alar|odio|nazi|violar)\b/i;
const FAST_INTENT_REGEX = /\b(lugar|sitio|ahora|ya|activo|pasivo|versatil|vers[aá]til|foto|fotos|videollamada|llamada|privado|interno|comuna|cerca)\b/i;

function normalizeContent(value = '') {
  return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function preview(value = '', maxLength = 140) {
  const normalized = String(value || '').replace(/\s+/g, ' ').trim();
  if (!normalized) return '[sin contenido]';
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1)}...` : normalized;
}

function uniqueUsers(messages = []) {
  return new Set(messages.map((message) => message.userId || `guest:${message.username || 'anon'}`)).size;
}

function topComunas(messages = []) {
  const counts = new Map();
  messages.forEach((message) => {
    const comuna = String(message.comuna || '').trim();
    if (!comuna) return;
    counts.set(comuna, (counts.get(comuna) || 0) + 1);
  });
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([comuna, count]) => ({ comuna, count }));
}

function repeatedPhrases(messages = []) {
  const counts = new Map();
  messages.forEach((message) => {
    if (message.type === 'image') return;
    const content = normalizeContent(message.content);
    if (!content || content.length < 3) return;
    counts.set(content, (counts.get(content) || 0) + 1);
  });
  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([text, count]) => ({ text: preview(text, 80), count }));
}

function collectSignals(messages = []) {
  const counters = {
    contactEscape: 0,
    minorRisk: 0,
    drugRisk: 0,
    violenceHate: 0,
    fastIntent: 0,
  };
  const riskySamples = [];

  messages.forEach((message) => {
    const content = String(message.content || '');
    const tags = [];
    if (CONTACT_ESCAPE_REGEX.test(content)) {
      counters.contactEscape += 1;
      tags.push('contacto_externo');
    }
    if (MINOR_RISK_REGEX.test(content)) {
      counters.minorRisk += 1;
      tags.push('menor_riesgo');
    }
    if (DRUG_RISK_REGEX.test(content)) {
      counters.drugRisk += 1;
      tags.push('drogas');
    }
    if (VIOLENCE_HATE_REGEX.test(content)) {
      counters.violenceHate += 1;
      tags.push('odio_violencia');
    }
    if (FAST_INTENT_REGEX.test(content)) {
      counters.fastIntent += 1;
      tags.push('intencion_rapida');
    }
    if (tags.length > 0) {
      riskySamples.push({
        id: message.id,
        username: message.username || 'Usuario',
        comuna: message.comuna || null,
        content: preview(content),
        tags,
      });
    }
  });

  return { counters, riskySamples: riskySamples.slice(-12) };
}

function buildActivityLevel(totalMessages, totalUsers) {
  if (totalMessages >= 120 && totalUsers >= 35) return 'alta';
  if (totalMessages >= 40 && totalUsers >= 15) return 'media';
  return 'baja';
}

function jsonFence(value = '') {
  return String(value || '').replace(/```json/gi, '').replace(/```/g, '').trim();
}

export function isChactivoAssistantAvailable() {
  return Boolean(DEEPSEEK_API_KEY);
}

export function buildLocalChactivoAssistantInsight({
  roomId = 'principal',
  windowKey = '7d',
  windowLabel = 'ultimos 7 dias disponibles',
  report,
  analyticsStats = {},
  yesterdayStats = {},
  reportStats = {},
  ticketStats = {},
  sanctionStats = {},
  mostUsedFeatures = [],
  exitPages = [],
}) {
  const messages = Array.isArray(report?.messages) ? report.messages : [];
  const totalUsers = uniqueUsers(messages);
  const repeats = repeatedPhrases(messages);
  const comunas = topComunas(messages);
  const { counters, riskySamples } = collectSignals(messages);
  const activityLevel = buildActivityLevel(messages.length, totalUsers);
  const metrics = {
    totalMessages: messages.length,
    uniqueUsers: totalUsers,
    repeatedPhraseGroups: repeats.length,
    messagesPerUser: totalUsers > 0 ? Number((messages.length / totalUsers).toFixed(2)) : 0,
    activityLevel,
  };

  const topFindings = [];
  topFindings.push(`La sala ${roomId} muestra actividad ${activityLevel} con ${messages.length} mensajes y ${totalUsers} usuarios unicos aproximados.`);
  if (comunas.length > 0) topFindings.push(`La geografia sigue pesando. Comunas dominantes: ${comunas.map((item) => `${item.comuna} (${item.count})`).join(', ')}.`);
  if (repeats.length > 0) topFindings.push(`Hay repeticion visible. Frases dominantes: ${repeats.slice(0, 3).map((item) => `"${item.text}" x${item.count}`).join(', ')}.`);
  if (mostUsedFeatures.length > 0) topFindings.push(`En analytics cargados, destacan: ${mostUsedFeatures.slice(0, 3).map((item) => `${item.eventType} (${item.count})`).join(', ')}.`);

  const risks = [];
  if (counters.minorRisk > 0) risks.push({ level: 'critical', title: 'Riesgo de menores', detail: `Se detectaron ${counters.minorRisk} mensajes con patrones de menor o evasiones similares.` });
  if (counters.contactEscape > 0) risks.push({ level: counters.contactEscape >= 4 ? 'high' : 'medium', title: 'Fuga a canales externos', detail: `Se detectaron ${counters.contactEscape} intentos de mover la conversacion fuera de Chactivo.` });
  if (counters.drugRisk > 0) risks.push({ level: counters.drugRisk >= 2 ? 'high' : 'medium', title: 'Menciones de drogas', detail: `Se detectaron ${counters.drugRisk} mensajes con lenguaje asociado a sustancias.` });
  if (counters.violenceHate > 0) risks.push({ level: counters.violenceHate >= 2 ? 'high' : 'medium', title: 'Odio o violencia', detail: `Se detectaron ${counters.violenceHate} mensajes con lenguaje de riesgo.` });
  if (risks.length === 0) risks.push({ level: 'low', title: 'Sin alertas rojas en esta corrida', detail: 'La muestra resumida no disparo señales criticas, aunque no reemplaza revision humana.' });

  const opportunities = [];
  if (comunas.length > 0) opportunities.push({ title: 'Matching por zona', detail: 'Conviene priorizar filtros o bloques por comuna antes que seguir dejando todo mezclado.' });
  if (counters.fastIntent > 0) opportunities.push({ title: 'Matching por intencion', detail: 'La sala muestra busqueda de rol, lugar, foto o privado. Eso se puede ordenar con atajos simples.' });
  if (repeats.length > 0) opportunities.push({ title: 'Reducir ruido repetido', detail: 'Hay mensajes muy calcados. Rate limit + empuje a privado puede subir calidad sin romper UX.' });
  if ((analyticsStats?.pageExits || 0) > 0 && exitPages.length > 0) opportunities.push({ title: 'Corregir abandono', detail: `Revisar primero salidas en: ${exitPages.slice(0, 3).map((item) => item.pagePath || item.page || 'ruta').join(', ')}.` });

  const nextActions = [];
  if (counters.minorRisk > 0) nextActions.push('Poner a prioridad maxima el blindaje de menores en ingreso y sala.');
  if (counters.contactEscape > 0) nextActions.push('Endurecer bloqueo de WhatsApp, Telegram, correos y otros canales externos.');
  if (comunas.length > 0) nextActions.push('Probar un modulo ligero de "cerca de ti" o filtros por comuna.');
  if (repeats.length > 0) nextActions.push('Ajustar anti-spam por repeticion y sugerir privado interno.');
  nextActions.push('Mantener IA bajo demanda: no procesar cada mensaje ni dejar esto en tiempo real.');

  const compactContext = [
    `Sala: ${roomId}`,
    `Ventana: ${windowLabel}`,
    `Mensajes: ${metrics.totalMessages}`,
    `Usuarios unicos aprox: ${metrics.uniqueUsers}`,
    `Actividad: ${metrics.activityLevel}`,
    `Msgs/usuario aprox: ${metrics.messagesPerUser}`,
    `Contacto externo: ${counters.contactEscape}`,
    `Menor: ${counters.minorRisk}`,
    `Drogas: ${counters.drugRisk}`,
    `Odio/violencia: ${counters.violenceHate}`,
    `Busqueda rapida: ${counters.fastIntent}`,
    `Comunas: ${comunas.length ? comunas.map((item) => `${item.comuna}:${item.count}`).join(', ') : 'sin dato fuerte'}`,
    `Frases repetidas: ${repeats.length ? repeats.map((item) => `${item.text} x${item.count}`).join(' | ') : 'sin repeticion dominante'}`,
    `Analytics hoy: views=${analyticsStats?.pageViews || 0}, registros=${analyticsStats?.registrations || 0}, logins=${analyticsStats?.logins || 0}, mensajes=${analyticsStats?.messagesSent || 0}, exits=${analyticsStats?.pageExits || 0}`,
    `Analytics ayer: views=${yesterdayStats?.pageViews || 0}, registros=${yesterdayStats?.registrations || 0}, logins=${yesterdayStats?.logins || 0}, mensajes=${yesterdayStats?.messagesSent || 0}, exits=${yesterdayStats?.pageExits || 0}`,
    `Reportes pendientes=${reportStats?.pendingReports || 0}, tickets abiertos=${ticketStats?.openTickets || 0}, sanciones activas=${sanctionStats?.active || 0}`,
    `Features: ${mostUsedFeatures.slice(0, 5).map((item) => `${item.eventType}:${item.count}`).join(', ') || 'sin dato'}`,
    `Paginas salida: ${exitPages.slice(0, 5).map((item) => item.pagePath || item.page || 'ruta').join(', ') || 'sin dato'}`,
    'Muestras:',
    ...(riskySamples.length ? riskySamples.map((sample) => `- [${sample.tags.join(',')}] ${sample.content}`) : ['- Sin muestras riesgosas destacadas.']),
  ].join('\n');

  return {
    source: 'local',
    generatedAtIso: new Date().toISOString(),
    roomId,
    windowKey,
    windowLabel,
    summary: `La sala ${roomId} en ventana ${windowLabel} esta en actividad ${activityLevel}. Se observaron ${messages.length} mensajes y ${totalUsers} usuarios unicos aproximados.`,
    metrics,
    signalCounters: counters,
    topComunas: comunas,
    repeatedPhrases: repeats,
    riskySamples,
    topFindings,
    risks,
    opportunities,
    nextActions,
    compactContext,
  };
}

export async function generateChactivoAssistantInsight({ roomId = 'principal', compactContext, question = '' }) {
  if (!DEEPSEEK_API_KEY) throw new Error('DeepSeek no esta configurado en el frontend.');
  const traceId = startAITrace({
    source: 'chactivo_assistant',
    provider: 'deepseek',
    action: 'generate_insight',
    meta: { roomId },
  });

  const systemPrompt = 'Eres Chactivo Assistant. Analizas salud operativa de una sala de chat para admin. Responde solo JSON valido con esquema {"summary":"","state":"active|mixed|fragile","healthScore":0-100,"topFindings":[""],"risks":[{"level":"critical|high|medium|low","title":"","detail":""}],"opportunities":[{"title":"","detail":""}],"nextActions":[""],"answerToQuestion":""}. No inventes datos ni propongas infraestructura cara.';
  const userPrompt = ['Analiza este contexto resumido de Chactivo.', question ? `Pregunta puntual del admin: ${question}` : 'Pregunta puntual del admin: como estuvo la sala y que corregir primero.', '', compactContext].join('\n');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 900,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`DeepSeek respondio ${response.status}`);

    const data = await response.json();
    const parsed = JSON.parse(jsonFence(data?.choices?.[0]?.message?.content || ''));
    finishAITrace(traceId, {
      summary: `Assistant respondió para ${roomId}`,
      meta: { state: parsed?.state || 'mixed' },
    });
    return {
      source: 'deepseek',
      generatedAtIso: new Date().toISOString(),
      roomId: parsed.roomId || roomId,
      summary: String(parsed.summary || 'No hubo resumen util del modelo.'),
      state: String(parsed.state || 'mixed'),
      healthScore: Number.isFinite(Number(parsed.healthScore)) ? Number(parsed.healthScore) : null,
      topFindings: Array.isArray(parsed.topFindings) ? parsed.topFindings.slice(0, 5).map(String) : [],
      risks: Array.isArray(parsed.risks) ? parsed.risks.slice(0, 5).map((risk) => ({ level: String(risk?.level || 'medium'), title: String(risk?.title || 'Riesgo'), detail: String(risk?.detail || '') })) : [],
      opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities.slice(0, 5).map((item) => ({ title: String(item?.title || 'Oportunidad'), detail: String(item?.detail || '') })) : [],
      nextActions: Array.isArray(parsed.nextActions) ? parsed.nextActions.slice(0, 6).map(String) : [],
      answerToQuestion: String(parsed.answerToQuestion || ''),
    };
  } catch (error) {
    clearTimeout(timeoutId);
    failAITrace(traceId, { error, meta: { roomId } });
    throw error;
  }
}
