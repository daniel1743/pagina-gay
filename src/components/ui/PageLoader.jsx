/**
 * PageLoader - Componente de loading optimizado para code splitting
 * Diseño minimalista que no causa CLS (Cumulative Layout Shift)
 */
import React from 'react';

const PageLoader = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner simple sin animaciones pesadas */}
        <div className="relative w-12 h-12">
          <div
            className="absolute inset-0 rounded-full border-4 border-primary/20"
            style={{ borderTopColor: 'hsl(var(--primary))' }}
          />
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
            .animate-spin {
              animation: spin 1s linear infinite;
            }
          `}</style>
          <div
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin"
          />
        </div>

        {/* Texto de carga */}
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    </div>
  );
};

export default PageLoader;
