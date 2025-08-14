import QRCode from 'qrcode';
import * as qrTerminal from 'qrcode-terminal';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

export class QRHandler {
  static async displayQR(qrString: string): Promise<void> {
    try {
      console.log(chalk.yellow('\n🔄 Conectando a WhatsApp...\n'));
      console.log(chalk.cyan('📱 Escanea este código QR con tu WhatsApp:'));
      
      // Use the native qrcode library to generate ASCII QR
      const qrAscii = await QRCode.toString(qrString, { 
        type: 'terminal',
        small: true 
      });
      console.log(qrAscii);
      
      // Also generate QR as image for web dashboard
      await this.generateQRImage(qrString);
      
      // Show alternative connection method
      console.log(chalk.green('\n💡 Código de conexión alternativo:'));
      console.log(chalk.blue('━'.repeat(80)));
      console.log(chalk.yellow(qrString));
      console.log(chalk.blue('━'.repeat(80)));
      console.log(chalk.gray('Copia este código y úsalo en WhatsApp Web para conectar directamente\n'));
      
    } catch (error) {
      // Fallback to text display if QR generation fails
      console.log(chalk.yellow('\n🔄 Conectando a WhatsApp...\n'));
      console.log(chalk.cyan('📱 Código de conexión para WhatsApp:'));
      console.log(chalk.blue('━'.repeat(80)));
      console.log(chalk.yellow(qrString));
      console.log(chalk.blue('━'.repeat(80)));
      console.log(chalk.gray('Usa este código en WhatsApp Web para conectar\n'));
    }
  }
  
  static async generateQRImage(qrString: string): Promise<string> {
    try {
      const qrPath = path.join(process.cwd(), 'downloads', 'qr-code.png');
      
      // Ensure downloads directory exists
      const downloadsDir = path.dirname(qrPath);
      if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir, { recursive: true });
      }
      
      await QRCode.toFile(qrPath, qrString, {
        color: {
          dark: '#000000',  // Black dots
          light: '#FFFFFF'  // White background
        },
        width: 256
      });
      
      console.log(chalk.green(`✅ QR guardado en: ${qrPath}`));
      return qrPath;
    } catch (error) {
      console.log(chalk.red('❌ Error generando imagen QR:', error));
      throw error;
    }
  }
  
  static showPairingInstructions(): void {
    console.log(chalk.cyan('\n📋 Instrucciones de conexión:'));
    console.log(chalk.white('1. Abre WhatsApp en tu teléfono'));
    console.log(chalk.white('2. Ve a Configuración > Dispositivos vinculados'));
    console.log(chalk.white('3. Toca "Vincular un dispositivo"'));
    console.log(chalk.white('4. Escanea el código QR mostrado arriba'));
    console.log(chalk.gray('   O copia y pega el código alternativo\n'));
    
    console.log(chalk.yellow('🔗 Código de conexión alternativo:'));
    console.log(chalk.gray('Si el escaneo no funciona, puedes usar el código de texto'));
    console.log(chalk.gray('mostrado arriba en WhatsApp Web directamente.\n'));
  }
}