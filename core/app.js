/**
 * Core Application Logic
 * Main bot initialization and coordination
 */
import { setupGlobalVariables } from '../config/settings.js';
import { initializeDatabase } from '../services/database.js';
import { initializeConnection } from './connection-fixed.js';
import { loadPlugins } from '../plugins/loader.js';
import { setupMessageHandler } from '../handlers/message.js';
import { setupEventHandlers } from '../handlers/events.js';
import { startCleanupService } from '../services/cleanup.js';
import { logger } from '../services/logger.js';
import { startHTTPServer } from '../server.js';

export async function startBot() {
  try {
    logger.info('Starting MoJiTo WhatsApp Bot...');

    // Setup global variables first
    await setupGlobalVariables();
    logger.info('✅ Global variables initialized');

    // Initialize database
    await initializeDatabase();
    logger.info('✅ Database initialized');

    // Initialize WhatsApp connection with fixed system
    const connection = await initializeConnection({
      usePairingCode: process.env.USE_PAIRING_CODE === 'true',
      phoneNumber: process.env.PHONE_NUMBER
    });

    // Store global connection reference
    global.conn = connection;
    logger.info('✅ WhatsApp connection initialized');

    // Load plugins
    const plugins = await loadPlugins();
    logger.info(`✅ Loaded ${plugins.length} plugins`);

    // Setup message and event handlers
    setupMessageHandler(connection);
    setupEventHandlers(connection);
    logger.info('✅ Message handlers configured');

    // Start cleanup service
    startCleanupService();
    logger.info('✅ Cleanup service started');

    // Start HTTP server for Replit compatibility
    startHTTPServer(5000);
    logger.info('✅ HTTP server started on port 5000');

    // Setup graceful shutdown
    setupGracefulShutdown();

    logger.info('🚀 Bot started successfully!');

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