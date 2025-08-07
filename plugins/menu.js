/**
 * Plugin del menú principal
 */

export async function handler(m, { conn, usedPrefix, command, args }) {
  const who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.fromMe ? conn.user.jid : m.sender;
  const name = conn.getName(who);
  const pp = await conn.profilePictureUrl(who, 'image').catch(_ => './src/avatar_contact.png');
  
  // Obtener lista de plugins
  const plugins = Object.values(global.plugins).filter(plugin => !plugin.disabled);
  const commands = plugins.map(plugin => plugin.help || []).flat();
  
  const menu = `
╭─「 *MENU PRINCIPAL* 」
│ 👋 *Hola:* ${name}
│ 📅 *Fecha:* ${new Date().toLocaleDateString('es-ES')}
│ 🕐 *Hora:* ${new Date().toLocaleTimeString('es-ES')}
│ 📱 *Bot:* MoJiTo-MD
╰────

╭─「 *INFORMACIÓN* 」
│ 🤖 ${usedPrefix}bot
│ 🏓 ${usedPrefix}ping
│ ❓ ${usedPrefix}help
╰────

╭─「 *GENERAL* 」
│ 📊 ${usedPrefix}estado
│ 💎 ${usedPrefix}perfil
│ 🎮 ${usedPrefix}juegos
╰────

⚡ *Total comandos:* ${commands.length}

*${global.wm}*
`.trim();

  await conn.sendMessage(m.chat, { 
    text: menu,
    contextInfo: {
      externalAdReply: {
        title: 'MoJiTo Bot - Menú',
        body: 'Selecciona un comando del menú',
        thumbnail: await conn.getFile(pp).then(res => res.data),
        sourceUrl: 'https://github.com/BrunoSobrino/TheMystic-Bot-MD'
      }
    }
  });
}

export const help = ['menu', 'help', 'comandos'];
export const tags = ['main'];
export const command = /^(menu|help|comandos|\?)$/i;