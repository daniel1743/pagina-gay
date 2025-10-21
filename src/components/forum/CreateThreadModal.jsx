import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Send } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const CreateThreadModal = ({ isOpen, onClose, onCreate, categories }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
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
          <DialogTitle className="text-2xl font-extrabold">
            Crear Nuevo Hilo
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Tu publicación será completamente anónima. Comparte tus experiencias o haz preguntas con confianza.
          </DialogDescription>
        </DialogHeader>

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
