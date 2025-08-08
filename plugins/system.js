/**
 * Plugin de información del sistema
 * Comandos técnicos para monitoreo y diagnóstico
 */
import { execSync } from 'child_process';
import os from 'os';
import fs from 'fs';

export async function handler(m, { conn, usedPrefix, command, args }) {
  const start = Date.now();

  switch (command) {
    case 'status':
    case 'estado':
      await handleStatus(conn, m);
      break;
    
    case 'memory':
    case 'memoria':
      await handleMemory(conn, m);
      break;
      
    case 'cpu':
    case 'procesador':
      await handleCPU(conn, m);
      break;
      
    case 'disk':
    case 'disco':
      await handleDisk(conn, m);
      break;
      
    case 'network':
    case 'red':
      await handleNetwork(conn, m);
      break;
      
    case 'env':
    case 'entorno':
      await handleEnvironment(conn, m);
      break;
      
    case 'uptime':
    case 'tiempo':
      await handleUptime(conn, m);
      break;
  }
}

async function handleStatus(conn, m) {
  const uptime = process.uptime();
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  const status = `
🔧 *ESTADO DEL SISTEMA*

📊 *Rendimiento:*
• CPU: ${(cpuUsage.user / 1000000).toFixed(2)}s user / ${(cpuUsage.system / 1000000).toFixed(2)}s system
• Memoria: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB / ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB
• RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)} MB

⏱️ *Tiempo activo:* ${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s

🔌 *Plugins:* ${global.plugins ? Object.keys(global.plugins).length : 0} cargados
🗄️ *Base de datos:* ${global.db ? 'Conectada' : 'Desconectada'}
📱 *WhatsApp:* ${global.conn?.user ? 'Conectado' : 'Desconectado'}

💾 *Sistema:*
• Plataforma: ${process.platform}
• Arquitectura: ${process.arch}
• Node.js: ${process.version}
• PID: ${process.pid}
  `.trim();
  
  await conn.sendMessage(m.chat, { text: status });
}

async function handleMemory(conn, m) {
  const memUsage = process.memoryUsage();
  const systemMem = {
    total: os.totalmem(),
    free: os.freemem(),
    used: os.totalmem() - os.freemem()
  };
  
  const memory = `
💾 *INFORMACIÓN DE MEMORIA*

📊 *Proceso Node.js:*
• Heap usado: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB
• Heap total: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB
• RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)} MB
• External: ${(memUsage.external / 1024 / 1024).toFixed(2)} MB

🖥️ *Sistema:*
• Total: ${(systemMem.total / 1024 / 1024 / 1024).toFixed(2)} GB
• Usado: ${(systemMem.used / 1024 / 1024 / 1024).toFixed(2)} GB
• Libre: ${(systemMem.free / 1024 / 1024 / 1024).toFixed(2)} GB
• Uso: ${((systemMem.used / systemMem.total) * 100).toFixed(1)}%

📈 *Uso del heap:* ${((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(1)}%
  `.trim();
  
  await conn.sendMessage(m.chat, { text: memory });
}

async function handleCPU(conn, m) {
  const cpus = os.cpus();
  const loadAvg = os.loadavg();
  
  const cpu = `
⚡ *INFORMACIÓN DEL PROCESADOR*

🔧 *CPU:*
• Modelo: ${cpus[0].model}
• Núcleos: ${cpus.length}
• Velocidad: ${cpus[0].speed} MHz
• Arquitectura: ${process.arch}

📊 *Carga del sistema:*
• 1 min: ${loadAvg[0].toFixed(2)}
• 5 min: ${loadAvg[1].toFixed(2)}
• 15 min: ${loadAvg[2].toFixed(2)}

🖥️ *Plataforma:* ${os.type()} ${os.release()}
⏰ *Uptime del sistema:* ${Math.floor(os.uptime() / 3600)}h ${Math.floor((os.uptime() % 3600) / 60)}m
  `.trim();
  
  await conn.sendMessage(m.chat, { text: cpu });
}

async function handleDisk(conn, m) {
  let diskInfo = '';
  
  try {
    const stats = fs.statSync(process.cwd());
    diskInfo = `
💿 *INFORMACIÓN DEL DISCO*

📁 *Directorio actual:* ${process.cwd()}
📊 *Estadísticas:*
• Tamaño del bloque: ${stats.blksize || 'N/A'}
• Bloques: ${stats.blocks || 'N/A'}

🗂️ *Archivos del proyecto:*`;

    // Contar archivos
    const files = fs.readdirSync(process.cwd());
    diskInfo += `\n• Total archivos/carpetas: ${files.length}`;
    
    const jsFiles = files.filter(f => f.endsWith('.js')).length;
    const jsonFiles = files.filter(f => f.endsWith('.json')).length;
    
    diskInfo += `\n• Archivos JavaScript: ${jsFiles}`;
    diskInfo += `\n• Archivos JSON: ${jsonFiles}`;
    
  } catch (error) {
    diskInfo = `
💿 *INFORMACIÓN DEL DISCO*

❌ *Error obteniendo información del disco*
📁 *Directorio:* ${process.cwd()}
⚠️ *Motivo:* ${error.message}`;
  }
  
  await conn.sendMessage(m.chat, { text: diskInfo.trim() });
}

async function handleNetwork(conn, m) {
  const networkInterfaces = os.networkInterfaces();
  
  let network = `
🌐 *INFORMACIÓN DE RED*

🔗 *Interfaces de red:*`;

  for (const [name, addresses] of Object.entries(networkInterfaces)) {
    if (addresses) {
      network += `\n\n📡 *${name}:*`;
      addresses.forEach(addr => {
        if (!addr.internal) {
          network += `\n  • ${addr.family}: ${addr.address}`;
          if (addr.mac && addr.mac !== '00:00:00:00:00:00') {
            network += `\n  • MAC: ${addr.mac}`;
          }
        }
      });
    }
  }
  
  network += `\n\n🏠 *Hostname:* ${os.hostname()}`;
  
  await conn.sendMessage(m.chat, { text: network.trim() });
}

async function handleEnvironment(conn, m) {
  const safeEnvVars = [
    'NODE_ENV', 'PORT', 'PWD', 'HOME', 'USER', 'SHELL',
    'TERM', 'LANG', 'PATH', 'REPLIT', 'REPL_ID', 'REPL_SLUG'
  ];
  
  let env = `
🔧 *VARIABLES DE ENTORNO*

📋 *Variables seguras:*`;

  safeEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      let displayValue = value;
      if (varName === 'PATH') {
        displayValue = value.split(':').length + ' rutas configuradas';
      } else if (displayValue.length > 50) {
        displayValue = displayValue.substring(0, 47) + '...';
      }
      env += `\n• ${varName}: ${displayValue}`;
    }
  });
  
  env += `\n\n🔐 *Configuración del bot:*`;
  env += `\n• USE_PAIRING_CODE: ${process.env.USE_PAIRING_CODE || 'false'}`;
  env += `\n• DEBUG: ${process.env.DEBUG || 'false'}`;
  env += `\n• Total variables: ${Object.keys(process.env).length}`;
  
  await conn.sendMessage(m.chat, { text: env.trim() });
}

async function handleUptime(conn, m) {
  const processUptime = process.uptime();
  const systemUptime = os.uptime();
  
  const formatTime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    let result = '';
    if (days > 0) result += `${days}d `;
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0) result += `${minutes}m `;
    result += `${secs}s`;
    
    return result;
  };
  
  const uptime = `
⏰ *TIEMPO DE ACTIVIDAD*

🤖 *Bot (proceso):*
• Tiempo activo: ${formatTime(processUptime)}
• Iniciado: ${new Date(Date.now() - processUptime * 1000).toLocaleString('es-ES')}

🖥️ *Sistema:*
• Tiempo activo: ${formatTime(systemUptime)}
• Iniciado: ${new Date(Date.now() - systemUptime * 1000).toLocaleString('es-ES')}

📊 *Estadísticas:*
• Reinicios: ${global.restartCount || 0}
• PID: ${process.pid}
• Puerto HTTP: 5000
  `.trim();
  
  await conn.sendMessage(m.chat, { text: uptime });
}

export const help = ['status', 'memoria', 'cpu', 'disco', 'red', 'entorno', 'uptime'];
export const tags = ['system', 'info', 'tech'];
export const command = /^(status|estado|memory|memoria|cpu|procesador|disk|disco|network|red|env|entorno|uptime|tiempo)$/i;