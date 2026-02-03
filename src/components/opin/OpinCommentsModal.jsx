/**
 * 💬 OpinCommentsModal - Modal de comentarios para posts OPIN
 *
 * Features:
 * - Ver todos los comentarios (100 max)
 * - Agregar comentario (solo registrados)
 * - Eliminar propio comentario
 * - Scroll infinito
 * - Avatar + username + timestamp
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Trash2, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getPostComments, addComment, deleteComment } from '@/services/opinService';
import { toast } from '@/components/ui/use-toast';

const OpinCommentsModal = ({ post, open, onClose }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const commentsEndRef = useRef(null);

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
      console.error('Error cargando comentarios:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los comentarios',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: 'Inicia sesión',
        description: 'Debes iniciar sesión para comentar',
      });
      return;
    }

    if (user.isAnonymous || user.isGuest) {
      toast({
        title: 'Regístrate para comentar',
        description: 'Los invitados no pueden comentar',
      });
      return;
    }

    if (!commentText.trim() || commentText.length > 500) {
      toast({
        title: 'Comentario inválido',
        description: 'Escribe entre 1 y 500 caracteres',
        variant: 'destructive',
      });
      return;
    }

    if (comments.length >= 100) {
      toast({
        title: 'Límite alcanzado',
        description: 'Este post ya tiene 100 comentarios',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const newComment = await addComment(post.id, commentText);

      setComments(prev => [...prev, newComment]);
      setCommentText('');

      toast({
        title: '✅ Comentario publicado',
      });

      // Scroll to bottom
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Error agregando comentario:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo publicar el comentario',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('¿Eliminar este comentario?')) return;

    try {
      await deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));

      toast({
        title: '🗑️ Comentario eliminado',
      });
    } catch (error) {
      console.error('Error eliminando comentario:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el comentario',
        variant: 'destructive',
      });
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Ahora';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
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
                Comentarios ({comments.length}/{100})
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
                {post.title && (
                  <p className="text-sm font-bold text-foreground mt-1">{post.title}</p>
                )}
                <p className="text-sm text-foreground/80 mt-1 line-clamp-2">
                  {post.text}
                </p>
              </div>
            </div>
          </div>

          {/* Comentarios */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Sé el primero en comentar</p>
              </div>
            ) : (
              <>
                {comments.map((comment) => (
                  <div key={comment.id || comment.commentId} className="flex items-start gap-3 group">
                    {comment.avatar ? (
                      <img
                        src={comment.avatar}
                        alt={comment.username}
                        className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full flex-shrink-0 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                        {comment.username?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">
                          {comment.username}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/90 mt-1 whitespace-pre-wrap break-words">
                        {comment.comment}
                      </p>
                    </div>

                    {/* Botón eliminar (solo autor) */}
                    {user && comment.userId === user.id && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                        title="Eliminar comentario"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    )}
                  </div>
                ))}
                <div ref={commentsEndRef} />
              </>
            )}
          </div>

          {/* Input para comentar */}
          <div className="p-4 border-t border-border">
            {user && !user.isAnonymous && !user.isGuest ? (
              <form onSubmit={handleSubmitComment} className="flex gap-2">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Escribe un comentario..."
                  maxLength={500}
                  rows={2}
                  className="flex-1 px-3 py-2 bg-background border border-border rounded-lg
                           text-foreground placeholder:text-muted-foreground
                           focus:border-primary focus:outline-none resize-none text-sm"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim() || submitting || comments.length >= 100}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500
                           hover:from-purple-600 hover:to-pink-600 text-white font-semibold
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all flex items-center gap-2 self-end"
                >
                  {submitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            ) : (
              <div className="text-center py-2 text-sm text-muted-foreground">
                {user ? (
                  <p>
                    <button
                      onClick={() => window.location.href = '/auth'}
                      className="text-primary hover:underline"
                    >
                      Regístrate
                    </button>
                    {' '}para comentar
                  </p>
                ) : (
                  <p>
                    <button
                      onClick={() => window.location.href = '/auth'}
                      className="text-primary hover:underline"
                    >
                      Inicia sesión
                    </button>
                    {' '}para comentar
                  </p>
                )}
              </div>
            )}

            {commentText.length > 0 && (
              <p className={`text-xs mt-1 ${commentText.length > 500 ? 'text-red-400' : 'text-muted-foreground'}`}>
                {commentText.length}/500 caracteres
              </p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OpinCommentsModal;
