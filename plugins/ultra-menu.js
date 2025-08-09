/**
 * Ultra-fast menu with modern youth style
 */

export async function handler(m, { conn, usedPrefix, command, args }) {
  const start = process.hrtime.bigint();
  
  const who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.fromMe ? conn.user.jid : m.sender;
  const name = conn.getName(who) || 'Champion';
  
  // Get current stats
  const plugins = Object.values(global.plugins || {}).filter(plugin => !plugin.disabled);
  const commandCount = plugins.map(plugin => plugin.help || []).flat().length;
  const responseTime = Number(process.hrtime.bigint() - start) / 1000000;
  
  const hora = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const fecha = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  
  const menu = `
🎮 *MOJITO BOT - MENU ULTRA* 🚀

👋 ¡Ey ${name}! Bienvenido al futuro
📅 ${fecha} | 🕐 ${hora}
⚡ Respuesta: ${responseTime.toFixed(1)}ms

┏━━━━━━━━━━━━━━━━━━━━━┓
┃  🔥 *COMANDOS ULTRA RÁPIDOS* 🔥  ┃
┗━━━━━━━━━━━━━━━━━━━━━┛

🚀 *VELOCIDAD & INFO:*
│ ${usedPrefix}ping - Test ultra de velocidad
│ ${usedPrefix}info - Info completa del bot
│ ${usedPrefix}bot - Estado del sistema
│ ${usedPrefix}stats - Estadísticas en vivo

👥 *GRUPOS - PODER TOTAL:*
│ ${usedPrefix}todos - Mencionar a todos 
│ ${usedPrefix}kick @user - Expulsar miembro
│ ${usedPrefix}promote @user - Dar admin
│ ${usedPrefix}demote @user - Quitar admin
│ ${usedPrefix}grupo abrir/cerrar - Control total

🎯 *DIVERSIÓN ÉPICA:*
│ ${usedPrefix}meme - Memes frescos
│ ${usedPrefix}dado - Tirar dados
│ ${usedPrefix}coin - Cara o cruz
│ ${usedPrefix}random - Número random
│ ${usedPrefix}broma - Bromas geniales

🎨 *MEDIA & STICKERS:*
│ ${usedPrefix}s - Crear sticker épico
│ ${usedPrefix}toimg - Sticker a imagen
│ ${usedPrefix}attp texto - Sticker de texto
│ ${usedPrefix}ttp texto - Texto a imagen

🤖 *IA ULTRA INTELIGENTE:*
│ ${usedPrefix}ai pregunta - Chat con IA
│ ${usedPrefix}gpt pregunta - GPT avanzado
│ ${usedPrefix}img descripción - Generar imagen
│ ${usedPrefix}traducir texto - Traductor

🛠️ *HERRAMIENTAS PRO:*
│ ${usedPrefix}clima ciudad - Clima actual
│ ${usedPrefix}calc operación - Calculadora
│ ${usedPrefix}acortar url - Acortar links
│ ${usedPrefix}qr texto - Generar QR

┏━━━━━━━━━━━━━━━━━━━━━┓
┃  💎 *ESTADÍSTICAS ULTRA* 💎  ┃
┗━━━━━━━━━━━━━━━━━━━━━┛

⚡ Comandos disponibles: ${commandCount}+
🔥 Velocidad promedio: <50ms
🎯 Precisión: 99.9%
💎 Optimizado para Termux

🌟 *¡ÚSAME Y ALUCINA CON LA VELOCIDAD!* 🌟

*MoJiTo Ultra Bot - La revolución en WhatsApp* 🚀
`.trim();

  await conn.sendMessage(m.chat, { 
    text: menu,
    contextInfo: {
      externalAdReply: {
        title: '🚀 MoJiTo Ultra Bot',
        body: '⚡ El bot más rápido del universo',
        thumbnailUrl: 'https://i.imgur.com/wCEQHGF.jpeg',
        sourceUrl: 'https://github.com/mojito-ultra-bot',
        mediaType: 1,
        renderLargerThumbnail: true
      }
    }
  });
}

export const help = ['menu', 'help', 'ayuda', 'comandos', 'inicio'];
export const tags = ['main'];
export const command = /^(menu|help|ayuda|comandos|inicio|\?)$/i;