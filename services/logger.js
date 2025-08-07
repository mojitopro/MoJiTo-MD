
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

// Create logger instance with pretty printing for development
const logger = pino({
  level: process.env.DEBUG === 'true' ? 'debug' : 'info',
  transport: {
    targets: [
      {
        target: 'pino-pretty',
        level: 'info',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
          messageFormat: '{msg}',
          destination: process.stdout
        }
      },
      {
        target: 'pino/file',
        level: 'debug',
        options: {
          destination: join(logsDir, `bot-${new Date().toISOString().split('T')[0]}.log`),
          mkdir: true
        }
      }
    ]
  }
});

// Add custom methods for better UX
logger.success = (msg, ...args) => logger.info(`✅ ${msg}`, ...args);
logger.warn = (msg, ...args) => logger.warn(`⚠️  ${msg}`, ...args);
logger.error = (msg, ...args) => logger.error(`❌ ${msg}`, ...args);

export { logger };
