
/**
 * Message handling and processing
 */
import { logger } from '../services/logger.js';
// Temporarily disabled: import { printMessage, printBotEvent } from '../utils/print.js';
import { getMessageText, getMessageType } from '../utils/message-helpers.js';
import chalk from 'chalk';

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
    // Reduced spam - only log significant events
    if (type !== 'notify') return;
      
      for (const message of messages) {
        if (!message.message) continue;
        
        // Allow commands from bot owner, skip only non-command messages
        if (message.key.fromMe && !getMessageText(message.message).match(/^[./#!]/)) {
          continue;
        }
        
        // Enhanced message processing - basic version
        const m = {
          key: message.key,
          message: message.message,
          msg: message.message,
          pushName: message.pushName || 'Unknown',
          sender: message.key.remoteJid,
          chat: message.key.remoteJid,
          isGroup: message.key.remoteJid.endsWith('@g.us'),
          text: getMessageText(message.message),
          mtype: getMessageType(message.message),
          mentionedJid: message.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
        };
        
        // Basic console output (temporary)
        if (m.text && global.prefix.test(m.text)) {
          console.log(chalk.green('📨 ') + chalk.white(`Command: ${m.text} from ${m.pushName}`));
        } else if (m.text) {
          console.log(chalk.blue('💬 ') + chalk.gray(`Message from ${m.pushName}: ${m.text.slice(0, 50)}...`));
        }
        
        // Process commands
        if (m.text && global.prefix.test(m.text)) {
          try {
            await processCommand(conn, m);
          } catch (error) {
            logger.error('Command error:', error.message);
          }
        } else if (m.text) {
          // Auto-respond to greetings
          if (m.text.toLowerCase().includes('test') || m.text.toLowerCase().includes('hola')) {
            await conn.sendMessage(m.sender, { text: '👋 ¡Hola! Bot funcionando.\n\nComandos: .ping .info .menu' });
          }
        }
    }
  } catch (error) {
    logger.error('Error processing message:', error);
  }
}

// Message helpers moved to utils/message-helpers.js

async function processCommand(conn, m) {
  try {
    const prefixMatch = m.text.match(global.prefix);
    if (!prefixMatch) return;
    
    const usedPrefix = prefixMatch[0];
    const command = m.text.slice(usedPrefix.length).split(' ')[0].toLowerCase();
    const args = m.text.slice(usedPrefix.length + command.length).trim().split(' ').filter(Boolean);
    
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
    
    // Check loaded plugins
    if (global.plugins && Object.keys(global.plugins).length > 0) {
      for (const [pluginName, plugin] of Object.entries(global.plugins)) {
        if (plugin.command && plugin.command.test(command)) {
          try {
            await plugin.handler(enhancedM, { conn, usedPrefix, command, args });
            return;
          } catch (error) {
            logger.debug(`Plugin ${pluginName} error:`, error.message);
          }
        }
      }
    }
    
    // Fallback to hardcoded commands if no plugin found
    
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
