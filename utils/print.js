/**
 * Sistema de impresión avanzado en consola
 * Muestra stickers e imágenes directamente en la terminal
 * Compatible con Termux y Replit
 */
/**
 * ADVANCED TERMINAL PRINTING SYSTEM - OPTIMIZED
 * Direct image/sticker display in terminal with fallback support
 * Compatible with Termux, Replit, and all environments
 */
import chalk from 'chalk';
import PhoneNumber from 'awesome-phonenumber';
import { writeFileSync, unlinkSync, existsSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { logger } from '../services/logger.js';

// Dynamic imports for optional dependencies with fallbacks
let terminalImage = null;
let Jimp = null;
let ffmpeg = null;

// Initialize advanced features asynchronously
const initializeAdvancedFeatures = async () => {
  try {
    terminalImage = await import('terminal-image');
    logger.debug('✅ Terminal image support enabled');
  } catch {
    logger.debug('📱 Terminal image fallback mode (no terminal-image)');
  }

  try {
    Jimp = (await import('jimp')).default;
    logger.debug('✅ Image processing enabled');
  } catch {
    logger.debug('🖼️ Basic image mode (no jimp)');
  }

  try {
    ffmpeg = (await import('fluent-ffmpeg')).default;
    logger.debug('✅ Video processing enabled');
  } catch {
    logger.debug('🎥 Basic video mode (no ffmpeg)');
  }
};

// Initialize features when the module is loaded
initializeAdvancedFeatures().catch(() => {});

export async function printMessage(m, conn = {}) {
  try {
    // Ensure advanced features are initialized
    if (!terminalImage && !Jimp && !ffmpeg) {
      await initializeAdvancedFeatures().catch(() => {});
    }
    // Optimized name resolution with caching
    const nameCache = new Map();
    const getName = async (jid) => {
      if (!jid) return '(Desconocido)';
      if (nameCache.has(jid)) return nameCache.get(jid);
      
      try {
        let name;
        if (jid === conn.user?.jid) {
          name = conn.user?.name || 'Yo';
        } else if (global.db?.data?.users?.[jid]?.name) {
          name = global.db.data.users[jid].name;
        } else if (jid.endsWith('@g.us') && conn.groupMetadata) {
          const metadata = await conn.groupMetadata(jid).catch(() => null);
          name = metadata?.subject || jid.split('@')[0];
        } else {
          name = jid.split('@')[0];
        }
        nameCache.set(jid, name);
        return name;
      } catch {
        const fallback = jid.split('@')[0];
        nameCache.set(jid, fallback);
        return fallback;
      }
    };

    const timeStr = new Date().toLocaleTimeString();
    const senderJid = (m.sender || '').replace(/:\d+/, '');
    const senderNum = senderJid.replace(/@.*/, '');
    const sender = PhoneNumber('+' + senderNum).getNumber('international') || senderNum;
    const chatId = (m.chat || '').replace(/:\d+/, '');
    const isGroup = chatId.endsWith('@g.us');
    const chatName = await getName(chatId);
    const senderName = await getName(senderJid);

    // SOPHISTICATED STYLED HEADER
    const headerColor = isGroup ? chalk.blueBright : chalk.greenBright;
    const borderChar = isGroup ? '═' : '─';
    const typeIcon = getTypeIcon(m.mtype);
    
    console.log(headerColor('┌' + borderChar.repeat(60) + '┐'));
    console.log(headerColor('│') + ` ${typeIcon} ` + chalk.bold.white(senderName.slice(0, 20).padEnd(20)) + headerColor(' │ ') + chalk.gray(timeStr) + headerColor(' │'));
    
    if (isGroup) {
      console.log(headerColor('│') + ` 👥 ` + chalk.yellow(chatName.slice(0, 50).padEnd(50)) + headerColor(' │'));
    }
    
    if (m.text && m.text.length > 0) {
      const textPreview = m.text.slice(0, 55);
      const truncated = m.text.length > 55 ? '...' : '';
      console.log(headerColor('│') + ` 💬 ` + chalk.white(textPreview + truncated).padEnd(55) + headerColor(' │'));
    }
    
    console.log(headerColor('└' + borderChar.repeat(60) + '┘'));

    // ADVANCED IMAGE/STICKER TERMINAL DISPLAY
    const displayMediaInTerminal = async (buf, mediaType, isAnimated = false) => {
      try {
        if (isAnimated) {
          console.log(chalk.magenta('🎬 ') + chalk.yellow('Animated sticker ') + chalk.gray('(animation preview not supported)'));
          return await displayStaticImageFallback(buf, mediaType);
        }

        // Try advanced terminal image display if available
        if (terminalImage && Jimp) {
          return await displayAdvancedImage(buf, mediaType);
        }
        
        // Fallback to ASCII representation
        return await displayImageFallback(buf, mediaType);
        
      } catch (err) {
        logger.debug('Media display error:', err.message);
        return displayBasicMediaInfo(buf, mediaType);
      }
    };
    
    // Advanced image display with terminal-image and jimp
    const displayAdvancedImage = async (buf, mediaType) => {
      try {
        let processedBuf = buf;
        
        // Process WebP stickers
        if (mediaType === 'sticker' && ffmpeg) {
          processedBuf = await convertWebPToPNG(buf);
        }
        
        // Optimize image for terminal display
        if (Jimp) {
          const img = await Jimp.read(processedBuf);
          // Resize for optimal terminal display
          img.resize(120, Jimp.AUTO);
          processedBuf = await img.getBufferAsync(Jimp.MIME_PNG);
        }
        
        // Display in terminal
        const imageOutput = await terminalImage.default.buffer(processedBuf, { 
          width: '25%',
          height: '25%'
        });
        
        console.log(imageOutput);
        return true;
        
      } catch (error) {
        logger.debug('Advanced display failed:', error.message);
        return false;
      }
    };
    
    // WebP to PNG conversion
    const convertWebPToPNG = async (webpBuf) => {
      if (!ffmpeg) return webpBuf;
      
      try {
        const input = join(tmpdir(), `sticker_${Date.now()}.webp`);
        const output = input.replace('.webp', '.png');
        
        writeFileSync(input, webpBuf);
        
        await new Promise((resolve, reject) => {
          ffmpeg(input)
            .outputOptions(['-vcodec', 'png'])
            .save(output)
            .on('end', resolve)
            .on('error', reject);
        });
        
        const pngBuf = readFileSync(output);
        
        // Cleanup
        if (existsSync(input)) unlinkSync(input);
        if (existsSync(output)) unlinkSync(output);
        
        return pngBuf;
      } catch (error) {
        logger.debug('WebP conversion failed:', error.message);
        return webpBuf;
      }
    };
    
    // ASCII art fallback for images
    const displayImageFallback = async (buf, mediaType) => {
      try {
        // Create simple ASCII representation based on image data
        const size = Math.min(Math.floor(buf.length / 1024), 50);
        const intensity = Math.floor((buf[0] + buf[buf.length-1]) / 32);
        
        const chars = [' ', '░', '▒', '▓', '█'];
        const char = chars[Math.min(intensity, chars.length - 1)];
        
        console.log(chalk.cyan('┌' + '─'.repeat(size) + '┐'));
        for (let i = 0; i < Math.min(size/4, 8); i++) {
          console.log(chalk.cyan('│') + chalk.gray(char.repeat(size)) + chalk.cyan('│'));
        }
        console.log(chalk.cyan('└' + '─'.repeat(size) + '┘'));
        console.log(chalk.gray(`↑ ${mediaType.toUpperCase()} preview (${(buf.length/1024).toFixed(1)}KB)`));
        
        return true;
      } catch {
        return false;
      }
    };
    
    // Static image fallback
    const displayStaticImageFallback = async (buf, mediaType) => {
      return await displayImageFallback(buf, mediaType);
    };
    
    // Basic media info display
    const displayBasicMediaInfo = (buf, mediaType) => {
      const sizeKB = (buf.length / 1024).toFixed(1);
      const icon = mediaType === 'image' ? '🖼️' : '🏷️';
      console.log(chalk.green(`${icon} ${mediaType.toUpperCase()} received (${sizeKB} KB)`));
      return true;
    };

    const tipo = m.mtype || '';
    const mime = (m.msg || m)?.mimetype || m.mediaType || '';

    // SOPHISTICATED MULTIMEDIA PROCESSING WITH TERMINAL DISPLAY
    if (tipo.includes('image')) {
      try {
        const stream = await downloadContentFromMessage(m.msg || m.message?.imageMessage, 'image');
        let buf = Buffer.from([]);
        for await (const chunk of stream) {
          buf = Buffer.concat([buf, chunk]);
        }
        
        if (buf?.length) {
          console.log(chalk.cyan('📸 ') + chalk.white('IMAGE') + chalk.gray(` (${(buf.length/1024).toFixed(1)}KB, ${mime || 'unknown'})}`));
          await displayMediaInTerminal(buf, 'image');
        }
      } catch (err) {
        console.log(chalk.red('⚠️ Image processing error:'), err.message);
      }
    }

    if (tipo.includes('sticker')) {
      try {
        const msgContent = m.msg || m.message?.stickerMessage;
        const isAnimated = msgContent?.isAnimated || false;
        
        const stream = await downloadContentFromMessage(msgContent, 'sticker');
        let buf = Buffer.from([]);
        for await (const chunk of stream) {
          buf = Buffer.concat([buf, chunk]);
        }
        
        if (buf?.length) {
          const animatedText = isAnimated ? chalk.magenta(' [ANIMATED]') : '';
          console.log(chalk.cyan('🏷️ ') + chalk.white('STICKER') + animatedText + chalk.gray(` (${(buf.length/1024).toFixed(1)}KB)`));
          await displayMediaInTerminal(buf, 'sticker', isAnimated);
        }
      } catch (err) {
        console.log(chalk.red('⚠️ Sticker processing error:'), err.message);
      }
    }

    // OTHER MULTIMEDIA TYPES WITH ENHANCED INFO
    if (tipo.includes('video')) {
      const videoIcon = mime?.includes('gif') ? '🎞️' : '🎥';
      console.log(chalk.cyan(videoIcon + ' ') + chalk.white('VIDEO') + chalk.gray(` (${mime || 'unknown'})}`));
    }
    if (tipo.includes('audio') || tipo.includes('ptt')) {
      const isVoiceNote = tipo.includes('ptt');
      const icon = isVoiceNote ? '🎙️' : '🎵';
      const label = isVoiceNote ? 'VOICE NOTE' : 'AUDIO';
      console.log(chalk.cyan(icon + ' ') + chalk.white(label) + chalk.gray(` (${mime || 'unknown'})}`));
    }
    if (tipo.includes('document')) {
      const docIcon = getDocumentIcon(mime);
      console.log(chalk.cyan(docIcon + ' ') + chalk.white('DOCUMENT') + chalk.gray(` (${mime || 'unknown'})}`));
    }

    // ERROR DISPLAY WITH SOPHISTICATED FORMATTING
    if (m.error) {
      console.log(chalk.red('┌─ ❌ ERROR'));
      console.log(chalk.red('│ ') + chalk.white(m.error));
      console.log(chalk.red('└─'));
    }

    // MENTIONS WITH SOPHISTICATED FORMATTING
    if (Array.isArray(m.mentionedJid) && m.mentionedJid.length > 0) {
      console.log(chalk.yellow('┌─ 🔔 MENTIONS'));
      for (const jid of m.mentionedJid) {
        const cleanJid = jid.replace(/:\d+/, '');
        const name = await getName(cleanJid);
        const phoneFormatted = formatPhoneNumber(cleanJid);
        console.log(chalk.yellow('│ ') + chalk.white(name) + chalk.gray(` (${phoneFormatted})`));
      }
      console.log(chalk.yellow('└─'));
    }

    console.log(); // Línea en blanco para separar mensajes

    console.log(); // Elegant spacing

  } catch (error) {
    logger.debug('Print error:', error.message);
    console.log(chalk.red('⚠️ Display error:'), error.message.slice(0, 50));
  }
}

// UTILITY FUNCTIONS FOR SOPHISTICATED PRINTING
function getTypeIcon(mtype) {
  const icons = {
    'conversation': '💬',
    'extendedTextMessage': '📝',
    'imageMessage': '📸',
    'videoMessage': '🎥',
    'audioMessage': '🎵',
    'stickerMessage': '🏷️',
    'documentMessage': '📄',
    'contactMessage': '👤',
    'locationMessage': '📍'
  };
  return icons[mtype] || '❓';
}

function getDocumentIcon(mime) {
  if (!mime) return '📄';
  if (mime.includes('pdf')) return '📕';
  if (mime.includes('image')) return '🖼️';
  if (mime.includes('video')) return '🎬';
  if (mime.includes('audio')) return '🎧';
  if (mime.includes('zip') || mime.includes('rar')) return '📦';
  if (mime.includes('text')) return '📝';
  return '📄';
}

function formatPhoneNumber(jid) {
  try {
    const number = jid.replace(/@.*/, '');
    const phone = PhoneNumber('+' + number);
    return phone.getNumber('international') || `+${number}`;
  } catch {
    return jid.split('@')[0];
  }
}

// ADVANCED BOT EVENT PRINTING SYSTEM
export function printBotEvent(event, data = {}) {
  const timeStr = new Date().toLocaleTimeString('es-ES', { hour12: false });
  
  switch (event) {
    case 'command':
      console.log(chalk.magentaBright('⚡ COMMAND ') + chalk.cyan(`${data.command}`) + chalk.gray(` at ${timeStr}`));
      break;
    case 'connection':
      const statusColor = data.state === 'open' ? chalk.green : data.state === 'close' ? chalk.red : chalk.yellow;
      console.log(chalk.blueBright('🔗 CONNECTION ') + statusColor(data.state.toUpperCase()) + chalk.gray(` at ${timeStr}`));
      break;
    case 'error':
      console.log(chalk.redBright('❌ ERROR ') + chalk.red(data.message) + chalk.gray(` at ${timeStr}`));
      break;
    case 'plugin_loaded':
      console.log(chalk.greenBright('🔌 PLUGIN ') + chalk.white(data.name) + chalk.gray(` loaded at ${timeStr}`));
      break;
    case 'user_join':
      console.log(chalk.greenBright('👋 JOIN ') + chalk.white(data.user) + chalk.gray(` joined ${data.group}`));
      break;
    case 'user_leave':
      console.log(chalk.yellowBright('👋 LEAVE ') + chalk.white(data.user) + chalk.gray(` left ${data.group}`));
      break;
    default:
      console.log(chalk.gray(`ℹ️ ${event.toUpperCase()}: ${JSON.stringify(data)}`));
  }
}

// SOPHISTICATED STARTUP BANNER WITH SYSTEM INFO
export function printStartupBanner() {
  console.clear();
  
  // Gradient banner with system detection
  const platform = process.platform;
  const isTermux = process.env.PREFIX?.includes('com.termux');
  const isReplit = process.env.REPLIT_ENV === 'true';
  
  console.log(chalk.gradient('cyan', 'magenta')(
`╔══════════════════════════════════════════════════════════════════════╗
║                     🤖 MOJITO WHATSAPP BOT 🤖                       ║
║                 📱 ADVANCED TERMINAL INTERFACE 📱                    ║
╠══════════════════════════════════════════════════════════════════════╣
║  ⚡ Bulletproof session persistence                                  ║
║  🖼️  Terminal image/sticker display                                  ║
║  🎨 Sophisticated console printing                                   ║
║  🔧 Auto-reconnection & optimization                                 ║
╚══════════════════════════════════════════════════════════════════════╝`));
  
  // Environment detection
  const envInfo = [];
  if (isTermux) envInfo.push(chalk.green('📱 Termux'));
  if (isReplit) envInfo.push(chalk.blue('☁️ Replit'));
  if (terminalImage) envInfo.push(chalk.cyan('🖼️ Terminal Images'));
  if (Jimp) envInfo.push(chalk.magenta('🎨 Image Processing'));
  if (ffmpeg) envInfo.push(chalk.yellow('🎥 Video Support'));
  
  if (envInfo.length > 0) {
    console.log('\n' + chalk.white('🔧 Environment: ') + envInfo.join(' '));
  }
  
  console.log('\n' + chalk.green('✅ System optimized for maximum uptime and reliability'));
  console.log(chalk.cyan('🚀 Advanced printing system active'));
  console.log();
}