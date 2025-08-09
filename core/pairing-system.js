/**
 * SISTEMA ESPECIALIZADO DE PAIRING CODE
 * Diseñado específicamente para generar códigos de emparejamiento válidos
 * y mantener conexión ultra estable para tu número 5521989050540
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
import path from 'path';

// Configuración específica para tu número
const TARGET_PHONE = '5521989050540';
const AUTH_FOLDER = './MojiSession';
const MAX_RECONNECT_ATTEMPTS = 5;

// Variables de estado
let globalSocket = null;
let reconnectCount = 0;
let isConnecting = false;
let connectionEstablished = false;

/**
 * FUNCIÓN PRINCIPAL: Inicializar sistema de pairing code
 */
export async function initializePairingSystem() {
  if (isConnecting) {
    logger.info('🔄 Sistema de pairing ya iniciado...');
    return globalSocket;
  }

  try {
    isConnecting = true;
    connectionEstablished = false;
    
    console.clear();
    console.log('\n🚀 MOJITO ULTRA - SISTEMA DE PAIRING CODE');
    console.log('═'.repeat(50));
    console.log(`📱 Número objetivo: +${TARGET_PHONE}`);
    console.log('═'.repeat(50));

    // Crear carpeta de sesión
    await ensureAuthFolder();
    
    // Obtener estado de autenticación
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
    logger.info('🔐 Estado de autenticación cargado');

    // Obtener versión de Baileys
    let version;
    try {
      const versionInfo = await fetchLatestBaileysVersion();
      version = versionInfo.version;
      logger.info(`📦 Baileys versión: ${version.join('.')}`);
    } catch {
      version = [2, 3000, 1015901307]; // Versión estable
      logger.info('📦 Usando versión estable');
    }

    // Crear socket ultra optimizado sin logs excesivos
    const socket = makeWASocket({
      version,
      logger: createSilentLogger(),
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, createSilentLogger())
      },
      printQRInTerminal: false, // NUNCA mostrar QR
      browser: Browsers.ubuntu('Chrome'), // Browser específico para pairing
      connectTimeoutMs: 90000, // Más tiempo para generar código
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 15000,
      emitOwnEvents: true,
      generateHighQualityLinkPreview: false,
      syncFullHistory: false,
      markOnlineOnConnect: true,
      shouldSyncHistoryMessage: () => false,
      shouldIgnoreJid: jid => jid === 'status@broadcast',
      getMessage: async () => undefined,
      retryRequestDelayMs: 300,
      maxMsgRetryCount: 3
    });

    globalSocket = socket;
    
    // Configurar manejadores de eventos especializados
    setupPairingEventHandlers(socket, saveCreds);
    
    isConnecting = false;
    logger.success('✅ Sistema de pairing inicializado correctamente');
    
    return socket;

  } catch (error) {
    isConnecting = false;
    logger.error('❌ Error inicializando sistema de pairing:', error.message);
    throw error;
  }
}

/**
 * Configurar manejadores de eventos especializados para pairing
 */
function setupPairingEventHandlers(socket, saveCreds) {
  // Guardar credenciales automáticamente
  socket.ev.on('creds.update', saveCreds);

  // Manejar actualizaciones de conexión con lógica especializada
  socket.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr, isOnline, isNewLogin } = update;

    // EVENTO PRINCIPAL: Generar pairing code cuando se recibe QR
    if (qr && !socket.authState?.creds?.registered) {
      await generatePairingCode(socket, qr);
    }

    // Conexión exitosa establecida
    if (connection === 'open') {
      reconnectCount = 0;
      connectionEstablished = true;
      
      console.clear();
      console.log('\n🎉 ¡CONEXIÓN ESTABLECIDA EXITOSAMENTE! 🎉');
      console.log('═'.repeat(60));
      console.log(`👤 Usuario conectado: ${socket.user?.name || 'Usuario'}`);
      console.log(`📞 ID: ${socket.user?.id || 'N/A'}`);
      console.log(`🇧🇷 Número: +${TARGET_PHONE}`);
      console.log('═'.repeat(60));
      console.log('🚀 Bot listo para recibir comandos simultáneos');
      console.log('⚡ Sistema ultra rápido ACTIVADO');
      console.log('═'.repeat(60));
      
      // Configurar bot para comandos simultáneos
      socket.isConnected = true;
      socket.shouldProcessMessages = true;
      global.conn = socket;

      // Configurar sistema de mensajes ultra rápido
      setupUltraFastMessaging(socket);

      // Notificar conexión exitosa
      await notifyConnectionSuccess(socket);

      logger.success('🎉 ¡PAIRING CODE EXITOSO! Bot funcionando al 100%');
    }

    // Manejar desconexión con lógica inteligente
    if (connection === 'close') {
      connectionEstablished = false;
      socket.isConnected = false;
      socket.shouldProcessMessages = false;
      
      await handleIntelligentReconnection(lastDisconnect);
    }

    // Log solo para cambios importantes
    if (['connecting', 'open', 'close'].includes(connection)) {
      logger.info(`🔄 Estado: ${connection}`);
    }
  });

  // Sistema ultra optimizado para mensajes
  socket.ev.on('messages.upsert', (messageUpdate) => {
    if (!socket.shouldProcessMessages || !connectionEstablished) return;
    
    // Procesar solo mensajes válidos
    const validMessages = messageUpdate.messages.filter(msg => 
      msg.key && 
      msg.key.remoteJid && 
      !msg.key.fromMe && 
      msg.message &&
      msg.key.remoteJid !== 'status@broadcast'
    );

    // Procesamiento paralelo ultra rápido
    if (validMessages.length > 0) {
      validMessages.forEach(msg => {
        setImmediate(() => processUltraFastCommand(socket, msg));
      });
    }
  });
}

/**
 * FUNCIÓN CLAVE: Generar código de emparejamiento
 */
async function generatePairingCode(socket, qr) {
  try {
    console.log('\n🔐 GENERANDO CÓDIGO DE EMPAREJAMIENTO...');
    console.log('⏳ Por favor espera...');

    // Esperar estabilización de la conexión
    await delay(5000);

    // Intentar generar código con el número objetivo
    const pairingCode = await socket.requestPairingCode(TARGET_PHONE);

    if (pairingCode && pairingCode.length >= 6) {
      displayPairingCodeInterface(pairingCode);
      logger.success(`✅ Código generado exitosamente: ${pairingCode}`);
      return true;
    } else {
      throw new Error('Código inválido recibido');
    }

  } catch (error) {
    logger.error('❌ Error generando código inicial:', error.message);
    
    // Intentar formatos alternativos del número
    const phoneVariants = [
      TARGET_PHONE, // Número completo
      TARGET_PHONE.substring(2), // Sin código país
      '55' + TARGET_PHONE.substring(2) // Con código Brasil
    ];

    for (const phoneVariant of phoneVariants) {
      try {
        console.log(`🔄 Intentando formato: +${phoneVariant}`);
        await delay(4000);
        
        const code = await socket.requestPairingCode(phoneVariant);
        
        if (code && code.length >= 6) {
          displayPairingCodeInterface(code, phoneVariant);
          logger.success(`✅ Código generado con formato ${phoneVariant}: ${code}`);
          return true;
        }
      } catch (variantError) {
        logger.debug(`Formato ${phoneVariant} falló: ${variantError.message}`);
        continue;
      }
    }

    logger.error('❌ Todos los intentos de generar código fallaron');
    return false;
  }
}

/**
 * Mostrar interfaz del código de emparejamiento
 */
function displayPairingCodeInterface(code, phoneUsed = TARGET_PHONE) {
  console.clear();
  console.log('\n' + '🔥'.repeat(60));
  console.log('🚀 MOJITO ULTRA BOT - CÓDIGO DE EMPAREJAMIENTO');
  console.log('🔥'.repeat(60));
  console.log(`📱 TELÉFONO: +${phoneUsed}`);
  console.log(`🔑 CÓDIGO: ${code.toUpperCase()}`);
  console.log('🔥'.repeat(60));
  console.log('📋 INSTRUCCIONES PASO A PASO:');
  console.log('');
  console.log('1. 📱 Abre WhatsApp en tu teléfono móvil');
  console.log('2. ⚙️  Ve a "Configuración" (Settings)');
  console.log('3. 🔗 Toca "Dispositivos vinculados"');
  console.log('4. ➕ Toca "Vincular un dispositivo"');
  console.log('5. 📞 Selecciona "Vincular con número de teléfono"');
  console.log(`6. 🔢 Ingresa exactamente: ${code.toUpperCase()}`);
  console.log('');
  console.log('🔥'.repeat(60));
  console.log('⏳ ESPERANDO QUE INGRESES EL CÓDIGO...');
  console.log('🚀 Una vez ingresado, la conexión será INSTANTÁNEA');
  console.log('🔥'.repeat(60) + '\n');
}

/**
 * Configurar carpeta de autenticación
 */
async function ensureAuthFolder() {
  if (!fs.existsSync(AUTH_FOLDER)) {
    fs.mkdirSync(AUTH_FOLDER, { recursive: true });
    logger.info('📁 Carpeta de sesión creada');
  }
}

/**
 * Configurar sistema de mensajería integrado nativamente
 */
function setupUltraFastMessaging(socket) {
  // La integración con el sistema de plugins se hace en core/app.js
  logger.info('⚡ Sistema de mensajería ultra rápido configurado');
}

// Función eliminada - integración nativa con handlers

/**
 * Manejar reconexión inteligente
 */
async function handleIntelligentReconnection(lastDisconnect) {
  const reason = lastDisconnect?.error?.output?.statusCode;
  
  logger.warn(`📱 Desconectado: ${getDisconnectReason(reason)}`);

  switch (reason) {
    case DisconnectReason.connectionClosed:
    case DisconnectReason.connectionLost:
      if (reconnectCount < MAX_RECONNECT_ATTEMPTS) {
        reconnectCount++;
        logger.info(`🔄 Reconectando... (${reconnectCount}/${MAX_RECONNECT_ATTEMPTS})`);
        await delay(5000);
        await initializePairingSystem();
      }
      break;
      
    case DisconnectReason.loggedOut:
    case DisconnectReason.badSession:
      logger.warn('🧹 Limpiando sesión para reconexión fresca...');
      await cleanAuthSession();
      await delay(3000);
      await initializePairingSystem();
      break;
      
    default:
      logger.info('🔄 Reconectando con pairing code...');
      await delay(3000);
      await initializePairingSystem();
  }
}

/**
 * Limpiar sesión de autenticación
 */
async function cleanAuthSession() {
  try {
    if (fs.existsSync(AUTH_FOLDER)) {
      const files = fs.readdirSync(AUTH_FOLDER);
      for (const file of files) {
        fs.unlinkSync(path.join(AUTH_FOLDER, file));
      }
      logger.info('🧹 Sesión limpiada exitosamente');
    }
  } catch (error) {
    logger.warn('No se pudo limpiar sesión:', error.message);
  }
}

/**
 * Notificar conexión exitosa
 */
async function notifyConnectionSuccess(socket) {
  try {
    const ownerJid = TARGET_PHONE + '@s.whatsapp.net';
    await socket.sendMessage(ownerJid, {
      text: `🚀 *MOJITO ULTRA BOT CONECTADO EXITOSAMENTE* 🚀\n\n✅ Conexión establecida vía Pairing Code\n⚡ Sistema ultra rápido ACTIVADO\n🔥 Comandos simultáneos soportados\n💎 Respuestas en milisegundos\n🎯 Bot funcionando al 100%\n\n*¡Listo para recibir todos tus comandos!*`
    });
    logger.success('📧 Notificación de conexión enviada al propietario');
  } catch (error) {
    logger.debug('No se pudo enviar notificación:', error.message);
  }
}

/**
 * Obtener descripción de razón de desconexión
 */
function getDisconnectReason(reason) {
  const reasons = {
    [DisconnectReason.badSession]: 'Sesión corrupta',
    [DisconnectReason.connectionClosed]: 'Conexión cerrada',
    [DisconnectReason.connectionLost]: 'Conexión perdida',
    [DisconnectReason.connectionReplaced]: 'Conexión reemplazada',
    [DisconnectReason.loggedOut]: 'Desconectado',
    [DisconnectReason.restartRequired]: 'Reinicio requerido',
    [DisconnectReason.timedOut]: 'Tiempo agotado'
  };
  
  return reasons[reason] || `Código ${reason || 'desconocido'}`;
}

/**
 * Crear logger silencioso para reducir spam de logs
 */
function createSilentLogger() {
  return {
    trace: () => {},
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
    fatal: () => {},
    child: () => createSilentLogger(),
    level: 'silent'
  };
}

export { globalSocket };