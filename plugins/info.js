/**
 * Plugin de información básica del bot
 */

export async function all(m) {
  // Este plugin escucha todos los mensajes para estadísticas
  if (!m.fromMe) {
    global.db.data.stats = global.db.data.stats || {};
    global.db.data.stats.messages = (global.db.data.stats.messages || 0) + 1;
  }
}

export async function before(m) {
  // Procesamiento antes de comandos
  return true;
}

// Comando /bot
export async function handler(m, { conn, usedPrefix, command }) {
  const who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.fromMe ? conn.user.jid : m.sender;
  const name = conn.getName(who);
  const pp = await conn.profilePictureUrl(who, 'image').catch(_ => './src/avatar_contact.png');
  
  const info = `
╭─「 *INFO DEL BOT* 」
│ ⏰ *Tiempo Activo:* ${process.uptime().toFixed(2)} segundos
│ 📱 *Plataforma:* ${process.platform}
│ 💾 *Memoria:* ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
│ 🤖 *Versión:* 2.0.0
│ 👑 *Creador:* @Brian
╰────

*${global.wm}*
`.trim();

  await conn.sendMessage(m.chat, { 
    text: info,
    contextInfo: {
      externalAdReply: {
        title: 'MoJiTo Bot - Info',
        body: 'Bot de WhatsApp Multi-Device',
        thumbnail: await conn.getFile(pp).then(res => res.data),
        sourceUrl: 'https://github.com/BrunoSobrino/TheMystic-Bot-MD'
      }
    }
  });
}

export const help = ['bot', 'info'];
export const tags = ['info'];
export const command = /^(bot|info)$/i;