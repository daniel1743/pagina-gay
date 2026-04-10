import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Copy, Download, RefreshCw, MessageSquare, Users } from 'lucide-react';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { generateAdminRoomHistoryReport } from '@/services/adminRoomHistoryService';

const ROOM_OPTIONS = [
  { value: 'principal', label: 'Sala Principal' },
  { value: 'santiago', label: 'Santiago' },
  { value: 'mas-30', label: 'Más 30' },
  { value: 'amistad', label: 'Amistad' },
  { value: 'osos-activos', label: 'Osos Activos' },
  { value: 'pasivos-buscando', label: 'Pasivos Buscando' },
  { value: 'versatiles', label: 'Versátiles' },
  { value: 'quedar-ya', label: 'Quedar Ya' },
  { value: 'hablar-primero', label: 'Hablar Primero' },
  { value: 'morbosear', label: 'Morbosear' }
];

const ROOM_RETENTION_MAX_MESSAGES = 205;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

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

const AdminRoomHistoryPanel = () => {
  const [selectedRoom, setSelectedRoom] = useState('principal');
  const [loading, setLoading] = useState(true);
  const [downloadingDays, setDownloadingDays] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadedAt, setLoadedAt] = useState(null);

  const loadRoomHistory = useCallback(async () => {
    setLoading(true);

    try {
      const messagesRef = collection(db, 'rooms', selectedRoom, 'messages');
      const roomQuery = query(messagesRef, orderBy('timestamp', 'desc'), limit(ROOM_RETENTION_MAX_MESSAGES));
      const snapshot = await getDocs(roomQuery);

      const nextMessages = snapshot.docs
        .map((messageDoc) => {
          const data = messageDoc.data();
          const timestamp = data.timestamp?.toDate?.();

          return {
            id: messageDoc.id,
            username: data.username || 'Usuario',
            comuna: data.comuna || null,
            roleBadge: data.roleBadge || null,
            type: data.type || 'text',
            content: typeof data.content === 'string' ? data.content : '',
            timestamp: timestamp || null,
            userId: data.userId || null
          };
        })
        .filter((message) => message.timestamp instanceof Date)
        .sort((a, b) => a.timestamp - b.timestamp);

      setMessages(nextMessages);
      setLoadedAt(new Date());
    } catch (error) {
      console.error('Error cargando historial de sala:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el historial disponible de la sala.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [selectedRoom]);

  useEffect(() => {
    loadRoomHistory();
  }, [loadRoomHistory]);

  const cutoffDate = useMemo(() => new Date(Date.now() - SEVEN_DAYS_MS), []);

  const recentMessages = useMemo(
    () => messages.filter((message) => message.timestamp >= cutoffDate),
    [messages, cutoffDate]
  );

  const uniqueUsersCount = useMemo(() => {
    const keys = recentMessages.map((message) => message.userId || `guest:${message.username}`);
    return new Set(keys).size;
  }, [recentMessages]);

  const transcriptText = useMemo(() => {
    if (recentMessages.length === 0) {
      return `Sala: ${selectedRoom}\nNo hay mensajes disponibles dentro de la ventana de 7 días.`;
    }

    const header = [
      `Sala: ${selectedRoom}`,
      `Mensajes disponibles últimos 7 días: ${recentMessages.length}`,
      `Usuarios únicos aproximados: ${uniqueUsersCount}`,
      `Generado: ${new Date().toLocaleString('es-CL')}`,
      ''
    ];

    const lines = recentMessages.map((message) => {
      const identityBits = [message.username];
      if (message.roleBadge) identityBits.push(message.roleBadge);
      if (message.comuna) identityBits.push(message.comuna);

      return `[${formatDateTime(message.timestamp)}] ${identityBits.join(' | ')}: ${buildMessagePreview(message)}`;
    });

    return [...header, ...lines].join('\n');
  }, [recentMessages, selectedRoom, uniqueUsersCount]);

  const handleCopyTranscript = async () => {
    try {
      await navigator.clipboard.writeText(transcriptText);
      toast({
        title: 'Historial copiado',
        description: `Se copió el transcript disponible de la sala ${selectedRoom}.`
      });
    } catch (error) {
      console.error('Error copiando historial:', error);
      toast({
        title: 'No se pudo copiar',
        description: 'El navegador no permitió copiar el historial al portapapeles.',
        variant: 'destructive'
      });
    }
  };

  const handleDownloadReport = async (days) => {
    setDownloadingDays(days);

    try {
      const report = await generateAdminRoomHistoryReport(selectedRoom, days);
      if (!report?.txtDownloadUrl) {
        throw new Error('No se recibió URL de descarga del informe.');
      }

      const link = document.createElement('a');
      link.href = report.txtDownloadUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.click();

      toast({
        title: 'Informe generado',
        description: `Informe de ${report.days} días listo con ${report.totalMessages || 0} mensajes.`
      });
    } catch (error) {
      console.error('Error generando informe descargable:', error);
      toast({
        title: 'No se pudo generar el informe',
        description: error?.message || 'Falló la generación del informe descargable.',
        variant: 'destructive'
      });
    } finally {
      setDownloadingDays(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-effect rounded-2xl border border-border p-6 space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-cyan-400" />
              Historial Reciente de Sala
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Vista admin para leer la conversación disponible y copiarla para análisis de intención.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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

            <Button variant="outline" onClick={loadRoomHistory} disabled={loading} className="gap-2">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Recargar
            </Button>

            <Button onClick={handleCopyTranscript} disabled={loading} className="gap-2">
              <Copy className="w-4 h-4" />
              Copiar conversaciones
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-300" />
            <div className="space-y-1">
              <p className="font-medium text-amber-200">Retención real de la sala pública</p>
              <p>
                Este panel intenta mostrar últimos 7 días, pero hoy la sala pública se poda automáticamente a
                aproximadamente {ROOM_RETENTION_MAX_MESSAGES} mensajes. Si hubo más tráfico, lo anterior ya fue borrado.
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
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Mensajes últimos 7 días</div>
            <div className="mt-2 text-lg font-semibold">{recentMessages.length}</div>
          </div>

          <div className="rounded-xl border border-border bg-background/60 p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              Usuarios únicos aprox.
            </div>
            <div className="mt-2 text-lg font-semibold">{uniqueUsersCount}</div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          {loadedAt ? `Última carga: ${loadedAt.toLocaleString('es-CL')}` : 'Sin carga todavía'}
        </div>
      </div>

      <div className="glass-effect rounded-2xl border border-border p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Download className="w-5 h-5 text-cyan-400" />
            Informes Descargables
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Estos informes salen de un archivo admin separado en Storage. La sala pública puede seguir podándose sin perder el material analítico de los últimos 14 días.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={() => handleDownloadReport(7)}
            disabled={Boolean(downloadingDays)}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            {downloadingDays === 7 ? 'Generando...' : 'Descargar informe 7 días'}
          </Button>

          <Button
            variant="outline"
            onClick={() => handleDownloadReport(14)}
            disabled={Boolean(downloadingDays)}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            {downloadingDays === 14 ? 'Generando...' : 'Descargar informe 14 días'}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          El enlace de descarga se firma solo para admin y expira automáticamente.
        </p>
      </div>

      <div className="glass-effect rounded-2xl border border-border p-6">
        <h3 className="text-lg font-semibold mb-4">Conversación disponible</h3>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Cargando historial...</div>
        ) : recentMessages.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No hay mensajes disponibles dentro de la ventana de 7 días para esta sala.
          </div>
        ) : (
          <div className="max-h-[65vh] space-y-3 overflow-y-auto pr-2">
            {recentMessages.map((message) => (
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
