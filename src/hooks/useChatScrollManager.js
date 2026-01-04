import { useRef, useEffect, useState, useCallback } from 'react';

/**
 * 🎯 PRO CHAT SCROLL MANAGER
 *
 * Discord/Slack-inspired scroll behavior with:
 * - Smart auto-scroll (only when at bottom)
 * - Pause detection (typing, selecting, scrolling up)
 * - New messages indicator
 * - Anchor stability (no viewport jumps)
 * - Debounced updates
 * - Soft rejoin after inactivity
 *
 * @param {Object} params
 * @param {Array} params.messages - Message array
 * @param {string} params.currentUserId - Current user ID
 * @param {boolean} params.isInputFocused - Whether input is focused
 * @returns {Object} Scroll manager state and methods
 */
export const useChatScrollManager = ({ messages, currentUserId, isInputFocused }) => {
  // 🔇 Logs desactivados para reducir ruido en consola
  // console.log('🎣 [SCROLL MANAGER] Inicializando hook:', {
  //   messagesCount: messages?.length || 0,
  //   currentUserId: currentUserId || 'null',
  //   isInputFocused: isInputFocused || false
  // });

  // ========================================
  // REFS
  // ========================================
  const containerRef = useRef(null);
  const endMarkerRef = useRef(null);
  const lastUserInteractionRef = useRef(Date.now());
  const scrollUpdateTimeoutRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const topAnchorMessageIdRef = useRef(null);
  const topAnchorOffsetRef = useRef(0);
  const lastScrollTopRef = useRef(0); // Para detectar dirección de scroll
  const scrollDirectionRef = useRef('down'); // 'up' | 'down'

  // ========================================
  // STATE
  // ========================================
  const [scrollState, setScrollState] = useState('AUTO_FOLLOW'); // AUTO_FOLLOW | PAUSED_USER | PAUSED_INPUT | PAUSED_SELECTION
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTextSelected, setIsTextSelected] = useState(false);

  // ========================================
  // CONSTANTS
  // ========================================
  const THRESHOLD_AT_BOTTOM = 100; // px from bottom to consider "at bottom" (WhatsApp-style)
  const THRESHOLD_REJOIN = 300; // px from bottom to auto-rejoin (más generoso)
  const INACTIVITY_TIMEOUT = 5000; // ms before attempting soft rejoin (5 segundos como WhatsApp)
  const DEBOUNCE_SCROLL = 100; // ms debounce for scroll updates (más rápido)
  const SCROLL_DIRECTION_THRESHOLD = 10; // px para detectar dirección de scroll

  // ========================================
  // UTILITY: Check if at bottom
  // ========================================
  const isAtBottom = useCallback((threshold = THRESHOLD_AT_BOTTOM) => {
    const container = containerRef.current;
    if (!container) return false;

    const scrollBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    return scrollBottom <= threshold;
  }, []);

  // ========================================
  // UTILITY: Record user interaction
  // ========================================
  const recordInteraction = useCallback(() => {
    lastUserInteractionRef.current = Date.now();
  }, []);

  // ========================================
  // SCROLL TO BOTTOM (smooth or instant)
  // ========================================
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    if (endMarkerRef.current) {
      endMarkerRef.current.scrollIntoView({ behavior, block: 'end' });
    }
  }, []);

  // ========================================
  // HANDLE: Scroll to bottom from indicator
  // ========================================
  const handleScrollToBottomClick = useCallback(() => {
    scrollToBottom('smooth');
    setUnreadCount(0);
    setScrollState('AUTO_FOLLOW');
    recordInteraction();
  }, [scrollToBottom, recordInteraction]);

  // ========================================
  // ANCHOR: Capture top visible message
  // ========================================
  const captureTopAnchor = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const messages = container.querySelectorAll('[data-message-id]');

    for (const msgEl of messages) {
      const rect = msgEl.getBoundingClientRect();
      if (rect.top >= containerRect.top && rect.top <= containerRect.bottom) {
        topAnchorMessageIdRef.current = msgEl.dataset.messageId;
        topAnchorOffsetRef.current = rect.top - containerRect.top;
        return;
      }
    }
  }, []);

  // ========================================
  // ANCHOR: Restore scroll position
  // ========================================
  const restoreTopAnchor = useCallback(() => {
    const container = containerRef.current;
    if (!container || !topAnchorMessageIdRef.current) return;

    const anchorEl = container.querySelector(`[data-message-id="${topAnchorMessageIdRef.current}"]`);
    if (anchorEl) {
      const containerRect = container.getBoundingClientRect();
      const anchorRect = anchorEl.getBoundingClientRect();
      const currentOffset = anchorRect.top - containerRect.top;
      const drift = currentOffset - topAnchorOffsetRef.current;

      if (Math.abs(drift) > 5) {
        container.scrollTop -= drift;
      }
    }
  }, []);

  // ========================================
  // DETECT: Text selection
  // ========================================
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      const hasSelection = selection && selection.toString().length > 0;
      setIsTextSelected(hasSelection);

      if (hasSelection) {
        setScrollState((prev) => prev === 'AUTO_FOLLOW' ? 'PAUSED_SELECTION' : prev);
        recordInteraction();
      } else if (scrollState === 'PAUSED_SELECTION') {
        // Clear selection pause, but don't auto-resume yet
        setScrollState('PAUSED_USER');
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [scrollState, recordInteraction]);

  // ========================================
  // HANDLE: Scroll event (with debounce) - WhatsApp/Instagram style
  // ========================================
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      recordInteraction();

      // ⚡ DETECTAR DIRECCIÓN DE SCROLL (WhatsApp-style)
      const currentScrollTop = container.scrollTop;
      const scrollDiff = currentScrollTop - lastScrollTopRef.current;
      
      if (Math.abs(scrollDiff) > SCROLL_DIRECTION_THRESHOLD) {
        scrollDirectionRef.current = scrollDiff > 0 ? 'down' : 'up';
      }
      
      lastScrollTopRef.current = currentScrollTop;

      // Clear previous timeout
      if (scrollUpdateTimeoutRef.current) {
        clearTimeout(scrollUpdateTimeoutRef.current);
      }

      // Debounce state update
      scrollUpdateTimeoutRef.current = setTimeout(() => {
        if (isAtBottom()) {
          // At bottom - resume auto-follow inmediatamente
          setScrollState('AUTO_FOLLOW');
          setUnreadCount(0);
        } else {
          // Scrolled up - pausar auto-scroll
          if (scrollState === 'AUTO_FOLLOW') {
            setScrollState('PAUSED_USER');
          }
          // Si ya está pausado, mantener pausado (usuario está leyendo)
        }
      }, DEBOUNCE_SCROLL);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollUpdateTimeoutRef.current) {
        clearTimeout(scrollUpdateTimeoutRef.current);
      }
    };
  }, [isAtBottom, recordInteraction, scrollState]);

  // ========================================
  // HANDLE: Wheel/touch interactions
  // ========================================
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = () => recordInteraction();
    const handleTouch = () => recordInteraction();

    container.addEventListener('wheel', handleWheel, { passive: true });
    container.addEventListener('touchmove', handleTouch, { passive: true });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchmove', handleTouch);
    };
  }, [recordInteraction]);

  // ========================================
  // UPDATE: State based on input focus
  // ========================================
  useEffect(() => {
    // ⚠️ IMPORTANTE: NO cambiar estado si el usuario está leyendo historial (PAUSED_USER)
    // Solo pausar si estaba en AUTO_FOLLOW
    if (isInputFocused && scrollState === 'AUTO_FOLLOW') {
      setScrollState('PAUSED_INPUT');
    } else if (!isInputFocused && scrollState === 'PAUSED_INPUT') {
      // Input unfocused - transition to user pause (don't auto-resume yet)
      setScrollState('PAUSED_USER');
    }
    // Si scrollState es PAUSED_USER o PAUSED_SELECTION, NO hacer nada
  }, [isInputFocused, scrollState]);

  // ========================================
  // SOFT REJOIN: Auto-resume after inactivity (WhatsApp/Instagram style)
  // ========================================
  useEffect(() => {
    const interval = setInterval(() => {
      const timeSinceInteraction = Date.now() - lastUserInteractionRef.current;

      // ⚡ REACTIVACIÓN AUTOMÁTICA: Si el usuario está inactivo y cerca del bottom
      if (timeSinceInteraction >= INACTIVITY_TIMEOUT) {
        if (scrollState !== 'AUTO_FOLLOW' && isAtBottom(THRESHOLD_REJOIN)) {
          // Usuario está cerca del bottom y sin actividad - reactivar auto-scroll suavemente
          scrollToBottom('smooth');
          setScrollState('AUTO_FOLLOW');
          setUnreadCount(0);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [scrollState, isAtBottom, scrollToBottom]);

  // ========================================
  // MAIN: Handle new messages
  // ========================================
  useEffect(() => {
    if (!messages.length || !currentUserId) return;

    const lastMessage = messages[messages.length - 1];
    const isOwnMessage = lastMessage?.userId === currentUserId;

    // ⚡ INSTANTÁNEO: If own message - always scroll to bottom immediately (like WhatsApp)
    if (isOwnMessage) {
      // Usar requestAnimationFrame para máxima velocidad (0ms delay)
      requestAnimationFrame(() => {
        scrollToBottom('auto'); // 'auto' es más rápido que 'smooth'
        setScrollState('AUTO_FOLLOW');
        setUnreadCount(0);
      });
      return;
    }

    // For others' messages
    if (scrollState === 'AUTO_FOLLOW') {
      // ⚡ INSTANTÁNEO: Auto-follow active - scroll immediately
      requestAnimationFrame(() => {
        scrollToBottom('auto');
      });
    } else {
      // Paused - preserve anchor and increment unread
      captureTopAnchor();

      requestAnimationFrame(() => {
        restoreTopAnchor();
        setUnreadCount((prev) => prev + 1);
      });
    }
  }, [messages, currentUserId, scrollState, scrollToBottom, captureTopAnchor, restoreTopAnchor]);

  // ========================================
  // OBSERVE: Container resize (handle keyboard, etc.)
  // ========================================
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      // ⚠️ CRÍTICO: SOLO hacer scroll en resize si:
      // 1. El usuario está en modo AUTO_FOLLOW (no leyendo historial)
      // 2. Y está REALMENTE en el bottom (threshold estricto de 50px)
      // Esto previene scroll forzado cuando se abre el teclado móvil
      if (scrollState === 'AUTO_FOLLOW' && isAtBottom(50)) {
        scrollToBottom('auto');
      }
      // Si está en PAUSED_USER/PAUSED_INPUT/PAUSED_SELECTION: NO hacer nada
      // El usuario debe mantener su posición de lectura
    });

    observer.observe(container);
    resizeObserverRef.current = observer;

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [scrollState, isAtBottom, scrollToBottom]);

  // ========================================
  // RETURN
  // ========================================
  const returnValue = {
    containerRef,
    endMarkerRef,
    scrollState,
    unreadCount,
    isTextSelected,
    scrollToBottom: handleScrollToBottomClick,
    isAtBottom: isAtBottom(),
  };

  // 🔇 Logs desactivados para reducir ruido en consola
  // console.log('✅ [SCROLL MANAGER] Hook completado, retornando:', {
  //   scrollState: returnValue.scrollState,
  //   unreadCount: returnValue.unreadCount,
  //   hasRefs: !!(returnValue.containerRef && returnValue.endMarkerRef)
  // });

  return returnValue;
};
