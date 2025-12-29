import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, MessageCircle, TrendingUp, Heart, Send, Clock, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';
import { getThreadById, getReplies, addReply, voteThread, voteReply } from '@/services/forumService';
import { forumSeedData } from '@/data/forumSeedData';

const ThreadDetailPage = () => {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [thread, setThread] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [likedReplies, setLikedReplies] = useState(new Set()); // Trackear respuestas que el usuario ha dado like
  const [likedThread, setLikedThread] = useState(false); // Trackear si dio like al thread principal
  const [replyingTo, setReplyingTo] = useState(null); // ID del comentario al que se está respondiendo
  const [replyingToUser, setReplyingToUser] = useState(null); // Nombre del usuario al que se responde

  useEffect(() => {
    const loadThread = async () => {
      setLoading(true);
      try {
        console.log(`🔍 [THREAD] Cargando thread ID: ${threadId}`);

        // ✅ Primero buscar en seed data (más rápido y sin errores de permisos)
        const seedThread = forumSeedData.find(t => t.id === threadId);

        if (seedThread) {
          console.log('✅ [THREAD] Thread encontrado en seed data');
          setThread({
            ...seedThread,
            timestamp: seedThread.timestamp || Date.now(),
          });
          setReplies(seedThread.repliesData || []);
          setLoading(false);
          return;
        }

        // Si no está en seed data, intentar Firestore (probablemente un thread nuevo creado por usuario)
        console.log('🔄 [THREAD] Buscando en Firestore...');
        const firestoreThread = await Promise.race([
          getThreadById(threadId),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 3000)
          )
        ]);

        if (firestoreThread) {
          console.log('✅ [THREAD] Thread encontrado en Firestore');
          setThread(firestoreThread);
          const firestoreReplies = await getReplies(threadId);
          setReplies(firestoreReplies);
        } else {
          console.log('❌ [THREAD] Thread no encontrado');
          toast({
            title: "Hilo no encontrado",
            description: "El hilo que buscas no existe.",
            variant: "destructive",
          });
          navigate('/anonymous-forum');
        }
      } catch (error) {
        console.error('❌ [THREAD] Error cargando thread:', error);
        toast({
          title: "Error",
          description: "No se pudo cargar el hilo. Volviendo al foro...",
          variant: "destructive",
        });
        setTimeout(() => navigate('/anonymous-forum'), 1500);
      } finally {
        setLoading(false);
      }
    };

    if (threadId) {
      loadThread();
    }
  }, [threadId, navigate]);

  const handleAddReply = async () => {
    if (!user || user.isGuest || user.isAnonymous) {
      toast({
        title: "Registro Requerido",
        description: "Debes estar registrado para responder en el foro.",
        variant: "destructive",
      });
      return;
    }

    if (!replyContent.trim()) {
      toast({
        title: "Campo vacío",
        description: "Escribe una respuesta antes de enviar.",
        variant: "destructive",
      });
      return;
    }

    setSendingReply(true);
    try {
      // Agregar respuesta localmente (ya que usamos seed data)
      const newReply = {
        id: `reply_${Date.now()}_${Math.random()}`,
        content: replyContent.trim(),
        authorDisplay: user.username || 'Usuario Anónimo',
        authorId: user.uid,
        timestamp: Date.now(),
        likes: 0,
        replyingTo: replyingTo, // ID del comentario al que responde
        replyingToUser: replyingToUser, // Usuario al que responde
      };

      setReplies([...replies, newReply]);
      setReplyContent('');
      setReplyingTo(null);
      setReplyingToUser(null);

      toast({
        title: "✅ Respuesta publicada",
        description: "Tu respuesta ha sido publicada.",
      });
    } catch (error) {
      console.error('Error agregando respuesta:', error);
      toast({
        title: "Error",
        description: "No se pudo publicar la respuesta. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setSendingReply(false);
    }
  };

  // ✅ Función para responder a un comentario específico
  const handleReplyToComment = (replyId, authorDisplay) => {
    setReplyingTo(replyId);
    setReplyingToUser(authorDisplay);
    // Agregar mención automática al textarea
    setReplyContent(`@${authorDisplay} `);
    // Hacer scroll al textarea
    document.getElementById('reply-textarea')?.focus();
  };

  // ✅ Cancelar respuesta a comentario específico
  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyingToUser(null);
    setReplyContent('');
  };

  const handleVote = async () => {
    if (!user || user.isGuest || user.isAnonymous) {
      toast({
        title: "Registro Requerido",
        description: "Debes estar registrado para votar.",
        variant: "destructive",
      });
      return;
    }

    if (likedThread) {
      toast({
        title: "Ya has votado",
        description: "Ya has dado like a este hilo.",
        variant: "destructive",
      });
      return;
    }

    try {
      // ✅ Actualizar localmente (seed data)
      setThread({ ...thread, likes: (thread.likes || 0) + 1 });
      setLikedThread(true);
      toast({
        title: "✅ Voto registrado",
        description: "Gracias por tu voto.",
      });
    } catch (error) {
      console.error('Error votando:', error);
    }
  };

  const handleVoteReply = async (replyId, currentLikes) => {
    if (!user || user.isGuest || user.isAnonymous) {
      toast({
        title: "Registro Requerido",
        description: "Debes estar registrado para votar.",
        variant: "destructive",
      });
      return;
    }

    // Prevenir múltiples likes del mismo usuario (tracking local)
    if (likedReplies.has(replyId)) {
      toast({
        title: "Ya has votado",
        description: "Ya has dado like a esta respuesta.",
        variant: "destructive",
      });
      return;
    }

    try {
      // ✅ Actualizar localmente (seed data)
      setReplies(replies.map(reply =>
        reply.id === replyId
          ? { ...reply, likes: (reply.likes || 0) + 1 }
          : reply
      ));

      // Marcar como votado
      setLikedReplies(new Set([...likedReplies, replyId]));

      toast({
        title: "✅ Like registrado",
        description: "Gracias por tu voto.",
      });
    } catch (error) {
      console.error('Error votando respuesta:', error);
      toast({
        title: "Error",
        description: "No se pudo registrar el voto. Intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Hace un momento';
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Hace un momento';
    if (minutes < 60) return `Hace ${minutes} min`;
    if (hours < 24) return `Hace ${hours} h`;
    return `Hace ${days} días`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Hilo no encontrado</h2>
          <Button onClick={() => navigate('/anonymous-forum')}>Volver al foro</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate('/anonymous-forum')} className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </div>

        {/* Thread Principal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-effect rounded-xl p-6 mb-6 border"
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 font-semibold">
                  {thread.category}
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(thread.timestamp)}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-4">{thread.title}</h1>
              <p className="text-base text-muted-foreground whitespace-pre-wrap mb-4">{thread.content}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{thread.authorDisplay || 'Usuario Anónimo'}</span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  {thread.replies || replies.length} respuestas
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  {thread.likes || 0} votos
                </span>
              </div>
            </div>

            {/* ✅ Botón de Like mejorado con estado visual */}
            <button
              onClick={handleVote}
              disabled={!user || user.isGuest || user.isAnonymous || likedThread}
              className={`
                inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-200 border
                ${likedThread
                  ? 'bg-red-500/20 border-red-500/30 text-red-400 cursor-not-allowed'
                  : user && !user.isGuest && !user.isAnonymous
                  ? 'bg-muted border-border hover:bg-red-500/10 hover:border-red-500/30 text-foreground hover:text-red-400 cursor-pointer active:scale-95'
                  : 'bg-muted border-border text-muted-foreground cursor-not-allowed opacity-50'
                }
              `}
              title={likedThread ? 'Ya has dado like' : !user || user.isGuest || user.isAnonymous ? 'Debes estar registrado para votar' : 'Dar like a este hilo'}
            >
              <Heart
                className={`w-5 h-5 transition-all ${
                  likedThread
                    ? 'fill-red-500 text-red-500'
                    : 'text-current'
                }`}
              />
              <span>{likedThread ? 'Te gusta' : 'Me gusta'}</span>
            </button>
          </div>
        </motion.div>

        {/* Formulario de Respuesta */}
        {user && !user.isGuest && !user.isAnonymous && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-effect rounded-xl p-6 mb-6 border"
          >
            <h3 className="text-lg font-bold mb-4">Escribe una respuesta</h3>

            {/* ✅ Indicador de respuesta a comentario */}
            {replyingTo && replyingToUser && (
              <div className="mb-3 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-cyan-400">
                    Respondiendo a <span className="font-bold">{replyingToUser}</span>
                  </span>
                </div>
                <button
                  onClick={handleCancelReply}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <Textarea
              id="reply-textarea"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder={replyingTo ? "Escribe tu respuesta... Usa @ para mencionar a alguien" : "Escribe tu respuesta aquí... Usa @ para mencionar a alguien"}
              className="min-h-[120px] bg-secondary border-2 border-input focus:border-cyan-400 mb-4"
              maxLength={1000}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{replyContent.length}/1000 caracteres</p>
              <Button
                onClick={handleAddReply}
                disabled={sendingReply || !replyContent.trim()}
                className="magenta-gradient text-white font-bold"
              >
                <Send className="w-4 h-4 mr-2" />
                {sendingReply ? 'Enviando...' : 'Publicar Respuesta'}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Lista de Respuestas */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold mb-4">
            {replies.length} {replies.length === 1 ? 'Respuesta' : 'Respuestas'}
          </h2>
          
          {replies.length === 0 ? (
            <div className="glass-effect rounded-xl p-8 text-center border">
              <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Aún no hay respuestas. ¡Sé el primero en responder!</p>
            </div>
          ) : (
            <AnimatePresence>
              {replies.map((reply, index) => {
                // ✅ Procesar contenido para resaltar menciones (@usuario)
                const renderContent = (text) => {
                  const parts = text.split(/(@\w+)/g);
                  return parts.map((part, i) => {
                    if (part.startsWith('@')) {
                      return (
                        <span key={i} className="text-cyan-400 font-semibold">
                          {part}
                        </span>
                      );
                    }
                    return part;
                  });
                };

                return (
                  <motion.div
                    key={reply.id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`glass-effect rounded-xl p-5 border ${reply.replyingTo ? 'ml-8 border-l-4 border-l-cyan-500/50' : ''}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-semibold">{reply.authorDisplay || 'Usuario Anónimo'}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(reply.timestamp)}
                          </span>
                        </div>

                        {/* ✅ Indicador de respuesta a otro comentario */}
                        {reply.replyingToUser && (
                          <div className="mb-2 text-xs text-cyan-400 flex items-center gap-1">
                            <ArrowRight className="w-3 h-3" />
                            <span>Respondiendo a <span className="font-bold">{reply.replyingToUser}</span></span>
                          </div>
                        )}

                        <p className="text-sm text-foreground whitespace-pre-wrap mb-3">
                          {renderContent(reply.content)}
                        </p>

                        {/* ✅ Botones de acción: Like y Responder */}
                        <div className="flex items-center gap-3">
                          {/* Botón de Like */}
                          <button
                            onClick={() => handleVoteReply(reply.id, reply.likes)}
                            disabled={!user || user.isGuest || user.isAnonymous || likedReplies.has(reply.id)}
                            className={`
                              inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
                              transition-all duration-200 border
                              ${likedReplies.has(reply.id)
                                ? 'bg-red-500/20 border-red-500/30 text-red-400 cursor-not-allowed'
                                : user && !user.isGuest && !user.isAnonymous
                                ? 'bg-muted border-border hover:bg-red-500/10 hover:border-red-500/30 text-muted-foreground hover:text-red-400 cursor-pointer active:scale-95'
                                : 'bg-muted border-border text-muted-foreground cursor-not-allowed opacity-50'
                              }
                            `}
                            title={likedReplies.has(reply.id) ? 'Ya has dado like' : !user || user.isGuest || user.isAnonymous ? 'Debes estar registrado para votar' : 'Dar like a esta respuesta'}
                          >
                            <Heart
                              className={`w-4 h-4 transition-all ${
                                likedReplies.has(reply.id)
                                  ? 'fill-red-500 text-red-500'
                                  : reply.likes > 0
                                  ? 'text-red-500/70'
                                  : 'text-muted-foreground'
                              }`}
                            />
                            <span className="font-semibold">{reply.likes || 0}</span>
                          </button>

                          {/* ✅ Botón de Responder */}
                          {user && !user.isGuest && !user.isAnonymous && (
                            <button
                              onClick={() => handleReplyToComment(reply.id, reply.authorDisplay)}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-muted border border-border hover:bg-cyan-500/10 hover:border-cyan-500/30 text-muted-foreground hover:text-cyan-400 cursor-pointer active:scale-95 transition-all duration-200"
                            >
                              <MessageCircle className="w-4 h-4" />
                              <span>Responder</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThreadDetailPage;

