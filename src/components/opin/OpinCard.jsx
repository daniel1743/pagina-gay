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

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, User, Clock, CheckCircle, Crown, Flame, Heart, MessageCircle, Lock } from 'lucide-react';
import { incrementProfileClickCount, getTimeRemaining, toggleLike, hasUserLiked, OPIN_COLORS } from '@/services/opinService';
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

const OpinCard = ({ post, index, onProfileClick, onCommentsClick, isReadOnlyMode = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [timeRemaining, setTimeRemaining] = React.useState('');
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [liked, setLiked] = useState(hasUserLiked(post));
  const [likingInProgress, setLikingInProgress] = useState(false);

  // Actualizar countdown cada minuto
  React.useEffect(() => {
    const updateTime = () => {
      const remaining = getTimeRemaining(post.expiresAt);
      setTimeRemaining(remaining);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Cada minuto

    return () => clearInterval(interval);
  }, [post.expiresAt]);

  const handleProfileClick = async () => {
    // Si está en modo solo lectura, mostrar toast y redirigir a registro
    if (isReadOnlyMode) {
      toast({
        title: '¡Regístrate para ver perfiles!',
        description: 'Crea una cuenta gratis para conocer a otros usuarios',
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

    // Incrementar contador de clicks
    await incrementProfileClickCount(post.id);

    // Llamar callback del padre para abrir perfil
    if (onProfileClick) {
      onProfileClick(post.userId, post.username);
    }
  };

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

  // Obtener badge del usuario
  const badge = getUserBadge(post);

  // Obtener configuración de color
  const colorConfig = OPIN_COLORS[post.color || 'purple'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`glass-effect p-6 rounded-xl border-2 ${colorConfig.border} ${colorConfig.bg} hover:shadow-lg transition-all group`}
    >
      {/* Header: Avatar + Username + Countdown */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <img
            src={post.avatar}
            alt={post.username}
            className="w-12 h-12 rounded-full ring-2 ring-primary/20"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-bold text-foreground">{post.username}</h3>
            {badge && (
              <div className={`flex items-center gap-1 ${badge.color}`}>
                <badge.icon className="w-3.5 h-3.5" />
                <span className="text-[10px] font-semibold">{badge.text}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{timeRemaining}</span>
          </div>
        </div>
      </div>

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

      {/* Footer: Stats + Botones */}
      <div className="space-y-3 pt-4 border-t border-white/5">
        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <span>{post.viewCount || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
            <span>{likeCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageCircle className="w-3.5 h-3.5" />
            <span>{post.commentCount || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <User className="w-3.5 h-3.5" />
            <span>{post.profileClickCount || 0}</span>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center gap-2">
          {/* Botón Like */}
          <button
            onClick={handleLikeClick}
            disabled={likingInProgress}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg
                     transition-all font-semibold text-sm
                     ${isReadOnlyMode
                       ? 'bg-white/5 text-muted-foreground border border-white/10 hover:bg-white/10 cursor-pointer'
                       : liked
                         ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30'
                         : 'bg-white/5 text-foreground border border-white/10 hover:bg-white/10'
                     }`}
          >
            {isReadOnlyMode ? (
              <Lock className="w-4 h-4" />
            ) : (
              <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
            )}
            <span>{isReadOnlyMode ? 'Me gusta' : liked ? 'Te gusta' : 'Me gusta'}</span>
          </button>

          {/* Botón Comentarios */}
          <button
            onClick={handleCommentsClick}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg
                     transition-all font-semibold text-sm
                     ${isReadOnlyMode
                       ? 'bg-white/5 text-muted-foreground border border-white/10 hover:bg-white/10 cursor-pointer'
                       : 'bg-white/5 text-foreground border border-white/10 hover:bg-white/10'
                     }`}
          >
            {isReadOnlyMode ? (
              <Lock className="w-4 h-4" />
            ) : (
              <MessageCircle className="w-4 h-4" />
            )}
            <span>Comentar</span>
          </button>

          {/* Botón Ver perfil */}
          <button
            onClick={handleProfileClick}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg
                     ${isReadOnlyMode
                       ? 'bg-white/5 text-muted-foreground border border-white/10 hover:bg-white/10'
                       : `bg-gradient-to-r ${colorConfig.gradient} text-white shadow-md hover:shadow-lg hover:opacity-90`
                     }
                     text-sm font-semibold transition-all`}
          >
            {isReadOnlyMode && <Lock className="w-4 h-4" />}
            Ver perfil
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default OpinCard;
