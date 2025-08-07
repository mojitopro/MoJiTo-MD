
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

// Create logger instance with environment-compatible configuration
let logger;

// Detect Termux and other restricted environments
const isRestrictedEnvironment = process.env.PREFIX && process.env.PREFIX.includes('com.termux') || 
                               process.platform === 'android' ||
                               !process.env.REPLIT;

if (isRestrictedEnvironment) {
  // Use simple logger for restricted environments (Termux, Android, etc.)
  logger = pino({
    level: process.env.DEBUG === 'true' ? 'debug' : 'info',
    base: null,
    timestamp: () => `,"time":"${new Date().toLocaleTimeString()}"`,
    formatters: {
      level: (label) => ({ level: label })
    }
  });
} else {
  // Try advanced logger with transport for supported environments
  try {
    logger = pino({
      level: process.env.DEBUG === 'true' ? 'debug' : 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
          messageFormat: '{msg}'
        }
      }
    });
  } catch (error) {
    // Final fallback to basic logger
    logger = pino({
      level: process.env.DEBUG === 'true' ? 'debug' : 'info',
      base: null
    });
  }
}

// Add custom methods for better UX
const originalError = logger.error.bind(logger);
const originalWarn = logger.warn.bind(logger);

logger.success = (msg, ...args) => logger.info(`✅ ${msg}`, ...args);
logger.warn = (msg, ...args) => originalWarn(`⚠️  ${msg}`, ...args);
logger.error = (msg, ...args) => originalError(`❌ ${msg}`, ...args);

export { logger };
