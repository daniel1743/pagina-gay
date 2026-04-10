import React, { useState, useRef, useEffect, lazy, Suspense, useMemo, useCallback } from 'react';
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
import { updatePresenceFields, updateTypingStatus } from '@/services/presenceService';
import { notificationSounds, initAudioOnFirstGesture } from '@/services/notificationSounds';
import { track } from '@/services/eventTrackingService';
import { COMUNA_OPTIONS, ONBOARDING_COMUNA_KEY, normalizeComuna } from '@/config/comunas';

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
const ONBOARDING_DISMISSED_KEY = 'chactivo:onboarding:dismissed';
const ONBOARDING_FIRST_MESSAGE_KEY = 'chactivo:onboarding:first_message_sent';
const ONBOARDING_FOCUS_NUDGE_KEY = 'chactivo:onboarding:focus_nudge_shown';
const ONBOARDING_SESSION_START_KEY = 'chactivo:onboarding:session_start_ts';
const COMPOSER_GUIDANCE_AUTO_HIDE_MS = 6000;

const ROLE_CHIPS = [
  { value: 'activo', label: 'Soy Activo' },
  { value: 'pasivo', label: 'Soy Pasivo' },
  { value: 'versatil', label: 'Soy Versátil' },
];

const ONBOARDING_MESSAGE_TEMPLATES = [
  {
    key: 'activo-mobile',
    label: 'Activo y me muevo',
    message: 'Activo en Maipú, me muevo, busco pasivo ahora',
  },
  {
    key: 'pasivo-place',
    label: 'Pasivo con lugar',
    message: 'Pasivo en Santiago Centro, tengo lugar, busco activo ahora',
  },
  {
    key: 'versatil-now',
    label: 'Versátil disponible',
    message: 'Versátil en La Florida, sin lugar, me muevo ahora',
  },
];

const STRUCTURED_COMPOSER_CHIPS = [
  {
    key: 'place',
    label: 'Tengo lugar',
    snippet: 'tengo lugar',
    group: 'place_status',
  },
  {
    key: 'no-place',
    label: 'Sin lugar',
    snippet: 'sin lugar',
    group: 'place_status',
  },
  {
    key: 'move',
    label: 'Me muevo',
    snippet: 'me muevo',
  },
  {
    key: 'now',
    label: 'Ahora',
    snippet: 'ahora',
  },
];

const ROLE_LABEL_BY_VALUE = {
  activo: 'Activo',
  pasivo: 'Pasivo',
  versatil: 'Versatil',
};

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
  isHeteroContext = false,
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
    return normalizeComuna(localStorage.getItem(ONBOARDING_COMUNA_KEY) || '') || '';
  });
  const typingTimeoutRef = useRef(null);
  const focusNudgeTimeoutRef = useRef(null);
  const composerGuidanceTimeoutRef = useRef(null);
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

  const shouldShowComposerGuidance = !isHeteroContext && showOnboardingHints && !onboardingDismissed && !firstMessageSentInSession;
  const shouldShowOnboarding = shouldShowComposerGuidance;
  const composerPlaceholder = useMemo(() => {
    if (isGuest) return 'Toca aquí para elegir tu nickname y chatear...';
    if (replyTo?.username) return `Responde con contexto a ${replyTo.username}...`;
    if (!isHeteroContext && showOnboardingHints && !firstMessageSentInSession) {
      if (selectedRole && selectedComuna) {
        return `Di qué buscas. Ej: ${selectedRole} en ${selectedComuna}, tengo lugar o me muevo`;
      }
      if (selectedRole) {
        return `Di qué buscas. Ej: ${selectedRole}, tengo lugar, busco ahora`;
      }
      return 'Di rol + comuna + si tienes lugar o te mueves';
    }
    return 'Di qué buscas, tu comuna y si tienes lugar o te mueves...';
  }, [
    firstMessageSentInSession,
    isGuest,
    isHeteroContext,
    replyTo?.username,
    selectedComuna,
    selectedRole,
    showOnboardingHints,
  ]);

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

  const dismissOnboardingForSession = (reason = 'manual') => {
    setOnboardingDismissed(true);
    persistSessionFlag(ONBOARDING_DISMISSED_KEY, '1');
    trackOnboardingEvent('onboarding_dismissed', { reason });
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
    if (isHeteroContext || !showOnboardingHints || firstMessageSentInSession) return;
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
  }, [showOnboardingHints, isHeteroContext]);

  useEffect(() => {
    return () => {
      if (focusNudgeTimeoutRef.current) {
        clearTimeout(focusNudgeTimeoutRef.current);
      }
      if (composerGuidanceTimeoutRef.current) {
        clearTimeout(composerGuidanceTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!shouldShowComposerGuidance || showEmojiPicker || showQuickPhrases || showComunaSelector) {
      if (composerGuidanceTimeoutRef.current) {
        clearTimeout(composerGuidanceTimeoutRef.current);
        composerGuidanceTimeoutRef.current = null;
      }
      return;
    }

    composerGuidanceTimeoutRef.current = setTimeout(() => {
      dismissOnboardingForSession('timeout');
    }, COMPOSER_GUIDANCE_AUTO_HIDE_MS);

    return () => {
      if (composerGuidanceTimeoutRef.current) {
        clearTimeout(composerGuidanceTimeoutRef.current);
        composerGuidanceTimeoutRef.current = null;
      }
    };
  }, [
    shouldShowComposerGuidance,
    showEmojiPicker,
    showQuickPhrases,
    showComunaSelector,
  ]);

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
  }, [onFocus, onBlur, isGuest, onRequestNickname, showOnboardingHints, firstMessageSentInSession, isHeteroContext]);

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

  const handleOnboardingTemplateClick = (templateMessage) => {
    setMessage(templateMessage);
    textareaRef.current?.focus({ preventScroll: true });
    dismissOnboardingForSession('template_selected');
    trackOnboardingEvent('onboarding_template_click', {
      template_message: templateMessage,
    });
  };

  const handleRoleSelect = (roleValue) => {
    setSelectedRole(roleValue);
    persistLocalValue(ONBOARDING_ROLE_KEY, roleValue);
    dismissOnboardingForSession('role_selected');
    trackOnboardingEvent('onboarding_chip_click', {
      chip_type: 'role',
      chip_value: roleValue,
    });
  };

  const handleComunaSelect = (comunaValue) => {
    const normalizedComuna = normalizeComuna(comunaValue);
    setSelectedComuna(normalizedComuna);
    persistLocalValue(ONBOARDING_COMUNA_KEY, normalizedComuna);
    dismissOnboardingForSession('comuna_selected');
    if (roomId && user?.id) {
      updatePresenceFields(roomId, {
        comuna: normalizedComuna || null,
      }).catch(() => {});
    }
    trackOnboardingEvent('onboarding_chip_click', {
      chip_type: 'comuna',
      chip_value: normalizedComuna || 'none',
    });
  };

  const handleMessageChange = (event) => {
    const nextMessage = event.target.value;
    setMessage(nextMessage);
    if (!onboardingDismissed && nextMessage.trim().length > 0) {
      dismissOnboardingForSession();
    }
  };

  const normalizeComposerMessage = (value = '') => (
    String(value || '')
      .replace(/\s+/g, ' ')
      .replace(/\s*,\s*/g, ', ')
      .replace(/,\s*,+/g, ', ')
      .replace(/^,\s*|\s*,\s*$/g, '')
      .trim()
  );

  const getStructuredComposerSegments = (value = '') => (
    normalizeComposerMessage(value)
      .split(',')
      .map((segment) => segment.trim())
      .filter(Boolean)
  );

  const buildStructuredComposerSeed = useCallback((chipSnippet) => {
    const parts = [];
    const roleLabel = ROLE_LABEL_BY_VALUE[selectedRole] || '';

    if (roleLabel && selectedComuna) {
      parts.push(`${roleLabel} en ${selectedComuna}`);
    } else if (roleLabel) {
      parts.push(roleLabel);
    } else if (selectedComuna) {
      parts.push(`En ${selectedComuna}`);
    }

    if (chipSnippet) {
      parts.push(chipSnippet);
    }

    return normalizeComposerMessage(parts.join(', '));
  }, [selectedComuna, selectedRole]);

  const activeStructuredComposerChips = useMemo(() => {
    const segments = new Set(
      getStructuredComposerSegments(message).map((segment) => segment.toLowerCase())
    );

    return STRUCTURED_COMPOSER_CHIPS.reduce((accumulator, chip) => {
      accumulator[chip.key] = segments.has(chip.snippet);
      return accumulator;
    }, {});
  }, [message]);

  const handleStructuredComposerChip = useCallback((chip) => {
    setMessage((previousMessage) => {
      const currentSegments = getStructuredComposerSegments(previousMessage);
      const normalizedSnippet = chip.snippet.toLowerCase();
      const hasSnippet = currentSegments.some((segment) => segment.toLowerCase() === normalizedSnippet);
      const conflictingSnippets = STRUCTURED_COMPOSER_CHIPS
        .filter((item) => item.group && item.group === chip.group && item.key !== chip.key)
        .map((item) => item.snippet.toLowerCase());

      const nextSegments = hasSnippet
        ? currentSegments.filter((segment) => segment.toLowerCase() !== normalizedSnippet)
        : [
            ...currentSegments.filter((segment) => !conflictingSnippets.includes(segment.toLowerCase())),
            chip.snippet,
          ];

      const nextMessage = nextSegments.length > 0
        ? normalizeComposerMessage(nextSegments.join(', '))
        : buildStructuredComposerSeed('');

      if (!previousMessage.trim() && !hasSnippet) {
        return buildStructuredComposerSeed(chip.snippet);
      }

      return nextMessage;
    });

    textareaRef.current?.focus({ preventScroll: true });
    dismissOnboardingForSession('structured_chip_selected');
    trackOnboardingEvent('onboarding_chip_click', {
      chip_type: 'composer_structure',
      chip_value: chip.key,
      chip_active: !activeStructuredComposerChips[chip.key],
    });
  }, [activeStructuredComposerChips, buildStructuredComposerSeed]);

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
      const mediaPath = `chat_media/rooms/${user?.id || 'unknown'}/${roomId || 'principal'}/${tempMessageId}/${assetId}.${extension}`;

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
      className="bg-[var(--chat-bottom-surface)] backdrop-blur-xl border-t border-[var(--chat-divider)] px-3 py-2 sm:px-4 sm:py-2.5 shrink-0 relative z-40"
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

      {shouldShowOnboarding && (
        <div className="mb-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-cyan-300/90">
            Cómo hablar aquí
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Funciona mejor si dices tu rol, tu comuna y si tienes lugar o te mueves.
          </p>
          <p className="mt-1 text-xs text-foreground/90">
            Ejemplo: <span className="font-medium text-cyan-100">Activo en Maipú, me muevo, busco pasivo ahora</span>
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {ROLE_CHIPS.map((chip) => (
              <button
                key={chip.value}
                type="button"
                onClick={() => handleRoleSelect(chip.value)}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  selectedRole === chip.value
                    ? 'border-cyan-400/40 bg-cyan-500/15 text-cyan-100'
                    : 'border-white/10 bg-white/5 text-muted-foreground hover:border-cyan-500/20 hover:text-cyan-100'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            {ONBOARDING_MESSAGE_TEMPLATES.map((template) => (
              <button
                key={template.key}
                type="button"
                onClick={() => handleOnboardingTemplateClick(template.message)}
                className="rounded-full border border-fuchsia-500/20 bg-fuchsia-500/10 px-2.5 py-1 text-[11px] font-medium text-fuchsia-100 transition-colors hover:bg-fuchsia-500/15"
              >
                {template.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showFocusNudge && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mb-2 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-700 dark:text-cyan-100"
          >
            Tip: di rol + comuna + si tienes lugar o te mueves. Eso recibe más respuesta que solo “hola”.
          </motion.div>
        )}
      </AnimatePresence>

      {shouldShowComposerGuidance && (
        <div className="mb-2 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium text-muted-foreground">
              Completa rápido:
            </span>
            {STRUCTURED_COMPOSER_CHIPS.map((chip) => {
              const isActive = Boolean(activeStructuredComposerChips[chip.key]);
              return (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => handleStructuredComposerChip(chip)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    isActive
                      ? 'border-cyan-400/40 bg-cyan-500/15 text-cyan-100'
                      : 'border-white/10 bg-white/5 text-muted-foreground hover:border-cyan-500/20 hover:text-cyan-100'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setShowComunaSelector((prev) => !prev)}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                showComunaSelector || selectedComuna
                  ? 'border-fuchsia-400/35 bg-fuchsia-500/12 text-fuchsia-100'
                  : 'border-white/10 bg-white/5 text-muted-foreground hover:border-fuchsia-500/20 hover:text-fuchsia-100'
              }`}
            >
              {selectedComuna ? `Comuna: ${selectedComuna}` : 'Elegir comuna'}
            </button>
          </div>

          {showComunaSelector && (
            <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-fuchsia-200/90">
                  Tu comuna o ciudad
                </p>
                {selectedComuna ? (
                  <button
                    type="button"
                    onClick={() => handleComunaSelect('')}
                    className="text-[11px] font-medium text-muted-foreground hover:text-fuchsia-100"
                  >
                    Limpiar
                  </button>
                ) : null}
              </div>

              <div className="mt-2">
                <select
                  value={selectedComuna || ''}
                  onChange={(event) => {
                    handleComunaSelect(event.target.value);
                    setShowComunaSelector(false);
                  }}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-fuchsia-400/40"
                >
                  <option value="">Selecciona tu comuna o ciudad</option>
                  {COMUNA_OPTIONS.map((comunaOption) => (
                    <option key={comunaOption} value={comunaOption}>
                      {comunaOption}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes composer-marquee {
          0%, 12% { transform: translateX(0); }
          88%, 100% { transform: translateX(calc(-50% - 0.75rem)); }
        }
      `}</style>

      <form
        onSubmit={handleSubmit}
        className="flex min-h-[48px] items-end gap-1.5 sm:gap-2 flex-nowrap rounded-[26px] border border-[var(--chat-divider)] bg-[var(--chat-composer-surface)] px-2 py-1"
      >
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
          className={`min-w-[40px] min-h-[40px] h-[40px] w-[40px] rounded-full border border-transparent sm:min-w-0 sm:min-h-0 transition-colors ${
            showEmojiPicker
              ? 'text-cyan-300 border-cyan-500/20 bg-cyan-500/10 hover:text-cyan-200 hover:bg-cyan-500/15'
              : 'text-muted-foreground hover:text-cyan-400 hover:bg-black/5 dark:hover:bg-white/5'
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
            className={`min-w-[40px] min-h-[40px] h-[40px] w-[40px] rounded-full border border-transparent sm:min-w-0 sm:min-h-0 transition-colors ${
              canSendPhotoNow && !reachedPhotoHourlyLimit
                ? 'text-muted-foreground hover:text-cyan-400 hover:bg-black/5 dark:hover:bg-white/5'
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

        <div className="relative flex-1 min-w-0 self-center">
          {!message.trim() && (
            <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center overflow-hidden px-1.5 sm:px-2">
              <div className="inline-flex min-w-max items-center gap-3 text-[15px] font-medium leading-5 text-muted-foreground/90 animate-[composer-marquee_18s_linear_infinite]">
                <span className="whitespace-nowrap">{composerPlaceholder}</span>
                <span className="whitespace-nowrap" aria-hidden="true">{composerPlaceholder}</span>
              </div>
            </div>
          )}

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
            placeholder=""
            className="flex-1 w-full bg-transparent border-none rounded-[24px] px-1.5 sm:px-2 py-[10px] text-[15px] font-medium leading-5 text-foreground focus:outline-none transition-all min-h-[24px] max-h-[140px] resize-none overflow-y-auto scrollbar-hide"
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
              lineHeight: '1.25rem',
              paddingTop: '0.625rem',
              paddingBottom: '0.625rem',
              WebkitUserSelect: 'text',
              userSelect: 'text',
              WebkitTouchCallout: 'default',
              touchAction: 'manipulation'
            }}
          />
        </div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.1, ease: "easeOut" }}
          className="flex-shrink-0"
        >
          <Button
            type="submit"
            disabled={!message.trim() || isSending}
            className="magenta-gradient text-white rounded-full relative overflow-hidden min-w-[40px] min-h-[40px] w-[40px] h-[40px] p-0"
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
