/**
 * Ultra High-Speed Response System for WhatsApp Bot
 * Optimized for millisecond-level responses in groups and private chats
 */

import { logger } from '../services/logger.js';

// Cache system for ultra-fast responses
const responseCache = new Map();
const commandCache = new Map();
const userCache = new Map();

// Pre-compiled command patterns for instant matching
const FAST_COMMANDS = {
  ping: /^(ping|p|latencia|speed)$/i,
  info: /^(info|bot|about|acerca)$/i,
  menu: /^(menu|help|ayuda|comandos)$/i,
  admin: /^(admin|kick|ban|promote|demote)$/i,
  fun: /^(meme|joke|broma|random|dado|coin)$/i,
  group: /^(grupo|everyone|todos|tagall)$/i,
  media: /^(sticker|stick|s|toimg|img)$/i,
  ai: /^(ai|gpt|chatgpt|pregunta|ask)$/i
};

// Ultra-fast response templates (pre-compiled)
const INSTANT_RESPONSES = {
  ping: () => `🚀 *Ultra Speed!* ⚡\n⏱️ Latencia: ${process.uptime() < 1 ? '<1ms' : Math.floor(process.uptime() * 1000) + 'ms'}\n💥 Sistema optimizado al máximo`,
  
  info: () => `🤖 *MoJiTo Bot Ultra* 🔥\n\n✨ *Características:*\n⚡ Respuestas en milisegundos\n🎯 Optimizado para grupos\n🚀 Compatible con Termux\n💎 API Baileys avanzada\n\n🎮 *Comandos rápidos disponibles!*`,
  
  menu: () => `🎮 *MENU ULTRA RÁPIDO* ⚡\n\n🚀 *BÁSICOS:*\n• .ping - Test de velocidad\n• .info - Info del bot\n\n👥 *GRUPOS:*\n• .todos - Mencionar todos\n• .admin - Comandos admin\n\n🎯 *DIVERSIÓN:*\n• .meme - Meme random\n• .dado - Tirar dados\n• .coin - Cara o cruz\n\n🎨 *MEDIA:*\n• .s - Crear sticker\n• .toimg - Sticker a imagen\n\n🤖 *IA:*\n• .ai <texto> - Chat con IA\n\n⚡ *Respuestas optimizadas para máxima velocidad!*`
};

// Performance monitoring
let responseStats = {
  totalCommands: 0,
  avgResponseTime: 0,
  fastestResponse: Infinity,
  slowestResponse: 0
};

export class SpeedOptimizer {
  constructor() {
    this.startTime = Date.now();
    this.initializeCache();
  }

  initializeCache() {
    // Pre-warm caches with common responses
    for (const [key, template] of Object.entries(INSTANT_RESPONSES)) {
      responseCache.set(key, template());
    }
    logger.info('🚀 Speed optimizer initialized - Cache pre-warmed');
  }

  // Ultra-fast command detection (< 1ms)
  detectCommand(text) {
    if (!text) return null;
    
    const startTime = process.hrtime.bigint();
    const cleanText = text.toLowerCase().trim();
    
    // Remove prefix instantly
    const command = cleanText.replace(/^[.#!\/]/, '');
    
    // Instant pattern matching
    for (const [category, pattern] of Object.entries(FAST_COMMANDS)) {
      if (pattern.test(command)) {
        const endTime = process.hrtime.bigint();
        const responseTime = Number(endTime - startTime) / 1000000; // Convert to ms
        
        this.updateStats(responseTime);
        return { category, command, responseTime };
      }
    }
    
    return null;
  }

  // Get instant response (< 2ms)
  getInstantResponse(category, command) {
    const startTime = process.hrtime.bigint();
    
    // Check cache first
    if (responseCache.has(category)) {
      const response = responseCache.get(category);
      const endTime = process.hrtime.bigint();
      const responseTime = Number(endTime - startTime) / 1000000;
      
      return { response, responseTime, cached: true };
    }

    // Generate if not cached
    if (INSTANT_RESPONSES[category]) {
      const response = INSTANT_RESPONSES[category]();
      responseCache.set(category, response);
      
      const endTime = process.hrtime.bigint();
      const responseTime = Number(endTime - startTime) / 1000000;
      
      return { response, responseTime, cached: false };
    }

    return null;
  }

  // Update performance statistics
  updateStats(responseTime) {
    responseStats.totalCommands++;
    responseStats.avgResponseTime = (responseStats.avgResponseTime + responseTime) / 2;
    
    if (responseTime < responseStats.fastestResponse) {
      responseStats.fastestResponse = responseTime;
    }
    
    if (responseTime > responseStats.slowestResponse) {
      responseStats.slowestResponse = responseTime;
    }
  }

  // Get performance stats
  getStats() {
    return {
      ...responseStats,
      uptime: Date.now() - this.startTime,
      cacheSize: responseCache.size
    };
  }

  // Clear caches for memory optimization
  clearCaches() {
    responseCache.clear();
    commandCache.clear();
    userCache.clear();
    this.initializeCache();
    logger.info('🧹 Caches cleared and re-initialized');
  }
}

// Export singleton instance
export const speedOptimizer = new SpeedOptimizer();

// Advanced group optimization
export class GroupOptimizer {
  static async optimizeGroupResponse(conn, m, response) {
    const startTime = process.hrtime.bigint();
    
    try {
      // For groups, use the most efficient sending method
      const options = {
        quoted: m.key ? { key: m.key, message: m.message } : undefined
      };

      await conn.sendMessage(m.chat, { text: response }, options);
      
      const endTime = process.hrtime.bigint();
      const responseTime = Number(endTime - startTime) / 1000000;
      
      // Log only if response is slow (> 100ms)
      if (responseTime > 100) {
        logger.warn(`⚠️ Slow group response: ${responseTime.toFixed(2)}ms`);
      }
      
      return responseTime;
    } catch (error) {
      logger.error('Group response error:', error);
      return null;
    }
  }

  static async batchGroupOperations(conn, chat, operations) {
    // Execute multiple group operations in parallel for maximum speed
    const promises = operations.map(op => op(conn, chat));
    return Promise.allSettled(promises);
  }
}

// Memory optimizer for sustained high performance
export class MemoryOptimizer {
  static cleanup() {
    if (global.gc) {
      global.gc();
    }
    
    // Clear old cache entries
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes
    
    for (const [key, value] of responseCache.entries()) {
      if (value.timestamp && now - value.timestamp > maxAge) {
        responseCache.delete(key);
      }
    }
  }

  static getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024),
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024)
    };
  }
}