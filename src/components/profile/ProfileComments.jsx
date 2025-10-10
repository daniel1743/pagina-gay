import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, ThumbsUp, ThumbsDown } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import ComingSoonModal from '@/components/ui/ComingSoonModal';

const initialComments = [
  { id: 1, author: 'Carlos', avatarSeed: 'Carlos', text: '¡Un perfil genial! Muy buena onda.', likes: 12, dislikes: 1 },
  { id: 2, author: 'Matias', avatarSeed: 'Matias', text: 'Coincidimos en varios intereses, ¡deberíamos hablar!', likes: 8, dislikes: 0 },
];

const ProfileComments = () => {
  const { user } = useAuth();
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState('');
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState({ name: '', description: '' });

  const handleSubmitComment = (e) => {
    e.preventDefault();
    if (newComment.trim() === '') return;

    if (user.isGuest) {
      toast({
        title: 'Inicia sesión para comentar',
        description: 'Debes tener una cuenta para dejar un comentario.',
        variant: 'destructive',
      });
      return;
    }

    const commentToAdd = {
      id: Date.now(),
      author: user.username,
      avatarSeed: user.username,
      text: newComment,
      likes: 0,
      dislikes: 0,
    };
    setComments([commentToAdd, ...comments]);
    setNewComment('');
    toast({ title: 'Comentario publicado 👍' });
  };

  const handleReaction = (commentId, reaction) => {
    setComingSoonFeature({
      name: 'las reacciones a comentarios',
      description: 'Pronto podrás dar like o dislike a los comentarios y ver las reacciones de otros usuarios en tiempo real.'
    });
    setShowComingSoon(true);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmitComment} className="flex flex-col gap-4">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Deja un comentario público..."
          className="bg-[#2C2A4A] border-2 border-[#413e62] focus:border-[#00FFFF] min-h-[80px]"
        />
        <Button type="submit" className="self-end cyan-gradient text-black font-bold">
          <Send className="mr-2 h-4 w-4" />
          Comentar
        </Button>
      </form>

      <div className="space-y-4">
        <AnimatePresence>
          {comments.map((comment, index) => (
            <motion.div
              key={comment.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-[#2C2A4A]/50 p-4 rounded-xl"
            >
              <div className="flex items-start gap-4">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.avatarSeed}`} />
                  <AvatarFallback>{comment.author[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-bold text-gray-200">{comment.author}</p>
                  <p className="text-gray-300">{comment.text}</p>
                  <div className="flex items-center gap-4 mt-2 text-gray-400">
                    <Button onClick={() => handleReaction(comment.id, 'like')} variant="ghost" size="sm" className="flex items-center gap-1 hover:text-green-400">
                      <ThumbsUp className="w-4 h-4" /> {comment.likes}
                    </Button>
                    <Button onClick={() => handleReaction(comment.id, 'dislike')} variant="ghost" size="sm" className="flex items-center gap-1 hover:text-red-400">
                      <ThumbsDown className="w-4 h-4" /> {comment.dislikes}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <ComingSoonModal
        isOpen={showComingSoon}
        onClose={() => setShowComingSoon(false)}
        feature={comingSoonFeature.name}
        description={comingSoonFeature.description}
      />
    </div>
  );
};

export default ProfileComments;