/**
 * 🔊 SISTEMA DE SONIDOS DE NOTIFICACIÓN
 *
 * Sonidos sutiles, suaves y agradables para mejorar la experiencia del chat:
 *
 * 🎵 playUserJoinSound() - Tono ascendente (400Hz→800Hz) cuando un usuario ingresa
 * 📤 playMessageSentSound() - Doble "bip" de confirmación (600Hz→700Hz) al enviar mensaje
 * 📥 playMessageSound() - Tono descendente "pluc" (800Hz→400Hz) al recibir mensaje
 * 👋 playDisconnectSound() - "Clap" sutil cuando alguien se desconecta
 *
 * Características:
 * - Agrupación: Si llegan 4+ mensajes en menos de 2 segundos, solo suena 1 vez
 * - Configuración persistente de mute en localStorage
 * - Volúmenes muy bajos para no molestar (0.05-0.08)
 * - Inicialización automática al primer click del usuario
 */

const SOUND_SETTINGS_KEY = 'chat_sound_settings';

class NotificationSounds {
  constructor() {
    this.audioContext = null;
    this.isMuted = this.loadMuteSetting();
    this.messageQueue = [];
    this.lastSoundTime = 0;
    this.groupingWindow = 2000; // 2 segundos
    this.messagesInWindow = 0;
    this.groupingTimer = null;
  }

  /**
   * Inicializa el AudioContext (requiere interacción del usuario)
   */
  init() {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        // console.log('[SOUNDS] 🔊 Sistema de sonidos inicializado correctamente');
        // console.log('[SOUNDS] 📊 Estado de AudioContext:', this.audioContext.state);
        // console.log('[SOUNDS] 🔇 Mute:', this.isMuted);
        return true;
      } catch (error) {
        console.error('[SOUNDS] ❌ Error al inicializar AudioContext:', error);
        return false;
      }
    } else {
      // console.log('[SOUNDS] ✅ AudioContext ya estaba inicializado');
      return true;
    }
  }

  /**
   * Verifica si el AudioContext está inicializado
   */
  isInitialized() {
    return this.audioContext !== null;
  }

  /**
   * Carga configuración de mute desde localStorage
   */
  loadMuteSetting() {
    try {
      const settings = localStorage.getItem(SOUND_SETTINGS_KEY);
      if (settings) {
        const parsed = JSON.parse(settings);
        return parsed.isMuted || false;
      }
    } catch (error) {
      console.error('[SOUNDS] Error cargando configuración:', error);
    }
    return false;
  }

  /**
   * Guarda configuración de mute en localStorage
   */
  saveMuteSetting() {
    try {
      localStorage.setItem(SOUND_SETTINGS_KEY, JSON.stringify({
        isMuted: this.isMuted
      }));
    } catch (error) {
      console.error('[SOUNDS] Error guardando configuración:', error);
    }
  }

  /**
   * Alterna el estado de mute
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    this.saveMuteSetting();
    // console.log(`[SOUNDS] 🔊 Sonidos ${this.isMuted ? 'desactivados' : 'activados'}`);
    return this.isMuted;
  }

  /**
   * Obtiene el estado de mute
   */
  getMuteState() {
    return this.isMuted;
  }

  /**
   * Genera un sonido "pluc" sutil (tono corto descendente)
   */
  playMessageSound() {
    if (this.isMuted) {
      // console.log('[SOUNDS] 🔇 Sonido de mensaje bloqueado: MUTED');
      return;
    }

    if (!this.audioContext) return;

    // Verificar si el AudioContext está suspendido (común en Chrome/Safari)
    if (this.audioContext.state === 'suspended') {
      // console.log('[SOUNDS] 🔄 AudioContext suspendido, reanudando...');
      this.audioContext.resume().catch(() => {});
    }

    const now = Date.now();
    this.messagesInWindow++;

    // Limpiar timer anterior
    if (this.groupingTimer) {
      clearTimeout(this.groupingTimer);
    }

    // Si es el primer mensaje de la ventana, reproducir inmediatamente
    if (this.messagesInWindow === 1) {
      this._playPlucSound();
      this.lastSoundTime = now;
    }

    // Configurar timer para resetear contador después de la ventana de agrupación
    this.groupingTimer = setTimeout(() => {
      // Si hubo 4+ mensajes, reproducir un sonido adicional al final
      if (this.messagesInWindow >= 4 && (Date.now() - this.lastSoundTime) >= 1000) {
        this._playPlucSound();
      }
      this.messagesInWindow = 0;
    }, this.groupingWindow);
  }

  /**
   * Reproduce el sonido "pluc" real
   */
  _playPlucSound() {
    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Frecuencia descendente: 800Hz -> 400Hz (sonido "pluc")
      oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.1);

      // Volumen ajustado (audible pero suave)
      gainNode.gain.setValueAtTime(0.25, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.05, this.audioContext.currentTime + 0.15);

      oscillator.type = 'sine';
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.15);
    } catch (error) {
      console.error('[SOUNDS] Error reproduciendo sonido de mensaje:', error);
    }
  }

  /**
   * Genera un sonido "clap" sutil (ruido breve con ataque rápido)
   */
  playDisconnectSound() {
    if (this.isMuted) {
      // console.log('[SOUNDS] 🔇 Sonido de desconexión bloqueado: MUTED');
      return;
    }

    if (!this.audioContext) return;

    // Verificar si el AudioContext está suspendido (común en Chrome/Safari)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }

    try {
      const bufferSize = this.audioContext.sampleRate * 0.15; // 150ms
      const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
      const data = buffer.getChannelData(0);

      // Generar ruido blanco con envolvente de "clap"
      for (let i = 0; i < bufferSize; i++) {
        // Ruido blanco
        data[i] = (Math.random() * 2 - 1) * 0.3;

        // Envolvente: ataque muy rápido, decaimiento exponencial
        const decay = Math.exp(-i / (bufferSize * 0.2));
        data[i] *= decay;
      }

      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();

      // Filtro paso-alto para hacer el sonido más "brillante" y sutil
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1200, this.audioContext.currentTime);

      source.buffer = buffer;
      source.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Volumen ajustado (audible pero suave)
      gainNode.gain.setValueAtTime(0.35, this.audioContext.currentTime);

      source.start(this.audioContext.currentTime);
    } catch (error) {
      console.error('[SOUNDS] Error reproduciendo sonido de desconexión:', error);
    }
  }

  /**
   * 🎵 Genera un sonido suave ascendente para cuando un usuario ingresa (join)
   * Frecuencia ascendente: 400Hz -> 800Hz (sonido "ding" alegre)
   */
  playUserJoinSound() {
    if (this.isMuted) {
      // ⚠️ LOG COMENTADO: Causaba sobrecarga en consola
      // console.log('[SOUNDS] 🔇 Sonido de ingreso bloqueado: MUTED');
      return;
    }

    if (!this.audioContext) return;

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }

    try {
      // Oscilador principal (tono ascendente)
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Frecuencia ascendente suave: 400Hz -> 800Hz (sonido alegre y acogedor)
      oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.12);

      // Volumen ajustado con fade in/out
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.05, this.audioContext.currentTime + 0.2);

      oscillator.type = 'sine';
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.2);

      // ⚠️ LOG COMENTADO: Causaba sobrecarga en consola
      // console.log('[SOUNDS] 🎵 Reproduciendo sonido de ingreso (join)');
    } catch (error) {
      // Solo mostrar errores críticos
      console.error('[SOUNDS] Error reproduciendo sonido de ingreso:', error);
    }
  }

  /**
   * 📤 Genera un sonido de confirmación breve para cuando envío un mensaje
   * Doble tono rápido: 600Hz -> 700Hz (sonido "clic" confirmación)
   */
  playMessageSentSound() {
    if (this.isMuted) {
      // console.log('[SOUNDS] 🔇 Sonido de envío bloqueado: MUTED');
      return;
    }

    if (!this.audioContext) return;

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }

    try {
      // Oscilador para confirmación (doble "bip" muy rápido)
      const oscillator1 = this.audioContext.createOscillator();
      const oscillator2 = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator1.connect(gainNode);
      oscillator2.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Primer tono: 600Hz (muy breve)
      oscillator1.frequency.setValueAtTime(600, this.audioContext.currentTime);
      oscillator1.type = 'sine';
      oscillator1.start(this.audioContext.currentTime);
      oscillator1.stop(this.audioContext.currentTime + 0.04);

      // Segundo tono: 700Hz (muy breve, ligeramente después)
      oscillator2.frequency.setValueAtTime(700, this.audioContext.currentTime + 0.05);
      oscillator2.type = 'sine';
      oscillator2.start(this.audioContext.currentTime + 0.05);
      oscillator2.stop(this.audioContext.currentTime + 0.09);

      // Volumen ajustado
      gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.03, this.audioContext.currentTime + 0.1);

      // console.log('[SOUNDS] 📤 Reproduciendo sonido de envío (sent)');
    } catch (error) {
      console.error('[SOUNDS] Error reproduciendo sonido de envío:', error);
    }
  }
}

// Singleton
export const notificationSounds = new NotificationSounds();

let gestureHookBound = false;
let gestureInitialized = false;

export const initAudioOnFirstGesture = () => {
  if (gestureInitialized) return;

  const unlockAudio = () => {
    if (gestureInitialized) return;
    gestureInitialized = notificationSounds.init();

    if (gestureInitialized) {
      document.removeEventListener('pointerdown', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    }
  };

  if (!gestureHookBound) {
    gestureHookBound = true;
    document.addEventListener('pointerdown', unlockAudio, { passive: true });
    document.addEventListener('touchstart', unlockAudio, { passive: true });
    document.addEventListener('keydown', unlockAudio);
  }
};
