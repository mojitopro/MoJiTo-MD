/**
 * Plugin de información del sistema
 * Comandos técnicos para monitoreo y diagnóstico
 * Compatible con Termux y todos los entornos
 */
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
  try {
    const uptime = process.uptime();
    const memUsage = process.memoryUsage();
    
    // Safe CPU usage (might not be available in all environments)
    let cpuInfo = '';
    try {
      const cpuUsage = process.cpuUsage();
      cpuInfo = `• CPU: ${(cpuUsage.user / 1000000).toFixed(2)}s user / ${(cpuUsage.system / 1000000).toFixed(2)}s system`;
    } catch {
      cpuInfo = '• CPU: No disponible en este entorno';
    }
    
    const status = `
🔧 *ESTADO DEL SISTEMA*

📊 *Rendimiento:*
${cpuInfo}
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
• Entorno: ${isTermux() ? 'Termux' : 'Estándar'}
    `.trim();
    
    await conn.sendMessage(m.chat, { text: status });
  } catch (error) {
    await conn.sendMessage(m.chat, { text: '❌ Error obteniendo estado del sistema' });
  }
}

async function handleMemory(conn, m) {
  try {
    const memUsage = process.memoryUsage();
    
    let systemMemInfo = '';
    try {
      // Try to get system memory info (may not work in Termux)
      const systemMem = await getSystemMemory();
      if (systemMem) {
        systemMemInfo = `
🖥️ *Sistema:*
• Total: ${(systemMem.total / 1024 / 1024 / 1024).toFixed(2)} GB
• Usado: ${(systemMem.used / 1024 / 1024 / 1024).toFixed(2)} GB
• Libre: ${(systemMem.free / 1024 / 1024 / 1024).toFixed(2)} GB
• Uso: ${((systemMem.used / systemMem.total) * 100).toFixed(1)}%`;
      } else {
        systemMemInfo = `
🖥️ *Sistema:*
• Información no disponible en ${isTermux() ? 'Termux' : 'este entorno'}`;
      }
    } catch {
      systemMemInfo = `
🖥️ *Sistema:*
• Información no disponible en este entorno`;
    }
    
    const memory = `
💾 *INFORMACIÓN DE MEMORIA*

📊 *Proceso Node.js:*
• Heap usado: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB
• Heap total: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB
• RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)} MB
• External: ${(memUsage.external / 1024 / 1024).toFixed(2)} MB${systemMemInfo}

📈 *Uso del heap:* ${((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(1)}%
    `.trim();
    
    await conn.sendMessage(m.chat, { text: memory });
  } catch (error) {
    await conn.sendMessage(m.chat, { text: '❌ Error obteniendo información de memoria' });
  }
}

async function handleCPU(conn, m) {
  try {
    let cpuInfo = '';
    let loadInfo = '';
    let systemInfo = '';
    
    // Try to get CPU info
    try {
      const cpuData = await getCPUInfo();
      if (cpuData) {
        cpuInfo = `🔧 *CPU:*
• Modelo: ${cpuData.model}
• Núcleos: ${cpuData.cores}
• Velocidad: ${cpuData.speed} MHz
• Arquitectura: ${process.arch}`;
      } else {
        cpuInfo = `🔧 *CPU:*
• Arquitectura: ${process.arch}
• Información detallada no disponible`;
      }
    } catch {
      cpuInfo = `🔧 *CPU:*
• Arquitectura: ${process.arch}
• Información no disponible en este entorno`;
    }
    
    // Try to get load average
    try {
      const load = await getLoadAverage();
      if (load) {
        loadInfo = `
📊 *Carga del sistema:*
• 1 min: ${load[0].toFixed(2)}
• 5 min: ${load[1].toFixed(2)}
• 15 min: ${load[2].toFixed(2)}`;
      } else {
        loadInfo = `
📊 *Carga del sistema:*
• No disponible en ${isTermux() ? 'Termux' : 'este entorno'}`;
      }
    } catch {
      loadInfo = `
📊 *Carga del sistema:*
• No disponible en este entorno`;
    }
    
    // Try to get system info
    try {
      const sysInfo = await getSystemInfo();
      if (sysInfo) {
        systemInfo = `
🖥️ *Sistema:*
• Plataforma: ${sysInfo.type} ${sysInfo.release}
• Uptime: ${sysInfo.uptime}`;
      } else {
        systemInfo = `
🖥️ *Sistema:*
• Plataforma: ${process.platform}
• Información extendida no disponible`;
      }
    } catch {
      systemInfo = `
🖥️ *Sistema:*
• Plataforma: ${process.platform}
• Información no disponible en este entorno`;
    }
    
    const cpu = `
⚡ *INFORMACIÓN DEL PROCESADOR*

${cpuInfo}${loadInfo}${systemInfo}
    `.trim();
    
    await conn.sendMessage(m.chat, { text: cpu });
  } catch (error) {
    await conn.sendMessage(m.chat, { text: '❌ Error obteniendo información del procesador' });
  }
}

async function handleDisk(conn, m) {
  let diskInfo = '';
  
  try {
    const currentDir = process.cwd();
    diskInfo = `
💿 *INFORMACIÓN DEL DISCO*

📁 *Directorio actual:* ${currentDir}`;
    
    // Safe stats - might not work in all environments
    try {
      const stats = fs.statSync(currentDir);
      if (stats.blksize || stats.blocks) {
        diskInfo += `
📊 *Estadísticas:*
• Tamaño del bloque: ${stats.blksize || 'N/A'}
• Bloques: ${stats.blocks || 'N/A'}`;
      }
    } catch {
      // Stats not available in this environment
    }
    
    // Count files - this should work everywhere
    try {
      const files = fs.readdirSync(currentDir);
      diskInfo += `

🗂️ *Archivos del proyecto:*
• Total archivos/carpetas: ${files.length}`;
      
      const jsFiles = files.filter(f => f.endsWith('.js')).length;
      const jsonFiles = files.filter(f => f.endsWith('.json')).length;
      const mdFiles = files.filter(f => f.endsWith('.md')).length;
      
      diskInfo += `
• Archivos JavaScript: ${jsFiles}`;
      diskInfo += `
• Archivos JSON: ${jsonFiles}`;
      diskInfo += `
• Archivos Markdown: ${mdFiles}`;
      
      // Check for important directories
      const dirs = files.filter(f => {
        try {
          return fs.statSync(f).isDirectory();
        } catch {
          return false;
        }
      });
      diskInfo += `
• Directorios: ${dirs.length}`;
      
    } catch (error) {
      diskInfo += `

⚠️ *No se pudo leer el directorio*
• Error: ${error.message}`;
    }
    
    // Check available space if possible
    try {
      const spaceInfo = await getDiskSpace();
      if (spaceInfo) {
        diskInfo += `

💾 *Espacio disponible:*
• ${spaceInfo}`;
      }
    } catch {
      diskInfo += `

💾 *Espacio:* No disponible en ${isTermux() ? 'Termux' : 'este entorno'}`;
    }
    
  } catch (error) {
    diskInfo = `
💿 *INFORMACIÓN DEL DISCO*

❌ *Error obteniendo información*
📁 *Directorio:* ${process.cwd()}
⚠️ *Motivo:* ${error.message}`;
  }
  
  await conn.sendMessage(m.chat, { text: diskInfo.trim() });
}
}

async function handleNetwork(conn, m) {
  let network = `
🌐 *INFORMACIÓN DE RED*
`;
  
  try {
    // Try to get network interfaces (may not work in Termux)
    const networkInfo = await getNetworkInfo();
    
    if (networkInfo && networkInfo.interfaces) {
      network += `
🔗 *Interfaces de red:*`;
      
      for (const [name, addresses] of Object.entries(networkInfo.interfaces)) {
        if (addresses && addresses.length > 0) {
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
    } else {
      network += `
🔗 *Interfaces de red:*
• No disponible en ${isTermux() ? 'Termux' : 'este entorno'}`;
    }
    
    // Try to get hostname
    try {
      const hostname = await getHostname();
      network += `\n\n🏠 *Hostname:* ${hostname || 'No disponible'}`;
    } catch {
      network += `\n\n🏠 *Hostname:* No disponible`;
    }
    
    // Add connection status
    network += `\n\n📱 *Estado de conexión:*`;
    network += `\n• WhatsApp: ${global.conn?.isConnected ? 'Conectado' : 'Desconectado'}`;
    network += `\n• Bot: ${global.conn?.user ? 'Activo' : 'Inactivo'}`;
    
  } catch (error) {
    network = `
🌐 *INFORMACIÓN DE RED*

❌ *Error obteniendo información de red*
⚠️ *Entorno:* ${isTermux() ? 'Termux (limitado)' : 'Limitado'}

📱 *Estado básico:*
• WhatsApp: ${global.conn?.isConnected ? 'Conectado' : 'Desconectado'}`;
  }
  
  await conn.sendMessage(m.chat, { text: network.trim() });
}
}

async function handleEnvironment(conn, m) {
  try {
    const safeEnvVars = [
      'NODE_ENV', 'PORT', 'PWD', 'HOME', 'USER', 'SHELL',
      'TERM', 'LANG', 'PATH', 'REPLIT', 'REPL_ID', 'REPL_SLUG',
      'TERMUX_VERSION', 'PREFIX' // Termux specific
    ];
    
    let env = `
🔧 *VARIABLES DE ENTORNO*

📋 *Entorno detectado:* ${isTermux() ? 'Termux' : 'Estándar'}`;
    
    if (isTermux()) {
      env += `
🤖 *Termux detectado:* Modo compatible activado`;
    }
    
    env += `

📋 *Variables disponibles:*`;

    safeEnvVars.forEach(varName => {
      const value = process.env[varName];
      if (value) {
        let displayValue = value;
        if (varName === 'PATH') {
          const pathCount = value.split(':').length;
          displayValue = `${pathCount} rutas configuradas`;
        } else if (displayValue.length > 50) {
          displayValue = displayValue.substring(0, 47) + '...';
        }
        env += `\n• ${varName}: ${displayValue}`;
      }
    });
    
    env += `\n\n🔐 *Configuración del bot:*`;
    env += `\n• USE_PAIRING_CODE: ${process.env.USE_PAIRING_CODE || 'false'}`;
    env += `\n• DEBUG: ${process.env.DEBUG || 'false'}`;
    env += `\n• PHONE_NUMBER: ${process.env.PHONE_NUMBER ? 'Configurado' : 'No configurado'}`;
    env += `\n• Total variables: ${Object.keys(process.env).length}`;
    
    // Add runtime info
    env += `\n\n⚙️ *Runtime:*`;
    env += `\n• Node.js: ${process.version}`;
    env += `\n• Plataforma: ${process.platform}`;
    env += `\n• PID: ${process.pid}`;
    env += `\n• Directorio: ${process.cwd().split('/').pop()}`;
    
    await conn.sendMessage(m.chat, { text: env.trim() });
  } catch (error) {
    await conn.sendMessage(m.chat, { text: '❌ Error obteniendo información del entorno' });
  }
}

async function handleUptime(conn, m) {
  try {
    const processUptime = process.uptime();
    
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
    
    let uptime = `
⏰ *TIEMPO DE ACTIVIDAD*

🤖 *Bot (proceso):*
• Tiempo activo: ${formatTime(processUptime)}
• Iniciado: ${new Date(Date.now() - processUptime * 1000).toLocaleString('es-ES')}`;
    
    // Try to get system uptime (may not work in Termux)
    try {
      const systemUptime = await getSystemUptime();
      if (systemUptime !== null) {
        uptime += `

🖥️ *Sistema:*
• Tiempo activo: ${formatTime(systemUptime)}
• Iniciado: ${new Date(Date.now() - systemUptime * 1000).toLocaleString('es-ES')}`;
      } else {
        uptime += `

🖥️ *Sistema:*
• Uptime no disponible en ${isTermux() ? 'Termux' : 'este entorno'}`;
      }
    } catch {
      uptime += `

🖥️ *Sistema:*
• Uptime no disponible`;
    }
    
    uptime += `

📊 *Estadísticas:*
• Reinicios: ${global.restartCount || 0}
• PID: ${process.pid}
• Puerto HTTP: 5000
• Entorno: ${isTermux() ? 'Termux' : 'Estándar'}`;
    
    // Add connection stats
    if (global.conn?.user) {
      uptime += `
• Usuario: ${global.conn.user.name || 'Bot'}
• WhatsApp ID: ${global.conn.user.id.split('@')[0]}`;
    }
    
    await conn.sendMessage(m.chat, { text: uptime.trim() });
  } catch (error) {
    await conn.sendMessage(m.chat, { text: '❌ Error obteniendo información de uptime' });
  }
}

// Utility functions for cross-platform compatibility
function isTermux() {
  return process.env.TERMUX_VERSION !== undefined || 
         process.env.PREFIX?.includes('com.termux') ||
         process.platform === 'android';
}

async function getSystemMemory() {
  try {
    // Try using Node.js os module
    const os = await import('os').catch(() => null);
    if (os) {
      return {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem()
      };
    }
  } catch {
    // Fallback methods could go here
  }
  return null;
}

async function getCPUInfo() {
  try {
    const os = await import('os').catch(() => null);
    if (os && os.cpus) {
      const cpus = os.cpus();
      if (cpus && cpus.length > 0) {
        return {
          model: cpus[0].model,
          cores: cpus.length,
          speed: cpus[0].speed
        };
      }
    }
  } catch {
    // CPU info not available
  }
  return null;
}

async function getLoadAverage() {
  try {
    const os = await import('os').catch(() => null);
    if (os && os.loadavg) {
      return os.loadavg();
    }
  } catch {
    // Load average not available
  }
  return null;
}

async function getSystemInfo() {
  try {
    const os = await import('os').catch(() => null);
    if (os) {
      const uptime = os.uptime ? os.uptime() : null;
      return {
        type: os.type ? os.type() : 'Unknown',
        release: os.release ? os.release() : 'Unknown',
        uptime: uptime ? `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m` : 'No disponible'
      };
    }
  } catch {
    // System info not available
  }
  return null;
}

async function getNetworkInfo() {
  try {
    const os = await import('os').catch(() => null);
    if (os && os.networkInterfaces) {
      return {
        interfaces: os.networkInterfaces()
      };
    }
  } catch {
    // Network info not available
  }
  return null;
}

async function getHostname() {
  try {
    const os = await import('os').catch(() => null);
    if (os && os.hostname) {
      return os.hostname();
    }
  } catch {
    // Hostname not available
  }
  return process.env.HOSTNAME || 'localhost';
}

async function getSystemUptime() {
  try {
    const os = await import('os').catch(() => null);
    if (os && os.uptime) {
      return os.uptime();
    }
  } catch {
    // System uptime not available
  }
  return null;
}

async function getDiskSpace() {
  try {
    // This would require platform-specific implementations
    // For now, return null to indicate not available
    return null;
  } catch {
    return null;
  }
}

export const help = ['status', 'memoria', 'cpu', 'disco', 'red', 'entorno', 'uptime'];
export const tags = ['system', 'info', 'tech'];
export const command = /^(status|estado|memory|memoria|cpu|procesador|disk|disco|network|red|env|entorno|uptime|tiempo)$/i;