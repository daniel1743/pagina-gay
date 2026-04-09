/**
 * OpinComposerPage - Compositor simple para el tablón
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  createOpinPost,
  canCreatePost,
  OPIN_COLORS,
  OPIN_STATUS_OPTIONS,
  getOpinStatusMeta,
  getOpinPostById,
  editOpinPost,
  getMyActiveOpinIntent,
  deleteOpinPost,
} from '@/services/opinService';
import { toast } from '@/components/ui/use-toast';
import { sanitizeOpinPublicText } from '@/services/opinSafetyService';

const OpinComposerPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userProfile } = useAuth();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [canCreate, setCanCreate] = useState(true);
  const [status, setStatus] = useState(OPIN_STATUS_OPTIONS[0].value);
  const [selectedColor, setSelectedColor] = useState(() => {
    const colorKeys = Object.keys(OPIN_COLORS);
    return colorKeys[Math.floor(Math.random() * colorKeys.length)];
  });
  const [editingPostId, setEditingPostId] = useState(null);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [activeIntentToReplace, setActiveIntentToReplace] = useState(null);
  const [replacingIntent, setReplacingIntent] = useState(false);
  const isEditing = Boolean(editingPostId);

  const charCount = text.length;
  const minChars = 10;
  const maxChars = 280; // Reducido para formato más corto
  const isValid = charCount >= minChars && charCount <= maxChars;

  useEffect(() => {
    if (location.search.includes('edit=') && !user) return;
    checkCanCreate();
    loadExistingIntent();
  }, [location.search, user?.id, user?.uid]);

  const checkCanCreate = async () => {
    const params = new URLSearchParams(location.search);
    const editId = params.get('edit');
    if (editId) {
      setCanCreate(true);
      setActiveIntentToReplace(null);
      return;
    }

    const result = await canCreatePost();
    if (!result.canCreate && result.reason === 'active_intent') {
      try {
        const activeIntent = await getMyActiveOpinIntent();
        setActiveIntentToReplace(activeIntent);
      } catch {
        setActiveIntentToReplace(null);
      }
      setCanCreate(false);
      return;
    }

    if (!result.canCreate) {
      toast({ description: result.message || 'No puedes crear más notas', variant: 'destructive' });
      navigate('/opin');
      setCanCreate(false);
      return;
    }

    setCanCreate(true);
    setActiveIntentToReplace(null);
  };

  const loadExistingIntent = async () => {
    const params = new URLSearchParams(location.search);
    const editId = params.get('edit');

    if (!editId) {
      setEditingPostId(null);
      return;
    }

    setLoadingExisting(true);
    try {
      const post = await getOpinPostById(editId);
      if (!post) {
        toast({ description: 'No se encontró la intención a editar.', variant: 'destructive' });
        navigate('/opin');
        return;
      }

      const currentUserId = user?.id || user?.uid;
      if (!currentUserId || post.userId !== currentUserId) {
        toast({ description: 'No puedes editar esta intención.', variant: 'destructive' });
        navigate('/opin');
        return;
      }

      setEditingPostId(post.id);
      setText(post.text || '');
      setStatus(post.status || OPIN_STATUS_OPTIONS[0].value);
      setSelectedColor(post.color && OPIN_COLORS[post.color] ? post.color : 'purple');
    } catch (error) {
      toast({ description: error?.message || 'No se pudo cargar la intención.', variant: 'destructive' });
      navigate('/opin');
    } finally {
      setLoadingExisting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid || loading) return;

    setLoading(true);
    try {
      if (isEditing) {
        await editOpinPost(editingPostId, {
          text: text.trim(),
          color: selectedColor,
          status,
        });
        toast({ description: 'Intención actualizada' });
      } else {
        await createOpinPost({
          text: text.trim(),
          color: selectedColor,
          status,
          userProfile: {
            username: userProfile?.username || user?.displayName || 'Anónimo',
            avatar: userProfile?.avatar || user?.photoURL || '',
          },
        });
        toast({ description: 'Intención abierta' });
      }

      const currentUserId = user?.id || user?.uid || null;
      if (currentUserId) {
        sessionStorage.removeItem(`opin:intent_cta:dismissed:${currentUserId}`);
      }
      sessionStorage.setItem('opin:just_posted', '1');
      navigate('/opin?fromComposer=1');
    } catch (error) {
      if (error?.message?.includes('Ya tienes una intención activa')) {
        try {
          const activeIntent = await getMyActiveOpinIntent();
          setActiveIntentToReplace(activeIntent);
          setCanCreate(false);
          toast({
            description: 'Ya tienes una intención activa. Puedes eliminarla y publicar una nueva.',
            variant: 'destructive',
          });
          return;
        } catch {
          // continuar al manejo genérico
        }
      }
      toast({ description: error.message || 'Error al publicar', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleReplaceIntent = async () => {
    if (!activeIntentToReplace?.id || replacingIntent) return;

    setReplacingIntent(true);
    try {
      await deleteOpinPost(activeIntentToReplace.id);
      setActiveIntentToReplace(null);
      setCanCreate(true);
      toast({ description: 'Intención actual eliminada. Ya puedes publicar la nueva.' });
    } catch (error) {
      toast({
        description: error?.message || 'No se pudo eliminar la intención actual.',
        variant: 'destructive',
      });
    } finally {
      setReplacingIntent(false);
    }
  };

  const colorConfig = OPIN_COLORS[selectedColor];
  const selectedStatusMeta = getOpinStatusMeta(status);

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
              <h1 className="text-lg font-bold">{isEditing ? 'Editar intención' : 'Nueva intención'}</h1>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!isValid || loading || !canCreate || loadingExisting}
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
              <span>{isEditing ? 'Guardar' : 'Publicar'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        {loadingExisting ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent" />
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEditing && activeIntentToReplace && (
            <div className="mx-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="text-sm font-semibold text-foreground">
                Ya tienes una intención activa
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                ¿Deseas eliminar la intención actual y publicar una nueva?
              </p>
              <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Intención actual</p>
                <p className="mt-2 text-sm text-foreground">{sanitizeOpinPublicText(activeIntentToReplace.text || 'Sin texto')}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleReplaceIntent}
                  disabled={replacingIntent}
                  className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 hover:bg-red-500/15 transition-colors disabled:opacity-60"
                >
                  {replacingIntent ? 'Eliminando...' : 'Eliminar actual y seguir'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/opin/new?edit=${activeIntentToReplace.id}`)}
                  className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200 hover:bg-cyan-500/15 transition-colors"
                >
                  Editar intención actual
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/opin')}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-white/10 transition-colors"
                >
                  Volver
                </button>
              </div>
            </div>
          )}

          {/* Textarea */}
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="¿Qué buscas ahora? Escríbelo claro y directo..."
              rows={4}
              maxLength={maxChars}
              autoFocus
              className="w-full px-4 py-3 bg-transparent text-lg placeholder:text-muted-foreground focus:outline-none resize-none border-none"
            />

            {/* Indicador de color */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-full bg-gradient-to-b ${colorConfig.gradient}`} />
          </div>

          <div className="px-4">
            <p className="text-xs text-muted-foreground mb-2">Estado de tu nota</p>
            <div className="flex flex-wrap gap-2">
              {OPIN_STATUS_OPTIONS.map((option) => {
                const isActive = status === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatus(option.value)}
                    className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                      isActive
                        ? option.badgeClassName
                        : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10'
                    }`}
                  >
                    {option.shortLabel}
                  </button>
                );
              })}
            </div>
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

          <div className="px-4">
            <p className="text-xs text-muted-foreground">
              No publiques telefonos, WhatsApp ni redes. Primero conversa dentro de Chactivo.
            </p>
          </div>

          {/* Preview en tiempo real */}
          {text.trim() && (
            <div className="mt-6 px-4">
              <p className="text-xs text-muted-foreground mb-2">Vista previa:</p>
              <div className="border-l-2 border-purple-500 pl-3 py-2 bg-white/5 rounded-r">
                <p className="text-sm text-foreground">{text}</p>
                <div className="mt-2">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${selectedStatusMeta.badgeClassName}`}>
                    {selectedStatusMeta.shortLabel}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {userProfile?.username || user?.displayName || 'Tú'} · {isEditing ? 'actualizada ahora' : 'ahora'}
                </p>
              </div>
            </div>
          )}
        </form>
        )}

        {/* Tips */}
        <div className="mt-8 px-4 space-y-2 text-xs text-muted-foreground">
          <p>Tu intención quedará visible en OPIN y podrá recibir respuestas.</p>
          <p>Solo puedes tener una intención activa al mismo tiempo.</p>
          <p>Podrás cambiar su estado después para indicar si sigues buscando o ya cerraste.</p>
        </div>
      </div>
    </div>
  );
};

export default OpinComposerPage;
