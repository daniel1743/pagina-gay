import { useState } from 'react';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { isSupabaseAuthEnabled } from '@/config/supabase';

const PROHIBITED_PATTERNS = [
  'wn y cuando',
  'wn, y cuando',
  'wn y al final',
  'wn, y al final',
  'wn, es que',
  'el queso es el mejor',
  'con nachos y risas',
  'si rue llega',
  'un nacho con queso',
  'hasta el más',
  'hasta el mas',
  'momento absurdo',
  'momentos absurdos',
  'filosofía de la vida',
  'meme del',
  'como si realmente',
  'pensai en el meme'
];

const ROOMS = [
  // 'global', // ⚠️ DESACTIVADA (reemplazada por 'principal')
  'principal', // Sala principal nueva (sin spam)
  'gaming',
  'santiago',
  'mas-30',
  'amistad',
  'osos-activos',
  'pasivos-buscando',
  'versatiles',
  'quedar-ya',
  'hablar-primero',
  'morbosear',
  // 'conversas-libres' → DESACTIVADA (tenía spam masivo, ahora se usa 'principal')
];

const AdminCleanup = () => {
  if (isSupabaseAuthEnabled()) {
    return (
      <div className="mx-auto max-w-2xl p-8 text-center text-slate-600">
        La limpieza administrativa histórica de Firebase está desactivada en modo Supabase.
      </div>
    );
  }
  const [cleaning, setCleaning] = useState(false);
  const [progress, setProgress] = useState('');
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, message, type }]);
    console.log(message);
  };

  const hasProhibitedPattern = (message) => {
    const normalized = message.toLowerCase();
    return PROHIBITED_PATTERNS.some(pattern => normalized.includes(pattern));
  };

  const cleanupRoom = async (roomId) => {
    addLog(`🔍 Limpiando sala: ${roomId}...`, 'info');
    setProgress(`Limpiando sala: ${roomId}`);

    const messagesRef = collection(db, 'rooms', roomId, 'messages');
    const snapshot = await getDocs(messagesRef);

    let totalMessages = 0;
    let deletedMessages = 0;

    for (const messageDoc of snapshot.docs) {
      totalMessages++;
      const data = messageDoc.data();
      const content = data.content || '';
      const username = data.username || 'Desconocido';

      if (hasProhibitedPattern(content)) {
        addLog(`🚫 ELIMINANDO (${username}): "${content.substring(0, 60)}..."`, 'delete');

        try {
          await deleteDoc(doc(db, 'rooms', roomId, 'messages', messageDoc.id));
          deletedMessages++;
        } catch (error) {
          addLog(`❌ Error eliminando mensaje: ${error.message}`, 'error');
        }
      }

      // Actualizar progreso cada 10 mensajes
      if (totalMessages % 10 === 0) {
        setProgress(`${roomId}: ${deletedMessages}/${totalMessages} eliminados`);
      }
    }

    addLog(`✅ Sala ${roomId}: ${deletedMessages}/${totalMessages} mensajes eliminados`, 'success');

    return {
      roomId,
      total: totalMessages,
      deleted: deletedMessages,
      kept: totalMessages - deletedMessages
    };
  };

  const cleanupAllRooms = async () => {
    setCleaning(true);
    setLogs([]);
    addLog('🚀 INICIANDO LIMPIEZA MASIVA DE SPAM...', 'info');

    const results = [];
    let totalDeleted = 0;
    let totalScanned = 0;

    for (const roomId of ROOMS) {
      const roomStats = await cleanupRoom(roomId);
      results.push(roomStats);
      totalScanned += roomStats.total;
      totalDeleted += roomStats.deleted;
    }

    const finalStats = {
      totalScanned,
      totalDeleted,
      totalKept: totalScanned - totalDeleted,
      results
    };

    setStats(finalStats);
    addLog('='.repeat(60), 'info');
    addLog(`✅ LIMPIEZA COMPLETADA`, 'success');
    addLog(`📊 Mensajes escaneados: ${totalScanned}`, 'info');
    addLog(`🗑️ Mensajes eliminados: ${totalDeleted}`, 'success');
    addLog(`💚 Mensajes conservados: ${totalScanned - totalDeleted}`, 'info');
    addLog('='.repeat(60), 'info');

    setCleaning(false);
    setProgress('Limpieza completada');

    // Recargar después de 3 segundos
    setTimeout(() => {
      window.location.reload();
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-foreground mb-8">
          🧹 Limpieza de Mensajes Spam
        </h1>

        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            ⚠️ Advertencia
          </h2>
          <p className="text-muted-foreground mb-4">
            Esta herramienta eliminará TODOS los mensajes que contengan los siguientes patrones:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground mb-4">
            {PROHIBITED_PATTERNS.slice(0, 10).map((pattern, i) => (
              <li key={i}><code className="bg-secondary px-2 py-1 rounded">{pattern}</code></li>
            ))}
            <li>... y {PROHIBITED_PATTERNS.length - 10} más</li>
          </ul>
          <p className="text-destructive font-bold">
            Esta acción NO se puede deshacer. Asegúrate antes de continuar.
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <button
            onClick={cleanupAllRooms}
            disabled={cleaning}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-4 px-6 text-lg rounded-lg transition-colors"
          >
            {cleaning ? '🔄 Limpiando...' : '🗑️ LIMPIAR TODAS LAS SALAS'}
          </button>

          {progress && (
            <div className="mt-4 p-4 bg-secondary rounded-lg">
              <p className="text-foreground font-mono text-sm">{progress}</p>
            </div>
          )}
        </div>

        {stats && (
          <div className="bg-card border border-border rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              📊 Estadísticas
            </h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-secondary p-4 rounded">
                <p className="text-sm text-muted-foreground">Escaneados</p>
                <p className="text-3xl font-bold text-foreground">{stats.totalScanned}</p>
              </div>
              <div className="bg-secondary p-4 rounded">
                <p className="text-sm text-muted-foreground">Eliminados</p>
                <p className="text-3xl font-bold text-destructive">{stats.totalDeleted}</p>
              </div>
              <div className="bg-secondary p-4 rounded">
                <p className="text-sm text-muted-foreground">Conservados</p>
                <p className="text-3xl font-bold text-green-500">{stats.totalKept}</p>
              </div>
            </div>

            <h3 className="text-lg font-bold text-foreground mb-2">Por Sala:</h3>
            <div className="space-y-2">
              {stats.results.map((room, i) => (
                <div key={i} className="bg-secondary p-3 rounded flex justify-between">
                  <span className="font-mono text-sm">{room.roomId}</span>
                  <span className="text-sm">
                    <span className="text-destructive font-bold">{room.deleted}</span>
                    {' / '}
                    <span className="text-muted-foreground">{room.total}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {logs.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              📋 Logs
            </h2>
            <div className="bg-black rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
              {logs.map((log, i) => (
                <div
                  key={i}
                  className={`mb-1 ${
                    log.type === 'error' ? 'text-red-400' :
                    log.type === 'success' ? 'text-green-400' :
                    log.type === 'delete' ? 'text-yellow-400' :
                    'text-gray-300'
                  }`}
                >
                  <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCleanup;
