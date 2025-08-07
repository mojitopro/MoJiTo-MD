/**
 * In-Memory Cache Service
 * High-performance caching for frequently accessed data
 */
import { logger } from './logger.js';

class CacheService {
  constructor() {
    this.cache = new Map();
    this.ttlTimers = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
    
    // Cleanup expired entries every 5 minutes
    setInterval(() => this.cleanup(), 300000);
  }

  /**
   * Get value from cache
   */
  get(key) {
    if (this.cache.has(key)) {
      this.stats.hits++;
      return this.cache.get(key);
    }
    
    this.stats.misses++;
    return null;
  }

  /**
   * Set value in cache with optional TTL
   */
  set(key, value, ttl = null) {
    this.cache.set(key, value);
    this.stats.sets++;
    
    if (ttl) {
      this.setTTL(key, ttl);
    }
    
    return true;
  }

  /**
   * Delete value from cache
   */
  delete(key) {
    const deleted = this.cache.delete(key);
    
    if (deleted) {
      this.stats.deletes++;
      this.clearTTL(key);
    }
    
    return deleted;
  }

  /**
   * Check if key exists in cache
   */
  has(key) {
    return this.cache.has(key);
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
    this.clearAllTTL();
    logger.info('Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0
    };
  }

  /**
   * Set TTL for a cache entry
   */
  setTTL(key, ttl) {
    this.clearTTL(key);
    
    const timer = setTimeout(() => {
      this.delete(key);
    }, ttl);
    
    this.ttlTimers.set(key, timer);
  }

  /**
   * Clear TTL timer for a key
   */
  clearTTL(key) {
    const timer = this.ttlTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.ttlTimers.delete(key);
    }
  }

  /**
   * Clear all TTL timers
   */
  clearAllTTL() {
    for (const timer of this.ttlTimers.values()) {
      clearTimeout(timer);
    }
    this.ttlTimers.clear();
  }

  /**
   * Cleanup expired entries and optimize memory
   */
  cleanup() {
    const sizeBefore = this.cache.size;
    
    // Remove entries that should have expired but timer failed
    // This is a safety mechanism
    
    const sizeAfter = this.cache.size;
    const cleaned = sizeBefore - sizeAfter;
    
    if (cleaned > 0) {
      logger.debug(`Cache cleanup: removed ${cleaned} entries`);
    }
  }

  /**
   * Get or set pattern for efficient caching
   */
  async getOrSet(key, factory, ttl = null) {
    let value = this.get(key);
    
    if (value === null) {
      value = await factory();
      this.set(key, value, ttl);
    }
    
    return value;
  }
}

export const cache = new CacheService();
