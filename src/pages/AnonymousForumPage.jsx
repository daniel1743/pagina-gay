import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';

const AnonymousForumPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({ title: '', message: '' });

  useEffect(() => {
    const storedPosts = JSON.parse(localStorage.getItem('chactivo_forum_posts') || '[]');
    setPosts(storedPosts);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.message.trim()) {
      toast({
        title: 'Campos incompletos',
        description: 'Por favor, completa el título y el mensaje.',
        variant: 'destructive',
      });
      return;
    }

    const postToAdd = {
      id: Date.now(),
      title: newPost.title,
      message: newPost.message,
      authorId: `anon-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    const updatedPosts = [postToAdd, ...posts];
    setPosts(updatedPosts);
    localStorage.setItem('chactivo_forum_posts', JSON.stringify(updatedPosts));
    setNewPost({ title: '', message: '' });

    toast({
      title: 'Publicación enviada',
      description: 'Tu mensaje ha sido publicado en el foro anónimo.',
    });
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });
  };

  return (
    <>
      <Helmet>
        <title>Foro Anónimo - Chactivo</title>
        <meta name="description" content="Un espacio anónimo para preguntas y respuestas sobre salud mental." />
      </Helmet>
      <div className="min-h-screen bg-background text-foreground px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-6 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Lobby
          </Button>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-extrabold">Foro Anónimo</h1>
            <p className="text-lg text-muted-foreground mt-2">
              Un lugar para compartir y encontrar apoyo sin revelar tu identidad.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-effect rounded-2xl p-6 mb-12"
          >
            <h2 className="text-2xl font-bold mb-4">Crear una nueva publicación</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                value={newPost.title}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                placeholder="Título de tu publicación"
                className="bg-secondary border-2 border-input focus:border-accent"
              />
              <Textarea
                value={newPost.message}
                onChange={(e) => setNewPost({ ...newPost, message: e.target.value })}
                placeholder="Escribe tu mensaje aquí..."
                className="min-h-[120px] bg-secondary border-2 border-input focus:border-accent"
              />
              <Button type="submit" className="w-full magenta-gradient text-white font-bold">
                <Send className="w-4 h-4 mr-2" />
                Enviar a Foro
              </Button>
            </form>
          </motion.div>

          <div className="space-y-6">
            <h2 className="text-3xl font-bold border-b pb-2">Publicaciones Recientes</h2>
            <AnimatePresence>
              {posts.length > 0 ? (
                posts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="bg-card p-6 rounded-xl shadow-md"
                  >
                    <h3 className="text-xl font-bold text-accent">{post.title}</h3>
                    <p className="text-xs text-muted-foreground mb-3">Publicado el {formatTime(post.timestamp)}</p>
                    <p className="text-foreground whitespace-pre-wrap">{post.message}</p>
                  </motion.div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Aún no hay publicaciones. ¡Sé el primero en compartir algo!
                </p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
};

export default AnonymousForumPage;