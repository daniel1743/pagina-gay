/**
 * 🔔 NUDGES CONTEXTUALES (OPIN + BAÚL)
 * Filosofía: educar sin interrumpir, sugerir sin presionar.
 *
 * Reglas UX:
 * - No múltiples toasts simultáneamente
 * - No repetir el mismo mensaje en la misma sesión
 * - Todos son cerrables y no bloquean acciones
 */

import { useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getMyOpinPosts } from '@/services/opinService';
import { toast } from '@/components/ui/use-toast';

const BAUL_SCROLL_THRESHOLD_MS = 2 * 60 * 1000; // 2 min de sesión antes de sugerir Baúl
const OPIN_ACTIVITY_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24h

const getUserKey = (user) => user?.id || user?.guestId || 'anon';

export function useEngagementNudge() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const userKey = useMemo(() => getUserKey(user), [user?.id, user?.guestId]);
  const sessionStartRef = useRef(Date.now());
  const activeNudgeRef = useRef(false);
  const firstSessionRef = useRef(false);
  const cachedHasOpinPostRef = useRef(null);

  useEffect(() => {
    if (!userKey) return;
    sessionStartRef.current = Date.now();
    activeNudgeRef.current = false;
    cachedHasOpinPostRef.current = null;

    const seenKey = `nudge_first_session_seen:${userKey}`;
    const seen = localStorage.getItem(seenKey) === '1';
    firstSessionRef.current = !seen;
    if (!seen) {
      localStorage.setItem(seenKey, '1');
    }
  }, [userKey]);

  const isDisabled = useCallback(() => {
    if (!userKey) return true;
    return sessionStorage.getItem(`nudge_disabled:${userKey}`) === '1';
  }, [userKey]);

  const detenerNudges = useCallback(() => {
    if (!userKey) return;
    sessionStorage.setItem(`nudge_disabled:${userKey}`, '1');
  }, [userKey]);

  const showNudge = useCallback((id, { title, description, actionLabel, actionRoute, duration = 8000 }) => {
    if (!userKey) return false;
    if (isDisabled()) return false;

    const sessionKey = `nudge_shown:${id}:${userKey}`;
    if (sessionStorage.getItem(sessionKey)) return false;
    if (activeNudgeRef.current) return false;

    activeNudgeRef.current = true;
    sessionStorage.setItem(sessionKey, '1');

    const toastOptions = {
      title,
      description,
      duration,
      variant: 'default',
    };

    if (actionLabel && actionRoute) {
      toastOptions.action = {
        label: actionLabel,
        onClick: () => navigate(actionRoute),
      };
    }

    toast(toastOptions);

    window.setTimeout(() => {
      activeNudgeRef.current = false;
    }, duration + 500);

    return true;
  }, [userKey, isDisabled, navigate]);

  // 🔥 OPIN activity nudge on session start
  useEffect(() => {
    if (!user || user.isGuest || user.isAnonymous) return;
    if (!userKey || isDisabled()) return;

    let cancelled = false;

    const checkOpinActivity = async () => {
      try {
        const posts = await getMyOpinPosts();
        if (cancelled) return;

        cachedHasOpinPostRef.current = posts.length > 0;
        if (posts.length === 0) return;

        const totals = posts.reduce(
          (acc, post) => {
            acc.views += post.viewCount || 0;
            acc.interactions += (post.likeCount || 0) + (post.commentCount || 0);
            return acc;
          },
          { views: 0, interactions: 0 }
        );

        const totalsKey = `opin_activity_totals:${userKey}`;
        const prev = JSON.parse(localStorage.getItem(totalsKey) || '{"views":0,"interactions":0}');
        const newViews = totals.views - (prev.views || 0);
        const newInteractions = totals.interactions - (prev.interactions || 0);

        // Actualizar baseline siempre
        localStorage.setItem(totalsKey, JSON.stringify(totals));

        if (newViews <= 0 && newInteractions <= 0) return;

        const lastShownKey = `opin_activity_nudge_last:${userKey}`;
        const lastShown = Number(localStorage.getItem(lastShownKey) || 0);
        if (Date.now() - lastShown < OPIN_ACTIVITY_COOLDOWN_MS) return;

        const shown = showNudge('opin_activity', {
          title: 'Tu Opin está activo 🔥',
          description: 'Tu Opin recibió nuevas visitas o interacciones. Puede que alguien quiera contactarte.',
          actionLabel: 'Ver mi Opin',
          actionRoute: '/opin',
          duration: 9000,
        });

        if (shown) {
          localStorage.setItem(lastShownKey, String(Date.now()));
        }
      } catch {
        // Silenciar errores para no afectar UX
      }
    };

    checkOpinActivity();

    return () => {
      cancelled = true;
    };
  }, [user, userKey, showNudge, isDisabled]);

  // ✅ After chat interaction: OPIN first-time nudge
  const handleChatInteraction = useCallback(async () => {
    if (!user || user.isGuest || user.isAnonymous) return;
    if (!userKey || isDisabled()) return;
    if (!firstSessionRef.current) return;

    const sessionKey = `nudge_shown:opin_first:${userKey}`;
    if (sessionStorage.getItem(sessionKey)) return;

    try {
      if (cachedHasOpinPostRef.current === null) {
        const posts = await getMyOpinPosts();
        cachedHasOpinPostRef.current = posts.length > 0;
      }

      if (cachedHasOpinPostRef.current) return;

      showNudge('opin_first', {
        title: 'Antes de irte 👀',
        description: 'No has dejado tu Opin. Puedes dejar tu contacto o decir quién eres para que otros te encuentren después.',
        actionLabel: 'Ir a Opin',
        actionRoute: '/opin',
        duration: 9000,
      });
    } catch {
      // Silenciar
    }
  }, [user, userKey, showNudge, isDisabled]);

  // ✅ After chat scroll + session duration: Baúl discovery nudge
  const handleChatScroll = useCallback(() => {
    if (!user || !userKey || isDisabled()) return;

    const visitedKey = `baul_visited:${userKey}`;
    if (localStorage.getItem(visitedKey) === '1') return;

    const elapsed = Date.now() - sessionStartRef.current;
    if (elapsed < BAUL_SCROLL_THRESHOLD_MS) return;

    showNudge('baul_discovery', {
      title: 'Descubre personas en Baúl 🗝️',
      description: 'En Baúl puedes ver tarjetas de personas que están activas ahora mismo.',
      actionLabel: 'Ir a Baúl',
      actionRoute: '/baul',
      duration: 8000,
    });
  }, [user, userKey, showNudge, isDisabled]);

  return {
    handleChatInteraction,
    handleChatScroll,
    detenerNudges,
  };
}
