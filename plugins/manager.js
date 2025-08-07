/**
 * Plugin Manager
 * Runtime plugin management and control
 */
import { logger } from '../services/logger.js';
import { authManager } from '../core/auth.js';

export class PluginManager {
  constructor() {
    this.hooks = new Map();
    this.middleware = [];
  }

  /**
   * Enable a plugin
   */
  enablePlugin(pluginName, adminId) {
    try {
      if (!authManager.isOwner(adminId)) {
        return { success: false, message: 'Solo el propietario puede habilitar plugins' };
      }
      
      const plugin = global.plugins[pluginName];
      if (!plugin) {
        return { success: false, message: 'Plugin no encontrado' };
      }
      
      if (!plugin.disabled) {
        return { success: false, message: 'Plugin ya está habilitado' };
      }
      
      plugin.disabled = false;
      logger.plugin(pluginName, 'enabled', 'success');
      
      return { 
        success: true, 
        message: `Plugin '${pluginName}' habilitado` 
      };
      
    } catch (error) {
      logger.error('Error enabling plugin:', error);
      return { success: false, message: 'Error al habilitar plugin' };
    }
  }

  /**
   * Disable a plugin
   */
  disablePlugin(pluginName, adminId) {
    try {
      if (!authManager.isOwner(adminId)) {
        return { success: false, message: 'Solo el propietario puede deshabilitar plugins' };
      }
      
      const plugin = global.plugins[pluginName];
      if (!plugin) {
        return { success: false, message: 'Plugin no encontrado' };
      }
      
      if (plugin.disabled) {
        return { success: false, message: 'Plugin ya está deshabilitado' };
      }
      
      plugin.disabled = true;
      logger.plugin(pluginName, 'disabled', 'success');
      
      return { 
        success: true, 
        message: `Plugin '${pluginName}' deshabilitado` 
      };
      
    } catch (error) {
      logger.error('Error disabling plugin:', error);
      return { success: false, message: 'Error al deshabilitar plugin' };
    }
  }

  /**
   * Get plugin information
   */
  getPluginInfo(pluginName) {
    const plugin = global.plugins[pluginName];
    if (!plugin) return null;
    
    return {
      name: pluginName,
      enabled: !plugin.disabled,
      loadedAt: plugin.loadedAt,
      commands: this.getPluginCommands(plugin),
      permissions: {
        owner: plugin.owner || false,
        admin: plugin.admin || false,
        premium: plugin.premium || false,
        group: plugin.group || false,
        private: plugin.private || false
      },
      cooldown: plugin.cooldown || 0,
      description: plugin.help || 'Sin descripción'
    };
  }

  /**
   * Get all plugins with their status
   */
  getAllPlugins() {
    const plugins = [];
    
    for (const [name, plugin] of Object.entries(global.plugins)) {
      plugins.push({
        name,
        enabled: !plugin.disabled,
        commands: this.getPluginCommands(plugin),
        category: this.getPluginCategory(plugin)
      });
    }
    
    return plugins.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get plugins by category
   */
  getPluginsByCategory() {
    const categories = {
      owner: [],
      admin: [],
      premium: [],
      utility: [],
      fun: [],
      media: [],
      other: []
    };
    
    for (const [name, plugin] of Object.entries(global.plugins)) {
      const category = this.getPluginCategory(plugin);
      categories[category].push({
        name,
        enabled: !plugin.disabled,
        commands: this.getPluginCommands(plugin)
      });
    }
    
    return categories;
  }

  /**
   * Register plugin hook
   */
  registerHook(event, callback) {
    if (!this.hooks.has(event)) {
      this.hooks.set(event, []);
    }
    
    this.hooks.get(event).push(callback);
  }

  /**
   * Execute plugin hooks
   */
  async executeHooks(event, data) {
    const hooks = this.hooks.get(event) || [];
    
    for (const hook of hooks) {
      try {
        await hook(data);
      } catch (error) {
        logger.error(`Hook error for event ${event}:`, error);
      }
    }
  }

  /**
   * Add middleware
   */
  addMiddleware(middleware) {
    this.middleware.push(middleware);
  }

  /**
   * Execute middleware chain
   */
  async executeMiddleware(context, next) {
    let index = 0;
    
    const dispatch = async (i) => {
      if (i >= this.middleware.length) {
        return next();
      }
      
      const middleware = this.middleware[i];
      return middleware(context, () => dispatch(i + 1));
    };
    
    return dispatch(0);
  }

  /**
   * Get plugin commands
   */
  getPluginCommands(plugin) {
    const commands = [];
    
    if (plugin.command) {
      if (typeof plugin.command === 'string') {
        commands.push(plugin.command);
      } else if (Array.isArray(plugin.command)) {
        commands.push(...plugin.command);
      }
    }
    
    if (plugin.alias) {
      commands.push(...plugin.alias);
    }
    
    return commands;
  }

  /**
   * Get plugin category
   */
  getPluginCategory(plugin) {
    if (plugin.owner) return 'owner';
    if (plugin.admin) return 'admin';
    if (plugin.premium) return 'premium';
    if (plugin.tags?.includes('media')) return 'media';
    if (plugin.tags?.includes('fun')) return 'fun';
    if (plugin.tags?.includes('utility')) return 'utility';
    
    return 'other';
  }

  /**
   * Search plugins by command or name
   */
  searchPlugins(query) {
    const results = [];
    const searchTerm = query.toLowerCase();
    
    for (const [name, plugin] of Object.entries(global.plugins)) {
      if (plugin.disabled) continue;
      
      // Search in plugin name
      if (name.toLowerCase().includes(searchTerm)) {
        results.push({ name, type: 'name', plugin });
        continue;
      }
      
      // Search in commands
      const commands = this.getPluginCommands(plugin);
      const matchedCommand = commands.find(cmd => 
        cmd.toLowerCase().includes(searchTerm)
      );
      
      if (matchedCommand) {
        results.push({ name, type: 'command', command: matchedCommand, plugin });
        continue;
      }
      
      // Search in description
      if (plugin.help && plugin.help.toLowerCase().includes(searchTerm)) {
        results.push({ name, type: 'description', plugin });
      }
    }
    
    return results;
  }

  /**
   * Get plugin statistics
   */
  getStats() {
    const plugins = Object.values(global.plugins);
    
    return {
      total: plugins.length,
      enabled: plugins.filter(p => !p.disabled).length,
      disabled: plugins.filter(p => p.disabled).length,
      byCategory: this.getCategoryStats(plugins),
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  getCategoryStats(plugins) {
    return {
      owner: plugins.filter(p => p.owner).length,
      admin: plugins.filter(p => p.admin).length,
      premium: plugins.filter(p => p.premium).length,
      group: plugins.filter(p => p.group).length,
      private: plugins.filter(p => p.private).length
    };
  }

  estimateMemoryUsage() {
    // Simple estimation based on plugin count and average size
    const pluginCount = Object.keys(global.plugins).length;
    const averageSize = 50 * 1024; // 50KB per plugin estimate
    
    return {
      estimated: pluginCount * averageSize,
      formatted: this.formatBytes(pluginCount * averageSize)
    };
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const pluginManager = new PluginManager();
