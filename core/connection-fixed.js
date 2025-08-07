/**
 * REWRITTEN WhatsApp Connection System
 * BULLETPROOF implementation for both QR and Pairing Code
 * Optimized for Termux, Replit, and all environments
 */
import pkg from 'baileys';
const { 
  default: makeWASocket, 
  DisconnectReason, 
  useMultiFileAuthState, 
  makeCacheableSignalKeyStore,
  Browsers,
  delay,
  fetchLatestBaileysVersion
} = pkg;
import qrcode from 'qrcode-terminal';
import { logger } from '../services/logger.js';
import fs from 'fs';
import path from 'path';

// Connection state management
let globalConn = null;
let reconnectAttempts = 0;
let maxReconnectAttempts = 10;
let isConnecting = false;
let authStateFolder = './MojiSession';

/**
 * Initialize WhatsApp connection with bulletproof logic
 */
export async function initializeConnection(options = {}) {
  try {
    if (isConnecting) {
      logger.warn('Connection already in progress...');
      return globalConn;
    }

    isConnecting = true;
    logger.info('🚀 Initializing WhatsApp connection...');

    // Parse options
    const usePairingCode = options.usePairingCode || process.env.USE_PAIRING_CODE === 'true';
    let phoneNumber = options.phoneNumber || process.env.PHONE_NUMBER;

    // Validate phone number for pairing code
    if (usePairingCode) {
      if (!phoneNumber) {
        throw new Error('Phone number required for pairing code mode');
      }
      phoneNumber = cleanPhoneNumber(phoneNumber);
      logger.info(`📱 Pairing code mode for: +${phoneNumber}`);
    } else {
      logger.info('📱 QR code mode enabled');
    }

    // Ensure auth folder exists
    if (!fs.existsSync(authStateFolder)) {
      fs.mkdirSync(authStateFolder, { recursive: true });
    }

    // Get latest Baileys version
    let version;
    try {
      const versionInfo = await fetchLatestBaileysVersion();
      version = versionInfo.version;
      logger.info(`📦 Baileys version: ${version.join('.')}`);
    } catch (vError) {
      // Fallback to a known stable version
      version = [2, 3000, 1023223821];
      logger.warn(`Using fallback version: ${version.join('.')}`);
    }

    // Initialize auth state
    const { state, saveCreds } = await useMultiFileAuthState(authStateFolder);

    // Create socket with optimized config for session stability
    const sock = makeWASocket({
      version,
      logger: createBaileysLogger(),
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, createBaileysLogger())
      },
      printQRInTerminal: false,
      mobile: usePairingCode,
      browser: usePairingCode ? 
        Browsers.ubuntu('Chrome') : 
        ['MoJiTo-MD', 'Safari', '1.0.0'],
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 0,
      keepAliveIntervalMs: 30000,
      emitOwnEvents: true,
      generateHighQualityLinkPreview: false,
      syncFullHistory: false,
      markOnlineOnConnect: true,
      shouldSyncHistoryMessage: () => false,
      shouldIgnoreJid: jid => jid === 'status@broadcast',
      retryRequestDelayMs: 500,
      maxMsgRetryCount: 3,
      appStateMacVerification: {
        patch: false,
        snapshot: false
      },
      getMessage: async (key) => {
        // Return empty message to prevent session issues
        return { conversation: '' };
      }
    });

    globalConn = sock;
    setupEventHandlers(sock, saveCreds, usePairingCode, phoneNumber);

    isConnecting = false;
    return sock;

  } catch (error) {
    isConnecting = false;
    logger.error('Failed to initialize connection:', error.message);
    throw error;
  }
}

/**
 * Setup all event handlers
 */
function setupEventHandlers(sock, saveCreds, usePairingCode, phoneNumber) {
  // Save credentials on update
  sock.ev.on('creds.update', saveCreds);

  // Handle connection updates
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr, isOnline, isNewLogin } = update;

    // Handle QR code
    if (qr && !usePairingCode) {
      handleQRDisplay(qr);
    }

    // Handle pairing code
    if (qr && usePairingCode && phoneNumber) {
      await handlePairingCodeGeneration(sock, phoneNumber);
    }

    // Handle connection established
    if (connection === 'open') {
      reconnectAttempts = 0;
      logger.success('🎉 Connected to WhatsApp successfully!');
      
      if (sock.user) {
        logger.info(`👤 Logged in as: ${sock.user.name} (${sock.user.id})`);
      }

      if (isNewLogin) {
        logger.info('🆕 New login session created');
      }

      sock.isConnected = true;
      global.conn = sock;

      // Send notification to owner
      await sendConnectionNotification(sock);
    }

    // Handle connection closed
    if (connection === 'close') {
      sock.isConnected = false;
      await handleDisconnection(lastDisconnect, usePairingCode, phoneNumber);
    }

    // Log connection state changes
    if (connection) {
      logger.info(`🔄 Connection state: ${connection}`);
    }

    if (typeof isOnline === 'boolean') {
      logger.debug(`📡 Status: ${isOnline ? 'Online' : 'Offline'}`);
    }
  });

  // Handle messages with session protection
  sock.ev.on('messages.upsert', (m) => {
    try {
      // Filter out messages that might cause session issues
      const validMessages = m.messages.filter(msg => {
        // Skip messages from status broadcasts
        if (msg.key.remoteJid === 'status@broadcast') return false;
        // Skip messages without proper content
        if (!msg.message) return false;
        return true;
      });

      if (validMessages.length > 0) {
        sock.ev.emit('message.upsert', { messages: validMessages, type: m.type });
      }
    } catch (error) {
      logger.debug('Message processing error:', error.message);
    }
  });

  // Handle group updates
  sock.ev.on('group-participants.update', (update) => {
    try {
      sock.ev.emit('participants.update', update);
    } catch (error) {
      logger.debug('Group update error:', error.message);
    }
  });

  // Handle message receipts to prevent session issues
  sock.ev.on('message-receipt.update', (receipts) => {
    // Silently handle receipts without emitting to prevent session conflicts
    logger.debug(`Received ${receipts.length} message receipts`);
  });

  // Handle presence updates
  sock.ev.on('presence.update', (presence) => {
    // Silently handle presence to prevent session conflicts
    logger.debug(`Presence update for ${presence.id}`);
  });

  // Store global reference
  global.conn = sock;
}

/**
 * Display QR code with clear instructions
 */
function handleQRDisplay(qr) {
  console.log('\n' + '═'.repeat(60));
  console.log('📱 ESCANEA ESTE CÓDIGO QR CON WHATSAPP');
  console.log('═'.repeat(60));
  
  qrcode.generate(qr, { small: true });
  
  console.log('═'.repeat(60));
  console.log('📋 INSTRUCCIONES:');
  console.log('1. Abre WhatsApp en tu teléfono');
  console.log('2. Ve a Configuración > Dispositivos vinculados');
  console.log('3. Toca "Vincular un dispositivo"');
  console.log('4. Escanea este código QR');
  console.log('═'.repeat(60) + '\n');
}

/**
 * Generate and display pairing code
 */
async function handlePairingCodeGeneration(sock, phoneNumber) {
  try {
    logger.info('🔐 Generating pairing code...');
    
    // Wait for connection to stabilize
    await delay(3000);
    
    const code = await sock.requestPairingCode(phoneNumber);
    
    if (code && code.length >= 6) {
      handlePairingCodeDisplay(code, phoneNumber);
      return true;
    } else {
      throw new Error('Invalid pairing code received');
    }
    
  } catch (error) {
    logger.error('❌ Pairing code failed:', error.message);
    
    // Try alternative formats
    const alternatives = getPhoneNumberAlternatives(phoneNumber);
    
    for (const altPhone of alternatives) {
      try {
        logger.info(`🔄 Trying format: +${altPhone}`);
        await delay(2000);
        
        const code = await sock.requestPairingCode(altPhone);
        if (code && code.length >= 6) {
          handlePairingCodeDisplay(code, altPhone);
          return true;
        }
      } catch (altError) {
        logger.debug(`Format +${altPhone} failed`);
        continue;
      }
    }
    
    logger.error('❌ All pairing attempts failed, falling back to QR');
    return false;
  }
}

/**
 * Display pairing code with instructions
 */
function handlePairingCodeDisplay(code, phoneNumber) {
  console.log('\n' + '═'.repeat(60));
  console.log('🔐 CÓDIGO DE EMPAREJAMIENTO WHATSAPP');
  console.log('═'.repeat(60));
  console.log(`📱 TELÉFONO: +${phoneNumber}`);
  console.log(`🔑 CÓDIGO: ${code}`);
  console.log('═'.repeat(60));
  console.log('📋 INSTRUCCIONES:');
  console.log('1. Abre WhatsApp en tu teléfono');
  console.log('2. Ve a Configuración > Dispositivos vinculados');
  console.log('3. Toca "Vincular un dispositivo"');
  console.log('4. Toca "Vincular con número de teléfono"');
  console.log(`5. Ingresa este código: ${code}`);
  console.log('═'.repeat(60) + '\n');
  
  logger.success(`✅ Pairing code: ${code}`);
}

/**
 * Handle disconnection with smart reconnection
 */
async function handleDisconnection(lastDisconnect, usePairingCode, phoneNumber) {
  const reason = lastDisconnect?.error?.output?.statusCode;
  const reasonText = getDisconnectReasonText(reason);
  
  logger.warn(`🔌 Disconnected: ${reasonText} (${reason})`);

  switch (reason) {
    case DisconnectReason.loggedOut:
      logger.warn('🚪 Logged out, clearing session...');
      await clearAuthState();
      setTimeout(() => restartConnection(usePairingCode, phoneNumber), 5000);
      break;

    case DisconnectReason.restartRequired:
      logger.info('🔄 Restart required');
      setTimeout(() => restartConnection(usePairingCode, phoneNumber), 3000);
      break;

    case DisconnectReason.connectionClosed:
    case DisconnectReason.connectionLost:
    case DisconnectReason.timedOut:
      await attemptReconnection(usePairingCode, phoneNumber);
      break;

    case DisconnectReason.badSession:
      logger.warn('🧹 Bad session, cleaning up...');
      await clearAuthState();
      setTimeout(() => restartConnection(usePairingCode, phoneNumber), 5000);
      break;

    default:
      logger.error('❌ Unrecoverable error');
      await attemptReconnection(usePairingCode, phoneNumber, 10000);
      break;
  }
}

/**
 * Attempt reconnection with exponential backoff
 */
async function attemptReconnection(usePairingCode, phoneNumber, customDelay = null) {
  if (reconnectAttempts >= maxReconnectAttempts) {
    logger.error('❌ Max reconnection attempts reached');
    setTimeout(() => process.exit(1), 5000);
    return;
  }

  reconnectAttempts++;
  const delay = customDelay || Math.min(2000 * Math.pow(1.5, reconnectAttempts), 30000);

  logger.info(`🔄 Reconnection attempt ${reconnectAttempts}/${maxReconnectAttempts} in ${delay}ms`);

  setTimeout(async () => {
    try {
      isConnecting = false;
      await initializeConnection({ usePairingCode, phoneNumber });
    } catch (error) {
      logger.error('Reconnection failed:', error.message);
      await attemptReconnection(usePairingCode, phoneNumber);
    }
  }, delay);
}

/**
 * Restart connection completely
 */
async function restartConnection(usePairingCode, phoneNumber) {
  try {
    reconnectAttempts = 0;
    isConnecting = false;
    await initializeConnection({ usePairingCode, phoneNumber });
  } catch (error) {
    logger.error('Failed to restart connection:', error.message);
  }
}

/**
 * Send connection notification to owner
 */
async function sendConnectionNotification(sock) {
  try {
    if (global.owner && global.owner[0] && global.owner[0][0]) {
      const ownerJid = global.owner[0][0] + '@s.whatsapp.net';
      await sock.sendMessage(ownerJid, {
        text: `🤖 *MoJiTo Bot Conectado*\n\n✅ Bot online exitosamente\n👤 ${sock.user.name}\n🕐 ${new Date().toLocaleString()}\n🚀 Sistema optimizado funcionando`
      });
      logger.info('📨 Notification sent to owner');
    }
  } catch (error) {
    logger.debug('Could not send notification:', error.message);
  }
}

/**
 * Utility functions
 */
function cleanPhoneNumber(phone) {
  return phone.replace(/[^0-9]/g, '');
}

function getPhoneNumberAlternatives(phone) {
  const clean = cleanPhoneNumber(phone);
  const alternatives = [];

  // Brazil formats
  if (clean.startsWith('55') && clean.length === 13) {
    alternatives.push(clean.substring(2));
    alternatives.push('55' + clean.substring(4));
  }

  // US formats
  if (clean.startsWith('1') && clean.length === 11) {
    alternatives.push(clean.substring(1));
  }

  // Add country codes
  if (!clean.startsWith('55') && clean.length === 11) {
    alternatives.push('55' + clean);
  }

  if (!clean.startsWith('1') && clean.length === 10) {
    alternatives.push('1' + clean);
  }

  return alternatives.filter(alt => alt !== clean && alt.length >= 10);
}

function getDisconnectReasonText(code) {
  const reasons = {
    [DisconnectReason.badSession]: 'Bad Session',
    [DisconnectReason.connectionClosed]: 'Connection Closed',
    [DisconnectReason.connectionLost]: 'Connection Lost',
    [DisconnectReason.connectionReplaced]: 'Connection Replaced',
    [DisconnectReason.loggedOut]: 'Logged Out',
    [DisconnectReason.multideviceMismatch]: 'Multi-device Mismatch',
    [DisconnectReason.restartRequired]: 'Restart Required',
    [DisconnectReason.timedOut]: 'Timed Out'
  };
  return reasons[code] || 'Unknown';
}

function createBaileysLogger() {
  return {
    fatal: (...args) => {
      const msg = args.join(' ');
      if (!msg.includes('Decrypted message with closed session')) {
        logger.error('❌ [BAILEYS]', ...args);
      }
    },
    error: (...args) => {
      const msg = args.join(' ');
      if (!msg.includes('Decrypted message with closed session') && 
          !msg.includes('Closing open session') &&
          !msg.includes('SessionEntry')) {
        logger.error('❌ [BAILEYS]', ...args);
      }
    },
    warn: (...args) => {
      const msg = args.join(' ');
      if (!msg.includes('Decrypted message with closed session')) {
        logger.warn('⚠️  [BAILEYS]', ...args);
      }
    },
    info: (...args) => logger.debug('[BAILEYS]', ...args),
    debug: (...args) => {
      // Filter out session-related debug messages
      const msg = args.join(' ');
      if (!msg.includes('Decrypted message with closed session') &&
          !msg.includes('Closing session') &&
          !msg.includes('SessionEntry')) {
        logger.debug('[BAILEYS]', ...args);
      }
    },
    trace: (...args) => logger.debug('[BAILEYS]', ...args),
    child: () => createBaileysLogger(),
    level: 'warn'
  };
}

async function clearAuthState() {
  try {
    if (fs.existsSync(authStateFolder)) {
      // Clear only problematic files, keep valid session data
      const files = fs.readdirSync(authStateFolder);
      for (const file of files) {
        const filePath = path.join(authStateFolder, file);
        try {
          // Remove only if file is corrupted or causing issues
          if (file.includes('session-') || file.includes('sender-key-')) {
            fs.unlinkSync(filePath);
          }
        } catch (fileError) {
          // If we can't read/remove individual files, remove the entire folder
          fs.rmSync(authStateFolder, { recursive: true, force: true });
          break;
        }
      }
      logger.info('🧹 Auth state cleaned');
    }
  } catch (error) {
    logger.error('Error clearing auth state:', error.message);
    // Force removal if selective cleaning fails
    try {
      if (fs.existsSync(authStateFolder)) {
        fs.rmSync(authStateFolder, { recursive: true, force: true });
      }
    } catch (forceError) {
      logger.error('Force cleanup failed:', forceError.message);
    }
  }
}

/**
 * Close connection gracefully
 */
export async function closeConnection() {
  if (globalConn) {
    try {
      globalConn.isConnected = false;
      await globalConn.logout();
      globalConn = null;
      logger.info('👋 Connection closed gracefully');
    } catch (error) {
      logger.error('Error closing connection:', error.message);
    }
  }
}

/**
 * Get connection status
 */
export function getConnectionStatus() {
  return {
    connected: globalConn?.isConnected || false,
    user: globalConn?.user || null,
    reconnectAttempts,
    isConnecting
  };
}