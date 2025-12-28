/**
 * 🔊 SISTEMA DE SONIDOS DE NOTIFICACIÓN
 *
 * - Sonido "pluc" sutil cuando llegan mensajes
 * - Sonido "clap" sutil cuando alguien se desconecta
 * - Agrupación: Si llegan 4+ mensajes en menos de 2 segundos, solo suena 1 vez
 * - Configuración persistente de mute en localStorage
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
        console.log('[SOUNDS] 🔊 Sistema de sonidos inicializado');
      } catch (error) {
        console.error('[SOUNDS] ❌ Error al inicializar AudioContext:', error);
      }
    }
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
    console.log(`[SOUNDS] 🔊 Sonidos ${this.isMuted ? 'desactivados' : 'activados'}`);
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
    if (this.isMuted || !this.audioContext) return;

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

      // Volumen muy bajo (sutil)
      gainNode.gain.setValueAtTime(0.08, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

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
    if (this.isMuted || !this.audioContext) return;

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

      // Volumen muy bajo (sutil)
      gainNode.gain.setValueAtTime(0.12, this.audioContext.currentTime);

      source.start(this.audioContext.currentTime);
    } catch (error) {
      console.error('[SOUNDS] Error reproduciendo sonido de desconexión:', error);
    }
  }
}

// Singleton
export const notificationSounds = new NotificationSounds();

// Inicializar automáticamente al primer clic del usuario
let initialized = false;
const initOnInteraction = () => {
  if (!initialized) {
    notificationSounds.init();
    initialized = true;
    document.removeEventListener('click', initOnInteraction);
    document.removeEventListener('keydown', initOnInteraction);
  }
};

document.addEventListener('click', initOnInteraction);
document.addEventListener('keydown', initOnInteraction);
