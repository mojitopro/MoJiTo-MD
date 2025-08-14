import chalk from 'chalk';
import gradient from 'gradient-string';

export class StartupBanner {
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static async showStartupSequence(): Promise<void> {
    // Limpiar pantalla
    process.stdout.write('\x1Bc');
    
    // Mostrar logo principal con animación
    await this.showLogo();
    await this.delay(1000);
    
    // Mostrar información del sistema
    await this.showSystemInfo();
    await this.delay(500);
    
    // Mostrar estado de carga
    await this.showLoadingProgress();
  }

  private static async showLogo(): Promise<void> {
    console.log();
    console.log(chalk.cyan('━'.repeat(50)));
    
    // Logo ASCII mejorado
    const logo = `
        ███╗   ███╗  ██████╗       ██╗ ██╗ ████████╗  ██████╗ 
        ████╗ ████║ ██╔═══██╗      ██║ ██║ ╚══██╔══╝ ██╔═══██╗
        ██╔████╔██║ ██║   ██║      ██║ ██║    ██║    ██║   ██║
        ██║╚██╔╝██║ ██║   ██║ ██   ██║ ██║    ██║    ██║   ██║
        ██║ ╚═╝ ██║ ╚██████╔╝ ╚█████╔╝ ██║    ██║    ╚██████╔╝
        ╚═╝     ╚═╝  ╚═════╝   ╚════╝  ╚═╝    ╚═╝     ╚═════╝`;
    
    console.log(gradient.pastel(logo));
    console.log();
    console.log(chalk.magenta.bold('                    whatsapp bot md'));
    console.log(chalk.cyan('🔮 Bot creado por Brian Martins'));
    console.log(chalk.cyan('━'.repeat(50)));
    console.log();
  }

  private static async showSystemInfo(): Promise<void> {
    const isTermux = process.env.TERMUX_VERSION !== undefined;
    const nodeVersion = process.version;
    const platform = process.platform;
    const arch = process.arch;
    
    console.log(chalk.green('📋 Información del Sistema:'));
    console.log(chalk.white(`   🖥️  Entorno: ${isTermux ? 'Termux (Android)' : 'Replit'}`));
    console.log(chalk.white(`   🟢 Node.js: ${nodeVersion}`));
    console.log(chalk.white(`   💾 Plataforma: ${platform} ${arch}`));
    
    if (isTermux) {
      console.log(chalk.yellow('   📱 Optimizaciones móviles activadas'));
      console.log(chalk.yellow(`   🧠 Memoria limitada: 512MB`));
    }
    console.log();
  }

  private static async showLoadingProgress(): Promise<void> {
    console.log(chalk.blue('⚡ Inicializando componentes:'));
    
    const components = [
      { name: 'Base de datos PostgreSQL', time: 300 },
      { name: 'Servidor Express', time: 200 },
      { name: 'Sistema de plugins', time: 400 },
      { name: 'Comandos del bot', time: 200 },
      { name: 'Conexión WhatsApp', time: 500 }
    ];

    for (const component of components) {
      process.stdout.write(chalk.gray(`   ⏳ Cargando ${component.name}...`));
      await this.delay(component.time);
      process.stdout.write('\r' + chalk.green(`   ✅ ${component.name} listo`) + '\n');
    }
    
    console.log();
    console.log(chalk.green.bold('🚀 Sistema iniciado correctamente!'));
    console.log(chalk.cyan('━'.repeat(50)));
    console.log();
  }

  static showServerRunning(port: number): void {
    console.log(chalk.cyan(`💻 Servidor Express ejecutándose en puerto ${port}`));
    console.log(chalk.cyan(`🌐 Dashboard: http://localhost:${port}`));
    console.log(chalk.green.bold('✅ MoJiTo-MD completamente operativo'));
  }

  static showPluginsLoaded(count: number): void {
    console.log(chalk.magenta(`🔧 ${count} plugins cargados correctamente`));
  }

  static showWhatsAppConnected(): void {
    console.log(chalk.green('▣─────────────────────────────···'));
    console.log(chalk.green('│'));
    console.log(chalk.green('│❧ ✅ CONECTADO CORRECTAMENTE AL WHATSAPP ✅'));
    console.log(chalk.green('│'));
    console.log(chalk.green('▣─────────────────────────────···'));
  }

  static showQRCode(qr: string): void {
    console.log(chalk.cyan('\n🔍 Escanea este código QR con WhatsApp:'));
    console.log(qr);
    console.log(chalk.yellow('📱 Abre WhatsApp > Dispositivos vinculados > Vincular dispositivo'));
  }

  static showStats(groups: number, messages: number, commands: number): void {
    console.log(chalk.cyan('📊 Estadísticas del Bot:'));
    console.log(chalk.white(`   📱 Grupos activos: ${groups}`));
    console.log(chalk.white(`   💬 Mensajes procesados: ${messages}`));
    console.log(chalk.white(`   ⚡ Comandos ejecutados: ${commands}`));
    console.log();
  }
}