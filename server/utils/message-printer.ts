import chalk from 'chalk';
import { tmpdir } from 'os';
import { join } from 'path';
import { writeFileSync, unlinkSync, existsSync, readFileSync } from 'fs';
import { downloadContentFromMessage, WAMessage, WASocket } from '@whiskeysockets/baileys';
// Jimp y fluent-ffmpeg funcionan bien en Termux/Android
import Jimp from 'jimp';
import terminalImage from 'terminal-image';
import ffmpeg from 'fluent-ffmpeg';
import PhoneNumber from 'awesome-phonenumber';

interface MessageContext {
  conn: WASocket;
}

// Cache para stickers procesados (evitar reprocesar el mismo sticker)
const stickerCache = new Map<string, { buffer: Buffer; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export default async function printMessage(m: WAMessage, context: MessageContext = { conn: {} as WASocket }) {
  const { conn } = context;

  const getName = async (jid: string): Promise<string> => {
    try {
      if (!jid) return '(Desconocido)';
      if (jid === conn.user?.id) return conn.user?.name || 'Yo';

      if ((global as any).db?.data?.users?.[jid]?.name) return (global as any).db.data.users[jid].name;
      if ((global as any).db?.data?.chats?.[jid]?.subject) return (global as any).db.data.chats[jid].subject;
      if ((global as any).db?.data?.chats?.[jid]?.name) return (global as any).db.data.chats[jid].name;

      if (conn.groupMetadata && jid.endsWith('@g.us')) {
        try {
          const metadata = await conn.groupMetadata(jid);
          if (metadata?.subject) return metadata.subject;
        } catch {}
      }

      if (conn && typeof (conn as any).getName === 'function') {
        try {
          const name = await (conn as any).getName(jid);
          if (name && name !== jid) return name;
        } catch {}
      }

      return jid.split('@')[0];
    } catch {
      return jid.split('@')[0];
    }
  };

  const timeStr = new Date().toLocaleTimeString();
  const senderJid = (m.key.participant || m.key.remoteJid || '').replace(/:\d+/, '');
  const chatId = (m.key.remoteJid || '').replace(/:\d+/, '');
  const isGroup = chatId.endsWith('@g.us');

  const senderNum = senderJid.replace(/@.*/, '');
  let sender = senderNum;
  try {
    const phoneNumber = PhoneNumber('+' + senderNum);
    if (phoneNumber.isValid()) {
      sender = phoneNumber.getNumber('international') || senderNum;
    }
  } catch {}

  const chatName = await getName(chatId);
  const senderName = await getName(senderJid);

  const messageContent = m.message;
  const messageTypes: Record<string, { type: string; text: string }> = {
    conversation: { type: 'TEXT', text: messageContent?.conversation || '' },
    extendedTextMessage: { type: 'EXTENDED_TEXT', text: messageContent?.extendedTextMessage?.text || '' },
    imageMessage: { type: 'IMAGE', text: messageContent?.imageMessage?.caption || '' },
    stickerMessage: { type: 'STICKER', text: '[Sticker]' },
    audioMessage: { type: 'AUDIO', text: '[Audio]' },
    videoMessage: { type: 'VIDEO', text: messageContent?.videoMessage?.caption || '[Video]' },
    documentMessage: { type: 'DOCUMENT', text: messageContent?.documentMessage?.fileName || '[Documento]' }
  };

  const messageKey = Object.keys(messageTypes).find(key => messageContent?.[key as keyof typeof messageContent]);
  const { type: messageType, text: messageText } = messageKey ? messageTypes[messageKey] : { type: 'UNKNOWN', text: '' };

  if (Math.random() < 0.4) {
    console.log(chalk.cyan(`💬 Mensajes no leídos: 1 | Chat: ${chatName}`));
  }
  console.log(chalk.cyanBright('┌─────────────────────────────'));
  console.log(chalk.cyanBright(`│ 📤 De: `) + chalk.green(sender));
  console.log(chalk.cyanBright(`│ 🧭 Chat: `) + chalk.yellow(chatName));
  console.log(chalk.cyanBright(`│ 🕒 Hora: `) + chalk.magenta(timeStr));
  console.log(chalk.cyanBright(`│ 🗂️ Tipo: `) + chalk.blueBright(messageType.toUpperCase()));
  if (messageText) console.log(chalk.cyanBright(`│ 💬 Texto: `) + chalk.whiteBright(messageText.slice(0, 200)));
  console.log(chalk.cyanBright('└─────────────────────────────'));

  const mostrarImagen = async (buf: Buffer, isWebp = false, isAnimated = false) => {
    try {
      if (isAnimated) {
        await mostrarStickerAnimado(buf);
        return;
      }

      if (isWebp) {
        console.log(chalk.magenta('🎬 Procesando sticker estático con FFmpeg...'));
        const input = join(tmpdir(), `static_${Date.now()}.webp`);
        const output = input.replace('.webp', '.png');

        try {
          writeFileSync(input, buf);
          await new Promise<void>((resolve) => {
            ffmpeg(input)
              .outputOptions([
                '-vf', 'scale=40:30',
                '-q:v', '31',
                '-preset', 'ultrafast'
              ])
              .save(output)
              .on('end', async () => {
                try {
                  if (existsSync(output)) {
                    const imgBuf = readFileSync(output);
                    const terminalImg = await terminalImage.buffer(imgBuf, {
                      width: 20,
                      height: 10,
                      preserveAspectRatio: false
                    });
                    console.log(chalk.magenta('📱'), terminalImg);
                    unlinkSync(output);
                  }
                } catch {}
                resolve();
              })
              .on('error', () => resolve());
          });
          if (existsSync(input)) unlinkSync(input);
        } catch {}
      } else {
        try {
          const img = await Jimp.read(buf);
          const optimizedBuf = await img.resize(64, 64).getBufferAsync(Jimp.MIME_PNG);
          const terminalImg = await terminalImage.buffer(optimizedBuf, {
            width: 15,
            height: 8,
            preserveAspectRatio: false
          });
          console.log(chalk.cyan('🖼️'), terminalImg);
        } catch {
          console.log(chalk.cyan('🖼️'));
        }
      }
    } catch {
      console.log(chalk.cyan('🖼️ [Media]'));
    }
  };

  const mostrarStickerAnimado = async (buf: Buffer) => {
    const input = join(tmpdir(), `anim_${Date.now()}.webp`);
    const output = input.replace('.webp', '.png');

    try {
      writeFileSync(input, buf);
      console.log(chalk.magenta('🎬 Procesando sticker animado con FFmpeg...'));

      await new Promise<void>((resolve) => {
        ffmpeg(input)
          .outputOptions([
            '-vframes', '1',
            '-vf', 'scale=40:30',
            '-q:v', '31',
            '-preset', 'ultrafast'
          ])
          .save(output)
          .on('end', async () => {
            try {
              if (existsSync(output)) {
                const imageBuffer = readFileSync(output);
                const terminalImg = await terminalImage.buffer(imageBuffer, {
                  width: 20,
                  height: 10,
                  preserveAspectRatio: false
                });
                console.log(chalk.magenta('📺'), terminalImg);
                unlinkSync(output);
              }
            } catch {}
            resolve();
          })
          .on('error', () => resolve());
      });

      if (existsSync(input)) unlinkSync(input);
    } catch {}
  };

  // Handle images
  if (messageContent?.imageMessage) {
    try {
      const stream = await downloadContentFromMessage(messageContent.imageMessage, 'image');
      let buf = Buffer.from([]);
      for await (const chunk of stream) {
        buf = Buffer.concat([buf, chunk]);
      }
      if (buf?.length) {
        await mostrarImagen(buf);
      } else {
        console.log(chalk.yellow('⚠️ Imagen vacía o no disponible.'));
      }
    } catch (err) {
      console.log(chalk.red('⚠️ Error mostrando imagen:'), (err as Error).message);
    }
  }

  // Handle stickers
  if (messageContent?.stickerMessage) {
    try {
      const msgContent = messageContent.stickerMessage;
      const isAnimated = msgContent?.isAnimated || false;

      const stream = await downloadContentFromMessage(msgContent, 'sticker');
      let buf = Buffer.from([]);
      for await (const chunk of stream) {
        buf = Buffer.concat([buf, chunk]);
      }

      if (buf?.length) {
        await mostrarImagen(buf, true, isAnimated);
      } else {
        console.log(chalk.cyan('🎭'));
      }
    } catch (err) {
      console.log(chalk.red('⚠️ Error mostrando sticker:'), (err as Error).message);
      console.log(chalk.cyan('\n🎭 ═════════ STICKER PLACEHOLDER ═════════'));
      console.log('┌──────────────────────────────────────────┐');
      console.log('│            🎭 STICKER RECIBIDO           │');
      console.log('│         ┌────────────────┐              │');
      console.log('│         │   ( ◉    ◉ )   │              │');
      console.log('│         │       ▽        │              │');
      console.log('│         │    ╰─────╯     │              │');
      console.log('│         └────────────────┘              │');
      console.log('│  ⚠️ No se pudo mostrar imagen real       │');
      console.log('└──────────────────────────────────────────┘');
      console.log('═══════════════════════════════════════════════\n');
    }
  }

  if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
    console.log(chalk.cyan('🔔 Menciones:'));
    for (const jid of m.message.extendedTextMessage.contextInfo.mentionedJid) {
      const cleanJid = jid.replace(/:\d+/, '');
      const name = await getName(cleanJid);
      const user = PhoneNumber('+' + cleanJid.replace(/@.*/, '')).getNumber('international') || cleanJid.replace(/@.*/, '');
      console.log(chalk.cyan(`   ${user} ${name ? '~ ' + name : ''}`));
    }
  }

  const messageId = m.key.id?.substring(0, 8) + '...';
  console.log();
  console.log(chalk.green(`📖 Mensaje leído | ID: ${messageId}`));
  console.log();

  cleanExpiredCache();
}

function cleanExpiredCache() {
  if (Math.random() < 0.1) {
    const now = Date.now();
    Array.from(stickerCache.entries()).forEach(([key, value]) => {
      if (now - value.timestamp > CACHE_DURATION) {
        stickerCache.delete(key);
      }
    });
  }
}