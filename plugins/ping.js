/**
 * Plugin de ping - mide latencia
 */

export async function handler(m, { conn, usedPrefix, command }) {
  const start = Date.now();
  
  const msg = await conn.sendMessage(m.chat, { text: '🏃‍♂️ *Calculando ping...*' });
  
  const ping = Date.now() - start;
  
  await conn.sendMessage(m.chat, { 
    text: `🏓 *Pong!*\n📊 *Latencia:* ${ping}ms\n⚡ *Velocidad:* ${ping < 100 ? 'Excelente' : ping < 300 ? 'Buena' : 'Regular'}`,
    edit: msg.key
  });
}

export const help = ['ping'];
export const tags = ['info'];
export const command = /^(ping)$/i;