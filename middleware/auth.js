/**
 * Authentication Middleware
 * Command-level authentication and authorization
 */
import { authManager } from '../core/auth.js';
import { getUserData } from '../services/database.js';
import { logger } from '../services/logger.js';

/**
 * Authentication middleware for command execution
 */
export function createAuthMiddleware() {
  return async function authMiddleware(context, next) {
    const { msg, plugin, permissions } = context;
    
    try {
      // Check if plugin requires authentication
      if (!requiresAuth(plugin)) {
        return next();
      }
      
      // Validate permissions
      const authResult = validatePermissions(plugin, permissions, msg);
      
      if (!authResult.success) {
        await msg.reply(authResult.message);
        return; // Stop execution
      }
      
      // Add auth info to context
      context.auth = {
        level: getAuthLevel(permissions),
        permissions,
        validated: true
      };
      
      return next();
      
    } catch (error) {
      logger.error('Auth middleware error:', error);
      await msg.reply('❌ Error de autenticación');
    }
  };
}

/**
 * Check if plugin requires authentication
 */
function requiresAuth(plugin) {
  return !!(
    plugin.owner ||
    plugin.mods ||
    plugin.premium ||
    plugin.admin ||
    plugin.botAdmin ||
    plugin.group ||
    plugin.private
  );
}

/**
 * Validate user permissions against plugin requirements
 */
function validatePermissions(plugin, permissions, msg) {
  // Owner-only commands
  if (plugin.owner && !permissions.isOwner) {
    return {
      success: false,
      message: '🔒 Este comando solo puede ser usado por el propietario del bot'
    };
  }
  
  // Moderator-only commands
  if (plugin.mods && !permissions.isModerator) {
    return {
      success: false,
      message: '🔒 Este comando solo puede ser usado por moderadores'
    };
  }
  
  // Premium-only commands
  if (plugin.premium && !permissions.isPremium) {
    return {
      success: false,
      message: '💎 Este comando requiere membresía premium'
    };
  }
  
  // Group admin-only commands
  if (plugin.admin && !permissions.isGroupAdmin && !permissions.isOwner) {
    return {
      success: false,
      message: '👑 Este comando solo puede ser usado por administradores del grupo'
    };
  }
  
  // Bot admin required commands
  if (plugin.botAdmin && !permissions.isBotAdmin) {
    return {
      success: false,
      message: '🤖 El bot necesita ser administrador para ejecutar este comando'
    };
  }
  
  // Group-only commands
  if (plugin.group && !msg.isGroup) {
    return {
      success: false,
      message: '👥 Este comando solo puede ser usado en grupos'
    };
  }
  
  // Private-only commands
  if (plugin.private && msg.isGroup) {
    return {
      success: false,
      message: '💬 Este comando solo puede ser usado en chat privado'
    };
  }
  
  return { success: true };
}

/**
 * Get authentication level for logging
 */
function getAuthLevel(permissions) {
  if (permissions.isOwner) return 'owner';
  if (permissions.isModerator) return 'moderator';
  if (permissions.isPremium) return 'premium';
  if (permissions.isGroupAdmin) return 'group_admin';
  return 'user';
}

/**
 * Check user ban status
 */
export function checkUserBan(userId) {
  try {
    const userData = getUserData(userId);
    
    if (userData.banned) {
      const reason = userData.banReason || 'Violación de términos de uso';
      return {
        banned: true,
        reason,
        bannedAt: userData.bannedAt || Date.now()
      };
    }
    
    return { banned: false };
    
  } catch (error) {
    logger.error('Error checking user ban status:', error);
    return { banned: false };
  }
}

/**
 * Ban user middleware
 */
export function createBanMiddleware() {
  return async function banMiddleware(context, next) {
    const { msg } = context;
    
    // Skip for owners
    if (authManager.isOwner(msg.sender)) {
      return next();
    }
    
    const banStatus = checkUserBan(msg.sender);
    
    if (banStatus.banned) {
      const duration = Date.now() - banStatus.bannedAt;
      const timeAgo = Math.floor(duration / (1000 * 60 * 60 * 24)); // days
      
      await msg.reply(
        `🚫 *Usuario Baneado*\n\n` +
        `*Razón:* ${banStatus.reason}\n` +
        `*Tiempo:* ${timeAgo} días\n\n` +
        `Contacta a un administrador para más información.`
      );
      
      return; // Stop execution
    }
    
    return next();
  };
}

/**
 * Registration check middleware
 */
export function createRegistrationMiddleware() {
  return async function registrationMiddleware(context, next) {
    const { msg, plugin } = context;
    
    // Skip if plugin doesn't require registration
    if (!plugin.registered) {
      return next();
    }
    
    const userData = getUserData(msg.sender);
    
    if (!userData.registered) {
      await msg.reply(
        '📝 *Registro Requerido*\n\n' +
        'Necesitas registrarte para usar este comando.\n' +
        'Usa: `/register <nombre> <edad>`'
      );
      
      return; // Stop execution
    }
    
    return next();
  };
}

/**
 * Cooldown check for authenticated commands
 */
export function checkAuthCooldown(userId, commandName, cooldownMs) {
  if (!cooldownMs || cooldownMs <= 0) return { allowed: true };
  
  const key = `auth_cooldown_${userId}_${commandName}`;
  const lastUsed = global.authCooldowns?.get(key) || 0;
  const now = Date.now();
  
  if (now - lastUsed < cooldownMs) {
    const remaining = cooldownMs - (now - lastUsed);
    return {
      allowed: false,
      remaining: Math.ceil(remaining / 1000) // seconds
    };
  }
  
  // Initialize cooldowns map if not exists
  if (!global.authCooldowns) {
    global.authCooldowns = new Map();
  }
  
  global.authCooldowns.set(key, now);
  
  return { allowed: true };
}

/**
 * Create permission summary for user
 */
export function createPermissionSummary(permissions) {
  const perms = [];
  
  if (permissions.isOwner) perms.push('👑 Propietario');
  if (permissions.isModerator) perms.push('🛡️ Moderador');
  if (permissions.isPremium) perms.push('💎 Premium');
  if (permissions.isGroupAdmin) perms.push('👥 Admin del Grupo');
  
  return perms.length > 0 ? perms.join(' • ') : '👤 Usuario Regular';
}
