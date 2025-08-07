/**
 * Simple Utility Functions
 * Basic utility functions for WhatsApp bot operations
 */
import { logger } from '../services/logger.js';

/**
 * Parse message for commands and content
 */
export function parseMessage(msg) {
  const text = getMessageText(msg);
  const isCommand = global.prefix && global.prefix.test(text);
  
  let command = '';
  let args = [];
  let fullArgs = '';
  
  if (isCommand) {
    const match = text.match(global.prefix);
    const prefixUsed = match[0];
    const commandText = text.slice(prefixUsed.length).trim();
    
    const parts = commandText.split(/\s+/);
    command = parts[0].toLowerCase();
    args = parts.slice(1);
    fullArgs = args.join(' ');
  }
  
  return {
    text,
    isCommand,
    command,
    args,
    fullArgs,
    prefix: isCommand ? text.match(global.prefix)[0] : ''
  };
}

/**
 * Get text content from message
 */
export function getMessageText(msg) {
  return (
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    msg.message?.videoMessage?.caption ||
    msg.message?.documentMessage?.caption ||
    ''
  );
}

/**
 * Check if message has quoted content
 */
export function hasQuoted(msg) {
  return !!(
    msg.message?.extendedTextMessage?.contextInfo?.quotedMessage ||
    msg.message?.imageMessage?.contextInfo?.quotedMessage ||
    msg.message?.videoMessage?.contextInfo?.quotedMessage
  );
}

/**
 * Get quoted message
 */
export function getQuoted(msg) {
  const contextInfo = 
    msg.message?.extendedTextMessage?.contextInfo ||
    msg.message?.imageMessage?.contextInfo ||
    msg.message?.videoMessage?.contextInfo;
    
  if (!contextInfo?.quotedMessage) return null;
  
  return {
    id: contextInfo.stanzaId,
    sender: contextInfo.participant,
    message: contextInfo.quotedMessage
  };
}

/**
 * Check if message has media
 */
export function hasMedia(msg) {
  return !!(
    msg.message?.imageMessage ||
    msg.message?.videoMessage ||
    msg.message?.audioMessage ||
    msg.message?.documentMessage ||
    msg.message?.stickerMessage
  );
}

/**
 * Get media type
 */
export function getMediaType(msg) {
  if (msg.message?.imageMessage) return 'image';
  if (msg.message?.videoMessage) return 'video';
  if (msg.message?.audioMessage) return 'audio';
  if (msg.message?.documentMessage) return 'document';
  if (msg.message?.stickerMessage) return 'sticker';
  return null;
}

/**
 * Format time difference
 */
export function timeAgo(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
}

/**
 * Format number with separators
 */
export function formatNumber(num) {
  return new Intl.NumberFormat('es-ES').format(num);
}

/**
 * Parse mentions from text
 */
export function parseMentions(text) {
  if (!text) return [];
  
  const mentions = [];
  const mentionRegex = /@(\d+)/g;
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1] + '@s.whatsapp.net');
  }
  
  return mentions;
}

/**
 * Generate random ID
 */
export function generateId(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Clean phone number
 */
export function cleanNumber(number) {
  return number.replace(/[^0-9]/g, '');
}

/**
 * Format WhatsApp number
 */
export function formatJID(number) {
  const clean = cleanNumber(number);
  return clean.includes('@') ? clean : clean + '@s.whatsapp.net';
}

/**
 * Check if number is valid WhatsApp format
 */
export function isValidJID(jid) {
  const patterns = [
    /^\d+@s\.whatsapp\.net$/,  // Individual
    /^\d+-\d+@g\.us$/,         // Group
    /^status@broadcast$/       // Status
  ];
  
  return patterns.some(pattern => pattern.test(jid));
}

/**
 * Escape regex special characters
 */
export function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Capitalize first letter
 */
export function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Convert object to array of entries
 */
export function objectEntries(obj) {
  return Object.entries(obj || {});
}

/**
 * Convert object to array of values
 */
export function objectValues(obj) {
  return Object.values(obj || {});
}

/**
 * Convert object to array of keys
 */
export function objectKeys(obj) {
  return Object.keys(obj || {});
}

/**
 * Check if value is empty
 */
export function isEmpty(value) {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Safe JSON parse
 */
export function safeJsonParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

/**
 * Safe JSON stringify
 */
export function safeJsonStringify(obj, fallback = '{}') {
  try {
    return JSON.stringify(obj);
  } catch {
    return fallback;
  }
}

/**
 * Simple message formatter for compatibility
 */
export function smsg(conn, m, store) {
  if (!m) return m;
  
  // Basic message processing
  if (m.key) {
    m.id = m.key.id;
    m.chat = m.key.remoteJid;
    m.fromMe = m.key.fromMe;
    m.isGroup = m.chat?.endsWith('@g.us') || false;
    m.sender = m.key.participant || m.key.remoteJid;
  }
  
  if (m.message) {
    m.body = m.message.conversation || 
             m.message.extendedTextMessage?.text || 
             m.message.imageMessage?.caption || 
             m.message.videoMessage?.caption || '';
    m.type = Object.keys(m.message)[0];
  }
  
  m.pushName = m.pushName || 'Unknown';
  
  return m;
}