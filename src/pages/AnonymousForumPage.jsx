import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, MessageCircle, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';
// import ForumThread from '@/components/forum/ForumThread';
// import CreateThreadModal from '@/components/forum/CreateThreadModal';

const categories = ['Apoyo Emocional', 'Recursos', 'Experiencias', 'Preguntas', 'Logros'];

const initialThreads = [
  {
    id: '1',
    title: '¿Cómo manejar el estrés del coming out?',
    content: 'Estoy pensando en salir del clóset con mi familia pero me siento muy ansioso. ¿Alguien tiene consejos?',
    author: 'Usuario Anónimo #4521',
    timestamp: Date.now() - 3600000,
    replies: 8,
    likes: 15,
    category: 'Apoyo Emocional',
  },
  {
    id: '2',
    title: 'Recursos de salud mental LGBT+ en Santiago',
    content: '¿Alguien conoce psicólogos o terapeutas que trabajen con temas LGBT+ en Santiago?',
    author: 'Usuario Anónimo #7832',
    timestamp: Date.now() - 7200000,
    replies: 12,
    likes: 23,
    category: 'Recursos',
  },
];

const AnonymousForumPage = () => {
  React.useEffect(() => {
    document.title = "Foro Anónimo - Chactivo | Chat Gay Chile";
  }, []);

  const navigate = useNavigate();
  const { user } = useAuth();
  const [threads, setThreads] = useState(initialThreads);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [sortBy, setSortBy] = useState('recent');

  const filteredThreads = selectedCategory === 'Todos'
    ? threads
    : threads.filter(t => t.category === selectedCategory);

  const sortedThreads = [...filteredThreads].sort((a, b) => {
    if (sortBy === 'popular') return b.likes - a.likes;
    if (sortBy === 'replies') return b.replies - a.replies;
    return b.timestamp - a.timestamp;
  });

  const handleCreateThread = (threadData) => {
    const newThread = {
      id: String(Date.now()),
      ...threadData,
      author: `Usuario Anónimo #${Math.floor(Math.random() * 10000)}`,
      timestamp: Date.now(),
      replies: 0,
      likes: 0,
    };
    setThreads([newThread, ...threads]);
    setShowCreateModal(false);
    toast({
      title: "✅ Hilo publicado",
      description: "Tu pregunta ha sido publicada de forma anónima.",
    });
  };

  return (
    <>
      <div className="min-h-screen px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={() => navigate('/')} className="text-muted-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <Button onClick={() => setShowCreateModal(true)} className="magenta-gradient text-white font-bold">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Hilo
            </Button>
          </div>

          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <h1 className="text-4xl font-extrabold mb-2 flex items-center justify-center gap-3">
              <MessageCircle className="w-10 h-10 text-cyan-400" />
              Foro Anónimo de Apoyo
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Un espacio seguro para compartir experiencias y encontrar apoyo. 100% anónimo.
            </p>
          </motion.div>

          <div className="glass-effect rounded-xl p-4 mb-6">
            <div className="flex flex-wrap gap-2 mb-4">
              {['Todos', ...categories].map(cat => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className={selectedCategory === cat ? "magenta-gradient text-white" : ""}
                >
                  {cat}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSortBy('recent')}
                className={sortBy === 'recent' ? 'text-cyan-400' : ''}>Recientes</Button>
              <Button variant="ghost" size="sm" onClick={() => setSortBy('popular')}
                className={sortBy === 'popular' ? 'text-cyan-400' : ''}>
                <TrendingUp className="w-4 h-4 mr-1" />Popular
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSortBy('replies')}
                className={sortBy === 'replies' ? 'text-cyan-400' : ''}>
                <MessageCircle className="w-4 h-4 mr-1" />Más Respuestas
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <AnimatePresence>
              {sortedThreads.map((thread, index) => (
                <motion.div key={thread.id} initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}}
                  className="glass-effect rounded-xl p-5 cursor-pointer hover:border-cyan-400 transition-all border"
                  onClick={() => toast({ title: "Próximamente", description: "La página de detalle estará lista pronto" })}>
                  <h3 className="text-lg font-bold mb-2">{thread.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{thread.content}</p>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>{thread.replies} respuestas</span>
                    <span>{thread.likes} votos</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
};

export default AnonymousForumPage;