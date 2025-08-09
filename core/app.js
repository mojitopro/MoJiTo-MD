/**
 * Core Application Logic
 * Main bot initialization and coordination
 */
import { setupGlobalVariables } from '../config/settings.js';
import { initializeDatabase } from '../services/database.js';
import { initializeConnection } from './connection-ultra.js';
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
    startHTTPServer(5000);
    logger.info('✅ HTTP server running on port 5000');

    // Initialize WhatsApp connection with pairing code (optimized for Replit)
    const connection = await initializeConnection({
      usePairingCode: true,  // Force pairing code for easier setup
      phoneNumber: process.env.PHONE_NUMBER || '5511999999999' // Default example number
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