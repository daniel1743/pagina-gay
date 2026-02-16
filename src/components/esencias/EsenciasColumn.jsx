import React, { useEffect, useMemo, useState } from 'react';
import { Sparkles, Plus, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { createEsencia, subscribeToActiveEsencias } from '@/services/esenciasService';
import CreateEsenciaModal from '@/components/esencias/CreateEsenciaModal';
import EsenciaCard from '@/components/esencias/EsenciaCard';
import { auth } from '@/config/firebase';

const EsenciasColumn = () => {
  const { user } = useAuth();
  const [esencias, setEsencias] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
  const [showMobileHint, setShowMobileHint] = useState(false);

  const hasNickname = useMemo(() => {
    const normalized = (user?.username || '').trim().toLowerCase();
    return Boolean(normalized && normalized !== 'invitado');
  }, [user?.username]);

  useEffect(() => {
    const unsubscribe = subscribeToActiveEsencias(
      (items) => {
        setEsencias(items);
        setErrorMessage('');
        setIsLoading(false);
      },
      (error) => {
        console.error('[ESENCIAS] Error en suscripción:', error);
        setErrorMessage('No se pudieron cargar las esencias.');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth >= 1280) return;
    if (sessionStorage.getItem('esencias_mobile_hint_seen_v1')) return;

    setShowMobileHint(true);
    const hideTimer = setTimeout(() => {
      setShowMobileHint(false);
      sessionStorage.setItem('esencias_mobile_hint_seen_v1', '1');
    }, 7000);

    return () => clearTimeout(hideTimer);
  }, []);

  const handleOpenModal = () => {
    const resolvedUserId = auth.currentUser?.uid || user?.id;

    if (!resolvedUserId) {
      toast({
        title: 'Espera un momento',
        description: 'Aún estamos preparando tu sesión. Intenta de nuevo en 1-2 segundos.',
      });
      return;
    }

    if (!hasNickname) {
      toast({
        title: 'Completa tu perfil de chat',
        description: 'Elige nickname para poder dejar tu esencia.',
      });
      return;
    }
    setIsModalOpen(true);
    setIsMobilePanelOpen(false);
  };

  const handleCreateEsencia = async (mensaje) => {
    const resolvedUserId = auth.currentUser?.uid || user?.id;
    const resolvedUsername = (user?.username || '').trim();

    if (!resolvedUserId) {
      toast({
        title: 'Sesión no lista',
        description: 'Aún no detectamos tu sesión. Vuelve a intentar en un momento.',
        variant: 'destructive',
      });
      return;
    }

    if (!resolvedUsername || resolvedUsername.toLowerCase() === 'invitado') {
      toast({
        title: 'Falta tu nickname',
        description: 'Primero elige tu nickname para publicar una esencia.',
      });
      return;
    }

    setIsCreating(true);
    try {
      await createEsencia(resolvedUserId, resolvedUsername, user?.avatar || '', mensaje);
      toast({
        title: 'Esencia publicada',
        description: 'Tu esencia estará visible durante 5 minutos.',
      });
      setIsModalOpen(false);
    } catch (error) {
      console.error('[ESENCIAS] Error creando esencia:', error);
      toast({
        title: 'No se pudo publicar',
        description: error?.message || 'Intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <aside className="hidden xl:flex w-80 2xl:w-96 h-full flex-col border-l border-border bg-card/35 backdrop-blur-sm">
        <div className="p-4 border-b border-border/80">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Esencias
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">Usuarios recientemente aquí</p>
            </div>
            <Button
              size="sm"
              className="h-8 px-2.5 text-xs"
              onClick={handleOpenModal}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Crear
            </Button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide p-3 space-y-2">
          {isLoading && (
            <div className="text-sm text-muted-foreground py-6 text-center">Cargando esencias...</div>
          )}

          {!isLoading && errorMessage && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300 flex items-start gap-2">
              <RefreshCw className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {!isLoading && !errorMessage && esencias.length === 0 && (
            <div className="rounded-xl border border-border/50 bg-secondary/25 p-4 text-center">
              <p className="text-sm text-muted-foreground">Aún no hay esencias activas.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Sé el primero en dejar presencia.
              </p>
            </div>
          )}

          {!isLoading && !errorMessage && esencias.length > 0 && esencias.map((esencia) => (
            <EsenciaCard key={esencia.esenciaId || esencia.id} esencia={esencia} nowMs={nowMs} />
          ))}
        </div>
      </aside>

      {/* 📱 Móvil/Tablet: acceso rápido a Esencias */}
      <div className="xl:hidden">
        {showMobileHint && !isMobilePanelOpen && (
          <div className="fixed right-3 bottom-[8.2rem] z-[72] max-w-[12rem] rounded-xl border border-border/70 bg-card/95 backdrop-blur-md px-3 py-2 shadow-xl">
            <p className="text-[11px] font-medium text-foreground leading-tight">
              Nuevo: deja tu esencia para que otros sepan que estuviste aquí
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsMobilePanelOpen(true)}
          className="fixed right-3 bottom-[4.8rem] z-[70] rounded-full border border-border/80 bg-card/95 backdrop-blur-md px-3 py-2 shadow-xl active:scale-95 transition-transform flex items-center gap-2"
          aria-label="Abrir panel de esencias"
        >
          <span className="relative">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            {esencias.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            )}
          </span>
          <span className="text-xs font-semibold text-foreground">Esencias</span>
          <span className="text-[10px] rounded-full bg-primary/20 text-primary px-1.5 py-0.5 font-semibold">
            {esencias.length}
          </span>
        </button>

        {isMobilePanelOpen && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-[1px]"
              onClick={() => setIsMobilePanelOpen(false)}
              aria-label="Cerrar panel de esencias"
            />

            <section
              className="fixed inset-x-2 bottom-2 z-[81] max-h-[74vh] rounded-2xl border border-border bg-card/95 backdrop-blur-md shadow-2xl flex flex-col overflow-hidden"
              style={{ paddingBottom: 'max(0.4rem, env(safe-area-inset-bottom))' }}
            >
              <div className="p-3 border-b border-border/80 flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    Esencias
                  </h3>
                  <p className="text-[11px] text-muted-foreground">Usuarios recientemente aquí</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button size="sm" className="h-8 px-2.5 text-xs" onClick={handleOpenModal}>
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Crear
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={() => setIsMobilePanelOpen(false)}
                    aria-label="Cerrar panel de esencias"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide p-3 space-y-2">
                {isLoading && (
                  <div className="text-sm text-muted-foreground py-6 text-center">Cargando esencias...</div>
                )}

                {!isLoading && errorMessage && (
                  <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300 flex items-start gap-2">
                    <RefreshCw className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {!isLoading && !errorMessage && esencias.length === 0 && (
                  <div className="rounded-xl border border-border/50 bg-secondary/25 p-4 text-center">
                    <p className="text-sm text-muted-foreground">Aún no hay esencias activas.</p>
                    <p className="text-xs text-muted-foreground mt-1">Sé el primero en dejar presencia.</p>
                  </div>
                )}

                {!isLoading && !errorMessage && esencias.length > 0 && esencias.map((esencia) => (
                  <EsenciaCard key={esencia.esenciaId || esencia.id} esencia={esencia} nowMs={nowMs} />
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      <CreateEsenciaModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateEsencia}
        isSubmitting={isCreating}
      />
    </>
  );
};

export default EsenciasColumn;
