/**
 * OpinFeedPage - Tablón de notas (diseño lista compacta)
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Sparkles, RefreshCw, Eye, UserPlus, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getOpinFeed, canCreatePost } from '@/services/opinService';
import { requestNotificationPermission, canRequestPush, isPushEnabled } from '@/services/pushNotificationService';
import OpinCard from '@/components/opin/OpinCard';
import OpinCommentsModal from '@/components/opin/OpinCommentsModal';
import { toast } from '@/components/ui/use-toast';
import { trackPageView, trackPageExit, track } from '@/services/eventTrackingService';

const OPIN_FEED_LIMIT = 200;
const isRunningStandalone = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches
    || Boolean(window.navigator?.standalone)
    || document.referrer.includes('android-app://');
};

const OpinFeedPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canCreate, setCanCreate] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showIntentCta, setShowIntentCta] = useState(false);
  const [isInstalled, setIsInstalled] = useState(isRunningStandalone());
  const [pushEnabled, setPushEnabled] = useState(isPushEnabled());
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null);
  const [activatingPush, setActivatingPush] = useState(false);
  const pageStartRef = useRef(Date.now());

  const isReadOnlyMode = !user || user.isAnonymous || user.isGuest;

  useEffect(() => {
    if (!posts.length) return;

    const params = new URLSearchParams(location.search);
    const postId = params.get('postId');
    const openComments = params.get('openComments') === '1';
    if (!postId || !openComments) return;

    const targetPost = posts.find((post) => post.id === postId);
    if (!targetPost) return;

    setSelectedPost(targetPost);
    setShowCommentsModal(true);
  }, [location.search, posts]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredInstallPrompt(event);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (!user || user.isAnonymous || user.isGuest) {
      setShowIntentCta(false);
      return;
    }

    const params = new URLSearchParams(location.search);
    const fromComposer = params.get('fromComposer') === '1';
    const sessionPosted = sessionStorage.getItem('opin:just_posted') === '1';
    const dismissedKey = `opin:intent_cta:dismissed:${user.id}`;
    const dismissed = sessionStorage.getItem(dismissedKey) === '1';
    const needsNudge = !isInstalled || !pushEnabled;

    if (dismissed || !needsNudge || (!fromComposer && !sessionPosted)) {
      if (!needsNudge) setShowIntentCta(false);
      return;
    }

    setShowIntentCta(true);
  }, [user, location.search, isInstalled, pushEnabled]);

  // ✅ SEO: Meta tags para OPIN
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Tablón Gay Chile 📝 Qué Buscan Hoy | Chactivo";

    let metaDescription = document.querySelector('meta[name="description"]');
    const previousDescription = metaDescription?.content || '';

    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = "Tablón de notas de la comunidad gay en Chile. Mira qué buscan otros usuarios hoy. Deja tu nota anónima y conecta. Actualizado cada hora.";

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = 'https://chactivo.com/opin';

    return () => {
      document.title = previousTitle;
      if (metaDescription && previousDescription) {
        metaDescription.content = previousDescription;
      }
    };
  }, []);

  useEffect(() => {
    pageStartRef.current = Date.now();
    trackPageView('/opin', 'Tablón OPIN', { user });
    track('opin_feed_view', { page_path: '/opin' }, { user });

    return () => {
      const timeOnPage = Math.round((Date.now() - pageStartRef.current) / 1000);
      trackPageExit('/opin', timeOnPage, { user });
    };
  }, [user]);

  useEffect(() => {
    loadFeed();
    checkCanCreate();
  }, []);

  // OPIN: Reacomodar tarjetas cada 10 minutos (visibilidad igual para todos)
  useEffect(() => {
    const interval = setInterval(() => {
      setPosts((prev) => {
        if (prev.length <= 1) return prev;
        const a = [...prev];
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
      });
    }, 10 * 60 * 1000); // 10 minutos
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const key = user?.id || user?.guestId || 'anon';
    localStorage.setItem(`opin_visited:${key}`, '1');
  }, [user]);

  const shufflePosts = (postsToShuffle) => {
    const a = [...postsToShuffle];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const handleRestart = () => {
    if (posts.length === 0) {
      loadFeed();
      return;
    }
    setPosts(shufflePosts(posts));
    toast({ description: 'Tablón reordenado', duration: 2000 });
  };

  const loadFeed = async () => {
    setLoading(true);
    try {
      const feedPosts = await getOpinFeed(OPIN_FEED_LIMIT);
      setPosts(feedPosts);
    } catch (error) {
      console.error('Error cargando feed:', error);
      setPosts([]);
      toast({ description: error?.message || 'No se pudo cargar el tablón', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const checkCanCreate = async () => {
    if (!user || user.isAnonymous) {
      setCanCreate(false);
      return;
    }
    const result = await canCreatePost();
    setCanCreate(result.canCreate);
  };

  const handleCommentsClick = (post) => {
    setSelectedPost(post);
    setShowCommentsModal(true);
  };

  const clearComposerIntentFlags = () => {
    sessionStorage.removeItem('opin:just_posted');
    const params = new URLSearchParams(location.search);
    if (!params.has('fromComposer')) return;
    params.delete('fromComposer');
    const query = params.toString();
    navigate(query ? `/opin?${query}` : '/opin', { replace: true });
  };

  const handleEnablePushForOpin = async () => {
    if (activatingPush) return;
    if (!canRequestPush()) {
      toast({ description: 'Ya definiste permisos de notificación en este navegador.' });
      return;
    }

    setActivatingPush(true);
    try {
      const token = await requestNotificationPermission();
      const granted = Boolean(token) || isPushEnabled();
      setPushEnabled(granted);
      if (granted) {
        toast({ description: 'Notificaciones activadas. Te avisaremos cuando respondan tu OPIN.' });
      } else {
        toast({ description: 'No se activaron las notificaciones.', variant: 'destructive' });
      }
    } finally {
      setActivatingPush(false);
    }
  };

  const handleInstallForOpin = async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const result = await deferredInstallPrompt.userChoice.catch(() => ({ outcome: 'dismissed' }));
      if (result?.outcome === 'accepted') {
        toast({ description: 'Instalación iniciada. Te avisaremos cuando alguien responda.' });
      }
      setDeferredInstallPrompt(null);
      return;
    }

    toast({
      description: 'Abre el menú del navegador y selecciona "Instalar app" o "Agregar a pantalla de inicio".',
    });
  };

  const handleDismissIntentCta = () => {
    if (user?.id) {
      sessionStorage.setItem(`opin:intent_cta:dismissed:${user.id}`, '1');
    }
    setShowIntentCta(false);
    clearComposerIntentFlags();
  };

  useEffect(() => {
    if (!user || user.isAnonymous || user.isGuest) return;
    const params = new URLSearchParams(location.search);
    const fromComposer = params.get('fromComposer') === '1';
    const sessionPosted = sessionStorage.getItem('opin:just_posted') === '1';
    if (!fromComposer && !sessionPosted) return;
    if (!isInstalled || !pushEnabled) return;
    clearComposerIntentFlags();
    setShowIntentCta(false);
  }, [user, location.search, isInstalled, pushEnabled]);

  const handleCloseCommentsModal = () => {
    setShowCommentsModal(false);
    const params = new URLSearchParams(location.search);
    if (!params.has('postId') && !params.has('openComments')) return;
    params.delete('postId');
    params.delete('openComments');
    const query = params.toString();
    navigate(query ? `/opin?${query}` : '/opin', { replace: true });
  };

  const handlePostDeleted = (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    setCanCreate(true);
  };

  const handleCreatePost = () => {
    if (!user) {
      toast({ description: 'Inicia sesión para dejar una nota' });
      navigate('/auth');
      return;
    }
    if (user.isAnonymous) {
      toast({ description: 'Regístrate para dejar notas' });
      return;
    }
    if (!canCreate) {
      toast({ description: 'Espera 2 horas entre cada nota' });
      return;
    }
    navigate('/opin/new');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header compacto */}
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-1.5 -ml-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h1 className="text-lg font-bold">Tablón</h1>
              </div>
              {isReadOnlyMode && (
                <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs">
                  Solo lectura
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadFeed}
                disabled={loading}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              {!isReadOnlyMode && (
                <button
                  onClick={handleCreatePost}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Dejar nota</span>
                </button>
              )}
            </div>
          </div>

          {/* Subtítulo */}
          <p className="text-xs text-muted-foreground mt-1">
            {posts.length > 0 ? `${posts.length} notas activas` : 'Notas de la comunidad'}
          </p>
        </div>
      </div>

      {/* Banner para invitados */}
      {isReadOnlyMode && (
        <div className="bg-gradient-to-r from-purple-600/90 to-pink-600/90 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-white text-sm">
              <Eye className="w-4 h-4" />
              <span>Estás mirando el tablón</span>
            </div>
            <button
              onClick={() => navigate('/auth')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-purple-600 text-sm font-medium"
            >
              <UserPlus className="w-4 h-4" />
              <span>Registrarse</span>
            </button>
          </div>
        </div>
      )}

      {/* Lista de notas */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent" />
            </div>
          ) : posts.length === 0 ? (
            /* Empty state compacto */
            <div className="text-center py-16 px-4">
              <Sparkles className="w-12 h-12 mx-auto text-purple-400/50 mb-4" />
              <p className="text-lg font-medium mb-2">El tablón está vacío</p>
              <p className="text-sm text-muted-foreground mb-6">
                Sé el primero en dejar una nota
              </p>
              {!isReadOnlyMode && canCreate && (
                <button
                  onClick={handleCreatePost}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium"
                >
                  Dejar mi nota
                </button>
              )}
            </div>
          ) : (
            /* Lista de notas */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 p-3">
              {posts.map((post) => (
                <OpinCard
                  key={post.id}
                  post={post}
                  onCommentsClick={handleCommentsClick}
                  onPostDeleted={handlePostDeleted}
                  isReadOnlyMode={isReadOnlyMode}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Botón flotante móvil (solo usuarios logueados) */}
      {!isReadOnlyMode && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={handleCreatePost}
          className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg flex items-center justify-center sm:hidden"
        >
          <Plus className="w-6 h-6 text-white" />
        </motion.button>
      )}

      {/* Modal de respuestas */}
      {showCommentsModal && selectedPost && (
        <OpinCommentsModal
          post={selectedPost}
          open={showCommentsModal}
          onClose={handleCloseCommentsModal}
        />
      )}

      {!isReadOnlyMode && showIntentCta && (
        <div className="px-3 pt-3">
          <div className="max-w-7xl mx-auto rounded-xl border border-fuchsia-500/40 bg-fuchsia-500/10 p-3">
            <p className="text-sm text-foreground font-medium">
              Tu nota ya está en el tablón. Activa avisos para volver cuando te respondan.
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {!pushEnabled && canRequestPush() && (
                <button
                  onClick={handleEnablePushForOpin}
                  disabled={activatingPush}
                  className="px-3 py-1.5 rounded-full bg-cyan-500 text-black text-xs font-semibold disabled:opacity-60"
                >
                  {activatingPush ? 'Activando...' : 'Activar avisos'}
                </button>
              )}
              {!isInstalled && (
                <button
                  onClick={handleInstallForOpin}
                  className="px-3 py-1.5 rounded-full bg-fuchsia-500 text-white text-xs font-semibold"
                >
                  Instalar app
                </button>
              )}
              <button
                onClick={handleDismissIntentCta}
                className="px-3 py-1.5 rounded-full bg-white/10 text-foreground text-xs font-medium"
              >
                Ahora no
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OpinFeedPage;
