/**
 * Command Execution Handler
 * Routes and executes bot commands
 */
import { logger } from '../services/logger.js';
import { cache } from '../services/cache.js';

export async function executeCommand(msg, conn, permissions) {
  const startTime = Date.now();
  
  try {
    // Extract command and arguments
    const { command, args, usedPrefix } = parseCommand(msg.text);
    
    if (!command) return;
    
    // Find matching plugin
    const plugin = findPlugin(command);
    
    if (!plugin) {
      await handleUnknownCommand(msg, command);
      return;
    }
    
    // Check command permissions
    if (!checkCommandPermissions(plugin, permissions)) {
      await msg.reply('❌ No tienes permisos para usar este comando');
      return;
    }
    
    // Check command cooldown
    if (!checkCooldown(msg.sender, command, plugin)) {
      await msg.reply('⏳ Debes esperar antes de usar este comando nuevamente');
      return;
    }
    
    // Execute command
    await runCommand(plugin, msg, { conn, args, usedPrefix, command, permissions });
    
    // Log command execution
    const duration = Date.now() - startTime;
    logger.command(msg.sender, command, msg.chat);
    logger.performance(`Command: ${command}`, duration);
    
  } catch (error) {
    logger.error(`Error executing command:`, error);
    await msg.reply('❌ Error al ejecutar el comando');
  }
}

function parseCommand(text) {
  const prefixMatch = text.match(global.prefix);
  if (!prefixMatch) return { command: null };
  
  const usedPrefix = prefixMatch[0];
  const noPrefix = text.slice(usedPrefix.length);
  const [command, ...args] = noPrefix.trim().split(/\s+/);
  
  return {
    command: command.toLowerCase(),
    args,
    usedPrefix
  };
}

function findPlugin(command) {
  for (const pluginName in global.plugins) {
    const plugin = global.plugins[pluginName];
    
    if (!plugin || plugin.disabled) continue;
    
    // Check main command
    if (plugin.command && 
        (typeof plugin.command === 'string' ? plugin.command === command : 
         plugin.command.includes(command))) {
      return { ...plugin, name: pluginName };
    }
    
    // Check aliases
    if (plugin.alias && plugin.alias.includes(command)) {
      return { ...plugin, name: pluginName };
    }
    
    // Check regex pattern
    if (plugin.customPrefix instanceof RegExp && plugin.customPrefix.test(command)) {
      return { ...plugin, name: pluginName };
    }
  }
  
  return null;
}

function checkCommandPermissions(plugin, permissions) {
  // Owner only commands
  if (plugin.owner && !permissions.isOwner) return false;
  
  // Moderator only commands
  if (plugin.mods && !permissions.isModerator) return false;
  
  // Premium only commands
  if (plugin.premium && !permissions.isPremium) return false;
  
  // Group admin only commands
  if (plugin.admin && !permissions.isGroupAdmin) return false;
  
  // Bot admin required commands
  if (plugin.botAdmin && !permissions.isBotAdmin) return false;
  
  // Group only commands
  if (plugin.group && !msg.isGroup) return false;
  
  // Private only commands
  if (plugin.private && msg.isGroup) return false;
  
  return true;
}

function checkCooldown(userId, command, plugin) {
  if (!plugin.cooldown) return true;
  
  const cooldownKey = `cooldown_${userId}_${command}`;
  const lastUsed = cache.get(cooldownKey);
  
  if (lastUsed && Date.now() - lastUsed < plugin.cooldown) {
    return false;
  }
  
  cache.set(cooldownKey, Date.now(), plugin.cooldown);
  return true;
}

async function runCommand(plugin, msg, context) {
  try {
    // Check if plugin has a handler function
    if (typeof plugin.handler === 'function') {
      await plugin.handler.call(context, msg, context);
    } else if (typeof plugin === 'function') {
      await plugin.call(context, msg, context);
    } else {
      throw new Error('Plugin has no valid handler');
    }
    
  } catch (error) {
    logger.error(`Error in plugin ${plugin.name}:`, error);
    
    // Send error to developers if configured
    await notifyDevelopers(error, plugin.name, msg);
    
    throw error;
  }
}

async function handleUnknownCommand(msg, command) {
  // Could implement command suggestions here
  const suggestions = findSimilarCommands(command);
  
  let response = `❓ Comando "${command}" no encontrado.`;
  
  if (suggestions.length > 0) {
    response += `\n\n¿Quisiste decir?\n${suggestions.map(s => `• ${s}`).join('\n')}`;
  }
  
  response += '\n\nUsa `/menu` para ver todos los comandos disponibles.';
  
  await msg.reply(response);
}

function findSimilarCommands(command) {
  const commands = [];
  
  for (const pluginName in global.plugins) {
    const plugin = global.plugins[pluginName];
    
    if (!plugin || plugin.disabled) continue;
    
    if (plugin.command) {
      if (typeof plugin.command === 'string') {
        commands.push(plugin.command);
      } else {
        commands.push(...plugin.command);
      }
    }
    
    if (plugin.alias) {
      commands.push(...plugin.alias);
    }
  }
  
  // Simple similarity check
  return commands
    .filter(cmd => {
      const similarity = calculateSimilarity(command, cmd);
      return similarity > 0.6;
    })
    .slice(0, 3);
}

function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

async function notifyDevelopers(error, pluginName, msg) {
  try {
    const developers = global.owner?.filter(([number, name, isDev]) => isDev) || [];
    
    for (const [number] of developers) {
      const developerId = number + '@s.whatsapp.net';
      
      try {
        const data = (await global.conn.onWhatsApp(developerId))[0];
        
        if (data?.exists) {
          await global.conn.sendMessage(developerId, {
            text: `🐛 *Error en Plugin*\n\n` +
                  `*Plugin:* ${pluginName}\n` +
                  `*Usuario:* ${msg.sender}\n` +
                  `*Comando:* ${msg.text}\n` +
                  `*Chat:* ${msg.chat}\n\n` +
                  `*Error:*\n\`\`\`${error.stack || error.message}\`\`\``
          });
        }
      } catch (notifyError) {
        logger.debug('Failed to notify developer:', notifyError);
      }
    }
    
  } catch (error) {
    logger.debug('Error notifying developers:', error);
  }
}
