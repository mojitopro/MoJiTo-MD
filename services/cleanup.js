/**
 * System Cleanup Service
 * Automated cleanup of temporary files, cache, and memory optimization
 */
import { readdirSync, statSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { logger } from './logger.js';
import { cache } from './cache.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

class CleanupService {
  constructor() {
    this.isRunning = false;
    this.stats = {
      filesDeleted: 0,
      bytesFreed: 0,
      lastRun: null
    };
  }

  /**
   * Start the cleanup service with scheduled intervals
   */
  start() {
    logger.info('Starting cleanup service...');
    
    // Immediate cleanup
    this.runCleanup();
    
    // Schedule regular cleanups
    this.scheduleCleanups();
    
    logger.success('Cleanup service started');
  }

  /**
   * Schedule cleanup operations
   */
  scheduleCleanups() {
    // Temp files cleanup every 3 minutes
    setInterval(() => this.cleanTempFiles(), 3 * 60 * 1000);
    
    // Memory optimization every 10 minutes
    setInterval(() => this.optimizeMemory(), 10 * 60 * 1000);
    
    // Full cleanup every hour
    setInterval(() => this.runCleanup(), 60 * 60 * 1000);
    
    // Cache cleanup every 30 minutes
    setInterval(() => this.cleanCache(), 30 * 60 * 1000);
  }

  /**
   * Run full cleanup operation
   */
  async runCleanup() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    const startTime = Date.now();
    
    try {
      logger.debug('Running full cleanup...');
      
      await Promise.all([
        this.cleanTempFiles(),
        this.cleanOldSessions(),
        this.cleanBotMessages(),
        this.optimizeDatabase()
      ]);
      
      this.stats.lastRun = new Date();
      const duration = Date.now() - startTime;
      
      logger.performance('Full cleanup', duration);
      
    } catch (error) {
      logger.error('Cleanup operation failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Clean temporary files
   */
  async cleanTempFiles() {
    const tempDirs = [
      tmpdir(),
      join(__dirname, '../tmp'),
      join(__dirname, '../temp')
    ];

    let deletedCount = 0;
    let freedBytes = 0;

    for (const dir of tempDirs) {
      try {
        if (!require('fs').existsSync(dir)) continue;
        
        const files = readdirSync(dir);
        
        for (const file of files) {
          const filePath = join(dir, file);
          
          try {
            const stats = statSync(filePath);
            const age = Date.now() - stats.mtimeMs;
            
            // Delete files older than 3 minutes
            if (stats.isFile() && age >= 3 * 60 * 1000) {
              freedBytes += stats.size;
              unlinkSync(filePath);
              deletedCount++;
            }
          } catch (fileError) {
            // Ignore individual file errors
          }
        }
      } catch (dirError) {
        logger.debug(`Cannot access temp directory: ${dir}`);
      }
    }

    if (deletedCount > 0) {
      this.stats.filesDeleted += deletedCount;
      this.stats.bytesFreed += freedBytes;
      
      logger.debug(`Cleaned ${deletedCount} temp files (${this.formatBytes(freedBytes)})`);
    }
  }

  /**
   * Clean old session files
   */
  async cleanOldSessions() {
    try {
      const sessionDir = join(__dirname, '../MojiSession');
      if (!require('fs').existsSync(sessionDir)) return;
      
      // Keep only essential session files, remove old backups
      // Implementation depends on session structure
      
    } catch (error) {
      logger.debug('Session cleanup skipped:', error.message);
    }
  }

  /**
   * Clean old bot messages from memory
   */
  async cleanBotMessages() {
    try {
      if (!global.botMessages) return;
      
      const maxMessages = 50;
      let cleanedChats = 0;
      
      for (const chatId in global.botMessages) {
        const messages = global.botMessages[chatId];
        
        if (messages.length > maxMessages) {
          global.botMessages[chatId] = messages.slice(-maxMessages);
          cleanedChats++;
        }
      }
      
      if (cleanedChats > 0) {
        logger.debug(`Cleaned bot messages in ${cleanedChats} chats`);
      }
      
    } catch (error) {
      logger.debug('Bot messages cleanup failed:', error);
    }
  }

  /**
   * Optimize database operations
   */
  async optimizeDatabase() {
    try {
      if (global.db?.write) {
        await global.db.write();
        logger.debug('Database optimized');
      }
    } catch (error) {
      logger.debug('Database optimization failed:', error);
    }
  }

  /**
   * Clean cache entries
   */
  cleanCache() {
    const stats = cache.getStats();
    cache.cleanup();
    
    logger.debug(`Cache cleaned - Size: ${stats.size}, Hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
  }

  /**
   * Optimize memory usage
   */
  optimizeMemory() {
    if (global.gc) {
      global.gc();
      logger.debug('Garbage collection triggered');
    }
    
    // Log memory usage
    const usage = process.memoryUsage();
    const formatMB = (bytes) => (bytes / 1024 / 1024).toFixed(2) + 'MB';
    
    logger.debug(`Memory usage - RSS: ${formatMB(usage.rss)}, Heap: ${formatMB(usage.heapUsed)}/${formatMB(usage.heapTotal)}`);
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get cleanup statistics
   */
  getStats() {
    return { ...this.stats };
  }
}

const cleanupService = new CleanupService();

export function startCleanupService() {
  cleanupService.start();
}

export function getCleanupStats() {
  return cleanupService.getStats();
}
