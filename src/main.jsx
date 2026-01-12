import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import '@/utils/logFilter'; // 🔇 Filtro de logs - reduce ruido (debe ir ANTES de errorLogger)
import '@/utils/errorLogger'; // 🔍 Sistema de detección de errores
import '@/utils/performanceMonitor'; // 📊 Performance Monitor - Sistema de análisis de velocidad

console.log('🚀 [MAIN] Iniciando aplicación...');

try {
  const root = document.getElementById('root');
  console.log('📦 [MAIN] Root element:', root);

  // ⚡ OPTIMIZACIÓN: Strict Mode solo en desarrollo para evitar doble render
  // En producción, el doble render duplica las llamadas a Firebase y causa lentitud
  const isDevelopment = import.meta.env.DEV;

  ReactDOM.createRoot(root).render(
    isDevelopment ? (
      <React.StrictMode>
        <App />
      </React.StrictMode>
    ) : (
      <App />
    )
  );

  console.log('✅ [MAIN] Aplicación renderizada correctamente');
  if (!isDevelopment) {
    console.log('⚡ [MAIN] Strict Mode desactivado en producción - rendimiento optimizado');
  }
} catch (error) {
  console.error('❌ [MAIN] Error al inicializar aplicación:', error);
}
