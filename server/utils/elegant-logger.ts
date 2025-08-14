import chalk from 'chalk';

export class ElegantLogger {
  private static instance: ElegantLogger;
  private startTime: number;
  private logCache: Set<string>;
  private lastLogTime: Map<string, number>;
  private logCount: Map<string, number>;

  private constructor() {
    this.startTime = Date.now();
    this.logCache = new Set();
    this.lastLogTime = new Map();
    this.logCount = new Map();
  }

  public static getInstance(): ElegantLogger {
    if (!ElegantLogger.instance) {
      ElegantLogger.instance = new ElegantLogger();
    }
    return ElegantLogger.instance;
  }

  public logApiRequest(method: string, path: string, statusCode: number, duration: number) {
    const logKey = `${method}-${path}`;
    const now = Date.now();
    
    // Solo mostrar logs de API cada 30 segundos para rutas repetitivas
    const lastLog = this.lastLogTime.get(logKey) || 0;
    const timeSinceLastLog = now - lastLog;
    
    // Rutas que queremos mostrar con menos frecuencia
    const quietRoutes = ['/api/bot/status', '/api/system/info', '/api/activity'];
    const isQuietRoute = quietRoutes.some(route => path.includes(route));
    
    if (isQuietRoute && timeSinceLastLog < 30000) {
      // Contar cuántas veces se ha hecho la petición
      const count = this.logCount.get(logKey) || 0;
      this.logCount.set(logKey, count + 1);
      return;
    }
    
    // Resetear contador y actualizar tiempo
    this.lastLogTime.set(logKey, now);
    const count = this.logCount.get(logKey) || 0;
    this.logCount.set(logKey, 0);
    
    const statusIcon = statusCode < 300 ? '🟢' : statusCode < 400 ? '🟡' : '🔴';
    const timeIcon = duration < 10 ? '⚡' : duration < 50 ? '🔹' : '🔸';
    
    // Formatear path más elegante
    const cleanPath = path.replace('/api/', '').replace(/\//g, ' › ');
    const methodFormatted = method.padEnd(4);
    
    let logLine = `│ ${statusIcon} ${chalk.dim(methodFormatted)} ${chalk.cyan(cleanPath)} ${chalk.gray(timeIcon + duration + 'ms')}`;
    
    // Si hubo peticiones silenciadas, mostrar contador
    if (count > 0) {
      logLine += chalk.gray(` (+${count} más)`);
    }
    
    console.log(logLine);
  }

  public logServerStatus() {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    const uptimeStr = this.formatUptime(uptime);
    
    console.log(`┌─────────────────────────────────────────────────┐`);
    console.log(`│ 🌐 ${chalk.bold.green('MoJiTo-MD Dashboard Activo')}             │`);
    console.log(`│ ⏱️  Tiempo activo: ${chalk.yellow(uptimeStr).padEnd(20)} │`);
    console.log(`│ 🔗 Puerto: ${chalk.cyan('5000')}                          │`);
    console.log(`└─────────────────────────────────────────────────┘`);
  }

  public logBotConnection(connected: boolean, groups: number = 0, messages: number = 0) {
    const status = connected ? chalk.green('🟢 Conectado') : chalk.red('🔴 Desconectado');
    
    console.log(`▣─────────────────────────────···`);
    console.log(`│`);
    console.log(`│❧ ${status} a WhatsApp`);
    console.log(`│📊 Grupos: ${chalk.yellow(groups)} | Mensajes: ${chalk.blue(messages)}`);
    console.log(`│`);
    console.log(`▣─────────────────────────────···`);
  }

  private formatUptime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  public separator() {
    console.log(`│ ${chalk.dim('─'.repeat(45))}`);
  }
}

export const elegantLogger = ElegantLogger.getInstance();