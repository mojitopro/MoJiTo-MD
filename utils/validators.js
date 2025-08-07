/**
 * Validation Utilities
 * Input validation and environment checking
 */
import { existsSync } from 'fs';
import { spawn } from 'child_process';
import { logger } from '../services/logger.js';

/**
 * Validate environment and dependencies
 */
export async function validateEnvironment() {
  logger.info('Validating environment...');
  
  try {
    // Only do essential checks that won't cause blocking issues
    checkNodeVersion();
    checkRequiredDirectories();
    
    // Initialize global support object with default values
    global.support = {
      ffmpeg: false,
      ffprobe: false,
      convert: false,
      magick: false
    };
    
    logger.success('Environment validation passed');
  } catch (error) {
    logger.error('Environment validation failed:', error.message);
    throw error;
  }
}

/**
 * Check Node.js version
 */
function checkNodeVersion() {
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0]);
  
  if (major < 16) {
    throw new Error(`Node.js version ${version} is not supported. Please use Node.js 16 or higher.`);
  }
  
  logger.debug(`Node.js version: ${version} ✓`);
}

/**
 * Check required directories exist
 */
function checkRequiredDirectories() {
  const directories = [
    './plugins',
    './lib',
    './tmp'
  ];
  
  for (const dir of directories) {
    if (!existsSync(dir)) {
      try {
        import('fs').then(({ mkdirSync }) => mkdirSync(dir, { recursive: true }));
        logger.debug(`Created directory: ${dir}`);
      } catch (error) {
        throw new Error(`Failed to create directory ${dir}: ${error.message}`);
      }
    }
  }
  
  logger.debug('Required directories check ✓');
}

/**
 * Check system tools availability
 */
async function checkSystemTools() {
  const tools = [
    { name: 'ffmpeg', required: false },
    { name: 'ffprobe', required: false },
    { name: 'convert', required: false },
    { name: 'magick', required: false }
  ];
  
  const results = await Promise.allSettled(
    tools.map(tool => checkTool(tool.name))
  );
  
  const toolStatus = {};
  
  for (const [index, result] of results.entries()) {
    const toolName = tools[index].name;
    toolStatus[toolName] = result.status === 'fulfilled';
    
    if (result.status === 'fulfilled') {
      logger.debug(`${toolName}: available ✓`);
    } else {
      logger.debug(`${toolName}: not available (optional)`);
    }
  }
  
  // Store tool availability globally
  global.support = toolStatus;
  
  logger.debug('System tools check completed');
}

/**
 * Check if a system tool is available
 */
function checkTool(toolName) {
  return new Promise((resolve, reject) => {
    const process = spawn(toolName, ['--version'], { stdio: 'ignore' });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        reject(new Error(`Tool ${toolName} not available`));
      }
    });
    
    process.on('error', () => {
      reject(new Error(`Tool ${toolName} not available`));
    });
    
    // Timeout after 5 seconds
    setTimeout(() => {
      process.kill();
      reject(new Error(`Tool ${toolName} check timeout`));
    }, 5000);
  });
}

/**
 * Check network connection
 */
async function checkNetworkConnection() {
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch('https://www.google.com', {
      method: 'HEAD',
      timeout: 5000
    });
    
    if (!response.ok) {
      throw new Error(`Network check failed: ${response.status}`);
    }
    
    logger.debug('Network connectivity ✓');
    
  } catch (error) {
    throw new Error(`Network connectivity check failed: ${error.message}`);
  }
}

/**
 * Validate message object
 */
export function validateMessage(msg) {
  if (!msg) return false;
  if (!msg.key) return false;
  if (!msg.sender) return false;
  if (!msg.chat) return false;
  
  return true;
}

/**
 * Validate WhatsApp JID format
 */
export function validateJID(jid) {
  if (!jid || typeof jid !== 'string') return false;
  
  // Check for valid WhatsApp JID patterns
  const patterns = [
    /^\d+@s\.whatsapp\.net$/,     // Individual chat
    /^\d+-\d+@g\.us$/,            // Group chat
    /^status@broadcast$/          // Status broadcast
  ];
  
  return patterns.some(pattern => pattern.test(jid));
}

/**
 * Validate phone number
 */
export function validatePhoneNumber(number) {
  if (!number || typeof number !== 'string') return false;
  
  const cleaned = number.replace(/[^0-9]/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
}

/**
 * Validate file size
 */
export function validateFileSize(size, maxSize = 50 * 1024 * 1024) {
  return typeof size === 'number' && size > 0 && size <= maxSize;
}

/**
 * Validate file type
 */
export function validateFileType(type, allowedTypes) {
  if (!type || !allowedTypes) return false;
  
  if (Array.isArray(allowedTypes)) {
    return allowedTypes.includes(type.toLowerCase());
  }
  
  return type.toLowerCase() === allowedTypes.toLowerCase();
}

/**
 * Validate URL format
 */
export function validateURL(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate command syntax
 */
export function validateCommand(command) {
  if (!command || typeof command !== 'string') return false;
  
  // Command should start with valid prefix and have valid characters
  const pattern = /^[a-zA-Z][a-zA-Z0-9_-]*$/;
  return pattern.test(command);
}

/**
 * Validate group settings
 */
export function validateGroupSettings(settings) {
  const validKeys = [
    'welcome', 'antiLink', 'antiLink2', 'antiviewonce',
    'antiToxic', 'autosticker', 'audios', 'modohorny'
  ];
  
  if (!settings || typeof settings !== 'object') return false;
  
  for (const key in settings) {
    if (!validKeys.includes(key)) return false;
    if (typeof settings[key] !== 'boolean') return false;
  }
  
  return true;
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input, maxLength = 1000) {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim();
}

/**
 * Validate API key format
 */
export function validateAPIKey(key) {
  if (!key || typeof key !== 'string') return false;
  
  // Basic API key validation (alphanumeric and some special chars)
  const pattern = /^[a-zA-Z0-9_-]+$/;
  return pattern.test(key) && key.length >= 8;
}
