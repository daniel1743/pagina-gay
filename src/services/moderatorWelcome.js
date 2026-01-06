/**
 * SISTEMA DE MODERADOR DE BIENVENIDA
 *
 * Un moderador virtual da la bienvenida y explica las reglas de la sala
 */

import { sendMessage } from './chatService';

// Cache para evitar mensajes duplicados del moderador
const sentWelcomeCache = new Set();

/**
 * Envía mensaje de bienvenida del moderador
 *
 * @param {string} roomId - ID de la sala
 * @param {string} username - Nombre del usuario que entra
 */
export const sendModeratorWelcome = async (roomId, username) => {
  // ⚠️ MODERADOR DESACTIVADO (06/01/2026) - Ver docs/moderator_recovery.md para código original
  console.log('[MODERATOR] 🔇 Bienvenida de moderador desactivada');
  return;

  /*
  // ✅ Validar parámetros
  if (!roomId || !username) {
    console.warn('⏭️ [MODERATOR] Parámetros inválidos, omitiendo bienvenida:', { roomId, username });
    return;
  }

  // ✅ Verificar cache para evitar duplicados
  const cacheKey = `${roomId}_${username}`;
  if (sentWelcomeCache.has(cacheKey)) {
    console.log(`⏭️ [MODERATOR] Mensaje ya enviado para ${username} en ${roomId}, omitiendo...`);
    return;
  }

  // Marcar inmediatamente para evitar duplicados
  sentWelcomeCache.add(cacheKey);
  
  // Limpiar cache después de 5 minutos (evitar memory leak)
  setTimeout(() => {
    sentWelcomeCache.delete(cacheKey);
  }, 5 * 60 * 1000);

  // ✅ Validar que username y roomId sean strings antes de usar padEnd
  const safeUsername = String(username || 'Usuario').padEnd(20);
  const safeRoomId = String(roomId || 'unknown').padEnd(23);

  console.log(`
╔════════════════════════════════════════════════════════════╗
║           👮 MODERADOR: MENSAJE DE BIENVENIDA              ║
╠════════════════════════════════════════════════════════════╣
║ 👤 Usuario: ${safeUsername}                          ║
║ 🏠 Sala: ${safeRoomId}                          ║
╚════════════════════════════════════════════════════════════╝
  `);

  const welcomeMessage = `👋 ¡Bienvenido/a ${username}!

Soy el moderador automático de esta sala. Aquí algunas reglas rápidas:

✅ Respeto mutuo siempre
✅ Consentimiento es clave
✅ No spam ni contenido ilegal
✅ Disfruta la conversación

¡Diviértete y conoce gente! 🌈`;

  try {
    await sendMessage(roomId, {
      userId: 'system_moderator',
      username: '🛡️ Moderador',
      avatar: '🛡️',
      content: welcomeMessage,
      type: 'text',
      timestamp: Date.now()
    });

    console.log(`✅ [MODERATOR] Bienvenida enviada a ${username}`);
  } catch (error) {
    console.error(`❌ [MODERATOR] Error enviando bienvenida:`, error);
    // Si falla, remover del cache para permitir reintento
    sentWelcomeCache.delete(cacheKey);
  }
  */
};
