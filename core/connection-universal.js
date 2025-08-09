/**
 * CONEXIÓN UNIVERSAL - QR Y PAIRING CODE
 * Sistema híbrido que maneja ambos métodos de forma armoniosa
 */
import { 
  makeWASocket, 
  DisconnectReason, 
  useMultiFileAuthState, 
  makeCacheableSignalKeyStore,
  Browsers,
  delay,
  fetchLatestBaileysVersion
} from 'baileys';
import { logger } from '../services/logger.js';
import { displayQR } from '../utils/formatters-optimized.js';
import fs from 'fs';
import qrcode from 'qrcode-terminal';
import chalk from 'chalk';
import gradient from 'gradient-string';

const AUTH_FOLDER = './MojiSession';
let connection = null;
let isConnecting = false;

/**
 * Inicializar conexión universal (QR o Pairing Code)
 */
export async function initializeConnection(options = {}) {
  if (isConnecting) {
    return connection;
  }

  try {
    isConnecting = true;
    
    const { usePairingCode = false, phoneNumber = null } = options;
    
    logger.info(`🔌 Iniciando conexión - Método: ${usePairingCode ? 'Pairing Code' : 'QR'}`);
    
    // Preparar directorio de sesión
    await prepareSessionDirectory();
    
    // Estado de autenticación
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
    
    // Crear socket con configuración optimizada
    const socket = await createOptimizedSocket(state, saveCreds);
    
    // Configurar eventos según el método elegido
    await setupConnectionEvents(socket, saveCreds, usePairingCode, phoneNumber);
    
    connection = socket;
    isConnecting = false;
    
    return socket;

  } catch (error) {
    isConnecting = false;
    logger.error('❌ Error de conexión:', error.message);
    throw error;
  }
}

/**
 * Preparar directorio de sesión
 */
async function prepareSessionDirectory() {
  try {
    if (!fs.existsSync(AUTH_FOLDER)) {
      fs.mkdirSync(AUTH_FOLDER, { recursive: true });
      logger.debug('📁 Directorio de sesión creado');
    }
  } catch (error) {
    logger.error('❌ Error creando directorio de sesión:', error.message);
    throw error;
  }
}

/**
 * Crear socket optimizado para WhatsApp
 */
async function createOptimizedSocket(state, saveCreds) {
  const socket = makeWASocket({
    logger: createSilentLogger(),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, createSilentLogger())
    },
    printQRInTerminal: false, // Lo manejamos manualmente
    browser: Browsers.ubuntu('Chrome'),
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000,
    generateHighQualityLinkPreview: false,
    syncFullHistory: false,
    markOnlineOnConnect: true,
    getMessage: async () => undefined,
    shouldIgnoreJid: jid => isJidBroadcast(jid),
    shouldSyncHistoryMessage: msg => {
      return !msg.message?.protocolMessage
    }
  });

  // Guardar credenciales automáticamente
  socket.ev.on('creds.update', saveCreds);
  
  return socket;
}

/**
 * Configurar eventos de conexión según el método
 */
async function setupConnectionEvents(socket, saveCreds, usePairingCode, phoneNumber) {
  socket.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    // Manejar QR Code
    if (qr && !usePairingCode) {
      await handleQRDisplay(qr);
    }
    
    // Manejar Pairing Code
    if (qr && usePairingCode && phoneNumber && !socket.authState?.creds?.registered) {
      await handlePairingCode(socket, phoneNumber);
    }

    // Conexión exitosa
    if (connection === 'open') {
      await handleSuccessfulConnection(socket);
    }

    // Manejar desconexiones
    if (connection === 'close') {
      await handleDisconnection(lastDisconnect, usePairingCode, phoneNumber);
    }
  });

  // CRÍTICO: Registrar manejador de mensajes globalmente para comandos
  global.messageHandler = null; // Se configurará en setupMessageHandler
}

/**
 * Mostrar código QR
 */
async function handleQRDisplay(qr) {
  console.log('\n' + '📱'.repeat(50));
  console.log(gradient.pastel('        🔗 CÓDIGO QR PARA WHATSAPP 🔗'));
  console.log('📱'.repeat(50));
  console.log();
  
  // Generar QR en terminal
  qrcode.generate(qr, { small: true }, (qrString) => {
    console.log(qrString);
  });
  
  console.log(chalk.yellow('📋 PASOS PARA CONECTAR:'));
  console.log(chalk.gray('1. Abre WhatsApp en tu teléfono'));
  console.log(chalk.gray('2. Ve a Configuración > Dispositivos vinculados'));
  console.log(chalk.gray('3. Toca "Vincular un dispositivo"'));
  console.log(chalk.gray('4. Escanea este código QR'));
  console.log();
}

/**
 * Manejar pairing code
 */
async function handlePairingCode(socket, phoneNumber) {
  await delay(1000); // Esperar a que el socket esté listo
  
  try {
    const pairingCode = await socket.requestPairingCode(phoneNumber);
    
    // Banner llamativo para pairing code
    console.log('\n' + '🔥'.repeat(70));
    console.log(gradient.pastel('🚀 CÓDIGO DE EMPAREJAMIENTO'));
    console.log('🔥'.repeat(70));
    console.log(chalk.cyan(`📱 Teléfono: +${phoneNumber}`));
    console.log(chalk.green(`🔑 Código: ${pairingCode}`));
    console.log('🔥'.repeat(70));
    console.log(chalk.yellow('📋 PASOS:'));
    console.log(chalk.gray('1. WhatsApp > Configuración'));
    console.log(chalk.gray('2. Dispositivos vinculados'));
    console.log(chalk.gray('3. Vincular dispositivo'));
    console.log(chalk.gray('4. Vincular con número'));
    console.log(chalk.gray(`5. Ingresar: ${pairingCode}`));
    console.log('🔥'.repeat(70));
    console.log(chalk.cyan('⏳ Esperando confirmación...'));
    console.log(chalk.yellow('💡 Ingresa el código en WhatsApp para conectar'));
    
  } catch (error) {
    logger.error('❌ Error generando pairing code:', error.message);
    await delay(3000);
    process.exit(1);
  }
}

/**
 * Manejar conexión exitosa
 */
async function handleSuccessfulConnection(socket) {
  console.clear();
  
  console.log('\n' + '🎉'.repeat(50));
  console.log(gradient.rainbow('        ¡CONEXIÓN EXITOSA!'));
  console.log('🎉'.repeat(50));
  console.log(chalk.green(`👤 Usuario: ${socket.user?.name || 'Conectado'}`));
  console.log(chalk.green(`📞 Número: ${socket.user?.id?.split(':')[0] || 'N/A'}`));
  console.log(chalk.green('⚡ Bot ultra rápido ACTIVO'));
  console.log(chalk.green('🚀 Sistema de comandos FUNCIONAL'));
  console.log(chalk.green('🔄 Procesamiento de mensajes ACTIVO'));
  console.log('🎉'.repeat(50));
  console.log();
  
  // Configurar socket globalmente para comandos
  socket.isConnected = true;
  socket.shouldProcessMessages = true;
  global.conn = socket;
  
  logger.info('✅ Conexión WhatsApp establecida exitosamente');
  logger.info('✅ Sistema de comandos activo y funcional');
}

/**
 * Manejar desconexiones y reconexión
 */
async function handleDisconnection(lastDisconnect, usePairingCode, phoneNumber) {
  const reason = lastDisconnect?.error?.output?.statusCode;
  
  logger.warn(`🔄 Conexión cerrada - Razón: ${reason}`);
  
  if (reason === DisconnectReason.badSession) {
    logger.error('❌ Sesión incorrecta - Eliminando y reiniciando...');
    if (fs.existsSync(AUTH_FOLDER)) {
      fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
    }
  } else if (reason === DisconnectReason.connectionClosed || 
             reason === DisconnectReason.connectionLost ||
             reason === DisconnectReason.restartRequired) {
    logger.info('🔄 Reconectando automáticamente...');
    await delay(5000);
    return initializeConnection({ usePairingCode, phoneNumber });
  } else if (reason === DisconnectReason.loggedOut) {
    logger.error('❌ Sesión cerrada - Nuevo código necesario...');
    if (fs.existsSync(AUTH_FOLDER)) {
      fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
    }
    process.exit(0);
  }
}

/**
 * Logger silencioso para Baileys
 */
function createSilentLogger() {
  return {
    fatal: () => {},
    error: () => {},
    warn: () => {},
    info: () => {},
    debug: () => {},
    trace: () => {},
    child: () => createSilentLogger(),
    level: 'silent'
  };
}

/**
 * Verificar si es JID broadcast
 */
function isJidBroadcast(jid) {
  return jid === 'status@broadcast';
}