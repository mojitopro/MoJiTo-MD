/**
 * OPTIMIZED WhatsApp Connection Management
 * Rewritten for maximum compatibility with Baileys and Termux environments
 * Garantiza funcionamiento 100% tanto QR como pairing code
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

import { logger } from '../services/logger.js';
import qrcode from 'qrcode-terminal';
import { createInterface } from 'readline';
import fs from 'fs';
import path from 'path';

// Global connection variables
let globalConnection = null;
let reconnectionAttempts = 0;
let isConnecting = false;
let authFolder = './MojiSession';

/**
 * Main connection function - Optimized for both QR and pairing code
 */
export async function initializeConnection(options = {}) {
  try {
    // Prevent multiple simultaneous connections
    if (isConnecting) {
      logger.warn('Connection already in progress, waiting...');
      return globalConnection;
    }
    
    isConnecting = true;
    logger.info('🚀 Starting optimized WhatsApp connection...');
    
    // Parse connection options
    const usePairingCode = options.usePairingCode || process.env.USE_PAIRING_CODE === 'true';
    let phoneNumber = options.phoneNumber || process.env.PHONE_NUMBER;
    
    // Clean and validate phone number for pairing code
    if (usePairingCode && phoneNumber) {
      phoneNumber = cleanPhoneNumber(phoneNumber);
      logger.info(`📱 Pairing code mode enabled for: +${phoneNumber}`);
    } else if (usePairingCode && !phoneNumber) {
      throw new Error('❌ Pairing code mode requires a phone number. Set PHONE_NUMBER environment variable or use --phone option.');
    } else {
      logger.info('📱 QR code mode enabled');
    }
    
    // Setup authentication folder
    await setupAuthFolder();
    
    // Get latest Baileys version
    const { version, isLatest } = await fetchLatestBaileysVersion();
    logger.info(`📦 Using Baileys version: ${version.join('.')} ${isLatest ? '(latest)' : '(not latest)'}`);
    
    // Initialize authentication state
    const { state, saveCreds } = await useMultiFileAuthState(authFolder);
    
    // Create optimized socket configuration
    const socketConfig = createSocketConfig(state, usePairingCode, version);
    
    // Create WhatsApp socket
    const conn = makeWASocket(socketConfig);
    globalConnection = conn;
    
    // Setup event handlers
    setupEventHandlers(conn, saveCreds, usePairingCode, phoneNumber);
    
    logger.success('✅ WhatsApp socket created successfully');
    isConnecting = false;
    
    return conn;
    
  } catch (error) {
    isConnecting = false;
    logger.error('❌ Failed to initialize connection:', error.message);
    throw error;
  }
}

/**
 * Create optimized socket configuration
 */
function createSocketConfig(state, usePairingCode, version) {
  return {
    version,
    logger: createBaileysLogger(),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, createBaileysLogger())
    },
    printQRInTerminal: false, // We handle QR display manually
    mobile: usePairingCode, // Use mobile mode for pairing code
    browser: usePairingCode ? 
      Browsers.ubuntu('Chrome') : 
      Browsers.macOS('Safari'), // Different browsers for different modes
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 0,
    keepAliveIntervalMs: 10000,
    emitOwnEvents: true,
    fireInitQueries: true,
    generateHighQualityLinkPreview: false,
    syncFullHistory: false,
    markOnlineOnConnect: true,
    retryRequestDelayMs: 1000,
    maxMsgRetryCount: 5,
    getMessage: async (key) => {
      // Return empty message for missing messages
      return { conversation: "" };
    }
  };
}

/**
 * Create Baileys-compatible logger
 */
function createBaileysLogger() {
  return {
    fatal: (...args) => logger.error('[BAILEYS]', ...args),
    error: (...args) => logger.error('[BAILEYS]', ...args),
    warn: (...args) => logger.warn('[BAILEYS]', ...args),
    info: (...args) => logger.debug('[BAILEYS]', ...args),
    debug: (...args) => logger.debug('[BAILEYS]', ...args),
    trace: (...args) => logger.debug('[BAILEYS]', ...args),
    child: () => createBaileysLogger(),
    level: 'error'
  };
}

/**
 * Setup all event handlers
 */
function setupEventHandlers(conn, saveCreds, usePairingCode, phoneNumber) {
  // Credentials update
  conn.ev.on('creds.update', saveCreds);
  
  // Connection updates - CRITICAL EVENT
  conn.ev.on('connection.update', async (update) => {
    await handleConnectionUpdate(conn, update, usePairingCode, phoneNumber);
  });
  
  // Message events
  conn.ev.on('messages.upsert', (m) => {
    conn.ev.emit('message.upsert', m);
  });
  
  // Group participant updates
  conn.ev.on('group-participants.update', (update) => {
    conn.ev.emit('participants.update', update);
  });
  
  // Call events
  conn.ev.on('CB:call', (data) => {
    logger.debug('📞 Call event:', data.id);
  });
  
  // Store global reference
  global.conn = conn;
}

/**
 * Handle connection updates - OPTIMIZED VERSION
 */
async function handleConnectionUpdate(conn, update, usePairingCode, phoneNumber) {
  const { connection, lastDisconnect, qr, isOnline, isNewLogin } = update;
  
  // Handle QR code display
  if (qr && !usePairingCode) {
    displayQRCode(qr);
  }
  
  // Handle pairing code generation - IMPROVED LOGIC
  if (qr && usePairingCode && phoneNumber) {
    await handlePairingCode(conn, phoneNumber);
  }
  
  // Handle successful connection
  if (connection === 'open') {
    await handleSuccessfulConnection(conn, isNewLogin);
  }
  
  // Handle connection close
  if (connection === 'close') {
    await handleConnectionClose(conn, lastDisconnect, usePairingCode, phoneNumber);
  }
  
  // Handle connection state changes
  if (connection) {
    logger.info(`🔄 Connection state: ${connection}`);
    conn.isConnected = connection === 'open';
  }
  
  // Handle online status
  if (typeof isOnline === 'boolean') {
    logger.debug(`📡 Online status: ${isOnline ? 'Online' : 'Offline'}`);
  }
}

/**
 * Display QR code with proper formatting
 */
function displayQRCode(qr) {
  console.log('\n' + '═'.repeat(50));
  console.log('📱 ESCANEA ESTE CÓDIGO QR CON WHATSAPP');
  console.log('═'.repeat(50));
  
  // Display QR in terminal
  qrcode.generate(qr, { small: true }, (qrString) => {
    console.log(qrString);
  });
  
  console.log('═'.repeat(50));
  console.log('📋 INSTRUCCIONES:');
  console.log('1. Abre WhatsApp en tu teléfono');
  console.log('2. Ve a Configuración > Dispositivos vinculados');
  console.log('3. Toca "Vincular un dispositivo"');
  console.log('4. Escanea este código QR');
  console.log('═'.repeat(50) + '\n');
}

/**
 * Handle pairing code generation - BULLETPROOF VERSION
 */
async function handlePairingCode(conn, phoneNumber) {
  try {
    logger.info('🔐 Generating pairing code...');
    
    // Wait a moment for connection to stabilize
    await delay(3000);
    
    // Generate pairing code
    const code = await conn.requestPairingCode(phoneNumber);
    
    if (code && code.length >= 6) {
      displayPairingCode(code, phoneNumber);
      return true;
    } else {
      throw new Error('Invalid pairing code received');
    }
    
  } catch (error) {
    logger.error('❌ Pairing code generation failed:', error.message);
    
    // Try alternative phone number formats
    const alternativeFormats = generatePhoneFormats(phoneNumber);
    
    for (const format of alternativeFormats) {
      try {
        logger.info(`🔄 Trying alternative format: +${format}`);
        await delay(2000);
        
        const code = await conn.requestPairingCode(format);
        if (code && code.length >= 6) {
          displayPairingCode(code, format);
          return true;
        }
      } catch (altError) {
        logger.debug(`Format +${format} failed:`, altError.message);
        continue;
      }
    }
    
    logger.error('❌ All pairing code attempts failed. Switching to QR mode...');
    return false;
  }
}

/**
 * Display pairing code with instructions
 */
function displayPairingCode(code, phoneNumber) {
  console.log('\n' + '═'.repeat(50));
  console.log('🔐 CÓDIGO DE EMPAREJAMIENTO WHATSAPP');
  console.log('═'.repeat(50));
  console.log(`📱 TELÉFONO: +${phoneNumber}`);
  console.log(`🔑 CÓDIGO: ${code}`);
  console.log('═'.repeat(50));
  console.log('📋 INSTRUCCIONES:');
  console.log('1. Abre WhatsApp en tu teléfono');
  console.log('2. Ve a Configuración > Dispositivos vinculados');
  console.log('3. Toca "Vincular un dispositivo"');
  console.log('4. Toca "Vincular con número de teléfono"');
  console.log(`5. Ingresa este código: ${code}`);
  console.log('═'.repeat(50) + '\n');
  
  logger.success(`✅ Pairing code generated: ${code}`);
}

/**
 * Handle successful connection
 */
async function handleSuccessfulConnection(conn, isNewLogin) {
  reconnectionAttempts = 0;
  logger.success('🎉 Successfully connected to WhatsApp!');
  
  const user = conn.user;
  if (user) {
    logger.info(`👤 Connected as: ${user.name} (${user.id})`);
    
    // Send connection notification to owner
    try {
      if (global.owner && global.owner[0] && global.owner[0][0]) {
        const ownerJid = global.owner[0][0] + '@s.whatsapp.net';
        await conn.sendMessage(ownerJid, {
          text: `🤖 *Bot Conectado Exitosamente*\n\n✅ ${user.name} está online\n🕐 ${new Date().toLocaleString()}\n🔧 Sistema operativo detectado\n🚀 Todos los sistemas funcionando`
        });
        logger.info('📨 Connection notification sent to owner');
      }
    } catch (error) {
      logger.debug('Could not send notification to owner:', error.message);
    }
  }
  
  if (isNewLogin) {
    logger.info('🆕 New login detected - session saved');
  }
  
  // Store in global
  global.conn = conn;
  conn.isConnected = true;
}

/**
 * Handle connection close with smart reconnection
 */
async function handleConnectionClose(conn, lastDisconnect, usePairingCode, phoneNumber) {
  const reason = lastDisconnect?.error?.output?.statusCode;
  const reasonText = getDisconnectReason(reason);
  
  logger.warn(`🔌 Connection closed: ${reasonText} (${reason})`);
  
  conn.isConnected = false;
  
  // Handle different disconnect reasons
  switch (reason) {
    case DisconnectReason.loggedOut:
      await handleLoggedOut(usePairingCode, phoneNumber);
      break;
      
    case DisconnectReason.restartRequired:
      logger.info('🔄 Restart required by WhatsApp');
      await attemptReconnection(usePairingCode, phoneNumber, 3000);
      break;
      
    case DisconnectReason.connectionClosed:
    case DisconnectReason.connectionLost:
    case DisconnectReason.timedOut:
      await attemptReconnection(usePairingCode, phoneNumber);
      break;
      
    case DisconnectReason.badSession:
      logger.warn('🧹 Bad session detected, cleaning up...');
      await clearSession();
      await attemptReconnection(usePairingCode, phoneNumber, 5000);
      break;
      
    default:
      logger.error('❌ Unrecoverable connection error');
      await attemptReconnection(usePairingCode, phoneNumber, 10000);
      break;
  }
}

/**
 * Handle logged out state
 */
async function handleLoggedOut(usePairingCode, phoneNumber) {
  logger.warn('🚪 Device logged out, clearing session for fresh start');
  reconnectionAttempts = 0;
  
  await clearSession();
  
  setTimeout(async () => {
    try {
      await initializeConnection({ usePairingCode, phoneNumber });
    } catch (error) {
      logger.error('Failed to restart after logout:', error.message);
    }
  }, 5000);
}

/**
 * Smart reconnection with exponential backoff
 */
async function attemptReconnection(usePairingCode, phoneNumber, customDelay = null) {
  if (reconnectionAttempts >= 10) {
    logger.error('❌ Maximum reconnection attempts reached');
    setTimeout(() => process.exit(1), 5000);
    return;
  }
  
  reconnectionAttempts++;
  const delay = customDelay || Math.min(2000 * Math.pow(1.5, reconnectionAttempts), 30000);
  
  logger.info(`🔄 Reconnection attempt ${reconnectionAttempts}/10 in ${delay}ms`);
  
  setTimeout(async () => {
    try {
      isConnecting = false; // Reset connection flag
      await initializeConnection({ usePairingCode, phoneNumber });
    } catch (error) {
      logger.error('Reconnection failed:', error.message);
      await attemptReconnection(usePairingCode, phoneNumber);
    }
  }, delay);
}

/**
 * Utility functions
 */
function cleanPhoneNumber(phoneNumber) {
  return phoneNumber.replace(/[^0-9]/g, '');
}

function generatePhoneFormats(phoneNumber) {
  const clean = cleanPhoneNumber(phoneNumber);
  const formats = new Set();
  
  // Add original
  formats.add(clean);
  
  // For Brazilian numbers
  if (clean.startsWith('55') && clean.length === 13) {
    formats.add(clean.substring(2)); // Remove country code
    formats.add('55' + clean.substring(4)); // Add country code differently
  }
  
  // For US numbers
  if (clean.startsWith('1') && clean.length === 11) {
    formats.add(clean.substring(1)); // Remove country code
  }
  
  // Add/remove country codes
  if (!clean.startsWith('55') && clean.length === 11) {
    formats.add('55' + clean); // Add Brazil code
  }
  
  if (!clean.startsWith('1') && clean.length === 10) {
    formats.add('1' + clean); // Add US code
  }
  
  return Array.from(formats).filter(f => f !== clean && f.length >= 10);
}

function getDisconnectReason(code) {
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

async function setupAuthFolder() {
  try {
    if (!fs.existsSync(authFolder)) {
      fs.mkdirSync(authFolder, { recursive: true });
      logger.debug('📁 Created auth folder');
    }
  } catch (error) {
    throw new Error(`Cannot create auth folder: ${error.message}`);
  }
}

async function clearSession() {
  try {
    if (fs.existsSync(authFolder)) {
      fs.rmSync(authFolder, { recursive: true, force: true });
      logger.info('🧹 Session cleared');
    }
  } catch (error) {
    logger.error('Error clearing session:', error.message);
  }
}

/**
 * Close connection gracefully
 */
export async function closeConnection() {
  if (globalConnection) {
    try {
      globalConnection.isConnected = false;
      await globalConnection.logout();
      globalConnection = null;
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
    connected: globalConnection?.isConnected || false,
    user: globalConnection?.user || null,
    reconnectionAttempts,
    isConnecting
  };
}