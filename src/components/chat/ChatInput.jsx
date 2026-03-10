import React, { useState, useRef, useEffect, lazy, Suspense, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Smile, Mic, Image, MessageSquarePlus, X, Reply } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import ComingSoonModal from '@/components/ui/ComingSoonModal';
import { EmojiStyle, Categories } from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/config/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { updateTypingStatus } from '@/services/presenceService';
import { notificationSounds, initAudioOnFirstGesture } from '@/services/notificationSounds';
import { track } from '@/services/eventTrackingService';

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

const RECENT_EMOJIS_STORAGE_KEY = 'chat_recent_emojis_v1';
const DEFAULT_RECENT_EMOJIS = ['😂', '🤣', '😍', '🔥', '😘', '😉', '😈', '😏', '🥵', '🤤', '❤️', '😎'];
const ONBOARDING_ROLE_KEY = 'chactivo:role';
const ONBOARDING_COMUNA_KEY = 'chactivo:comuna';
const ONBOARDING_DISMISSED_KEY = 'chactivo:onboarding:dismissed';
const ONBOARDING_FIRST_MESSAGE_KEY = 'chactivo:onboarding:first_message_sent';
const ONBOARDING_FOCUS_NUDGE_KEY = 'chactivo:onboarding:focus_nudge_shown';
const ONBOARDING_SESSION_START_KEY = 'chactivo:onboarding:session_start_ts';

const ROLE_CHIPS = [
  { value: 'activo', label: 'Soy Activo' },
  { value: 'pasivo', label: 'Soy Pasivo' },
  { value: 'versatil', label: 'Soy Versátil' },
];

const COMUNA_OPTIONS = [
  'Santiago Centro',
  'Providencia',
  'Ñuñoa',
  'La Florida',
  'Maipú',
  'Puente Alto',
  'Las Condes',
  'Independencia',
  'Conchalí',
  'Viña del Mar',
  'Valparaíso',
];

const FIRST_MESSAGE_PROMPTS = [
  '¿Quién de Santiago Centro?',
  'Activo buscando pasivo 👀',
  '¿Alguien despierto a esta hora?',
  '¿Quién tiene lugar?',
];

const PHOTO_MAX_SIZE_BYTES = 140 * 1024;
const PHOTO_HOURLY_LIMIT = 3;
const PHOTO_VISIBLE_LIMIT = 3;


const ChatInput = ({
  onSendMessage,
  onFocus,
  onBlur,
  externalMessage = null,
  roomId = null,
  replyTo = null,
  onCancelReply,
  onRequestNickname,
  isGuest = false,
  showOnboardingHints = false,
  photoUsageStats = { hourlyCount: 0, visibleCount: 0 },
}) => {
  const { user, guestMessageCount } = useAuth();
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isMobileEmojiSheet, setIsMobileEmojiSheet] = useState(() => (
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  ));
  const [recentEmojis, setRecentEmojis] = useState(DEFAULT_RECENT_EMOJIS);
  const [showQuickPhrases, setShowQuickPhrases] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showPhotoTooltip, setShowPhotoTooltip] = useState(false);
  const [showComunaSelector, setShowComunaSelector] = useState(false);
  const [showFocusNudge, setShowFocusNudge] = useState(false);
  const [onboardingDismissed, setOnboardingDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(ONBOARDING_DISMISSED_KEY) === '1';
  });
  const [firstMessageSentInSession, setFirstMessageSentInSession] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(ONBOARDING_FIRST_MESSAGE_KEY) === '1';
  });
  const [selectedRole, setSelectedRole] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(ONBOARDING_ROLE_KEY) || '';
  });
  const [selectedComuna, setSelectedComuna] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(ONBOARDING_COMUNA_KEY) || '';
  });
  const typingTimeoutRef = useRef(null);
  const focusNudgeTimeoutRef = useRef(null);
  const photoInputRef = useRef(null);

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
  const isRegisteredUser = Boolean(user?.id && !user?.isGuest && !user?.isAnonymous);
  const hourlyPhotoCount = Number(photoUsageStats?.hourlyCount || 0);
  const visiblePhotoCount = Number(photoUsageStats?.visibleCount || 0);
  const reachedPhotoHourlyLimit = hourlyPhotoCount >= PHOTO_HOURLY_LIMIT;
  const hasVisiblePhotoLimit = visiblePhotoCount >= PHOTO_VISIBLE_LIMIT;
  const canSendPhotoNow = isRegisteredUser && roomId === 'principal';

  const shouldShowOnboarding = showOnboardingHints && !onboardingDismissed && !firstMessageSentInSession;

  const persistSessionFlag = (key, value = '1') => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(key, value);
  };

  const persistLocalValue = (key, value) => {
    if (typeof window === 'undefined') return;
    if (!value) {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(key, value);
  };

  const trackOnboardingEvent = (eventType, extra = {}) => {
    track(eventType, {
      roomId,
      roomName: roomId,
      ...extra,
    }, { user }).catch(() => {});
  };

  const dismissOnboardingForSession = () => {
    setOnboardingDismissed(true);
    persistSessionFlag(ONBOARDING_DISMISSED_KEY, '1');
    trackOnboardingEvent('onboarding_dismissed');
  };

  const markFirstMessageSent = () => {
    if (firstMessageSentInSession) return;
    setFirstMessageSentInSession(true);
    persistSessionFlag(ONBOARDING_FIRST_MESSAGE_KEY, '1');

    if (typeof window !== 'undefined') {
      const startedAtRaw = sessionStorage.getItem(ONBOARDING_SESSION_START_KEY);
      const startedAt = Number(startedAtRaw);
      const elapsedMs = Number.isFinite(startedAt) && startedAt > 0
        ? Math.max(0, Date.now() - startedAt)
        : null;
      const elapsedSeconds = elapsedMs === null ? null : Math.round(elapsedMs / 1000);

      trackOnboardingEvent('onboarding_first_message_sent', {
        elapsed_ms: elapsedMs,
        elapsed_seconds: elapsedSeconds,
      });
      trackOnboardingEvent('onboarding_time_to_first_message', {
        elapsed_ms: elapsedMs,
        elapsed_seconds: elapsedSeconds,
      });
    } else {
      trackOnboardingEvent('onboarding_first_message_sent');
    }
  };

  const maybeShowFocusNudge = () => {
    if (!showOnboardingHints || firstMessageSentInSession) return;
    if (typeof window !== 'undefined' && sessionStorage.getItem(ONBOARDING_FOCUS_NUDGE_KEY) === '1') {
      return;
    }

    setShowFocusNudge(true);
    persistSessionFlag(ONBOARDING_FOCUS_NUDGE_KEY, '1');
    trackOnboardingEvent('onboarding_nudge_shown');

    if (focusNudgeTimeoutRef.current) {
      clearTimeout(focusNudgeTimeoutRef.current);
    }

    focusNudgeTimeoutRef.current = setTimeout(() => {
      setShowFocusNudge(false);
    }, 4000);
  };

  useEffect(() => {
    if (!showOnboardingHints || typeof window === 'undefined') return;
    if (!sessionStorage.getItem(ONBOARDING_SESSION_START_KEY)) {
      sessionStorage.setItem(ONBOARDING_SESSION_START_KEY, String(Date.now()));
    }
  }, [showOnboardingHints]);

  useEffect(() => {
    return () => {
      if (focusNudgeTimeoutRef.current) {
        clearTimeout(focusNudgeTimeoutRef.current);
      }
    };
  }, []);

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

        // 🔊 Inicializar audio solo con gesto real del usuario
        initAudioOnFirstGesture();
        notificationSounds.init();

        // Notificar al padre que el input está enfocado
        onFocus?.(true);
        maybeShowFocusNudge();

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
  }, [onFocus, onBlur, isGuest, onRequestNickname, showOnboardingHints, firstMessageSentInSession]);

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

  // Cerrar selector con Escape
  useEffect(() => {
    if (!showEmojiPicker) return;
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowEmojiPicker(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showEmojiPicker]);

  // Detectar viewport para usar sheet en móvil
  useEffect(() => {
    const handleResize = () => {
      setIsMobileEmojiSheet(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Restaurar emojis recientes del usuario
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_EMOJIS_STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed) || parsed.length === 0) return;
      const cleaned = parsed.filter((item) => typeof item === 'string' && item.trim()).slice(0, 16);
      if (cleaned.length > 0) {
        setRecentEmojis(cleaned);
      }
    } catch (error) {
      console.debug('[ChatInput] No se pudieron restaurar emojis recientes:', error);
    }
  }, []);

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
      markFirstMessageSent();
      setShowFocusNudge(false);
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

  const registerRecentEmoji = (emoji) => {
    if (!emoji) return;
    setRecentEmojis((previous) => {
      const next = [emoji, ...previous.filter((item) => item !== emoji)].slice(0, 16);
      try {
        localStorage.setItem(RECENT_EMOJIS_STORAGE_KEY, JSON.stringify(next));
      } catch (error) {
        console.debug('[ChatInput] No se pudieron guardar emojis recientes:', error);
      }
      return next;
    });
  };

  const handleEmojiClick = (emojiObject) => {
    const emoji = emojiObject?.emoji;
    if (!emoji) return;
    setMessage((prevMessage) => prevMessage + emoji);
    registerRecentEmoji(emoji);
    textareaRef.current?.focus({ preventScroll: true });
  };

  const handleQuickEmojiClick = (emoji) => {
    setMessage((prevMessage) => prevMessage + emoji);
    registerRecentEmoji(emoji);
    textareaRef.current?.focus({ preventScroll: true });
  };
  
  const handleQuickPhraseClick = (phrase) => {
    setMessage(phrase);
    textareaRef.current?.focus({ preventScroll: true });
    setShowQuickPhrases(false);
  }

  const handleRoleSelect = (roleValue) => {
    setSelectedRole(roleValue);
    persistLocalValue(ONBOARDING_ROLE_KEY, roleValue);
    trackOnboardingEvent('onboarding_chip_click', {
      chip_type: 'role',
      chip_value: roleValue,
    });
  };

  const handleComunaSelect = (comunaValue) => {
    setSelectedComuna(comunaValue);
    persistLocalValue(ONBOARDING_COMUNA_KEY, comunaValue);
    trackOnboardingEvent('onboarding_chip_click', {
      chip_type: 'comuna',
      chip_value: comunaValue || 'none',
    });
  };

  const handlePromptClick = (prompt) => {
    setMessage(prompt);
    textareaRef.current?.focus({ preventScroll: true });
    trackOnboardingEvent('onboarding_prompt_click', {
      prompt_text: prompt,
    });
  };

  const handleMessageChange = (event) => {
    const nextMessage = event.target.value;
    setMessage(nextMessage);
    if (!onboardingDismissed && nextMessage.trim().length > 0) {
      dismissOnboardingForSession();
    }
  };

  const buildPhotoBlockedDescription = () => {
    if (!isRegisteredUser) {
      return 'Debes iniciar sesión para subir fotos.';
    }
    if (roomId !== 'principal') {
      return 'Las fotos solo están habilitadas en la sala Principal.';
    }
    if (reachedPhotoHourlyLimit) {
      return 'Ya usaste tus 3 fotos de la última hora. Intenta nuevamente en unos minutos.';
    }
    return '';
  };

  const getPhotoTooltipText = () => {
    if (canSendPhotoNow) {
      if (reachedPhotoHourlyLimit) {
        return 'Límite alcanzado: 3/3 fotos en la última hora.';
      }
      if (hasVisiblePhotoLimit) {
        return 'Tienes 3 fotos visibles. La próxima reemplazará la más antigua.';
      }
      return isUploadingPhoto ? 'Subiendo foto...' : 'Subir foto';
    }
    return buildPhotoBlockedDescription();
  };

  const showPhotoBlockedToast = () => {
    toast({
      title: !isRegisteredUser ? 'Debes iniciar sesión' : 'Límite de fotos',
      description: buildPhotoBlockedDescription(),
      duration: 4500,
    });
  };

  const getImageExtension = (contentType = '') => {
    if (contentType.includes('png')) return 'png';
    if (contentType.includes('webp')) return 'webp';
    if (contentType.includes('heic')) return 'heic';
    if (contentType.includes('heif')) return 'heif';
    return 'jpg';
  };

  const compressImageForChat = async (file) => {
    const compressionOptions = {
      maxSizeMB: 0.14,
      maxWidthOrHeight: 960,
      useWebWorker: true,
      initialQuality: 0.68,
    };

    const compressed = await imageCompression(file, compressionOptions);
    if (compressed.size > PHOTO_MAX_SIZE_BYTES) {
      throw new Error('La imagen supera 140 KB tras compresión. Prueba otra imagen o recórtala antes de subir.');
    }
    return compressed;
  };

  const handlePhotoFileSelected = async (event) => {
    const selectedFile = event.target.files?.[0];
    event.target.value = '';

    if (!selectedFile) return;
    if (!canSendPhotoNow) {
      showPhotoBlockedToast();
      return;
    }
    if (reachedPhotoHourlyLimit) {
      showPhotoBlockedToast();
      return;
    }
    if (!selectedFile.type?.startsWith('image/')) {
      toast({
        title: 'Archivo no permitido',
        description: 'Solo se permiten archivos de imagen.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const optimizedFile = await compressImageForChat(selectedFile);
      const tempMessageId = (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
        ? crypto.randomUUID()
        : `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const assetId = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const extension = getImageExtension(optimizedFile.type);
      const mediaPath = `chat_media/${roomId || 'principal'}/${tempMessageId}/${assetId}.${extension}`;

      const fileRef = storageRef(storage, mediaPath);
      await uploadBytes(fileRef, optimizedFile, {
        contentType: optimizedFile.type,
        customMetadata: {
          roomId: roomId || 'principal',
          userId: user?.id || '',
          feature: 'chat_photo_access',
        },
      });

      const downloadURL = await getDownloadURL(fileRef);

      await onSendMessage(downloadURL, 'image', replyTo, {
        media: [
          {
            kind: 'image',
            path: mediaPath,
            contentType: optimizedFile.type,
            sizeBytes: optimizedFile.size,
          },
        ],
      });

      toast({
        title: 'Foto publicada',
        description: 'Mientras más chateas, más aumentará tu cupo y desbloquearás beneficios prioritarios.',
        duration: 4200,
      });
    } catch (error) {
      toast({
        title: 'No se pudo subir la foto',
        description: error?.message || 'Reintenta en unos segundos.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingPhoto(false);
      setShowPhotoTooltip(false);
    }
  };

  const handlePhotoButtonClick = () => {
    if (isUploadingPhoto) return;
    if (!canSendPhotoNow) {
      showPhotoBlockedToast();
      return;
    }
    if (reachedPhotoHourlyLimit) {
      showPhotoBlockedToast();
      return;
    }
    if (hasVisiblePhotoLimit) {
      toast({
        title: 'Límite visual alcanzado',
        description: 'Ahora mismo tienes 3 fotos visibles. Si publicas otra, se reemplazará automáticamente la más antigua.',
        duration: 4200,
      });
    }
    photoInputRef.current?.click();
  };

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
          <>
            {isMobileEmojiSheet && (
              <motion.button
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[70] bg-black/45 backdrop-blur-[1px]"
                onClick={() => setShowEmojiPicker(false)}
                aria-label="Cerrar selector de emojis"
              />
            )}

            <motion.div
              initial={{ opacity: 0, y: isMobileEmojiSheet ? 24 : 12, scale: isMobileEmojiSheet ? 1 : 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: isMobileEmojiSheet ? 24 : 12, scale: isMobileEmojiSheet ? 1 : 0.98 }}
              transition={{ type: 'spring', stiffness: 360, damping: 28 }}
              drag={isMobileEmojiSheet ? 'y' : false}
              dragDirectionLock={isMobileEmojiSheet}
              dragElastic={isMobileEmojiSheet ? 0.16 : 0}
              dragConstraints={isMobileEmojiSheet ? { top: 0, bottom: 140 } : undefined}
              onDragEnd={(_, info) => {
                if (isMobileEmojiSheet && info.offset.y > 85) {
                  setShowEmojiPicker(false);
                }
              }}
              className={
                isMobileEmojiSheet
                  ? 'absolute bottom-full left-0 right-0 mb-2 z-[80]'
                  : 'absolute bottom-full left-0 sm:left-4 mb-3 z-20 w-[min(380px,calc(100vw-1.5rem))]'
              }
            >
              <Suspense fallback={
                <div className="bg-card/95 backdrop-blur-xl p-4 rounded-2xl border border-input/80 w-full h-[360px] flex items-center justify-center shadow-2xl">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                    <p className="text-sm text-muted-foreground">Cargando emojis...</p>
                  </div>
                </div>
              }>
                <div
                  className="w-full overflow-hidden rounded-2xl border border-input/80 bg-card/95 backdrop-blur-xl shadow-2xl"
                  style={isMobileEmojiSheet ? { paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' } : undefined}
                >
                  {isMobileEmojiSheet && (
                    <div className="flex justify-center pt-2">
                      <span className="h-1 w-10 rounded-full bg-muted-foreground/40" />
                    </div>
                  )}

                  <div className="px-3 pt-3 pb-2 border-b border-border/70 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Emojis</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowEmojiPicker(false)}
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      aria-label="Cerrar selector de emojis"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="px-3 pt-2 pb-2 border-b border-border/60">
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                      {recentEmojis.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleQuickEmojiClick(emoji)}
                          className="h-8 min-w-[2rem] px-2 inline-flex items-center justify-center rounded-full bg-secondary/70 hover:bg-secondary text-base transition-colors"
                          aria-label={`Agregar emoji ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={isMobileEmojiSheet ? 'h-[40vh] min-h-[240px] max-h-[340px]' : 'h-[380px]'}>
                    <EmojiPicker
                      onEmojiClick={handleEmojiClick}
                      theme="dark"
                      height="100%"
                      width="100%"
                      emojiStyle={EmojiStyle.NATIVE}
                      customEmojis={user?.isPremium ? PREMIUM_EMOJIS : []}
                      categories={emojiPickerCategories}
                      preload={true}
                      lazyLoadEmojis={true}
                      autoFocusSearch={false}
                      skinTonesDisabled={true}
                      searchPlaceHolder="Buscar emoji"
                      previewConfig={{ showPreview: false }}
                      className="chactivo-emoji-picker"
                    />
                  </div>
                </div>
              </Suspense>
            </motion.div>
          </>
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

      {shouldShowOnboarding && (
        <div className="mb-3 space-y-2">
          <div className="rounded-xl border border-input/70 bg-secondary/35 px-3 py-2">
            <div className="flex flex-wrap items-center gap-2">
              {ROLE_CHIPS.map((chip) => (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => handleRoleSelect(chip.value)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                    selectedRole === chip.value
                      ? 'border-cyan-400/80 bg-cyan-500/15 text-cyan-200'
                      : 'border-gray-600/60 bg-gray-700/40 text-gray-200 hover:border-gray-500/80 hover:bg-gray-700/60'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowComunaSelector((prev) => !prev)}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                  showComunaSelector || selectedComuna
                    ? 'border-purple-400/80 bg-purple-500/15 text-purple-200'
                    : 'border-gray-600/60 bg-gray-700/40 text-gray-200 hover:border-gray-500/80 hover:bg-gray-700/60'
                }`}
              >
                Agregar comuna
              </button>
              <button
                type="button"
                onClick={dismissOnboardingForSession}
                className="ml-auto rounded-full border border-transparent px-2 py-1 text-[11px] text-muted-foreground hover:border-input hover:text-foreground transition-colors"
              >
                Omitir
              </button>
            </div>

            {showComunaSelector && (
              <div className="mt-2">
                <select
                  value={selectedComuna}
                  onChange={(event) => handleComunaSelect(event.target.value)}
                  className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
                >
                  <option value="">Selecciona comuna</option>
                  {COMUNA_OPTIONS.map((comuna) => (
                    <option key={comuna} value={comuna}>
                      {comuna}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide px-0.5">
            {FIRST_MESSAGE_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handlePromptClick(prompt)}
                className="shrink-0 rounded-full border border-gray-600/60 bg-gray-700/45 px-3 py-1.5 text-xs font-medium text-gray-100 transition-colors hover:border-gray-500/70 hover:bg-gray-700/65"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

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

      <AnimatePresence>
        {showFocusNudge && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mb-2 rounded-lg border border-cyan-500/25 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100"
          >
            Tip: Si indicas tu comuna o rol, te responden más rápido.
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
          className={`min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 transition-colors ${
            showEmojiPicker
              ? 'text-cyan-300 bg-cyan-500/10 hover:text-cyan-200 hover:bg-cyan-500/15'
              : 'text-muted-foreground hover:text-cyan-400'
          }`}
          title="Selector de Emojis"
          aria-label={showEmojiPicker ? "Cerrar selector de emojis" : "Abrir selector de emojis"}
          aria-pressed={showEmojiPicker}
          aria-expanded={showEmojiPicker}
        >
          {showEmojiPicker ? <X className="w-5 h-5"/> : <Smile className="w-5 h-5" />}
        </Button>

        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handlePhotoButtonClick}
            onMouseEnter={() => setShowPhotoTooltip(true)}
            onMouseLeave={() => setShowPhotoTooltip(false)}
            onFocus={() => setShowPhotoTooltip(true)}
            onBlur={() => setShowPhotoTooltip(false)}
            className={`min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 transition-colors ${
              canSendPhotoNow && !reachedPhotoHourlyLimit
                ? 'text-muted-foreground hover:text-cyan-400'
                : 'text-muted-foreground/80 hover:text-cyan-300'
            } ${isUploadingPhoto ? 'opacity-70' : ''}`}
            title={getPhotoTooltipText()}
            aria-label="Subir imagen al chat"
            aria-busy={isUploadingPhoto}
          >
            <Image className={`w-5 h-5 ${isUploadingPhoto ? 'animate-pulse' : ''}`} />
          </Button>

          {showPhotoTooltip && (
            <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-56 -translate-x-1/2 rounded-md border border-input bg-card/95 px-2 py-1 text-[11px] text-muted-foreground shadow-lg">
              {getPhotoTooltipText()}
            </div>
          )}
        </div>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
          className="hidden"
          onChange={handlePhotoFileSelected}
        />

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
          onChange={handleMessageChange}
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
