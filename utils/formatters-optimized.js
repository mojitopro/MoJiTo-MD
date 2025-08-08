/**
 * OPTIMIZED Display Formatters
 * Enhanced formatters for terminal output and QR/pairing code display
 */
import chalk from 'chalk';
import cfonts from 'cfonts';
import gradient from 'gradient-string';
import qrcode from 'qrcode-terminal';
import { logger } from '../services/logger.js';

/**
 * Display startup banner with enhanced formatting
 */
export async function startupDisplay() {
  console.clear();
  
  // Simple title
  cfonts.say('MOJITO-MD', {
    font: 'simple',
    align: 'center',
    colors: ['cyan'],
    background: 'transparent',
    letterSpacing: 1,
    lineHeight: 1,
    space: false,
    maxLength: '0'
  });
  
  // Minimal info
  console.log(chalk.gray('═'.repeat(50)));
  console.log(chalk.cyan('🤖 WhatsApp Bot - Brian Martins'));
  console.log(chalk.gray('═'.repeat(50)));
  console.log();
}

/**
 * Display QR code with enhanced formatting
 */
export async function displayQR(qrData) {
  try {
    // Generate and display QR code
    qrcode.generate(qrData, { small: true }, (qrString) => {
      console.log(qrString);
    });
    
    // Display instructions
    console.log(chalk.yellow('📱 Escanea este código QR con WhatsApp'));
    console.log(chalk.gray('   1. Abre WhatsApp en tu teléfono'));
    console.log(chalk.gray('   2. Ve a Configuración > Dispositivos vinculados'));
    console.log(chalk.gray('   3. Toca "Vincular un dispositivo"'));
    console.log(chalk.gray('   4. Escanea este código QR'));
    
  } catch (error) {
    logger.error('Error displaying QR code:', error.message);
  }
}

/**
 * Display pairing code with enhanced formatting
 */
export async function displayPairingCode(code, phoneNumber = '') {
  try {
    // Create a highlighted box for the pairing code
    const codeBox = [
      '╔' + '═'.repeat(50) + '╗',
      `║ 🔐 CÓDIGO DE EMPAREJAMIENTO WHATSAPP${' '.repeat(8)}║`,
      '╠' + '═'.repeat(50) + '╣',
      `║ 📱 TELÉFONO: +${phoneNumber}${' '.repeat(50 - phoneNumber.length - 13)}║`,
      `║ 🔑 CÓDIGO: ${chalk.bold.green(code)}${' '.repeat(50 - code.length - 11)}║`,
      '╚' + '═'.repeat(50) + '╝'
    ];
    
    console.log();
    codeBox.forEach(line => {
      console.log(chalk.cyan(line));
    });
    
    // Instructions
    console.log();
    console.log(chalk.yellow('📋 INSTRUCCIONES:'));
    console.log(chalk.gray('   1. Abre WhatsApp en tu teléfono'));
    console.log(chalk.gray('   2. Ve a Configuración > Dispositivos vinculados'));
    console.log(chalk.gray('   3. Toca "Vincular un dispositivo"'));
    console.log(chalk.gray('   4. Toca "Vincular con número de teléfono"'));
    console.log(chalk.gray(`   5. Ingresa este código: ${chalk.bold(code)}`));
    console.log();
    
  } catch (error) {
    logger.error('Error displaying pairing code:', error.message);
  }
}

/**
 * Display connection status
 */
export function displayConnectionStatus(isConnected, user = null) {
  const status = isConnected ? 
    chalk.green('✅ CONECTADO') : 
    chalk.red('❌ DESCONECTADO');
  
  console.log();
  console.log('━'.repeat(50));
  console.log(`📡 ESTADO: ${status}`);
  
  if (isConnected && user) {
    console.log(`👤 USUARIO: ${chalk.cyan(user.name || 'Unknown')}`);
    console.log(`🆔 ID: ${chalk.gray(user.id || 'Unknown')}`);
  }
  
  console.log('━'.repeat(50));
  console.log();
}

/**
 * Display error message with formatting
 */
export function displayError(message, details = null) {
  console.log();
  console.log(chalk.red('❌ ERROR: ') + chalk.white(message));
  
  if (details) {
    console.log(chalk.gray('   Detalles: ' + details));
  }
  
  console.log();
}

/**
 * Display success message with formatting
 */
export function displaySuccess(message, details = null) {
  console.log();
  console.log(chalk.green('✅ ÉXITO: ') + chalk.white(message));
  
  if (details) {
    console.log(chalk.gray('   ' + details));
  }
  
  console.log();
}

/**
 * Display warning message with formatting
 */
export function displayWarning(message, details = null) {
  console.log();
  console.log(chalk.yellow('⚠️  ADVERTENCIA: ') + chalk.white(message));
  
  if (details) {
    console.log(chalk.gray('   ' + details));
  }
  
  console.log();
}

/**
 * Display available commands
 */
export function displayCommands() {
  console.log();
  console.log(chalk.cyan('💡 COMANDOS DISPONIBLES:'));
  console.log(chalk.gray('   restart - Reiniciar el bot'));
  console.log(chalk.gray('   stop - Detener el bot'));
  console.log(chalk.gray('   status - Ver estado del bot'));
  console.log(chalk.gray('   clear - Limpiar consola'));
  console.log(chalk.gray('   qr - Mostrar código QR (si está disponible)'));
  console.log(chalk.gray('   pair <número> - Generar código de emparejamiento'));
  console.log();
}

/**
 * Format uptime display
 */
export function formatUptime(uptimeSeconds) {
  const days = Math.floor(uptimeSeconds / 86400);
  const hours = Math.floor((uptimeSeconds % 86400) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = Math.floor(uptimeSeconds % 60);
  
  let uptime = '';
  if (days > 0) uptime += `${days}d `;
  if (hours > 0) uptime += `${hours}h `;
  if (minutes > 0) uptime += `${minutes}m `;
  uptime += `${seconds}s`;
  
  return uptime;
}

/**
 * Display bot statistics
 */
export function displayStats(stats) {
  console.log();
  console.log(chalk.cyan('📊 ESTADÍSTICAS DEL BOT:'));
  console.log('━'.repeat(40));
  
  if (stats.uptime) {
    console.log(`⏱️  Tiempo activo: ${chalk.green(formatUptime(stats.uptime))}`);
  }
  
  if (stats.plugins !== undefined) {
    console.log(`🔌 Plugins: ${chalk.blue(stats.plugins)} cargados`);
  }
  
  if (stats.memory) {
    const memUsed = Math.round(stats.memory.used / 1024 / 1024);
    console.log(`💾 Memoria: ${chalk.yellow(memUsed + ' MB')}`);
  }
  
  if (stats.users !== undefined) {
    console.log(`👥 Usuarios: ${chalk.magenta(stats.users)} registrados`);
  }
  
  console.log('━'.repeat(40));
  console.log();
}