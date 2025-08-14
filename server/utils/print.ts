import chalk from 'chalk';
import gradient from 'gradient-string';
import cfonts from 'cfonts';

interface PrintOptions {
  timestamp?: boolean;
  color?: 'green' | 'blue' | 'yellow' | 'red' | 'magenta' | 'cyan' | 'white';
  prefix?: string;
  symbol?: string;
}

class MoJiToPrint {
  private formatTimestamp(): string {
    const now = new Date();
    const date = now.toLocaleDateString('es-ES');
    const time = now.toLocaleTimeString('es-ES', { hour12: false });
    return chalk.gray(`[${date} ${time}]`);
  }

  private formatMessage(message: string, options: PrintOptions = {}): string {
    const { timestamp = true, color = 'white', prefix, symbol } = options;
    
    let formatted = '';
    
    if (timestamp) {
      formatted += this.formatTimestamp() + ' ';
    }
    
    if (symbol) {
      formatted += chalk[color](symbol) + ' ';
    }
    
    if (prefix) {
      formatted += chalk[color].bold(`[${prefix}]`) + ' ';
    }
    
    formatted += chalk[color](message);
    
    return formatted;
  }

  // Banner original de MoJiTo-MD estilo consola tecnológica  
  banner(): void {
    // Separador visual superior
    console.log(gradient.pastel('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    
    // Logo ASCII simple y compatible
    const logo = `
        ███╗   ███╗  ██████╗       ██╗ ██╗ ████████╗  ██████╗ 
        ████╗ ████║ ██╔═══██╗      ██║ ██║ ╚══██╔══╝ ██╔═══██╗
        ██╔████╔██║ ██║   ██║      ██║ ██║    ██║    ██║   ██║
        ██║╚██╔╝██║ ██║   ██║ ██   ██║ ██║    ██║    ██║   ██║
        ██║ ╚═╝ ██║ ╚██████╔╝ ╚█████╔╝ ██║    ██║    ╚██████╔╝
        ╚═╝     ╚═╝  ╚═════╝   ╚════╝  ╚═╝    ╚═╝     ╚═════╝`;

    console.log(gradient.pastel(logo));
    console.log(chalk.magenta.bold('\n                    whatsapp bot md'));
    console.log(chalk.cyan('🔮 Bot creado por Brian Martins'));
    console.log(gradient.atlas('💻 Terminal operativa - Bot ejecutándose...\n'));
    console.log(gradient.pastel('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

    // Banner principal estilo cartel/marcador
    cfonts.say('© MoJiTo', {
      font: 'block',
      align: 'center',
      colors: ['red', 'magenta'],
      background: 'transparent',
      letterSpacing: 1,
      lineHeight: 1,
      space: true,
      maxLength: '0'
    });

    // Subtítulo técnico
    cfonts.say('WhatsApp Bot MD', {
      font: 'console',
      align: 'center',
      colors: ['cyan'],
      space: false
    });

    console.log(chalk.magenta.bold('\n🔮 Bot creado por Brian Martins'));
    console.log(gradient.atlas('💻 Terminal operativa - Bot ejecutándose...\n'));
    console.log(gradient.pastel('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
  }

  // Métodos principales de logging al estilo MoJiTo original
  info(message: string, prefix?: string): void {
    console.log(chalk.cyan('🔧 ' + message));
  }

  success(message: string, prefix?: string): void {
    console.log(chalk.green('▣─────────────────────────────···\n│\n│❧ ' + message + ' ✅\n│\n▣─────────────────────────────···'));
  }

  warn(message: string, prefix?: string): void {
    console.log(chalk.yellow(`⚠️ [WARNING] ${message}`));
  }

  error(message: string, prefix?: string): void {
    console.log(chalk.red(`❌ [ERROR] ${message}`));
  }

  debug(message: string, prefix?: string): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(chalk.magenta(`🐛 [DEBUG] ${message}`));
    }
  }

  // Conexión de WhatsApp al estilo original
  connection(message: string, status: 'connecting' | 'connected' | 'disconnected' | 'error'): void {
    if (status === 'connected') {
      console.log(chalk.yellow('▣─────────────────────────────···\n│\n│❧ 𝙲𝙾𝙽𝙴𝙲𝚃𝙰𝙳𝙾 𝙲𝙾𝚁𝚁𝙴𝙲𝚃𝙰𝙼𝙴𝙽𝚃𝙴 𝙰𝙻 𝚆𝙷𝙰𝚃𝚂𝙰𝙿𝙿 ✅\n│\n▣─────────────────────────────···'));
    } else if (status === 'connecting') {
      console.log(chalk.blueBright('🔄 Conectando a WhatsApp...'));
    } else if (status === 'disconnected') {
      console.log(chalk.redBright('[❌ Desconectado de WhatsApp]'));
    } else if (status === 'error') {
      console.log(chalk.redBright(`[❌ Error de conexión] ${message}`));
    }
  }

  // QR Code display al estilo original
  qr(qrCode: string): void {
    console.log('\nEscanea este código QR en tu WhatsApp para conectar:\n');
    console.log(qrCode);
  }

  // Plugin loading estilo original
  pluginLoaded(plugins: string[]): void {
    const total = plugins.length;
    const columns = 3;
    const columnWidth = 30;

    console.log(chalk.bold.cyanBright('\n╭━━━[ ✅ Plugins cargados ]━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(chalk.bold(`┃  ${chalk.magenta('Total:')} ${chalk.blueBright(total)} plugins\n`));

    for (let i = 0; i < total; i += columns) {
      const row = plugins
        .slice(i, i + columns)
        .map(name => `${chalk.magenta('┗━▶')} ${chalk.greenBright(name.padEnd(columnWidth))}`)
        .join(' ');
      console.log(chalk.bold('┃ ') + row);
    }

    console.log(chalk.bold.cyanBright('╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
  }

  // Auto clear tmp al estilo original
  clearTmp(): void {
    console.log(chalk.cyanBright(`\n▣────────[ AUTOCLEARTMP ]───────────···\n│\n▣─❧ ARCHIVOS ELIMINADOS ✅\n│\n▣────────────────────────────────────···\n`));
  }

  // Command execution logging
  command(message: string, command: string, user: string): void {
    console.log(chalk.green(`⚡ [COMMAND] ${user} ejecutó: ${command} - ${message}`));
  }

  // Plugin messages
  plugin(message: string, pluginName: string): void {
    console.log(chalk.magenta(`🧩 [PLUGIN] [${pluginName}] ${message}`));
  }

  // Download messages
  download(message: string, type: string): void {
    console.log(chalk.blue(`📥 [DOWNLOAD] [${type}] ${message}`));
  }

  // Compatibilidad con Baileys logger
  trace(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(chalk.white(`[TRACE] ${message} ${args.join(' ')}`));
    }
  }

  child(options: any): MoJiToPrint {
    return this;
  }
}

export const print = new MoJiToPrint();
export const logger = print; // Alias para compatibilidad