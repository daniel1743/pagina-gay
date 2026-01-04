/**
 * Mensajes rotativos para el toast de captación en el landing page
 * Estos mensajes rotan automáticamente para mantener el engagement
 */

export const LANDING_CAPTURE_MESSAGES = [
  {
    id: 'social-proof',
    icon: '🔥',
    title: 'Chat activo ahora',
    description: '150+ personas conectadas • Gente real',
    highlight: 'actividad en tiempo real'
  },
  {
    id: 'privacy',
    icon: '🔒',
    title: '100% Privado y Anónimo',
    description: 'No guardamos datos • Sal cuando quieras',
    highlight: 'privacidad total'
  },
  {
    id: 'simplicity',
    icon: '⚡',
    title: 'Sin Registro Tedioso',
    description: 'Solo tu nombre y empieza a chatear',
    highlight: 'entrada rápida'
  },
  {
    id: 'exclusivity',
    icon: '💜',
    title: 'Comunidad Emergente de Alta Calidad',
    description: 'En camino a ser #1 en Chile y el mundo',
    highlight: 'exclusividad'
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

