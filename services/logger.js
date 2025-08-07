
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

// Use simple logger by default to avoid worker thread issues
// Only use transport if explicitly in Replit environment
if (process.env.REPLIT && process.env.REPLIT_DB_URL) {
  // We're definitely in Replit, safe to use transport
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
    // Fallback to basic logger
    logger = pino({
      level: process.env.DEBUG === 'true' ? 'debug' : 'info',
      base: null
    });
  }
} else {
  // Use basic logger for all other environments (Termux, local dev, etc.)
  logger = pino({
    level: process.env.DEBUG === 'true' ? 'debug' : 'info',
    base: null,
    timestamp: () => `,"time":"${new Date().toLocaleTimeString()}"`,
    formatters: {
      level: (label) => ({ level: label })
    }
  });
}

// Add custom methods for better UX
const originalError = logger.error.bind(logger);
const originalWarn = logger.warn.bind(logger);

logger.success = (msg, ...args) => logger.info(`✅ ${msg}`, ...args);
logger.warn = (msg, ...args) => originalWarn(`⚠️  ${msg}`, ...args);
logger.error = (msg, ...args) => originalError(`❌ ${msg}`, ...args);

export { logger };
