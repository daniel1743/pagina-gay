import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import '@/utils/errorLogger'; // 🔍 Sistema de detección de errores

console.log('🚀 [MAIN] Iniciando aplicación...');

try {
  const root = document.getElementById('root');
  console.log('📦 [MAIN] Root element:', root);

  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  console.log('✅ [MAIN] Aplicación renderizada correctamente');
} catch (error) {
  console.error('❌ [MAIN] Error al inicializar aplicación:', error);
}
