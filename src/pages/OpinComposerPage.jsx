/**
 * OpinComposerPage - Compositor simple para el tablón
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createOpinPost, canCreatePost, OPIN_COLORS } from '@/services/opinService';
import { toast } from '@/components/ui/use-toast';

const OpinComposerPage = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [canCreate, setCanCreate] = useState(true);

  // Color automático random
  const selectedColor = useMemo(() => {
    const colorKeys = Object.keys(OPIN_COLORS);
    return colorKeys[Math.floor(Math.random() * colorKeys.length)];
  }, []);

  const charCount = text.length;
  const minChars = 10;
  const maxChars = 280; // Reducido para formato más corto
  const isValid = charCount >= minChars && charCount <= maxChars;

  useEffect(() => {
    checkCanCreate();
  }, []);

  const checkCanCreate = async () => {
    const result = await canCreatePost();
    if (!result.canCreate) {
      toast({ description: result.message || 'No puedes crear más notas', variant: 'destructive' });
      navigate('/opin');
      setCanCreate(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid || loading) return;

    setLoading(true);
    try {
      await createOpinPost({
        text: text.trim(),
        color: selectedColor,
        userProfile: {
          username: userProfile?.username || user?.displayName || 'Anónimo',
          avatar: userProfile?.avatar || user?.photoURL || '',
        },
      });

      toast({ description: 'Nota publicada' });
      navigate('/opin');
    } catch (error) {
      toast({ description: error.message || 'Error al publicar', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const colorConfig = OPIN_COLORS[selectedColor];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/opin')}
                className="p-1.5 -ml-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-bold">Nueva nota</h1>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!isValid || loading || !canCreate}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
                ${isValid && !loading
                  ? `bg-gradient-to-r ${colorConfig.gradient} text-white`
                  : 'bg-white/10 text-muted-foreground cursor-not-allowed'
                }`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Publicar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Textarea */}
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="¿Qué buscas? Cuéntalo brevemente..."
              rows={4}
              maxLength={maxChars}
              autoFocus
              className="w-full px-4 py-3 bg-transparent text-lg placeholder:text-muted-foreground focus:outline-none resize-none border-none"
            />

            {/* Indicador de color */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-full bg-gradient-to-b ${colorConfig.gradient}`} />
          </div>

          {/* Contador */}
          <div className="flex items-center justify-between px-4">
            <span className="text-xs text-muted-foreground">
              {charCount < minChars && `Mínimo ${minChars} caracteres`}
            </span>
            <span className={`text-sm ${charCount > maxChars ? 'text-red-400' : 'text-muted-foreground'}`}>
              {charCount}/{maxChars}
            </span>
          </div>

          {/* Preview en tiempo real */}
          {text.trim() && (
            <div className="mt-6 px-4">
              <p className="text-xs text-muted-foreground mb-2">Vista previa:</p>
              <div className="border-l-2 border-purple-500 pl-3 py-2 bg-white/5 rounded-r">
                <p className="text-sm text-foreground">{text}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {userProfile?.username || user?.displayName || 'Tú'} · ahora
                </p>
              </div>
            </div>
          )}
        </form>

        {/* Tips */}
        <div className="mt-8 px-4 space-y-2 text-xs text-muted-foreground">
          <p>Tu nota estará visible por 24 horas</p>
          <p>Otros pueden responder y ver tu perfil</p>
        </div>
      </div>
    </div>
  );
};

export default OpinComposerPage;
