/**
 * SISTEMA DE MODERADOR DE BIENVENIDA
 *
 * Un moderador virtual da la bienvenida y explica las reglas de la sala
 */

import { sendMessage } from './chatService';

/**
 * Envía mensaje de bienvenida del moderador
 *
 * @param {string} roomId - ID de la sala
 * @param {string} username - Nombre del usuario que entra
 */
export const sendModeratorWelcome = async (roomId, username) => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║           👮 MODERADOR: MENSAJE DE BIENVENIDA              ║
╠════════════════════════════════════════════════════════════╣
║ 👤 Usuario: ${username.padEnd(20)}                          ║
║ 🏠 Sala: ${roomId.padEnd(23)}                          ║
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
  }
};
