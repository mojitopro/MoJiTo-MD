#!/usr/bin/env node

// MoJiTo-MD Bot - Versión JavaScript compilada para Termux
// Soluciona todos los problemas de logger y compatibilidad

const express = require('express');
const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const path = require('path');
const fs = require('fs');
const { 
  makeWASocket,
  DisconnectReason, 
  useMultiFileAuthState, 
  getContentType
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const chalk = require('chalk');
const QRCode = require('qrcode');
const CommandHandler = require('./utils/command-handler.js');
const StickerHandler = require('./utils/sticker-handler.js');

// Configuración específica para Termux
if (process.env.TERMUX || process.env.PREFIX?.includes('/com.termux/')) {
  process.env.NODE_OPTIONS = '--max-old-space-size=512';
  process.env.TERMUX_DETECTED = '1';
  console.log('📱 Termux detectado - Aplicando optimizaciones móviles');
}

// Logger compatible con Baileys para Termux
const logger = {
  level: 'info',
  info: (msg, ...args) => {
    try {
      console.log(`[INFO] ${String(msg)}`, ...args.map(a => String(a)));
    } catch (e) {
      console.log('[INFO]', String(msg));
    }
  },
  warn: (msg, ...args) => {
    try {
      console.warn(`[WARN] ${String(msg)}`, ...args.map(a => String(a)));
    } catch (e) {
      console.warn('[WARN]', String(msg));
    }
  },
  error: (msg, ...args) => {
    try {
      console.error(`[ERROR] ${String(msg)}`, ...args.map(a => String(a)));
    } catch (e) {
      console.error('[ERROR]', String(msg));
    }
  },
  debug: (msg, ...args) => {
    // Silenciar en Termux para ahorrar memoria
    if (process.env.DEBUG) {
      try {
        console.log(`[DEBUG] ${String(msg)}`, ...args.map(a => String(a)));
      } catch (e) {
        console.log('[DEBUG]', String(msg));
      }
    }
  },
  trace: (msg, ...args) => {
    // Silenciar en Termux para ahorrar memoria
    if (process.env.DEBUG) {
      try {
        console.log(`[TRACE] ${String(msg)}`, ...args.map(a => String(a)));
      } catch (e) {
        console.log('[TRACE]', String(msg));
      }
    }
  },
  child: (options) => logger,
  fatal: (msg, ...args) => {
    try {
      console.error(`[FATAL] ${String(msg)}`, ...args.map(a => String(a)));
    } catch (e) {
      console.error('[FATAL]', String(msg));
    }
  }
};

// Banner de inicio
function showBanner() {
  console.log('\n🚀 Iniciando MoJiTo-MD Bot en Termux...\n');
  
  console.log(chalk.cyan('━'.repeat(50)));
  console.log(`        ███╗   ███╗  ██████╗       ██╗ ██╗ ████████╗  ██████╗ 
        ████╗ ████║ ██╔═══██╗      ██║ ██║ ╚══██╔══╝ ██╔═══██╗
        ██╔████╔██║ ██║   ██║      ██║ ██║    ██║    ██║   ██║
        ██║╚██╔╝██║ ██║   ██║ ██   ██║ ██║    ██║    ██║   ██║
        ██║ ╚═╝ ██║ ╚██████╔╝ ╚█████╔╝ ██║    ██║    ╚██████╔╝
        ╚═╝     ╚═╝  ╚═════╝   ╚════╝  ╚═╝    ╚═╝     ╚═════╝`);
  console.log(chalk.magenta.bold('                         whatsapp bot md'));
  console.log(chalk.cyan('🔮 Bot creado por Brian Martins'));
  console.log(chalk.cyan('💻 Terminal operativa - Bot ejecutándose...'));
  console.log(chalk.cyan('━'.repeat(50)));
}

// Clase Bot Principal
class WhatsAppBot {
  constructor() {
    this.sock = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.commandHandler = new CommandHandler();
    this.stickerHandler = new StickerHandler();
    this.messageCount = 0;
    this.commandCount = 0;
  }

  async initialize() {
    try {
      const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
      
      this.sock = makeWASocket({
        auth: state,
        logger: logger, // Usar nuestro logger compatible
        generateHighQualityLinkPreview: true,
        browser: ['MoJiTo-MD', 'Chrome', '1.0.0'],
        defaultQueryTimeoutMs: 60000,
        // printQRInTerminal: false, // Eliminar opción deprecada
        syncFullHistory: false,
        markOnlineOnConnect: true,
      });

      this.sock.ev.on('connection.update', this.handleConnectionUpdate.bind(this));
      this.sock.ev.on('creds.update', saveCreds);
      this.sock.ev.on('messages.upsert', this.handleMessages.bind(this));
      
    } catch (error) {
      console.error('❌ Error inicializando bot:', error.message);
      throw error;
    }
  }

  async handleConnectionUpdate(update) {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      console.log('\n🔄 Conectando a WhatsApp...\n');
      console.log('📱 Escanea este código QR REAL con tu WhatsApp:\n');
      
      try {
        // Generar QR en terminal
        const qrTerminal = await QRCode.toString(qr, { 
          type: 'terminal',
          small: true,
          margin: 1
        });
        console.log(qrTerminal);
        
        // Guardar QR como imagen
        if (!fs.existsSync('downloads')) {
          fs.mkdirSync('downloads', { recursive: true });
        }
        
        const qrPath = path.join(process.cwd(), 'downloads', 'qr-whatsapp-real.png');
        await QRCode.toFile(qrPath, qr, {
          width: 300,
          margin: 2
        });
        
        console.log(`\n✅ QR real guardado en: ${qrPath}`);
        console.log('\n📋 Pasos para conectar:');
        console.log('1. Abre WhatsApp en tu teléfono');
        console.log('2. Ve a Configuración → Dispositivos vinculados'); 
        console.log('3. Toca "Vincular un dispositivo"');
        console.log('4. Escanea el código QR de arriba');
        console.log('\n⚠️  El QR expira en ~20 segundos, escanea rápidamente!\n');
        
      } catch (error) {
        console.log('❌ Error generando QR:', error.message);
        console.log('📱 Ve a web.whatsapp.com para conectar manualmente');
      }
    }
    
    if (connection === 'close') {
      this.isConnected = false;
      const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      
      console.log(`❌ Conexión cerrada: ${lastDisconnect?.error?.message || 'error desconocido'}, reconectando: ${shouldReconnect}`);
      
      if (shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`🔄 Intento de reconexión ${this.reconnectAttempts}/${this.maxReconnectAttempts} en 3 segundos...`);
        setTimeout(() => this.initialize(), 3000);
      } else {
        console.log('❌ Máximo de intentos alcanzado o sesión cerrada');
      }
    } else if (connection === 'connecting') {
      if (this.reconnectAttempts > 0) {
        console.log(chalk.blue('🔄 Reconectando a WhatsApp...'));
      }
    } else if (connection === 'open') {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      console.log(chalk.green('▣─────────────────────────────···'));
      console.log(chalk.green('│'));
      console.log(chalk.green('│❧ ✅ CONECTADO CORRECTAMENTE AL WHATSAPP ✅'));
      console.log(chalk.green('│'));
      console.log(chalk.green('▣─────────────────────────────···'));
      
      console.log(chalk.cyan('📊 Estadísticas del Bot:'));
      console.log(chalk.white('   📱 Grupos activos: 0'));
      console.log(chalk.white(`   💬 Mensajes procesados: ${this.messageCount}`));
      console.log(chalk.white(`   ⚡ Comandos ejecutados: ${this.commandCount}`));
      
      // Mostrar comandos disponibles
      this.commandHandler.listCommands();
    }
  }

  async handleMessages(messageUpdate) {
    const { messages, type } = messageUpdate;
    
    // Procesar TODOS los tipos, no solo 'notify'
    for (const message of messages) {
      try {
        // Incluir mensajes propios para comandos
        await this.processMessage(message);
      } catch (error) {
        logger.error('Error procesando mensaje:', error);
      }
    }
  }

  async processMessage(message) {
    if (!message.message) return;
    
    this.messageCount++;
    const messageType = getContentType(message.message);
    const fromNumber = message.key.remoteJid?.replace('@s.whatsapp.net', '') || '';
    const groupId = message.key.remoteJid?.includes('@g.us') ? message.key.remoteJid : undefined;
    const isGroup = !!groupId;
    const isFromMe = message.key.fromMe || false;
    
    // Obtener información del remitente
    const senderName = isFromMe ? 'YO (Bot)' : fromNumber || 'Desconocido';
    const chatName = isGroup ? 'Grupo' : 'Privado';
    const timeStr = new Date().toLocaleTimeString('es-ES');
    
    // Estado del mensaje
    const messageStatus = this.getMessageStatus(message);
    
    // Extraer texto del mensaje
    const messageText = this.extractMessageText(message);
    
    // Log con formato específico requerido con información extendida
    console.log(chalk.cyanBright('┌─────────────────────────────'));
    console.log(chalk.cyanBright(`│ 📤 De: `) + chalk.green(senderName));
    console.log(chalk.cyanBright(`│ 🧭 Chat: `) + chalk.yellow(chatName));
    console.log(chalk.cyanBright(`│ 🕒 Hora: `) + chalk.magenta(timeStr));
    console.log(chalk.cyanBright(`│ 🗂️ Tipo: `) + chalk.blueBright((messageType || '').toUpperCase()));
    console.log(chalk.cyanBright(`│ 📋 Estado: `) + chalk.whiteBright(messageStatus));
    if (messageText) console.log(chalk.cyanBright(`│ 💬 Texto: `) + chalk.whiteBright(messageText.slice(0, 200)));
    console.log(chalk.cyanBright('└─────────────────────────────'));
    
    // Procesar stickers
    if (messageType === 'stickerMessage') {
      await this.stickerHandler.processSticker(message, this.sock);
    }
    
    // Procesar comandos (incluir mensajes propios)
    const isCommand = await this.commandHandler.processMessage(this.sock, message);
    if (isCommand) {
      this.commandCount++;
      console.log(`✅ Comando ejecutado (Total: ${this.commandCount})`);
    }
  }

  getMessageStatus(message) {
    // Determinar estado del mensaje
    let status = [];
    
    if (message.key.fromMe) {
      status.push('📤 Enviado');
      
      // Estados de entrega
      if (message.status === 3) status.push('✓✓ Entregado');
      else if (message.status === 4) status.push('💙 Leído');
      else if (message.status === 2) status.push('✓ Enviado');
      else if (message.status === 1) status.push('⏳ Pendiente');
    } else {
      status.push('📥 Recibido');
    }

    // Información adicional
    if (message.messageTimestamp) {
      const msgDate = new Date(message.messageTimestamp * 1000);
      const now = new Date();
      const diffMinutes = Math.floor((now - msgDate) / 60000);
      
      if (diffMinutes < 1) status.push('🟢 Reciente');
      else if (diffMinutes < 60) status.push(`🟡 ${diffMinutes}m`);
      else status.push('🔴 Antiguo');
    }

    return status.join(' | ');
  }

  extractMessageText(message) {
    // Extraer texto del mensaje
    if (message.message.conversation) {
      return message.message.conversation;
    }
    
    if (message.message.extendedTextMessage?.text) {
      return message.message.extendedTextMessage.text;
    }

    if (message.message.imageMessage?.caption) {
      return message.message.imageMessage.caption;
    }

    if (message.message.videoMessage?.caption) {
      return message.message.videoMessage.caption;
    }

    return null;
  }

  getStatus() {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// Servidor Express
function createExpressServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json());
  app.use(express.static(path.join(__dirname, '../client/dist')));

  // API status
  app.get('/api/status', (req, res) => {
    res.json({
      status: 'running',
      bot: bot.getStatus(),
      timestamp: new Date().toISOString()
    });
  });

  // Servir frontend
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });

  return server;
}

// Inicialización principal
async function main() {
  try {
    showBanner();
    
    console.log(chalk.magenta('🔧 Plugins cargados correctamente'));
    console.log(chalk.cyan('📋 Sistema de comandos inicializado'));
    console.log(chalk.cyan('🎭 Handler de stickers activado para Termux'));
    console.log();
    
    // Crear bot
    global.bot = new WhatsAppBot();
    
    // Crear servidor Express
    const server = createExpressServer();
    const PORT = process.env.PORT || 5000;
    
    server.listen(PORT, '0.0.0.0', () => {
      console.log(chalk.cyan(`💻 Servidor Express ejecutándose en puerto ${PORT}`));
      console.log(chalk.cyan(`🌐 Dashboard: http://localhost:${PORT}`));
    });

    // Inicializar bot WhatsApp
    await bot.initialize();
    
  } catch (error) {
    console.error('❌ Error fatal:', error.message);
    process.exit(1);
  }
}

// Manejo de errores globales
process.on('uncaughtException', (error) => {
  console.error('❌ Excepción no capturada:', error.message);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
});

// Iniciar aplicación
main().catch(console.error);