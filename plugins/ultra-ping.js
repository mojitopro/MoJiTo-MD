/**
 * Ultra-fast ping command with youth style
 */

export async function handler(m, { conn, usedPrefix, command }) {
  const start = process.hrtime.bigint();
  
  // Cálculo ultra rápido de velocidad  
  const responseTime = Number(process.hrtime.bigint() - start) / 1000000;
  const uptime = Math.floor(process.uptime() / 60);
  
  const message = `🏓 *Pong!*

⚡ Respuesta: ${responseTime.toFixed(2)}ms
⏰ Activo: ${uptime}min
💎 Estado: Optimal

*MoJiTo Ultra - Máxima velocidad*`;

  await conn.sendMessage(m.chat, { text: message });
}

export const help = ['ping', 'p', 'velocidad', 'speed', 'latencia'];
export const tags = ['info'];
export const command = /^(ping|p|velocidad|speed|latencia)$/i;