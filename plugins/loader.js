/**
 * Plugin loading system
 */
import { readdirSync } from 'fs';
import { join } from 'path';
import { logger } from '../services/logger.js';

export async function loadPlugins() {
  const plugins = [];

  try {
    const pluginDir = join(process.cwd(), 'plugins');
    const files = readdirSync(pluginDir).filter(file => 
      file.endsWith('.js') && 
      !file.startsWith('loader') && 
      !file.startsWith('manager')
    );

    for (const file of files) {
      try {
        const pluginPath = join(pluginDir, file);
        const plugin = await import(`file://${pluginPath}?t=${Date.now()}`);

        if (plugin.handler || plugin.before || plugin.all) {
          plugins.push(file.replace('.js', ''));
          logger.debug(`Loaded plugin: ${file}`);
        }
      } catch (error) {
        logger.warn(`Failed to load plugin ${file}:`, error.message);
      }
    }

    return plugins;

  } catch (error) {
    logger.error('Error loading plugins:', error);
    return [];
  }
}