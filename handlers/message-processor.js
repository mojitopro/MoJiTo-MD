/**
 * PROCESADOR DE MENSAJES ULTRA RÁPIDO
 * Compatible con el sistema MoJiTo existente
 */
import { logger } from '../services/logger.js';
import { getMessageText, getMessageType, extractCommand } from '../utils/message-helpers.js';

// Variables globales de rendimiento
const startTime = Date.now();
let messageCount = 0;

/**
 * Procesar mensaje recibido
 */
export async function processMessage(conn, message) {
  try {
    messageCount++;
    
    if (!message || !message.message || message.key.fromMe) return;
    
    const text = getMessageText(message.message);
    if (!text) return;
    
    // Crear objeto mensaje compatible
    const m = {
      key: message.key,
      message: message.message,
      pushName: message.pushName || 'Usuario',
      sender: message.key.remoteJid,
      chat: message.key.remoteJid,
      isGroup: message.key.remoteJid.endsWith('@g.us'),
      text: text,
      mtype: getMessageType(message.message),
      mentionedJid: message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [],
      timestamp: Date.now()
    };
    
    // Detectar si es comando
    if (isCommand(text)) {
      const cmdStart = process.hrtime.bigint();
      
      await executeCommand(conn, m, text);
      
      const cmdTime = Number(process.hrtime.bigint() - cmdStart) / 1000000;
      console.log(`⚡ Comando ejecutado en ${cmdTime.toFixed(2)}ms: ${text.split(' ')[0]}`);
    }
    
  } catch (error) {
    logger.debug('Error procesando mensaje:', error.message);
  }
}

/**
 * Verificar si el texto es un comando
 */
function isCommand(text) {
  const prefixes = ['.', '/', '!', '#'];
  return prefixes.some(prefix => text.startsWith(prefix));
}

/**
 * Ejecutar comando usando el sistema de plugins
 */
async function executeCommand(conn, m, text) {
  try {
    const cmdInfo = extractCommand(text);
    if (!cmdInfo) return;
    
    const { command, args, usedPrefix } = cmdInfo;
    
    // Buscar plugin que maneja este comando
    const plugin = findPluginForCommand(command);
    
    if (plugin) {
      // Preparar contexto completo para el plugin
      const context = {
        conn,
        m,
        usedPrefix,
        command,
        args,
        text: m.text,
        isGroup: m.isGroup,
        sender: m.sender,
        pushName: m.pushName,
        quoted: m.quoted,
        mentionedJid: m.mentionedJid
      };
      
      // Ejecutar el handler del plugin
      if (plugin.handler) {
        await plugin.handler(context);
      }
    } else {
      // Comando no encontrado - respuesta sutil
      console.log(`🔍 Comando no encontrado: ${command}`);
    }
    
  } catch (error) {
    logger.error('Error ejecutando comando:', error.message);
    // Enviar mensaje de error al usuario
    if (conn && m.chat) {
      try {
        await conn.sendMessage(m.chat, { 
          text: '❌ Error procesando comando. Intenta de nuevo.' 
        });
      } catch (sendError) {
        logger.debug('Error enviando mensaje de error:', sendError.message);
      }
    }
  }
}

/**
 * Buscar plugin que maneja un comando específico
 */
function findPluginForCommand(commandName) {
  if (!global.plugins) return null;
  
  for (const [pluginName, plugin] of Object.entries(global.plugins)) {
    if (!plugin.command) continue;
    
    // Si command es RegExp
    if (plugin.command instanceof RegExp) {
      if (plugin.command.test(commandName)) {
        return plugin;
      }
    }
    // Si command es string
    else if (typeof plugin.command === 'string') {
      if (plugin.command === commandName) {
        return plugin;
      }
    }
    // Si command es array
    else if (Array.isArray(plugin.command)) {
      if (plugin.command.includes(commandName)) {
        return plugin;
      }
    }
    
    // Verificar comandos alternativos en help array
    if (plugin.help && Array.isArray(plugin.help)) {
      if (plugin.help.includes(commandName)) {
        return plugin;
      }
    }
    
    // Verificar aliases
    if (plugin.aliases && plugin.aliases.includes(commandName)) {
      return plugin;
    }
  }
  
  return null;
}

/**
 * Obtener estadísticas de rendimiento
 */
export function getPerformanceStats() {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  const avgMessagesPerSecond = uptime > 0 ? (messageCount / uptime).toFixed(2) : 0;
  
  return {
    uptime: uptime,
    messageCount: messageCount,
    avgMessagesPerSecond: avgMessagesPerSecond,
    pluginCount: Object.keys(global.plugins || {}).length
  };
}