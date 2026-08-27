import { describe, expect, it } from 'vitest';
import {
  buildLocalChactivoAssistantInsight,
  generateChactivoAssistantInsight,
  isChactivoAssistantAvailable,
} from '../src/services/chactivoAssistantService.js';
import {
  checkLocationPermission,
  getCurrentLocation,
  EXACT_GEOLOCATION_DISABLED,
} from '../src/services/geolocationService.js';
import {
  monitorActivityAndSendVOC,
  sendVOCMessageIfNeeded,
} from '../src/services/vocService.js';

describe('controles de seguridad y privacidad', () => {
  it('mantiene el asistente remoto desactivado en frontend', async () => {
    expect(isChactivoAssistantAvailable()).toBe(false);
    await expect(generateChactivoAssistantInsight()).rejects.toMatchObject({
      code: 'REMOTE_ASSISTANT_DISABLED',
    });
  });

  it('calcula el resumen local sin necesitar un proveedor externo', () => {
    const insight = buildLocalChactivoAssistantInsight({
      roomId: 'principal',
      windowKey: 'today',
      windowLabel: 'Solo hoy',
      report: {
        messages: [
          { id: '1', userId: 'u1', username: 'Alex', content: 'Hola desde Santiago', comuna: 'Santiago' },
          { id: '2', userId: 'u2', username: 'Sam', content: 'Busco conversar por fuera de WhatsApp' },
          { id: '3', userId: 'u1', username: 'Alex', content: 'Busco conversar por fuera de WhatsApp' },
        ],
      },
    });

    expect(insight.source).toBe('local');
    expect(insight.metrics.totalMessages).toBe(3);
    expect(insight.metrics.uniqueUsers).toBe(2);
    expect(insight.signalCounters.contactEscape).toBe(2);
    expect(insight.repeatedPhrases).toEqual([
      { text: 'busco conversar por fuera de whatsapp', count: 2 },
    ]);
  });

  it('rechaza cualquier solicitud de ubicación exacta', async () => {
    expect(EXACT_GEOLOCATION_DISABLED).toBe(true);
    await expect(checkLocationPermission()).resolves.toBe('denied');
    await expect(getCurrentLocation()).rejects.toMatchObject({
      code: 'EXACT_GEOLOCATION_DISABLED',
    });
  });

  it('no envía mensajes VOC aunque la sala esté inactiva', async () => {
    await expect(sendVOCMessageIfNeeded('principal', 0)).resolves.toBeUndefined();
    await expect(monitorActivityAndSendVOC('principal', [])).resolves.toBeUndefined();
  });
});
