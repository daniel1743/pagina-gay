/**
 * OpinCommentsModal - Modal de respuestas con modo espectador
 *
 * Visitantes (no logueados):
 * - Pueden ver las primeras 3 respuestas
 * - No pueden ver más respuestas
 * - No pueden responder ni dar like
 *
 * Usuarios logueados:
 * - Pueden ver todas las respuestas
 * - Pueden responder (chips rápidos o texto)
 * - Pueden dar like a respuestas
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Trash2, MessageCircle, Lock, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getPostComments, addComment, deleteComment, OPIN_STATUS_OPTIONS, getOpinStatusMeta, updateOpinStatus } from '@/services/opinService';
import { sendPrivateChatRequestFromOpin } from '@/services/socialService';
import { toast } from '@/components/ui/use-toast';

const QUICK_REPLIES = ['Me interesa', 'Yo también busco', 'Escríbeme', 'Suena bien'];
const PREVIEW_LIMIT = 3; // Respuestas visibles para visitantes

const OpinCommentsModal = ({ post, open, onClose, onPostUpdated }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [invitingTargetId, setInvitingTargetId] = useState(null);
  const [statusValue, setStatusValue] = useState(post?.status || OPIN_STATUS_OPTIONS[0].value);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const commentsEndRef = useRef(null);

  // Detectar si es visitante (no logueado o guest)
  const isGuest = !user || user.isAnonymous || user.isGuest;
  const canInteract = !isGuest;
  const currentUserId = user?.uid || user?.id || null;
  const isOwner = currentUserId && post?.userId === currentUserId;
  const statusMeta = getOpinStatusMeta(statusValue);

  useEffect(() => {
    if (open && post) {
      loadComments();
    }
  }, [open, post]);

  useEffect(() => {
    setStatusValue(post?.status || OPIN_STATUS_OPTIONS[0].value);
  }, [post?.status, post?.id]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const fetchedComments = await getPostComments(post.id);
      setComments(fetchedComments);
    } catch (error) {
      console.error('Error cargando respuestas:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las respuestas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const sendComment = async (text) => {
    if (!user) {
      toast({
        title: 'Inicia sesión',
        description: 'Debes iniciar sesión para responder',
      });
      return;
    }

    if (user.isAnonymous || user.isGuest) {
      toast({
        title: 'Regístrate para responder',
        description: 'Los invitados no pueden responder',
      });
      return;
    }

    if (!text || text.trim().length < 1 || text.length > 150) {
      toast({
        title: 'Respuesta inválida',
        description: 'Escribe entre 1 y 150 caracteres',
        variant: 'destructive',
      });
      return;
    }

    if (comments.length >= 100) {
      toast({
        title: 'Límite alcanzado',
        description: 'Esta nota ya tiene 100 respuestas',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const newComment = await addComment(post.id, text);

      setComments((prev) => {
        const next = [...prev, newComment];
        onPostUpdated?.(post.id, {
          commentCount: next.length,
          lastCommentAt: new Date(),
          lastInteractionAt: new Date(),
        });
        return next;
      });
      setCommentText('');

      toast({
        title: 'Respuesta enviada',
      });

      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Error enviando respuesta:', error);
      toast({
        title: 'Error',
        description: error?.message === 'BLOCKED'
          ? 'No puedes interactuar con este usuario'
          : (error.message || 'No se pudo enviar la respuesta'),
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    await sendComment(commentText);
  };

  const handleQuickReply = async (text) => {
    await sendComment(text);
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('¿Eliminar esta respuesta?')) return;

    try {
      await deleteComment(commentId);
      setComments((prev) => {
        const next = prev.filter((comment) => comment.id !== commentId);
        onPostUpdated?.(post.id, {
          commentCount: next.length,
          lastInteractionAt: new Date(),
        });
        return next;
      });

      toast({
        title: 'Respuesta eliminada',
      });
    } catch (error) {
      console.error('Error eliminando respuesta:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar la respuesta',
        variant: 'destructive',
      });
    }
  };

  const getInviteErrorMessage = (error) => {
    switch (error?.message) {
      case 'BLOCKED':
        return 'No puedes invitar a este usuario a chat privado.';
      case 'REQUEST_ALREADY_PENDING':
        return 'Ya tienes una invitacion pendiente con este usuario.';
      case 'OPIN_PRIVATE_REQUEST_RATE_LIMIT':
        return 'Limite alcanzado: intenta nuevamente en un rato.';
      case 'OPIN_PRIVATE_REQUEST_RECIPIENT_COOLDOWN':
        return 'Espera unos minutos antes de volver a invitar a este usuario.';
      case 'SELF_REQUEST_NOT_ALLOWED':
        return 'No puedes invitarte a ti mismo.';
      case 'AUTH_REQUIRED':
        return 'Tu sesion expiro. Vuelve a iniciar sesion.';
      default:
        return 'No se pudo enviar la invitacion privada.';
    }
  };

  const handleInviteToPrivateChat = async (targetUserId, targetUsername, metadata = {}) => {
    if (!canInteract) {
      toast({
        title: 'Registra tu cuenta',
        description: 'Debes iniciar sesion para invitar a chat privado',
      });
      return;
    }

    if (!currentUserId || !targetUserId || currentUserId === targetUserId) return;
    if (invitingTargetId) return;

    setInvitingTargetId(targetUserId);
    try {
      await sendPrivateChatRequestFromOpin(currentUserId, targetUserId, metadata);
      toast({
        title: 'Invitacion enviada',
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

  const handleStatusChange = async (nextStatus) => {
    if (!isOwner || updatingStatus || nextStatus === statusValue) return;

    setUpdatingStatus(true);
    try {
      await updateOpinStatus(post.id, nextStatus);
      setStatusValue(nextStatus);
      onPostUpdated?.(post.id, {
        status: nextStatus,
        lastInteractionAt: new Date(),
      });
      toast({ title: 'Estado actualizado', description: `Tu nota quedó como "${getOpinStatusMeta(nextStatus).label}".` });
    } catch (error) {
      toast({
        title: 'No se pudo actualizar',
        description: error?.message || 'Intenta nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full sm:max-w-2xl sm:mx-4 bg-card rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">
                {comments.length} {comments.length === 1 ? 'respuesta' : 'respuestas'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Post original (resumen) */}
          <div className="p-4 border-b border-border bg-white/5">
            <div className="flex items-start gap-3">
              {post.avatar ? (
                <img
                  src={post.avatar}
                  alt={post.username}
                  className="w-10 h-10 rounded-full ring-2 ring-primary/20 flex-shrink-0 object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full ring-2 ring-primary/20 flex-shrink-0 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                  {post.username?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">{post.username}</p>
                <div className="mt-1">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusMeta.badgeClassName}`}>
                    {statusMeta.label}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 mt-1 line-clamp-2">
                  {post.text}
                </p>
                {canInteract && post.userId && post.userId !== currentUserId && (
                  <button
                    onClick={() => handleInviteToPrivateChat(
                      post.userId,
                      post.username,
                      { postId: post.id, source: 'opin_comments_modal_post' }
                    )}
                    disabled={invitingTargetId === post.userId}
                    className="mt-2 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-fuchsia-500/20 text-fuchsia-300 hover:bg-fuchsia-500/30 transition-colors disabled:opacity-60"
                  >
                    {invitingTargetId === post.userId ? 'Enviando...' : 'Invitar a privado'}
                  </button>
                )}
              </div>
            </div>

            {isOwner && (
              <div className="mt-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">
                  Estado de tu nota
                </p>
                <div className="flex flex-wrap gap-2">
                  {OPIN_STATUS_OPTIONS.map((option) => {
                    const isActive = statusValue === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleStatusChange(option.value)}
                        disabled={updatingStatus}
                        className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                          isActive
                            ? option.badgeClassName
                            : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10'
                        } ${updatingStatus ? 'opacity-60' : ''}`}
                      >
                        {option.shortLabel}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Respuestas */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Sé el primero en responder</p>
              </div>
            ) : (
              <>
                {/* Mostrar respuestas según permisos */}
                {(isGuest ? comments.slice(0, PREVIEW_LIMIT) : comments).map((comment) => (
                  <div key={comment.id || comment.commentId} className="flex items-start gap-2 group">
                    {/* Avatar mini */}
                    {comment.avatar ? (
                      <img
                        src={comment.avatar}
                        alt={comment.username}
                        className="w-7 h-7 rounded-full flex-shrink-0 object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full flex-shrink-0 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                        {comment.username?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-semibold text-foreground">{comment.username}</span>
                        {' '}
                        <span className="text-foreground/80">{comment.comment}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {canInteract && comment.userId && comment.userId !== currentUserId && (
                        <button
                          onClick={() => handleInviteToPrivateChat(
                            comment.userId,
                            comment.username,
                            {
                              postId: post.id,
                              commentId: comment.id || comment.commentId,
                              source: 'opin_comments_modal_comment',
                            }
                          )}
                          disabled={invitingTargetId === comment.userId}
                          className="text-[11px] px-2 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300 hover:bg-fuchsia-500/30 transition-colors disabled:opacity-60"
                          title="Invitar a chat privado"
                        >
                          {invitingTargetId === comment.userId ? '...' : 'Privado'}
                        </button>
                      )}

                      {/* Botón eliminar (solo autor) */}
                      {user && (comment.userId === user.id || comment.userId === user.uid) && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                          title="Eliminar respuesta"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Bloqueo para visitantes si hay más respuestas */}
                {isGuest && comments.length > PREVIEW_LIMIT && (
                  <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                    <Lock className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground mb-1">
                      Hay {comments.length - PREVIEW_LIMIT} respuestas más
                    </p>
                    <p className="text-xs text-muted-foreground/70 mb-3">
                      Necesitas una cuenta para verlas
                    </p>
                    <button
                      onClick={() => navigate('/auth')}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      <UserPlus className="w-4 h-4" />
                      Crear cuenta gratis
                    </button>
                  </div>
                )}

                {!isGuest && <div ref={commentsEndRef} />}
              </>
            )}
          </div>

          {/* Input: Chips rápidos + Textarea (solo usuarios logueados) */}
          <div className="p-4 border-t border-border space-y-3">
            {canInteract ? (
              <>
                {/* Chips de respuesta rápida */}
                <div className="flex flex-wrap gap-2">
                  {QUICK_REPLIES.map((reply) => (
                    <button
                      key={reply}
                      onClick={() => handleQuickReply(reply)}
                      disabled={submitting}
                      className="px-3 py-1.5 rounded-full bg-white/10 text-foreground text-sm
                               hover:bg-purple-500/30 hover:text-purple-300
                               border border-white/10 hover:border-purple-500/50
                               transition-all disabled:opacity-50"
                    >
                      {reply}
                    </button>
                  ))}
                </div>

                {/* Textarea reducido */}
                <form onSubmit={handleSubmitComment} className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="O escribe algo breve..."
                    maxLength={150}
                    className="flex-1 px-3 py-2 bg-background border border-border rounded-lg
                             text-foreground placeholder:text-muted-foreground
                             focus:border-primary focus:outline-none text-sm"
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim() || submitting || comments.length >= 100}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500
                             hover:from-purple-600 hover:to-pink-600 text-white font-semibold
                             disabled:opacity-50 disabled:cursor-not-allowed
                             transition-all flex items-center gap-2"
                  >
                    {submitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </form>

                {commentText.length > 0 && (
                  <p className={`text-xs ${commentText.length > 150 ? 'text-red-400' : 'text-muted-foreground'}`}>
                    {commentText.length}/150 caracteres
                  </p>
                )}
              </>
            ) : (
              /* Estado bloqueado para visitantes */
              <div className="text-center py-3">
                <p className="text-sm text-muted-foreground mb-2">
                  Regístrate para interactuar
                </p>
                <button
                  onClick={() => navigate('/auth')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-foreground text-sm font-medium transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Crear cuenta
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OpinCommentsModal;
