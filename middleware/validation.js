/**
 * Message Validation Middleware
 * Input validation and message filtering
 */
import { logger } from '../services/logger.js';
import { getChatData } from '../services/database.js';
import { FILE_LIMITS } from '../config/constants.js';

/**
 * Validate incoming message
 */
export function validateMessage(msg) {
  try {
    // Basic message structure validation
    if (!isValidMessageStructure(msg)) {
      return false;
    }
    
    // Skip validation for system messages
    if (isSystemMessage(msg)) {
      return true;
    }
    
    // Content validation
    if (!validateMessageContent(msg)) {
      return false;
    }
    
    // Media validation
    if (hasMedia(msg) && !validateMediaContent(msg)) {
      return false;
    }
    
    return true;
    
  } catch (error) {
    logger.error('Message validation error:', error);
    return false;
  }
}

/**
 * Validate basic message structure
 */
function isValidMessageStructure(msg) {
  if (!msg || typeof msg !== 'object') return false;
  if (!msg.key || !msg.key.id) return false;
  if (!msg.sender) return false;
  if (!msg.chat) return false;
  
  return true;
}

/**
 * Check if message is from system
 */
function isSystemMessage(msg) {
  return (
    msg.key.fromMe ||
    msg.sender === 'system' ||
    msg.chat === 'status@broadcast'
  );
}

/**
 * Validate message content
 */
function validateMessageContent(msg) {
  const text = getMessageText(msg);
  
  if (text) {
    // Check text length
    if (text.length > 10000) {
      logger.debug('Message rejected: text too long');
      return false;
    }
    
    // Check for malicious patterns
    if (containsMaliciousContent(text)) {
      logger.warn('Message rejected: potentially malicious content');
      return false;
    }
    
    // Group-specific validation
    if (msg.isGroup && !validateGroupMessage(msg, text)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Get text from message
 */
function getMessageText(msg) {
  return (
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    msg.message?.videoMessage?.caption ||
    ''
  );
}

/**
 * Check for malicious content patterns
 */
function containsMaliciousContent(text) {
  const maliciousPatterns = [
    // Script injection attempts
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    
    // Common XSS patterns
    /javascript:/gi,
    /vbscript:/gi,
    /onload\s*=/gi,
    /onerror\s*=/gi,
    
    // SQL injection patterns
    /union\s+select/gi,
    /drop\s+table/gi,
    /delete\s+from/gi,
    
    // Command injection
    /\|\s*rm\s+-rf/gi,
    /&&\s*rm\s+-rf/gi,
    
    // Suspicious Unicode
    /[\u202E\u202D]/g // Right-to-left override characters
  ];
  
  return maliciousPatterns.some(pattern => pattern.test(text));
}

/**
 * Validate group-specific messages
 */
function validateGroupMessage(msg, text) {
  try {
    const chatData = getChatData(msg.chat);
    
    // Anti-link validation
    if (chatData.antiLink && containsLinks(text, 'whatsapp')) {
      handleAntiLink(msg, 'whatsapp');
      return false;
    }
    
    if (chatData.antiLink2 && containsLinks(text, 'general')) {
      handleAntiLink(msg, 'general');
      return false;
    }
    
    // Anti-toxic validation
    if (chatData.antiToxic && containsToxicContent(text)) {
      handleAntiToxic(msg);
      return false;
    }
    
    return true;
    
  } catch (error) {
    logger.error('Group message validation error:', error);
    return true; // Allow on error
  }
}

/**
 * Check for links in text
 */
function containsLinks(text, type = 'general') {
  const patterns = {
    whatsapp: [
      /chat\.whatsapp\.com/gi,
      /wa\.me/gi,
      /whatsapp\.com\/join/gi
    ],
    general: [
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi,
      /www\.[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi
    ]
  };
  
  const typePatterns = patterns[type] || patterns.general;
  return typePatterns.some(pattern => pattern.test(text));
}

/**
 * Handle anti-link violation
 */
async function handleAntiLink(msg, type) {
  try {
    // Delete message if possible
    if (global.conn) {
      await global.conn.sendMessage(msg.chat, { delete: msg.key });
    }
    
    logger.info(`Anti-link triggered (${type}) for ${msg.sender} in ${msg.chat}`);
    
    // Could implement warnings system here
    
  } catch (error) {
    logger.error('Error handling anti-link:', error);
  }
}

/**
 * Check for toxic content
 */
function containsToxicContent(text) {
  const toxicPatterns = [
    // Common offensive words (basic example - would need more comprehensive list)
    /\b(spam|scam|fake|virus|hack)\b/gi,
    
    // Excessive caps (more than 70% uppercase)
    /^[A-Z\s]{10,}$/,
    
    // Excessive repetition
    /(.)\1{10,}/,
    
    // Multiple excessive punctuation
    /[!?]{5,}/
  ];
  
  return toxicPatterns.some(pattern => pattern.test(text));
}

/**
 * Handle anti-toxic violation
 */
async function handleAntiToxic(msg) {
  try {
    // Delete message
    if (global.conn) {
      await global.conn.sendMessage(msg.chat, { delete: msg.key });
    }
    
    // Send warning
    const warning = '⚠️ Mensaje eliminado por contenido inapropiado';
    await global.conn.sendMessage(msg.chat, { 
      text: warning,
      quoted: msg 
    });
    
    logger.info(`Anti-toxic triggered for ${msg.sender} in ${msg.chat}`);
    
  } catch (error) {
    logger.error('Error handling anti-toxic:', error);
  }
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
 * Validate media content
 */
function validateMediaContent(msg) {
  try {
    const mediaMessage = getMediaMessage(msg);
    if (!mediaMessage) return true;
    
    // Check file size
    if (mediaMessage.fileLength > FILE_LIMITS.maxSize) {
      logger.debug('Media rejected: file too large');
      return false;
    }
    
    // Check MIME type
    if (mediaMessage.mimetype && !isAllowedMimeType(mediaMessage.mimetype)) {
      logger.debug('Media rejected: invalid MIME type');
      return false;
    }
    
    return true;
    
  } catch (error) {
    logger.error('Media validation error:', error);
    return true; // Allow on error
  }
}

/**
 * Get media message object
 */
function getMediaMessage(msg) {
  return (
    msg.message?.imageMessage ||
    msg.message?.videoMessage ||
    msg.message?.audioMessage ||
    msg.message?.documentMessage ||
    msg.message?.stickerMessage ||
    null
  );
}

/**
 * Check if MIME type is allowed
 */
function isAllowedMimeType(mimeType) {
  const allowedTypes = [
    // Images
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    
    // Videos
    'video/mp4', 'video/avi', 'video/mov', 'video/wmv',
    
    // Audio
    'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/mpeg',
    
    // Documents
    'application/pdf', 
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  
  return allowedTypes.includes(mimeType.toLowerCase());
}

/**
 * Sanitize text input
 */
export function sanitizeText(text, maxLength = 1000) {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .slice(0, maxLength)
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width characters
    .replace(/[\u202A-\u202E]/g, '') // Remove directional formatting
    .replace(/[<>]/g, '') // Remove potential HTML
    .trim();
}

/**
 * Validate command parameters
 */
export function validateCommandParams(args, rules = {}) {
  const errors = [];
  
  // Check minimum arguments
  if (rules.minArgs && args.length < rules.minArgs) {
    errors.push(`Mínimo ${rules.minArgs} argumentos requeridos`);
  }
  
  // Check maximum arguments
  if (rules.maxArgs && args.length > rules.maxArgs) {
    errors.push(`Máximo ${rules.maxArgs} argumentos permitidos`);
  }
  
  // Validate specific argument patterns
  if (rules.patterns) {
    for (let i = 0; i < rules.patterns.length; i++) {
      const pattern = rules.patterns[i];
      const arg = args[i];
      
      if (arg && !pattern.test(arg)) {
        errors.push(`Argumento ${i + 1} tiene formato inválido`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Check message for view-once media
 */
export function hasViewOnceMedia(msg) {
  return !!(
    msg.message?.viewOnceMessage ||
    msg.message?.imageMessage?.viewOnce ||
    msg.message?.videoMessage?.viewOnce
  );
}
