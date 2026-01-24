/**
 * 🎯 OpinFeedPage - Feed de descubrimiento
 *
 * MVP: Feed simple sin algoritmos complejos
 * - Carga posts activos
 * - Grid de OpinCard
 * - Botón "Publicar" (si no tiene post activo)
 * - Modal de perfil al hacer click
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, RefreshCw, Eye, Lock, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getOpinFeed, canCreatePost } from '@/services/opinService';
import OpinCard from '@/components/opin/OpinCard';
import OpinCommentsModal from '@/components/opin/OpinCommentsModal';
import { toast } from '@/components/ui/use-toast';

const OpinFeedPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canCreate, setCanCreate] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showCommentsModal, setShowCommentsModal] = useState(false);

  // 👁️ Verificar si el usuario está en modo "solo lectura"
  const isReadOnlyMode = !user || user.isAnonymous || user.isGuest;

  // Cargar feed al montar
  useEffect(() => {
    loadFeed();
    checkCanCreate();
  }, []);

  const loadFeed = async () => {
    setLoading(true);
    try {
      const feedPosts = await getOpinFeed(50);
      setPosts(feedPosts);
    } catch (error) {
      console.error('Error cargando feed:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el feed',
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

  // Manejar cuando un post es eliminado
  const handlePostDeleted = (postId) => {
    setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
    // Ahora el usuario puede crear uno nuevo
    setCanCreate(true);
  };

  // Manejar cuando un post es editado
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
        description: 'Debes iniciar sesión para publicar',
      });
      navigate('/auth');
      return;
    }

    if (user.isAnonymous) {
      toast({
        title: 'Regístrate',
        description: 'Los invitados no pueden publicar en OPIN',
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
      {/* Banner de modo solo lectura para usuarios no logueados */}
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
                Modo solo lectura - Puedes ver pero no interactuar
              </span>
            </div>
            <button
              onClick={() => navigate('/auth')}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-purple-600
                       font-semibold text-sm hover:bg-white/90 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              Regístrate para participar
            </button>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-purple-400" />
              <h1 className="text-2xl font-bold text-foreground">OPIN</h1>
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
            Descubre lo que otros buscan
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
          <div className="max-w-2xl mx-auto py-12">
            {/* Hero vacío */}
            <div className="text-center mb-12">
              <Sparkles className="w-20 h-20 mx-auto text-purple-400 mb-4" />
              <h2 className="text-3xl font-bold text-foreground mb-3">
                Bienvenido a OPIN
              </h2>
              <p className="text-lg text-muted-foreground">
                El muro de descubrimiento de Chactivo
              </p>
            </div>

            {/* ¿Qué es OPIN? */}
            <div className="glass-effect p-6 rounded-xl border border-purple-500/30 mb-6">
              <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                ¿Qué es OPIN?
              </h3>
              <p className="text-foreground/90 leading-relaxed mb-4">
                OPIN es un <strong>muro de descubrimiento</strong> donde publicas lo que buscas
                (amigos, citas, gaming, salir, etc.) y otros usuarios descubren tu perfil.
              </p>
              <p className="text-foreground/80 text-sm">
                💜 Es más que un chat efímero: tus posts duran <strong>24 horas</strong> y
                las personas pueden ver tu perfil completo y enviarte mensaje.
              </p>
            </div>

            {/* ¿Cómo funciona? */}
            <div className="glass-effect p-6 rounded-xl border border-white/10 mb-6">
              <h3 className="text-lg font-bold text-foreground mb-4">
                ¿Cómo funciona?
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">1️⃣</span>
                  <div>
                    <p className="font-semibold text-foreground">Publica lo que buscas</p>
                    <p className="text-muted-foreground">Escribe en 10-500 caracteres qué buscas: amigos, citas, gaming, etc.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">2️⃣</span>
                  <div>
                    <p className="font-semibold text-foreground">Otros ven tu post</p>
                    <p className="text-muted-foreground">Tu post aparece en el feed durante 24 horas</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">3️⃣</span>
                  <div>
                    <p className="font-semibold text-foreground">Click en "Ver perfil"</p>
                    <p className="text-muted-foreground">Si alguien te encuentra interesante, hace click y ve tu perfil completo</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">4️⃣</span>
                  <div>
                    <p className="font-semibold text-foreground">Envían mensaje</p>
                    <p className="text-muted-foreground">Si hay química, te envían mensaje directo desde tu perfil</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reglas */}
            <div className="glass-effect p-6 rounded-xl border border-orange-500/30 mb-8">
              <h3 className="text-lg font-bold text-foreground mb-3">
                📋 Reglas simples
              </h3>
              <ul className="space-y-2 text-sm text-foreground/80">
                <li>✅ Solo <strong>1 post activo</strong> por usuario</li>
                <li>✅ Posts duran <strong>24 horas</strong></li>
                <li>✅ Solo usuarios <strong>registrados</strong> pueden publicar</li>
                <li>✅ Invitados pueden <strong>ver</strong> pero no publicar</li>
                <li>✅ Mínimo 10 caracteres, máximo 500</li>
              </ul>
            </div>

            {/* CTA */}
            <div className="text-center">
              {canCreate ? (
                <button
                  onClick={handleCreatePost}
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500
                           hover:from-purple-600 hover:to-pink-600 text-white font-bold text-lg
                           transition-all shadow-2xl hover:shadow-purple-500/50 hover:scale-105"
                >
                  ✨ Crear mi primer post
                </button>
              ) : user && user.isAnonymous ? (
                <div>
                  <p className="text-muted-foreground mb-4">
                    Regístrate para publicar en OPIN
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
                  Inicia sesión para publicar
                </p>
              )}
            </div>
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

      {/* Botón flotante - Publicar o CTA de registro */}
      {isReadOnlyMode ? (
        // Banner flotante para usuarios no logueados
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
                <p className="text-xs sm:text-sm text-white/80">Regístrate para participar</p>
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
        // Botón flotante de publicar para usuarios logueados - SIEMPRE VISIBLE
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
          <span className="text-sm sm:text-base">Publicar OPIN</span>
        </motion.button>
      )}

      {/* Modal de comentarios */}
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
