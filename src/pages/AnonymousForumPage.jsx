import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, MessageCircle, TrendingUp, MessageSquare, ArrowRight, X, Heart, Shield, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';
import { getThreads, createThread } from '@/services/forumService';
import { forumSeedData } from '@/data/forumSeedData';
import CreateThreadModal from '@/components/forum/CreateThreadModal';
import AuthorBadge from '@/components/forum/AuthorBadge'; // ✅ IMPORTADO

const categories = ['Apoyo Emocional', 'Recursos', 'Experiencias', 'Preguntas', 'Logros'];

const AnonymousForumPage = () => {
  const [likedThreads, setLikedThreads] = useState(new Set());

  React.useEffect(() => {
    const previousTitle = document.title;
    // ✅ SEO: Título optimizado para CTR con keywords
    document.title = "Foro Anónimo Gay Chile 🕵️ Confesiones y Experiencias | Chactivo";

    // ✅ SEO: Meta description con CTA
    let metaDescription = document.querySelector('meta[name="description"]');
    let previousDescription = "";

    if (metaDescription) {
      previousDescription = metaDescription.getAttribute('content');
      metaDescription.content = "Foro gay 100% anónimo. Comparte experiencias, haz preguntas y lee confesiones sin que nadie sepa quién eres. Categorías: Apoyo, Experiencias, Preguntas. Entra ahora.";
    } else {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      metaDescription.content = "Foro gay 100% anónimo. Comparte experiencias, haz preguntas y lee confesiones sin que nadie sepa quién eres. Categorías: Apoyo, Experiencias, Preguntas. Entra ahora.";
      document.head.appendChild(metaDescription);
    }

    // ✅ SEO: Canonical
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = 'https://chactivo.com/anonymous-forum';

    // ✅ SEO: Schema.org para DiscussionForumPosting
    let schemaScript = document.getElementById('forum-schema');
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.id = 'forum-schema';
      schemaScript.type = 'application/ld+json';
      schemaScript.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "DiscussionForumPosting",
        "headline": "Foro Anónimo Gay Chile - Confesiones y Experiencias",
        "description": "Espacio seguro y anónimo para la comunidad LGBT+ en Chile. Comparte experiencias, pide consejos y conecta sin revelar tu identidad.",
        "url": "https://chactivo.com/anonymous-forum",
        "author": {
          "@type": "Organization",
          "name": "Chactivo"
        },
        "publisher": {
          "@type": "Organization",
          "name": "Chactivo",
          "logo": {
            "@type": "ImageObject",
            "url": "https://chactivo.com/icon-512.png"
          }
        },
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": "https://chactivo.com/anonymous-forum"
        }
      });
      document.head.appendChild(schemaScript);
    }

    return () => {
      document.title = previousTitle;
      if (metaDescription && previousDescription) {
        metaDescription.content = previousDescription;
      }
      // Limpiar schema al salir
      const schema = document.getElementById('forum-schema');
      if (schema) schema.remove();
    };
  }, []);

  const navigate = useNavigate();
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [sortBy, setSortBy] = useState('recent');
  const [showChatBanner, setShowChatBanner] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const filteredThreads = selectedCategory === 'Todos'
    ? threads
    : threads.filter(t => t.category === selectedCategory);

  const sortedThreads = [...filteredThreads].sort((a, b) => {
    if (sortBy === 'popular') return (b.likes || 0) - (a.likes || 0);
    if (sortBy === 'replies') return (b.replies || 0) - (a.replies || 0);
    return (b.timestamp || 0) - (a.timestamp || 0);
  });

  useEffect(() => {
    const initializeForum = async () => {
      if (isInitialized) return;
      try {
        await getThreads(null, 'recent', 5); // Simple check
        setIsInitialized(true);
      } catch (error) {
        setIsInitialized(true);
      }
    };
    initializeForum();
  }, [isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    const loadThreads = async () => {
      setLoading(true);
      try {
        const seedThreads = forumSeedData
          .filter(t => selectedCategory === 'Todos' || t.category === selectedCategory)
          .map(t => ({
            id: t.id,
            title: t.title,
            content: t.content,
            category: t.category,
            authorDisplay: t.authorDisplay,
            replies: t.replies,
            likes: t.likes,
            timestamp: t.timestamp,
          }));
        setThreads(seedThreads);
      } catch (error) {
        setThreads([]);
      } finally {
        setLoading(false);
      }
    };
    loadThreads();
  }, [selectedCategory, sortBy, isInitialized]);

  const handleCreateThread = async (threadData) => {
    if (!user || user.isGuest || user.isAnonymous) {
      toast({
        title: "Registro Requerido",
        description: "Debes estar registrado para publicar hilos.",
        variant: "destructive",
        action: (
          <Button size="sm" onClick={() => navigate('/auth')} className="bg-primary text-white">
            Iniciar Sesión
          </Button>
        ),
      });
      setShowCreateModal(false);
      return;
    }

    try {
      await createThread(threadData);
      const updatedThreads = await getThreads(selectedCategory === 'Todos' ? null : selectedCategory, sortBy, null);
      setThreads(updatedThreads);
      setShowCreateModal(false);
      toast({ title: "✅ Hilo publicado" });
    } catch (error) {
      toast({ title: "Error", description: "No se pudo publicar.", variant: "destructive" });
    }
  };

  return (
    <>
      <div className="min-h-screen px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => navigate('/')} className="text-muted-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" /> Volver
            </Button>
            {user && !user.isGuest && !user.isAnonymous && (
              <Button onClick={() => setShowCreateModal(true)} className="magenta-gradient text-white font-bold">
                <Plus className="w-4 h-4 mr-2" /> Nuevo Hilo
              </Button>
            )}
          </div>

          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <h1 className="text-4xl font-extrabold mb-2 flex items-center justify-center gap-3">
              <MessageCircle className="w-10 h-10 text-cyan-400" />
              Foro Gay Chile - Comunidad LGBT+ Anónima
            </h1>
            <p className="text-muted-foreground max-w-3xl mx-auto text-base sm:text-lg mb-4">
              El foro gay más activo de Chile. Comunidad de apoyo mutuo 24/7, sin censura y completamente anónima.
            </p>
          </motion.div>

          {/* Banner Modo Máscara */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="glass-effect rounded-2xl p-6 border-2 border-purple-500/50 bg-gradient-to-br from-purple-900/30 via-fuchsia-900/20 to-cyan-900/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-transparent to-cyan-500/10 animate-pulse"></div>
              <div className="relative z-10 flex items-start gap-4">
                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-2xl">
                  <span className="text-3xl">👻</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-extrabold bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2">
                    <Shield className="w-5 h-5 text-purple-400" /> 🔒 MODO MÁSCARA ACTIVO
                  </h2>
                  <p className="text-gray-200 mt-1">Aquí nadie sabe quién eres. Tu nombre es <span className="font-bold text-cyan-300">'Usuario X'</span>.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Banner Chat Principal */}
          <AnimatePresence>
            {showChatBanner && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="relative mb-8">
                <div className="bg-gradient-to-r from-[#E4007C] via-purple-600 to-cyan-500 p-1 rounded-2xl">
                  <div className="bg-card rounded-xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex-1 text-center md:text-left">
                      <h2 className="text-2xl font-extrabold text-white mb-2">¡Chatea en Tiempo Real!</h2>
                      <p className="text-gray-300">Únete a conversaciones en vivo con la comunidad.</p>
                    </div>
                    <Button onClick={() => navigate(user && !user.isGuest ? '/chat/principal' : '/auth')} size="lg" className="bg-white text-purple-600 hover:bg-gray-100 font-bold">
                      Ir al Chat <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                    <button onClick={() => setShowChatBanner(false)} className="absolute top-4 right-4 text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Filtros */}
          <div className="glass-effect rounded-xl p-4 mb-6">
            <div className="flex flex-wrap gap-2 mb-4">
              {['Todos', ...categories].map(cat => (
                <Button key={cat} variant={selectedCategory === cat ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(cat)} className={selectedCategory === cat ? "magenta-gradient text-white" : ""}>
                  {cat}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSortBy('recent')} className={sortBy === 'recent' ? 'text-cyan-400' : ''}>Recientes</Button>
              <Button variant="ghost" size="sm" onClick={() => setSortBy('popular')} className={sortBy === 'popular' ? 'text-cyan-400' : ''}>Popular</Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div><p>Cargando foro...</p></div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {sortedThreads.map((thread, index) => (
                  <motion.div key={thread.id} initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{ delay: index * 0.02 }} className="glass-effect rounded-xl p-5 border hover:border-cyan-400 transition-colors">
                    <div className="cursor-pointer" onClick={() => navigate(`/thread/${thread.id}`)}>
                      <div className="flex justify-between mb-2">
                        <h3 className="text-lg font-bold">{thread.title}</h3>
                        <span className="text-xs px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400">{thread.category}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{thread.content}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {thread.replies}</span>
                        
                        {/* ✅ USO DEL COMPONENTE REUTILIZABLE */}
                        <AuthorBadge name={thread.authorDisplay} className="text-muted-foreground/70" />
                        
                      </div>
                      
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!user || user.isGuest) return toast({ title: "Registro requerido", variant: "destructive" });
                          if (likedThreads.has(thread.id)) return;
                          setThreads(prev => prev.map(t => t.id === thread.id ? { ...t, likes: (t.likes || 0) + 1 } : t));
                          setLikedThreads(prev => new Set(prev).add(thread.id));
                        }}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-colors ${likedThreads.has(thread.id) ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-muted hover:bg-red-500/10'}`}
                      >
                        <Heart className={`w-4 h-4 ${likedThreads.has(thread.id) ? 'fill-red-500' : ''}`} />
                        {thread.likes || 0}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          <CreateThreadModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onCreate={handleCreateThread} categories={categories} />
        </div>
      </div>
    </>
  );
};

export default AnonymousForumPage;