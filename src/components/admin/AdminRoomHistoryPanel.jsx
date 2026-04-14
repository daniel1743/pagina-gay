import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Copy, Download, FileJson, MessageSquare, RefreshCw, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { generateAdminRoomHistoryReport } from '@/services/adminRoomHistoryService';

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
  { value: 'morbosear', label: 'Morbosear' }
];

const ROOM_RETENTION_MAX_MESSAGES = 205;

const formatDateTime = (date) =>
  new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);

const buildMessagePreview = (message) => {
  if (message.type === 'image') {
    return message.content?.trim() ? `[Imagen] ${message.content.trim()}` : '[Imagen enviada]';
  }

  if (!message.content?.trim()) {
    return '[Mensaje sin contenido visible]';
  }

  return message.content.trim();
};

const normalizeWindowDays = () => 7;

const buildTranscriptText = ({ roomId, days, messages, uniqueUsersCount, generatedAt }) => {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [
      `Sala: ${roomId}`,
      `Ventana: ${days} dias`,
      'No hay mensajes archivados disponibles para esta ventana.'
    ].join('\n');
  }

  const header = [
    `Sala: ${roomId}`,
    `Ventana: ${days} dias`,
    `Mensajes archivados: ${messages.length}`,
    `Usuarios unicos aproximados: ${uniqueUsersCount}`,
    `Generado: ${generatedAt ? generatedAt.toLocaleString('es-CL') : new Date().toLocaleString('es-CL')}`,
    ''
  ];

  const lines = messages.map((message) => {
    const identityBits = [message.username];
    if (message.roleBadge) identityBits.push(message.roleBadge);
    if (message.comuna) identityBits.push(message.comuna);
    return `[${formatDateTime(message.timestamp)}] ${identityBits.join(' | ')}: ${buildMessagePreview(message)}`;
  });

  return [...header, ...lines].join('\n');
};

const downloadBlob = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const AdminRoomHistoryPanel = () => {
  const [selectedRoom, setSelectedRoom] = useState('principal');
  const [selectedWindowDays, setSelectedWindowDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [exportingFormat, setExportingFormat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadedAt, setLoadedAt] = useState(null);

  const loadRoomHistory = useCallback(async (requestedDays = selectedWindowDays) => {
    const safeDays = normalizeWindowDays(requestedDays);
    setLoading(true);

    try {
      const report = await generateAdminRoomHistoryReport(selectedRoom, safeDays);
      const nextMessages = Array.isArray(report?.messages)
        ? report.messages
            .map((entry, index) => {
              const timestamp = entry?.timestampIso
                ? new Date(entry.timestampIso)
                : new Date(Number(entry?.createdAtMs || 0));

              return {
                id: entry?.messageId || `${selectedRoom}_${safeDays}_${index}`,
                username: entry?.username || 'Usuario',
                comuna: entry?.comuna || null,
                roleBadge: entry?.roleBadge || null,
                type: entry?.type || 'text',
                content: typeof entry?.content === 'string' ? entry.content : '',
                timestamp,
                userId: entry?.userId || null,
              };
            })
            .filter((message) => message.timestamp instanceof Date && !Number.isNaN(message.timestamp.getTime()))
            .sort((a, b) => a.timestamp - b.timestamp)
        : [];

      setMessages(nextMessages);
      setSelectedWindowDays(normalizeWindowDays(report?.days || safeDays));
      setLoadedAt(report?.generatedAtIso ? new Date(report.generatedAtIso) : new Date());
    } catch (error) {
      console.error('Error cargando historial archivado:', error);
      toast({
        title: 'No se pudo cargar el historial',
        description: error?.message || 'Fallo la consulta del archivo admin.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [selectedRoom, selectedWindowDays]);

  useEffect(() => {
    loadRoomHistory(7);
  }, [selectedRoom, loadRoomHistory]);

  const uniqueUsersCount = useMemo(() => {
    const keys = messages.map((message) => message.userId || `guest:${message.username}`);
    return new Set(keys).size;
  }, [messages]);

  const transcriptText = useMemo(
    () => buildTranscriptText({
      roomId: selectedRoom,
      days: selectedWindowDays,
      messages,
      uniqueUsersCount,
      generatedAt: loadedAt,
    }),
    [loadedAt, messages, selectedRoom, selectedWindowDays, uniqueUsersCount]
  );

  const handleCopyTranscript = async () => {
    try {
      await navigator.clipboard.writeText(transcriptText);
      toast({
        title: 'Historial copiado',
        description: `Se copio la ventana de ${selectedWindowDays} dias de ${selectedRoom}.`
      });
    } catch (error) {
      console.error('Error copiando historial:', error);
      toast({
        title: 'No se pudo copiar',
        description: 'El navegador no permitio copiar el historial.',
        variant: 'destructive'
      });
    }
  };

  const handleDownloadCurrent = async (format) => {
    const safeFormat = format === 'json' ? 'json' : 'txt';
    setExportingFormat(safeFormat);

    try {
      const roomSlug = String(selectedRoom || 'sala').replace(/[^a-z0-9-_]+/gi, '-');
      const filenameBase = `historial_${roomSlug}_${selectedWindowDays}d_${new Date().toISOString().slice(0, 10)}`;

      if (safeFormat === 'json') {
        downloadBlob(
          JSON.stringify({
            roomId: selectedRoom,
            days: selectedWindowDays,
            generatedAtIso: loadedAt?.toISOString?.() || new Date().toISOString(),
            totalMessages: messages.length,
            messages: messages.map((message) => ({
              id: message.id,
              username: message.username,
              comuna: message.comuna,
              roleBadge: message.roleBadge,
              type: message.type,
              content: message.content,
              timestampIso: message.timestamp?.toISOString?.() || null,
              userId: message.userId,
            })),
          }, null, 2),
          `${filenameBase}.json`,
          'application/json;charset=utf-8'
        );
      } else {
        downloadBlob(
          transcriptText,
          `${filenameBase}.txt`,
          'text/plain;charset=utf-8'
        );
      }

      toast({
        title: 'Descarga lista',
        description: `Se descargo el historial ${safeFormat.toUpperCase()} de ${selectedWindowDays} dias.`,
      });
    } catch (error) {
      console.error('Error descargando historial local:', error);
      toast({
        title: 'No se pudo descargar',
        description: error?.message || 'Fallo la descarga local del historial.',
        variant: 'destructive'
      });
    } finally {
      setExportingFormat(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-effect rounded-2xl border border-border p-6 space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-cyan-400" />
              Historial Admin de Sala
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Esta vista usa el archivo admin separado con retencion corta y predecible. No depende de enlaces firmados ni de salir del panel.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="h-10 min-w-[210px] rounded-md border border-border bg-background px-3 text-sm"
            >
              {ROOM_OPTIONS.map((room) => (
                <option key={room.value} value={room.value}>
                  {room.label}
                </option>
              ))}
            </select>

            <Button variant="outline" onClick={() => loadRoomHistory(selectedWindowDays)} disabled={loading} className="gap-2">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Recargar
            </Button>

            <Button onClick={handleCopyTranscript} disabled={loading} className="gap-2">
              <Copy className="w-4 h-4" />
              Copiar
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-300" />
            <div className="space-y-1">
              <p className="font-medium text-amber-200">Separacion simple entre sala viva y archivo admin</p>
              <p>
                La sala publica viva sigue podandose a aproximadamente {ROOM_RETENTION_MAX_MESSAGES} mensajes para rendimiento.
                Este panel ya no lee esa capa: lee el archivo admin de 7 dias.
              </p>
              <p className="text-amber-200/90">
                Si falta material muy antiguo, normalmente es porque fue anterior al despliegue del archivado.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-background/60 p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Sala seleccionada</div>
            <div className="mt-2 text-lg font-semibold">{selectedRoom}</div>
          </div>

          <div className="rounded-xl border border-border bg-background/60 p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Ventana cargada</div>
            <div className="mt-2 text-lg font-semibold">{selectedWindowDays} dias</div>
          </div>

          <div className="rounded-xl border border-border bg-background/60 p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              Usuarios unicos aprox.
            </div>
            <div className="mt-2 text-lg font-semibold">{uniqueUsersCount}</div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          {loadedAt ? `Ultima carga: ${loadedAt.toLocaleString('es-CL')}` : 'Sin carga todavia'}
        </div>
      </div>

      <div className="glass-effect rounded-2xl border border-border p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Download className="w-5 h-5 text-cyan-400" />
            Ventana y descarga local
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Ves el contenido aqui mismo y, si quieres, lo descargas directo desde el navegador.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button
            onClick={() => loadRoomHistory(7)}
            disabled={loading}
            className="gap-2"
            variant={selectedWindowDays === 7 ? 'default' : 'outline'}
          >
            <MessageSquare className="w-4 h-4" />
            {loading && selectedWindowDays === 7 ? 'Cargando 7 dias...' : 'Mostrar 7 dias'}
          </Button>

          <Button
            variant="outline"
            onClick={() => handleDownloadCurrent('txt')}
            disabled={loading || exportingFormat !== null}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            {exportingFormat === 'txt' ? 'Preparando TXT...' : 'Descargar TXT'}
          </Button>

          <Button
            variant="outline"
            onClick={() => handleDownloadCurrent('json')}
            disabled={loading || exportingFormat !== null}
            className="gap-2"
          >
            <FileJson className="w-4 h-4" />
            {exportingFormat === 'json' ? 'Preparando JSON...' : 'Descargar JSON'}
          </Button>
        </div>
      </div>

      <div className="glass-effect rounded-2xl border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Conversacion archivada disponible</h3>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Cargando historial archivado...</div>
        ) : messages.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No hay mensajes archivados disponibles para esta sala en la ventana de 7 dias.
          </div>
        ) : (
          <div className="max-h-[65vh] space-y-3 overflow-y-auto pr-2">
            {messages.map((message) => (
              <div key={message.id} className="rounded-xl border border-border bg-background/60 p-4">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="font-semibold text-foreground">{message.username}</span>
                  {message.roleBadge && (
                    <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-xs text-cyan-300">
                      {message.roleBadge}
                    </span>
                  )}
                  {message.comuna && (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                      {message.comuna}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">{formatDateTime(message.timestamp)}</span>
                </div>

                <p className="mt-3 whitespace-pre-wrap break-words text-sm text-foreground">
                  {buildMessagePreview(message)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminRoomHistoryPanel;
