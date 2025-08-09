/**
 * SISTEMA LIMPIO DE CONEXIÓN CON PAIRING CODE
 * Integración nativa con el sistema MoJiTo existente
 * Sin logs innecesarios, completamente optimizado
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
import fs from 'fs';

// Configuración
const TARGET_PHONE = '5521989050540';
const AUTH_FOLDER = './MojiSession';
const MAX_RECONNECTS = 3;

// Estado global
let connection = null;
let reconnectAttempts = 0;
let isConnecting = false;

/**
 * Inicializar conexión con pairing code
 */
export async function initializeConnection() {
  if (isConnecting) {
    return connection;
  }

  try {
    isConnecting = true;
    
    // Mensaje limpio de inicio
    console.clear();
    console.log('\n🚀 MoJiTo Ultra Bot - Iniciando...');
    console.log(`📱 Número: +${TARGET_PHONE}`);
    console.log('⚡ Sistema ultra rápido activado\n');

    // Preparar carpeta de sesión
    if (!fs.existsSync(AUTH_FOLDER)) {
      fs.mkdirSync(AUTH_FOLDER, { recursive: true });
    }

    // Cargar estado de autenticación
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);

    // Crear socket limpio y optimizado
    const socket = makeWASocket({
      logger: createSilentLogger(), // Sin logs de baileys
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, createSilentLogger())
      },
      printQRInTerminal: false,
      browser: Browsers.ubuntu('Chrome'),
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 30000,
      emitOwnEvents: true,
      generateHighQualityLinkPreview: false,
      syncFullHistory: false,
      markOnlineOnConnect: true,
      getMessage: async () => undefined
    });

    connection = socket;
    setupEventHandlers(socket, saveCreds);
    
    isConnecting = false;
    return socket;

  } catch (error) {
    isConnecting = false;
    logger.error('Error de inicialización:', error.message);
    throw error;
  }
}

/**
 * Configurar manejadores de eventos limpios
 */
function setupEventHandlers(socket, saveCreds) {
  // Guardar credenciales
  socket.ev.on('creds.update', saveCreds);

  // Manejar conexión
  socket.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    // Generar pairing code cuando sea necesario
    if (qr && !socket.authState?.creds?.registered) {
      await generatePairingCode(socket);
    }

    // Conexión exitosa
    if (connection === 'open') {
      reconnectAttempts = 0;
      
      console.clear();
      console.log('\n🎉 ¡CONEXIÓN EXITOSA!');
      console.log('════════════════════════');
      console.log(`👤 Usuario: ${socket.user?.name || 'Usuario'}`);
      console.log(`📞 Número: +${TARGET_PHONE}`);
      console.log('⚡ Bot ultra rápido ACTIVO');
      console.log('🚀 Listo para comandos');
      console.log('════════════════════════\n');
      
      // Configurar para uso global
      socket.isConnected = true;
      socket.shouldProcessMessages = true;
      global.conn = socket;

      // Notificar al propietario (sin logs)
      try {
        await socket.sendMessage(`${TARGET_PHONE}@s.whatsapp.net`, {
          text: `🚀 *MoJiTo Ultra Bot Conectado*\n\n✅ Pairing code exitoso\n⚡ Sistema ultra rápido activo\n💎 Bot funcionando perfectamente\n\n*¡Listo para todos tus comandos!*`
        });
      } catch (e) {
        // Ignorar error de notificación
      }
    }

    // Manejo de desconexión
    if (connection === 'close') {
      socket.isConnected = false;
      socket.shouldProcessMessages = false;
      await handleReconnection(lastDisconnect);
    }
  });
}

/**
 * Generar código de emparejamiento
 */
async function generatePairingCode(socket) {
  try {
    console.log('🔐 Generando código de emparejamiento...\n');
    
    await delay(3000);
    const code = await socket.requestPairingCode(TARGET_PHONE);
    
    if (code && code.length >= 6) {
      showPairingCode(code);
    } else {
      throw new Error('Código inválido');
    }
    
  } catch (error) {
    console.log('🔄 Intentando formato alternativo...\n');
    
    try {
      await delay(3000);
      const altCode = await socket.requestPairingCode(TARGET_PHONE.substring(2));
      if (altCode && altCode.length >= 6) {
        showPairingCode(altCode);
      }
    } catch (altError) {
      console.log('❌ Error generando código:', altError.message);
    }
  }
}

/**
 * Mostrar código de manera limpia
 */
function showPairingCode(code) {
  console.clear();
  console.log('\n' + '🔥'.repeat(50));
  console.log('🚀 CÓDIGO DE EMPAREJAMIENTO');
  console.log('🔥'.repeat(50));
  console.log(`📱 Teléfono: +${TARGET_PHONE}`);
  console.log(`🔑 Código: ${code.toUpperCase()}`);
  console.log('🔥'.repeat(50));
  console.log('📋 PASOS:');
  console.log('1. WhatsApp > Configuración');
  console.log('2. Dispositivos vinculados');
  console.log('3. Vincular dispositivo');
  console.log('4. Vincular con número');
  console.log(`5. Ingresar: ${code.toUpperCase()}`);
  console.log('🔥'.repeat(50));
  console.log('⏳ Esperando confirmación...');
  console.log('🔥'.repeat(50) + '\n');
}

/**
 * Manejar reconexión
 */
async function handleReconnection(lastDisconnect) {
  const reason = lastDisconnect?.error?.output?.statusCode;
  
  if (reason === DisconnectReason.loggedOut || reason === DisconnectReason.badSession) {
    console.log('🧹 Limpiando sesión...\n');
    try {
      if (fs.existsSync(AUTH_FOLDER)) {
        fs.rmSync(AUTH_FOLDER, { recursive: true });
      }
    } catch (e) {}
    
    await delay(2000);
    await initializeConnection();
    
  } else if (reconnectAttempts < MAX_RECONNECTS) {
    reconnectAttempts++;
    console.log(`🔄 Reconectando (${reconnectAttempts}/${MAX_RECONNECTS})...\n`);
    
    await delay(5000);
    try {
      connection = null;
      await initializeConnection();
    } catch (error) {
      console.log(`❌ Reconexión ${reconnectAttempts} falló\n`);
    }
  }
}

/**
 * Logger silencioso para evitar spam
 */
function createSilentLogger() {
  return {
    trace: () => {},
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
    fatal: () => {},
    child: () => createSilentLogger()
  };
}

export { connection };