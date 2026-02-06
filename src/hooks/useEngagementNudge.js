/**
 * 🔔 HOOK DE ENGAGEMENT NUDGE
 * Prioriza BAÚL sobre OPIN - mayor enganche
 *
 * - Popup 10 seg: explica qué es Baúl, por qué completar tarjeta, enlace a Baúl
 * - Toast cada 5-15 min: informa sobre Baúl (vistas, likes, completar tarjeta)
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

// Mensajes periódicos sobre Baúl (5-15 min)
const NUDGES_BAUL = [
  (v, l) => ({
    title: `👀 ${v} personas vieron tu tarjeta`,
    description: 'Complétala en el Baúl para recibir más likes',
  }),
  (v, l) => ({
    title: `📈 Tu tarjeta tiene ${v} visitas`,
    description: 'Las tarjetas con foto reciben 8x más likes',
  }),
  (v, l) => ({
    title: l > 0 ? `❤️ ${l} likes en tu tarjeta` : `👀 ${v} visitas`,
    description: l > 0 ? 'Mira quién te dio like en el Baúl' : 'Completa tu perfil para recibir likes',
  }),
  (v, l) => ({
    title: '💡 Baúl: tu tarjeta de presentación',
    description: 'Completa foto, rol y bio para conectar mejor',
  }),
  (v, l) => ({
    title: `🔥 ${v} personas te vieron`,
    description: 'Revisa el Baúl y completa lo que falta',
  }),
];

export function useEngagementNudge({ onOpenBaul } = {}) {
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

    // 🔔 POPUP INICIAL 10 SEG: explica qué es Baúl, por qué completar tarjeta, enlace
    const mensajeInicial = setTimeout(async () => {
      if (!mounted) return;
      try {
        const tarjeta = await obtenerTarjeta(user.id);
        if (!tarjeta || !mounted) return;

        // Verificar si ya se mostró hoy
        const hoy = new Date().toDateString();
        const ultimoPopup = localStorage.getItem('baulIntroPopupDate');
        if (ultimoPopup === hoy) return;

        localStorage.setItem('baulIntroPopupDate', hoy);

        toast({
          title: '📋 ¿Qué es el Baúl?',
          description: 'Tu tarjeta de presentación. Complétala (foto, rol, bio) y verás quién te visita y te da like. Conecta con personas que buscan lo mismo.',
          duration: 10000,
          variant: 'default',
          action: onOpenBaul ? {
            label: 'Ver Baúl',
            onClick: () => {
              onOpenBaul();
            },
          } : undefined,
        });
      } catch (err) {
        // Silenciar
      }
    }, 10000);

    const ejecutarNudge = async () => {
      if (!mounted) return;

      try {
        const tarjeta = await obtenerTarjeta(user.id);
        if (!tarjeta || !mounted) return;

        const vistas = calcularVistasEsperadas(tarjeta, 'tarjeta');
        const likes = calcularLikesEsperados(tarjeta, 'tarjeta');

        const idx = nudgeIndexRef.current % NUDGES_BAUL.length;
        const mensaje = NUDGES_BAUL[idx](vistas, likes);
        nudgeIndexRef.current++;

        if (mensaje) {
          toast({
            title: mensaje.title,
            description: mensaje.description,
            duration: 5000,
            action: onOpenBaul ? {
              label: 'Ver Baúl',
              onClick: () => onOpenBaul(),
            } : undefined,
          });
        }
      } catch (err) {
        // Silenciar errores
      }
    };

    // Primer nudge después de 5 min, luego cada 5-15 min (aleatorio)
    const primerDelay = setTimeout(() => {
      ejecutarNudge();
      const intervaloMs = (5 + Math.random() * 10) * 60 * 1000; // 5-15 min
      intervalRef.current = setInterval(ejecutarNudge, intervaloMs);
    }, 5 * 60 * 1000);

    return () => {
      mounted = false;
      clearTimeout(mensajeInicial);
      clearTimeout(primerDelay);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user, onOpenBaul]);

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
