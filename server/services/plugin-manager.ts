import { WAMessage, WASocket } from '@whiskeysockets/baileys';
import { User, Plugin } from '@shared/schema';
import { storage } from '../storage';
import { print } from '../utils/print';
import { logger } from '../utils/logger';
import chalk from 'chalk';

// Import MoJiTo-MD plugins
import playPlugin from '../plugins/play-optimized';
import loadMessagePlugin from '../plugins/loadmessage';
import rvuPlugin from '../plugins/rvu';

interface PluginInterface {
  name: string;
  description: string;
  version: string;
  initialize(): Promise<void>;
  processMessage(message: WAMessage, sock: WASocket, user: User): Promise<void>;
  shutdown(): Promise<void>;
}

interface MoJiToPlugin {
  command?: RegExp | boolean;
  customPrefix?: RegExp;
  handler: (m: WAMessage, context: any) => Promise<void>;
  help: string[];
  tags: string[];
  description: string;
}

export class PluginManager {
  private loadedPlugins: Map<string, PluginInterface> = new Map();
  private mojitPlugins: Map<string, MoJiToPlugin> = new Map();

  async loadPlugins(): Promise<void> {
    // Load MoJiTo-MD style plugins
    this.loadMoJiToPlugins();

    const plugins = await storage.getEnabledPlugins();
    let loadedCount = 0;
    let failedPlugins: string[] = [];

    for (const plugin of plugins) {
      try {
        await this.loadPlugin(plugin);
        loadedCount++;
      } catch (error) {
        failedPlugins.push(plugin.name);
        print.error(`Error cargando plugin ${plugin.name}: ${error}`);
      }
    }

    // Use a simple message instead of banner-style for plugin loading
      console.log(chalk.cyan(`🔧 ${plugins.length} plugins cargados correctamente`));


    if (failedPlugins.length > 0) {
      print.warn(`Plugins con errores: ${failedPlugins.join(', ')}`);
    }
  }

  private loadMoJiToPlugins(): void {
    // Load the three specific MoJiTo-MD plugins
    this.mojitPlugins.set('play', playPlugin);
    this.mojitPlugins.set('loadmessage', loadMessagePlugin);
    this.mojitPlugins.set('rvu', rvuPlugin);
  }

  private async loadPlugin(pluginData: Plugin): Promise<void> {
    try {
      // In a real implementation, these would be loaded from separate files
      const plugin = this.createBuiltinPlugin(pluginData);

      if (plugin) {
        await plugin.initialize();
        this.loadedPlugins.set(pluginData.name, plugin);
      }
    } catch (error) {
      print.error(`Error loading plugin ${pluginData.name}: ${error}`);
    }
  }

  private createBuiltinPlugin(pluginData: Plugin): PluginInterface | null {
    switch (pluginData.name) {
      case 'anti-spam':
        return new AntiSpamPlugin();
      case 'welcome-message':
        return new WelcomeMessagePlugin();
      case 'auto-responder':
        return new AutoResponderPlugin();
      default:
        return null;
    }
  }

  async processMessage(message: WAMessage, sock: WASocket, user: User): Promise<void> {
    // Process MoJiTo-MD style plugins first
    await this.processMoJiToPlugins(message, sock);

    // Then process traditional plugins
    for (const [name, plugin] of Array.from(this.loadedPlugins.entries())) {
      try {
        await plugin.processMessage(message, sock, user);
      } catch (error) {
        print.error(`Error in plugin ${name}: ${error}`);
      }
    }
  }

  private async processMoJiToPlugins(message: WAMessage, sock: WASocket): Promise<void> {
    const text = message.message?.conversation ||
                 message.message?.extendedTextMessage?.text || '';

    if (!text) return;

    // Check for command-based plugins
    for (const [name, plugin] of Array.from(this.mojitPlugins.entries())) {
      try {
        let shouldExecute = false;
        let commandText = '';

        if (plugin.command && plugin.command instanceof RegExp) {
          const prefixes = ['.', '/', '#'];
          for (const prefix of prefixes) {
            if (text.startsWith(prefix)) {
              const cmd = text.slice(prefix.length).split(' ')[0];
              if (plugin.command.test(cmd)) {
                shouldExecute = true;
                commandText = text.slice(prefix.length + cmd.length).trim();
                break;
              }
            }
          }
        }

        if (plugin.customPrefix && plugin.customPrefix.test(text)) {
          shouldExecute = true;
          commandText = text;
        }

        if (shouldExecute) {
          console.log(`🔌 Plugin ejecutado: ${name} | Comando: ${text}`);
          await plugin.handler(message, {
            conn: sock,
            text: commandText,
            command: name
          });
          return; // Exit after handling plugin
        }
      } catch (error) {
        print.error(`Error in MoJiTo plugin ${name}: ${error}`);
      }
    }
  }

  async reloadPlugin(pluginName: string): Promise<boolean> {
    try {
      const plugin = this.loadedPlugins.get(pluginName);
      if (plugin) {
        await plugin.shutdown();
        this.loadedPlugins.delete(pluginName);
      }

      const pluginData = await storage.getPlugin(pluginName);
      if (pluginData && pluginData.isEnabled) {
        await this.loadPlugin(pluginData);
        return true;
      }
      return false;
    } catch (error) {
      logger.error(`Error reloading plugin ${pluginName}:`, error);
      return false;
    }
  }

  async unloadPlugin(pluginName: string): Promise<void> {
    const plugin = this.loadedPlugins.get(pluginName);
    if (plugin) {
      await plugin.shutdown();
      this.loadedPlugins.delete(pluginName);
      logger.info(`Plugin ${pluginName} unloaded`);
    }
  }

  getLoadedPlugins(): string[] {
    return Array.from(this.loadedPlugins.keys());
  }
}

// Built-in plugins

class AntiSpamPlugin implements PluginInterface {
  name = 'anti-spam';
  description = 'Anti-spam protection for groups';
  version = '1.5.0';

  private userMessageCount: Map<string, { count: number; lastReset: number }> = new Map();

  async initialize(): Promise<void> {
    // Silent initialization
  }

  async processMessage(message: WAMessage, sock: WASocket, user: User): Promise<void> {
    const groupId = message.key.remoteJid;
    if (!groupId?.includes('@g.us')) return; // Only process group messages

    const group = await storage.getGroup(groupId);
    if (!group?.antiSpam) return;

    const userId = message.key.participant || message.key.remoteJid!;
    const now = Date.now();
    const userStats = this.userMessageCount.get(userId);

    if (!userStats || now - userStats.lastReset > 60000) { // Reset every minute
      this.userMessageCount.set(userId, { count: 1, lastReset: now });
      return;
    }

    userStats.count++;

    if (userStats.count > 10) { // More than 10 messages per minute
      await sock.sendMessage(groupId, {
        text: `⚠️ @${userId.split('@')[0]} detectado spam. Por favor, reduce la frecuencia de mensajes.`,
        mentions: [userId],
      });

      // Reset counter after warning
      userStats.count = 0;
      userStats.lastReset = now;
    }
  }

  async shutdown(): Promise<void> {
    this.userMessageCount.clear();
  }
}

class WelcomeMessagePlugin implements PluginInterface {
  name = 'welcome-message';
  description = 'Welcome messages for new group members';
  version = '1.0.0';

  async initialize(): Promise<void> {
    // Silent initialization
  }

  async processMessage(message: WAMessage, sock: WASocket, user: User): Promise<void> {
    // This plugin is handled in the main bot for group participant events
  }

  async shutdown(): Promise<void> {
    // Nothing to clean up
  }
}

class AutoResponderPlugin implements PluginInterface {
  name = 'auto-responder';
  description = 'Automatic responses for common messages';
  version = '1.0.0';

  private responses = new Map([
    ['hola', '¡Hola! 👋 Soy MoJiTo-MD, tu bot favorito. Usa /menu para ver mis comandos.'],
    ['gracias', '¡De nada! 😊 Siempre aquí para ayudar.'],
    ['bot', '🤖 Sí, soy un bot. ¿Necesitas ayuda? Usa /help'],
    ['bailalo rocky', '🎶 ¡Bailalo Rocky! 🎶 ¡Esa es mi canción favorita!'],
  ]);

  async initialize(): Promise<void> {
    // Silent initialization
  }

  async processMessage(message: WAMessage, sock: WASocket, user: User): Promise<void> {
    const content = this.extractMessageContent(message)?.toLowerCase();
    if (!content) return;

    for (const [trigger, response] of Array.from(this.responses.entries())) {
      if (content.includes(trigger)) {
        await sock.sendMessage(message.key.remoteJid!, { text: response });
        break; // Only respond to the first match
      }
    }
  }

  private extractMessageContent(message: WAMessage): string | null {
    if (message.message?.conversation) {
      return message.message.conversation;
    }
    if (message.message?.extendedTextMessage?.text) {
      return message.message.extendedTextMessage.text;
    }
    return null;
  }

  async shutdown(): Promise<void> {
    // Nothing to clean up
  }
}