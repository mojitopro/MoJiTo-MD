
/**
 * Formatting utilities for terminal display
 * Enhanced QR code and pairing code handling
 */
import QRCode from 'qrcode';
import qrTerminal from 'qrcode-terminal';
import chalk from 'chalk';
import gradient from 'gradient-string';
import cfonts from 'cfonts';
import { logger } from '../services/logger.js';

/**
 * Display startup banner with enhanced formatting
 */
export async function startupDisplay() {
  try {
    console.clear();
    
    // Main banner
    cfonts.say('MoJiTo', {
      font: 'console',
      align: 'center',
      colors: ['cyan'],
      space: false
    });

    // Subtitle
    console.log(gradient.cristal('\n                                 whatsapp bot md\n'));
    console.log(gradient.atlas('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));

    // Credits and status
    console.log(chalk.magenta.bold('\n🔮 Bot creado por Brian Martins'));
    console.log(gradient.atlas('💻 Terminal operativa - Bot ejecutándose...\n'));
    console.log(gradient.pastel('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

  } catch (error) {
    logger.error('Error displaying startup banner:', error);
  }
}

/**
 * Display QR code for WhatsApp authentication with multiple methods
 */
export async function displayQR(qr) {
  try {
    console.log('\n' + chalk.yellow('━'.repeat(80)));
    console.log(chalk.cyan.bold('📱 CÓDIGO QR PARA WHATSAPP'));
    console.log(chalk.yellow('━'.repeat(80)));
    console.log(chalk.white('📋 Instrucciones:'));
    console.log(chalk.white('   1. Abre WhatsApp en tu teléfono'));
    console.log(chalk.white('   2. Ve a Menú (⋮) > Dispositivos vinculados'));
    console.log(chalk.white('   3. Toca "Vincular un dispositivo"'));
    console.log(chalk.white('   4. Escanea el código QR de abajo'));
    console.log(chalk.yellow('━'.repeat(80)));

    // Display QR code using qrcode-terminal (more reliable)
    console.log('\n');
    qrTerminal.generate(qr, { small: true }, (qrString) => {
      console.log(qrString);
    });

    // Also try with the qrcode library as fallback
    try {
      const qrString = await QRCode.toString(qr, {
        type: 'terminal',
        small: true,
        width: 60
      });
      console.log('\n' + chalk.gray('Código QR alternativo:'));
      console.log(qrString);
    } catch (qrError) {
      logger.debug('Alternative QR generation failed:', qrError);
    }

    console.log('\n' + chalk.yellow('━'.repeat(80)));
    console.log(chalk.green('⏳ Esperando conexión...'));
    console.log(chalk.yellow('━'.repeat(80)) + '\n');

    logger.info('QR code displayed successfully');

  } catch (error) {
    logger.error('Error displaying QR code:', error);
    console.log(chalk.red('❌ Error displaying QR code'));
    console.log(chalk.white('📱 Please scan the QR code manually from your WhatsApp app'));
  }
}

/**
 * Display pairing code with enhanced formatting and instructions
 */
export async function displayPairingCode(code) {
  try {
    console.log('\n' + chalk.green('━'.repeat(60)));
    console.log(chalk.cyan.bold('🔐 CÓDIGO DE EMPAREJAMIENTO WHATSAPP'));
    console.log(chalk.green('━'.repeat(60)));
    
    // Display the code in a prominent way
    console.log(chalk.yellow.bold(`📱 CÓDIGO: ${code}`));
    
    console.log(chalk.green('━'.repeat(60)));
    console.log(chalk.white.bold('📋 INSTRUCCIONES PASO A PASO:'));
    console.log(chalk.white('   1. 📱 Abre WhatsApp en tu teléfono'));
    console.log(chalk.white('   2. ⚙️  Ve a Configuración (Settings)'));
    console.log(chalk.white('   3. 🔗 Toca "Dispositivos vinculados" (Linked devices)'));
    console.log(chalk.white('   4. ➕ Toca "Vincular un dispositivo" (Link a device)'));
    console.log(chalk.white('   5. 📞 Toca "Vincular con número de teléfono"'));
    console.log(chalk.white('   6. 🔢 Ingresa este código de 8 dígitos:'));
    console.log(chalk.yellow.bold(`      >>> ${code} <<<`));
    console.log(chalk.green('━'.repeat(60)));
    
    // Display countdown or status
    console.log(chalk.magenta('⏳ El código es válido por 20 segundos aproximadamente'));
    console.log(chalk.cyan('🔄 Si expira, el sistema generará uno nuevo automáticamente'));
    console.log(chalk.green('⏳ Esperando confirmación del emparejamiento...'));
    console.log(chalk.green('━'.repeat(60)) + '\n');

    logger.info(`Pairing code displayed: ${code}`);

    // Set a timeout to remind user if connection takes too long
    setTimeout(() => {
      if (!global.conn?.isConnected) {
        console.log(chalk.yellow('\n⚠️  ¿Aún no conectado? Verifica que:'));
        console.log(chalk.white('   • El código sea ingresado correctamente'));
        console.log(chalk.white('   • Tu teléfono tenga conexión a internet'));
        console.log(chalk.white('   • WhatsApp esté actualizado\n'));
      }
    }, 30000);

  } catch (error) {
    logger.error('Error displaying pairing code:', error);
    console.log(chalk.red('❌ Error displaying pairing code'));
    console.log(chalk.yellow(`📱 Pairing Code: ${code}`));
    console.log(chalk.white('Please enter this code in WhatsApp > Settings > Linked devices'));
  }
}

/**
 * Format connection status messages with colors and icons
 */
export function formatConnectionStatus(status, extra = '') {
  const statusMap = {
    'connecting': {
      icon: '🔄',
      color: chalk.yellow,
      message: 'Conectando a WhatsApp...'
    },
    'connected': {
      icon: '✅',
      color: chalk.green,
      message: 'Conectado exitosamente a WhatsApp'
    },
    'disconnected': {
      icon: '❌',
      color: chalk.red,
      message: 'Desconectado de WhatsApp'
    },
    'reconnecting': {
      icon: '🔄',
      color: chalk.cyan,
      message: 'Reconectando a WhatsApp...'
    },
    'error': {
      icon: '⚠️',
      color: chalk.red,
      message: 'Error de conexión'
    }
  };

  const statusInfo = statusMap[status] || statusMap['error'];
  
  console.log('\n' + statusInfo.color.bold(
    `${statusInfo.icon} ${statusInfo.message} ${extra}`
  ));
}

/**
 * Format numbers for display (phone numbers, user counts, etc.)
 */
export function formatNumber(num) {
  return new Intl.NumberFormat('es-ES').format(num);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format time duration for display
 */
export function formatDuration(ms) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0) parts.push(`${seconds}s`);

  return parts.join(' ') || '0s';
}

/**
 * Display loading spinner with message
 */
export function displayLoading(message = 'Cargando...') {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  
  const spinner = setInterval(() => {
    process.stdout.write(`\r${chalk.cyan(frames[i])} ${chalk.white(message)}`);
    i = (i + 1) % frames.length;
  }, 100);
  
  return {
    stop: (finalMessage = '') => {
      clearInterval(spinner);
      if (finalMessage) {
        process.stdout.write(`\r${chalk.green('✓')} ${chalk.white(finalMessage)}\n`);
      } else {
        process.stdout.write('\r' + ' '.repeat(50) + '\r');
      }
    }
  };
}

/**
 * Format plugin loading status
 */
export function formatPluginStatus(plugins) {
  console.log(chalk.cyan('\n╭━━━[ ✅ Plugins Cargados ]━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.cyan(`┃  Total: ${plugins.length} plugins\n┃`));
  
  // Group plugins in rows of 3
  for (let i = 0; i < plugins.length; i += 3) {
    const row = plugins.slice(i, i + 3);
    const formattedRow = row.map(plugin => 
      chalk.green('✅ ' + plugin.padEnd(25))
    ).join('');
    console.log(chalk.cyan('┃ ') + formattedRow);
  }
  
  console.log(chalk.cyan('╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
}
