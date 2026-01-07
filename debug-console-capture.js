// 🔍 SCRIPT DE CAPTURA DE DEBUGGING
// Copia y pega este script completo en la consola del navegador (F12)
// Luego envía un mensaje y automáticamente se capturará TODO

(function() {
  console.log('%c🔍 INICIANDO CAPTURA DE DEBUG', 'background: #222; color: #00ff00; font-size: 16px; padding: 10px;');

  // Almacenar todos los logs
  window.debugLogs = [];

  // Interceptar console.log
  const originalLog = console.log;
  console.log = function(...args) {
    const timestamp = new Date().toISOString();
    window.debugLogs.push({ type: 'LOG', timestamp, args });
    originalLog.apply(console, args);
  };

  // Interceptar console.error
  const originalError = console.error;
  console.error = function(...args) {
    const timestamp = new Date().toISOString();
    window.debugLogs.push({ type: 'ERROR', timestamp, args });
    originalError.apply(console, args);
  };

  // Interceptar console.warn
  const originalWarn = console.warn;
  console.warn = function(...args) {
    const timestamp = new Date().toISOString();
    window.debugLogs.push({ type: 'WARN', timestamp, args });
    originalWarn.apply(console, args);
  };

  console.log('%c✅ CAPTURA ACTIVADA - Ahora envía un mensaje', 'background: #222; color: #00ff00; font-size: 14px; padding: 5px;');
  console.log('%cDespués de enviar, escribe en consola: showDebugLogs()', 'background: #222; color: #ffaa00; font-size: 14px; padding: 5px;');

  // Función para mostrar los logs capturados
  window.showDebugLogs = function() {
    console.log('%c📊 LOGS CAPTURADOS:', 'background: #222; color: #00ff00; font-size: 16px; padding: 10px;');

    // Filtrar solo los logs relacionados con el envío de mensajes
    const relevantLogs = window.debugLogs.filter(log => {
      const logStr = JSON.stringify(log.args);
      return logStr.includes('DIAGNÓSTICO') ||
             logStr.includes('DEBUG') ||
             logStr.includes('addDoc') ||
             logStr.includes('Mensaje enviado') ||
             logStr.includes('FALLÓ') ||
             logStr.includes('ERROR') ||
             logStr.includes('permission') ||
             logStr.includes('Write') ||
             logStr.includes('Firestore');
    });

    if (relevantLogs.length === 0) {
      console.log('%c⚠️ No se capturaron logs relevantes. Envía un mensaje primero.', 'color: orange; font-size: 14px;');
      return;
    }

    relevantLogs.forEach((log, index) => {
      const color = log.type === 'ERROR' ? '#ff0000' : log.type === 'WARN' ? '#ffaa00' : '#00ff00';
      console.log(`%c[${index + 1}] ${log.type} @ ${log.timestamp}`, `color: ${color}; font-weight: bold;`);
      console.log(...log.args);
      console.log('---');
    });

    // Copiar al clipboard
    const logsText = relevantLogs.map((log, index) => {
      return `[${index + 1}] ${log.type} @ ${log.timestamp}\n${JSON.stringify(log.args, null, 2)}`;
    }).join('\n\n---\n\n');

    console.log('%c📋 Copiando logs al portapapeles...', 'background: #222; color: #00ff00; font-size: 14px; padding: 5px;');

    // Intentar copiar al clipboard
    if (navigator.clipboard) {
      navigator.clipboard.writeText(logsText).then(() => {
        console.log('%c✅ Logs copiados! Pégalos en el chat de Claude', 'background: #00ff00; color: #000; font-size: 14px; padding: 5px;');
      }).catch(() => {
        console.log('%c⚠️ No se pudo copiar automáticamente. Copia manualmente:', 'color: orange;');
        console.log(logsText);
      });
    } else {
      console.log('%c⚠️ Clipboard no disponible. Aquí están los logs:', 'color: orange;');
      console.log(logsText);
    }
  };

  console.log('%c🎯 INSTRUCCIONES:', 'background: #222; color: #00ffff; font-size: 14px; padding: 5px;');
  console.log('1. Envía UN mensaje en el chat');
  console.log('2. Espera 2 segundos');
  console.log('3. Escribe en esta consola: showDebugLogs()');
  console.log('4. Los logs se copiarán automáticamente');
  console.log('5. Pégalos en el chat de Claude');
})();
