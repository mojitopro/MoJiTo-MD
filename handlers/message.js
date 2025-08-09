
/**
 * Ultra-Fast Message handling and processing - Optimized for millisecond responses
 */
import { logger } from '../services/logger.js';
import { getMessageText, getMessageType } from '../utils/message-helpers.js';
import { speedOptimizer, GroupOptimizer } from '../core/speed-optimizer.js';
import chalk from 'chalk';

export function setupMessageHandler(conn) {
  if (!conn) {
    logger.error('❌ Connection not provided to message handler');
    return;
  }

  logger.info('📱 Setting up message handler...');
  
  // Listen to both events to ensure compatibility
  conn.ev.on('messages.upsert', async ({ messages, type }) => {
    await handleMessages(conn, messages, type);
  });
}

async function handleMessages(conn, messages, type) {
  try {
    if (type !== 'notify') return;
    
    // Process messages in parallel for maximum speed
    const processPromises = messages.map(async (message) => {
      if (!message.message) return;
      
      // Skip non-command messages from bot
      if (message.key.fromMe && !getMessageText(message.message).match(/^[./#!]/)) {
        return;
      }
      
      const startTime = process.hrtime.bigint();
      
      // Ultra-fast message object creation
      const m = {
        key: message.key,
        message: message.message,
        msg: message.message,
        pushName: message.pushName || 'Anónimo',
        sender: message.key.remoteJid,
        chat: message.key.remoteJid,
        isGroup: message.key.remoteJid.endsWith('@g.us'),
        text: getMessageText(message.message),
        mtype: getMessageType(message.message),
        mentionedJid: message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [],
        timestamp: Date.now()
      };
      
      // Ultra-fast command detection
      if (m.text) {
        const detected = speedOptimizer.detectCommand(m.text);
        if (detected) {
          console.log(`⚡ Ultra-fast command (${detected.responseTime.toFixed(2)}ms): ${detected.command} from ${m.pushName}`);
          await processUltraFastCommand(conn, m, detected);
          return;
        }
        
        // Process through plugin system for other commands
        if (global.prefix.test(m.text)) {
          await processCommand(conn, m);
          return;
        }
        
        // Smart auto-responses with youth touch
        await handleAutoResponses(conn, m);
      }
      
      const endTime = process.hrtime.bigint();
      const totalTime = Number(endTime - startTime) / 1000000;
      
      if (totalTime > 50) {
        logger.warn(`⚠️ Slow message processing: ${totalTime.toFixed(2)}ms`);
      }
    });
    
    await Promise.allSettled(processPromises);
    
  } catch (error) {
    logger.error('Error processing messages:', error);
  }
}

async function processUltraFastCommand(conn, m, detected) {
  try {
    const result = speedOptimizer.getInstantResponse(detected.category, detected.command);
    
    if (result) {
      if (m.isGroup) {
        await GroupOptimizer.optimizeGroupResponse(conn, m, result.response);
      } else {
        await conn.sendMessage(m.chat, { text: result.response });
      }
      
      console.log(`🚀 Ultra response: ${(detected.responseTime + result.responseTime).toFixed(2)}ms ${result.cached ? '(cached)' : '(generated)'}`);
    }
  } catch (error) {
    logger.error('Ultra-fast command error:', error);
  }
}

async function handleAutoResponses(conn, m) {
  const text = m.text.toLowerCase();
  const responses = {
    // Saludos juveniles
    'hola': '¡Ey qué tal! 👋✨ Soy tu bot favorito, usa .menu para ver la magia 🪄',
    'hi': 'Hey there! 🔥 Ready to rock? Try .menu 🎮',
    'buenos dias': '¡Buenos días champion! 🌅⚡ Que tengas un día genial, usa .menu 🚀',
    'buenas': '¡Buenas vibras! ✨🎯 ¿Qué tal si checas el .menu? 🎮',
    'test': '🧪 ¡Test exitoso! Sistema funcionando al 100% 💯\n⚡ Ultra velocidad activada\n🎮 Usa .menu para explorar',
    'bot': '🤖 ¡Presente! Soy MoJiTo, tu asistente ultra rápido ⚡\n🔥 Respuestas en milisegundos\n🎯 Usa .menu para ver todo lo que puedo hacer',
    'ping': '🏓 ¡Pong! Usa .ping para test completo de velocidad ⚡',
    'help': '🆘 ¡Aquí tienes ayuda! Usa .menu para ver todos los comandos 📋✨',
    'menu': '📋 ¡Perfecto! Usa .menu para ver el menú completo 🎮⚡'
  };
  
  for (const [trigger, response] of Object.entries(responses)) {
    if (text.includes(trigger)) {
      await conn.sendMessage(m.chat, { text: response });
      return;
    }
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
    
    // Check loaded plugins - FIXED command detection
    if (global.plugins && Object.keys(global.plugins).length > 0) {
      for (const [pluginName, plugin] of Object.entries(global.plugins)) {
        if (plugin.command && plugin.command.test(command)) {
          try {
            console.log(`🔌 Executing plugin: ${pluginName} for command: ${command}`);
            await plugin.handler(enhancedM, { conn, usedPrefix, command, args });
            return;
          } catch (error) {
            console.error(`❌ Plugin ${pluginName} error:`, error.message);
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
        const memUsage = process.memoryUsage();
        const info = `
🤖 *MoJiTo WhatsApp Bot*

📊 *Estado actual:*
• Estado: ${global.conn?.user ? '🟢 Conectado' : '🔴 Desconectado'}
• Tiempo activo: ${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m
• Memoria: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB
• Plugins: ${global.plugins ? Object.keys(global.plugins).length : 0} cargados

🔧 *Información técnica:*
• Versión: 2.0.0
• Node.js: ${process.version}
• Plataforma: ${process.platform}
• PID: ${process.pid}

👑 *Creado por:* Brian Martins
🌐 *Servidor HTTP:* Puerto 5000

💡 *Comandos disponibles:*
.ping - Latencia del bot
.status - Estado del sistema  
.memoria - Uso de memoria
.cpu - Info del procesador
.disco - Espacio en disco
.red - Información de red
.entorno - Variables del entorno
.uptime - Tiempo de actividad

✅ Sistema funcionando correctamente
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
