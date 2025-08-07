/**
 * Database initialization and management
 */
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb';
import { logger } from './logger.js';

let db = null;

export async function initializeDatabase() {
  try {
    // Initialize database with default structure
    const adapter = new JSONFile('database.json');
    db = new Low(adapter);

    // Read data from JSON file
    await db.read();

    // Initialize default data structure
    db.data = db.data || {
      users: {},
      chats: {},
      stats: {},
      settings: {}
    };

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