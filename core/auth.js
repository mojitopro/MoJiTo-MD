/**
 * Authentication & Authorization Management
 * Handles user permissions, role validation, and access control
 */
import { logger } from '../services/logger.js';
import { cache } from '../services/cache.js';

const ADMIN_CACHE_TTL = 300000; // 5 minutes

export class AuthManager {
  constructor() {
    this.ownerCache = new Map();
    this.adminCache = new Map();
    this.premiumCache = new Map();
  }

  /**
   * Check if user is root owner
   */
  isRootOwner(userId) {
    const cleanId = this.normalizeJid(userId);
    const botOwnerId = this.normalizeJid(global.conn?.user?.id || '');
    
    if (cleanId === botOwnerId) return true;
    
    return global.owner?.some(([number]) => 
      this.normalizeJid(number + '@s.whatsapp.net') === cleanId
    ) || false;
  }

  /**
   * Check if user is owner (includes root owner)
   */
  isOwner(userId, fromMe = false) {
    return this.isRootOwner(userId) || fromMe;
  }

  /**
   * Check if user is moderator
   */
  isModerator(userId) {
    if (this.isOwner(userId)) return true;
    
    const cleanId = this.normalizeJid(userId);
    return global.mods?.some(number => 
      this.normalizeJid(number.replace(/[^0-9]/g, '') + '@s.whatsapp.net') === cleanId
    ) || false;
  }

  /**
   * Check if user is premium
   */
  isPremium(userId) {
    if (this.isRootOwner(userId)) return true;
    
    const cacheKey = `premium_${userId}`;
    if (this.premiumCache.has(cacheKey)) {
      return this.premiumCache.get(cacheKey);
    }
    
    const cleanId = this.normalizeJid(userId);
    const isPrem = global.prems?.some(number => 
      this.normalizeJid(number.replace(/[^0-9]/g, '') + '@s.whatsapp.net') === cleanId
    ) || false;
    
    this.premiumCache.set(cacheKey, isPrem);
    setTimeout(() => this.premiumCache.delete(cacheKey), ADMIN_CACHE_TTL);
    
    return isPrem;
  }

  /**
   * Check if user is group admin
   */
  async isGroupAdmin(userId, groupId) {
    const cacheKey = `admin_${groupId}_${userId}`;
    
    if (this.adminCache.has(cacheKey)) {
      return this.adminCache.get(cacheKey);
    }
    
    try {
      const groupMetadata = await global.conn.groupMetadata(groupId);
      const participant = groupMetadata.participants.find(p => 
        this.normalizeJid(p.id) === this.normalizeJid(userId)
      );
      
      const isAdmin = participant?.admin === 'admin' || participant?.admin === 'superadmin';
      
      this.adminCache.set(cacheKey, isAdmin);
      setTimeout(() => this.adminCache.delete(cacheKey), ADMIN_CACHE_TTL);
      
      return isAdmin;
      
    } catch (error) {
      logger.error('Error checking group admin status:', error);
      return false;
    }
  }

  /**
   * Check if bot is group admin
   */
  async isBotGroupAdmin(groupId) {
    const botId = global.conn?.user?.id;
    if (!botId) return false;
    
    return this.isGroupAdmin(botId, groupId);
  }

  /**
   * Normalize WhatsApp JID
   */
  normalizeJid(jid) {
    return jid?.replace(/:\d+/, '') || '';
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.ownerCache.clear();
    this.adminCache.clear();
    this.premiumCache.clear();
  }
}

export const authManager = new AuthManager();
