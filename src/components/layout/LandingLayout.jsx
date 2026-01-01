import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

/**
 * LandingLayout - Layout minimalista para landing pages de conversión
 * 
 * Diferencia con MainLayout:
 * - Header minimalista (solo logo + "Entrar")
 * - Sin padding-top (hero empieza inmediatamente)
 * - Sin Footer (no distrae del CTA)
 * - Optimizado para mobile-first
 */
const LandingLayout = ({ children }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header minimalista para landing */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <img 
              src="/LOGO-TRASPARENTE.png" 
              alt="Chactivo" 
              className="h-8 cursor-pointer"
              onClick={() => navigate('/')}
              onError={(e) => {
                // Fallback a logo alternativo
                if (e.target.src.includes('LOGO-TRASPARENTE')) {
                  e.target.src = '/LOGO_CHACTIVO.png';
                }
              }}
            />
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/auth')}
              className="text-sm"
            >
              Entrar
            </Button>
          </div>
        </div>
      </header>
      
      {/* Contenido sin padding-top - hero empieza inmediatamente */}
      <main className="w-full">{children}</main>
    </div>
  );
};

export default LandingLayout;

