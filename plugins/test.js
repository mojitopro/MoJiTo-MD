/**
 * Plugin de prueba básica
 */

export async function handler(m, { conn, usedPrefix, command, args, text }) {
  if (!text) {
    return m.reply(`🧪 *Comando de prueba*\n\nUso: ${usedPrefix + command} <mensaje>\n\nEjemplo: ${usedPrefix + command} Hola mundo`);
  }
  
  const response = `
✅ *Prueba exitosa!*

📝 *Mensaje recibido:* ${text}
👤 *Usuario:* @${m.sender.split('@')[0]}
💬 *Chat:* ${m.isGroup ? 'Grupo' : 'Privado'}
🕐 *Hora:* ${new Date().toLocaleString('es-ES')}

*El bot está funcionando correctamente ✨*
`.trim();

  await m.reply(response, null, { mentions: [m.sender] });
}

export const help = ['test', 'prueba'];
export const tags = ['main'];
export const command = /^(test|prueba)$/i;