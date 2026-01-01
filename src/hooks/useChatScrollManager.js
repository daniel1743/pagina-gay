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

  // ========================================
  // STATE
  // ========================================
  const [scrollState, setScrollState] = useState('AUTO_FOLLOW'); // AUTO_FOLLOW | PAUSED_USER | PAUSED_INPUT | PAUSED_SELECTION
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTextSelected, setIsTextSelected] = useState(false);

  // ========================================
  // CONSTANTS
  // ========================================
  const THRESHOLD_AT_BOTTOM = 80; // px from bottom to consider "at bottom"
  const THRESHOLD_REJOIN = 250; // px from bottom to auto-rejoin
  const INACTIVITY_TIMEOUT = 4000; // ms before attempting soft rejoin
  const DEBOUNCE_SCROLL = 150; // ms debounce for scroll updates

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
  // HANDLE: Scroll event (with debounce)
  // ========================================
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      recordInteraction();

      // Clear previous timeout
      if (scrollUpdateTimeoutRef.current) {
        clearTimeout(scrollUpdateTimeoutRef.current);
      }

      // Debounce state update
      scrollUpdateTimeoutRef.current = setTimeout(() => {
        if (isAtBottom()) {
          // At bottom - resume auto-follow
          setScrollState('AUTO_FOLLOW');
          setUnreadCount(0);
        } else {
          // Scrolled up - pause
          if (scrollState === 'AUTO_FOLLOW') {
            setScrollState('PAUSED_USER');
          }
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
    if (isInputFocused && scrollState === 'AUTO_FOLLOW') {
      setScrollState('PAUSED_INPUT');
    } else if (!isInputFocused && scrollState === 'PAUSED_INPUT') {
      // Input unfocused - transition to user pause (don't auto-resume yet)
      setScrollState('PAUSED_USER');
    }
  }, [isInputFocused, scrollState]);

  // ========================================
  // SOFT REJOIN: Auto-resume after inactivity
  // ========================================
  useEffect(() => {
    const interval = setInterval(() => {
      const timeSinceInteraction = Date.now() - lastUserInteractionRef.current;

      if (timeSinceInteraction >= INACTIVITY_TIMEOUT) {
        // Check if user is near bottom
        if (scrollState !== 'AUTO_FOLLOW' && isAtBottom(THRESHOLD_REJOIN)) {
          // User is close to bottom and inactive - soft rejoin
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

    // If own message - always scroll to bottom and resume auto-follow
    if (isOwnMessage) {
      setTimeout(() => {
        scrollToBottom('smooth');
        setScrollState('AUTO_FOLLOW');
        setUnreadCount(0);
      }, 50);
      return;
    }

    // For others' messages
    if (scrollState === 'AUTO_FOLLOW') {
      // Auto-follow active - scroll to bottom
      setTimeout(() => {
        scrollToBottom('smooth');
      }, 50);
    } else {
      // Paused - preserve anchor and increment unread
      captureTopAnchor();

      setTimeout(() => {
        restoreTopAnchor();
        setUnreadCount((prev) => prev + 1);
      }, 50);
    }
  }, [messages, currentUserId, scrollState, scrollToBottom, captureTopAnchor, restoreTopAnchor]);

  // ========================================
  // OBSERVE: Container resize (handle keyboard, etc.)
  // ========================================
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      // On resize, maintain position if paused, or scroll to bottom if following
      if (scrollState === 'AUTO_FOLLOW' && isAtBottom(THRESHOLD_AT_BOTTOM + 50)) {
        scrollToBottom('auto');
      }
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
