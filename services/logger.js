
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

// Create logger instance with simple configuration for stability
const logger = pino({
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

// Add custom methods for better UX
const originalError = logger.error.bind(logger);
const originalWarn = logger.warn.bind(logger);

logger.success = (msg, ...args) => logger.info(`✅ ${msg}`, ...args);
logger.warn = (msg, ...args) => originalWarn(`⚠️  ${msg}`, ...args);
logger.error = (msg, ...args) => originalError(`❌ ${msg}`, ...args);

export { logger };
