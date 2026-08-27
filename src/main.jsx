import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import '@/index.css';
import '@/utils/logFilter';
import '@/utils/errorLogger';
import '@/utils/performanceMonitor';

console.log('🚀 [MAIN] Iniciando aplicación...');

function StartupFallback({ error = null }) {
  if (error) {
    return (
      <div
        role="alert"
        className="mx-auto mt-8 max-w-xl rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-center text-sm text-foreground"
      >
        <p className="font-semibold">La parte interactiva no pudo iniciar en este entorno.</p>
        <p className="mt-2 text-muted-foreground">
          La información pública sigue disponible. Revisa la configuración del entorno y vuelve a cargar la página.
        </p>
      </div>
    );
  }

  return (
    <div role="status" aria-live="polite" className="mx-auto mt-8 max-w-xl p-5 text-center text-sm text-muted-foreground">
      Cargando Chactivo…
    </div>
  );
}

function AppBootstrap() {
  const [AppComponent, setAppComponent] = useState(null);
  const [startupError, setStartupError] = useState(null);

  useEffect(() => {
    let active = true;

    import('@/App')
      .then(({ default: LoadedApp }) => {
        if (active) setAppComponent(() => LoadedApp);
      })
      .catch((error) => {
        console.error('❌ [MAIN] Error al cargar la aplicación:', error);
        if (active) setStartupError(error);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!AppComponent) return undefined;

    document.documentElement.classList.add('app-loaded');
    return () => document.documentElement.classList.remove('app-loaded');
  }, [AppComponent]);

  if (startupError) return <StartupFallback error={startupError} />;
  if (!AppComponent) return <StartupFallback />;

  return <AppComponent />;
}

try {
  const root = document.getElementById('root');
  if (!root) throw new Error('No se encontró el elemento root.');

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

  console.log('✅ [MAIN] Bootstrap renderizado correctamente');
} catch (error) {
  document.documentElement.classList.remove('app-loaded');
  console.error('❌ [MAIN] Error al inicializar bootstrap:', error);
}
