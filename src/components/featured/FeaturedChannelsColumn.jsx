import React, { useEffect, useMemo, useState } from 'react';
import { Megaphone, Plus, RefreshCw, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import FeaturedChannelCard from '@/components/featured/FeaturedChannelCard';
import { subscribeFeaturedAdsPublic, trackFeaturedAdClick } from '@/services/featuredAdsService';

const FeaturedChannelsColumn = ({
  showMobileLauncher = true,
  mobilePanelOpen,
  onMobilePanelOpenChange,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ads, setAds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [internalMobilePanelOpen, setInternalMobilePanelOpen] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const [showMobileHint, setShowMobileHint] = useState(false);

  const isMobilePanelOpen = typeof mobilePanelOpen === 'boolean' ? mobilePanelOpen : internalMobilePanelOpen;
  const setIsMobilePanelOpen = onMobilePanelOpenChange || setInternalMobilePanelOpen;
  const isAdminUser = user?.role === 'admin' || user?.role === 'administrator';

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeFeaturedAdsPublic(
      (items) => {
        setAds(items);
        setErrorMessage('');
        setIsLoading(false);
      },
      () => {
        setErrorMessage('No se pudieron cargar los canales destacados.');
        setIsLoading(false);
      }
    );
    return () => unsubscribe?.();
  }, [refreshTick]);

  useEffect(() => {
    if (!showMobileLauncher) return;
    if (typeof window === 'undefined') return;
    if (window.innerWidth >= 1280) return;
    if (sessionStorage.getItem('featured_channels_mobile_hint_v1')) return;

    setShowMobileHint(true);
    const hideTimer = setTimeout(() => {
      setShowMobileHint(false);
      sessionStorage.setItem('featured_channels_mobile_hint_v1', '1');
    }, 7000);

    return () => clearTimeout(hideTimer);
  }, [showMobileLauncher]);

  const onRefresh = () => {
    setRefreshTick((prev) => prev + 1);
    toast({
      title: 'Canales actualizados',
      description: 'Se recargo la lista de anuncios.',
    });
  };

  const openAd = (ad) => {
    if (!ad?.url) return;
    trackFeaturedAdClick(ad.id);
    window.open(ad.url, '_blank', 'noopener,noreferrer');
  };

  const hasAds = useMemo(() => ads.length > 0, [ads.length]);

  const renderBody = () => (
    <div
      className="featured-scroll flex-1 min-h-0 overflow-y-auto p-3 space-y-2.5"
      style={{ maxHeight: 'min(calc(100vh - 160px), 760px)' }}
    >
      {isLoading && (
        <div className="text-sm text-muted-foreground py-6 text-center">Cargando canales destacados...</div>
      )}

      {!isLoading && errorMessage && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
          {errorMessage}
        </div>
      )}

      {!isLoading && !errorMessage && !hasAds && (
        <div className="rounded-xl border border-border/50 bg-secondary/25 p-4 text-center">
          <p className="text-sm text-muted-foreground">No hay anuncios activos por ahora.</p>
        </div>
      )}

      {!isLoading && !errorMessage && hasAds && ads.map((ad) => (
        <FeaturedChannelCard
          key={ad.id}
          ad={ad}
          onOpen={openAd}
        />
      ))}
    </div>
  );

  return (
    <>
      <aside className="hidden xl:flex w-80 2xl:w-96 h-full flex-col border-l border-border bg-card/35 backdrop-blur-sm">
        <div className="p-4 border-b border-border/80">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-cyan-400" />
                Canales Destacados
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">Promos y canales recomendados</p>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-cyan-400"
                onClick={onRefresh}
                title="Actualizar"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              {isAdminUser && (
                <Button
                  size="sm"
                  className="h-8 px-2.5 text-xs"
                  onClick={() => navigate('/admin')}
                  title="Agregar anuncio (admin)"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Agregar
                </Button>
              )}
            </div>
          </div>
        </div>
        {renderBody()}
      </aside>

      <div className="xl:hidden">
        {showMobileLauncher && showMobileHint && !isMobilePanelOpen && (
          <div className="fixed right-3 bottom-[8.2rem] z-[72] max-w-[12rem] rounded-xl border border-border/70 bg-card/95 backdrop-blur-md px-3 py-2 shadow-xl">
            <p className="text-[11px] font-medium text-foreground leading-tight">
              Canales destacados: promos y contenido recomendado
            </p>
          </div>
        )}

        {showMobileLauncher && (
          <button
            type="button"
            onClick={() => setIsMobilePanelOpen(true)}
            className="fixed right-3 bottom-[4.8rem] z-[70] rounded-full border border-border/80 bg-card/95 backdrop-blur-md px-3 py-2 shadow-xl active:scale-95 transition-transform flex items-center gap-2"
            aria-label="Abrir canales destacados"
          >
            <Megaphone className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-foreground">Canales</span>
            <span className="text-[10px] rounded-full bg-primary/20 text-primary px-1.5 py-0.5 font-semibold">
              {ads.length}
            </span>
          </button>
        )}

        {isMobilePanelOpen && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-[1px]"
              onClick={() => setIsMobilePanelOpen(false)}
              aria-label="Cerrar panel de canales destacados"
            />

            <section
              className="fixed inset-x-2 bottom-2 z-[81] max-h-[74vh] rounded-2xl border border-border bg-card/95 backdrop-blur-md shadow-2xl flex flex-col overflow-hidden"
              style={{ paddingBottom: 'max(0.4rem, env(safe-area-inset-bottom))' }}
            >
              <div className="p-3 border-b border-border/80 flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Megaphone className="w-4 h-4 text-cyan-400" />
                    Canales Destacados
                  </h3>
                  <p className="text-[11px] text-muted-foreground">Promos y canales recomendados</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-cyan-400"
                    onClick={onRefresh}
                    title="Actualizar"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={() => setIsMobilePanelOpen(false)}
                    aria-label="Cerrar panel de canales destacados"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="featured-scroll flex-1 min-h-0 overflow-y-auto p-3 space-y-2.5">
                {!isLoading && !errorMessage && ads.map((ad) => (
                  <FeaturedChannelCard
                    key={ad.id}
                    ad={ad}
                    onOpen={openAd}
                  />
                ))}
                {isLoading && (
                  <div className="text-sm text-muted-foreground py-6 text-center">Cargando canales destacados...</div>
                )}
                {!isLoading && errorMessage && (
                  <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
                    {errorMessage}
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
};

export default FeaturedChannelsColumn;
