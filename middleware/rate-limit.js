/**
 * Rate Limiting Middleware
 * Advanced rate limiting with multiple strategies and user tiers
 */
import { logger } from '../services/logger.js';
import { cache } from '../services/cache.js';
import { RATE_LIMITS } from '../config/constants.js';

// Rate limit storage
const rateLimits = new Map();
const violations = new Map();

/**
 * Apply rate limiting to message/command
 */
export function applyRateLimit(msg, permissions) {
  try {
    // Skip rate limiting for owners
    if (permissions.isOwner) return true;
    
    // Different limits for different user types
    const limits = getRateLimits(permissions);
    
    // Check global message rate limit
    if (!checkMessageRateLimit(msg.sender, limits.messages)) {
      return false;
    }
    
    // Check command rate limit if it's a command
    if (isCommand(msg.text)) {
      if (!checkCommandRateLimit(msg.sender, limits.commands)) {
        return false;
      }
    }
    
    // Check media rate limit for media messages
    if (hasMedia(msg)) {
      if (!checkMediaRateLimit(msg.sender, limits.media)) {
        return false;
      }
    }
    
    return true;
    
  } catch (error) {
    logger.error('Rate limiting error:', error);
    return true; // Allow on error to prevent blocking
  }
}

/**
 * Get rate limits based on user permissions
 */
function getRateLimits(permissions) {
  // Premium users get higher limits
  if (permissions.isPremium) {
    return {
      messages: { window: 60000, max: 60 },
      commands: { window: 60000, max: 30 },
      media: { window: 300000, max: 20 }
    };
  }
  
  // Moderators get higher limits
  if (permissions.isModerator) {
    return {
      messages: { window: 60000, max: 40 },
      commands: { window: 60000, max: 25 },
      media: { window: 300000, max: 15 }
    };
  }
  
  // Regular users
  return {
    messages: { window: 60000, max: 30 },
    commands: RATE_LIMITS.commands,
    media: RATE_LIMITS.media
  };
}

/**
 * Check message rate limit
 */
function checkMessageRateLimit(userId, limit) {
  return checkRateLimit(userId, 'messages', limit);
}

/**
 * Check command rate limit
 */
function checkCommandRateLimit(userId, limit) {
  return checkRateLimit(userId, 'commands', limit);
}

/**
 * Check media rate limit
 */
function checkMediaRateLimit(userId, limit) {
  return checkRateLimit(userId, 'media', limit);
}

/**
 * Generic rate limit checker
 */
function checkRateLimit(userId, type, limit) {
  const key = `${userId}:${type}`;
  const now = Date.now();
  
  // Get or create rate limit data
  let rateLimitData = rateLimits.get(key);
  
  if (!rateLimitData) {
    rateLimitData = {
      count: 0,
      resetTime: now + limit.window,
      violations: 0
    };
    rateLimits.set(key, rateLimitData);
  }
  
  // Reset if window has passed
  if (now >= rateLimitData.resetTime) {
    rateLimitData.count = 0;
    rateLimitData.resetTime = now + limit.window;
  }
  
  // Increment counter
  rateLimitData.count++;
  
  // Check if limit exceeded
  if (rateLimitData.count > limit.max) {
    rateLimitData.violations++;
    
    // Log violation
    logger.warn(`Rate limit exceeded for ${userId} (${type}): ${rateLimitData.count}/${limit.max}`);
    
    // Handle repeat violations
    handleRateLimitViolation(userId, type, rateLimitData.violations);
    
    return false;
  }
  
  return true;
}

/**
 * Handle rate limit violations
 */
function handleRateLimitViolation(userId, type, violationCount) {
  const key = `violations:${userId}`;
  
  // Track total violations
  const totalViolations = (violations.get(key) || 0) + 1;
  violations.set(key, totalViolations);
  
  // Escalating penalties
  if (violationCount >= 5) {
    // Temporary ban for repeat offenders
    applyTemporaryBan(userId, 60000); // 1 minute ban
    logger.warn(`Temporary ban applied to ${userId} for rate limit violations`);
  } else if (violationCount >= 3) {
    // Longer cooldown
    applyExtendedCooldown(userId, type, 30000); // 30 second cooldown
  }
}

/**
 * Apply temporary ban
 */
function applyTemporaryBan(userId, duration) {
  const banKey = `tempban:${userId}`;
  cache.set(banKey, true, duration);
}

/**
 * Check if user is temporarily banned
 */
export function isTemporarilyBanned(userId) {
  const banKey = `tempban:${userId}`;
  return cache.has(banKey);
}

/**
 * Apply extended cooldown
 */
function applyExtendedCooldown(userId, type, duration) {
  const key = `cooldown:${userId}:${type}`;
  cache.set(key, true, duration);
}

/**
 * Check extended cooldown
 */
function hasExtendedCooldown(userId, type) {
  const key = `cooldown:${userId}:${type}`;
  return cache.has(key);
}

/**
 * Check if message is a command
 */
function isCommand(text) {
  return text && global.prefix.test(text);
}

/**
 * Check if message has media
 */
function hasMedia(msg) {
  return !!(
    msg.message?.imageMessage ||
    msg.message?.videoMessage ||
    msg.message?.audioMessage ||
    msg.message?.documentMessage ||
    msg.message?.stickerMessage
  );
}

/**
 * Get rate limit status for user
 */
export function getRateLimitStatus(userId, permissions) {
  const limits = getRateLimits(permissions);
  const status = {};
  
  ['messages', 'commands', 'media'].forEach(type => {
    const key = `${userId}:${type}`;
    const data = rateLimits.get(key);
    
    if (data) {
      const remaining = Math.max(0, limits[type].max - data.count);
      const resetIn = Math.max(0, data.resetTime - Date.now());
      
      status[type] = {
        used: data.count,
        limit: limits[type].max,
        remaining,
        resetIn: Math.ceil(resetIn / 1000), // seconds
        violations: data.violations
      };
    } else {
      status[type] = {
        used: 0,
        limit: limits[type].max,
        remaining: limits[type].max,
        resetIn: 0,
        violations: 0
      };
    }
  });
  
  return status;
}

/**
 * Clean up expired rate limit entries
 */
export function cleanupRateLimits() {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [key, data] of rateLimits.entries()) {
    if (now >= data.resetTime && data.count === 0) {
      rateLimits.delete(key);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    logger.debug(`Cleaned up ${cleaned} expired rate limit entries`);
  }
}

/**
 * Reset rate limits for user (admin function)
 */
export function resetUserRateLimits(userId) {
  let resetCount = 0;
  
  for (const key of rateLimits.keys()) {
    if (key.startsWith(userId + ':')) {
      rateLimits.delete(key);
      resetCount++;
    }
  }
  
  // Clear violations
  violations.delete(`violations:${userId}`);
  
  // Clear temporary ban
  cache.delete(`tempban:${userId}`);
  
  logger.info(`Reset ${resetCount} rate limits for user ${userId}`);
  return resetCount;
}

// Cleanup expired entries every 5 minutes
setInterval(cleanupRateLimits, 5 * 60 * 1000);
