/**
 * 🔔 HOOK DE ENGAGEMENT NUDGE
 * Muestra toasts periódicos sobre actividad en tarjeta y OPIN
 * para empujar al usuario a completar su perfil y participar
 *
 * - Cada 10-15 min si tarjeta incompleta
 * - Cada 20-30 min si tarjeta completa (promueve OPIN)
 * - Se detiene si el usuario ya interactuó con baúl/OPIN en esta sesión
 */

import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { obtenerTarjeta } from '@/services/tarjetaService';
import {
  calcularVistasEsperadas,
  calcularLikesEsperados
} from '@/services/engagementBoostService';
import { toast } from '@/components/ui/use-toast';

// Mensajes para tarjeta incompleta (más urgentes, más frecuentes)
const NUDGES_TARJETA = [
  (v, l) => ({
    title: `👀 ${v} personas vieron tu tarjeta`,
    description: 'Agrega una foto para recibir likes',
  }),
  (v, l) => ({
    title: `📈 Tu tarjeta tiene ${v} visitas`,
    description: 'Las tarjetas con foto reciben 8x más likes',
  }),
  (v, l) => ({
    title: l > 0 ? `❤️ ${l} likes en tu tarjeta` : `👀 ${v} visitas y 0 likes`,
    description: l > 0 ? '¡Completa tu perfil para más!' : 'Sin foto ni bio nadie te da like',
  }),
  (v, l) => ({
    title: '💡 Tu tarjeta está incompleta',
    description: `${v} personas la vieron pero no tiene info. Complétala.`,
  }),
  (v, l) => ({
    title: `🔥 ${v} personas te vieron`,
    description: 'Indica tu rol y lo que buscas para conectar mejor',
  }),
];

// Mensajes para promover OPIN (menos urgentes)
const NUDGES_OPIN = [
  () => ({
    title: '✨ ¿Ya publicaste en OPIN?',
    description: 'Publica lo que buscas y deja que te encuentren',
  }),
  () => ({
    title: '💜 OPIN: Muro de descubrimiento',
    description: 'Los usuarios descubren tu perfil y te escriben',
  }),
  () => ({
    title: '🎯 Publica en OPIN',
    description: 'Tu post dura 24h y recibe vistas y likes',
  }),
];

export function useEngagementNudge() {
  const { user } = useAuth();
  const intervalRef = useRef(null);
  const nudgeIndexRef = useRef(0);

  useEffect(() => {
    // Solo para usuarios registrados
    if (!user || user.isGuest || user.isAnonymous) return;

    // No ejecutar si ya se interactuó en esta sesión
    const yaInteractuo = sessionStorage.getItem('engagementNudgeOff');
    if (yaInteractuo) return;

    let mounted = true;

    // 🔔 MENSAJE INICIAL (tipo sistema) - a los 10 segundos de entrar
    const mensajeInicial = setTimeout(async () => {
      if (!mounted) return;
      try {
        const tarjeta = await obtenerTarjeta(user.id);
        if (!tarjeta || !mounted) return;

        const vistas = calcularVistasEsperadas(tarjeta, 'tarjeta');

        // Verificar si ya se mostró hoy
        const hoy = new Date().toDateString();
        const ultimoMensaje = localStorage.getItem('engagementWelcomeDate');
        if (ultimoMensaje === hoy) return;

        localStorage.setItem('engagementWelcomeDate', hoy);

        const tarjetaIncompleta = !tarjeta.fotoUrl || !tarjeta.rol || !tarjeta.bio;

        if (tarjetaIncompleta) {
          toast({
            title: `👀 Tu tarjeta tiene ${vistas} visitas`,
            description: 'Completa tu perfil en el Baúl para que te den like',
            duration: 6000,
          });
        } else {
          toast({
            title: `Tu tarjeta tiene ${vistas} visitas`,
            description: 'Publica en OPIN lo que buscas y recibe más atención',
            duration: 6000,
          });
        }
      } catch (err) {
        // Silenciar
      }
    }, 10000); // 10 segundos

    const ejecutarNudge = async () => {
      if (!mounted) return;

      try {
        const tarjeta = await obtenerTarjeta(user.id);
        if (!tarjeta || !mounted) return;

        const vistas = calcularVistasEsperadas(tarjeta, 'tarjeta');
        const likes = calcularLikesEsperados(tarjeta, 'tarjeta');

        const tarjetaIncompleta = !tarjeta.fotoUrl || !tarjeta.rol || !tarjeta.bio;

        let mensaje;
        if (tarjetaIncompleta) {
          // Nudge para completar tarjeta
          const idx = nudgeIndexRef.current % NUDGES_TARJETA.length;
          mensaje = NUDGES_TARJETA[idx](vistas, likes);
        } else {
          // Nudge para OPIN
          const idx = nudgeIndexRef.current % NUDGES_OPIN.length;
          mensaje = NUDGES_OPIN[idx](vistas, likes);
        }

        nudgeIndexRef.current++;

        if (mensaje) {
          toast({
            title: mensaje.title,
            description: mensaje.description,
            duration: 5000,
          });
        }
      } catch (err) {
        // Silenciar errores
      }
    };

    // Primer nudge periódico después de 3 minutos
    const primerDelay = setTimeout(() => {
      ejecutarNudge();

      // Después cada 12-18 minutos (aleatorio para no ser predecible)
      const intervaloMs = (12 + Math.random() * 6) * 60 * 1000;
      intervalRef.current = setInterval(ejecutarNudge, intervaloMs);
    }, 3 * 60 * 1000);

    return () => {
      mounted = false;
      clearTimeout(mensajeInicial);
      clearTimeout(primerDelay);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user]);

  // Función para detener los nudges (llamar cuando el usuario interactúe con baúl/opin)
  const detenerNudges = () => {
    sessionStorage.setItem('engagementNudgeOff', '1');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  return { detenerNudges };
}
