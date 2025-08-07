/**
 * WhatsApp event handlers
 */
import { logger } from '../services/logger.js';

export function setupEventHandlers(conn) {
  // Group participants update
  conn.ev.on('group-participants.update', async (update) => {
    try {
      const { id, participants, action } = update;

      // Check if welcome/goodbye is enabled for this group
      const chatData = global.db.data.chats[id] || {};
      if (!chatData.welcome) return;

      for (const participant of participants) {
        try {
          const name = await conn.getName(participant) || participant.split('@')[0];

          if (action === 'add') {
            const welcomeMsg = `👋 ¡Bienvenido/a *${name}* al grupo!`;
            await conn.sendMessage(id, { text: welcomeMsg });
          } else if (action === 'remove') {
            const byeMsg = `👋 *${name}* ha salido del grupo.`;
            await conn.sendMessage(id, { text: byeMsg });
          }
        } catch (error) {
          logger.debug('Error sending welcome/goodbye message:', error);
        }
      }
    } catch (error) {
      logger.error('Error handling group participants update:', error);
    }
  });

  // Connection updates
  conn.ev.on('connection.update', (update) => {
    logger.debug('Connection update received:', update);
  });

  // Credentials update
  conn.ev.on('creds.update', () => {
    logger.debug('Credentials updated');
  });
}