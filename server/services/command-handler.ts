import { WAMessage, WASocket } from '@whiskeysockets/baileys';
import { User } from '@shared/schema';
import { storage } from '../storage';
import { MediaDownloader } from './media-downloader';
import { AIService } from './ai-service';
import { logger } from '../utils/logger';
import axios from 'axios';

export class CommandHandler {
  private mediaDownloader: MediaDownloader;
  private aiService: AIService;
  private prefix = ['.', '/', '#'];

  constructor() {
    this.mediaDownloader = new MediaDownloader();
    this.aiService = new AIService();
  }

  async handleCommand(message: WAMessage, sock: WASocket, user: User): Promise<void> {
    const messageContent = this.extractMessageContent(message);
    if (!messageContent) return;

    const jid = message.key.remoteJid!;
    const args = messageContent.trim().split(/\s+/);
    const commandName = args[0].slice(1).toLowerCase(); // Remove prefix
    const commandArgs = args.slice(1);

    // Check if command exists
    const command = await storage.getCommand(commandName);
    if (!command || !command.isEnabled) {
      // Send a helpful message for unknown commands
      if (commandName === 'start') {
        await sock.sendMessage(jid, { text: '🤖 ¡Hola! Soy MoJiTo-MD Bot.\nUsa /menu para ver los comandos disponibles.' });
        return;
      }
      return; // Silently ignore other unknown commands
    }

    // Increment command usage
    await storage.incrementCommandUsage(commandName);

    try {
      switch (commandName) {
        case 'ytmp3':
          await this.handleYouTubeAudio(jid, commandArgs, sock);
          break;
        case 'ytmp4':
          await this.handleYouTubeVideo(jid, commandArgs, sock);
          break;
        case 'sticker':
          await this.handleSticker(message, jid, sock);
          break;
        case 'ia':
        case 'ai':
        case 'chatgpt':
          await this.handleAI(jid, commandArgs, sock, user);
          break;
        case 'translate':
          await this.handleTranslate(jid, commandArgs, sock);
          break;
        case 'weather':
          await this.handleWeather(jid, commandArgs, sock);
          break;
        case 'meme':
          await this.handleMeme(jid, sock);
          break;
        case 'trivia':
          await this.handleTrivia(jid, sock);
          break;
        case 'menu':
        case 'help':
          await this.handleMenu(jid, sock);
          break;
        case 'ping':
          await this.handlePing(jid, sock);
          break;
        case 'info':
          await this.handleInfo(jid, sock, user);
          break;
        case 'play':
          await this.handlePlay(jid, commandArgs, sock);
          break;
        default:
          // Check if it's a plugin command that should be handled by plugin manager
          logger.warn(`Unknown command: ${commandName}`);
      }
    } catch (error) {
      logger.error(`Error executing command ${commandName}:`, error);
      await sock.sendMessage(jid, { text: '❌ Error al ejecutar el comando. Intenta de nuevo más tarde.' });
    }
  }

  private extractMessageContent(message: WAMessage): string | null {
    if (message.message?.conversation) {
      return message.message.conversation;
    }
    if (message.message?.extendedTextMessage?.text) {
      return message.message.extendedTextMessage.text;
    }
    return null;
  }

  private async handleYouTubeAudio(jid: string, args: string[], sock: WASocket): Promise<void> {
    if (args.length === 0) {
      await sock.sendMessage(jid, { text: '❌ Proporciona una URL de YouTube.\n\n*Uso:* /ytmp3 <url>' });
      return;
    }

    const url = args[0];
    if (!this.isValidYouTubeUrl(url)) {
      await sock.sendMessage(jid, { text: '❌ URL de YouTube inválida.' });
      return;
    }

    await sock.sendMessage(jid, { text: '⏳ Descargando audio de YouTube...' });

    try {
      const audioPath = await this.mediaDownloader.downloadYouTubeAudio(url);
      if (audioPath) {
        await sock.sendMessage(jid, {
          audio: { url: audioPath },
          mimetype: 'audio/mp4',
        });
        await this.updateDownloadStats();
      } else {
        await sock.sendMessage(jid, { text: '❌ Error al descargar el audio.' });
      }
    } catch (error) {
      await sock.sendMessage(jid, { text: '❌ Error al procesar la descarga.' });
    }
  }

  private async handleYouTubeVideo(jid: string, args: string[], sock: WASocket): Promise<void> {
    if (args.length === 0) {
      await sock.sendMessage(jid, { text: '❌ Proporciona una URL de YouTube.\n\n*Uso:* /ytmp4 <url>' });
      return;
    }

    const url = args[0];
    if (!this.isValidYouTubeUrl(url)) {
      await sock.sendMessage(jid, { text: '❌ URL de YouTube inválida.' });
      return;
    }

    await sock.sendMessage(jid, { text: '⏳ Descargando video de YouTube...' });

    try {
      const videoPath = await this.mediaDownloader.downloadYouTubeVideo(url);
      if (videoPath) {
        await sock.sendMessage(jid, {
          video: { url: videoPath },
          caption: '📹 Video descargado exitosamente',
        });
        await this.updateDownloadStats();
      } else {
        await sock.sendMessage(jid, { text: '❌ Error al descargar el video.' });
      }
    } catch (error) {
      await sock.sendMessage(jid, { text: '❌ Error al procesar la descarga.' });
    }
  }

  private async handleSticker(message: WAMessage, jid: string, sock: WASocket): Promise<void> {
    // Check if message is a reply to an image/video
    const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    
    if (!quotedMessage?.imageMessage && !quotedMessage?.videoMessage) {
      await sock.sendMessage(jid, { text: '❌ Responde a una imagen o video para crear un sticker.\n\n*Uso:* /sticker (responder a imagen)' });
      return;
    }

    await sock.sendMessage(jid, { text: '⏳ Creando sticker...' });

    try {
      // This would require actual media processing
      await sock.sendMessage(jid, { text: '🔧 Función de stickers en desarrollo...' });
    } catch (error) {
      await sock.sendMessage(jid, { text: '❌ Error al crear el sticker.' });
    }
  }

  private async handleAI(jid: string, args: string[], sock: WASocket, user: User): Promise<void> {
    if (args.length === 0) {
      await sock.sendMessage(jid, { text: '❌ Proporciona una pregunta para la IA.\n\n*Uso:* /ia <pregunta>' });
      return;
    }

    const question = args.join(' ');
    await sock.sendMessage(jid, { text: '🤖 Procesando con IA...' });

    try {
      const response = await this.aiService.generateResponse(question, user.username || 'Usuario');
      await sock.sendMessage(jid, { text: `🤖 *MoJiTo AI:*\n\n${response}` });
    } catch (error) {
      await sock.sendMessage(jid, { text: '❌ Error al procesar la consulta de IA.' });
    }
  }

  private async handleTranslate(jid: string, args: string[], sock: WASocket): Promise<void> {
    if (args.length < 2) {
      await sock.sendMessage(jid, { text: '❌ Proporciona el idioma y el texto a traducir.\n\n*Uso:* /translate <idioma> <texto>' });
      return;
    }

    const targetLanguage = args[0];
    const text = args.slice(1).join(' ');

    try {
      // This would integrate with Google Translate API
      await sock.sendMessage(jid, { text: `🌐 *Traducción:*\n\n${text}\n\n*Traducir a ${targetLanguage}:*\n[Función en desarrollo]` });
    } catch (error) {
      await sock.sendMessage(jid, { text: '❌ Error al traducir el texto.' });
    }
  }

  private async handleWeather(jid: string, args: string[], sock: WASocket): Promise<void> {
    if (args.length === 0) {
      await sock.sendMessage(jid, { text: '❌ Proporciona una ciudad.\n\n*Uso:* /weather <ciudad>' });
      return;
    }

    const city = args.join(' ');

    try {
      // This would integrate with a weather API
      await sock.sendMessage(jid, { 
        text: `🌤️ *Clima en ${city}:*\n\n🌡️ Temperatura: 22°C\n💧 Humedad: 65%\n🌪️ Viento: 10 km/h\n\n[Datos simulados - API en desarrollo]` 
      });
    } catch (error) {
      await sock.sendMessage(jid, { text: '❌ Error al obtener información del clima.' });
    }
  }

  private async handleMeme(jid: string, sock: WASocket): Promise<void> {
    const memes = [
      '😂 ¿Por qué los programadores prefieren el modo oscuro? Porque la luz atrae a los bugs!',
      '🤖 Un bot entra a un bar... Error 404: Chiste no encontrado.',
      '😄 ¿Cuál es el colmo de un bot de WhatsApp? Que se quede sin batería en el celular.',
      '🎭 ¿Por qué los bots nunca se cansan? Porque siempre están en modo automático!',
    ];

    const randomMeme = memes[Math.floor(Math.random() * memes.length)];
    await sock.sendMessage(jid, { text: randomMeme });
  }

  private async handleTrivia(jid: string, sock: WASocket): Promise<void> {
    const questions = [
      {
        question: '¿En qué año se fundó WhatsApp?',
        options: ['A) 2008', 'B) 2009', 'C) 2010', 'D) 2011'],
        answer: 'B) 2009'
      },
      {
        question: '¿Cuál es el planeta más grande del sistema solar?',
        options: ['A) Tierra', 'B) Marte', 'C) Júpiter', 'D) Saturno'],
        answer: 'C) Júpiter'
      },
      {
        question: '¿Qué significa "IA"?',
        options: ['A) Internet Avanzado', 'B) Inteligencia Artificial', 'C) Información Automática', 'D) Interfaz Avanzada'],
        answer: 'B) Inteligencia Artificial'
      }
    ];

    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    
    const triviaText = `🧠 *TRIVIA TIME!*\n\n${randomQuestion.question}\n\n${randomQuestion.options.join('\n')}\n\n_Responde con la letra correcta_`;
    
    await sock.sendMessage(jid, { text: triviaText });
  }

  private async handleMenu(jid: string, sock: WASocket): Promise<void> {
    const commands = await storage.getEnabledCommands();
    const categories = commands.reduce((acc, cmd) => {
      if (!acc[cmd.category]) acc[cmd.category] = [];
      acc[cmd.category].push(cmd);
      return acc;
    }, {} as Record<string, typeof commands>);

    let menuText = `🎶 *MOJITO-MD BOT MENU* 🎶\n`;
    menuText += `_Bailalo Rocky!_\n\n`;

    Object.entries(categories).forEach(([category, cmds]) => {
      menuText += `📋 *${category.toUpperCase()}:*\n`;
      cmds.forEach(cmd => {
        menuText += `  • ${cmd.usage} - ${cmd.description}\n`;
      });
      menuText += `\n`;
    });

    menuText += `💡 *Prefijos válidos:* . / #\n`;
    menuText += `📊 *Total de comandos:* ${commands.length}\n`;
    menuText += `🤖 *Versión:* 2.1.5`;

    await sock.sendMessage(jid, { text: menuText });
  }

  private async handlePing(jid: string, sock: WASocket): Promise<void> {
    const startTime = Date.now();
    
    await sock.sendMessage(jid, { 
      text: `🏓 ¡Pong!\n\n⏱️ Tiempo de respuesta: ${Date.now() - startTime}ms\n📡 Estado: ✅ Conectado\n🤖 MoJiTo-MD Bot funcionando correctamente\n\n📋 Usa /menu para ver comandos disponibles` 
    });
  }

  private async handleInfo(jid: string, sock: WASocket, user: User): Promise<void> {
    const stats = await storage.getTodayStats();
    const totalCommands = await storage.getAllCommands();
    const activeGroups = await storage.getActiveGroups();

    const infoText = `ℹ️ *INFORMACIÓN DEL BOT*\n\n` +
      `👤 *Usuario:* ${user.username || user.phoneNumber}\n` +
      `🏆 *Nivel:* ${user.level}\n` +
      `⭐ *Experiencia:* ${user.experience}\n` +
      `🔢 *Comandos usados:* ${user.commandsUsed}\n\n` +
      `📊 *Estadísticas del bot:*\n` +
      `💬 Mensajes hoy: ${stats.messagesReceived}\n` +
      `⚡ Comandos ejecutados: ${stats.commandsExecuted}\n` +
      `👥 Grupos activos: ${activeGroups.length}\n` +
      `🎯 Total comandos: ${totalCommands.length}\n\n` +
      `🚀 *Estado:* Online ✅\n` +
      `🔧 *Versión:* 2.1.5`;

    await sock.sendMessage(jid, { text: infoText });
  }

  private isValidYouTubeUrl(url: string): boolean {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]{11}/;
    return youtubeRegex.test(url);
  }

  private async handlePlay(jid: string, args: string[], sock: WASocket): Promise<void> {
    if (args.length === 0) {
      await sock.sendMessage(jid, { text: '❌ Proporciona el nombre de una canción.\n\n*Uso:* /play <nombre de canción>' });
      return;
    }

    const query = args.join(' ');
    await sock.sendMessage(jid, { text: `🎵 Buscando: *${query}*\n⏳ Procesando solicitud...` });

    try {
      // This will be handled by the play plugin
      console.log(`🎵 Comando play solicitado: ${query}`);
      await sock.sendMessage(jid, { text: `🎵 Procesando búsqueda de: *${query}*\n\n_Esta funcionalidad será manejada por el plugin de música._` });
    } catch (error) {
      await sock.sendMessage(jid, { text: '❌ Error al buscar la canción. Intenta de nuevo más tarde.' });
    }
  }

  private async updateDownloadStats(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const currentStats = await storage.getBotStats(today) || await storage.getTodayStats();
    
    await storage.createOrUpdateBotStats({
      ...currentStats,
      downloadsCount: (currentStats.downloadsCount || 0) + 1,
    });
  }
}
