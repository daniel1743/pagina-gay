/**
 * 💜 OpinCard - Tarjeta de post de OPIN COMPLETO
 *
 * Features completas:
 * - Avatar + username + badges
 * - Título (opcional)
 * - Texto del post
 * - Color personalizado
 * - Botón like (con toggle)
 * - Botón comentarios (abre modal)
 * - Botón "Ver perfil"
 * - Countdown
 * - Stats (views, likes, clicks)
 */

import React, { useState, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, Clock, CheckCircle, Crown, Flame, Heart, MessageCircle, Lock, Pencil, Trash2, MoreVertical, X, Check } from 'lucide-react';
import { getTimeRemaining, toggleLike, hasUserLiked, editOpinPost, deleteOpinPost, OPIN_COLORS } from '@/services/opinService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

// Helper para determinar badge del usuario
const getUserBadge = (post) => {
  // Premium users
  if (post.isPremium) {
    return { icon: Crown, text: 'Premium', color: 'text-yellow-400' };
  }

  // Usuarios con muchas interacciones
  if (post.profileClickCount >= 10) {
    return { icon: Flame, text: 'Popular', color: 'text-orange-400' };
  }

  // Usuario verificado (no guest/anonymous)
  if (!post.isAnonymous && !post.isGuest) {
    return { icon: CheckCircle, text: 'Verificado', color: 'text-cyan-400' };
  }

  return null;
};

const OpinCard = forwardRef(({ post, index, onCommentsClick, onPostDeleted, onPostEdited, isReadOnlyMode = false }, ref) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [timeRemaining, setTimeRemaining] = React.useState('');
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [liked, setLiked] = useState(hasUserLiked(post));
  const [likingInProgress, setLikingInProgress] = useState(false);

  // Estados para edición y menú
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(post.text || '');
  const [editTitle, setEditTitle] = useState(post.title || '');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleLikeClick = async () => {
    // Si está en modo solo lectura, mostrar toast y redirigir a registro
    if (isReadOnlyMode) {
      toast({
        title: '¡Regístrate para dar like!',
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
    // Si está en modo solo lectura, mostrar toast y redirigir a registro
    if (isReadOnlyMode) {
      toast({
        title: '¡Regístrate para comentar!',
        description: 'Crea una cuenta gratis para participar en la conversación',
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
        title: editTitle,
        text: editText,
      });

      toast({
        title: '✅ OPIN actualizado',
        description: `Te quedan ${result.remaining} ediciones/eliminaciones hoy`,
      });

      setIsEditing(false);
      if (onPostEdited) {
        onPostEdited(post.id, { title: editTitle, text: editText });
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
    if (!confirm('¿Estás seguro de eliminar este OPIN? Podrás publicar uno nuevo después.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteOpinPost(post.id);

      toast({
        title: '🗑️ OPIN eliminado',
        description: `Puedes publicar uno nuevo. Te quedan ${result.remaining} acciones hoy.`,
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
    setEditTitle(post.title || '');
    setIsEditing(false);
  };

  // Obtener badge del usuario
  const badge = getUserBadge(post);

  // Obtener configuración de color
  const colorConfig = OPIN_COLORS[post.color || 'purple'];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`glass-effect p-6 rounded-xl border-2 ${colorConfig.border} ${colorConfig.bg} hover:shadow-lg transition-all group`}
    >
      {/* Header: Avatar + Username + Countdown + Menu */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-shrink-0">
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
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-base font-bold text-foreground truncate">{post.username}</h3>
            {badge && (
              <div className={`flex items-center gap-1 ${badge.color}`}>
                <badge.icon className="w-3.5 h-3.5" />
                <span className="text-[10px] font-semibold">{badge.text}</span>
              </div>
            )}
            {isOwner && (
              <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-semibold">
                Tu OPIN
              </span>
            )}
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
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Título (opcional)"
            maxLength={50}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground
                     placeholder:text-muted-foreground focus:border-primary focus:outline-none text-sm"
          />
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            placeholder="¿Qué estás buscando?"
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
          {/* Título (opcional) */}
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

      {/* Footer: Stats + Botones */}
      <div className="space-y-3 pt-4 border-t border-white/5">
        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <span>{post.viewCount || 0} vistas</span>
          </div>
          <div className="flex items-center gap-1">
            <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
            <span>{likeCount} likes</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="w-3.5 h-3.5" />
            <span>{post.commentCount || 0}</span>
          </div>
        </div>

        {/* Botones de acción - Solo Like y Comentar */}
        <div className="flex items-center gap-3">
          {/* Botón Like */}
          <button
            onClick={handleLikeClick}
            disabled={likingInProgress}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                     transition-all font-semibold text-sm
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
            <span>{liked ? 'Te gusta' : 'Me gusta'}</span>
          </button>

          {/* Botón Comentarios */}
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
            <span>Comentar</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
});

// Agregar displayName para debugging
OpinCard.displayName = 'OpinCard';

export default OpinCard;
