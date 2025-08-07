/**
 * Database initialization and management
 */
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { logger } from './logger.js';

let db = null;

export async function initializeDatabase() {
  try {
    // Define default data structure
    const defaultData = {
      users: {},
      chats: {},
      stats: {},
      settings: {}
    };

    // Initialize database with default structure
    const adapter = new JSONFile('database.json');
    db = new Low(adapter, defaultData);

    // Read data from JSON file
    await db.read();

    // Set global reference
    global.db = {
      data: db.data,
      write: () => db.write()
    };

    // Save initial structure
    await db.write();

    logger.info('Database initialized successfully');

  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
}

export { db };