/**
 * Sistema de impresión avanzado en consola
 * Muestra stickers e imágenes directamente en la terminal
 * Compatible con Termux y Replit
 */
import chalk from 'chalk';
import PhoneNumber from 'awesome-phonenumber';
// import terminalImage from 'terminal-image';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
// import Jimp from 'jimp';
// import ffmpeg from 'fluent-ffmpeg';
import { downloadContentFromMessage } from '@whiskeysockets/baileys';
import { logger } from '../services/logger.js';

export async function printMessage(m, conn = {}) {
  try {
    const getName = async (jid) => {
      try {
        if (!jid) return '(Desconocido)';
        if (jid === conn.user?.jid) return conn.user?.name || 'Yo';
        if (global.db?.data?.users?.[jid]?.name) return global.db.data.users[jid].name;
        if (global.db?.data?.chats?.[jid]?.subject) return global.db.data.chats[jid].subject;
        if (global.db?.data?.chats?.[jid]?.name) return global.db.data.chats[jid].name;
        if (conn.groupMetadata && jid.endsWith('@g.us')) {
          const metadata = await conn.groupMetadata(jid).catch(() => null);
          if (metadata?.subject) return metadata.subject;
        }
        if (conn.getName) {
          const name = await conn.getName(jid);
          if (name && name !== jid) return name;
        }
        return jid.split('@')[0];
      } catch {
        return jid.split('@')[0];
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

    // Header estilizado
    console.log(chalk.cyanBright('┌─────────────────────────────'));
    console.log(chalk.cyanBright(`│ 📤 De: `) + chalk.green(senderName));
    console.log(chalk.cyanBright(`│ 🧭 Chat: `) + chalk.yellow(chatName));
    console.log(chalk.cyanBright(`│ 🕒 Hora: `) + chalk.magenta(timeStr));
    console.log(chalk.cyanBright(`│ 🗂️ Tipo: `) + chalk.blueBright((m.mtype || '').toUpperCase()));
    if (m.text) console.log(chalk.cyanBright(`│ 💬 Texto: `) + chalk.whiteBright(m.text.slice(0, 200)));
    console.log(chalk.cyanBright('└─────────────────────────────'));

    // Función para mostrar imágenes/stickers en terminal
    const mostrarImagen = async (buf, isWebp = false, isAnimated = false) => {
      try {
        if (isAnimated) {
          console.log(chalk.yellow('🎬 Sticker animado detectado (se omite animación)'));
          return;
        }

        if (isWebp) {
          const input = join(tmpdir(), `sticker_${Date.now()}.webp`);
          const output = input.replace('.webp', '.png');
          writeFileSync(input, buf);

          await new Promise((resolve, reject) => {
            ffmpeg(input)
              .outputOptions(['-vcodec', 'png'])
              .save(output)
              .on('end', resolve)
              .on('error', (err) => {
                if (err.message.includes('code 69')) {
                  console.log(chalk.yellow('⚠️ ffmpeg no pudo convertir este sticker (código 69), se omite la imagen.'));
                  resolve();
                } else {
                  logger.warn('Error en conversión ffmpeg:', err.message);
                  resolve(); // Continuar sin mostrar imagen
                }
              });
          });

          try {
            if (existsSync(output)) {
              buf = await Jimp.read(output).then(img => img.getBufferAsync(Jimp.MIME_PNG));
            } else {
              console.log(chalk.yellow('⚠️ No se creó archivo PNG, se omite la imagen.'));
              return;
            }
          } catch (error) {
            logger.warn('Error leyendo imagen convertida:', error.message);
            return;
          }

          // Limpiar archivos temporales
          if (existsSync(input)) unlinkSync(input);
          if (existsSync(output)) unlinkSync(output);
        } else {
          // Procesar imagen normal
          try {
            const img = await Jimp.read(buf);
            buf = await img.getBufferAsync(Jimp.MIME_PNG);
          } catch (error) {
            logger.warn('Error procesando imagen con Jimp:', error.message);
            return;
          }
        }

        // Mostrar imagen en terminal
        if (buf && buf.length > 0) {
          const imageOutput = await terminalImage.buffer(buf, { width: '20%' });
          process.stdout.write(imageOutput + '\n');
        }
      } catch (err) {
        console.log(chalk.red('⚠️ Error mostrando imagen/sticker:'), err.message);
        logger.error('Error en mostrarImagen:', err);
      }
    };

    const tipo = m.mtype || '';
    const mime = (m.msg || m)?.mimetype || m.mediaType || '';

    // Procesar multimedia (por ahora sin visualización, solo información)
    if (tipo.includes('image')) {
      console.log(chalk.cyan('📸 ') + chalk.white('Imagen recibida') + chalk.gray(` (${mime || 'sin tipo'})}`));
      try {
        const stream = await downloadContentFromMessage(m.msg || m.message?.imageMessage, 'image');
        let buf = Buffer.from([]);
        for await (const chunk of stream) {
          buf = Buffer.concat([buf, chunk]);
        }
        if (buf?.length) {
          console.log(chalk.green(`✅ Imagen descargada: ${(buf.length / 1024).toFixed(1)} KB`));
          // TODO: Implementar visualización en terminal cuando las dependencias estén disponibles
        }
      } catch (err) {
        console.log(chalk.red('⚠️ Error procesando imagen:'), err.message);
      }
    }

    if (tipo.includes('sticker')) {
      console.log(chalk.cyan('🏷️ ') + chalk.white('Sticker recibido') + chalk.gray(` (${mime || 'webp'})}`));
      try {
        const msgContent = m.msg || m.message?.stickerMessage;
        const isAnimated = msgContent?.isAnimated || false;
        console.log(chalk.magenta(`🎬 Animado: ${isAnimated ? 'Sí' : 'No'}`));
        
        const stream = await downloadContentFromMessage(msgContent, 'sticker');
        let buf = Buffer.from([]);
        for await (const chunk of stream) {
          buf = Buffer.concat([buf, chunk]);
        }
        if (buf?.length) {
          console.log(chalk.green(`✅ Sticker descargado: ${(buf.length / 1024).toFixed(1)} KB`));
          // TODO: Implementar visualización en terminal cuando las dependencias estén disponibles
        }
      } catch (err) {
        console.log(chalk.red('⚠️ Error procesando sticker:'), err.message);
      }
    }

    // Procesar otros tipos de multimedia
    if (tipo.includes('video')) {
      console.log(chalk.cyan('🎥 ') + chalk.white('Video recibido') + chalk.gray(` (${mime || 'sin tipo'})}`));
    }
    if (tipo.includes('audio') || tipo.includes('ptt')) {
      const isVoiceNote = tipo.includes('ptt');
      console.log(chalk.cyan(isVoiceNote ? '🎙️ ' : '🎵 ') + chalk.white(isVoiceNote ? 'Nota de voz' : 'Audio') + chalk.gray(` (${mime || 'sin tipo'})}`));
    }
    if (tipo.includes('document')) {
      console.log(chalk.cyan('📄 ') + chalk.white('Documento recibido') + chalk.gray(` (${mime || 'sin tipo'})}`));
    }

    // Mostrar errores si los hay
    if (m.error) {
      console.log(chalk.bgRedBright('💥 ERROR:'), chalk.red(m.error));
    }

    // Mostrar menciones
    if (Array.isArray(m.mentionedJid)) {
      for (const jid of m.mentionedJid) {
        const cleanJid = jid.replace(/:\d+/, '');
        const name = await getName(cleanJid);
        const user = PhoneNumber('+' + cleanJid.replace(/@.*/, '')).getNumber('international') || cleanJid;
        console.log(chalk.cyan(`🔔 Mencionado: ${user} ${name ? '~ ' + name : ''}`));
      }
    }

    console.log(); // Línea en blanco para separar mensajes

  } catch (error) {
    logger.error('Error en printMessage:', error);
    console.log(chalk.red('❌ Error imprimiendo mensaje:'), error.message);
  }
}

// Función adicional para imprimir eventos del bot
export function printBotEvent(event, data = {}) {
  const timeStr = new Date().toLocaleTimeString();
  
  switch (event) {
    case 'command':
      console.log(chalk.magentaBright('🚀 ') + chalk.white(`[${timeStr}] Comando ejecutado: `) + chalk.cyan(data.command));
      break;
    case 'connection':
      console.log(chalk.greenBright('🔗 ') + chalk.white(`[${timeStr}] Estado de conexión: `) + chalk.yellow(data.state));
      break;
    case 'error':
      console.log(chalk.redBright('❌ ') + chalk.white(`[${timeStr}] Error: `) + chalk.red(data.message));
      break;
    case 'plugin_loaded':
      console.log(chalk.blueBright('🔌 ') + chalk.white(`[${timeStr}] Plugin cargado: `) + chalk.green(data.name));
      break;
    default:
      console.log(chalk.gray('ℹ️ ') + chalk.white(`[${timeStr}] ${event}: `) + chalk.gray(JSON.stringify(data)));
  }
}

// Banner de inicio estilizado
export function printStartupBanner() {
  console.clear();
  console.log(chalk.gradient('cyan', 'blue')(`
  ╔══════════════════════════════════════════════════════════════════╗
  ║                    🤖 MOJITO WHATSAPP BOT 🤖                     ║
  ║                      📱 SISTEMA AVANZADO 📱                       ║
  ╠══════════════════════════════════════════════════════════════════╣
  ║  🚀 Bot optimizado para Termux y Replit                          ║
  ║  🎨 Sistema de impresión visual avanzado                         ║
  ║  🖼️  Soporte para stickers e imágenes en consola                ║
  ║  ⚡ Conexión bulletproof con QR y Pairing Code                   ║
  ╚══════════════════════════════════════════════════════════════════╝
  `));
  
  console.log(chalk.yellow(`
  💡 Características:
     • Visualización de stickers en terminal
     • Impresión de imágenes en consola  
     • Sistema de logs colorizado
     • Compatible con Termux/Linux
     • Plugins modulares
  `));
  
  console.log(chalk.green(`
  🔧 Estado del sistema: `) + chalk.blueBright('INICIANDO...'));
  console.log();
}