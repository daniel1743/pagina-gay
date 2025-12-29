import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, MessageCircle, TrendingUp, MessageSquare, ArrowRight, X, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';
import { getThreads, createThread } from '@/services/forumService';
import { forumSeedData } from '@/data/forumSeedData';
import CreateThreadModal from '@/components/forum/CreateThreadModal';

const categories = ['Apoyo Emocional', 'Recursos', 'Experiencias', 'Preguntas', 'Logros'];

const AnonymousForumPage = () => {
  const [likedThreads, setLikedThreads] = useState(new Set()); // Trackear threads con like

  React.useEffect(() => {
    document.title = "Foro Gay Chile Anónimo 🔒 | Comunidad LGBT+ Sin Censura | Chactivo";

    // ✅ SEO: Meta description específica para el foro
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = '💬 Únete al foro gay más activo de Chile. Comparte experiencias LGBT+, pide consejos, encuentra recursos sobre salud mental, relaciones y derechos. 100% anónimo, sin censura. Comunidad de apoyo mutuo segura.';

    return () => {
      // Limpiar al desmontar (volver a la del index.html)
      if (metaDescription && document.head.contains(metaDescription)) {
        metaDescription.content = '🏳️‍🌈 Chat gay chileno 100% gratis. Salas por interés: Gaming 🎮, +30 💪, Osos 🐻, Amistad 💬. Conversación real, sin presión de hookups.';
      }
    };
  }, []);

  const navigate = useNavigate();
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [sortBy, setSortBy] = useState('recent');
  const [showChatBanner, setShowChatBanner] = useState(true); // ✅ Banner visible por defecto
  const [isInitialized, setIsInitialized] = useState(false);

  // ✅ Filtrado: Si es "Todos", mostrar todos los threads sin filtrar
  // Si es una categoría específica, los threads ya vienen filtrados de Firestore,
  // pero hacemos un filtro adicional por si acaso
  const filteredThreads = selectedCategory === 'Todos'
    ? threads // Mostrar TODOS cuando es "Todos"
    : threads.filter(t => t.category === selectedCategory);

  // ✅ Debug: Ver cuántos threads hay
  React.useEffect(() => {
    console.log(`🔍 [FORO DEBUG] Categoría seleccionada: ${selectedCategory}`);
    console.log(`🔍 [FORO DEBUG] Total threads en estado: ${threads.length}`);
    console.log(`🔍 [FORO DEBUG] Threads filtrados: ${filteredThreads.length}`);
  }, [selectedCategory, threads.length, filteredThreads.length]);

  // ✅ Ordenar los threads filtrados
  const sortedThreads = [...filteredThreads].sort((a, b) => {
    if (sortBy === 'popular') return (b.likes || 0) - (a.likes || 0);
    if (sortBy === 'replies') return (b.replies || 0) - (a.replies || 0);
    return (b.timestamp || 0) - (a.timestamp || 0);
  });

  // ✅ Inicializar datos del foro en Firestore (solo una vez)
  useEffect(() => {
    const initializeForum = async () => {
      if (isInitialized) return;

      try {
        // ✅ CORREGIDO: Verificar si hay SUFICIENTES threads (al menos 10)
        // Si hay menos de 10, significa que la inicialización no se completó
        const existingThreads = await getThreads(null, 'recent', 20);

        console.log(`🔍 [INIT] Threads existentes en Firestore: ${existingThreads.length}`);

        // ✅ SIMPLIFICADO: Ya no intentamos escribir a Firestore
        // Simplemente marcamos como inicializado y usamos seed data
        console.log(`✅ Usando datos seed locales (${forumSeedData.length} threads)`);
        setIsInitialized(true);
      } catch (error) {
        console.error('❌ Error inicializando foro:', error);
        // Continuar aunque haya error, usaremos datos seed como fallback
        setIsInitialized(true);
      }
    };

    initializeForum();
  }, [isInitialized]);

  // ✅ Cargar threads desde seed data (ya no usamos Firestore por problemas de permisos)
  useEffect(() => {
    // Solo cargar si ya se inicializó
    if (!isInitialized) return;

    const loadThreads = async () => {
      setLoading(true);
      try {
        // ✅ USAR DATOS SEED DIRECTAMENTE (evita errores de permisos de Firestore)
        console.log(`📊 [FORO] Cargando threads desde seed data - Categoría: "${selectedCategory}"`);

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

        console.log(`✅ [FORO] Threads cargados: ${seedThreads.length} (filtro: ${selectedCategory === 'Todos' ? 'TODOS' : selectedCategory})`);
        setThreads(seedThreads);
      } catch (error) {
        console.error('❌ [FORO] Error cargando threads:', error);
        setThreads([]);
      } finally {
        setLoading(false);
      }
    };

    loadThreads();
  }, [selectedCategory, sortBy, isInitialized]);

  const handleCreateThread = async (threadData) => {
    // ✅ Validar que el usuario esté autenticado y registrado
    if (!user || user.isGuest || user.isAnonymous) {
      toast({
        title: "Registro Requerido",
        description: "Debes estar registrado para publicar hilos en el foro.",
        variant: "destructive",
        action: (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                navigate('/auth');
              }}
              className="bg-primary text-white"
            >
              Iniciar Sesión
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                // Abrir modal de registro rápido si existe
                const event = new CustomEvent('openQuickSignup');
                window.dispatchEvent(event);
              }}
            >
              Registrarse
            </Button>
          </div>
        ),
      });
      setShowCreateModal(false);
      return;
    }

    try {
      const threadId = await createThread(threadData);
      
      // Recargar threads (TODOS)
      const updatedThreads = await getThreads(selectedCategory === 'Todos' ? null : selectedCategory, sortBy, null);
      setThreads(updatedThreads);
      
      setShowCreateModal(false);
      toast({
        title: "✅ Hilo publicado",
        description: "Tu pregunta ha sido publicada de forma anónima.",
      });
    } catch (error) {
      console.error('Error creando thread:', error);
      toast({
        title: "Error",
        description: "No se pudo publicar el hilo. Intenta de nuevo.",
        variant: "destructive",
      });
    }
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
            {/* ✅ Solo mostrar botón si el usuario está autenticado y registrado */}
            {user && !user.isGuest && !user.isAnonymous ? (
              <Button onClick={() => setShowCreateModal(true)} className="magenta-gradient text-white font-bold">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Hilo
              </Button>
            ) : null}
          </div>

          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
            <h1 className="text-4xl font-extrabold mb-2 flex items-center justify-center gap-3">
              <MessageCircle className="w-10 h-10 text-cyan-400" />
              Foro Gay Chile - Comunidad LGBT+ Anónima
            </h1>
            <p className="text-muted-foreground max-w-3xl mx-auto text-base sm:text-lg mb-4">
              El foro gay más activo de Chile. Comparte experiencias LGBT+, pide consejos sobre salud mental, relaciones, derechos y coming out. Comunidad de apoyo mutuo 24/7, sin censura y completamente anónima.
            </p>
            <p className="text-sm text-cyan-300 max-w-2xl mx-auto">
              💬 Más de 100 hilos activos • 🔒 100% anónimo • 🏳️‍🌈 Espacio seguro LGBT+ • 🇨🇱 Comunidad chilena
            </p>
          </motion.div>

          {/* ✅ NUEVO: Banner prominente para redirigir al chat principal */}
          <AnimatePresence>
            {showChatBanner && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative mb-8 rounded-2xl overflow-hidden"
              >
                <div className="bg-gradient-to-r from-[#E4007C] via-purple-600 to-cyan-500 p-1 rounded-2xl">
                  <div className="bg-card rounded-xl p-6 md:p-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex-1 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#E4007C] to-cyan-500 flex items-center justify-center">
                            <MessageSquare className="w-8 h-8 text-white" />
                          </div>
                          <div>
                            <h2 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-[#E4007C] to-cyan-400 bg-clip-text text-transparent">
                              ¡Chatea en Tiempo Real!
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                              Únete a conversaciones en vivo con la comunidad
                            </p>
                          </div>
                        </div>
                        <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto md:mx-0">
                          Conecta con personas como tú en salas de chat activas 24/7. Conversaciones en tiempo real, sin esperas.
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <Button
                          onClick={() => {
                            if (user && !user.isGuest) {
                              navigate('/chat/global');
                            } else {
                              navigate('/auth');
                            }
                          }}
                          size="lg"
                          className="bg-gradient-to-r from-[#E4007C] to-cyan-500 hover:from-[#ff0087] hover:to-cyan-400 text-white font-bold text-lg px-8 py-6 rounded-xl shadow-lg hover:scale-105 transition-transform"
                        >
                          <MessageSquare className="w-6 h-6 mr-3" />
                          Ir al Chat Principal
                          <ArrowRight className="w-6 h-6 ml-3" />
                        </Button>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowChatBanner(false)}
                      className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted"
                      aria-label="Cerrar banner"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando foro...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {sortedThreads.map((thread, index) => (
                  <motion.div
                    key={thread.id}
                    initial={{opacity: 0, y: 20}}
                    animate={{opacity: 1, y: 0}}
                    transition={{ delay: index * 0.02 }}
                    className="glass-effect rounded-xl p-5 transition-all border hover:shadow-lg hover:border-cyan-400"
                  >
                    <div
                      className="cursor-pointer"
                      onClick={() => navigate(`/thread/${thread.id}`)}
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="text-lg font-bold flex-1">{thread.title}</h3>
                        <span className="text-xs px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400 font-semibold whitespace-nowrap">
                          {thread.category}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{thread.content}</p>
                    </div>

                    <div className="flex items-center justify-between gap-4 text-xs">
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          {thread.replies} respuestas
                        </span>
                        <span className="text-muted-foreground/70">
                          {thread.authorDisplay || 'Usuario Anónimo'}
                        </span>
                      </div>

                      {/* ✅ Botón de Like interactivo */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!user || user.isGuest || user.isAnonymous) {
                            toast({
                              title: "Registro Requerido",
                              description: "Debes estar registrado para dar like.",
                              variant: "destructive",
                            });
                            return;
                          }
                          if (likedThreads.has(thread.id)) {
                            toast({
                              title: "Ya has votado",
                              description: "Ya has dado like a este hilo.",
                              variant: "destructive",
                            });
                            return;
                          }
                          // Actualizar likes localmente
                          setThreads(threads.map(t =>
                            t.id === thread.id ? { ...t, likes: (t.likes || 0) + 1 } : t
                          ));
                          setLikedThreads(new Set([...likedThreads, thread.id]));
                          toast({
                            title: "✅ Like registrado",
                            description: "Gracias por tu voto.",
                          });
                        }}
                        disabled={!user || user.isGuest || user.isAnonymous || likedThreads.has(thread.id)}
                        className={`
                          inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                          transition-all duration-200 border
                          ${likedThreads.has(thread.id)
                            ? 'bg-red-500/20 border-red-500/30 text-red-400 cursor-not-allowed'
                            : user && !user.isGuest && !user.isAnonymous
                            ? 'bg-muted border-border hover:bg-red-500/10 hover:border-red-500/30 text-muted-foreground hover:text-red-400 cursor-pointer active:scale-95'
                            : 'bg-muted border-border text-muted-foreground cursor-not-allowed opacity-50'
                          }
                        `}
                      >
                        <Heart className={`w-4 h-4 ${likedThreads.has(thread.id) ? 'fill-red-500 text-red-500' : ''}`} />
                        <span className="font-semibold">{thread.likes || 0}</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {sortedThreads.length === 0 && (
                <div className="text-center py-12">
                  <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No hay hilos en esta categoría aún.</p>
                  {user && !user.isGuest && !user.isAnonymous ? (
              <Button 
                onClick={() => setShowCreateModal(true)} 
                className="mt-4 magenta-gradient text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear el primer hilo
              </Button>
            ) : (
              <Button 
                onClick={() => {
                  toast({
                    title: "Registro Requerido",
                    description: "Debes estar registrado para publicar hilos en el foro.",
                    variant: "destructive",
                    action: (
                      <Button
                        size="sm"
                        onClick={() => navigate('/auth')}
                        className="bg-primary text-white"
                      >
                        Iniciar Sesión
                      </Button>
                    ),
                  });
                }}
                className="mt-4 magenta-gradient text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Registrarse para publicar
              </Button>
            )}
                </div>
              )}
            </div>
          )}

          {/* Modal para crear nuevo hilo */}
          <CreateThreadModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateThread}
            categories={categories}
          />
        </div>
      </div>
    </>
  );
};

export default AnonymousForumPage;