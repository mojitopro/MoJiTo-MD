/**
 * Ultra-fast ping command with youth style
 */

export async function handler(m, { conn, usedPrefix, command }) {
  const start = process.hrtime.bigint();
  
  // Send initial message
  const msg = await conn.sendMessage(m.chat, { 
    text: '🚀 *Calculando velocidad ultra...*' 
  });
  
  const firstResponse = Number(process.hrtime.bigint() - start) / 1000000;
  
  // Calculate system performance
  const memUsage = process.memoryUsage();
  const uptime = process.uptime();
  const cpuUsage = process.cpuUsage();
  
  const ping = firstResponse;
  const performance = ping < 50 ? 'BESTIAL 🔥' : ping < 100 ? 'GENIAL ⚡' : ping < 200 ? 'BUENA 👌' : 'MEJORABLE 📈';
  const speedEmoji = ping < 30 ? '🚀' : ping < 60 ? '⚡' : ping < 100 ? '🏃‍♂️' : '🚶‍♂️';
  
  const response = `
${speedEmoji} *SPEED TEST ULTRA* ${speedEmoji}

⚡ *Latencia:* ${ping.toFixed(2)}ms
🎯 *Performance:* ${performance}
📊 *Calidad:* ${ping < 25 ? 'ULTRA PREMIUM 💎' : ping < 50 ? 'PREMIUM ✨' : ping < 100 ? 'EXCELENTE 🌟' : 'ESTÁNDAR 📱'}

🔥 *ESTADÍSTICAS DEL SISTEMA:*
💾 *RAM:* ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB
⏱️ *Uptime:* ${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m
🖥️ *CPU:* ${Math.round((cpuUsage.user + cpuUsage.system) / 1000)}ms

${ping < 100 ? '🎮 ¡VELOCIDAD GAMER ACTIVADA!' : '⚡ ¡OPTIMIZANDO PARA MÁXIMA VELOCIDAD!'}
`.trim();

  await conn.sendMessage(m.chat, { 
    text: response,
    edit: msg.key
  });
}

export const help = ['ping', 'p', 'velocidad', 'speed', 'latencia'];
export const tags = ['info'];
export const command = /^(ping|p|velocidad|speed|latencia)$/i;