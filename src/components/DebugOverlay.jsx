import React, { useState, useEffect } from 'react';

/**
 * 🔍 DEBUG OVERLAY - Muestra información de debug en pantalla
 * Solo visible en desarrollo
 */
const DebugOverlay = () => {
  const [logs, setLogs] = useState([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Interceptar console.log
    const originalLog = console.log;
    const originalError = console.error;

    console.log = function(...args) {
      const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');

      // ✅ Diferir la actualización del estado para evitar "setState during render"
      setTimeout(() => {
        setLogs(prev => [...prev.slice(-20), {
          type: 'log',
          message,
          timestamp: Date.now()
        }]);
      }, 0);

      originalLog.apply(console, args);
    };

    console.error = function(...args) {
      const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ');

      // ✅ Diferir la actualización del estado para evitar "setState during render"
      setTimeout(() => {
        setLogs(prev => [...prev.slice(-20), {
          type: 'error',
          message,
          timestamp: Date.now()
        }]);
      }, 0);

      originalError.apply(console, args);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
    };
  }, []);

  if (!visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          zIndex: 99999,
          background: '#333',
          color: '#fff',
          border: 'none',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          cursor: 'pointer',
          fontSize: '20px'
        }}
      >
        🔍
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      right: 0,
      width: '400px',
      height: '300px',
      background: 'rgba(0, 0, 0, 0.9)',
      color: '#fff',
      zIndex: 99999,
      padding: '10px',
      fontFamily: 'monospace',
      fontSize: '11px',
      overflow: 'auto',
      borderTopLeftRadius: '8px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
        <strong>🔍 Debug Console</strong>
        <button
          onClick={() => setVisible(false)}
          style={{
            background: '#f00',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            padding: '2px 8px',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>
      </div>
      <div style={{ height: 'calc(100% - 30px)', overflow: 'auto' }}>
        {logs.length === 0 && (
          <div style={{ color: '#666' }}>Esperando logs...</div>
        )}
        {logs.map((log, i) => (
          <div
            key={i}
            style={{
              marginBottom: '4px',
              padding: '4px',
              background: log.type === 'error' ? 'rgba(255, 0, 0, 0.2)' : 'transparent',
              borderLeft: `3px solid ${log.type === 'error' ? '#f00' : '#0f0'}`,
              paddingLeft: '8px',
              wordBreak: 'break-word'
            }}
          >
            <small style={{ color: '#666', marginRight: '8px' }}>
              {new Date(log.timestamp).toLocaleTimeString()}
            </small>
            {log.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DebugOverlay;
