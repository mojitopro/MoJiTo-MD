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

    // Create socket with bulletproof session management
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
      markOnlineOnConnect: false,
      shouldSyncHistoryMessage: () => false,
      shouldIgnoreJid: jid => jid === 'status@broadcast',
      retryRequestDelayMs: 1000,
      maxMsgRetryCount: 2,
      fireInitQueries: false,
      appStateMacVerification: {
        patch: false,
        snapshot: false
      },
      // Disable problematic features that cause session issues
      linkPreviewImageThumbnailWidth: 0,
      transactionOpts: {
        maxCommitRetries: 1,
        delayBetweenTriesMs: 500
      },
      getMessage: async (key) => {
        // Always return empty to prevent session conflicts
        return undefined;
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
        logger.info(`👤 Logged in as: ${sock.user.name || 'User'} (${sock.user.id})`);
      }

      if (isNewLogin) {
        logger.info('🆕 New login session created');
      }

      sock.isConnected = true;
      global.conn = sock;

      // Send notification to owner
      await sendConnectionNotification(sock);
      
      // Enable message processing after successful connection with delay
      setTimeout(() => {
        sock.shouldProcessMessages = true;
        logger.info('📱 Message processing enabled');
      }, 5000); // Wait 5 seconds before enabling message processing
    }

    // Handle connection closed
    if (connection === 'close') {
      sock.isConnected = false;
      sock.shouldProcessMessages = false;
      logger.info('📱 Message processing disabled');
      await handleDisconnection(lastDisconnect, usePairingCode, phoneNumber);
    }

    // Reduce console spam - only log important state changes
    if (connection === 'open' || connection === 'close') {
      logger.info(`🔄 Connection: ${connection}`);
    }
  });

  // Store processed message IDs to prevent loops
  const processedMessages = new Set();

  // Handle messages with loop prevention
  sock.ev.on('messages.upsert', (m) => {
    try {
      // Only process messages if connection is stable and ready
      if (!sock.isConnected || !sock.shouldProcessMessages) {
        return;
      }

      // Filter and prevent message loops
      const validMessages = m.messages.filter(msg => {
        // Create unique message ID
        const msgId = `${msg.key.remoteJid}-${msg.key.id}`;
        
        // Skip if already processed
        if (processedMessages.has(msgId)) {
          return false;
        }
        
        // Skip problematic messages
        if (!msg.key || !msg.key.remoteJid) return false;
        if (msg.key.remoteJid === 'status@broadcast') return false;
        if (msg.key.fromMe) return false;
        if (!msg.message) return false;
        
        // Skip encrypted/problematic message types
        if (msg.message.senderKeyDistributionMessage) return false;
        if (msg.message.protocolMessage) return false;
        if (msg.message.reactionMessage) return false;
        
        // Mark as processed
        processedMessages.add(msgId);
        
        // Clean old processed messages (keep only last 100)
        if (processedMessages.size > 100) {
          const oldEntries = Array.from(processedMessages).slice(0, 50);
          oldEntries.forEach(id => processedMessages.delete(id));
        }
        
        return true;
      });

      if (validMessages.length > 0) {
        // Reduce spam - only log commands, not all messages
        
        // Process messages with bulletproof command system
        for (const msg of validMessages) {
          setImmediate(async () => {
            try {
              const text = msg.message?.conversation || 
                          msg.message?.extendedTextMessage?.text || 
                          msg.message?.imageMessage?.caption || '';
              
              if (!text) return;
              
              // Command processing - only log commands to reduce spam
              if (text.startsWith('.') || text.startsWith('/') || text.startsWith('!')) {
                const command = text.slice(1).split(' ')[0].toLowerCase();
                logger.info(`🚀 Command: ${command}`); // Reduced spam
                
                try {
                  switch (command) {
                    case 'ping':
                    case 'p':
                      await sock.sendMessage(msg.key.remoteJid, { 
                        text: '🏓 Pong! Bot funcionando perfectamente!' 
                      });
                      break;
                      
                    case 'bot':
                    case 'info':
                      const uptime = Math.floor(process.uptime() / 60);
                      const memory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
                      await sock.sendMessage(msg.key.remoteJid, { 
                        text: `🤖 *MoJiTo Bot*\n\n⏰ Activo: ${uptime} min\n💾 Memoria: ${memory} MB\n🔗 Estado: Conectado\n📱 Comandos: .ping .info .test`
                      });
                      break;
                      
                    case 'test':
                      await sock.sendMessage(msg.key.remoteJid, { 
                        text: '✅ Test exitoso!\n\nBot funcionando al 100%' 
                      });
                      break;
                      
                    default:
                      await sock.sendMessage(msg.key.remoteJid, { 
                        text: `❓ Comando "${command}" no encontrado.\n\nDisponibles: .ping .info .test`
                      });
                  }
                } catch (cmdError) {
                  logger.error(`Command error: ${cmdError.message}`);
                }
              }
            } catch (error) {
              logger.error(`Message error: ${error.message}`);
            }
          });
        }
      }
    } catch (error) {
      logger.debug('Message processing error (filtered)');
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

  // Handle message receipts and presence silently to prevent session conflicts
  sock.ev.on('message-receipt.update', () => {});
  sock.ev.on('presence.update', () => {});

  // Store global reference
  global.conn = sock;
}

/**
 * Display QR code with clear instructions
 */
function handleQRDisplay(qr) {
  console.log('\n' + '═'.repeat(50));
  console.log('📱 CÓDIGO QR PARA WHATSAPP');
  console.log('═'.repeat(50));
  
  // QR muy pequeño para que quepa en pantalla
  qrcode.generate(qr, { small: true, width: 40 });
  
  console.log('═'.repeat(50));
  console.log('📋 PASOS:');
  console.log('1. WhatsApp > Configuración');
  console.log('2. Dispositivos vinculados');
  console.log('3. Escanear código');
  console.log('═'.repeat(50) + '\n');
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
 * Handle disconnection with smart reconnection - FIXED for session persistence
 */
async function handleDisconnection(lastDisconnect, usePairingCode, phoneNumber) {
  const reason = lastDisconnect?.error?.output?.statusCode;
  const reasonText = getDisconnectReasonText(reason);
  
  // Reduce console spam - only log significant disconnections
  if (reason !== DisconnectReason.connectionClosed && reason !== DisconnectReason.timedOut) {
    logger.warn(`🔌 Disconnected: ${reasonText}`);
  }

  switch (reason) {
    case DisconnectReason.loggedOut:
      // CRITICAL FIX: Don't clear session immediately on 401 - it might be temporary
      // Only clear after multiple failed attempts
      if (reconnectAttempts >= 3) {
        logger.warn('🚪 Multiple login failures, clearing session...');
        await clearAuthState();
        setTimeout(() => restartConnection(usePairingCode, phoneNumber), 5000);
      } else {
        logger.info('🔄 Login issue, retrying without clearing session...');
        await attemptReconnection(usePairingCode, phoneNumber, 3000);
      }
      break;

    case DisconnectReason.restartRequired:
      setTimeout(() => restartConnection(usePairingCode, phoneNumber), 3000);
      break;

    case DisconnectReason.connectionClosed:
    case DisconnectReason.connectionLost:
    case DisconnectReason.timedOut:
      // Quick reconnection for network issues
      await attemptReconnection(usePairingCode, phoneNumber, 2000);
      break;

    case DisconnectReason.badSession:
      // Only clear session if explicitly bad session
      logger.warn('🧹 Bad session detected, cleaning up...');
      await clearAuthState();
      setTimeout(() => restartConnection(usePairingCode, phoneNumber), 5000);
      break;

    default:
      await attemptReconnection(usePairingCode, phoneNumber, 5000);
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
        text: `🤖 *MoJiTo Bot Conectado*\n\n✅ Bot online exitosamente\n👤 ${sock.user?.name || sock.user?.id?.split('@')[0] || 'Usuario'}\n🕐 ${new Date().toLocaleString()}\n🚀 Sistema optimizado funcionando`
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
      // CONSERVATIVE session cleanup - preserve as much as possible
      const files = fs.readdirSync(authStateFolder);
      let hasValidCreds = false;
      
      // Check if we have valid credentials first
      for (const file of files) {
        if (file === 'creds.json') {
          try {
            const credsPath = path.join(authStateFolder, file);
            const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
            if (creds.me && creds.me.id) {
              hasValidCreds = true;
              break;
            }
          } catch {}
        }
      }
      
      if (hasValidCreds) {
        // Only remove problematic session files, keep credentials
        for (const file of files) {
          if (file.includes('sender-key-memory') || file.includes('session-memory')) {
            try {
              fs.unlinkSync(path.join(authStateFolder, file));
            } catch {}
          }
        }
        logger.info('🧹 Cleaned session cache, preserved credentials');
      } else {
        // Only clear everything if no valid credentials found
        fs.rmSync(authStateFolder, { recursive: true, force: true });
        logger.info('🧹 Full auth state cleared');
      }
    }
  } catch (error) {
    logger.debug('Session cleanup error:', error.message);
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