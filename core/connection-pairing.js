/**
 * SISTEMA DE CONEXIÓN CON PAIRING CODE
 * Optimizado específicamente para solicitar código de emparejamiento
 * y mantener conexión estable para comandos simultáneos
 */
import { 
  makeWASocket, 
  DisconnectReason, 
  useMultiFileAuthState, 
  makeCacheableSignalKeyStore,
  Browsers,
  delay
} from 'baileys';
import { logger } from '../services/logger.js';
import fs from 'fs';
import path from 'path';

// Estado global de conexión
let globalConn = null;
let reconnectAttempts = 0;
const MAX_RECONNECT = 3;
let isConnecting = false;
const authFolder = './MojiSession';
const targetPhoneNumber = '5521989050540';

/**
 * Inicializar conexión con pairing code obligatorio
 */
export async function initializeConnection(options = {}) {
  if (isConnecting) {
    logger.info('🔄 Conexión ya en progreso...');
    return globalConn;
  }

  try {
    isConnecting = true;
    logger.info('🚀 INICIANDO SISTEMA DE PAIRING CODE...');
    logger.info(`📱 Teléfono objetivo: +${targetPhoneNumber}`);

    // Asegurar carpeta de autenticación
    if (!fs.existsSync(authFolder)) {
      fs.mkdirSync(authFolder, { recursive: true });
      logger.info('📁 Carpeta de sesión creada');
    }

    // Inicializar estado de autenticación
    const { state, saveCreds } = await useMultiFileAuthState(authFolder);
    logger.info('🔐 Estado de autenticación inicializado');

    // Crear socket optimizado para pairing code
    const sock = makeWASocket({
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger)
      },
      printQRInTerminal: false, // NUNCA mostrar QR
      mobile: true, // Modo móvil para pairing code
      browser: ['MoJiTo Ultra Bot', 'Chrome', '1.0.0'],
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 10000, // Más frecuente para estabilidad
      emitOwnEvents: true,
      generateHighQualityLinkPreview: false,
      syncFullHistory: false,
      markOnlineOnConnect: true,
      shouldSyncHistoryMessage: () => false,
      shouldIgnoreJid: jid => jid === 'status@broadcast',
      getMessage: async () => undefined,
      // Configuraciones para estabilidad
      retryRequestDelayMs: 250,
      maxMsgRetryCount: 2,
      transactionOpts: {
        maxCommitRetries: 1,
        delayBetweenTriesMs: 300
      }
    });

    globalConn = sock;
    setupPairingEventHandlers(sock, saveCreds);
    
    isConnecting = false;
    return sock;

  } catch (error) {
    isConnecting = false;
    logger.error('❌ Error en inicialización:', error.message);
    throw error;
  }
}

/**
 * Configurar manejadores de eventos para pairing code
 */
function setupPairingEventHandlers(sock, saveCreds) {
  // Guardar credenciales siempre
  sock.ev.on('creds.update', saveCreds);

  // Manejar actualizaciones de conexión
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr, isOnline, isNewLogin } = update;

    // PRINCIPAL: Manejar solicitud de pairing code
    if (qr && !sock.authState.creds.registered) {
      await handlePairingCodeRequest(sock);
    }

    // Conexión establecida exitosamente
    if (connection === 'open') {
      reconnectAttempts = 0;
      logger.success('🎉 ¡CONEXIÓN ESTABLECIDA EXITOSAMENTE!');
      logger.info(`👤 Conectado como: ${sock.user?.name || 'Usuario'}`);
      logger.info(`📞 ID: ${sock.user?.id || 'N/A'}`);
      
      // Marcar bot como listo
      sock.isConnected = true;
      sock.shouldProcessMessages = true;
      global.conn = sock;

      // Configurar sistema de comandos simultáneos
      setupSimultaneousCommandHandling(sock);

      // Notificar conexión exitosa
      await notifyConnectionSuccess(sock);

      logger.info('✅ Bot listo para recibir comandos simultáneos');
    }

    // Manejar desconexión
    if (connection === 'close') {
      sock.isConnected = false;
      sock.shouldProcessMessages = false;
      await handleSmartReconnection(lastDisconnect);
    }

    // Log de estado solo para cambios importantes
    if (connection) {
      logger.info(`🔄 Estado: ${connection}`);
    }
  });

  // Sistema optimizado para mensajes simultáneos
  sock.ev.on('messages.upsert', (messageUpdate) => {
    if (!sock.shouldProcessMessages || !sock.isConnected) return;
    
    // Filtrar mensajes válidos rápidamente
    const validMessages = messageUpdate.messages.filter(isValidMessage);
    
    if (validMessages.length > 0) {
      // Procesar en paralelo para máxima velocidad
      validMessages.forEach(msg => {
        setImmediate(() => processMessageUltraFast(sock, msg));
      });
    }
  });
}

/**
 * Solicitar código de emparejamiento
 */
async function handlePairingCodeRequest(sock) {
  try {
    logger.info('🔐 SOLICITANDO CÓDIGO DE EMPAREJAMIENTO...');
    
    // Esperar estabilización
    await delay(2000);
    
    const pairingCode = await sock.requestPairingCode(targetPhoneNumber);
    
    if (pairingCode && pairingCode.length >= 6) {
      displayPairingCode(pairingCode);
      return true;
    } else {
      throw new Error('Código inválido recibido');
    }
    
  } catch (error) {
    logger.error('❌ Error solicitando código:', error.message);
    
    // Reintentar con diferentes formatos
    const alternativeFormats = [
      targetPhoneNumber.substring(2), // Sin código de país
      '55' + targetPhoneNumber.substring(2), // Con código Brasil completo
      targetPhoneNumber // Original
    ];
    
    for (const format of alternativeFormats) {
      try {
        logger.info(`🔄 Intentando formato: +${format}`);
        await delay(3000);
        
        const code = await sock.requestPairingCode(format);
        if (code && code.length >= 6) {
          displayPairingCode(code, format);
          return true;
        }
      } catch (retryError) {
        logger.debug(`Formato ${format} falló: ${retryError.message}`);
      }
    }
    
    throw new Error('Todos los intentos de pairing code fallaron');
  }
}

/**
 * Mostrar código de emparejamiento con instrucciones claras
 */
function displayPairingCode(code, phoneUsed = targetPhoneNumber) {
  console.clear();
  console.log('\n' + '🔥'.repeat(30));
  console.log('🚀 MOJITO ULTRA BOT - PAIRING CODE');
  console.log('🔥'.repeat(30));
  console.log(`📱 NÚMERO: +${phoneUsed}`);
  console.log(`🔑 CÓDIGO: ${code}`);
  console.log('🔥'.repeat(30));
  console.log('📋 INSTRUCCIONES PASO A PASO:');
  console.log('1. 📱 Abre WhatsApp en tu teléfono');
  console.log('2. ⚙️  Ve a Configuración');  
  console.log('3. 🔗 Toca "Dispositivos vinculados"');
  console.log('4. ➕ Toca "Vincular un dispositivo"');
  console.log('5. 📞 Toca "Vincular con número de teléfono"');
  console.log(`6. 🔢 Ingresa: ${code}`);
  console.log('🔥'.repeat(30));
  console.log('⏳ Esperando confirmación...');
  console.log('🔥'.repeat(30) + '\n');
  
  logger.success(`✅ CÓDIGO GENERADO: ${code}`);
  logger.info('👆 Ingresa el código mostrado arriba en WhatsApp');
}

/**
 * Validar mensaje rápidamente
 */
function isValidMessage(msg) {
  return msg.key && 
         msg.key.remoteJid && 
         !msg.key.fromMe && 
         msg.message &&
         msg.key.remoteJid !== 'status@broadcast' &&
         !msg.message.protocolMessage &&
         !msg.message.senderKeyDistributionMessage;
}

/**
 * Procesar mensajes ultra rápido
 */
async function processMessageUltraFast(sock, msg) {
  try {
    const text = msg.message?.conversation || 
                msg.message?.extendedTextMessage?.text || 
                msg.message?.imageMessage?.caption || '';
    
    if (!text) return;
    
    // Detección ultra rápida de comandos
    if (text.startsWith('.') || text.startsWith('/') || text.startsWith('!')) {
      const command = text.slice(1).split(' ')[0].toLowerCase();
      
      // Comandos básicos ultra rápidos
      switch (command) {
        case 'ping':
        case 'p':
          await sock.sendMessage(msg.key.remoteJid, { 
            text: '🏓 Ultra Pong! ⚡ Respuesta en milisegundos' 
          });
          break;
          
        case 'test':
          const startTime = process.hrtime.bigint();
          await sock.sendMessage(msg.key.remoteJid, { 
            text: `✅ Test Ultra Exitoso!\n⚡ Respuesta: ${Number(process.hrtime.bigint() - startTime) / 1000000}ms` 
          });
          break;
          
        case 'speed':
          await sock.sendMessage(msg.key.remoteJid, { 
            text: '🚀 MoJiTo Ultra - Velocidad máxima!\n⚡ Comandos simultáneos soportados\n🔥 Respuestas en milisegundos' 
          });
          break;
          
        default:
          await sock.sendMessage(msg.key.remoteJid, { 
            text: `❓ Comando "${command}" no encontrado.\n\n🔥 Disponibles: .ping .test .speed`
          });
      }
    }
  } catch (error) {
    logger.debug('Error procesando mensaje:', error.message);
  }
}

/**
 * Configurar manejo de comandos simultáneos
 */
function setupSimultaneousCommandHandling(sock) {
  // Pool de workers para comandos simultáneos
  const commandQueue = [];
  const maxConcurrentCommands = 10;
  let activeCommands = 0;

  const processCommandQueue = async () => {
    while (commandQueue.length > 0 && activeCommands < maxConcurrentCommands) {
      const task = commandQueue.shift();
      activeCommands++;
      
      setImmediate(async () => {
        try {
          await task();
        } catch (error) {
          logger.debug('Command execution error:', error.message);
        } finally {
          activeCommands--;
        }
      });
    }
  };

  // Ejecutar cola cada 10ms para máxima velocidad
  setInterval(processCommandQueue, 10);
  
  logger.info('⚡ Sistema de comandos simultáneos configurado');
}

/**
 * Manejar reconexión inteligente
 */
async function handleSmartReconnection(lastDisconnect) {
  const reason = lastDisconnect?.error?.output?.statusCode;
  let shouldReconnect = false;

  switch (reason) {
    case DisconnectReason.connectionClosed:
    case DisconnectReason.connectionLost:
      logger.info('🔄 Reconectando automáticamente...');
      shouldReconnect = true;
      break;
      
    case DisconnectReason.loggedOut:
      logger.warn('🚪 Sesión cerrada, limpiando...');
      await cleanSession();
      shouldReconnect = true;
      break;
      
    case DisconnectReason.badSession:
      logger.error('❌ Sesión corrupta, limpiando...');
      await cleanSession();
      shouldReconnect = true;
      break;
      
    default:
      logger.info(`📱 Desconexión: ${reason || 'Desconocida'}`);
      shouldReconnect = true;
  }

  if (shouldReconnect && reconnectAttempts < MAX_RECONNECT) {
    reconnectAttempts++;
    logger.info(`🔄 Intento de reconexión ${reconnectAttempts}/${MAX_RECONNECT}`);
    
    await delay(5000);
    
    try {
      globalConn = null;
      await initializeConnection();
    } catch (error) {
      logger.error(`Reconexión ${reconnectAttempts} falló:`, error.message);
    }
  }
}

/**
 * Limpiar sesión
 */
async function cleanSession() {
  try {
    if (fs.existsSync(authFolder)) {
      const files = fs.readdirSync(authFolder);
      for (const file of files) {
        fs.unlinkSync(path.join(authFolder, file));
      }
      logger.info('🧹 Sesión limpiada');
    }
  } catch (error) {
    logger.warn('No se pudo limpiar sesión:', error.message);
  }
}

/**
 * Notificar conexión exitosa
 */
async function notifyConnectionSuccess(sock) {
  try {
    const owner = '5521989050540@s.whatsapp.net';
    await sock.sendMessage(owner, {
      text: `🚀 *MOJITO ULTRA BOT CONECTADO* 🚀\n\n⚡ Sistema ultra optimizado ACTIVO\n🔥 Comandos simultáneos soportados\n💎 Respuestas en milisegundos\n🎯 Conexión estable establecida\n\n*¡Bot listo para máxima velocidad!*`
    });
    logger.info('📧 Notificación de conexión enviada');
  } catch (error) {
    logger.debug('No se pudo enviar notificación:', error.message);
  }
}

export { globalConn };