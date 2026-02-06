import React, { useState, useRef, useEffect, lazy, Suspense, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Smile, Mic, Image, MessageSquarePlus, X, Reply } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import ComingSoonModal from '@/components/ui/ComingSoonModal';
import { EmojiStyle, Categories } from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { updateTypingStatus } from '@/services/presenceService';

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


const ChatInput = ({ onSendMessage, onFocus, onBlur, externalMessage = null, roomId = null, replyTo = null, onCancelReply, onRequestNickname, isGuest = false }) => {
  const { user, guestMessageCount } = useAuth();
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showQuickPhrases, setShowQuickPhrases] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const typingTimeoutRef = useRef(null);

  // ✨ COMPANION AI: Setear mensaje cuando viene de sugerencia externa
  useEffect(() => {
    if (externalMessage && externalMessage !== message) {
      setMessage(externalMessage);
      // Auto-focus en el input
      textareaRef.current?.focus();
    }
  }, [externalMessage]);
  const [comingSoonFeature, setComingSoonFeature] = useState({ name: '', description: '' });
  const wrapperRef = useRef(null);
  const textareaRef = useRef(null);

  // 📱 FIX MÓVIL: Asegurar que el textarea sea focusable y visible en dispositivos móviles
  useEffect(() => {
    if (textareaRef.current) {
      // Forzar que el elemento sea focusable
      textareaRef.current.setAttribute('tabindex', '0');

      // Fix para iOS: prevenir que el teclado se cierre automáticamente
      const handleTouchStart = (e) => {
        // Asegurar que el input reciba el focus SIN forzar scroll
        // El ScrollManager decidirá si debe hacer scroll basado en el estado del usuario
        e.currentTarget.focus({ preventScroll: true });
      };

      // ✅ FIX: Cuando el textarea recibe focus, solo notificar al padre
      // NO hacer scroll automático - el ScrollManager decidirá si debe hacer scroll
      const handleFocus = () => {
        // ✅ Si es invitado sin nickname, mostrar modal al hacer focus
        if (isGuest && onRequestNickname) {
          onRequestNickname();
          textareaRef.current?.blur(); // Quitar focus para evitar teclado
          return;
        }

        // Notificar al padre que el input está enfocado
        onFocus?.(true);

        // ❌ REMOVIDO: scrollIntoView forzado que violaba la regla de no interrumpir lectura de historial
        // El ScrollManager ahora maneja esto correctamente respetando el estado del usuario
      };

      const handleBlur = () => {
        onBlur?.(false);
      };

      textareaRef.current.addEventListener('touchstart', handleTouchStart, { passive: true });
      textareaRef.current.addEventListener('focus', handleFocus);
      textareaRef.current.addEventListener('blur', handleBlur);

      return () => {
        if (textareaRef.current) {
          textareaRef.current.removeEventListener('touchstart', handleTouchStart);
          textareaRef.current.removeEventListener('focus', handleFocus);
          textareaRef.current.removeEventListener('blur', handleBlur);
        }
      };
    }
  }, [onFocus, onBlur, isGuest, onRequestNickname]);

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

  // Guardar borrador automáticamente en localStorage
  useEffect(() => {
    if (roomId && message.trim()) {
      const draftKey = `chat-draft-${roomId}`;
      const timeoutId = setTimeout(() => {
        localStorage.setItem(draftKey, message);
      }, 500); // Debounce de 500ms
      return () => clearTimeout(timeoutId);
    } else if (roomId && !message.trim()) {
      // Limpiar borrador si el mensaje está vacío
      const draftKey = `chat-draft-${roomId}`;
      localStorage.removeItem(draftKey);
    }
  }, [message, roomId]);

  // Restaurar borrador al cargar o cambiar de sala
  useEffect(() => {
    if (roomId) {
      const draftKey = `chat-draft-${roomId}`;
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft && savedDraft.trim()) {
        setMessage(savedDraft);
        // Restaurar altura del textarea después de restaurar el mensaje
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
          }
        }, 0);
      }
    }
  }, [roomId]);

  // Auto-ajustar altura del textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [message]);

  // ⚡ TYPING STATUS: Actualizar cuando el usuario escribe
  useEffect(() => {
    if (!roomId || !user?.id) return;

    // Limpiar timeout anterior
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // 🚀 Solo actualizar typing status si hay usuario
    if (user?.id) {
      if (message.trim()) {
        // Usuario está escribiendo
        updateTypingStatus(roomId, user.id, true);

        // Auto-remover después de 3 segundos sin escribir
        typingTimeoutRef.current = setTimeout(() => {
          updateTypingStatus(roomId, user.id, false);
        }, 3000);
      } else {
        // Mensaje vacío = dejar de escribir
        updateTypingStatus(roomId, user.id, false);
      }
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, roomId, user?.id]);

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

    // ✅ Si es invitado sin nickname, mostrar modal para identificarse
    if (isGuest && onRequestNickname) {
      onRequestNickname();
      return;
    }

    if (message.trim() && !isSending) {
      setIsSending(true);
      checkForSensitiveWords(message);

      // ⚡ INSTANTÁNEO: Feedback inmediato (como WhatsApp/Telegram)
      const messageToSend = message.trim();
      setMessage(''); // Limpiar inmediatamente para sensación de velocidad

      // Limpiar borrador al enviar (no bloquea)
      if (roomId) {
        const draftKey = `chat-draft-${roomId}`;
        localStorage.removeItem(draftKey);
      }

      // ⚡ TYPING STATUS: Dejar de escribir al enviar
      if (roomId && user?.id) {
        updateTypingStatus(roomId, user.id, false);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      }

      // Timeout de seguridad: resetear isSending después de 5 segundos máximo
      const safetyTimeout = setTimeout(() => {
        setIsSending(false);
        console.debug('[ChatInput] Timeout de seguridad: isSending reseteado después de 5s');
      }, 5000);

      try {
        // ⚡ NO AWAIT: Enviar sin bloquear - el mensaje optimista ya se mostró
        onSendMessage(messageToSend, 'text', replyTo).catch(() => {
          // Error manejado en ChatPage
        });
        // Vibración sutil si está disponible
        if (navigator.vibrate) {
          navigator.vibrate(10);
        }
        // Limpiar reply después de enviar exitosamente
        if (replyTo && onCancelReply) {
          onCancelReply();
        }
      } catch (error) {
        // Si falla, restaurar el mensaje
        setMessage(messageToSend);
      } finally {
        clearTimeout(safetyTimeout);
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
     if (!user?.isPremium) {
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

  return (
    <div
      className="bg-card border-t p-3 sm:p-4 shrink-0 relative z-40"
      ref={wrapperRef}
      style={{
        position: 'sticky',
        bottom: 0,
        paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
        marginBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-full right-0 sm:right-4 mb-2 z-10 w-[calc(100vw-2rem)] sm:w-[300px] max-w-[300px]"
          >
            <Suspense fallback={
              <div className="bg-secondary p-4 rounded-lg border border-input w-full h-[280px] sm:h-[350px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                  <p className="text-sm text-muted-foreground">Cargando emojis...</p>
                </div>
              </div>
            }>
              <div className="w-full overflow-hidden rounded-lg border border-input bg-secondary">
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  theme="dark"
                  height={280}
                  width="100%"
                  emojiStyle={EmojiStyle.NATIVE}
                  customEmojis={user?.isPremium ? PREMIUM_EMOJIS : []}
                  categories={emojiPickerCategories}
                  preload={true}
                />
              </div>
            </Suspense>
          </motion.div>
        )}
        {showQuickPhrases && (
             <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-full left-0 sm:left-4 mb-2 z-10 w-[calc(100vw-2rem)] sm:w-64 max-w-[16rem] bg-secondary p-2 rounded-lg shadow-lg border border-input"
            >
                {(user?.quickPhrases && user.quickPhrases.length > 0) ? user.quickPhrases.map((phrase, i) => (
                    <div key={i} onClick={() => handleQuickPhraseClick(phrase)} className="p-2 hover:bg-background rounded cursor-pointer text-sm">{phrase}</div>
                )) : <div className="p-2 text-muted-foreground text-sm text-center">No tienes frases rápidas. Añádelas desde Ajustes.</div>}
            </motion.div>
        )}
      </AnimatePresence>

      {/* 💬 REPLY PREVIEW: Mostrar cuando se está respondiendo a un mensaje */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-2 bg-secondary/50 border-l-4 border-cyan-400 rounded-r-lg p-2 flex items-start gap-2"
          >
            <Reply className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-cyan-400 truncate">
                Respondiendo a {replyTo.username}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {replyTo.content.length > 50
                  ? replyTo.content.substring(0, 50) + '...'
                  : replyTo.content
                }
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0 text-muted-foreground hover:text-foreground"
              onClick={onCancelReply}
              title="Cancelar respuesta"
            >
              <X className="h-3 w-3" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="flex items-end gap-1.5 sm:gap-2 flex-nowrap">
        {/* ✅ Iconos comentados - Más espacio para el input */}
        {/* <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => { setShowQuickPhrases(prev => !prev); setShowEmojiPicker(false);}}
          className="text-muted-foreground hover:text-cyan-400 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
          title="Frases Rápidas"
          disabled={!user.isPremium}
          aria-label="Abrir frases rápidas (Premium)"
          aria-pressed={showQuickPhrases}
        >
            <MessageSquarePlus className="w-5 h-5 sm:w-5 sm:h-5" />
        </Button> */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => { setShowEmojiPicker(prev => !prev); setShowQuickPhrases(false);}}
          className="text-muted-foreground hover:text-cyan-400 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
          title="Selector de Emojis"
          aria-label={showEmojiPicker ? "Cerrar selector de emojis" : "Abrir selector de emojis"}
          aria-pressed={showEmojiPicker}
          aria-expanded={showEmojiPicker}
        >
          {showEmojiPicker ? <X className="w-5 h-5"/> : <Smile className="w-5 h-5" />}
        </Button>

        {/* ✅ Icono de foto comentado - Más espacio para el input */}
        {/* <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => handlePremiumFeature("fotos", "Selector de imágenes")}
          className={`text-muted-foreground hover:text-cyan-400 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 ${!user.isPremium ? 'opacity-50' : ''}`}
          title="Enviar Imagen (Premium)"
          aria-label="Enviar imagen (función Premium)"
        >
          <Image className="w-5 h-5" />
        </Button> */}

        {/* ✅ Icono de audio comentado - Más espacio para el input */}
        {/* <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => handlePremiumFeature("mensajes de voz", "Grabadora de voz")}
          className={`text-muted-foreground hover:text-cyan-400 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 ${!user.isPremium ? 'opacity-50' : ''}`}
          title="Enviar Mensaje de Voz (Premium)"
          aria-label="Enviar mensaje de voz (función Premium)"
        >
          <Mic className="w-5 h-5" />
        </Button> */}

        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            // ✅ Si es invitado sin nickname, mostrar modal al intentar escribir
            if (isGuest && onRequestNickname) {
              onRequestNickname();
              e.preventDefault();
              return;
            }
            // En móvil, Enter envía el mensaje (no hace salto de línea)
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder={isGuest ? "Toca aquí para elegir tu nickname y chatear..." : "Escribe un mensaje..."}
          className="flex-1 bg-secondary border-2 border-input rounded-lg px-3 sm:px-4 py-2.5 sm:py-2 text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:border-accent transition-all min-h-[48px] max-h-[150px] resize-none overflow-y-auto scrollbar-hide"
          aria-label="Campo de texto para escribir mensaje"
          maxLength={500}
          autoComplete="off"
          autoCorrect="on"
          autoCapitalize="sentences"
          spellCheck="true"
          inputMode="text"
          enterKeyHint="send"
          rows={1}
          readOnly={false}
          disabled={false}
          style={{
            lineHeight: '1.5',
            paddingTop: '0.625rem',
            paddingBottom: '0.625rem',
            WebkitUserSelect: 'text',
            userSelect: 'text',
            WebkitTouchCallout: 'default',
            touchAction: 'manipulation'
          }}
        />

        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.1, ease: "easeOut" }}
          className="flex-shrink-0"
        >
          <Button
            type="submit"
            disabled={!message.trim() || isSending}
            className="magenta-gradient text-white rounded-lg relative overflow-hidden min-w-[44px] min-h-[44px] w-[44px] h-[44px] sm:min-w-[48px] sm:min-h-[48px] sm:w-auto sm:h-auto p-0 sm:p-2"
            style={{ transition: 'none' }}
            size="icon"
            aria-label={isSending ? "Enviando mensaje..." : "Enviar mensaje"}
          >
            <motion.div
              animate={isSending ? {
                rotate: 360,
                transition: { duration: 0.6, repeat: Infinity, ease: "linear" }
              } : { rotate: 0 }}
              className="flex items-center justify-center"
            >
              <Send className="w-5 h-5 sm:w-5 sm:h-5" />
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