/**
 * ULTRA-OPTIMIZED WhatsApp Connection System
 * Bulletproof implementation with pairing code support
 * Optimized for maximum speed and reliability in Replit
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

// Connection state
let globalConn = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
let isConnecting = false;
const authStateFolder = './MojiSession';

/**
 * Initialize ultra-fast WhatsApp connection
 */
export async function initializeConnection(options = {}) {
  if (isConnecting) {
    logger.info('Connection already in progress...');
    return globalConn;
  }

  try {
    isConnecting = true;
    logger.info('🚀 Initializing Ultra WhatsApp connection...');

    const usePairingCode = true; // Always use pairing code
    let phoneNumber = '5521989050540'; // Your specific number

    // Clean and format Brazilian number
    phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
    logger.info(`🇧🇷 Configurando número brasileño: +${phoneNumber}`);
    logger.info('📱 Modo pairing code activado - Solicitar código');

    // Ensure auth folder exists
    if (!fs.existsSync(authStateFolder)) {
      fs.mkdirSync(authStateFolder, { recursive: true });
    }

    // Initialize auth state
    const { state, saveCreds } = await useMultiFileAuthState(authStateFolder);

    // Create ultra-optimized socket
    const sock = makeWASocket({
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger)
      },
      printQRInTerminal: !usePairingCode,
      mobile: usePairingCode,
      browser: usePairingCode ? 
        ['MoJiTo Ultra', 'Chrome', '1.0.0'] : 
        ['MoJiTo Ultra', 'Safari', '1.0.0'],
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 30000,
      emitOwnEvents: true,
      generateHighQualityLinkPreview: false,
      syncFullHistory: false,
      markOnlineOnConnect: true,
      getMessage: async () => undefined
    });

    globalConn = sock;
    setupUltraEventHandlers(sock, saveCreds, usePairingCode, phoneNumber);

    isConnecting = false;
    return sock;

  } catch (error) {
    isConnecting = false;
    logger.error('Failed to initialize ultra connection:', error.message);
    throw error;
  }
}

/**
 * Setup ultra-optimized event handlers
 */
function setupUltraEventHandlers(sock, saveCreds, usePairingCode, phoneNumber) {
  // Save credentials
  sock.ev.on('creds.update', saveCreds);

  // Connection updates
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr, isOnline } = update;

    if (qr && !usePairingCode) {
      displayQR(qr);
    }

    if (qr && usePairingCode && !sock.authState.creds.registered) {
      try {
        const code = await sock.requestPairingCode(phoneNumber);
        logger.info(`\n🔑 CÓDIGO DE EMPAREJAMIENTO: ${code}`);
        logger.info(`📱 Ingresa este código en WhatsApp:`);
        logger.info(`📋 WhatsApp > Dispositivos vinculados > Vincular dispositivo`);
        logger.info(`🔢 Código: ${code.match(/.{1,4}/g)?.join('-') || code}`);
      } catch (error) {
        logger.error('Error generating pairing code:', error.message);
      }
    }

    if (connection === 'open') {
      reconnectAttempts = 0;
      logger.success('🎉 Ultra connection established!');
      logger.info(`👤 Connected as: ${sock.user?.name || 'User'}`);
      
      sock.isConnected = true;
      sock.shouldProcessMessages = true;
      global.conn = sock;

      // Notify successful connection
      await sendConnectionSuccess(sock);
    }

    if (connection === 'close') {
      sock.isConnected = false;
      sock.shouldProcessMessages = false;
      await handleUltraDisconnection(lastDisconnect, usePairingCode, phoneNumber);
    }
  });

  // Ultra-fast message handling
  sock.ev.on('messages.upsert', (m) => {
    if (!sock.isConnected || !sock.shouldProcessMessages) return;
    
    // Process valid messages only
    const validMessages = m.messages.filter(msg => 
      msg.key && 
      msg.key.remoteJid && 
      !msg.key.fromMe && 
      msg.message &&
      msg.key.remoteJid !== 'status@broadcast'
    );

    if (validMessages.length > 0) {
      // Emit to message handler
      sock.emit('messages.upsert', { messages: validMessages, type: m.type });
    }
  });
}

/**
 * Display QR code optimized
 */
function displayQR(qr) {
  console.log('\n' + '═'.repeat(50));
  console.log('📱 CÓDIGO QR PARA WHATSAPP');
  console.log('═'.repeat(50));
  
  qrcode.generate(qr, { small: true });
  
  console.log('═'.repeat(50));
  console.log('📋 PASOS:');
  console.log('1. WhatsApp > Configuración');
  console.log('2. Dispositivos vinculados');
  console.log('3. Escanear código');
  console.log('═'.repeat(50));
}

/**
 * Handle ultra disconnection
 */
async function handleUltraDisconnection(lastDisconnect, usePairingCode, phoneNumber) {
  const reason = lastDisconnect?.error?.output?.statusCode;
  let shouldReconnect = false;

  switch (reason) {
    case DisconnectReason.badSession:
      logger.error('❌ Bad session, cleaning...');
      await cleanSession();
      shouldReconnect = true;
      break;
      
    case DisconnectReason.connectionClosed:
      logger.info('🔄 Connection closed, reconnecting...');
      shouldReconnect = true;
      break;
      
    case DisconnectReason.connectionLost:
      logger.info('📡 Connection lost, reconnecting...');
      shouldReconnect = true;
      break;
      
    case DisconnectReason.connectionReplaced:
      logger.info('🔄 Connection replaced by another session');
      shouldReconnect = false;
      break;
      
    case DisconnectReason.loggedOut:
      logger.error('🚪 Logged out, cleaning session...');
      await cleanSession();
      shouldReconnect = true;
      break;
      
    case DisconnectReason.restartRequired:
      logger.info('♻️ Restart required, restarting...');
      shouldReconnect = true;
      break;
      
    default:
      logger.info(`📱 Connection closed: ${reason || 'Unknown'}`);
      shouldReconnect = true;
  }

  if (shouldReconnect && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    reconnectAttempts++;
    logger.info(`🔄 Reconnection attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);
    
    await delay(3000);
    
    try {
      globalConn = null;
      await initializeConnection({ usePairingCode, phoneNumber });
    } catch (error) {
      logger.error(`Reconnection ${reconnectAttempts} failed:`, error.message);
    }
  } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    logger.error(`❌ Max reconnection attempts reached. Manual restart required.`);
  }
}

/**
 * Clean session files
 */
async function cleanSession() {
  try {
    if (fs.existsSync(authStateFolder)) {
      const files = fs.readdirSync(authStateFolder);
      for (const file of files) {
        fs.unlinkSync(path.join(authStateFolder, file));
      }
      logger.info('🧹 Session cleaned');
    }
  } catch (error) {
    logger.warn('Could not clean session:', error.message);
  }
}

/**
 * Send connection success notification
 */
async function sendConnectionSuccess(sock) {
  try {
    // Get owner number from config
    const owner = global.owner?.[0];
    if (owner) {
      await sock.sendMessage(owner + '@s.whatsapp.net', {
        text: `🚀 *MoJiTo Ultra Bot Conectado!* 🚀\n\n⚡ Sistema ultra optimizado activo\n💎 Respuestas en milisegundos\n🔥 Bot funcionando al 100%\n\n*¡Listo para comandos ultra rápidos!*`
      });
    }
  } catch (error) {
    logger.debug('Could not send connection notification:', error.message);
  }
}

export { globalConn };