/**
 * ✍️ OpinComposerPage - Crear nuevo post COMPLETO
 *
 * Features:
 * - Título opcional (máx 50 chars)
 * - Textarea (10-500 chars)
 * - Selector de colores (6 opciones)
 * - Preview en tiempo real
 * - Validaciones completas
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Palette } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createOpinPost, canCreatePost, OPIN_COLORS } from '@/services/opinService';
import { toast } from '@/components/ui/use-toast';

const OpinComposerPage = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [selectedColor, setSelectedColor] = useState('purple');
  const [loading, setLoading] = useState(false);
  const [canCreate, setCanCreate] = useState(true);

  const titleCount = title.length;
  const maxTitleChars = 50;
  const charCount = text.length;
  const minChars = 10;
  const maxChars = 500;
  const isValid = charCount >= minChars && charCount <= maxChars && titleCount <= maxTitleChars;

  useEffect(() => {
    checkCanCreate();
  }, []);

  const checkCanCreate = async () => {
    const result = await canCreatePost();

    if (!result.canCreate) {
      if (result.reason === 'active_post_exists') {
        toast({
          title: 'Ya tienes un post activo',
          description: 'Solo puedes tener 1 post activo a la vez',
          variant: 'destructive',
        });
        navigate('/opin');
      } else if (result.reason === 'guest_user') {
        toast({
          title: 'Regístrate para publicar',
          description: 'Los invitados no pueden publicar en OPIN',
          variant: 'destructive',
        });
        navigate('/auth');
      }
      setCanCreate(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isValid) {
      toast({
        title: 'Texto inválido',
        description: `Escribe entre ${minChars} y ${maxChars} caracteres`,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      await createOpinPost({
        title: title.trim(),
        text: text.trim(),
        color: selectedColor,
        userProfile: {
          username: userProfile?.username || user?.displayName || 'Anónimo',
          avatar: userProfile?.avatar || user?.photoURL || '',
        },
      });

      toast({
        title: '✨ Post publicado',
        description: 'Tu post estará activo durante 24 horas',
      });

      navigate('/opin');
    } catch (error) {
      console.error('Error creando post:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo publicar el post',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const colorConfig = OPIN_COLORS[selectedColor];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/opin')}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <Sparkles className="w-6 h-6 text-purple-400" />
            <h1 className="text-2xl font-bold text-foreground">Crear post</h1>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Info */}
          <div className="glass-effect p-4 rounded-lg border border-white/10">
            <p className="text-sm text-muted-foreground leading-relaxed">
              💜 Comparte lo que buscas y deja que otros te descubran.
              Tu post estará activo durante <strong>24 horas</strong>.
            </p>
          </div>

          {/* Título opcional */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Título (opcional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ejemplo: Buscando amigos en CDMX"
              maxLength={maxTitleChars}
              className="w-full px-4 py-3 bg-card border-2 border-border rounded-xl
                       text-foreground placeholder:text-muted-foreground
                       focus:border-primary focus:outline-none transition-all"
            />
            <div className="mt-1">
              <span className={`text-xs ${titleCount > maxTitleChars ? 'text-red-400' : 'text-muted-foreground'}`}>
                {titleCount}/{maxTitleChars} caracteres
              </span>
            </div>
          </div>

          {/* Selector de Color */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Color del post
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {Object.entries(OPIN_COLORS).map(([key, config]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedColor(key)}
                  className={`relative p-4 rounded-xl transition-all ${
                    selectedColor === key
                      ? `ring-2 ring-offset-2 ring-offset-background ${config.border} scale-105`
                      : 'hover:scale-105'
                  }`}
                >
                  <div className={`w-full h-12 rounded-lg bg-gradient-to-br ${config.gradient}`} />
                  <span className="block text-xs text-center mt-2 font-medium text-foreground">
                    {config.name}
                  </span>
                  {selectedColor === key && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                      <span className="text-xs">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Textarea */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              ¿Qué estás buscando? *
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ejemplo: Busco amigos para salir, me gusta el cine, los videojuegos y la buena comida..."
              rows={8}
              maxLength={maxChars}
              className="w-full px-4 py-3 bg-card border-2 border-border rounded-xl
                       text-foreground placeholder:text-muted-foreground
                       focus:border-primary focus:outline-none
                       resize-none transition-all"
              autoFocus
            />

            {/* Contador */}
            <div className="flex items-center justify-between mt-2">
              <span
                className={`text-sm ${
                  charCount < minChars
                    ? 'text-red-400'
                    : charCount > maxChars
                    ? 'text-red-400'
                    : 'text-green-400'
                }`}
              >
                {charCount < minChars
                  ? `Mínimo ${minChars} caracteres (faltan ${minChars - charCount})`
                  : charCount > maxChars
                  ? `Máximo ${maxChars} caracteres (sobran ${charCount - maxChars})`
                  : `${charCount}/${maxChars} caracteres`}
              </span>
            </div>
          </div>

          {/* Preview */}
          {text.trim() && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Vista previa
              </label>
              <div className={`glass-effect p-6 rounded-xl border-2 ${colorConfig.border} ${colorConfig.bg}`}>
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={userProfile?.avatar || user?.photoURL || ''}
                    alt="Avatar"
                    className="w-10 h-10 rounded-full ring-2 ring-primary/20"
                  />
                  <span className="font-semibold text-foreground">
                    {userProfile?.username || user?.displayName || 'Tú'}
                  </span>
                </div>

                {title.trim() && (
                  <h3 className={`text-lg font-bold mb-2 bg-gradient-to-r ${colorConfig.gradient} bg-clip-text text-transparent`}>
                    {title}
                  </h3>
                )}

                <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                  {text}
                </p>

                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5 text-xs text-muted-foreground">
                  <span>❤️ 0 likes</span>
                  <span>💬 0 comentarios</span>
                  <span>👁️ 0 vistas</span>
                </div>
              </div>
            </div>
          )}

          {/* Botón Publicar */}
          <button
            type="submit"
            disabled={!isValid || loading || !canCreate}
            className={`w-full py-4 rounded-xl bg-gradient-to-r ${colorConfig.gradient}
                     hover:opacity-90 text-white font-bold text-lg
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all shadow-lg hover:shadow-xl disabled:hover:shadow-lg`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                Publicando...
              </span>
            ) : (
              '✨ Publicar'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OpinComposerPage;
