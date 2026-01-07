import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Actualizar el estado para que el siguiente render muestre la UI de fallback
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // ✅ Ignorar errores internos de Firestore que no podemos controlar
    if (error?.message?.includes('INTERNAL ASSERTION FAILED') || 
        error?.message?.includes('Unexpected state')) {
      console.warn('Firestore internal error caught by ErrorBoundary, ignoring...');
      // No actualizar el estado para estos errores, permitir que la app continúe
      return;
    }

    // 🔴 CRÍTICO: Detectar cuota agotada de Firestore
    const isQuotaExceeded = 
      error?.message?.includes('Quota exceeded') ||
      error?.message?.includes('Resource exhausted') ||
      error?.code === 'resource-exhausted' ||
      error?.code === 'quota-exceeded';

    if (isQuotaExceeded) {
      console.error('🚨 CRÍTICO: Cuota de Firestore agotada', error, errorInfo);
      // Limpiar estado corrupto y recargar después de 5 segundos
      setTimeout(() => {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (e) {
          console.warn('Error clearing storage:', e);
        }
        window.location.reload();
      }, 5000);
    }

    // Log del error para debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Aquí podrías enviar el error a un servicio de logging como Sentry
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // ✅ Si es un error interno de Firestore, no mostrar el error boundary
      if (this.state.error?.message?.includes('INTERNAL ASSERTION FAILED') || 
          this.state.error?.message?.includes('Unexpected state')) {
        // Intentar recuperar silenciosamente
        return this.props.children;
      }

      // UI personalizada de fallback
      return (
        <ErrorFallback 
          error={this.state.error} 
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

const ErrorFallback = ({ error, onReset }) => {
  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleForceReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn('Error clearing storage:', e);
    }
    window.location.reload();
  };

  // 🔴 Detectar si es error de cuota agotada
  const isQuotaExceeded = 
    error?.message?.includes('Quota exceeded') ||
    error?.message?.includes('Resource exhausted') ||
    error?.code === 'resource-exhausted' ||
    error?.code === 'quota-exceeded';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-effect rounded-2xl border border-red-500/30 p-8 text-center">
        <div className="mb-6">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {isQuotaExceeded ? 'Servicio Temporalmente No Disponible' : 'Algo salió mal'}
          </h1>
          <p className="text-muted-foreground mb-4">
            {isQuotaExceeded 
              ? 'Estamos experimentando problemas técnicos. La aplicación se recargará automáticamente en unos segundos.'
              : 'Ocurrió un error inesperado. Por favor, intenta recargar la página.'}
          </p>
          {isQuotaExceeded && (
            <p className="text-xs text-muted-foreground mt-2">
              Si el problema persiste, por favor contacta al soporte.
            </p>
          )}
        </div>

        {process.env.NODE_ENV === 'development' && error && (
          <div className="mb-6 p-4 bg-red-500/10 rounded-lg border border-red-500/20 text-left">
            <p className="text-xs font-mono text-red-300 break-all">
              {error.toString()}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {!isQuotaExceeded && (
            <Button
              onClick={onReset}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reintentar
            </Button>
          )}
          <Button
            onClick={handleForceReload}
            variant={isQuotaExceeded ? "default" : "outline"}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {isQuotaExceeded ? 'Recargar Ahora' : 'Recargar Aplicación'}
          </Button>
          <Button
            onClick={handleGoHome}
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Ir al Inicio
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ErrorBoundary;

