/**
 * OpinFeedPage - OPIN con señales de retorno
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Sparkles, RefreshCw, Eye, UserPlus, ArrowLeft, MessageCircle, PencilLine, PauseCircle, Clock3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getOpinFeed,
  canCreatePost,
  getOpinPostActivityMs,
  getMyOpinPosts,
  getOpinStatusMeta,
  updateOpinStatus,
  isOpenOpinIntentStatus,
  getPersistedFollowedOpinPostIds,
  savePersistedFollowedOpinPostIds,
  getRecentReplyPreview,
} from '@/services/opinService';
import { requestNotificationPermission, canRequestPush, isPushEnabled } from '@/services/pushNotificationService';
import { sendPrivateChatRequestFromOpin } from '@/services/socialService';
import OpinCard from '@/components/opin/OpinCard';
import OpinCommentsModal from '@/components/opin/OpinCommentsModal';
import { toast } from '@/components/ui/use-toast';
import { trackPageView, trackPageExit, track } from '@/services/eventTrackingService';
import { sanitizeOpinPublicText } from '@/services/opinSafetyService';

const OPIN_FEED_LIMIT = 24;
const FOLLOWED_STORAGE_PREFIX = 'opin:followed_posts:';
const LAST_VISIT_STORAGE_PREFIX = 'opin:last_visit_at:';
const SNAPSHOT_STORAGE_PREFIX = 'opin:own_snapshot:';
const PASSIVE_REFRESH_DEBOUNCE_MS = 2500;
const OPIN_MAILBOX_OPTIONS = [
  { id: 'mailbox', label: 'Buzón', draft: 'Te dejo un mensaje en buzón: ' },
];

const isRunningStandalone = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches
    || Boolean(window.navigator?.standalone)
    || document.referrer.includes('android-app://');
};

const getStorageUserKey = (user) => user?.id || user?.uid || user?.guestId || 'anon';

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
        reactionTotal: Number(post.likeCount || 0),
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
    const newInterest = Math.max(0, Number(post.likeCount || 0) - previous.likeCount);

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

const computePostDelta = (post, snapshot) => {
  if (!post || !snapshot) {
    return { newViews: 0, newReplies: 0, newInterest: 0 };
  }

  const previous = snapshot[post.id] || {
    viewCount: 0,
    commentCount: 0,
    likeCount: 0,
    reactionTotal: 0,
  };

  const newViews = Math.max(0, Number(post.viewCount || 0) - previous.viewCount);
  const newReplies = Math.max(0, Number(post.commentCount || 0) - previous.commentCount);
  return {
    newViews,
    newReplies,
    newInterest: Math.max(0, Number(post.likeCount || 0) - previous.likeCount),
  };
};

const formatOpinFeedTimeAgo = (createdAt) => {
  if (!createdAt) return 'reciente';

  const created = createdAt?.toDate ? createdAt.toDate() : new Date(createdAt);
  const diffMs = Date.now() - created.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'ahora';
  if (diffMins < 60) return `hace ${diffMins}m`;
  if (diffHours < 24) return `hace ${diffHours}h`;
  if (diffDays < 7) return `hace ${diffDays}d`;
  if (diffDays < 30) return `hace ${Math.floor(diffDays / 7)}sem`;
  return `hace ${Math.floor(diffDays / 30)}mes`;
};

const OpinFeedPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userProfile } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canCreate, setCanCreate] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [commentsDraft, setCommentsDraft] = useState('');
  const [commentsDraftLabel, setCommentsDraftLabel] = useState('');
  const [showIntentCta, setShowIntentCta] = useState(false);
  const [isInstalled, setIsInstalled] = useState(isRunningStandalone());
  const [pushEnabled, setPushEnabled] = useState(isPushEnabled());
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null);
  const [activatingPush, setActivatingPush] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [followedPostIds, setFollowedPostIds] = useState([]);
  const [previousVisitAt, setPreviousVisitAt] = useState(0);
  const [activitySummary, setActivitySummary] = useState(null);
  const [ownSnapshot, setOwnSnapshot] = useState(null);
  const [myPosts, setMyPosts] = useState([]);
  const [myActiveIntent, setMyActiveIntent] = useState(null);
  const [updatingActiveIntent, setUpdatingActiveIntent] = useState(false);
  const [recentInterest, setRecentInterest] = useState([]);
  const [loadingRecentInterest, setLoadingRecentInterest] = useState(false);
  const [invitingInterestTargetId, setInvitingInterestTargetId] = useState(null);
  const [openOpportunityMailboxId, setOpenOpportunityMailboxId] = useState(null);
  const pageStartRef = useRef(Date.now());
  const postsRef = useRef([]);
  const passiveRefreshRef = useRef({ at: 0, reason: 'init' });

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

  useEffect(() => {
    if (!myPosts.length) return;
    postsRef.current = Array.from(new Map([...postsRef.current, ...myPosts].map((post) => [post.id, post])).values());
  }, [myPosts]);

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
    const loadLocalAndPersistedState = async () => {
      try {
        const previousVisitRaw = localStorage.getItem(lastVisitStorageKey);
        setPreviousVisitAt(previousVisitRaw ? Number(previousVisitRaw) : 0);
      } catch {
        setPreviousVisitAt(0);
      }

      let localFollowed = [];
      try {
        const rawFollowed = localStorage.getItem(followedStorageKey);
        const parsed = rawFollowed ? JSON.parse(rawFollowed) : [];
        localFollowed = Array.isArray(parsed) ? parsed.filter(Boolean) : [];
      } catch {
        localFollowed = [];
      }

      if (!currentUserId || isReadOnlyMode) {
        setFollowedPostIds(localFollowed);
        return;
      }

      try {
        const persistedFollowed = await getPersistedFollowedOpinPostIds();
        const merged = Array.from(new Set([...persistedFollowed, ...localFollowed]));
        setFollowedPostIds(merged);
        localStorage.setItem(followedStorageKey, JSON.stringify(merged));
        if (merged.length !== persistedFollowed.length) {
          await savePersistedFollowedOpinPostIds(merged);
        }
      } catch {
        setFollowedPostIds(localFollowed);
      }
    };

    loadLocalAndPersistedState();
  }, [lastVisitStorageKey, followedStorageKey, currentUserId, isReadOnlyMode]);

  useEffect(() => {
    if (!currentUserId || myPosts.length === 0) {
      setOwnSnapshot(null);
      setActivitySummary(null);
      return;
    }

    try {
      const rawSnapshot = localStorage.getItem(snapshotStorageKey);
      const parsedSnapshot = rawSnapshot ? JSON.parse(rawSnapshot) : null;
      setOwnSnapshot(parsedSnapshot);
      setActivitySummary(computeActivitySummary(myPosts, currentUserId, parsedSnapshot));
    } catch {
      setOwnSnapshot(null);
      setActivitySummary(null);
    }
  }, [myPosts, currentUserId, snapshotStorageKey]);

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
    if (!posts.length && !myPosts.length) return;

    const params = new URLSearchParams(location.search);
    const postId = params.get('postId');
    const openComments = params.get('openComments') === '1';
    if (!postId || !openComments) return;

    const targetPost = [...myPosts, ...posts].find((post) => post.id === postId);
    if (!targetPost) return;

    setSelectedPost(targetPost);
    setShowCommentsModal(true);
  }, [location.search, posts, myPosts]);

  useEffect(() => {
    if (!selectedPost?.id) return;
    const nextSelectedPost = [...myPosts, ...posts].find((post) => post.id === selectedPost.id);
    if (nextSelectedPost) {
      setSelectedPost(nextSelectedPost);
    }
  }, [posts, myPosts, selectedPost?.id]);

  useEffect(() => {
    const loadRecentInterest = async () => {
      if (!myActiveIntent?.id || isReadOnlyMode) {
        setRecentInterest([]);
        return;
      }

      setLoadingRecentInterest(true);
      try {
        const replies = await getRecentReplyPreview(myActiveIntent.id, 6);
        const deduped = [];
        const seenUserIds = new Set();

        replies.forEach((reply) => {
          const replyUserId = reply?.userId;
          if (!replyUserId || replyUserId === currentUserId || seenUserIds.has(replyUserId)) return;
          seenUserIds.add(replyUserId);
          deduped.push(reply);
        });

        setRecentInterest(deduped.slice(0, 4));
      } catch (error) {
        console.warn('[OPIN] No se pudo cargar interesados recientes:', error?.message || error);
        setRecentInterest([]);
      } finally {
        setLoadingRecentInterest(false);
      }
    };

    loadRecentInterest();
  }, [myActiveIntent?.id, currentUserId, isReadOnlyMode]);

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
    document.title = 'OPIN Gay Chile | Qué Buscan Hoy | Chactivo';

    let metaDescription = document.querySelector('meta[name="description"]');
    const previousDescription = metaDescription?.content || '';

    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = 'OPIN de la comunidad gay en Chile. Mira qué buscan otros usuarios hoy, deja tu intención, recibe respuestas y vuelve cuando haya movimiento real.';

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
    trackPageView('/opin', 'OPIN', { user });
    track('opin_feed_view', { page_path: '/opin' }, { user });

    return () => {
      const timeOnPage = Math.round((Date.now() - pageStartRef.current) / 1000);
      trackPageExit('/opin', timeOnPage, { user });
    };
  }, [user]);

  useEffect(() => {
    localStorage.setItem(`opin_visited:${storageUserKey}`, '1');
  }, [storageUserKey]);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      const feedPosts = await getOpinFeed(OPIN_FEED_LIMIT);
      setPosts(feedPosts);
    } catch (error) {
      console.error('Error cargando feed:', error);
      setPosts([]);
      toast({ description: error?.message || 'No se pudo cargar OPIN', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMyIntentContext = useCallback(async () => {
    if (!currentUserId || isReadOnlyMode) {
      setMyPosts([]);
      setMyActiveIntent(null);
      return;
    }

    try {
      const ownPostsData = await getMyOpinPosts(8);
      const activeIntentData = ownPostsData.find((post) => (
        post.isStable !== true
        && post.isActive !== false
        && isOpenOpinIntentStatus(post.status)
      )) || null;
      setMyPosts(ownPostsData);
      setMyActiveIntent(activeIntentData);
    } catch (error) {
      console.warn('[OPIN] No se pudo cargar contexto del usuario:', error?.message || error);
      setMyPosts([]);
      setMyActiveIntent(null);
    }
  }, [currentUserId, isReadOnlyMode]);

  const checkCanCreate = useCallback(async () => {
    if (!user || user.isAnonymous) {
      setCanCreate(false);
      return;
    }
    const result = await canCreatePost();
    setCanCreate(result.canCreate);
  }, [user]);

  const refreshOpinState = useCallback(async ({ reason = 'manual', force = false } = {}) => {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return;
    }

    const now = Date.now();
    if (!force && (now - passiveRefreshRef.current.at) < PASSIVE_REFRESH_DEBOUNCE_MS) {
      return;
    }

    passiveRefreshRef.current = { at: now, reason };

    await Promise.allSettled([
      loadFeed(),
      loadMyIntentContext(),
      checkCanCreate(),
    ]);
  }, [checkCanCreate, loadFeed, loadMyIntentContext]);

  useEffect(() => {
    refreshOpinState({ reason: 'mount', force: true });
  }, [refreshOpinState]);

  useEffect(() => {
    const handleWindowFocus = () => {
      refreshOpinState({ reason: 'focus' });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      refreshOpinState({ reason: 'visibility' });
    };

    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshOpinState]);

  const handleCommentsClick = (post, options = {}) => {
    setSelectedPost(post);
    setCommentsDraft(options.initialCommentDraft || '');
    setCommentsDraftLabel(options.initialCommentLabel || '');
    setShowCommentsModal(true);
    setOpenOpportunityMailboxId(null);
  };

  const handleOpenMailbox = (post, option) => {
    handleCommentsClick(post, {
      initialCommentDraft: option?.draft || '',
      initialCommentLabel: option?.label || '',
    });
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
    setCommentsDraft('');
    setCommentsDraftLabel('');
    const params = new URLSearchParams(location.search);
    if (!params.has('postId') && !params.has('openComments')) return;
    params.delete('postId');
    params.delete('openComments');
    const query = params.toString();
    navigate(query ? `/opin?${query}` : '/opin', { replace: true });
  };

  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId));
    setMyPosts((prev) => prev.filter((post) => post.id !== postId));
    setMyActiveIntent((prev) => (prev?.id === postId ? null : prev));
    setCanCreate(true);
  };

  const handlePostUpdated = (postId, patch) => {
    setPosts((prev) => prev.map((post) => (
      post.id === postId ? { ...post, ...patch } : post
    )));
    setMyPosts((prev) => prev.map((post) => (
      post.id === postId ? { ...post, ...patch } : post
    )));
    setMyActiveIntent((prev) => (prev?.id === postId ? { ...prev, ...patch } : prev));
    setSelectedPost((prev) => (prev?.id === postId ? { ...prev, ...patch } : prev));
  };

  const handleCreatePost = () => {
    if (!user) {
      toast({ description: 'Inicia sesión para abrir una intención' });
      navigate('/auth');
      return;
    }
    if (user.isAnonymous) {
      toast({ description: 'Regístrate para abrir una intención' });
      return;
    }
    if (myActiveIntent?.id) {
      navigate(`/opin/new?edit=${myActiveIntent.id}`);
      return;
    }
    if (!canCreate) {
      toast({ description: 'Ya tienes una intención activa o debes esperar para abrir otra.' });
      return;
    }
    navigate('/opin/new');
  };

  const handleCloseActiveIntent = async () => {
    if (!myActiveIntent?.id || updatingActiveIntent) return;

    setUpdatingActiveIntent(true);
    try {
      await updateOpinStatus(myActiveIntent.id, 'cerrado');
      const patch = { status: 'cerrado', lastInteractionAt: new Date() };
      handlePostUpdated(myActiveIntent.id, patch);
      setMyActiveIntent(null);
      setCanCreate(true);
      toast({ description: 'Tu intención quedó cerrada.' });
    } catch (error) {
      toast({ description: error?.message || 'No se pudo cerrar la intención.', variant: 'destructive' });
    } finally {
      setUpdatingActiveIntent(false);
    }
  };

  const handleOpenActiveIntent = () => {
    if (!myActiveIntent) return;
    setSelectedPost(myActiveIntent);
    setShowCommentsModal(true);
  };

  const getInterestInviteErrorMessage = (error) => {
    switch (error?.message) {
      case 'BLOCKED':
        return 'No puedes invitar a este usuario a privado.';
      case 'REQUEST_ALREADY_PENDING':
        return 'Ya tienes una invitación pendiente con este usuario.';
      case 'OPIN_PRIVATE_REQUEST_RATE_LIMIT':
        return 'Límite alcanzado. Intenta de nuevo más tarde.';
      case 'OPIN_PRIVATE_REQUEST_RECIPIENT_COOLDOWN':
        return 'Espera un poco antes de volver a invitar a este usuario.';
      case 'SELF_REQUEST_NOT_ALLOWED':
        return 'No puedes invitarte a ti mismo.';
      case 'AUTH_REQUIRED':
        return 'Tu sesión expiró. Vuelve a iniciar sesión.';
      default:
        return 'No se pudo enviar la invitación privada.';
    }
  };

  const handleInviteInterestedUser = async (reply) => {
    const targetUserId = reply?.userId;
    if (!currentUserId || !targetUserId || targetUserId === currentUserId || invitingInterestTargetId) return;

    setInvitingInterestTargetId(targetUserId);
    try {
      await sendPrivateChatRequestFromOpin(currentUserId, targetUserId, {
        postId: myActiveIntent?.id || null,
        commentId: reply?.id || null,
        source: 'opin_interest_panel',
      });
      toast({
        description: `Invitaste a ${reply?.username || 'este usuario'} a chat privado.`,
      });
    } catch (error) {
      toast({
        description: getInterestInviteErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setInvitingInterestTargetId(null);
    }
  };

  const handleEditActiveIntent = () => {
    if (!myActiveIntent?.id) return;
    navigate(`/opin/new?edit=${myActiveIntent.id}`);
  };

  const handleFilterChange = (nextFilter) => {
    setActiveFilter(nextFilter);
    track('opin_filter_change', { filter: nextFilter }, { user }).catch(() => {});
  };

  const handleToggleFollow = async (post) => {
    if (isReadOnlyMode) {
      toast({ description: 'Regístrate para guardar intenciones y volver luego.' });
      return;
    }

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

    if (currentUserId) {
      try {
        await savePersistedFollowedOpinPostIds(nextIds);
      } catch (error) {
        console.warn('[OPIN] No se pudo persistir Seguidos:', error?.message || error);
      }
    }

    toast({
      description: isFollowing
        ? 'Dejaste de seguir esta intención.'
        : 'Intención guardada en Seguidos para volver desde cualquier dispositivo.',
    });
    track('opin_follow_toggle', { post_id: post.id, following: !isFollowing }, { user }).catch(() => {});
  };

  const followedPostSet = useMemo(() => new Set(followedPostIds), [followedPostIds]);
  const ownPosts = useMemo(() => myPosts, [myPosts]);
  const activeOwnPosts = useMemo(() => ownPosts.filter((post) => isOpenOpinIntentStatus(post.status)), [ownPosts]);
  const pausedOwnPosts = useMemo(() => ownPosts.filter((post) => post.status === 'pausado'), [ownPosts]);
  const closedOwnPosts = useMemo(() => ownPosts.filter((post) => post.status === 'cerrado'), [ownPosts]);
  const historicalOwnPosts = useMemo(
    () => ownPosts.filter((post) => post.id !== myActiveIntent?.id),
    [ownPosts, myActiveIntent?.id]
  );
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
    ...(currentUserId ? [{ id: 'mine', label: 'Mis intenciones', count: ownPosts.length }] : []),
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

  const activeIntentMetrics = useMemo(() => {
    if (!myActiveIntent) return null;

    const totalInterest = Number(myActiveIntent.likeCount || 0);
    const delta = computePostDelta(myActiveIntent, ownSnapshot);

    return {
      totalViews: Number(myActiveIntent.viewCount || 0),
      totalInterest,
      totalReplies: Number(myActiveIntent.commentCount || 0),
      ...delta,
    };
  }, [myActiveIntent, ownSnapshot]);

  const ownHistoryCards = useMemo(() => (
    historicalOwnPosts.slice(0, 4).map((post) => {
      const delta = computePostDelta(post, ownSnapshot);
      const totalInterest = Number(post.likeCount || 0);
      return {
        ...post,
        delta,
        totalInterest,
      };
    })
  ), [historicalOwnPosts, ownSnapshot]);

  const opportunityPosts = useMemo(() => {
    const seenUsers = new Set();
    return posts.filter((post) => {
      if (!post || post.isStable) return false;
      if (!isOpenOpinIntentStatus(post.status)) return false;
      if (post.userId === currentUserId) return false;
      if (seenUsers.has(post.userId)) return false;
      seenUsers.add(post.userId);
      return true;
    }).slice(0, 3);
  }, [posts, currentUserId]);

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
          title: 'Todavía no abriste una intención',
          description: 'Abre una intención para empezar a recibir respuestas y volver con un motivo claro.',
        };
      default:
        return {
          title: 'OPIN está vacío',
          description: 'Sé el primero en dejar una intención.',
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
                <h1 className="text-lg font-bold">OPIN</h1>
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
                title="Actualizar oportunidades"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              {!isReadOnlyMode && (
                <button
                  onClick={handleCreatePost}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">{myActiveIntent ? 'Editar intención' : 'Abrir intención'}</span>
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
              <span>Estás mirando OPIN</span>
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
          {!isReadOnlyMode && myActiveIntent && (
            <div className="mb-3 rounded-3xl border border-fuchsia-500/25 bg-gradient-to-br from-fuchsia-500/10 via-white/[0.03] to-cyan-500/10 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-2.5 py-1 text-[11px] font-semibold text-fuchsia-200">
                      <Clock3 className="w-3 h-3" />
                      Tu intención activa
                    </span>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${getOpinStatusMeta(myActiveIntent.status).badgeClassName}`}>
                      {getOpinStatusMeta(myActiveIntent.status).label}
                    </span>
                  </div>
                  <p className="mt-3 text-base font-semibold text-foreground leading-relaxed">
                    {sanitizeOpinPublicText(myActiveIntent.text || '')}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Tu intención sigue visible y acumulando señales sin depender del chat en vivo.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 lg:min-w-[280px]">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2">
                    <p className="text-[11px] text-muted-foreground">Vistas</p>
                    <p className="text-sm font-semibold text-foreground">{activeIntentMetrics?.totalViews || 0}</p>
                    {!!activeIntentMetrics?.newViews && <p className="text-[11px] text-cyan-300">+{activeIntentMetrics.newViews} nuevas</p>}
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2">
                    <p className="text-[11px] text-muted-foreground">Interés</p>
                    <p className="text-sm font-semibold text-foreground">{activeIntentMetrics?.totalInterest || 0}</p>
                    {!!activeIntentMetrics?.newInterest && <p className="text-[11px] text-fuchsia-300">+{activeIntentMetrics.newInterest} nuevo</p>}
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2">
                    <p className="text-[11px] text-muted-foreground">Respuestas</p>
                    <p className="text-sm font-semibold text-foreground">{activeIntentMetrics?.totalReplies || 0}</p>
                    {!!activeIntentMetrics?.newReplies && <p className="text-[11px] text-emerald-300">+{activeIntentMetrics.newReplies} nuevas</p>}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={handleEditActiveIntent}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-foreground hover:bg-white/10 transition-colors"
                >
                  <PencilLine className="w-4 h-4" />
                  Editar intención
                </button>
                <button
                  onClick={handleOpenActiveIntent}
                  className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200 hover:bg-cyan-500/15 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Ver respuestas
                </button>
                <button
                  onClick={handleCloseActiveIntent}
                  disabled={updatingActiveIntent}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-white/10 transition-colors disabled:opacity-60"
                >
                  <PauseCircle className="w-4 h-4" />
                  {updatingActiveIntent ? 'Cerrando...' : 'Cerrar intención'}
                </button>
              </div>
            </div>
          )}

          {!isReadOnlyMode && myActiveIntent && (
            <div className="mb-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Interesados recientes</p>
                  <p className="text-xs text-muted-foreground">
                    Personas que respondieron de verdad a tu intención y puedes mover a privado ahora.
                  </p>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Basado en respuestas reales, no en señales simuladas.
                </p>
              </div>

              {loadingRecentInterest ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-fuchsia-500 border-t-transparent" />
                </div>
              ) : recentInterest.length > 0 ? (
                <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {recentInterest.map((reply) => (
                    <div
                      key={reply.id}
                      className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.045] to-white/[0.02] p-3"
                    >
                      <div className="flex items-start gap-3">
                        {reply.avatar ? (
                          <img
                            src={reply.avatar}
                            alt={reply.username || 'Usuario'}
                            className="h-10 w-10 rounded-full object-cover border border-white/10"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-sm font-semibold text-foreground">
                            {(reply.username || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground">
                            {reply.username || 'Usuario'}
                          </p>
                          <p className="mt-1 text-sm text-foreground/90 line-clamp-2">
                            {sanitizeOpinPublicText(reply.comment || 'Respondió a tu intención')}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={() => handleInviteInterestedUser(reply)}
                          disabled={invitingInterestTargetId === reply.userId}
                          className="rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-1.5 text-xs font-medium text-fuchsia-200 hover:bg-fuchsia-500/15 transition-colors disabled:opacity-60"
                        >
                          {invitingInterestTargetId === reply.userId ? 'Enviando...' : 'Invitar a privado'}
                        </button>
                        <button
                          onClick={handleOpenActiveIntent}
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-white/10 transition-colors"
                        >
                          Ver contexto
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-xs text-muted-foreground">
                  Aún no hay interesados recientes visibles. Cuando alguien responda tu intención, aparecerá aquí con acceso directo a privado.
                </p>
              )}
            </div>
          )}

          {!isReadOnlyMode && ownPosts.length > 0 && (
            <div className="mb-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Tu actividad</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Historial simple de tus intenciones y su resultado visible.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                    Activas {activeOwnPosts.length}
                  </span>
                  <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
                    Pausadas {pausedOwnPosts.length}
                  </span>
                  <span className="rounded-full border border-slate-500/25 bg-slate-500/10 px-3 py-1 text-xs font-medium text-slate-300">
                    Cerradas {closedOwnPosts.length}
                  </span>
                </div>
              </div>

              {ownHistoryCards.length > 0 ? (
                <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {ownHistoryCards.map((post) => {
                    const statusMeta = getOpinStatusMeta(post.status);
                    return (
                      <div
                        key={post.id}
                        className="rounded-2xl border border-white/10 bg-white/[0.035] p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusMeta.badgeClassName}`}>
                            {statusMeta.shortLabel}
                          </span>
                          {hasNewActivitySince(post, previousVisitAt) && (
                            <span className="text-[11px] text-cyan-300">Actividad nueva</span>
                          )}
                        </div>

                        <p className="mt-2 text-sm font-medium text-foreground line-clamp-3">
                          {sanitizeOpinPublicText(post.text || '')}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                          <span>{post.viewCount || 0} vistas</span>
                          <span>{post.commentCount || 0} respuestas</span>
                          <span>{post.totalInterest || 0} interés</span>
                          {post.commentCount > 0 ? (
                            <span className="text-emerald-300">Con respuesta</span>
                          ) : (
                            <span>Sin respuesta aún</span>
                          )}
                        </div>

                        {(post.delta.newViews > 0 || post.delta.newReplies > 0 || post.delta.newInterest > 0) && (
                          <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                            {post.delta.newViews > 0 && (
                              <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-cyan-300">
                                +{post.delta.newViews} vistas
                              </span>
                            )}
                            {post.delta.newReplies > 0 && (
                              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-300">
                                +{post.delta.newReplies} respuestas
                              </span>
                            )}
                            {post.delta.newInterest > 0 && (
                              <span className="rounded-full bg-fuchsia-500/10 px-2 py-0.5 text-fuchsia-300">
                                +{post.delta.newInterest} interés
                              </span>
                            )}
                          </div>
                        )}

                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            onClick={() => handleCommentsClick(post)}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-white/10 transition-colors"
                          >
                            Ver
                          </button>
                          {post.status !== 'cerrado' && (
                            <button
                              onClick={() => navigate(`/opin/new?edit=${post.id}`)}
                              className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-white/10 transition-colors"
                            >
                              Editar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-4 text-xs text-muted-foreground">
                  Cuando cierres o pauses una intención, aparecerá aquí con su resultado.
                </p>
              )}
            </div>
          )}

          {opportunityPosts.length > 0 && (
            <div className="mb-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Oportunidades ahora</p>
                  <p className="text-xs text-muted-foreground">
                    Intenciones activas priorizadas por recencia y actividad, sin duplicar usuarios.
                  </p>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Sin tiempo real forzado ni señales infladas.
                </p>
              </div>

              <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
                {opportunityPosts.map((post) => {
                  const statusMeta = getOpinStatusMeta(post.status);
                  const isOwnPost = currentUserId && post.userId === currentUserId;
                  const authorName = isOwnPost
                    ? (userProfile?.username || post.username || 'Perfil')
                    : (post.username || 'Perfil');
                  const authorAvatar = isOwnPost
                    ? (userProfile?.avatar || post.avatar || '')
                    : (post.avatar || '');
                  const authorInitial = authorName?.charAt(0)?.toUpperCase() || '?';
                  const commentsLabel = post.commentCount > 0
                    ? `Comentarios (${post.commentCount})`
                    : 'Nuevo';
                  return (
                    <div
                      key={post.id}
                      className="h-full min-h-[250px] rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.045] to-white/[0.02] p-4 flex flex-col"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusMeta.badgeClassName}`}>
                          {statusMeta.shortLabel}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {post.commentCount || 0} resp.
                        </span>
                      </div>

                      <div className="mt-3 flex items-center gap-2 min-w-0">
                        {authorAvatar ? (
                          <img
                            src={authorAvatar}
                            alt={authorName}
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-semibold text-white ring-1 ring-white/10">
                            {authorInitial}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground">
                            <span className="font-medium text-purple-300 truncate">{authorName}</span>
                            <span>·</span>
                            <span>{formatOpinFeedTimeAgo(post.createdAt)}</span>
                          </div>
                          <button
                            onClick={() => handleCommentsClick(post)}
                            className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-cyan-300 transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>{commentsLabel}</span>
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 flex-1">
                        <p className="text-sm text-foreground/90 line-clamp-4 leading-relaxed">
                          {sanitizeOpinPublicText(post.text || '')}
                        </p>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-white/5">
                        <button
                          onClick={() => setOpenOpportunityMailboxId((prev) => (prev === post.id ? null : post.id))}
                          className="rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-1.5 text-xs font-medium text-fuchsia-200 hover:bg-fuchsia-500/15 transition-colors"
                        >
                          Buzón
                        </button>
                        <button
                          onClick={() => handleCommentsClick(post)}
                          className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-200 hover:bg-cyan-500/15 transition-colors"
                        >
                          Ver intención
                        </button>
                        {!isReadOnlyMode && (
                          <button
                            onClick={() => handleToggleFollow(post)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                              followedPostSet.has(post.id)
                                ? 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-200'
                                : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10'
                            }`}
                          >
                            {followedPostSet.has(post.id) ? 'Siguiendo' : 'Seguir'}
                          </button>
                        )}
                      </div>

                      {openOpportunityMailboxId === post.id && (
                        <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            Dejar nota rápida
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {OPIN_MAILBOX_OPTIONS.map((option) => (
                              <button
                                key={option.id}
                                onClick={() => handleOpenMailbox(post, option)}
                                className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-white/10 transition-colors"
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
                  {myActiveIntent ? 'Editar intención' : 'Abrir mi intención'}
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
                  onOpenMailbox={handleOpenMailbox}
                  onPostDeleted={handlePostDeleted}
                  isReadOnlyMode={isReadOnlyMode}
                  isFollowed={followedPostSet.has(post.id)}
                  onToggleFollow={handleToggleFollow}
                  hasNewActivity={hasNewActivitySince(post, previousVisitAt)}
                  mailboxOptions={OPIN_MAILBOX_OPTIONS}
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
          title={myActiveIntent ? 'Editar intención' : 'Abrir intención'}
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
          initialCommentDraft={commentsDraft}
          initialCommentLabel={commentsDraftLabel}
        />
      )}

      {!isReadOnlyMode && showIntentCta && (
        <div className="px-3 pt-3">
          <div className="max-w-7xl mx-auto rounded-xl border border-fuchsia-500/40 bg-fuchsia-500/10 p-3">
            <p className="text-sm text-foreground font-medium">
              Tu nota ya está en OPIN. Activa avisos para volver cuando te respondan.
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
