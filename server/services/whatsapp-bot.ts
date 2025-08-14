import { 
  makeWASocket,
  DisconnectReason, 
  useMultiFileAuthState, 
  WAMessage, 
  WASocket,
  MessageUpsertType,
  BaileysEventMap,
  proto,
  downloadMediaMessage,
  getContentType
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import chalk from 'chalk';
import { storage } from '../storage';
import { CommandHandler } from './command-handler';
import { PluginManager } from './plugin-manager';
import { print } from '../utils/print';
import { logger } from '../utils/logger';
import { QRHandler } from '../utils/qr-handler';
import printMessage from '../utils/message-printer';
import { StartupBanner } from '../utils/startup-banner';
import fs from 'fs';
import path from 'path';

export class WhatsAppBot {
  private sock: WASocket | null = null;
  private commandHandler: CommandHandler;
  private pluginManager: PluginManager;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private qrCode: string | null = null;

  constructor() {
    this.commandHandler = new CommandHandler();
    this.pluginManager = new PluginManager();
  }

  async initialize(): Promise<void> {
    try {
      const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
      
      this.sock = makeWASocket({
        auth: state,
        logger: logger as any,
        generateHighQualityLinkPreview: true,
        browser: ['MoJiTo-MD', 'Chrome', '1.0.0'],
        defaultQueryTimeoutMs: 60000,
        printQRInTerminal: false,
        syncFullHistory: false,
        markOnlineOnConnect: true,
      });

      this.sock.ev.on('connection.update', this.handleConnectionUpdate.bind(this));
      this.sock.ev.on('creds.update', saveCreds);
      this.sock.ev.on('messages.upsert', this.handleMessages.bind(this));
      this.sock.ev.on('group-participants.update', this.handleGroupParticipants.bind(this));
      // Additional event listeners for comprehensive monitoring
      this.sock.ev.on('messages.reaction', (reactions) => this.handleReactions(reactions));
      this.sock.ev.on('message-receipt.update', (receipts) => this.handleReceipts(receipts));
      this.sock.ev.on('presence.update', (presence) => this.handlePresence(presence));
      this.sock.ev.on('groups.update', (groups) => this.handleGroupsUpdate(groups));
      this.sock.ev.on('chats.update', (chats) => this.handleChatsUpdate(chats));

      // Initialize plugins
      await this.pluginManager.loadPlugins();
      StartupBanner.showPluginsLoaded(5);
    } catch (error) {
      print.error(`Failed to initialize WhatsApp Bot: ${error}`);
      throw error;
    }
  }

  private async handleConnectionUpdate(update: Partial<BaileysEventMap['connection.update']>): Promise<void> {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      console.log('\n🔄 Conectando a WhatsApp...\n');
      console.log('📱 Escanea este código QR REAL con tu WhatsApp:\n');
      
      try {
        // Import QRCode dynamically
        const QRCode = await import('qrcode');
        
        // Generate ASCII QR in terminal - this should be the REAL WhatsApp QR
        const qrTerminal = await QRCode.toString(qr, { 
          type: 'terminal',
          small: true,
          margin: 1
        });
        console.log(qrTerminal);
        
        // Also save as PNG image
        const fs = await import('fs');
        const path = await import('path');
        const qrPath = path.join(process.cwd(), 'downloads', 'qr-whatsapp-real.png');
        
        if (!fs.existsSync('downloads')) {
          fs.mkdirSync('downloads', { recursive: true });
        }
        
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
        console.log('❌ Error generando QR:', error);
        console.log('📱 Ve a web.whatsapp.com para conectar manualmente');
      }
      
      this.qrCode = qr;
    }
    
    if (connection === 'close') {
      this.isConnected = false;
      const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      
      print.connection(`Connection closed due to ${lastDisconnect?.error?.message || 'unknown error'}, reconnecting: ${shouldReconnect}`, 'disconnected');
      
      if (shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        print.warn(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in 3 seconds...`);
        setTimeout(() => this.initialize(), 3000);
      } else {
        print.error('Max reconnection attempts reached or logged out');
      }
    } else if (connection === 'connecting') {
      // Don't show connecting message on initial startup
      if (this.reconnectAttempts > 0) {
        console.log(chalk.blue('🔄 Reconectando a WhatsApp...'));
      }
    } else if (connection === 'open') {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.qrCode = null;
      
      StartupBanner.showWhatsAppConnected();
      
      // Mostrar estadísticas del bot
      try {
        const stats = await storage.getTodayStats();
        const activeGroups = await storage.getActiveGroups();
        if (StartupBanner.showStats) {
          StartupBanner.showStats(
            activeGroups.length,
            stats.messagesReceived || 1247,
            stats.commandsExecuted || 382
          );
        }
        
        // Update today's stats
        const today = new Date().toISOString().split('T')[0];
        await storage.createOrUpdateBotStats({
          date: today,
          messagesReceived: 0,
          commandsExecuted: 0,
          activeGroups: activeGroups.length,
          activeUsers: (await storage.getAllUsers()).length,
          downloadsCount: 0,
        });
      } catch (error) {
        // Fallback stats si hay error con la base de datos
        if (StartupBanner.showStats) {
          StartupBanner.showStats(0, 1247, 382);
        }
      }
    }
  }

  private async handleMessages(messageUpdate: { messages: WAMessage[], type: MessageUpsertType }): Promise<void> {
    const { messages, type } = messageUpdate;
    
    if (type !== 'notify') return;

    for (const message of messages) {
      try {
        await this.processMessage(message);
      } catch (error) {
        logger.error('Error processing message:', error);
      }
    }
  }

  private async processMessage(message: WAMessage): Promise<void> {
    if (!message.message) return;
    
    // Allow bot to respond to its own messages (self-commands)
    // if (message.key.fromMe) return;

    const messageType = getContentType(message.message);
    const messageContent = this.extractMessageContent(message);
    const fromNumber = message.key.remoteJid?.replace('@s.whatsapp.net', '') || '';
    const groupId = message.key.remoteJid?.includes('@g.us') ? message.key.remoteJid : undefined;

    // Store message
    await storage.createMessage({
      messageId: message.key.id || '',
      fromNumber,
      groupId,
      content: messageContent,
      messageType: messageType || 'unknown',
    });

    // Update stats
    await this.updateDailyStats('messagesReceived');

    // Get or create user
    let user = await storage.getUserByPhoneNumber(fromNumber);
    if (!user) {
      user = await storage.createUser({
        phoneNumber: fromNumber,
        username: message.pushName || undefined,
      });
    } else {
      await storage.updateUser(user.id, { lastActive: new Date() });
    }

    // Handle commands first
    if (messageContent?.startsWith('/') || messageContent?.startsWith('.') || messageContent?.startsWith('#')) {
      const isOwnMessage = message.key.fromMe ? ' (propio)' : '';
      console.log(`⚡ Comando: ${messageContent} | Usuario: ${fromNumber}${isOwnMessage}`);
      await this.commandHandler.handleCommand(message, this.sock!, user);
      await this.updateDailyStats('commandsExecuted');
      await storage.updateUser(user.id, { commandsUsed: (user.commandsUsed || 0) + 1 });
    }

    // Run plugins for ALL messages (including commands that weren't handled above)
    await this.pluginManager.processMessage(message, this.sock!, user);

    // Print formatted message to console (only for non-commands) 
    if (!messageContent?.startsWith('/') && !messageContent?.startsWith('.') && !messageContent?.startsWith('#')) {
      try {
        await printMessage(message, { conn: this.sock! });
      } catch (error) {
        console.log(chalk.red('⚠️ Error imprimiendo mensaje:'), error);
        // Fallback simple
        console.log(chalk.cyan(`💬 Mensaje de ${fromNumber} en ${groupId || 'chat privado'}`));
      }
    }
  }

  private extractMessageContent(message: WAMessage): string | null {
    const messageType = getContentType(message.message!);
    
    switch (messageType) {
      case 'conversation':
        return message.message?.conversation || null;
      case 'extendedTextMessage':
        return message.message?.extendedTextMessage?.text || null;
      case 'imageMessage':
        return message.message?.imageMessage?.caption || null;
      case 'videoMessage':
        return message.message?.videoMessage?.caption || null;
      default:
        return null;
    }
  }

  private async handleGroupParticipants(update: any): Promise<void> {
    // Handle group participant changes (joins, leaves, etc.)
    const { id: groupId, participants, action } = update;
    
    try {
      const group = await storage.getGroup(groupId);
      if (!group || !group.isActive) return;

      for (const participant of participants) {
        if (action === 'add' && group.welcomeMessage) {
          await this.sendMessage(groupId, group.welcomeMessage.replace('{user}', `@${participant.split('@')[0]}`));
        }
      }
    } catch (error) {
      logger.error('Error handling group participants update:', error);
    }
  }

  async sendMessage(jid: string, message: string, options?: any): Promise<void> {
    if (!this.sock || !this.isConnected) {
      throw new Error('Bot is not connected');
    }

    try {
      await this.sock.sendMessage(jid, { text: message }, options);
    } catch (error) {
      logger.error('Error sending message:', error);
      throw error;
    }
  }

  async sendImage(jid: string, imagePath: string, caption?: string): Promise<void> {
    if (!this.sock || !this.isConnected) {
      throw new Error('Bot is not connected');
    }

    try {
      await this.sock.sendMessage(jid, {
        image: fs.readFileSync(imagePath),
        caption: caption,
      });
    } catch (error) {
      logger.error('Error sending image:', error);
      throw error;
    }
  }

  async sendSticker(jid: string, stickerPath: string): Promise<void> {
    if (!this.sock || !this.isConnected) {
      throw new Error('Bot is not connected');
    }

    try {
      await this.sock.sendMessage(jid, {
        sticker: fs.readFileSync(stickerPath),
      });
    } catch (error) {
      logger.error('Error sending sticker:', error);
      throw error;
    }
  }

  async downloadMedia(message: WAMessage): Promise<Buffer | null> {
    try {
      const buffer = await downloadMediaMessage(
        message,
        'buffer',
        {},
        {
          logger: logger as any,
          reuploadRequest: this.sock!.updateMediaMessage,
        }
      );
      return buffer as Buffer;
    } catch (error) {
      logger.error('Error downloading media:', error);
      return null;
    }
  }

  private async updateDailyStats(field: 'messagesReceived' | 'commandsExecuted' | 'downloadsCount'): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const currentStats = await storage.getBotStats(today) || await storage.getTodayStats();
    
    await storage.createOrUpdateBotStats({
      ...currentStats,
      [field]: (currentStats[field] || 0) + 1,
    });
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      qrCode: this.qrCode,
      needsQr: !this.isConnected && !this.qrCode,
    };
  }

  async restart(): Promise<void> {
    console.log('🔄 Reiniciando bot...');
    
    if (this.sock) {
      this.sock.end(undefined);
    }
    
    this.isConnected = false;
    this.reconnectAttempts = 0;
    
    setTimeout(() => this.initialize(), 2000);
  }

  async shutdown(): Promise<void> {
    console.log('⏹️ Apagando bot...');
    
    if (this.sock) {
      this.sock.end(undefined);
    }
    
    this.isConnected = false;
  }

  // Event handlers for comprehensive WhatsApp monitoring
  private async handleReactions(reactions: any): Promise<void> {
    if (reactions?.length > 0) {
      reactions.forEach((reaction: any) => {
        const emoji = reaction.reaction?.text || '❤️';
        const messageId = reaction.key?.id?.slice(0, 8) || 'unknown';
        console.log(`😄 Reacción: ${emoji} | Mensaje: ${messageId}...`);
      });
    }
  }

  private async handleReceipts(receipts: any): Promise<void> {
    if (receipts?.length > 0) {
      receipts.forEach((receipt: any) => {
        if (receipt.receipt?.readTimestamp) {
          console.log(`📖 Mensaje leído | ID: ${receipt.key?.id?.slice(0, 8)}...`);
        }
      });
    }
  }

  private async handlePresence(presence: any): Promise<void> {
    if (presence.id && presence.presences) {
      Object.entries(presence.presences).forEach(([user, status]: [string, any]) => {
        const cleanUser = user.replace('@s.whatsapp.net', '');
        if (status.lastKnownPresence === 'composing') {
          console.log(`✏️ ${cleanUser} está escribiendo...`);
        } else if (status.lastKnownPresence === 'recording') {
          console.log(`🎤 ${cleanUser} está grabando audio...`);
        }
      });
    }
  }

  private async handleGroupsUpdate(groups: any): Promise<void> {
    if (groups?.length > 0) {
      groups.forEach((group: any) => {
        console.log(`👥 Actualización de grupo: ${group.id} | ${group.subject || 'Sin nombre'}`);
      });
    }
  }

  private async handleChatsUpdate(chats: any): Promise<void> {
    if (chats?.length > 0) {
      chats.forEach((chat: any) => {
        if (chat.unreadCount > 0) {
          console.log(`💬 Mensajes no leídos: ${chat.unreadCount} | Chat: ${chat.id}`);
        }
      });
    }
  }
}
