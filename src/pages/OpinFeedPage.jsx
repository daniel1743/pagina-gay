/**
 * OpinFeedPage - Tablón de notas con señales de retorno
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Sparkles, RefreshCw, Eye, UserPlus, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getOpinFeed, canCreatePost, getOpinPostActivityMs, getReactionTotalFromCounts } from '@/services/opinService';
import { requestNotificationPermission, canRequestPush, isPushEnabled } from '@/services/pushNotificationService';
import OpinCard from '@/components/opin/OpinCard';
import OpinCommentsModal from '@/components/opin/OpinCommentsModal';
import { toast } from '@/components/ui/use-toast';
import { trackPageView, trackPageExit, track } from '@/services/eventTrackingService';

const OPIN_FEED_LIMIT = 200;
const FOLLOWED_STORAGE_PREFIX = 'opin:followed_posts:';
const LAST_VISIT_STORAGE_PREFIX = 'opin:last_visit_at:';
const SNAPSHOT_STORAGE_PREFIX = 'opin:own_snapshot:';

const isRunningStandalone = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches
    || Boolean(window.navigator?.standalone)
    || document.referrer.includes('android-app://');
};

const getStorageUserKey = (user) => user?.id || user?.uid || user?.guestId || 'anon';

const shufflePosts = (postsToShuffle) => {
  const a = [...postsToShuffle];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const hasNewActivitySince = (post, previousVisitAt) => (
  previousVisitAt > 0 && getOpinPostActivityMs(post) > previousVisitAt
);

const buildOwnSnapshot = (posts, userId) => (
  posts
    .filter((post) => post.userId === userId)
    .reduce((acc, post) => {
      acc[post.id] = {
        viewCount: Number(post.viewCount || 0),
        commentCount: Number(post.commentCount || 0),
        likeCount: Number(post.likeCount || 0),
        reactionTotal: getReactionTotalFromCounts(post.reactionCounts || {}),
      };
      return acc;
    }, {})
);

const computeActivitySummary = (posts, userId, snapshot) => {
  if (!userId || !snapshot || Object.keys(snapshot).length === 0) return null;

  const ownPosts = posts.filter((post) => post.userId === userId);
  if (ownPosts.length === 0) return null;

  const summary = ownPosts.reduce((acc, post) => {
    const previous = snapshot[post.id] || {
      viewCount: 0,
      commentCount: 0,
      likeCount: 0,
      reactionTotal: 0,
    };

    const newViews = Math.max(0, Number(post.viewCount || 0) - previous.viewCount);
    const newReplies = Math.max(0, Number(post.commentCount || 0) - previous.commentCount);
    const newLikes = Math.max(0, Number(post.likeCount || 0) - previous.likeCount);
    const newReactions = Math.max(0, getReactionTotalFromCounts(post.reactionCounts || {}) - previous.reactionTotal);
    const newInterest = newLikes + newReactions;

    if (newViews > 0 || newReplies > 0 || newInterest > 0) {
      acc.postsWithChanges += 1;
    }

    acc.newViews += newViews;
    acc.newReplies += newReplies;
    acc.newInterest += newInterest;
    return acc;
  }, {
    newViews: 0,
    newReplies: 0,
    newInterest: 0,
    postsWithChanges: 0,
  });

  return {
    ...summary,
    hasAnyChange: summary.newViews > 0 || summary.newReplies > 0 || summary.newInterest > 0,
  };
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
  const [activeFilter, setActiveFilter] = useState('all');
  const [followedPostIds, setFollowedPostIds] = useState([]);
  const [previousVisitAt, setPreviousVisitAt] = useState(0);
  const [activitySummary, setActivitySummary] = useState(null);
  const pageStartRef = useRef(Date.now());
  const postsRef = useRef([]);

  const isReadOnlyMode = !user || user.isAnonymous || user.isGuest;
  const currentUserId = user?.id || user?.uid || null;
  const storageUserKey = useMemo(() => getStorageUserKey(user), [user?.id, user?.uid, user?.guestId]);
  const pushTokenCount = Array.isArray(user?.fcmTokens) ? user.fcmTokens.length : 0;
  const lastVisitStorageKey = `${LAST_VISIT_STORAGE_PREFIX}${storageUserKey}`;
  const followedStorageKey = `${FOLLOWED_STORAGE_PREFIX}${storageUserKey}`;
  const snapshotStorageKey = `${SNAPSHOT_STORAGE_PREFIX}${storageUserKey}`;

  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);

  // Push "realmente activo" = permiso navegador + estado backend + token presente.
  useEffect(() => {
    if (!user || user.isAnonymous || user.isGuest) {
      setPushEnabled(isPushEnabled());
      return;
    }

    const browserGranted = isPushEnabled();
    const backendEnabled = user?.pushEnabled === true;
    const hasToken = pushTokenCount > 0;
    setPushEnabled(browserGranted && backendEnabled && hasToken);
  }, [user, pushTokenCount]);

  useEffect(() => {
    try {
      const previousVisitRaw = localStorage.getItem(lastVisitStorageKey);
      setPreviousVisitAt(previousVisitRaw ? Number(previousVisitRaw) : 0);
    } catch {
      setPreviousVisitAt(0);
    }

    try {
      const rawFollowed = localStorage.getItem(followedStorageKey);
      const parsed = rawFollowed ? JSON.parse(rawFollowed) : [];
      setFollowedPostIds(Array.isArray(parsed) ? parsed.filter(Boolean) : []);
    } catch {
      setFollowedPostIds([]);
    }
  }, [lastVisitStorageKey, followedStorageKey]);

  useEffect(() => {
    if (!currentUserId || posts.length === 0) {
      setActivitySummary(null);
      return;
    }

    try {
      const rawSnapshot = localStorage.getItem(snapshotStorageKey);
      const parsedSnapshot = rawSnapshot ? JSON.parse(rawSnapshot) : null;
      setActivitySummary(computeActivitySummary(posts, currentUserId, parsedSnapshot));
    } catch {
      setActivitySummary(null);
    }
  }, [posts, currentUserId, snapshotStorageKey]);

  useEffect(() => {
    return () => {
      try {
        localStorage.setItem(lastVisitStorageKey, String(Date.now()));
        if (currentUserId) {
          localStorage.setItem(
            snapshotStorageKey,
            JSON.stringify(buildOwnSnapshot(postsRef.current, currentUserId)),
          );
        }
      } catch {
        // noop
      }
    };
  }, [currentUserId, lastVisitStorageKey, snapshotStorageKey]);

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
    if (!selectedPost?.id) return;
    const nextSelectedPost = posts.find((post) => post.id === selectedPost.id);
    if (nextSelectedPost) {
      setSelectedPost(nextSelectedPost);
    }
  }, [posts, selectedPost?.id]);

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
    const dismissedKey = `opin:intent_cta:dismissed:${currentUserId || ''}`;

    if (fromComposer || sessionPosted) {
      sessionStorage.removeItem(dismissedKey);
    }

    const dismissed = sessionStorage.getItem(dismissedKey) === '1';
    const needsNudge = !isInstalled || !pushEnabled;

    if (dismissed || !needsNudge || (!fromComposer && !sessionPosted)) {
      if (!needsNudge) setShowIntentCta(false);
      return;
    }

    setShowIntentCta(true);
  }, [user, currentUserId, location.search, isInstalled, pushEnabled]);

  // SEO
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Tablón Gay Chile 📝 Qué Buscan Hoy | Chactivo';

    let metaDescription = document.querySelector('meta[name="description"]');
    const previousDescription = metaDescription?.content || '';

    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = 'Tablón de notas de la comunidad gay en Chile. Mira qué buscan otros usuarios hoy. Deja tu nota, recibe respuestas y vuelve cuando haya actividad.';

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
  }, [currentUserId, user?.isAnonymous, user?.isGuest]);

  // Reacomodar tarjetas cada 10 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      setPosts((prev) => (prev.length <= 1 ? prev : shufflePosts(prev)));
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem(`opin_visited:${storageUserKey}`, '1');
  }, [storageUserKey]);

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
    if (currentUserId) {
      sessionStorage.setItem(`opin:intent_cta:dismissed:${currentUserId}`, '1');
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
    setPosts((prev) => prev.filter((post) => post.id !== postId));
    setCanCreate(true);
  };

  const handlePostUpdated = (postId, patch) => {
    setPosts((prev) => prev.map((post) => (
      post.id === postId ? { ...post, ...patch } : post
    )));
    setSelectedPost((prev) => (prev?.id === postId ? { ...prev, ...patch } : prev));
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

  const handleRestart = () => {
    if (posts.length === 0) {
      loadFeed();
      return;
    }
    setPosts((prev) => shufflePosts(prev));
    toast({ description: 'Tablón reordenado', duration: 2000 });
  };

  const handleFilterChange = (nextFilter) => {
    setActiveFilter(nextFilter);
    track('opin_filter_change', { filter: nextFilter }, { user }).catch(() => {});
  };

  const handleToggleFollow = (post) => {
    const isFollowing = followedPostIds.includes(post.id);
    const nextIds = isFollowing
      ? followedPostIds.filter((id) => id !== post.id)
      : [...followedPostIds, post.id];

    setFollowedPostIds(nextIds);
    try {
      localStorage.setItem(followedStorageKey, JSON.stringify(nextIds));
    } catch {
      // noop
    }

    toast({
      description: isFollowing
        ? 'Dejaste de seguir esta nota.'
        : 'Nota guardada en Seguidos para volver más fácil.',
    });
    track('opin_follow_toggle', { post_id: post.id, following: !isFollowing }, { user }).catch(() => {});
  };

  const followedPostSet = useMemo(() => new Set(followedPostIds), [followedPostIds]);
  const ownPosts = useMemo(() => (
    currentUserId ? posts.filter((post) => post.userId === currentUserId) : []
  ), [posts, currentUserId]);
  const newActivityPosts = useMemo(() => (
    posts.filter((post) => hasNewActivitySince(post, previousVisitAt))
  ), [posts, previousVisitAt]);
  const followedPosts = useMemo(() => (
    posts.filter((post) => followedPostSet.has(post.id))
  ), [posts, followedPostSet]);

  const filters = [
    { id: 'all', label: 'Para ti', count: posts.length },
    { id: 'new_activity', label: 'Actividad nueva', count: newActivityPosts.length },
    { id: 'followed', label: 'Seguidos', count: followedPosts.length },
    ...(currentUserId ? [{ id: 'mine', label: 'Mis notas', count: ownPosts.length }] : []),
  ];

  const filteredPosts = useMemo(() => {
    switch (activeFilter) {
      case 'new_activity':
        return newActivityPosts;
      case 'followed':
        return followedPosts;
      case 'mine':
        return ownPosts;
      default:
        return posts;
    }
  }, [activeFilter, posts, newActivityPosts, followedPosts, ownPosts]);

  const emptyStateCopy = useMemo(() => {
    switch (activeFilter) {
      case 'new_activity':
        return {
          title: 'Sin novedades desde tu última visita',
          description: 'Cuando haya movimiento nuevo en OPIN aparecerá aquí.',
        };
      case 'followed':
        return {
          title: 'Aún no sigues notas',
          description: 'Usa "Seguir" en una nota para reunir aquí las que quieres revisar luego.',
        };
      case 'mine':
        return {
          title: 'Todavía no publicas una nota',
          description: 'Deja una nota para empezar a recibir respuestas y volver con un motivo claro.',
        };
      default:
        return {
          title: 'El tablón está vacío',
          description: 'Sé el primero en dejar una nota.',
        };
    }
  }, [activeFilter]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
                title="Recargar"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={handleRestart}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Reordenar"
              >
                <Sparkles className="w-4 h-4" />
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

          <p className="text-xs text-muted-foreground mt-1">
            {filteredPosts.length > 0 ? `${filteredPosts.length} notas en esta vista` : 'Notas de la comunidad'}
          </p>

          <div className="flex flex-wrap gap-2 mt-3">
            {filters.map((filter) => {
              const isActive = activeFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  onClick={() => handleFilterChange(filter.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-white text-black'
                      : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                  }`}
                >
                  {filter.label}
                  <span className={`ml-1 ${isActive ? 'text-black/70' : 'text-muted-foreground'}`}>
                    {filter.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

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

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-3">
          {!isReadOnlyMode && previousVisitAt > 0 && currentUserId && ownPosts.length > 0 && (
            <div className="mb-3 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4">
              <p className="text-sm font-semibold text-foreground">
                Desde tu última visita
              </p>
              {activitySummary?.hasAnyChange ? (
                <div className="flex flex-wrap gap-2 mt-2">
                  {activitySummary.newReplies > 0 && (
                    <span className="px-3 py-1 rounded-full bg-white/10 text-xs text-foreground">
                      {activitySummary.newReplies} respuestas nuevas
                    </span>
                  )}
                  {activitySummary.newViews > 0 && (
                    <span className="px-3 py-1 rounded-full bg-white/10 text-xs text-foreground">
                      {activitySummary.newViews} vistas nuevas
                    </span>
                  )}
                  {activitySummary.newInterest > 0 && (
                    <span className="px-3 py-1 rounded-full bg-white/10 text-xs text-foreground">
                      {activitySummary.newInterest} señales de interés
                    </span>
                  )}
                  <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-xs text-cyan-300">
                    {activitySummary.postsWithChanges} notas con movimiento
                  </span>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-2">
                  No hubo novedades en tus notas todavía. Si sigues publicaciones ajenas, revisa la pestaña `Seguidos`.
                </p>
              )}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent" />
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Sparkles className="w-12 h-12 mx-auto text-purple-400/50 mb-4" />
              <p className="text-lg font-medium mb-2">{emptyStateCopy.title}</p>
              <p className="text-sm text-muted-foreground mb-6">
                {emptyStateCopy.description}
              </p>
              {!isReadOnlyMode && canCreate && activeFilter !== 'followed' && (
                <button
                  onClick={handleCreatePost}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium"
                >
                  Dejar mi nota
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredPosts.map((post) => (
                <OpinCard
                  key={post.id}
                  post={post}
                  onCommentsClick={handleCommentsClick}
                  onPostDeleted={handlePostDeleted}
                  isReadOnlyMode={isReadOnlyMode}
                  isFollowed={followedPostSet.has(post.id)}
                  onToggleFollow={handleToggleFollow}
                  hasNewActivity={hasNewActivitySince(post, previousVisitAt)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

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

      {showCommentsModal && selectedPost && (
        <OpinCommentsModal
          post={selectedPost}
          open={showCommentsModal}
          onClose={handleCloseCommentsModal}
          onPostUpdated={handlePostUpdated}
        />
      )}

      {!isReadOnlyMode && showIntentCta && (
        <div className="px-3 pt-3">
          <div className="max-w-7xl mx-auto rounded-xl border border-fuchsia-500/40 bg-fuchsia-500/10 p-3">
            <p className="text-sm text-foreground font-medium">
              Tu nota ya está en el tablón. Activa avisos para volver cuando te respondan.
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {!pushEnabled && (
                <button
                  onClick={handleEnablePushForOpin}
                  disabled={activatingPush}
                  className="px-3 py-1.5 rounded-full bg-cyan-500 text-black text-xs font-semibold disabled:opacity-60"
                >
                  {activatingPush
                    ? (canRequestPush() ? 'Activando...' : 'Sincronizando...')
                    : 'Activar avisos'}
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
