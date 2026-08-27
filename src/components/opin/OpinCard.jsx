import { HugeiconsIcon } from '@hugeicons/react';
/**
 * OpinCard - Item compacto de nota OPIN
 *
 * Diseño minimalista tipo lista:
 * - Texto principal (2-3 líneas max, "Ver más" si es largo)
 * - Metadata: Autor · tiempo · likes · Responder
 * - Click en autor → abre tarjeta Baúl
 */

import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Comment01Icon, 
  MoreHorizontalIcon, 
  Delete02Icon, 
  ArrowDown01Icon, 
  ArrowUp01Icon, 
  LockPasswordIcon,
  CrownIcon,
  FireIcon,
  UserGroupIcon,
  Note01Icon,
  Diamond01Icon,
  StarIcon,
  WhatsappIcon,
  SmartPhone01Icon
} from '@hugeicons/core-free-icons';
import { deleteOpinPost, OPIN_COLORS, getReplyPreview, incrementViewCount, getOpinStatusMeta, toggleReaction, getUserReactions } from '@/services/opinService';
import { sendPrivateChatRequestFromOpin } from '@/services/socialService';
import { obtenerTarjeta } from '@/services/tarjetaService';
import MensajeTarjetaModal from '@/components/baul/MensajeTarjetaModal';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { track, getSessionId } from '@/services/eventTrackingService';
import { sanitizeOpinPublicText } from '@/services/opinSafetyService';

const COMMENTS_INLINE_LIMIT = 16;

const OpinCard = forwardRef(({
  post,
  onCommentsClick,
  onPostDeleted,
  isReadOnlyMode = false,
  isFollowed = false,
  onToggleFollow = null,
  hasNewActivity = false,
  onOpenMailbox = null,
  mailboxOptions = [],
}, ref) => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estados para Baúl
  const [showBaulModal, setShowBaulModal] = useState(false);
  const [baulTarjeta, setBaulTarjeta] = useState(null);
  const [loadingBaul, setLoadingBaul] = useState(false);

  // Estados para preview de respuestas
  const [previewReplies, setPreviewReplies] = useState([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  const [invitingTargetId, setInvitingTargetId] = useState(null);
  const [showMailboxOptions, setShowMailboxOptions] = useState(false);
  const [localReactionCounts, setLocalReactionCounts] = useState(post.reactionCounts || {});
  const [myActiveReactions, setMyActiveReactions] = useState([]);
  const cardRef = useRef(null);

  const isOwner = user && (user.id === post.userId || user.uid === post.userId);
  const isLoggedIn = user && !user.isAnonymous && !user.isGuest;
  const currentUserId = user?.uid || user?.id || null;
  const totalReplies = post.commentCount || 0;
  const statusMeta = getOpinStatusMeta(post.status);
  const authorDisplayName = userProfile?.username && isOwner
    ? userProfile.username
    : post.username || 'Perfil';
  const authorAvatar = userProfile?.avatar && isOwner
    ? userProfile.avatar
    : post.avatar || '';
  const authorInitial = authorDisplayName?.charAt(0)?.toUpperCase() || '?';
  const commentsLabel = totalReplies > 0 ? `Comentarios (${totalReplies})` : 'Nuevo';
  const safePostText = sanitizeOpinPublicText(post.text || '');

  const setRefs = (node) => {
    cardRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  };

  // ✅ Trackear vista real (una vez por sesión)
  useEffect(() => {
    if (!post?.id) return;
    if (!cardRef.current) return;

    const sessionId = getSessionId();
    const viewKey = `opin_viewed:${post.id}:${sessionId}`;
    if (sessionStorage.getItem(viewKey) === '1') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          sessionStorage.setItem(viewKey, '1');
          incrementViewCount(post.id).catch(() => {});
          track('opin_view', { post_id: post.id, author_id: post.userId }, { user }).catch(() => {});
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(cardRef.current);

    return () => observer.disconnect();
  }, [post?.id, post?.userId, user]);

  useEffect(() => {
    setShowMailboxOptions(false);
    setLocalReactionCounts(post.reactionCounts || {});
    if (user) {
      setMyActiveReactions(getUserReactions(post));
    } else {
      setMyActiveReactions([]);
    }
  }, [post, user]);

  // Cargar preview de respuestas al desplegar el bloque de comentarios
  useEffect(() => {
    const loadPreviewReplies = async () => {
      if (!commentsExpanded) return;
      if (totalReplies <= 0) {
        setPreviewReplies([]);
        return;
      }

      setLoadingReplies(true);
      try {
        const dynamicLimit = Math.min(totalReplies, COMMENTS_INLINE_LIMIT);
        const replies = await getReplyPreview(post.id, dynamicLimit);
        setPreviewReplies(replies);
      } catch (error) {
        console.warn('[OPIN] Error cargando preview:', error);
      } finally {
        setLoadingReplies(false);
      }
    };
    loadPreviewReplies();
  }, [post.id, totalReplies, commentsExpanded]);
  const colorConfig = OPIN_COLORS[post.color || 'purple'];

  // Formatear tiempo - siempre mostrar tiempo transcurrido, nunca "Expirado"
  const formatTime = () => {
    if (post.isStable) return 'Fijado';

    // Siempre mostrar tiempo desde que se creó
    if (post.createdAt) {
      const created = post.createdAt.toDate ? post.createdAt.toDate() : new Date(post.createdAt);
      const now = new Date();
      const diffMs = now - created;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'ahora';
      if (diffMins < 60) return `hace ${diffMins}m`;
      if (diffHours < 24) return `hace ${diffHours}h`;
      if (diffDays < 7) return `hace ${diffDays}d`;
      if (diffDays < 30) return `hace ${Math.floor(diffDays / 7)}sem`;
      return `hace ${Math.floor(diffDays / 30)}mes`;
    }

    return 'reciente';
  };

  // Texto truncado
  const MAX_CHARS = 120;
  const isLongText = safePostText.length > MAX_CHARS;
  const displayText = expanded ? safePostText : safePostText.slice(0, MAX_CHARS);

  // Click en autor → abrir Baúl
  const handleAuthorClick = async (e) => {
    e.stopPropagation();
    if (isOwner) return;
    if (isReadOnlyMode) {
      toast({
        title: 'Crea tu cuenta',
        description: 'Regístrate para ver perfiles',
      });
      return;
    }
    if (loadingBaul) return;
    setLoadingBaul(true);

    try {
      const tarjeta = await obtenerTarjeta(post.userId);
      if (tarjeta) {
        setBaulTarjeta(tarjeta);
        setShowBaulModal(true);
      } else {
        toast({ description: 'Este usuario no tiene perfil en el Baúl' });
      }
    } catch (error) {
      toast({ description: 'No se pudo cargar el perfil', variant: 'destructive' });
    } finally {
      setLoadingBaul(false);
    }
  };

  // Responder
  const handleReplyClick = (e) => {
    e.stopPropagation();
    setCommentsExpanded((prev) => !prev);
  };

  const handleOpenCommentsModal = (e) => {
    e.stopPropagation();
    if (isReadOnlyMode) {
      toast({ description: 'Regístrate para comentar' });
      return;
    }
    if (onCommentsClick) onCommentsClick(post);
  };

  const handleViewIntentClick = (e) => {
    e.stopPropagation();
    if (onCommentsClick) {
      onCommentsClick(post);
      return;
    }
    setCommentsExpanded((prev) => !prev);
  };

  const handleToggleFollow = (e) => {
    e.stopPropagation();
    if (typeof onToggleFollow === 'function') {
      onToggleFollow(post);
    }
  };

  const getInviteErrorMessage = (error) => {
    switch (error?.message) {
      case 'BLOCKED':
        return 'No puedes invitar a este usuario a chat privado.';
      case 'REQUEST_ALREADY_PENDING':
        return 'Ya tienes una invitación pendiente con este usuario.';
      case 'OPIN_PRIVATE_REQUEST_RATE_LIMIT':
        return 'Límite alcanzado: intenta nuevamente en un rato.';
      case 'OPIN_PRIVATE_REQUEST_RECIPIENT_COOLDOWN':
        return 'Espera unos minutos antes de volver a invitar a este usuario.';
      case 'SELF_REQUEST_NOT_ALLOWED':
        return 'No puedes invitarte a ti mismo.';
      case 'AUTH_REQUIRED':
        return 'Tu sesion expiro. Vuelve a iniciar sesion.';
      default:
        return 'No se pudo enviar la invitación privada.';
    }
  };

  const handleInviteToPrivateChat = async (e, targetUserId, targetUsername, metadata = {}) => {
    e.stopPropagation();
    if (!isLoggedIn || isReadOnlyMode) {
      toast({ description: 'Regístrate para invitar a chat privado' });
      return;
    }

    if (!currentUserId || !targetUserId || currentUserId === targetUserId) return;
    if (invitingTargetId) return;

    setInvitingTargetId(targetUserId);
    try {
      await sendPrivateChatRequestFromOpin(currentUserId, targetUserId, metadata);
      toast({
        title: 'Invitación enviada',
        description: `Invitaste a ${targetUsername || 'este usuario'} a chat privado.`,
      });
    } catch (error) {
      toast({
        title: 'No se pudo invitar',
        description: getInviteErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setInvitingTargetId(null);
    }
  };

  // Eliminar
  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar esta nota?')) return;

    setIsDeleting(true);
    try {
      await deleteOpinPost(post.id);
      toast({ description: 'Nota eliminada' });
      if (onPostDeleted) onPostDeleted(post.id);
    } catch (error) {
      toast({ description: error.message, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
      setShowMenu(false);
    }
  };

  const handleMailboxToggle = (e) => {
    e.stopPropagation();
    setShowMailboxOptions((prev) => !prev);
  };

  const handleMailboxOption = (e, option) => {
    e.stopPropagation();
    setShowMailboxOptions(false);
    onOpenMailbox?.(post, option);
  };

  const handleVote = async (e, emoji) => {
    e.stopPropagation();
    if (!isLoggedIn || isReadOnlyMode) {
      toast({ description: 'Regístrate para votar por esta persona' });
      return;
    }

    const alreadyVoted = myActiveReactions.includes(emoji);

    setMyActiveReactions((prev) =>
      alreadyVoted ? prev.filter((x) => x !== emoji) : [...prev, emoji]
    );

    setLocalReactionCounts((prev) => {
      const current = prev[emoji] || 0;
      const nextCount = alreadyVoted ? Math.max(0, current - 1) : current + 1;
      const nextCounts = { ...prev };
      if (nextCount > 0) {
        nextCounts[emoji] = nextCount;
      } else {
        delete nextCounts[emoji];
      }
      return nextCounts;
    });

    try {
      await toggleReaction(post.id, emoji);
    } catch (error) {
      toast({ description: error.message || 'Error al votar', variant: 'destructive' });
      // Revertir
      if (user) {
        setMyActiveReactions(getUserReactions(post));
      }
      setLocalReactionCounts(post.reactionCounts || {});
    }
  };

  // Obtener estilos y emojis de categoría
  const getCategoryMeta = () => {
    switch (post.type) {
      case 'crush':
        return {
          Icon: CrownIcon,
          label: 'Crush',
          badgeClass: 'border-fuchsia-500/30 bg-fuchsia-500/15 text-fuchsia-200 shadow-[0_0_8px_rgba(217,70,239,0.1)]',
          borderClass: 'border-fuchsia-500/10 shadow-[0_4px_20px_rgba(217,70,239,0.05)] hover:border-fuchsia-500/25 hover:shadow-[0_8px_30px_rgba(217,70,239,0.15)]',
        };
      case 'encuentro':
        return {
          Icon: FireIcon,
          label: 'Cita / Encuentro',
          badgeClass: 'border-orange-500/30 bg-orange-500/15 text-orange-200 shadow-[0_0_8px_rgba(249,115,22,0.1)]',
          borderClass: 'border-orange-500/10 shadow-[0_4px_20px_rgba(249,115,22,0.05)] hover:border-orange-500/25 hover:shadow-[0_8px_30px_rgba(249,115,22,0.15)]',
        };
      case 'amistad':
        return {
          Icon: UserGroupIcon,
          label: 'Amistad',
          badgeClass: 'border-cyan-500/30 bg-cyan-500/15 text-cyan-200 shadow-[0_0_8px_rgba(6,182,212,0.1)]',
          borderClass: 'border-cyan-500/10 shadow-[0_4px_20px_rgba(6,182,212,0.05)] hover:border-cyan-500/25 hover:shadow-[0_8px_30px_rgba(6,182,212,0.15)]',
        };
      default:
        return {
          Icon: Note01Icon,
          label: 'Nota',
          badgeClass: 'border-white/10 bg-white/5 text-muted-foreground',
          borderClass: 'border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.2)] hover:border-white/20 hover:shadow-[0_16px_40px_rgba(0,0,0,0.28)]',
        };
    }
  };

  const categoryMeta = getCategoryMeta();

  return (
    <>
      <div
        ref={setRefs}
        className={`group relative h-full rounded-2xl border bg-gradient-to-b from-white/[0.045] to-white/[0.015] px-4 py-4 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 ${categoryMeta.borderClass} ${post.isStable ? 'ring-1 ring-purple-400/30' : ''}`}
      >
        <div className="flex-1 min-w-0 flex flex-col h-full">
          {/* Cabecera */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${categoryMeta.badgeClass}`}>
                {categoryMeta.Icon && <HugeiconsIcon icon={categoryMeta.Icon} size={14} color="currentColor" />}
                <span>{categoryMeta.label}</span>
              </span>
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusMeta.badgeClassName}`}>
                {statusMeta.shortLabel}
              </span>
              {post.isStable && (
                <span className="inline-flex items-center rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-200">
                  Fijado
                </span>
              )}
            </div>
            <div className="min-w-[1px]" />
          </div>

          {/* Imagen del anuncio si la tiene */}
          {post.imageUrl && (
            <div className="relative w-full h-44 rounded-xl overflow-hidden mb-3 border border-white/5 shadow-inner">
              <img
                src={post.imageUrl}
                alt={post.title || 'Anuncio'}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            </div>
          )}

          {/* Información del autor */}
          <div className="flex items-center gap-2 mb-3 min-w-0">
            {!isOwner ? (
              <button
                type="button"
                onClick={handleAuthorClick}
                className="flex-shrink-0 focus:outline-none"
                aria-label={`Ver perfil de ${authorDisplayName}`}
              >
                {authorAvatar ? (
                  <img
                    src={authorAvatar}
                    alt={authorDisplayName}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-purple-500/20"
                  />
                ) : (
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${colorConfig.gradient} flex items-center justify-center text-xs font-semibold text-white ring-2 ring-purple-500/20`}>
                    {authorInitial}
                  </div>
                )}
              </button>
            ) : (
              authorAvatar ? (
                <img
                  src={authorAvatar}
                  alt={authorDisplayName}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-purple-500/20 flex-shrink-0"
                />
              ) : (
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${colorConfig.gradient} flex items-center justify-center text-xs font-semibold text-white ring-2 ring-purple-500/20 flex-shrink-0`}>
                  {authorInitial}
                </div>
              )
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0 flex-wrap text-[11px] text-muted-foreground">
                <span
                  onClick={handleAuthorClick}
                  className={`font-semibold truncate ${!isOwner ? 'text-purple-300 hover:text-purple-200 cursor-pointer' : 'text-foreground'}`}
                >
                  {authorDisplayName}
                </span>
                <span>·</span>
                <span>{formatTime()}</span>
              </div>

              <button
                onClick={handleReplyClick}
                className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-cyan-300 transition-colors"
              >
                <HugeiconsIcon icon={Comment01Icon} size={14} color="currentColor" />
                <span>{commentsLabel}</span>
              </button>
            </div>
          </div>

          {/* Título y Contenido */}
          <div className="flex-1 space-y-1">
            {post.title && (
              <h3 className="text-sm font-bold text-foreground tracking-tight line-clamp-1">
                {post.title}
              </h3>
            )}
            <p className="text-sm text-foreground/90 leading-relaxed font-normal">
              {displayText}
              {isLongText && !expanded && '...'}
            </p>

            {isLongText && (
              <button
                onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                className="text-xs text-purple-400 hover:text-purple-300 mt-1 flex items-center gap-0.5 font-medium"
              >
                {expanded ? (
                  <>Ver menos <HugeiconsIcon icon={ArrowUp01Icon} size={12} color="currentColor" /></>
                ) : (
                  <>Ver más <HugeiconsIcon icon={ArrowDown01Icon} size={12} color="currentColor" /></>
                )}
              </button>
            )}
          </div>

          {/* Sistema de Votación / Reacciones en Tarjeta */}
          <div className="mt-3.5 pt-2 flex items-center gap-1.5 border-t border-white/5">
            <button
              onClick={(e) => handleVote(e, '💎')}
              title="Voto Glamour"
              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border flex items-center gap-1 transition-all ${
                myActiveReactions.includes('💎')
                  ? 'border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-200 shadow-[0_0_8px_rgba(217,70,239,0.15)] font-bold'
                  : 'border-white/5 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground'
              }`}
            >
              <HugeiconsIcon icon={Diamond01Icon} size={14} color="currentColor" />
              <span>Glamour</span>
              {localReactionCounts['💎'] > 0 && <span className="ml-0.5 font-bold text-[9px]">{localReactionCounts['💎']}</span>}
            </button>
            <button
              onClick={(e) => handleVote(e, '🔥')}
              title="Voto Fuego"
              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border flex items-center gap-1 transition-all ${
                myActiveReactions.includes('🔥')
                  ? 'border-orange-500/40 bg-orange-500/10 text-orange-200 shadow-[0_0_8px_rgba(249,115,22,0.15)] font-bold'
                  : 'border-white/5 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground'
              }`}
            >
              <HugeiconsIcon icon={FireIcon} size={14} color="currentColor" />
              <span>Fuego</span>
              {localReactionCounts['🔥'] > 0 && <span className="ml-0.5 font-bold text-[9px]">{localReactionCounts['🔥']}</span>}
            </button>
            <button
              onClick={(e) => handleVote(e, '⭐')}
              title="Voto Favorito"
              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border flex items-center gap-1 transition-all ${
                myActiveReactions.includes('⭐')
                  ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-200 shadow-[0_0_8px_rgba(234,179,8,0.15)] font-bold'
                  : 'border-white/5 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground'
              }`}
            >
              <HugeiconsIcon icon={StarIcon} size={14} color="currentColor" />
              <span>Fav</span>
              {localReactionCounts['⭐'] > 0 && <span className="ml-0.5 font-bold text-[9px]">{localReactionCounts['⭐']}</span>}
            </button>
          </div>

          {/* Botones de acción y Pasarela de Contacto Seguro */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5 pt-3 border-t border-white/5">
            {!isOwner && mailboxOptions.length > 0 && (
              <button
                onClick={handleMailboxToggle}
                className="rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-2.5 py-1 text-[11px] font-medium text-fuchsia-200 hover:bg-fuchsia-500/15 transition-colors"
              >
                Buzón
              </button>
            )}
            <button
              onClick={handleViewIntentClick}
              className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-medium text-cyan-200 hover:bg-cyan-500/15 transition-colors"
            >
              Ver
            </button>
            {!isOwner && (
              <button
                onClick={handleToggleFollow}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  isFollowed
                    ? 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-200'
                    : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10'
                }`}
              >
                {isFollowed ? 'Siguiendo' : 'Seguir'}
              </button>
            )}

            {/* Pasarela de Contacto Seguro */}
            {!isOwner && (
              post.contactMethod === 'whatsapp' ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isReadOnlyMode) {
                      toast({ description: 'Regístrate para contactar por WhatsApp' });
                      return;
                    }
                    if (!post.contactValue) return;
                    const cleanNum = post.contactValue.replace(/\D/g, '');
                    window.open(`https://wa.me/${cleanNum}?text=Hola! Te vi en Opin de Chactivo...`, '_blank');
                  }}
                  className="ml-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 bg-green-500/20 text-[11px] font-bold text-green-300 border border-green-500/30 hover:bg-green-500/30 transition-all shadow-[0_0_10px_rgba(34,197,94,0.1)]"
                >
                  <HugeiconsIcon icon={WhatsappIcon} size={14} color="currentColor" />
                  <span>WhatsApp</span>
                </button>
              ) : post.contactMethod === 'sms' ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isReadOnlyMode) {
                      toast({ description: 'Regístrate para contactar por SMS' });
                      return;
                    }
                    if (!post.contactValue) return;
                    const cleanNum = post.contactValue.replace(/\D/g, '');
                    window.open(`sms:${cleanNum}`, '_blank');
                  }}
                  className="ml-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 bg-sky-500/20 text-[11px] font-bold text-sky-300 border border-sky-500/30 hover:bg-sky-500/30 transition-all shadow-[0_0_10px_rgba(14,165,233,0.1)]"
                >
                  <HugeiconsIcon icon={SmartPhone01Icon} size={14} color="currentColor" />
                  <span>SMS</span>
                </button>
              ) : (
                isLoggedIn && (
                  <button
                    onClick={(e) => handleInviteToPrivateChat(
                      e,
                      post.userId,
                      post.username,
                      { postId: post.id }
                    )}
                    disabled={invitingTargetId === post.userId}
                    className="ml-auto flex items-center gap-1 rounded-full px-3 py-1.5 bg-fuchsia-500/20 text-[11px] font-bold text-fuchsia-300 hover:bg-fuchsia-500/30 border border-fuchsia-500/25 transition-all disabled:opacity-60"
                  >
                    <span>{invitingTargetId === post.userId ? 'Enviando...' : 'Invitar privado'}</span>
                  </button>
                )
              )
            )}
          </div>

            {!isOwner && mailboxOptions.length > 0 && showMailboxOptions && (
              <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Dejar nota rápida
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {mailboxOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={(e) => handleMailboxOption(e, option)}
                      className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-white/10 transition-colors"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-2 flex items-center justify-end">
              {/* Menú del dueño */}
              {isOwner && !post.isStable && (
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                    className="p-1 hover:bg-white/10 rounded"
                  >
                    <HugeiconsIcon icon={MoreHorizontalIcon} size={16} color="currentColor" />
                  </button>

                  {showMenu && (
                    <div className="absolute right-0 top-6 z-20 bg-card border border-border rounded-lg shadow-xl py-1 min-w-[120px]">
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                      >
                        <HugeiconsIcon icon={Delete02Icon} size={14} color="currentColor" />
                        {isDeleting ? 'Eliminando...' : 'Eliminar'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Comentarios desplegables */}
            {commentsExpanded && (
              <div className="mt-3 rounded-xl border border-white/10 bg-black/20 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
                  <p className="text-xs font-medium text-foreground/90">Comentarios</p>
                  {totalReplies > 0 && (
                    <span className="text-[11px] text-muted-foreground">
                      Mostrando {Math.min(totalReplies, COMMENTS_INLINE_LIMIT)} de {totalReplies}
                    </span>
                  )}
                </div>

                <div className="px-3 py-3">
                  {loadingReplies ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="w-3 h-3 border border-purple-500 border-t-transparent rounded-full animate-spin" />
                      <span>Cargando comentarios...</span>
                    </div>
                  ) : totalReplies <= 0 ? (
                    <p className="text-xs text-muted-foreground">No hay información aquí</p>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {previewReplies.map((reply) => (
                        <div key={reply.id} className="flex items-start gap-2">
                          {reply.avatar ? (
                            <img
                              src={reply.avatar}
                              alt={reply.username}
                              className="w-5 h-5 rounded-full flex-shrink-0 object-cover"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full flex-shrink-0 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-[10px] font-bold">
                              {reply.username?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                          )}
                          <p className="text-xs text-foreground/80 leading-relaxed flex-1">
                            <span className="font-semibold text-foreground">{reply.username}</span>
                            {' '}
                            {sanitizeOpinPublicText(reply.comment || '')}
                          </p>
                          {isLoggedIn && reply.userId && reply.userId !== currentUserId && (
                            <button
                              onClick={(e) => handleInviteToPrivateChat(
                                e,
                                reply.userId,
                                reply.username,
                                { postId: post.id, commentId: reply.id }
                              )}
                              disabled={invitingTargetId === reply.userId}
                              className="text-[11px] px-2 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300 hover:bg-fuchsia-500/30 transition-colors disabled:opacity-60"
                            >
                              {invitingTargetId === reply.userId ? '...' : 'Privado'}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between px-3 py-2 border-t border-white/10">
                  <button
                    onClick={handleOpenCommentsModal}
                    className="text-xs text-purple-300 hover:text-purple-200 transition-colors"
                  >
                    Ver todo y comentar
                  </button>
                  {!isLoggedIn && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <HugeiconsIcon icon={LockPasswordIcon} size={12} color="currentColor" />
                      Registro para responder
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Stats para el dueño */}
            {isOwner && (post.viewCount || 0) > 0 && (
              <p className="text-xs text-muted-foreground/60 mt-2">
                {post.viewCount} {post.viewCount === 1 ? 'persona te vio' : 'personas te vieron'}
              </p>
            )}
        </div>
      </div>

      {/* Modal Baúl */}
      {showBaulModal && baulTarjeta && (
        <MensajeTarjetaModal
          isOpen={showBaulModal}
          onClose={() => { setShowBaulModal(false); setBaulTarjeta(null); }}
          tarjeta={baulTarjeta}
          miUserId={user?.id || user?.uid || ''}
          miUsername={userProfile?.username || user?.displayName || 'Usuario'}
        />
      )}
    </>
  );
});

OpinCard.displayName = 'OpinCard';

export default OpinCard;
