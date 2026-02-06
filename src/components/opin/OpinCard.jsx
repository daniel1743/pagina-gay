/**
 * OpinCard - Item compacto de nota OPIN (estilo tablón)
 *
 * Diseño minimalista tipo lista:
 * - Texto principal (2-3 líneas max, "Ver más" si es largo)
 * - Metadata: Autor · tiempo · likes · Responder
 * - Click en autor → abre tarjeta Baúl
 */

import React, { useState, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, MoreHorizontal, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { getTimeRemaining, toggleLike, hasUserLiked, deleteOpinPost, OPIN_COLORS, OPIN_REACTIONS, toggleReaction, getUserReactions } from '@/services/opinService';
import { obtenerTarjeta } from '@/services/tarjetaService';
import MensajeTarjetaModal from '@/components/baul/MensajeTarjetaModal';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

const OpinCard = forwardRef(({ post, onCommentsClick, onPostDeleted, isReadOnlyMode = false }, ref) => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [liked, setLiked] = useState(hasUserLiked(post));
  const [likingInProgress, setLikingInProgress] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estados para Baúl
  const [showBaulModal, setShowBaulModal] = useState(false);
  const [baulTarjeta, setBaulTarjeta] = useState(null);
  const [loadingBaul, setLoadingBaul] = useState(false);

  // Estados para reacciones
  const [reactionCounts, setReactionCounts] = useState(post.reactionCounts || {});
  const [myReactions, setMyReactions] = useState(getUserReactions(post));
  const [reactingEmoji, setReactingEmoji] = useState(null);

  const isOwner = user && (user.id === post.userId || user.uid === post.userId);
  const colorConfig = OPIN_COLORS[post.color || 'purple'];

  // Formatear tiempo
  const formatTime = () => {
    if (post.isStable) return 'Fijado';
    const remaining = getTimeRemaining(post.expiresAt);
    if (remaining === 'Expirado') return 'Expirado';

    // Convertir "Xh Ym" a "hace Xh"
    if (post.createdAt) {
      const created = post.createdAt.toDate ? post.createdAt.toDate() : new Date(post.createdAt);
      const now = new Date();
      const diffMs = now - created;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);

      if (diffMins < 1) return 'ahora';
      if (diffMins < 60) return `hace ${diffMins}m`;
      if (diffHours < 24) return `hace ${diffHours}h`;
      return `hace ${Math.floor(diffHours / 24)}d`;
    }
    return remaining;
  };

  // Texto truncado
  const MAX_CHARS = 120;
  const isLongText = post.text.length > MAX_CHARS;
  const displayText = expanded ? post.text : post.text.slice(0, MAX_CHARS);

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

  // Like
  const handleLikeClick = async (e) => {
    e.stopPropagation();
    if (isReadOnlyMode || !user || user.isAnonymous || likingInProgress) return;

    setLikingInProgress(true);
    try {
      const result = await toggleLike(post.id);
      if (result.liked) {
        setLiked(true);
        setLikeCount(prev => prev + 1);
      } else {
        setLiked(false);
        setLikeCount(prev => prev - 1);
      }
    } catch (error) {
      toast({ description: 'Error al dar like', variant: 'destructive' });
    } finally {
      setLikingInProgress(false);
    }
  };

  // Responder
  const handleReplyClick = (e) => {
    e.stopPropagation();
    if (isReadOnlyMode) {
      toast({ description: 'Regístrate para responder' });
      return;
    }
    if (onCommentsClick) onCommentsClick(post);
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

  // Reacción con emoji
  const handleReaction = async (e, emoji) => {
    e.stopPropagation();
    if (isReadOnlyMode || !user || user.isAnonymous || reactingEmoji) return;

    setReactingEmoji(emoji);
    try {
      const result = await toggleReaction(post.id, emoji);
      if (result.reacted) {
        setMyReactions(prev => [...prev, emoji]);
        setReactionCounts(prev => ({
          ...prev,
          [emoji]: (prev[emoji] || 0) + 1
        }));
      } else {
        setMyReactions(prev => prev.filter(e => e !== emoji));
        setReactionCounts(prev => ({
          ...prev,
          [emoji]: Math.max(0, (prev[emoji] || 0) - 1)
        }));
      }
    } catch (error) {
      toast({ description: 'Error al reaccionar', variant: 'destructive' });
    } finally {
      setReactingEmoji(null);
    }
  };

  return (
    <>
      <div
        ref={ref}
        className={`border-b border-white/10 py-4 px-4 hover:bg-white/5 transition-colors ${post.isStable ? 'bg-purple-500/5' : ''}`}
      >
        {/* Indicador de color (punto) + Texto */}
        <div className="flex gap-3">
          {/* Punto de color */}
          <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-gradient-to-br ${colorConfig.gradient}`} />

          {/* Contenido */}
          <div className="flex-1 min-w-0">
            {/* Texto principal */}
            <p className="text-sm text-foreground leading-relaxed">
              {displayText}
              {isLongText && !expanded && '...'}
            </p>

            {/* Ver más/menos */}
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

            {/* Metadata + Acciones */}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
              {/* Autor (clickeable) */}
              <span
                onClick={handleAuthorClick}
                className={`font-medium ${!isOwner ? 'text-purple-400 hover:underline cursor-pointer' : 'text-foreground'}`}
              >
                {isOwner ? 'Tú' : post.username || 'Anónimo'}
              </span>

              <span>·</span>

              {/* Tiempo */}
              <span>{formatTime()}</span>

              <span>·</span>

              {/* Like */}
              <button
                onClick={handleLikeClick}
                disabled={likingInProgress || isReadOnlyMode}
                className={`flex items-center gap-1 transition-colors ${
                  liked ? 'text-pink-500' : 'hover:text-pink-400'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`} />
                {likeCount > 0 && <span>{likeCount}</span>}
              </button>

              <span>·</span>

              {/* Responder */}
              <button
                onClick={handleReplyClick}
                className="flex items-center gap-1 hover:text-cyan-400 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Responder</span>
                {(post.commentCount || 0) > 0 && (
                  <span className="text-cyan-400">({post.commentCount})</span>
                )}
              </button>

              {/* Menú del dueño */}
              {isOwner && !post.isStable && (
                <div className="relative ml-auto">
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

            {/* Barra de reacciones */}
            <div className="flex items-center gap-1 mt-3 pt-2 border-t border-white/5">
              {OPIN_REACTIONS.map(({ emoji, label }) => {
                const count = reactionCounts[emoji] || 0;
                const isActive = myReactions.includes(emoji);
                const isLoading = reactingEmoji === emoji;

                return (
                  <button
                    key={emoji}
                    onClick={(e) => handleReaction(e, emoji)}
                    disabled={isReadOnlyMode || !user || user.isAnonymous || isLoading}
                    title={label}
                    className={`flex items-center gap-0.5 px-2 py-1 rounded-full text-sm transition-all
                      ${isActive
                        ? 'bg-white/15 scale-110'
                        : 'bg-white/5 hover:bg-white/10 hover:scale-105'
                      }
                      ${isLoading ? 'opacity-50' : ''}
                      ${isReadOnlyMode ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
                    `}
                  >
                    <span className={isActive ? 'animate-bounce' : ''}>{emoji}</span>
                    {count > 0 && (
                      <span className="text-xs text-muted-foreground ml-0.5">{count}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Stats para el dueño */}
            {isOwner && (post.viewCount || 0) > 0 && (
              <p className="text-xs text-muted-foreground/60 mt-2">
                {post.viewCount} {post.viewCount === 1 ? 'persona te vio' : 'personas te vieron'}
              </p>
            )}
          </div>
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
