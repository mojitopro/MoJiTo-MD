/**
 * MongoDB Database Adapter
 * MongoDB connection and operations handling
 */
import { MongoClient } from 'mongodb';
import { logger } from '../services/logger.js';

export class mongoDB {
  constructor(connectionString) {
    this.connectionString = connectionString;
    this.client = null;
    this.db = null;
    this.collections = {};
  }

  /**
   * Connect to MongoDB
   */
  async connect() {
    try {
      this.client = new MongoClient(this.connectionString);
      await this.client.connect();
      
      const dbName = this.connectionString.split('/').pop().split('?')[0];
      this.db = this.client.db(dbName);
      
      logger.info(`Connected to MongoDB: ${dbName}`);
      return true;
      
    } catch (error) {
      logger.error('MongoDB connection error:', error);
      throw error;
    }
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect() {
    try {
      if (this.client) {
        await this.client.close();
        logger.info('Disconnected from MongoDB');
      }
    } catch (error) {
      logger.error('MongoDB disconnect error:', error);
    }
  }

  /**
   * Get collection
   */
  collection(name) {
    if (!this.collections[name]) {
      this.collections[name] = this.db.collection(name);
    }
    return this.collections[name];
  }

  /**
   * Check if connected
   */
  get connected() {
    return this.client && this.client.topology && this.client.topology.isConnected();
  }

  /**
   * Read data
   */
  async read() {
    try {
      const users = await this.collection('users').find({}).toArray();
      const chats = await this.collection('chats').find({}).toArray();
      const settings = await this.collection('settings').find({}).toArray();
      
      return {
        users: this.arrayToObject(users, '_id'),
        chats: this.arrayToObject(chats, '_id'),
        settings: this.arrayToObject(settings, '_id')
      };
      
    } catch (error) {
      logger.error('MongoDB read error:', error);
      return { users: {}, chats: {}, settings: {} };
    }
  }

  /**
   * Write data
   */
  async write(data) {
    try {
      if (data.users) {
        await this.bulkWrite('users', data.users);
      }
      if (data.chats) {
        await this.bulkWrite('chats', data.chats);
      }
      if (data.settings) {
        await this.bulkWrite('settings', data.settings);
      }
      
      return true;
      
    } catch (error) {
      logger.error('MongoDB write error:', error);
      return false;
    }
  }

  /**
   * Bulk write operations
   */
  async bulkWrite(collectionName, data) {
    const collection = this.collection(collectionName);
    const operations = [];
    
    for (const [id, doc] of Object.entries(data)) {
      operations.push({
        replaceOne: {
          filter: { _id: id },
          replacement: { _id: id, ...doc },
          upsert: true
        }
      });
    }
    
    if (operations.length > 0) {
      await collection.bulkWrite(operations);
    }
  }

  /**
   * Convert array to object
   */
  arrayToObject(array, keyField) {
    const result = {};
    for (const item of array) {
      const { [keyField]: key, ...data } = item;
      result[key] = data;
    }
    return result;
  }
}

// Alias for compatibility
export const mongoDBV2 = mongoDB;