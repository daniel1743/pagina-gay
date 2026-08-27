import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ENABLE_BAUL } from '@/config/featureFlags';
import BaulSection from '@/components/baul/BaulSection';
import { Button } from '@/components/ui/button';
import { trackPageView, trackPageExit } from '@/services/eventTrackingService';

const getUserKey = (user) => user?.id || user?.guestId || 'anon';

const BaulPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const pageStartRef = useRef(Date.now());

  useEffect(() => {
    pageStartRef.current = Date.now();
    trackPageView('/baul', 'Baul de Perfiles', { user });

    const key = getUserKey(user);
    localStorage.setItem(`baul_visited:${key}`, '1');

    return () => {
      const timeOnPage = Math.round((Date.now() - pageStartRef.current) / 1000);
      trackPageExit('/baul', timeOnPage, { user });
    };
  }, [user]);

  const handleClose = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/chat/principal');
    }
  };

  if (!ENABLE_BAUL) {
    return (
      <div className="-mt-16 sm:-mt-20">
        <div className="min-h-[calc(100dvh-4rem)] flex flex-col items-center justify-center px-6 py-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-400/25 flex items-center justify-center mb-4">
            <AlertCircle className="w-7 h-7 text-amber-300" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-300">Servicio pausado</p>
          <h1 className="text-2xl font-bold text-foreground mt-2">Baúl de Perfiles</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            Las tarjetas, likes y matches están temporalmente desactivados mientras se completa su backend seguro. No es un problema de tu cuenta ni de tu foto.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button onClick={() => navigate('/chat/principal')} className="magenta-gradient text-white font-semibold">
              Ir al chat <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button variant="outline" onClick={() => navigate('/opin')}>
              Ir a OPIN
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="-mt-16 sm:-mt-20">
        <div className="min-h-[calc(100dvh-4rem)] flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center mb-4">
          <Users className="w-6 h-6 text-cyan-400" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Baúl de Perfiles</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
          Descubre tarjetas de personas activas. Entra al chat para iniciar una sesión y explorar Baúl.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => navigate('/chat/principal')}
            className="magenta-gradient text-white font-semibold"
          >
            Ir al chat <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/auth')}
          >
            Registrarme
          </Button>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="-mt-16 sm:-mt-20">
      <BaulSection variant="page" onClose={handleClose} />
    </div>
  );
};

export default BaulPage;
