import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import '@/utils/logFilter'; // 🔇 Filtro de logs - reduce ruido (debe ir ANTES de errorLogger)
import '@/utils/errorLogger'; // 🔍 Sistema de detección de errores
import '@/utils/performanceMonitor'; // 📊 Performance Monitor - Sistema de análisis de velocidad

console.log('🚀 [MAIN] Iniciando aplicación...');

function AppBootstrap() {
  useEffect(() => {
    document.documentElement.classList.add('app-loaded');

    return () => {
      document.documentElement.classList.remove('app-loaded');
    };
  }, []);

  return <App />;
}

try {
  const root = document.getElementById('root');
  console.log('📦 [MAIN] Root element:', root);

  // ⚡ OPTIMIZACIÓN: Strict Mode solo en desarrollo para evitar doble render
  // En producción, el doble render duplica las llamadas a Firebase y causa lentitud
  const isDevelopment = import.meta.env.DEV;

  ReactDOM.createRoot(root).render(
    isDevelopment ? (
      <React.StrictMode>
        <AppBootstrap />
      </React.StrictMode>
    ) : (
      <AppBootstrap />
    )
  );

  console.log('✅ [MAIN] Aplicación renderizada correctamente');
  if (!isDevelopment) {
    console.log('⚡ [MAIN] Strict Mode desactivado en producción - rendimiento optimizado');
  }
} catch (error) {
  document.documentElement.classList.remove('app-loaded');
  console.error('❌ [MAIN] Error al inicializar aplicación:', error);
}
