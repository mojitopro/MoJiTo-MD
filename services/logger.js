
/**
 * Enhanced logging service with multiple levels and file output
 */
import pino from 'pino';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Ensure logs directory exists
const logsDir = join(process.cwd(), 'logs');
if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
}

// Create logger instance with safe configuration
let logger;

// Minimal console logger - reduce spam significantly
logger = {
  info: (msg, ...args) => {
    // Only log critical startup events and connections
    if (msg.includes('🚀 Starting') || msg.includes('✅ HTTP server') || msg.includes('Worker is ready') || msg.includes('Bot started successfully')) {
      console.log(`${msg}`);
    }
  },
  error: (msg, ...args) => {
    console.error(`❌ ${msg}`);
  },
  warn: (msg, ...args) => {
    // Only show critical warnings
    if (msg.includes('Disconnected') || msg.includes('Login issue')) {
      console.warn(`⚠️  ${msg}`);
    }
  },
  debug: (msg, ...args) => {
    if (process.env.DEBUG === 'true') {
      console.log(`🐛 ${msg}`);
    }
  },
  success: (msg, ...args) => {
    console.log(`${msg}`);
  }
};

// Add custom methods for better UX
const originalError = logger.error.bind(logger);
const originalWarn = logger.warn.bind(logger);

logger.success = (msg, ...args) => logger.info(`✅ ${msg}`, ...args);
logger.warn = (msg, ...args) => originalWarn(`⚠️  ${msg}`, ...args);
logger.error = (msg, ...args) => originalError(`❌ ${msg}`, ...args);

export { logger };
