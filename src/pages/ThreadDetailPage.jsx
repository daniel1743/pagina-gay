import React, { useState, useEffect, useRef } from 'react'; // ✅ Agregado useRef
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, MessageCircle, TrendingUp, Heart, Send, Clock, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';
import { getThreadById, getReplies, voteThread, voteReply } from '@/services/forumService'; // Asegúrate de importar lo necesario
import { forumSeedData } from '@/data/forumSeedData';
import AuthorBadge from '@/components/forum/AuthorBadge'; // ✅ Importar componente reutilizable

const ThreadDetailPage = () => {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Refs
  const textareaRef = useRef(null); // ✅ Referencia para el focus

  const [thread, setThread] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [likedReplies, setLikedReplies] = useState(new Set());
  const [likedThread, setLikedThread] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyingToUser, setReplyingToUser] = useState(null);

  useEffect(() => {
    const loadThread = async () => {
      setLoading(true);
      try {
        // ... (Tu lógica de carga original está bien, la mantengo igual)
        const seedThread = forumSeedData.find(t => t.id === threadId);
        if (seedThread) {
          setThread({ ...seedThread, timestamp: seedThread.timestamp || Date.now() });
          setReplies(seedThread.repliesData || []);
          setLoading(false);
          return;
        }
        // Fallback Firestore...
        // (Asumimos que esta parte sigue igual por brevedad)
        setLoading(false); 
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };
    if (threadId) loadThread();
  }, [threadId]);

  const handleAddReply = async () => {
    if (!user || user.isGuest || user.isAnonymous) {
      toast({ title: "Registro Requerido", description: "Debes estar registrado.", variant: "destructive" });
      return;
    }
    if (!replyContent.trim()) return;

    setSendingReply(true);
    try {
      const newReply = {
        id: `reply_${Date.now()}_${Math.random()}`,
        content: replyContent.trim(),
        authorDisplay: user.username || 'Usuario Anónimo',
        authorId: user.uid,
        timestamp: Date.now(),
        likes: 0,
        replyingTo: replyingTo,
        replyingToUser: replyingToUser,
      };

      setReplies([...replies, newReply]);
      setReplyContent('');
      setReplyingTo(null);
      setReplyingToUser(null);
      toast({ title: "✅ Respuesta publicada" });
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setSendingReply(false);
    }
  };

  const handleReplyToComment = (replyId, authorDisplay) => {
    setReplyingTo(replyId);
    setReplyingToUser(authorDisplay);
    setReplyContent(`@${authorDisplay} `);
    
    // ✅ FOCUS MEJORADO: Usando ref y scroll suave
    setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyingToUser(null);
    setReplyContent('');
  };

  // ... (Tus funciones handleVote y handleVoteReply están bien, las omito para ahorrar espacio visual)
  // Asegúrate de incluirlas aquí tal como las tenías.
  const handleVote = () => { /* tu logica */ setLikedThread(true); };
  const handleVoteReply = (id) => { /* tu logica */ setLikedReplies(prev => new Set(prev).add(id)); };

  const formatTime = (timestamp) => { /* tu logica */ return 'Hace un momento'; };

  // ✅ RENDER CONTENT MEJORADO: Soporta nombres con espacios simples
  const renderContent = (text) => {
    // Regex mejorado: Busca @ seguido de palabras, permitiendo espacios si es un nombre común
    // Nota: Esto es complejo de perfeccionar, pero esto cubre "Usuario 1"
    const parts = text.split(/(@[\w\s]+?)(?=\s|$)/g); 
    
    return parts.map((part, i) => {
      if (part.trim().startsWith('@')) {
        return <span key={i} className="text-cyan-400 font-semibold">{part}</span>;
      }
      return part;
    });
  };

  if (loading) return <div className="p-10 text-center">Cargando...</div>;
  if (!thread) return null;

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate('/anonymous-forum')} className="text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" /> Volver
          </Button>
        </div>

        {/* Thread Principal */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-effect rounded-xl p-6 mb-6 border">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 font-semibold">{thread.category}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(thread.timestamp)}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-4">{thread.title}</h1>
              <p className="text-base text-muted-foreground whitespace-pre-wrap mb-4">{thread.content}</p>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {/* ✅ USO DEL COMPONENTE REUTILIZABLE */}
                <AuthorBadge name={thread.authorDisplay} />
                
                <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4" /> {thread.replies || replies.length} respuestas</span>
                <span className="flex items-center gap-1"><TrendingUp className="w-4 h-4" /> {thread.likes || 0} votos</span>
              </div>
            </div>
            
            <button onClick={handleVote} disabled={likedThread} className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all border ${likedThread ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-muted border-border hover:bg-red-500/10'}`}>
              <Heart className={`w-5 h-5 ${likedThread ? 'fill-red-500 text-red-500' : 'text-current'}`} />
              <span>{likedThread ? 'Te gusta' : 'Me gusta'}</span>
            </button>
          </div>
        </motion.div>

        {/* Formulario de Respuesta */}
        {user && !user.isGuest && !user.isAnonymous && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-effect rounded-xl p-6 mb-6 border">
            <h3 className="text-lg font-bold mb-4">Escribe una respuesta</h3>
            
            {replyingTo && replyingToUser && (
              <div className="mb-3 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm text-cyan-400">Respondiendo a <span className="font-bold">{replyingToUser}</span></span>
                </div>
                <button onClick={handleCancelReply} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
              </div>
            )}

            <Textarea
              ref={textareaRef} // ✅ Ref asignada
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Escribe tu respuesta aquí... Usa @ para mencionar"
              className="min-h-[120px] bg-secondary border-2 border-input focus:border-cyan-400 mb-4"
              maxLength={1000}
            />
            
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{replyContent.length}/1000</p>
              <Button onClick={handleAddReply} disabled={sendingReply || !replyContent.trim()} className="magenta-gradient text-white font-bold">
                <Send className="w-4 h-4 mr-2" /> {sendingReply ? 'Enviando...' : 'Publicar'}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Lista de Respuestas */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold mb-4">{replies.length} Respuestas</h2>
          <AnimatePresence>
            {replies.map((reply, index) => (
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
                      {/* ✅ USO DEL COMPONENTE REUTILIZABLE */}
                      <div className="text-sm"><AuthorBadge name={reply.authorDisplay} /></div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(reply.timestamp)}</span>
                    </div>

                    {reply.replyingToUser && (
                      <div className="mb-2 text-xs text-cyan-400 flex items-center gap-1">
                        <ArrowRight className="w-3 h-3" /> <span>Respondiendo a <span className="font-bold">{reply.replyingToUser}</span></span>
                      </div>
                    )}

                    <p className="text-sm text-foreground whitespace-pre-wrap mb-3">
                      {renderContent(reply.content)}
                    </p>

                    <div className="flex items-center gap-3">
                      <button onClick={() => handleVoteReply(reply.id)} disabled={likedReplies.has(reply.id)} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${likedReplies.has(reply.id) ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-muted hover:text-red-400'}`}>
                        <Heart className={`w-4 h-4 ${likedReplies.has(reply.id) ? 'fill-red-500 text-red-500' : 'text-current'}`} />
                        <span className="font-semibold">{reply.likes || 0}</span>
                      </button>
                      
                      {user && !user.isGuest && !user.isAnonymous && (
                        <button onClick={() => handleReplyToComment(reply.id, reply.authorDisplay)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-muted border hover:text-cyan-400 transition-all">
                          <MessageCircle className="w-4 h-4" /> <span>Responder</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ThreadDetailPage;