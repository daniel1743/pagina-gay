import React, { useState, useRef, useEffect, lazy, Suspense, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Smile, Mic, Image, MessageSquarePlus, X } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import ComingSoonModal from '@/components/ui/ComingSoonModal';
import { EmojiStyle, Categories } from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

// Lazy load del EmojiPicker para mejorar rendimiento
const EmojiPicker = lazy(() => import('emoji-picker-react'));

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
  const { user, guestMessageCount } = useAuth();
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showQuickPhrases, setShowQuickPhrases] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState({ name: '', description: '' });
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

  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (message.trim() && !isSending) {
      setIsSending(true);
      checkForSensitiveWords(message);

      // Microinteracción: feedback inmediato
      const messageToSend = message.trim();
      setMessage(''); // Limpiar inmediatamente para sensación de velocidad

      try {
        await onSendMessage(messageToSend, 'text');
        // Vibración sutil si está disponible
        if (navigator.vibrate) {
          navigator.vibrate(10);
        }
      } catch (error) {
        // Si falla, restaurar el mensaje
        setMessage(messageToSend);
      } finally {
        setIsSending(false);
        setShowEmojiPicker(false);
        setShowQuickPhrases(false);
      }
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
    // Show Coming Soon modal for premium users
    const descriptions = {
      'fotos': 'Podrás compartir imágenes directamente en el chat. Sube fotos desde tu dispositivo o cámara.',
      'mensajes de voz': 'Envía mensajes de voz de hasta 60 segundos. Perfecto para cuando escribir no es suficiente.'
    };
    setComingSoonFeature({
      name: implementationMessage,
      description: descriptions[featureName] || 'Esta función estará disponible pronto.'
    });
    setShowComingSoon(true);
  }

  // Memoizar las categorías para evitar recalcularlas en cada render
  const emojiPickerCategories = useMemo(() => {
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

    if (user?.isPremium) {
      return [
        { name: "Premium 👑", category: Categories.CUSTOM },
        ...standardCategories
      ];
    }
    return standardCategories;
  }, [user?.isPremium]);

  const remainingMessages = user?.isAnonymous ? 10 - guestMessageCount : null;
  const showMessageLimit = user?.isAnonymous && remainingMessages !== null;

  return (
    <div className="bg-card border-t p-4 shrink-0 relative" ref={wrapperRef}>
      {/* Contador de mensajes restantes para usuarios anónimos */}
      {showMessageLimit && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-3 px-3 py-2 rounded-lg border ${
            remainingMessages <= 3
              ? 'bg-red-500/10 border-red-500/30 text-red-400'
              : remainingMessages <= 5
              ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
              : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
          }`}
        >
          <p className="text-sm font-semibold text-center">
            {remainingMessages > 0 ? (
              <>Te quedan <span className="font-bold text-lg">{remainingMessages}</span> mensajes gratis. <a href="/auth" className="underline hover:opacity-80">Regístrate</a> para chatear ilimitado.</>
            ) : (
              <>Límite alcanzado. <a href="/auth" className="underline hover:opacity-80">Regístrate gratis</a> para continuar chateando.</>
            )}
          </p>
        </motion.div>
      )}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-full right-4 mb-2 z-10"
          >
            <Suspense fallback={
              <div className="bg-secondary p-4 rounded-lg border border-input w-[300px] h-[350px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                  <p className="text-sm text-muted-foreground">Cargando emojis...</p>
                </div>
              </div>
            }>
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                theme="dark"
                height={350}
                width={300}
                emojiStyle={EmojiStyle.NATIVE}
                customEmojis={user?.isPremium ? PREMIUM_EMOJIS : []}
                categories={emojiPickerCategories}
                preload={true}
              />
            </Suspense>
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
          aria-label="Abrir frases rápidas (Premium)"
          aria-pressed={showQuickPhrases}
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
          aria-label={showEmojiPicker ? "Cerrar selector de emojis" : "Abrir selector de emojis"}
          aria-pressed={showEmojiPicker}
          aria-expanded={showEmojiPicker}
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
          aria-label="Enviar imagen (función Premium)"
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
          aria-label="Enviar mensaje de voz (función Premium)"
        >
          <Mic className="w-5 h-5" />
        </Button>

        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={user.isGuest ? "Escribe hasta 3 mensajes..." : "Escribe un mensaje..."}
          className="flex-1 bg-secondary border-2 border-input rounded-lg px-4 py-2 text-foreground placeholder:text-muted-foreground focus:border-accent transition-all"
          aria-label="Campo de texto para escribir mensaje"
          maxLength={500}
          autoComplete="off"
        />

        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            type="submit"
            disabled={!message.trim() || isSending}
            className="magenta-gradient text-white rounded-lg relative overflow-hidden"
            size="icon"
            aria-label={isSending ? "Enviando mensaje..." : "Enviar mensaje"}
          >
            <motion.div
              animate={isSending ? {
                rotate: 360,
                transition: { duration: 0.6, repeat: Infinity, ease: "linear" }
              } : { rotate: 0 }}
            >
              <Send className="w-5 h-5" />
            </motion.div>
            {isSending && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
            )}
          </Button>
        </motion.div>
      </form>

      <ComingSoonModal
        isOpen={showComingSoon}
        onClose={() => setShowComingSoon(false)}
        feature={comingSoonFeature.name}
        description={comingSoonFeature.description}
      />
    </div>
  );
};

export default ChatInput;