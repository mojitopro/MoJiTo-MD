/**
 * MongoDB V2 Database Adapter
 * Enhanced MongoDB adapter with improved performance
 */
import { MongoClient } from 'mongodb';
import { logger } from '../services/logger.js';

export class MongoDBV2 {
  constructor(connectionString) {
    this.connectionString = connectionString;
    this.client = null;
    this.db = null;
    this.isConnected = false;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Connect to MongoDB with retry logic
   */
  async connect(retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        this.client = new MongoClient(this.connectionString, {
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        });
        
        await this.client.connect();
        
        const dbName = this.extractDbName(this.connectionString);
        this.db = this.client.db(dbName);
        this.isConnected = true;
        
        logger.info(`Connected to MongoDB V2: ${dbName}`);
        return true;
        
      } catch (error) {
        logger.warn(`MongoDB connection attempt ${attempt}/${retries} failed:`, error.message);
        
        if (attempt === retries) {
          throw new Error(`Failed to connect to MongoDB after ${retries} attempts: ${error.message}`);
        }
        
        await this.sleep(1000 * attempt); // Exponential backoff
      }
    }
  }

  /**
   * Extract database name from connection string
   */
  extractDbName(connectionString) {
    try {
      const url = new URL(connectionString);
      return url.pathname.slice(1).split('?')[0] || 'mojito_db';
    } catch {
      return 'mojito_db';
    }
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect() {
    try {
      if (this.client && this.isConnected) {
        await this.client.close();
        this.isConnected = false;
        logger.info('Disconnected from MongoDB V2');
      }
    } catch (error) {
      logger.error('MongoDB V2 disconnect error:', error);
    }
  }

  /**
   * Get collection with caching
   */
  collection(name) {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }
    return this.db.collection(name);
  }

  /**
   * Read data with caching
   */
  async read() {
    const cacheKey = 'all_data';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    
    try {
      const [users, chats, settings] = await Promise.all([
        this.collection('users').find({}).toArray(),
        this.collection('chats').find({}).toArray(),
        this.collection('settings').find({}).toArray()
      ]);
      
      const data = {
        users: this.arrayToObject(users, '_id'),
        chats: this.arrayToObject(chats, '_id'),
        settings: this.arrayToObject(settings, '_id')
      };
      
      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
      
    } catch (error) {
      logger.error('MongoDB V2 read error:', error);
      return { users: {}, chats: {}, settings: {} };
    }
  }

  /**
   * Write data with batching
   */
  async write(data) {
    try {
      const operations = [];
      
      if (data.users) {
        operations.push(this.bulkWrite('users', data.users));
      }
      if (data.chats) {
        operations.push(this.bulkWrite('chats', data.chats));
      }
      if (data.settings) {
        operations.push(this.bulkWrite('settings', data.settings));
      }
      
      await Promise.all(operations);
      
      // Invalidate cache
      this.cache.delete('all_data');
      
      return true;
      
    } catch (error) {
      logger.error('MongoDB V2 write error:', error);
      return false;
    }
  }

  /**
   * Optimized bulk write
   */
  async bulkWrite(collectionName, data) {
    const collection = this.collection(collectionName);
    const operations = [];
    
    for (const [id, doc] of Object.entries(data)) {
      operations.push({
        replaceOne: {
          filter: { _id: id },
          replacement: { _id: id, ...doc, updatedAt: new Date() },
          upsert: true
        }
      });
    }
    
    if (operations.length > 0) {
      const batchSize = 1000;
      for (let i = 0; i < operations.length; i += batchSize) {
        const batch = operations.slice(i, i + batchSize);
        await collection.bulkWrite(batch, { ordered: false });
      }
    }
  }

  /**
   * Convert array to object with better performance
   */
  arrayToObject(array, keyField) {
    const result = Object.create(null);
    for (const item of array) {
      if (item && item[keyField]) {
        const { [keyField]: key, ...data } = item;
        result[key] = data;
      }
    }
    return result;
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      await this.db.admin().ping();
      return true;
    } catch (error) {
      logger.error('MongoDB V2 health check failed:', error);
      return false;
    }
  }

  /**
   * Get database stats
   */
  async getStats() {
    try {
      const stats = await this.db.stats();
      return {
        connected: this.isConnected,
        collections: stats.collections,
        dataSize: stats.dataSize,
        indexSize: stats.indexSize
      };
    } catch (error) {
      logger.error('MongoDB V2 stats error:', error);
      return { connected: false };
    }
  }
}