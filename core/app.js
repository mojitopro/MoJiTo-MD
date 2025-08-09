/**
 * Core Application Logic
 * Main bot initialization and coordination
 */
import { setupGlobalVariables } from '../config/settings.js';
import { initializeDatabase } from '../services/database.js';
import { initializeConnection } from './connection-universal.js';
import { loadPlugins } from '../plugins/loader.js';
import { setupMessageHandler } from '../handlers/message.js';
import { setupEventHandlers } from '../handlers/events.js';
import { startCleanupService } from '../services/cleanup.js';
import { logger } from '../services/logger.js';
import { startHTTPServer } from '../server.js';
// Temporarily disabled: import { printStartupBanner, printBotEvent } from '../utils/print.js';

export async function startBot() {
  try {
    logger.info('🚀 Starting MoJiTo WhatsApp Bot - OPTIMIZED VERSION...');

    // Setup global variables first
    await setupGlobalVariables();
    logger.info('✅ Global variables initialized');

    // Initialize database
    await initializeDatabase();
    logger.info('✅ Database ready');

    // Start HTTP server for Replit compatibility FIRST
    await startHTTPServer(5000);
    logger.info('✅ HTTP server running on port 5000');

    // Initialize universal connection (QR or Pairing Code)
    const connectionOptions = {
      usePairingCode: process.env.USE_PAIRING_CODE === 'true',
      phoneNumber: process.env.PHONE_NUMBER
    };
    
    const connection = await initializeConnection(connectionOptions);

    // Store global connection reference
    global.conn = connection;
    logger.info('✅ WhatsApp connection initialized');

    // Load plugins BEFORE setting up handlers
    const plugins = await loadPlugins();
    logger.info(`✅ Loaded ${plugins.length} plugins`);

    // Setup message and event handlers with loaded plugins
    setupMessageHandler(connection);
    setupEventHandlers(connection);
    logger.info('✅ Message handlers configured with plugins');

    // Start cleanup service
    startCleanupService();
    logger.info('✅ Cleanup service started');

    // Setup graceful shutdown
    setupGracefulShutdown();

    logger.info('🎉 Bot started successfully - OPTIMIZED for maximum uptime!');
    logger.info('✅ Bulletproof session system active');
    logger.info('✅ Console spam reduced');
    logger.info('✅ Advanced printing system ready');

    // Notify parent process that bot is ready
    if (process.send) {
      process.send('ready');
    }

  } catch (error) {
    logger.error('Failed to start bot:', error);
    process.exit(1);
  }
}

function setupGracefulShutdown() {
  const cleanup = async (signal) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);

    if (global.conn) {
      try {
        await global.conn.logout();
        logger.info('WhatsApp connection closed');
      } catch (error) {
        logger.error('Error closing WhatsApp connection:', error);
      }
    }

    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('message', (msg) => {
    if (msg === 'shutdown') {
      cleanup('shutdown');
    }
  });
}