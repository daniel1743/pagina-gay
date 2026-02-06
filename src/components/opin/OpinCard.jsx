/**
 * OpinCard - Tarjeta compacta de nota OPIN
 *
 * - Sin badges, sin tag "Tu OPIN"
 * - Stats solo para dueño ("X personas te vieron")
 * - Like: solo corazón sin texto
 * - Botón "Responder" (antes "Comentar")
 * - Click en avatar/username → abre tarjeta Baúl
 */

import React, { useState, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Heart, MessageCircle, Lock, Pencil, Trash2, MoreVertical, X, Check } from 'lucide-react';
import { getTimeRemaining, toggleLike, hasUserLiked, editOpinPost, deleteOpinPost, OPIN_COLORS } from '@/services/opinService';
import { obtenerTarjeta } from '@/services/tarjetaService';
import MensajeTarjetaModal from '@/components/baul/MensajeTarjetaModal';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

const OpinCard = forwardRef(({ post, index, onCommentsClick, onPostDeleted, onPostEdited, isReadOnlyMode = false }, ref) => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [timeRemaining, setTimeRemaining] = React.useState('');
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [liked, setLiked] = useState(hasUserLiked(post));
  const [likingInProgress, setLikingInProgress] = useState(false);

  // Estados para edición y menú
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(post.text || '');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Estados para Baúl
  const [showBaulModal, setShowBaulModal] = useState(false);
  const [baulTarjeta, setBaulTarjeta] = useState(null);
  const [loadingBaul, setLoadingBaul] = useState(false);

  // Verificar si el usuario es el dueño del post
  const isOwner = user && user.id === post.userId;

  // Actualizar countdown cada minuto (solo posts no estables)
  React.useEffect(() => {
    if (post.isStable) {
      setTimeRemaining('Estable');
      return;
    }
    const updateTime = () => {
      const remaining = getTimeRemaining(post.expiresAt);
      setTimeRemaining(remaining);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);

    return () => clearInterval(interval);
  }, [post.expiresAt, post.isStable]);

  // Click en avatar/username → abrir Baúl
  const handleAuthorClick = async () => {
    // Si es mi propio post, no hacer nada
    if (isOwner) return;

    // Si está en modo solo lectura, redirigir a registro
    if (isReadOnlyMode) {
      toast({
        title: 'Crea tu cuenta',
        description: 'Regístrate para ver perfiles',
        action: (
          <button
            onClick={() => navigate('/auth')}
            className="px-3 py-1 rounded bg-purple-500 text-white text-xs font-semibold hover:bg-purple-600"
          >
            Registrarse
          </button>
        ),
      });
      return;
    }

    if (loadingBaul) return;
    setLoadingBaul(true);

    try {
      const tarjeta = await obtenerTarjeta(post.userId);

      if (tarjeta) {
        setBaulTarjeta(tarjeta);
        setShowBaulModal(true);
      } else {
        toast({
          title: 'Sin perfil',
          description: 'Este usuario aún no tiene perfil en el Baúl',
        });
      }
    } catch (error) {
      console.error('Error obteniendo tarjeta:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar el perfil',
        variant: 'destructive',
      });
    } finally {
      setLoadingBaul(false);
    }
  };

  const handleLikeClick = async () => {
    if (isReadOnlyMode) {
      toast({
        title: 'Regístrate para dar like',
        description: 'Crea una cuenta gratis para interactuar',
        action: (
          <button
            onClick={() => navigate('/auth')}
            className="px-3 py-1 rounded bg-purple-500 text-white text-xs font-semibold hover:bg-purple-600"
          >
            Registrarse
          </button>
        ),
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Inicia sesión',
        description: 'Debes iniciar sesión para dar like',
      });
      return;
    }

    if (user.isAnonymous || user.isGuest) {
      toast({
        title: 'Regístrate para dar like',
        description: 'Los invitados no pueden dar like',
      });
      return;
    }

    if (likingInProgress) return;

    setLikingInProgress(true);

    try {
      const result = await toggleLike(post.id);

      if (result.liked) {
        setLiked(true);
        setLikeCount(prev => prev + 1);
      } else {
        setLiked(false);
        setLikeCount(prev => prev - 1);
      }
    } catch (error) {
      console.error('Error al dar like:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo dar like',
        variant: 'destructive',
      });
    } finally {
      setLikingInProgress(false);
    }
  };

  const handleCommentsClick = () => {
    if (isReadOnlyMode) {
      toast({
        title: 'Regístrate para responder',
        description: 'Crea una cuenta gratis para participar',
        action: (
          <button
            onClick={() => navigate('/auth')}
            className="px-3 py-1 rounded bg-purple-500 text-white text-xs font-semibold hover:bg-purple-600"
          >
            Registrarse
          </button>
        ),
      });
      return;
    }

    if (onCommentsClick) {
      onCommentsClick(post);
    }
  };

  // Manejar edición
  const handleSaveEdit = async () => {
    if (!editText.trim() || editText.trim().length < 10) {
      toast({
        title: 'Texto muy corto',
        description: 'El texto debe tener al menos 10 caracteres',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const result = await editOpinPost(post.id, {
        text: editText,
      });

      toast({
        title: 'Nota actualizada',
        description: `Te quedan ${result.remaining} ediciones/eliminaciones hoy`,
      });

      setIsEditing(false);
      if (onPostEdited) {
        onPostEdited(post.id, { text: editText });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Manejar eliminación
  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar esta nota? Podrás publicar una nueva después.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteOpinPost(post.id);

      toast({
        title: 'Nota eliminada',
        description: `Puedes publicar una nueva. Te quedan ${result.remaining} acciones hoy.`,
      });

      if (onPostDeleted) {
        onPostDeleted(post.id);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setShowMenu(false);
    }
  };

  // Cancelar edición
  const handleCancelEdit = () => {
    setEditText(post.text || '');
    setIsEditing(false);
  };

  // Obtener configuración de color
  const colorConfig = OPIN_COLORS[post.color || 'purple'];

  return (
    <>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className={`glass-effect p-6 rounded-xl border-2 ${colorConfig.border} ${colorConfig.bg} hover:shadow-lg transition-all group`}
      >
        {/* Header: Avatar + Username + Countdown + Menu */}
        <div className="flex items-center gap-3 mb-4">
          {/* Avatar clickeable */}
          <div
            className={`relative flex-shrink-0 ${!isOwner ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
            onClick={handleAuthorClick}
          >
            {post.avatar ? (
              <img
                src={post.avatar}
                alt={post.username}
                className="w-12 h-12 rounded-full ring-2 ring-primary/20 object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className={`w-12 h-12 rounded-full ring-2 ring-primary/20 bg-gradient-to-br from-purple-500 to-pink-500 items-center justify-center text-white font-bold text-lg ${post.avatar ? 'hidden' : 'flex'}`}
            >
              {post.username?.charAt(0)?.toUpperCase() || '?'}
            </div>
            {loadingBaul && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
                <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Username clickeable + Countdown */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3
                className={`text-base font-bold text-foreground truncate ${!isOwner ? 'cursor-pointer hover:underline' : ''}`}
                onClick={handleAuthorClick}
              >
                {post.username}
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{post.isStable ? 'Estable' : (timeRemaining || '—')}</span>
            </div>
          </div>

          {/* Menú de opciones (solo dueño; estables se gestionan en panel admin) */}
          {isOwner && !post.isStable && !isEditing && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <MoreVertical className="w-5 h-5 text-muted-foreground" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-10 z-20 bg-card border border-border rounded-xl shadow-xl py-2 min-w-[150px]">
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-white/5 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    {isDeleting ? 'Eliminando...' : 'Eliminar'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modo Edición */}
        {isEditing ? (
          <div className="space-y-3 mb-4">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              placeholder="¿Qué buscas?"
              maxLength={500}
              rows={4}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground
                       placeholder:text-muted-foreground focus:border-primary focus:outline-none text-sm resize-none"
            />
            <div className="flex items-center justify-between">
              <span className={`text-xs ${editText.length > 500 ? 'text-red-400' : 'text-muted-foreground'}`}>
                {editText.length}/500
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 text-foreground text-sm hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isSaving || editText.trim().length < 10}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500
                           text-white text-sm font-semibold disabled:opacity-50"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Guardar
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Título (si existe, para posts legacy) */}
            {post.title && (
              <h2 className={`text-lg font-bold mb-3 bg-gradient-to-r ${colorConfig.gradient} bg-clip-text text-transparent`}>
                {post.title}
              </h2>
            )}

            {/* Texto del post */}
            <p className="text-sm text-foreground/90 mb-4 leading-relaxed whitespace-pre-wrap">
              {post.text}
            </p>
          </>
        )}

        {/* Footer: Stats sutiles (solo dueño) + Botones */}
        <div className="space-y-3 pt-4 border-t border-white/5">
          {/* Stats solo para el dueño */}
          {isOwner && (post.viewCount || 0) > 0 && (
            <p className="text-xs text-muted-foreground">
              {post.viewCount === 1
                ? '1 persona te vio'
                : `${post.viewCount} personas te vieron`}
            </p>
          )}

          {/* Botones de acción */}
          <div className="flex items-center gap-3">
            {/* Botón Like - solo corazón */}
            <button
              onClick={handleLikeClick}
              disabled={likingInProgress}
              className={`flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl
                       transition-all text-sm
                       ${isReadOnlyMode
                         ? 'bg-white/5 text-muted-foreground border border-white/10 hover:bg-white/10 cursor-pointer'
                         : liked
                           ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30'
                           : 'bg-white/5 text-foreground border border-white/10 hover:bg-white/10'
                       }`}
            >
              {isReadOnlyMode ? (
                <Lock className="w-5 h-5" />
              ) : (
                <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
              )}
              {likeCount > 0 && <span className="text-xs">{likeCount}</span>}
            </button>

            {/* Botón Responder */}
            <button
              onClick={handleCommentsClick}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                       transition-all font-semibold text-sm
                       ${isReadOnlyMode
                         ? 'bg-white/5 text-muted-foreground border border-white/10 hover:bg-white/10 cursor-pointer'
                         : `bg-gradient-to-r ${colorConfig.gradient} text-white shadow-md hover:shadow-lg hover:opacity-90`
                       }`}
            >
              {isReadOnlyMode ? (
                <Lock className="w-5 h-5" />
              ) : (
                <MessageCircle className="w-5 h-5" />
              )}
              <span>Responder</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Modal Baúl */}
      {showBaulModal && baulTarjeta && (
        <MensajeTarjetaModal
          isOpen={showBaulModal}
          onClose={() => {
            setShowBaulModal(false);
            setBaulTarjeta(null);
          }}
          tarjeta={baulTarjeta}
          miUserId={user?.id || user?.uid || ''}
          miUsername={userProfile?.username || user?.displayName || 'Usuario'}
        />
      )}
    </>
  );
});

OpinCard.displayName = 'OpinCard';

export default OpinCard;
