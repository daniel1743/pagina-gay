import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Send, Lock } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const CreateThreadModal = ({ isOpen, onClose, onCreate, categories }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // ✅ Validar que el usuario esté autenticado y registrado
    if (!user || user.isGuest || user.isAnonymous) {
      toast({
        title: 'Registro Requerido',
        description: 'Debes estar registrado para publicar hilos en el foro.',
        variant: 'destructive',
        action: (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                onClose();
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
                onClose();
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
      return;
    }
    
    if (!title.trim() || !content.trim() || !category) {
      toast({
        title: 'Campos incompletos',
        description: 'Por favor completa todos los campos.',
        variant: 'destructive',
      });
      return;
    }

    onCreate({
      title: title.trim(),
      content: content.trim(),
      category,
    });

    setTitle('');
    setContent('');
    setCategory('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border text-foreground max-w-2xl rounded-2xl p-0">
        <DialogHeader className="p-6">
          <DialogTitle className="text-2xl font-extrabold flex items-center gap-2">
            {(!user || user.isGuest || user.isAnonymous) && <Lock className="w-5 h-5 text-amber-500" />}
            Crear Nuevo Hilo
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {(!user || user.isGuest || user.isAnonymous) ? (
              <span className="text-amber-500 font-semibold">
                Debes estar registrado para publicar hilos en el foro.
              </span>
            ) : (
              'Tu publicación será completamente anónima. Comparte tus experiencias o haz preguntas con confianza.'
            )}
          </DialogDescription>
        </DialogHeader>

        {(!user || user.isGuest || user.isAnonymous) ? (
          <div className="px-6 pb-6 space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-center">
              <Lock className="w-12 h-12 text-amber-500 mx-auto mb-3" />
              <p className="text-amber-500 font-semibold mb-4">
                Debes estar registrado para publicar hilos en el foro.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    onClose();
                    navigate('/auth');
                  }}
                  className="flex-1 bg-primary text-white font-bold"
                >
                  Iniciar Sesión
                </Button>
                <Button
                  onClick={() => {
                    onClose();
                    const event = new CustomEvent('openQuickSignup');
                    window.dispatchEvent(event);
                  }}
                  className="flex-1 magenta-gradient text-white font-bold"
                >
                  Registrarse
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Categoría</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-secondary border-2 border-input">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Título</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Escribe un título claro y descriptivo"
                className="bg-secondary border-2 border-input focus:border-cyan-400"
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground mt-1">{title.length}/100 caracteres</p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Contenido</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Describe tu situación, pregunta o experiencia..."
                className="min-h-[150px] bg-secondary border-2 border-input focus:border-cyan-400"
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground mt-1">{content.length}/1000 caracteres</p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 magenta-gradient text-white font-bold"
              >
                <Send className="w-4 h-4 mr-2" />
                Publicar
              </Button>
            </div>
          </form>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="w-6 h-6" />
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default CreateThreadModal;
