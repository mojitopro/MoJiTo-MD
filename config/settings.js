/**
 * Global Settings Configuration
 * Central configuration management for the bot
 */
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { watchFile, unwatchFile } from 'fs';
import { createRequire } from 'module';
import { platform } from 'process';
import { pathToFileURL } from 'url';
import chalk from 'chalk';
import yargs from 'yargs';
import { logger } from '../services/logger.js';
import { API_CONFIG, API_KEYS } from './apis.js';
import { BOT_CONFIG, DB_SCHEMA } from './constants.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

export async function setupGlobalVariables() {
  try {
    logger.info('Setting up global variables...');
    
    // Setup file path utilities
    setupPathUtilities();
    
    // Setup API configuration
    setupAPIConfig();
    
    // Setup bot configuration
    setupBotConfig();
    
    // Setup command line options
    setupCommandLineOptions();
    
    // Setup environment variables
    setupEnvironmentVariables();
    
    // Watch config file for changes
    watchConfigFile();
    
    logger.success('Global variables configured');
    
  } catch (error) {
    logger.error('Failed to setup global variables:', error);
    throw error;
  }
}

function setupPathUtilities() {
  global.__filename = (pathURL = import.meta.url, rmPrefix = platform !== 'win32') =>
    rmPrefix ? (/file:\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL) : pathToFileURL(pathURL).toString();
  
  global.__dirname = () => __dirname;
  global.__require = require;
}

function setupAPIConfig() {
  global.APIs = API_CONFIG;
  global.APIKeys = API_KEYS;
  
  global.API = (name, path = '/', query = {}, apikeyqueryname) => {
    const baseURL = name in global.APIs ? global.APIs[name] : name;
    const params = {
      ...query,
      ...(apikeyqueryname ? { [apikeyqueryname]: global.APIKeys[baseURL] } : {})
    };
    
    const queryString = Object.keys(params).length ? '?' + new URLSearchParams(params) : '';
    return baseURL + path + queryString;
  };
}

function setupBotConfig() {
  // Bot identification
  global.packname = BOT_CONFIG.sticker.packname;
  global.author = BOT_CONFIG.sticker.author;
  global.wm = BOT_CONFIG.watermark;
  global.igfg = BOT_CONFIG.instagram;
  global.wait = BOT_CONFIG.messages.wait;
  
  // Bot behavior
  global.multiplier = BOT_CONFIG.multiplier;
  global.rpg = BOT_CONFIG.rpg;
  
  // Owner and permissions
  global.owner = BOT_CONFIG.owners;
  global.mods = BOT_CONFIG.moderators;
  global.prems = BOT_CONFIG.premium;
  
  // Additional global variables
  global.vs = BOT_CONFIG.version;
  global.botname = BOT_CONFIG.botname;
  global.gt = BOT_CONFIG.thanks;
  
  // Images and media
  try {
    const fs = require('fs');
    global.imagen1 = fs.existsSync('./Menu2.jpg') ? fs.readFileSync('./Menu2.jpg') : null;
    global.imagen2 = fs.existsSync('./src/newbot.jpg') ? fs.readFileSync('./src/newbot.jpg') : null;
    global.imagen3 = fs.existsSync('./src/Tilin.gif') ? fs.readFileSync('./src/Tilin.gif') : null;
  } catch (error) {
    logger.warn('Some image files not found, using defaults');
    global.imagen1 = null;
    global.imagen2 = null;
    global.imagen3 = null;
  }
}

function setupCommandLineOptions() {
  global.opts = yargs(process.argv.slice(2)).exitProcess(false).parse();
  
  // Setup prefix regex - CORREGIDO para compatibilidad total
  global.prefix = /^[.!/#$%+€£¢¥^°=¶∆×÷π√✓©®:;?&-]/;
  global.owner = ['5521989050540']; // Tu número como owner
  
  logger.debug(`Command prefix pattern: ${global.prefix}`);
}

function setupEnvironmentVariables() {
  // Set up timestamp
  global.timestamp = { start: new Date() };
  
  // Database configuration will be handled by database service
  // Connection configuration will be handled by connection service
}

function watchConfigFile() {
  const configFile = fileURLToPath(import.meta.url);
  
  watchFile(configFile, () => {
    unwatchFile(configFile);
    logger.info(chalk.yellow('Config file updated, reloading...'));
    
    // Clear require cache
    delete require.cache[require.resolve('./constants.js')];
    delete require.cache[require.resolve('./apis.js')];
    
    // Reload configuration
    import(`${configFile}?update=${Date.now()}`).catch(error => {
      logger.error('Failed to reload config:', error);
    });
  });
}

export function getGlobalConfig() {
  return {
    apis: global.APIs,
    apiKeys: global.APIKeys,
    owners: global.owner,
    moderators: global.mods,
    premium: global.prems,
    prefix: global.prefix,
    packname: global.packname,
    author: global.author,
    watermark: global.wm
  };
}
