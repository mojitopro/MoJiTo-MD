
/**
 * WhatsApp Connection Management
 * Handles authentication, connection state, and reconnection logic
 */
import pkg from '@whiskeysockets/baileys';
const { 
  default: createWASocket, 
  DisconnectReason, 
  useMultiFileAuthState, 
  makeCacheableSignalKeyStore,
  delay 
} = pkg;
import { logger } from '../services/logger.js';
import { displayQR, displayPairingCode } from '../utils/formatters.js';
import { CONNECTION_CONFIG } from '../config/constants.js';
import { createInterface } from 'readline';

let connectionAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
let usePairingCode = false;
let phoneNumber = null;
let globalConn = null;

export async function initializeConnection(options = {}) {
  try {
    logger.info('Starting connection initialization...');
    
    // Clear any existing connection
    if (globalConn) {
      try {
        await globalConn.logout();
      } catch (e) {
        logger.debug('Error during logout:', e);
      }
      globalConn = null;
    }

    // Test if we can create the session directory
    try {
      const fs = await import('fs');
      if (!fs.existsSync('./MojiSession')) {
        fs.mkdirSync('./MojiSession', { recursive: true });
        logger.debug('Created MojiSession directory');
      }
    } catch (error) {
      logger.error('Failed to create session directory:', error.message);
      throw new Error('Cannot create session directory: ' + error.message);
    }

    // Initialize authentication state with error handling
    let state, saveCreds;
    try {
      const authResult = await useMultiFileAuthState('./MojiSession');
      state = authResult.state;
      saveCreds = authResult.saveCreds;
      logger.debug('Authentication state initialized');
    } catch (error) {
      logger.error('Failed to initialize auth state:', error.message);
      throw new Error('Auth state initialization failed: ' + error.message);
    }
    
    // Set connection options
    usePairingCode = options.usePairingCode || process.env.USE_PAIRING_CODE === 'true';
    phoneNumber = options.phoneNumber || process.env.PHONE_NUMBER;
    
    // Validate phone number format for pairing code
    if (usePairingCode && phoneNumber) {
      phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
      
      // Handle different country codes and formats
      if (phoneNumber.startsWith('55') && phoneNumber.length === 13) {
        // Brazilian number with country code (55)
        logger.info(`Using Brazilian number format: +${phoneNumber}`);
      } else if (phoneNumber.startsWith('1') && phoneNumber.length === 11) {
        // US/Canada number format
        logger.info(`Using US/Canada number format: +${phoneNumber}`);
      } else if (phoneNumber.length >= 10 && phoneNumber.length <= 15) {
        // International format - keep as is
        logger.info(`Using international number format: +${phoneNumber}`);
      } else {
        logger.warn(`Phone number format may be invalid: ${phoneNumber}`);
      }
      
      logger.info(`Using pairing code mode with phone: +${phoneNumber}`);
    }
    
    // Create WhatsApp socket with enhanced configuration and error handling
    let conn;
    try {
      logger.debug('Creating WhatsApp socket...');
      
      // Create a compatible logger for Baileys
      const baileyLogger = {
        fatal: (...args) => logger.error(...args),
        error: (...args) => logger.error(...args),
        warn: (...args) => logger.warn(...args),
        info: (...args) => logger.info(...args),
        debug: (...args) => logger.debug(...args),
        trace: (...args) => logger.debug(...args),
        child: () => baileyLogger,
        level: 'error'
      };
      
      conn = createWASocket({
        ...CONNECTION_CONFIG,
        logger: baileyLogger, // Use our compatible logger
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, baileyLogger)
        },
        printQRInTerminal: false, // We handle QR manually
        mobile: usePairingCode,
        browser: usePairingCode ? 
          ["Chrome (Linux)", "", ""] : 
          ["MoJiTo Bot", "Desktop", "1.0.0"],
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 0,
        keepAliveIntervalMs: 10000,
        emitOwnEvents: true,
        fireInitQueries: true,
        generateHighQualityLinkPreview: false,
        syncFullHistory: false,
        markOnlineOnConnect: true
      });
      
      logger.debug('WhatsApp socket created successfully');
      
    } catch (error) {
      logger.error('Failed to create WhatsApp socket:', error.message);
      throw new Error('Socket creation failed: ' + error.message);
    }
    
    // Store global connection reference
    globalConn = conn;
    
    // Setup connection event handlers
    setupConnectionHandlers(conn, saveCreds);
    
    return conn;
    
  } catch (error) {
    logger.error('Failed to initialize connection:', error);
    throw error;
  }
}

function setupConnectionHandlers(conn, saveCreds) {
  // Connection updates
  conn.ev.on('connection.update', async (update) => {
    await handleConnectionUpdate(conn, update);
  });
  
  // Credentials updates
  conn.ev.on('creds.update', saveCreds);
  
  // Message handling
  conn.ev.on('messages.upsert', (m) => {
    conn.ev.emit('message.upsert', m);
  });
  
  // Group participants updates
  conn.ev.on('group-participants.update', (update) => {
    conn.ev.emit('participants.update', update);
  });

  // Handle connection errors
  conn.ev.on('CB:call', async (data) => {
    logger.debug('Call update received:', data);
  });
}

async function handleConnectionUpdate(conn, update) {
  const { connection, lastDisconnect, qr, isOnline, isNewLogin } = update;
  
  logger.debug('Connection update:', { connection, isOnline });
  
  // Handle QR code display
  if (qr && !usePairingCode) {
    logger.info('QR code received, displaying...');
    await displayQR(qr);
  }
  
  // Handle pairing code
  if (connection === 'connecting' && usePairingCode && phoneNumber && !conn.authState.creds.registered) {
    logger.info('Connection establishing, requesting pairing code...');
    
    let attempts = 0;
    const maxAttempts = 3;
    let codeGenerated = false;
    
    while (attempts < maxAttempts && !codeGenerated) {
      attempts++;
      try {
        await delay(1500 * attempts); // Progressive delay
        
        logger.info(`Attempting to generate pairing code (attempt ${attempts}/${maxAttempts})...`);
        const code = await conn.requestPairingCode(phoneNumber);
        
        if (code && code.length === 8) {
          logger.success(`Pairing code generated: ${code}`);
          await displayPairingCode(code);
          codeGenerated = true;
        } else {
          throw new Error('Invalid pairing code format received');
        }
        
      } catch (error) {
        logger.error(`Pairing code attempt ${attempts} failed:`, error.message);
        
        if (attempts < maxAttempts) {
          logger.info('Retrying with alternative format...');
          
          // Try different phone number formats
          const formats = [
            phoneNumber, // Original format
            phoneNumber.startsWith('55') ? phoneNumber.substring(2) : '55' + phoneNumber, // Toggle Brazil code
            phoneNumber.length > 11 ? phoneNumber.substring(1) : phoneNumber, // Remove first digit
            phoneNumber.replace(/^55/, '') // Remove Brazil code if present
          ];
          
          for (const format of formats) {
            if (format !== phoneNumber && format.length >= 10) {
              try {
                await delay(1000);
                logger.debug(`Trying format: +${format}`);
                const altCode = await conn.requestPairingCode(format);
                
                if (altCode && altCode.length === 8) {
                  logger.success(`Pairing code generated with format +${format}: ${altCode}`);
                  await displayPairingCode(altCode);
                  codeGenerated = true;
                  break;
                }
              } catch (formatError) {
                logger.debug(`Format +${format} failed:`, formatError.message);
                continue;
              }
            }
          }
        }
      }
      
      if (!codeGenerated && attempts === maxAttempts) {
        logger.error('All pairing code attempts failed. Switching to QR mode...');
        usePairingCode = false;
        logger.info('QR code will be displayed shortly...');
      }
    }
  }
  
  // Handle successful connection
  if (connection === 'open') {
    connectionAttempts = 0;
    logger.success('Successfully connected to WhatsApp');
    logger.info(`Connected as: ${conn.user?.name || 'Unknown'} (${conn.user?.id})`);
    conn.isConnected = true;
    
    // Set global connection
    global.conn = conn;
    
    if (isNewLogin) {
      logger.info('New login detected - credentials saved');
    }
    
    // Send connection confirmation message to owner if available
    try {
      if (global.owner && global.owner[0] && global.owner[0][0]) {
        const ownerJid = global.owner[0][0] + '@s.whatsapp.net';
        await conn.sendMessage(ownerJid, {
          text: `🤖 *MoJiTo Bot Conectado*\n\n✅ Bot iniciado exitosamente\n🕐 Hora: ${new Date().toLocaleString()}\n📱 Dispositivo: ${conn.user.name}\n🆔 ID: ${conn.user.id}`
        });
      }
    } catch (e) {
      logger.debug('Could not send connection message to owner:', e);
    }
  }
  
  // Handle online status
  if (isOnline !== undefined) {
    logger.debug(`WhatsApp status: ${isOnline ? 'Online' : 'Offline'}`);
  }
  
  // Handle disconnection
  if (connection === 'close') {
    conn.isConnected = false;
    const statusCode = lastDisconnect?.error?.output?.statusCode;
    const reason = Object.keys(DisconnectReason)[Object.values(DisconnectReason).indexOf(statusCode)] || 'Unknown';
    
    logger.warn(`Connection closed: ${reason} (${statusCode})`);
    
    if (statusCode === DisconnectReason.loggedOut) {
      logger.warn('Device logged out, clearing credentials for fresh authentication');
      connectionAttempts = 0;
      
      // Clear credentials
      try {
        const fs = await import('fs');
        if (fs.existsSync('./MojiSession')) {
          fs.rmSync('./MojiSession', { recursive: true, force: true });
          logger.info('Session cleared, ready for new authentication');
        }
      } catch (e) {
        logger.error('Error clearing session:', e);
      }
      
      // Restart with clean state
      setTimeout(async () => {
        try {
          await initializeConnection({ usePairingCode, phoneNumber });
        } catch (error) {
          logger.error('Failed to restart after logout:', error);
        }
      }, 3000);
      
    } else if (shouldReconnect(statusCode)) {
      await attemptReconnection();
    } else {
      logger.error('Connection closed with unrecoverable error, restarting process...');
      setTimeout(() => {
        process.exit(1);
      }, 5000);
    }
  }
}

function shouldReconnect(statusCode) {
  const reconnectableCodes = [
    DisconnectReason.connectionClosed,
    DisconnectReason.connectionLost,
    DisconnectReason.connectionReplaced,
    DisconnectReason.timedOut,
    DisconnectReason.restartRequired,
    DisconnectReason.multideviceMismatch,
    DisconnectReason.badSession
  ];
  
  return reconnectableCodes.includes(statusCode);
}

async function attemptReconnection() {
  if (connectionAttempts >= MAX_RECONNECT_ATTEMPTS) {
    logger.error('Max reconnection attempts reached, restarting process...');
    setTimeout(() => {
      process.exit(1);
    }, 5000);
    return;
  }
  
  connectionAttempts++;
  const delay = Math.min(1000 * Math.pow(2, connectionAttempts), 30000);
  
  logger.info(`Reconnection attempt ${connectionAttempts}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms`);
  
  setTimeout(async () => {
    try {
      await initializeConnection({ usePairingCode, phoneNumber });
    } catch (error) {
      logger.error('Reconnection failed:', error);
      await attemptReconnection();
    }
  }, delay);
}

// Export cleanup function
export async function closeConnection() {
  if (globalConn) {
    try {
      globalConn.isConnected = false;
      await globalConn.logout();
      globalConn = null;
    } catch (error) {
      logger.error('Error closing connection:', error);
    }
  }
}
