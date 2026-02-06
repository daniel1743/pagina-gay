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
import { getPostComments, addComment, deleteComment } from '@/services/opinService';
import { toast } from '@/components/ui/use-toast';

const QUICK_REPLIES = ['Me interesa', 'Yo también busco', 'Escríbeme', 'Suena bien'];
const PREVIEW_LIMIT = 3; // Respuestas visibles para visitantes

const OpinCommentsModal = ({ post, open, onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const commentsEndRef = useRef(null);

  // Detectar si es visitante (no logueado o guest)
  const isGuest = !user || user.isAnonymous || user.isGuest;
  const canInteract = !isGuest;

  useEffect(() => {
    if (open && post) {
      loadComments();
    }
  }, [open, post]);

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

      setComments(prev => [...prev, newComment]);
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
        description: error.message || 'No se pudo enviar la respuesta',
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
      setComments(prev => prev.filter(c => c.id !== commentId));

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
                <p className="text-sm text-foreground/80 mt-1 line-clamp-2">
                  {post.text}
                </p>
              </div>
            </div>
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
