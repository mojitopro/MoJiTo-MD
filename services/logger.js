
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

// Check if we can use worker threads (required for pino transports)
const canUseWorkers = (() => {
  try {
    // Test if worker threads are available
    require.resolve('worker_threads');
    return true;
  } catch {
    return false;
  }
})();

if (canUseWorkers) {
  try {
    // Use pino-pretty transport if worker threads are available
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
    // Fallback if transport fails
    logger = pino({
      level: process.env.DEBUG === 'true' ? 'debug' : 'info'
    });
  }
} else {
  // Use basic logger without transport for environments without worker threads
  logger = pino({
    level: process.env.DEBUG === 'true' ? 'debug' : 'info',
    base: null,
    timestamp: () => `,"time":"${new Date().toLocaleTimeString()}"`
  });
}

// Add custom methods for better UX
const originalError = logger.error.bind(logger);
const originalWarn = logger.warn.bind(logger);

logger.success = (msg, ...args) => logger.info(`✅ ${msg}`, ...args);
logger.warn = (msg, ...args) => originalWarn(`⚠️  ${msg}`, ...args);
logger.error = (msg, ...args) => originalError(`❌ ${msg}`, ...args);

export { logger };
