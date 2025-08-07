
/**
 * Message handling and processing
 */
import { logger } from '../services/logger.js';

export function setupMessageHandler(conn) {
  if (!conn) {
    logger.error('❌ Connection not provided to message handler');
    return;
  }

  logger.info('📱 Setting up message handler...');
  
  conn.ev.on('messages.upsert', async ({ messages, type }) => {
    try {
      if (type !== 'notify') return;
      
      for (const message of messages) {
        if (!message.message) continue;
        if (message.key.fromMe) continue;
        
        // Basic message processing
        const m = {
          key: message.key,
          message: message.message,
          pushName: message.pushName || 'Unknown',
          sender: message.key.remoteJid,
          isGroup: message.key.remoteJid.endsWith('@g.us'),
          text: getMessageText(message.message)
        };
        
        logger.info(`📨 Message from ${m.pushName}: ${m.text}`);
        
        // Process commands if text starts with common prefixes
        if (m.text && (m.text.startsWith('.') || m.text.startsWith('/') || m.text.startsWith('!'))) {
          logger.info(`🔧 Processing command: ${m.text}`);
          await processCommand(conn, m);
        } else if (m.text) {
          // Process regular messages  
          logger.debug(`💬 Regular message: ${m.text.substring(0, 50)}...`);
        }
      }
    } catch (error) {
      logger.error('Error processing message:', error);
    }
  });
}

function getMessageText(message) {
  return message.conversation || 
         message.extendedTextMessage?.text || 
         message.imageMessage?.caption || 
         message.videoMessage?.caption || 
         '';
}

async function processCommand(conn, m) {
  try {
    const command = m.text.slice(1).split(' ')[0].toLowerCase();
    
    switch (command) {
      case 'ping':
      case 'p':
        await conn.sendMessage(m.sender, { text: '🏓 Pong!' });
        break;
        
      case 'bot':
      case 'info':
        const uptime = process.uptime();
        const info = `
🤖 *MoJiTo Bot*

⏰ *Tiempo activo:* ${Math.floor(uptime / 60)} minutos
💾 *Memoria:* ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
📱 *Versión:* 1.0.0
👑 *Creador:* Brian Martins

✅ Bot funcionando correctamente
        `.trim();
        
        await conn.sendMessage(m.sender, { text: info });
        break;
        
      case 'help':
      case 'menu':
        const menu = `
📋 *MENÚ DE COMANDOS*

🏓 *.ping* - Verificar latencia
ℹ️ *.bot* - Información del bot  
📋 *.menu* - Mostrar este menú
🆔 *.id* - Obtener ID del chat

🤖 Bot creado por Brian Martins
        `.trim();
        
        await conn.sendMessage(m.sender, { text: menu });
        break;
        
      case 'id':
        await conn.sendMessage(m.sender, { 
          text: `🆔 *ID del chat:* ${m.sender}\n📱 *Tu nombre:* ${m.pushName}` 
        });
        break;
    }
  } catch (error) {
    logger.error('Error processing command:', error);
  }
}
