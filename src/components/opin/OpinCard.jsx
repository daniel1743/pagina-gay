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
import { MessageCircle, MoreHorizontal, Trash2, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { deleteOpinPost, OPIN_COLORS, getReplyPreview, incrementViewCount, getOpinStatusMeta } from '@/services/opinService';
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
  }, [post]);

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

  return (
    <>
      <div
        ref={setRefs}
        className={`group relative h-full rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.035] to-white/[0.015] px-4 py-4 shadow-[0_8px_30px_rgba(0,0,0,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:shadow-[0_16px_40px_rgba(0,0,0,0.28)] ${post.isStable ? 'ring-1 ring-purple-400/30' : ''}`}
      >
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusMeta.badgeClassName}`}>
                {statusMeta.shortLabel}
              </span>
              {post.isStable && (
                <span className="inline-flex items-center rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[11px] font-medium text-purple-200">
                  Editorial
                </span>
              )}
              {hasNewActivity && (
                <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-300">
                  Actividad nueva
                </span>
              )}
            </div>

            <div className="min-w-[1px]" />
          </div>

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
                    className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10"
                  />
                ) : (
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${colorConfig.gradient} flex items-center justify-center text-xs font-semibold text-white ring-1 ring-white/10`}>
                    {authorInitial}
                  </div>
                )}
              </button>
            ) : (
              authorAvatar ? (
                <img
                  src={authorAvatar}
                  alt={authorDisplayName}
                  className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10 flex-shrink-0"
                />
              ) : (
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${colorConfig.gradient} flex items-center justify-center text-xs font-semibold text-white ring-1 ring-white/10 flex-shrink-0`}>
                  {authorInitial}
                </div>
              )
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0 flex-wrap text-xs text-muted-foreground">
                <span
                  onClick={handleAuthorClick}
                  className={`font-medium truncate ${!isOwner ? 'text-purple-300 hover:underline cursor-pointer' : 'text-foreground'}`}
                >
                  {authorDisplayName}
                </span>
                <span>·</span>
                <span>{formatTime()}</span>
              </div>

              <button
                onClick={handleReplyClick}
                className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-cyan-300 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>{commentsLabel}</span>
              </button>
            </div>
          </div>

          <div className="flex-1">
            <p className="text-sm text-foreground leading-relaxed">
              {displayText}
              {isLongText && !expanded && '...'}
            </p>

            {isLongText && (
              <button
                onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                className="text-xs text-purple-400 hover:text-purple-300 mt-1 flex items-center gap-1"
              >
                {expanded ? (
                  <>Ver menos <ChevronUp className="w-3 h-3" /></>
                ) : (
                  <>Ver más <ChevronDown className="w-3 h-3" /></>
                )}
              </button>
            )}
          </div>

            <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-white/5">
              {!isOwner && mailboxOptions.length > 0 && (
                <button
                  onClick={handleMailboxToggle}
                  className="rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-1.5 text-xs font-medium text-fuchsia-200 hover:bg-fuchsia-500/15 transition-colors"
                >
                  Buzón
                </button>
              )}
              <button
                onClick={handleViewIntentClick}
                className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-200 hover:bg-cyan-500/15 transition-colors"
              >
                Ver intención
              </button>
              {!isOwner && (
                <button
                  onClick={handleToggleFollow}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    isFollowed
                      ? 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-200'
                      : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10'
                  }`}
                >
                  {isFollowed ? 'Siguiendo' : 'Seguir'}
                </button>
              )}
              {!isOwner && isLoggedIn && (
                <button
                  onClick={(e) => handleInviteToPrivateChat(
                    e,
                    post.userId,
                    post.username,
                    { postId: post.id }
                  )}
                  disabled={invitingTargetId === post.userId}
                  className="ml-auto flex items-center gap-1 rounded-full px-3 py-1.5 bg-fuchsia-500/20 text-xs font-medium text-fuchsia-300 hover:bg-fuchsia-500/30 transition-colors disabled:opacity-60"
                >
                  <span>{invitingTargetId === post.userId ? 'Enviando...' : 'Invitar privado'}</span>
                </button>
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
                    <MoreHorizontal className="w-4 h-4" />
                  </button>

                  {showMenu && (
                    <div className="absolute right-0 top-6 z-20 bg-card border border-border rounded-lg shadow-xl py-1 min-w-[120px]">
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
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
                      <Lock className="w-3 h-3" />
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
