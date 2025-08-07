/**
 * Group Management Handler
 * Specialized handling for group-specific features
 */
import { logger } from '../services/logger.js';
import { getChatData } from '../services/database.js';
import { authManager } from '../core/auth.js';

export class GroupManager {
  constructor(conn) {
    this.conn = conn;
  }

  /**
   * Add user to muted list
   */
  async muteUser(groupId, userId, adminId) {
    try {
      // Check if admin has permission
      if (!await authManager.isGroupAdmin(adminId, groupId) && 
          !authManager.isOwner(adminId)) {
        return { success: false, message: 'No tienes permisos de administrador' };
      }
      
      const chatData = getChatData(groupId);
      
      if (!chatData.mutedUsers) {
        chatData.mutedUsers = [];
      }
      
      if (chatData.mutedUsers.includes(userId)) {
        return { success: false, message: 'El usuario ya está silenciado' };
      }
      
      chatData.mutedUsers.push(userId);
      
      logger.info(`User ${userId} muted in group ${groupId} by ${adminId}`);
      
      return { 
        success: true, 
        message: `Usuario @${userId.split('@')[0]} ha sido silenciado` 
      };
      
    } catch (error) {
      logger.error('Error muting user:', error);
      return { success: false, message: 'Error al silenciar usuario' };
    }
  }

  /**
   * Remove user from muted list
   */
  async unmuteUser(groupId, userId, adminId) {
    try {
      // Check if admin has permission
      if (!await authManager.isGroupAdmin(adminId, groupId) && 
          !authManager.isOwner(adminId)) {
        return { success: false, message: 'No tienes permisos de administrador' };
      }
      
      const chatData = getChatData(groupId);
      
      if (!chatData.mutedUsers || !chatData.mutedUsers.includes(userId)) {
        return { success: false, message: 'El usuario no está silenciado' };
      }
      
      chatData.mutedUsers = chatData.mutedUsers.filter(id => id !== userId);
      
      logger.info(`User ${userId} unmuted in group ${groupId} by ${adminId}`);
      
      return { 
        success: true, 
        message: `Usuario @${userId.split('@')[0]} ya no está silenciado` 
      };
      
    } catch (error) {
      logger.error('Error unmuting user:', error);
      return { success: false, message: 'Error al desilenciar usuario' };
    }
  }

  /**
   * Check if user is muted
   */
  isUserMuted(groupId, userId) {
    try {
      const chatData = getChatData(groupId);
      return chatData.mutedUsers?.includes(userId) || false;
    } catch (error) {
      logger.error('Error checking mute status:', error);
      return false;
    }
  }

  /**
   * Get list of muted users
   */
  getMutedUsers(groupId) {
    try {
      const chatData = getChatData(groupId);
      return chatData.mutedUsers || [];
    } catch (error) {
      logger.error('Error getting muted users:', error);
      return [];
    }
  }

  /**
   * Toggle group settings
   */
  async toggleSetting(groupId, setting, adminId) {
    try {
      // Check if admin has permission
      if (!await authManager.isGroupAdmin(adminId, groupId) && 
          !authManager.isOwner(adminId)) {
        return { success: false, message: 'No tienes permisos de administrador' };
      }
      
      const chatData = getChatData(groupId);
      const validSettings = [
        'welcome', 'antiLink', 'antiLink2', 'antiviewonce', 
        'antiToxic', 'autosticker', 'audios', 'modohorny'
      ];
      
      if (!validSettings.includes(setting)) {
        return { success: false, message: 'Configuración no válida' };
      }
      
      chatData[setting] = !chatData[setting];
      
      logger.info(`Setting ${setting} toggled to ${chatData[setting]} in group ${groupId} by ${adminId}`);
      
      return { 
        success: true, 
        message: `${setting} ${chatData[setting] ? 'activado' : 'desactivado'}`,
        value: chatData[setting]
      };
      
    } catch (error) {
      logger.error('Error toggling setting:', error);
      return { success: false, message: 'Error al cambiar configuración' };
    }
  }

  /**
   * Get group settings
   */
  getGroupSettings(groupId) {
    try {
      const chatData = getChatData(groupId);
      
      return {
        welcome: chatData.welcome || false,
        antiLink: chatData.antiLink || false,
        antiLink2: chatData.antiLink2 || false,
        antiviewonce: chatData.antiviewonce || false,
        antiToxic: chatData.antiToxic || false,
        autosticker: chatData.autosticker || false,
        audios: chatData.audios || false,
        modohorny: chatData.modohorny || false,
        mutedUsers: chatData.mutedUsers || []
      };
      
    } catch (error) {
      logger.error('Error getting group settings:', error);
      return {};
    }
  }

  /**
   * Clean group messages (admin only)
   */
  async cleanMessages(groupId, adminId, amount = 10) {
    try {
      // Check if admin has permission
      if (!await authManager.isGroupAdmin(adminId, groupId) && 
          !authManager.isOwner(adminId)) {
        return { success: false, message: 'No tienes permisos de administrador' };
      }
      
      // Check if bot is admin
      if (!await authManager.isBotGroupAdmin(groupId)) {
        return { success: false, message: 'El bot necesita ser administrador' };
      }
      
      const botMessages = global.botMessages?.[groupId] || [];
      const toDelete = botMessages.slice(-amount);
      
      let deletedCount = 0;
      
      for (const messageKey of toDelete) {
        try {
          await this.conn.sendMessage(groupId, { delete: messageKey });
          deletedCount++;
        } catch (error) {
          // Message might already be deleted
        }
      }
      
      // Update bot messages list
      global.botMessages[groupId] = botMessages.slice(0, -deletedCount);
      
      logger.info(`Cleaned ${deletedCount} messages in group ${groupId} by ${adminId}`);
      
      return { 
        success: true, 
        message: `Se eliminaron ${deletedCount} mensajes del bot` 
      };
      
    } catch (error) {
      logger.error('Error cleaning messages:', error);
      return { success: false, message: 'Error al limpiar mensajes' };
    }
  }
}

export function createGroupManager(conn) {
  return new GroupManager(conn);
}
