import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Smile, Mic, Image, MessageSquarePlus, X } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import EmojiPicker, { EmojiStyle, Categories } from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

const SENSITIVE_WORDS = ['acoso', 'amenaza', 'amenazas', 'acosador'];

const PREMIUM_EMOJIS = [
  {
    names: ['diya_lamp'],
    img: 'https://raw.githubusercontent.com/iamcal/emoji-data/master/img-apple-160/1fa75.png',
    id: '1fa75',
  },
  {
    names: ['yo-yo'],
    img: 'https://raw.githubusercontent.com/iamcal/emoji-data/master/img-apple-160/1fa76.png',
    id: '1fa76',
  },
  {
    names: ['slingshot'],
    img: 'https://raw.githubusercontent.com/iamcal/emoji-data/master/img-apple-160/1fa77.png',
    id: '1fa77',
  },
  {
    names: ['diving_mask'],
    img: 'https://raw.githubusercontent.com/iamcal/emoji-data/master/img-apple-160/1f93f.png',
    id: '1f93f',
  },
  {
    names: ['curling_stone'],
    img: 'https://raw.githubusercontent.com/iamcal/emoji-data/master/img-apple-160/1f94f.png',
    id: '1f94f',
  },
];


const ChatInput = ({ onSendMessage }) => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showQuickPhrases, setShowQuickPhrases] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
          setShowEmojiPicker(false);
          setShowQuickPhrases(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  const checkForSensitiveWords = (text) => {
    const words = text.toLowerCase().split(/\s+/);
    const found = words.some(word => SENSITIVE_WORDS.includes(word.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"")));
    if (found) {
      toast({
        variant: 'destructive',
        title: 'Contenido Sensible Detectado',
        description: 'Tu mensaje podría contener lenguaje inapropiado. Ha sido enviado a moderación.',
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      checkForSensitiveWords(message);
      onSendMessage(message.trim(), 'text');
      setMessage('');
      setShowEmojiPicker(false);
      setShowQuickPhrases(false);
    }
  };

  const handleEmojiClick = (emojiObject) => {
    setMessage(prevMessage => prevMessage + emojiObject.emoji);
  };
  
  const handleQuickPhraseClick = (phrase) => {
    onSendMessage(phrase, 'text');
    setShowQuickPhrases(false);
  }

  const handlePremiumFeature = (featureName, implementationMessage) => {
     if (!user.isPremium) {
      toast({
        title: "Función Premium 👑",
        description: `El envío de ${featureName} es exclusivo para usuarios Premium.`,
      });
      return;
    }
    toast({
        title: `🚧 ${implementationMessage} en desarrollo`,
        description: "Esta función estará disponible pronto. ¡Solicítala en tu próximo mensaje! 🚀",
      });
  }

  const emojiPickerCategories = () => {
    const standardCategories = [
      { name: "Recientes", category: Categories.SUGGESTED },
      { name: "Sonrisas y Emociones", category: Categories.SMILEYS_PEOPLE },
      { name: "Animales y Naturaleza", category: Categories.ANIMALS_NATURE },
      { name: "Comida y Bebida", category: Categories.FOOD_DRINK },
      { name: "Viajes y Lugares", category: Categories.TRAVEL_PLACES },
      { name: "Actividades", category: Categories.ACTIVITIES },
      { name: "Objetos", category: Categories.OBJECTS },
      { name: "Símbolos", category: Categories.SYMBOLS },
      { name: "Banderas", category: Categories.FLAGS },
    ];

    if (user.isPremium) {
      return [
        { name: "Premium 👑", category: Categories.CUSTOM },
        ...standardCategories
      ];
    }
    return standardCategories;
  }

  return (
    <div className="bg-card border-t p-4 shrink-0 relative" ref={wrapperRef}>
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-full right-4 mb-2 z-10"
          >
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              theme="dark"
              height={350}
              width={300}
              emojiStyle={EmojiStyle.NATIVE}
              customEmojis={user.isPremium ? PREMIUM_EMOJIS : []}
              categories={emojiPickerCategories()}
            />
          </motion.div>
        )}
        {showQuickPhrases && (
             <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-full left-4 mb-2 z-10 w-64 bg-secondary p-2 rounded-lg shadow-lg border border-input"
            >
                {(user.quickPhrases && user.quickPhrases.length > 0) ? user.quickPhrases.map((phrase, i) => (
                    <div key={i} onClick={() => handleQuickPhraseClick(phrase)} className="p-2 hover:bg-background rounded cursor-pointer text-sm">{phrase}</div>
                )) : <div className="p-2 text-muted-foreground text-sm text-center">No tienes frases rápidas. Añádelas desde Ajustes.</div>}
            </motion.div>
        )}
      </AnimatePresence>
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => { setShowQuickPhrases(prev => !prev); setShowEmojiPicker(false);}}
          className="text-muted-foreground hover:text-cyan-400"
          title="Frases Rápidas"
          disabled={!user.isPremium}
        >
            <MessageSquarePlus className="w-5 h-5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => { setShowEmojiPicker(prev => !prev); setShowQuickPhrases(false);}}
          className="text-muted-foreground hover:text-cyan-400"
          title="Selector de Emojis"
        >
          {showEmojiPicker ? <X className="w-5 h-5"/> : <Smile className="w-5 h-5" />}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => handlePremiumFeature("fotos", "Selector de imágenes")}
          className={`text-muted-foreground hover:text-cyan-400 ${!user.isPremium ? 'opacity-50' : ''}`}
          title="Enviar Imagen (Premium)"
        >
          <Image className="w-5 h-5" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => handlePremiumFeature("mensajes de voz", "Grabadora de voz")}
          className={`text-muted-foreground hover:text-cyan-400 ${!user.isPremium ? 'opacity-50' : ''}`}
          title="Enviar Mensaje de Voz (Premium)"
        >
          <Mic className="w-5 h-5" />
        </Button>

        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={user.isGuest ? "Escribe hasta 3 mensajes..." : "Escribe un mensaje..."}
          className="flex-1 bg-secondary border-2 border-input rounded-lg px-4 py-2 text-foreground placeholder:text-muted-foreground focus:border-accent transition-all"
        />

        <Button
          type="submit"
          disabled={!message.trim()}
          className="magenta-gradient text-white hover:scale-105 transition-transform rounded-lg"
          size="icon"
        >
          <Send className="w-5 h-5" />
        </Button>
      </form>
    </div>
  );
};

export default ChatInput;