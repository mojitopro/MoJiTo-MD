/**
 * Ultra-fast bot statistics and performance monitoring
 */

import { speedOptimizer, MemoryOptimizer } from '../core/speed-optimizer.js';

export async function handler(m, { conn, usedPrefix, command }) {
  const startTime = process.hrtime.bigint();
  
  const stats = speedOptimizer.getStats();
  const memoryUsage = MemoryOptimizer.getMemoryUsage();
  const systemUptime = process.uptime();
  
  const hours = Math.floor(systemUptime / 3600);
  const minutes = Math.floor((systemUptime % 3600) / 60);
  const seconds = Math.floor(systemUptime % 60);
  
  const plugins = Object.values(global.plugins || {}).filter(plugin => !plugin.disabled);
  const commandCount = plugins.map(plugin => plugin.help || []).flat().length;
  
  const responseTime = Number(process.hrtime.bigint() - startTime) / 1000000;
  
  const statsMessage = `
🚀 *MOJITO ULTRA - ESTADÍSTICAS* 🚀

⚡ *RENDIMIENTO:*
• Velocidad promedio: ${stats.avgResponseTime.toFixed(2)}ms
• Respuesta más rápida: ${stats.fastestResponse === Infinity ? 'N/A' : stats.fastestResponse.toFixed(2) + 'ms'}
• Respuesta más lenta: ${stats.slowestResponse.toFixed(2)}ms
• Comandos procesados: ${stats.totalCommands}

💾 *MEMORIA ULTRA OPTIMIZADA:*
• RAM usado: ${memoryUsage.heapUsed}MB
• RAM total: ${memoryUsage.heapTotal}MB
• Cache activo: ${stats.cacheSize} entradas
• Memoria externa: ${memoryUsage.external}MB

⏱️ *TIEMPO ACTIVO:*
• Uptime: ${hours}h ${minutes}m ${seconds}s
• Bot uptime: ${Math.floor(stats.uptime / 1000 / 60)}min
• Última reinicialización: Hace ${Math.floor(stats.uptime / 1000)}s

🎮 *FUNCIONALIDADES:*
• Plugins activos: ${plugins.length}
• Comandos disponibles: ${commandCount}+
• Grupos soportados: ∞
• Respuestas automáticas: Activas

🔥 *OPTIMIZACIONES ACTIVAS:*
• Sistema de cache ultra rápido
• Procesamiento paralelo de mensajes
• Optimización específica para grupos
• Limpieza automática de memoria
• Respuestas pre-compiladas

⚡ Stats generados en ${responseTime.toFixed(2)}ms
💎 Sistema funcionando al máximo rendimiento

*MoJiTo Ultra Bot - La velocidad hecha realidad* 🌟
`.trim();

  await conn.sendMessage(m.chat, { text: statsMessage });
}

export const help = ['stats', 'estadisticas', 'rendimiento', 'info', 'bot'];
export const tags = ['info', 'system'];
export const command = /^(stats|estadisticas|rendimiento|info|bot)$/i;