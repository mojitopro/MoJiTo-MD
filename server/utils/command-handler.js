// Command Handler - Procesador de comandos para el bot
const fs = require('fs');
const path = require('path');

class CommandHandler {
  constructor() {
    this.commands = new Map();
    this.prefixes = ['.', '/', '#'];
    this.plugins = [];
    this.loadPlugins();
  }

  loadPlugins() {
    try {
      const pluginsDir = path.join(__dirname, '../plugins');
      
      // Cargar RVU plugin
      const RVUPlugin = require('../plugins/rvu.js');
      const rvuPlugin = new RVUPlugin();
      this.registerPlugin(rvuPlugin);
      
      console.log('🔌 Plugins cargados:');
      console.log(`   ✅ RVU - Descarga de videos`);
      
    } catch (error) {
      console.error('❌ Error cargando plugins:', error.message);
    }
  }

  registerPlugin(plugin) {
    this.plugins.push(plugin);
    
    if (plugin.commands) {
      plugin.commands.forEach(cmd => {
        this.commands.set(cmd.toLowerCase(), plugin);
      });
    }
  }

  async processMessage(sock, message) {
    try {
      if (!message.message) return false;

      const messageText = this.extractMessageText(message);
      if (!messageText) return false;

      const commandData = this.parseCommand(messageText);
      if (!commandData) return false;

      const plugin = this.commands.get(commandData.command);
      if (!plugin) {
        // Comando no reconocido - responder con lista de comandos
        console.log(`❓ Comando desconocido: ${commandData.command}`);
        await this.sendHelpMessage(sock, message);
        return false;
      }

      console.log(`⚡ Ejecutando comando: ${commandData.command} con args: [${commandData.args.join(', ')}]`);
      
      await plugin.execute(sock, message, commandData.args);
      return true;

    } catch (error) {
      console.error('❌ Error procesando comando:', error.message);
      return false;
    }
  }

  async sendHelpMessage(sock, message) {
    try {
      let helpText = '❓ *Comando no reconocido*\n\n';
      helpText += '📋 *Comandos disponibles:*\n\n';
      
      this.plugins.forEach(plugin => {
        helpText += `🔌 *${plugin.name.toUpperCase()}*\n`;
        helpText += `📝 ${plugin.description}\n`;
        if (plugin.commands) {
          helpText += `💬 Comandos: ${plugin.commands.join(', ')}\n\n`;
        }
      });

      await sock.sendMessage(message.key.remoteJid, {
        text: helpText
      });
    } catch (error) {
      console.error('❌ Error enviando ayuda:', error);
    }
  }

  extractMessageText(message) {
    // Extraer texto del mensaje
    if (message.message.conversation) {
      return message.message.conversation;
    }
    
    if (message.message.extendedTextMessage?.text) {
      return message.message.extendedTextMessage.text;
    }

    if (message.message.imageMessage?.caption) {
      return message.message.imageMessage.caption;
    }

    if (message.message.videoMessage?.caption) {
      return message.message.videoMessage.caption;
    }

    return null;
  }

  parseCommand(text) {
    // Verificar si el mensaje empieza con un prefijo válido
    const firstChar = text.charAt(0);
    if (!this.prefixes.includes(firstChar)) {
      return null;
    }

    // Dividir el texto en comando y argumentos
    const parts = text.slice(1).trim().split(/\s+/);
    if (parts.length === 0) return null;

    const command = firstChar + parts[0].toLowerCase();
    const args = parts.slice(1);

    return { command, args };
  }

  listCommands() {
    console.log('\n📋 Comandos disponibles:');
    
    this.plugins.forEach(plugin => {
      console.log(`\n🔌 ${plugin.name.toUpperCase()}`);
      console.log(`   📝 ${plugin.description}`);
      
      if (plugin.commands) {
        console.log(`   💬 Comandos: ${plugin.commands.join(', ')}`);
      }
    });
    
    console.log('\n');
  }

  getStats() {
    return {
      totalPlugins: this.plugins.length,
      totalCommands: this.commands.size,
      prefixes: this.prefixes
    };
  }
}

module.exports = CommandHandler;