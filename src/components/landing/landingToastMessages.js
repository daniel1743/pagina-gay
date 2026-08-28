/**
 * Mensajes rotativos para el toast de captación en el landing page
 * Estos mensajes rotan automáticamente para mantener el engagement
 */

export const LANDING_CAPTURE_MESSAGES = [
  {
    id: 'community',
    icon: '💬',
    title: 'Conversación comunitaria',
    description: 'Revisa las salas y participa cuando quieras',
    highlight: 'entrada directa'
  },
  {
    id: 'privacy',
    icon: '🔒',
    title: 'Comparte solo lo necesario',
    description: 'Revisa las normas y controla la información que publicas',
    highlight: 'privacidad clara'
  },
  {
    id: 'simplicity',
    icon: '⚡',
    title: 'Sin Registro Tedioso',
    description: 'Solo tu nombre y empieza a chatear',
    highlight: 'entrada rápida'
  },
  {
    id: 'guidelines',
    icon: '🛡️',
    title: 'Espacio con reglas claras',
    description: 'Sin bots que aparenten ser personas y con controles contra spam',
    highlight: 'confianza'
  }
];

/**
 * Clave para localStorage - controla si el usuario cerró el toast
 */
export const LANDING_TOAST_DISMISSED_KEY = 'landing-capture-toast-dismissed';

/**
 * Tiempo de expiración del dismiss (24 horas en ms)
 */
export const LANDING_TOAST_DISMISS_EXPIRY = 24 * 60 * 60 * 1000;

