/**
 * AdminOpinRepliesPanel - Panel para respuestas editoriales a OPINs
 *
 * Permite a admins:
 * - Ver todos los OPINs activos
 * - Responder como nombre personalizado (Equipo Chactivo, Moderador, etc.)
 * - Las respuestas se guardan como comentarios normales con isAdminReply: true
 * - Son visibles públicamente e indistinguibles de respuestas de usuarios
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  RefreshCw,
  Loader2,
  Send,
  X,
  MessageCircle,
  User,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import {
  getOpinPostsForAdmin,
  addAdminReply,
  getPostComments,
  ADMIN_REPLY_NAMES,
  OPIN_COLORS,
} from '@/services/opinService';

export default function AdminOpinRepliesPanel() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [replying, setReplying] = useState(false);

  // Form state
  const [authorName, setAuthorName] = useState('Anónimo');
  const [customName, setCustomName] = useState('');
  const [replyText, setReplyText] = useState('');
  const [showCustomName, setShowCustomName] = useState(false);

  // Preview de respuestas existentes
  const [previewReplies, setPreviewReplies] = useState([]);
  const [loadingReplies, setLoadingReplies] = useState(false);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const list = await getOpinPostsForAdmin(100);
      setPosts(list);
    } catch (e) {
      console.error(e);
      toast({
        title: 'Error',
        description: e.message || 'No se pudieron cargar los OPINs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const openReplyModal = async (post) => {
    setSelectedPost(post);
    setReplyText('');
    setAuthorName('Anónimo'); // Por defecto responder como usuario anónimo
    setCustomName('');
    setShowCustomName(false);
    setReplyModalOpen(true);

    // Cargar respuestas existentes
    setLoadingReplies(true);
    try {
      const replies = await getPostComments(post.id, 10);
      setPreviewReplies(replies);
    } catch (e) {
      console.warn('Error cargando respuestas:', e);
      setPreviewReplies([]);
    } finally {
      setLoadingReplies(false);
    }
  };

  const closeReplyModal = () => {
    setReplyModalOpen(false);
    setSelectedPost(null);
    setPreviewReplies([]);
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();

    const finalAuthorName = showCustomName ? customName.trim() : authorName;

    if (!finalAuthorName) {
      toast({
        title: 'Nombre requerido',
        description: 'Selecciona o escribe un nombre de autor',
        variant: 'destructive',
      });
      return;
    }

    if (!replyText.trim() || replyText.length > 150) {
      toast({
        title: 'Texto inválido',
        description: 'La respuesta debe tener entre 1 y 150 caracteres',
        variant: 'destructive',
      });
      return;
    }

    setReplying(true);
    try {
      const newReply = await addAdminReply(selectedPost.id, replyText.trim(), finalAuthorName);

      toast({
        title: 'Respuesta enviada',
        description: `Publicada como "${finalAuthorName}"`,
      });

      // Actualizar preview local
      setPreviewReplies(prev => [...prev, newReply]);
      setReplyText('');

      // Actualizar conteo en la lista
      setPosts(prev => prev.map(p =>
        p.id === selectedPost.id
          ? { ...p, commentCount: (p.commentCount || 0) + 1 }
          : p
      ));
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo enviar la respuesta',
        variant: 'destructive',
      });
    } finally {
      setReplying(false);
    }
  };

  const isValidReply = replyText.trim().length >= 1 && replyText.length <= 150 &&
    (showCustomName ? customName.trim().length >= 1 : authorName.length >= 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-cyan-400" />
          <div>
            <h2 className="text-xl font-bold text-foreground">Responder OPINs</h2>
            <p className="text-sm text-muted-foreground">
              Respuestas editoriales para mantener el tablón activo. Visibles públicamente.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={loadPosts} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Actualizar
        </Button>
      </div>

      {/* Info box */}
      <div className="p-4 rounded-lg border border-cyan-500/30 bg-cyan-500/10">
        <p className="text-sm text-foreground">
          <strong>Nota:</strong> Las respuestas que envíes aparecerán como respuestas normales de usuario.
          Se guardan con marca interna <code className="bg-background/50 px-1 rounded">isAdminReply: true</code> para auditoría,
          pero no se muestra esta información públicamente.
        </p>
      </div>

      {/* Lista de OPINs */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-dashed border-border bg-muted/30">
          <MessageSquare className="w-12 h-12 text-cyan-400 mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">No hay OPINs activos</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {posts.map((post) => {
            const cfg = OPIN_COLORS[post.color] || OPIN_COLORS.purple;
            const replyCount = post.commentCount || 0;

            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`p-4 rounded-xl border ${cfg.border} ${cfg.bg}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  {/* Contenido del OPIN */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-foreground">@{post.username}</span>
                      {post.isStable && (
                        <span className="text-xs bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded">
                          estable
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {replyCount} {replyCount === 1 ? 'respuesta' : 'respuestas'}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/90 line-clamp-2">{post.text}</p>
                  </div>

                  {/* Botón responder */}
                  <Button
                    size="sm"
                    onClick={() => openReplyModal(post)}
                    className="shrink-0"
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    Responder OPIN
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal de respuesta */}
      <AnimatePresence>
        {replyModalOpen && selectedPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={closeReplyModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-card rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header del modal */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="text-lg font-bold text-foreground">Responder OPIN</h3>
                <button
                  onClick={closeReplyModal}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* OPIN original */}
              <div className="p-4 border-b border-border bg-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-foreground">@{selectedPost.username}</span>
                </div>
                <p className="text-sm text-foreground/80">{selectedPost.text}</p>
              </div>

              {/* Respuestas existentes */}
              {loadingReplies ? (
                <div className="p-4 text-center">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                </div>
              ) : previewReplies.length > 0 && (
                <div className="p-4 border-b border-border max-h-40 overflow-y-auto space-y-2">
                  <p className="text-xs text-muted-foreground mb-2">
                    Respuestas existentes ({previewReplies.length}):
                  </p>
                  {previewReplies.map((reply) => (
                    <div key={reply.id} className="flex items-start gap-2 text-sm">
                      <div className="w-5 h-5 rounded-full flex-shrink-0 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-[10px] font-bold">
                        {reply.username?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <p className="text-foreground/80">
                        <span className="font-semibold text-foreground">{reply.username}</span>
                        {reply.isAdminReply && (
                          <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1 py-0.5 rounded ml-1">
                            admin
                          </span>
                        )}
                        {' '}{reply.comment}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Formulario */}
              <form onSubmit={handleSubmitReply} className="p-4 space-y-4">
                {/* Selector de nombre */}
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Responder como:
                  </label>

                  {!showCustomName ? (
                    <div className="space-y-3">
                      {/* Usuarios anónimos / genéricos */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">👤 Como usuario (para simular actividad):</p>
                        <div className="flex flex-wrap gap-2">
                          {ADMIN_REPLY_NAMES.filter(n => !['Equipo Chactivo', 'Moderador', 'Soporte', 'Comunidad'].includes(n)).map((name) => (
                            <button
                              key={name}
                              type="button"
                              onClick={() => setAuthorName(name)}
                              className={`px-3 py-1.5 rounded-full text-sm transition-all border
                                ${authorName === name
                                  ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                                  : 'bg-white/5 border-white/10 text-foreground hover:bg-white/10'
                                }`}
                            >
                              {name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Equipo oficial */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">🛡️ Como equipo oficial:</p>
                        <div className="flex flex-wrap gap-2">
                          {['Equipo Chactivo', 'Moderador', 'Soporte', 'Comunidad'].map((name) => (
                            <button
                              key={name}
                              type="button"
                              onClick={() => setAuthorName(name)}
                              className={`px-3 py-1.5 rounded-full text-sm transition-all border
                                ${authorName === name
                                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                                  : 'bg-white/5 border-white/10 text-foreground hover:bg-white/10'
                                }`}
                            >
                              {name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowCustomName(true)}
                        className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                      >
                        <User className="w-3 h-3" />
                        Usar nombre personalizado
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="Nombre personalizado..."
                        maxLength={30}
                        className="bg-background border-border"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setShowCustomName(false);
                          setCustomName('');
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                      >
                        <ChevronDown className="w-3 h-3" />
                        Volver a nombres predefinidos
                      </button>
                    </div>
                  )}
                </div>

                {/* Texto de respuesta */}
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">
                    Respuesta:
                  </label>
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Escribe tu respuesta..."
                    rows={3}
                    maxLength={150}
                    className="bg-background border-border resize-none"
                  />
                  <span className={`text-xs ${replyText.length > 150 ? 'text-red-400' : 'text-muted-foreground'}`}>
                    {replyText.length}/150 caracteres
                  </span>
                </div>

                {/* Botones */}
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={closeReplyModal}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={!isValidReply || replying}>
                    {replying ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : (
                      <Send className="w-4 h-4 mr-1" />
                    )}
                    Enviar respuesta
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
