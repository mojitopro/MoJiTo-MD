
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
  
  // Listen to both events to ensure compatibility
  conn.ev.on('messages.upsert', async ({ messages, type }) => {
    logger.info(`📨 Direct message handler: ${messages.length} messages, type: ${type}`);
    await handleMessages(conn, messages, type);
  });
  
  conn.ev.on('message.handler', async ({ messages, type }) => {
    logger.info(`📨 Custom message handler: ${messages.length} messages, type: ${type}`);
    await handleMessages(conn, messages, type);
  });
}

async function handleMessages(conn, messages, type) {
  try {
    logger.info(`🔧 Message handler activated with ${messages.length} messages of type: ${type}`);
    if (type !== 'notify') {
      logger.debug(`Skipping non-notify message type: ${type}`);
      return;
    }
      
      for (const message of messages) {
        logger.info(`📝 Processing message: ${JSON.stringify({ 
          fromMe: message.key.fromMe, 
          hasMessage: !!message.message,
          remoteJid: message.key.remoteJid 
        })}`);
        
        if (!message.message) {
          logger.debug('Skipping message without content');
          continue;
        }
        // Allow commands from bot owner, skip only non-command messages
        if (message.key.fromMe && !getMessageText(message.message).match(/^[./#!]/)) {
          logger.debug('Skipping own non-command message');
          continue;
        }
        
        // Basic message processing
        const m = {
          key: message.key,
          message: message.message,
          pushName: message.pushName || 'Unknown',
          sender: message.key.remoteJid,
          isGroup: message.key.remoteJid.endsWith('@g.us'),
          text: getMessageText(message.message)
        };
        
        logger.info(`📨 Message from ${m.pushName}: "${m.text || 'Media/Other'}"`);
        
        // Process commands if text starts with common prefixes
        if (m.text && global.prefix.test(m.text)) {
          logger.info(`🚀 EXECUTING COMMAND: ${m.text}`);
          try {
            await processCommand(conn, m);
            logger.info(`✅ Command executed successfully: ${m.text}`);
          } catch (error) {
            logger.error(`❌ Command execution failed: ${error.message}`);
          }
        } else if (m.text) {
          // Auto-respond to test messages
          if (m.text.toLowerCase().includes('test') || m.text.toLowerCase().includes('hola')) {
            logger.info('🤖 Auto-responding to greeting');
            await conn.sendMessage(m.sender, { text: '👋 ¡Hola! El bot está funcionando correctamente.\n\nUsa .ping para probar comandos' });
          }
          logger.debug(`💬 Regular message: ${m.text.substring(0, 50)}...`);
      }
    }
  } catch (error) {
    logger.error('Error processing message:', error);
  }
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
    const prefixMatch = m.text.match(global.prefix);
    if (!prefixMatch) return;
    
    const usedPrefix = prefixMatch[0];
    const command = m.text.slice(usedPrefix.length).split(' ')[0].toLowerCase();
    const args = m.text.slice(usedPrefix.length + command.length).trim().split(' ').filter(Boolean);
    
    logger.info(`🔍 Looking for command: ${command}`);
    
    // Enhanced message object for plugins
    const enhancedM = {
      ...m,
      chat: m.sender,
      sender: m.sender,
      fromMe: m.key?.fromMe || false,
      mentionedJid: [],
      quoted: null,
      isGroup: m.isGroup,
      command,
      usedPrefix,
      args,
      text: m.text,
      body: m.text
    };
    
    // First check if we have loaded plugins
    if (global.plugins && Object.keys(global.plugins).length > 0) {
      logger.info(`📦 Checking ${Object.keys(global.plugins).length} plugins for command: ${command}`);
      
      for (const [pluginName, plugin] of Object.entries(global.plugins)) {
        if (plugin.command && plugin.command.test(command)) {
          logger.info(`✅ Found plugin ${pluginName} for command: ${command}`);
          try {
            await plugin.handler(enhancedM, { conn, usedPrefix, command, args });
            return;
          } catch (error) {
            logger.error(`❌ Plugin ${pluginName} failed:`, error);
          }
        }
      }
    }
    
    // Fallback to hardcoded commands if no plugin found
    logger.info(`🔄 Using fallback commands for: ${command}`);
    
    switch (command) {
      case 'ping':
      case 'p':
        await conn.sendMessage(m.sender, { text: '🏓 Pong! (fallback)' });
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
🔌 *Plugins:* ${global.plugins ? Object.keys(global.plugins).length : 0}

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
        
      default:
        logger.warn(`❓ Unknown command: ${command}`);
        await conn.sendMessage(m.sender, { 
          text: `❓ Comando no encontrado: *${usedPrefix}${command}*\n\nUsa *${usedPrefix}menu* para ver los comandos disponibles.`
        });
    }
  } catch (error) {
    logger.error('Error processing command:', error);
  }
}
