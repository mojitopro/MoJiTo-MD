// @ts-ignore - yt-search no tiene tipos definidos
import yts from 'yt-search';
import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { WAMessage, WASocket } from '@whiskeysockets/baileys';
import { print } from '../utils/print';

interface PlayContext {
  conn: WASocket;
  text: string;
  command: string;
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const handler = async (m: WAMessage, { conn, text, command }: PlayContext) => {
  if (!text) throw `🚫 *Debes escribir el nombre de una canción para buscarla.*\n\n📌 Ejemplo: *.play Ferxxo 100*`;

  const rawSender = typeof m.key.participant === 'string' ? m.key.participant : m.key.remoteJid || '';
  const number = rawSender.split('@')[0];
  const mentionJid = rawSender;

  print.command(`Play command executed`, `play ${text}`, number);

  // 1. Mostrar mensaje inicial rápidamente
  let msg = await conn.sendMessage(m.key.remoteJid!, {
    text: `🔍 Buscando en YouTube...`,
    mentions: [mentionJid]
  }, { quoted: m });

  try {
    // 2. Buscar video
    let search = await yts(text);
    let vid = search.videos[0];
    if (!vid) throw '⚠️ No se encontró ningún resultado en YouTube.';

    let { title, url: ytUrl, timestamp, views, ago } = vid;
    let infoTexto = `🎵 *${title}*\n⏱️ Duración: ${timestamp}\n👀 Vistas: ${views}\n📅 Publicado: ${ago}\n🔗 ${ytUrl}`;

    // 3. Mostrar info después de obtenerla
    if (msg && msg.key) {
      await conn.sendMessage(m.key.remoteJid!, {
        text: infoTexto,
        edit: msg.key
      });
    }

    // 4. Preparar ruta de descarga
    const tempDir = './temp';
    await fs.mkdir(tempDir, { recursive: true });
    const filePath = path.join(tempDir, `audio_${Date.now()}.mp3`);

    // 5. Iniciar descarga en segundo plano
    let descargaCompleta = false;
    const descarga = new Promise<void>((resolve, reject) => {
      exec(`yt-dlp -x --audio-format mp3 -o "${filePath}" "${ytUrl}"`, (err) => {
        if (err) return reject(new Error('❌ Error al descargar el audio.'));
        descargaCompleta = true;
        resolve();
      });
    });

    // 6. Esperar 3 segundos para que el usuario vea la info
    await delay(3000);

    // 7. Mostrar animación sin editar demasiado rápido
    const frames = ['▰▱▱▱▱', '▰▰▱▱▱', '▰▰▰▱▱', '▰▰▰▰▱', '▰▰▰▰▰'];
    let frameIndex = 0;

    const animar = async () => {
      while (!descargaCompleta) {
        try {
          if (msg && msg.key) {
            await conn.sendMessage(m.key.remoteJid!, {
              text: `📥 Descargando... ${frames[frameIndex]}`,
              edit: msg.key
            });
          }
        } catch (e) {
          // Ignorar errores por edición demasiado frecuente
        }
        frameIndex = (frameIndex + 1) % frames.length;
        await delay(800);
      }
    };

    await Promise.race([descarga, animar()]);

    // 8. Confirmar finalización
    if (msg && msg.key) {
      await conn.sendMessage(m.key.remoteJid!, {
        text: `✅ Listo! Toma tu MRD @${number}`,
        mentions: [mentionJid],
        edit: msg.key
      });
    }

    // 9. Enviar como nota de voz
    await conn.sendMessage(m.key.remoteJid!, {
      audio: { url: filePath },
      mimetype: 'audio/mp4',
      ptt: true
    }, { quoted: m });

    // 10. Borrar archivo temporal
    await fs.unlink(filePath);

    print.download(`Audio downloaded and sent: ${title}`, 'YOUTUBE');

  } catch (error) {
    print.error(`Play command failed: ${error}`);
    if (msg && msg.key) {
      await conn.sendMessage(m.key.remoteJid!, {
        text: `❌ Error: ${error}`,
        edit: msg.key
      });
    }
  }
};

export default {
  command: /^play$/i,
  handler,
  help: ['play <query>'],
  tags: ['media'],
  description: 'Descarga música de YouTube'
};