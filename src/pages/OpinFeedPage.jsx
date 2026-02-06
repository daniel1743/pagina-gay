/**
 * OpinFeedPage - Feed de descubrimiento con microcopy emocional
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, RefreshCw, Eye, Lock, UserPlus, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getOpinFeed, canCreatePost } from '@/services/opinService';
import OpinCard from '@/components/opin/OpinCard';
import OpinCommentsModal from '@/components/opin/OpinCommentsModal';
import { toast } from '@/components/ui/use-toast';
import {
  procesarBoostOpinion,
  generarMensajeEngagement,
  deberíaMostrarToast,
  marcarToastMostrado
} from '@/services/engagementBoostService';

const OpinFeedPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canCreate, setCanCreate] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showCommentsModal, setShowCommentsModal] = useState(false);

  const isReadOnlyMode = !user || user.isAnonymous || user.isGuest;

  useEffect(() => {
    loadFeed();
    checkCanCreate();
  }, []);

  const loadFeed = async () => {
    setLoading(true);
    try {
      const timeoutMs = 15000;
      const feedPromise = getOpinFeed(50);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Tiempo de espera agotado. Revisa tu conexión.')), timeoutMs)
      );
      const feedPosts = await Promise.race([feedPromise, timeoutPromise]);
      setPosts(feedPosts);

      // Boost: Aplicar vistas y likes graduales a MIS opiniones
      if (user && !user.isAnonymous && feedPosts.length > 0) {
        const misOpiniones = feedPosts.filter(p => p.userId === user.id || p.userId === user.uid);

        for (const opinion of misOpiniones) {
          try {
            const boostResult = await procesarBoostOpinion(opinion);

            if (boostResult?.huboBoost && deberíaMostrarToast('opinEngagementToast')) {
              const mensaje = generarMensajeEngagement('OPIN', {
                vistas: boostResult.vistas,
                likes: boostResult.likes,
                vistasNuevas: boostResult.vistas - (opinion.viewCount || 0),
                likesNuevos: boostResult.likes - (opinion.likeCount || 0)
              });

              if (mensaje) {
                setTimeout(() => {
                  toast({
                    title: mensaje.title,
                    description: mensaje.description,
                    duration: 4000
                  });
                  marcarToastMostrado('opinEngagementToast');
                }, 1500 + Math.random() * 2500);
              }
            }
          } catch (boostError) {
            console.warn('[OPIN] Error en boost:', boostError.message);
          }
        }
      }
    } catch (error) {
      console.error('Error cargando feed:', error);
      setPosts([]);
      toast({
        title: 'Error',
        description: error?.message || 'No se pudo cargar el feed. Revisa tu conexión.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const checkCanCreate = async () => {
    if (!user || user.isAnonymous) {
      setCanCreate(false);
      return;
    }

    const result = await canCreatePost();
    setCanCreate(result.canCreate);
  };

  const handleCommentsClick = (post) => {
    setSelectedPost(post);
    setShowCommentsModal(true);
  };

  const handlePostDeleted = (postId) => {
    setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
    setCanCreate(true);
  };

  const handlePostEdited = (postId, updatedData) => {
    setPosts(prevPosts => prevPosts.map(p =>
      p.id === postId
        ? { ...p, ...updatedData }
        : p
    ));
  };

  const handleCreatePost = () => {
    if (!user) {
      toast({
        title: 'Inicia sesión',
        description: 'Debes iniciar sesión para dejar una nota',
      });
      navigate('/auth');
      return;
    }

    if (user.isAnonymous) {
      toast({
        title: 'Regístrate',
        description: 'Los invitados no pueden dejar notas',
      });
      return;
    }

    if (!canCreate) {
      toast({
        title: 'Ya tienes un post activo',
        description: 'Solo puedes tener 1 post activo a la vez',
      });
      return;
    }

    navigate('/opin/new');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Banner read-only para invitados */}
      {isReadOnlyMode && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2.5 px-4"
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              <span className="text-sm font-medium">
                Estás mirando el tablón
              </span>
            </div>
            <button
              onClick={() => navigate('/auth')}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-purple-600
                       font-semibold text-sm hover:bg-white/90 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              Crea tu cuenta para dejar una nota
            </button>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 -ml-2 hover:bg-accent/50 rounded-lg transition-colors"
                title="Volver"
                aria-label="Volver"
              >
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </button>
              <Sparkles className="w-6 h-6 text-purple-400" />
              <h1 className="text-2xl font-bold text-foreground">Tablón</h1>
              {isReadOnlyMode && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-medium">
                  <Lock className="w-3 h-3" />
                  Solo lectura
                </span>
              )}
            </div>
            <button
              onClick={loadFeed}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              title="Recargar"
            >
              <RefreshCw className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Notas de la comunidad
          </p>
        </div>
      </div>

      {/* Feed Grid */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
          </div>
        ) : posts.length === 0 ? (
          /* Empty state breve y cálido */
          <div className="max-w-md mx-auto py-20 text-center">
            <Sparkles className="w-16 h-16 mx-auto text-purple-400 mb-6" />
            <h2 className="text-2xl font-bold text-foreground mb-3">
              El tablón está vacío... por ahora
            </h2>
            <p className="text-muted-foreground mb-8">
              Sé el primero en dejar una nota. Cuéntale al mundo qué buscas.
            </p>

            {canCreate ? (
              <button
                onClick={handleCreatePost}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500
                         hover:from-purple-600 hover:to-pink-600 text-white font-bold text-lg
                         transition-all shadow-2xl hover:shadow-purple-500/50 hover:scale-105"
              >
                Dejar mi nota
              </button>
            ) : user && user.isAnonymous ? (
              <div>
                <p className="text-muted-foreground mb-4">
                  Crea tu cuenta para dejar una nota
                </p>
                <button
                  onClick={() => navigate('/auth')}
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500
                           hover:from-purple-600 hover:to-pink-600 text-white font-bold text-lg
                           transition-all shadow-2xl"
                >
                  Registrarse
                </button>
              </div>
            ) : (
              <p className="text-muted-foreground">
                Inicia sesión para dejar una nota
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {posts.map((post, index) => (
                <OpinCard
                  key={post.id}
                  post={post}
                  index={index}
                  onCommentsClick={handleCommentsClick}
                  onPostDeleted={handlePostDeleted}
                  onPostEdited={handlePostEdited}
                  isReadOnlyMode={isReadOnlyMode}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Botón flotante / Banner registro */}
      {isReadOnlyMode ? (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600 to-pink-600
                   p-4 shadow-2xl border-t border-white/20"
        >
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 text-white">
              <Lock className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm sm:text-base">¿Te gusta lo que ves?</p>
                <p className="text-xs sm:text-sm text-white/80">Crea tu cuenta para dejar una nota</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/auth')}
              className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-white text-purple-600
                       font-bold hover:bg-white/90 transition-all shadow-lg text-sm sm:text-base"
            >
              <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Crear cuenta gratis</span>
              <span className="sm:hidden">Registrarse</span>
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCreatePost}
          className="fixed bottom-6 right-4 sm:right-6 z-50 flex items-center gap-2 px-5 py-4 sm:px-6 sm:py-4
                   rounded-full bg-gradient-to-r from-purple-500 to-pink-500
                   shadow-2xl text-white font-bold hover:shadow-purple-500/50
                   transition-all"
        >
          <Plus className="w-6 h-6" />
          <span className="text-sm sm:text-base">Dejar nota</span>
        </motion.button>
      )}

      {/* Modal de respuestas */}
      {showCommentsModal && selectedPost && (
        <OpinCommentsModal
          post={selectedPost}
          open={showCommentsModal}
          onClose={() => setShowCommentsModal(false)}
        />
      )}
    </div>
  );
};

export default OpinFeedPage;
