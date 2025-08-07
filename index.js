
/**
 * MoJiTo WhatsApp Bot - Enhanced Entry Point
 * Main entry point with improved cluster management and connection handling
 */
import cluster from 'cluster';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { startupDisplay } from './utils/formatters.js';
import { logger } from './services/logger.js';
import { validateEnvironment } from './utils/validators.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rl = createInterface(process.stdin, process.stdout);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  setTimeout(() => process.exit(1), 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

if (cluster.isPrimary) {
  await main();
} else {
  const { startBot } = await import('./core/app.js');
  await startBot();
}

async function main() {
  try {
    // Validate environment and dependencies
    await validateEnvironment();
    
    // Display startup banner
    await startupDisplay();
    
    // Parse command line arguments with enhanced options
    const opts = yargs(hideBin(process.argv))
      .option('pairing-code', {
        alias: 'p',
        type: 'boolean',
        description: 'Use pairing code instead of QR code',
        default: false
      })
      .option('phone', {
        alias: 'n',
        type: 'string',
        description: 'Phone number for pairing code (with country code)',
        coerce: (phone) => {
          if (phone) {
            // Clean and format phone number
            let cleaned = phone.replace(/[^0-9]/g, '');
            if (cleaned.length === 10 && !cleaned.startsWith('1')) {
              cleaned = '1' + cleaned; // Add US country code if missing
            }
            return cleaned;
          }
          return phone;
        }
      })
      .option('qr', {
        alias: 'q',
        type: 'boolean',
        description: 'Force QR code mode',
        default: false
      })
      .option('debug', {
        alias: 'd',
        type: 'boolean',
        description: 'Enable debug mode',
        default: false
      })
      .example('$0 --pairing-code --phone +1234567890', 'Start with pairing code')
      .example('$0 --qr', 'Force QR code mode')
      .help()
      .alias('help', 'h')
      .exitProcess(false)
      .parse();
    
    // Set environment variables from command line
    if (opts['pairing-code']) {
      process.env.USE_PAIRING_CODE = 'true';
      logger.info('Pairing code mode enabled via CLI');
    }
    
    if (opts.phone) {
      process.env.PHONE_NUMBER = opts.phone;
      logger.info(`Phone number set: +${opts.phone}`);
    }
    
    if (opts.qr) {
      process.env.USE_PAIRING_CODE = 'false';
      logger.info('QR code mode forced via CLI');
    }
    
    if (opts.debug) {
      process.env.DEBUG = 'true';
      logger.info('Debug mode enabled');
    }
    
    // Validate pairing code setup
    if (process.env.USE_PAIRING_CODE === 'true' && !process.env.PHONE_NUMBER) {
      logger.error('Pairing code mode requires a phone number. Use --phone option or set PHONE_NUMBER environment variable.');
      console.log('\n📞 Ejemplo de uso:');
      console.log('  node index.js --pairing-code --phone +1234567890');
      console.log('  node index.js -p -n 1234567890\n');
      process.exit(1);
    }
    
    // Display connection mode
    if (process.env.USE_PAIRING_CODE === 'true') {
      logger.info(`🔐 Modo código de emparejamiento activado para: +${process.env.PHONE_NUMBER}`);
    } else {
      logger.info('📱 Modo código QR activado');
    }
    
    // Start worker process with restart capability
    let worker = cluster.fork();
    let restartCount = 0;
    const maxRestarts = 5;
    
    // Handle worker communication
    setupWorkerCommunication(worker, opts);
    
    // Handle worker restart on exit with exponential backoff
    worker.on('exit', (code, signal) => {
      logger.error(`Worker exited (code: ${code}, signal: ${signal})`);
      
      if (restartCount < maxRestarts) {
        restartCount++;
        const delay = Math.min(1000 * Math.pow(2, restartCount), 30000);
        
        logger.info(`Restarting worker in ${delay}ms (attempt ${restartCount}/${maxRestarts})...`);
        
        setTimeout(() => {
          worker = cluster.fork();
          setupWorkerCommunication(worker, opts);
        }, delay);
      } else {
        logger.error('Max restart attempts reached. Exiting...');
        process.exit(1);
      }
    });
    
    // Handle graceful shutdown
    const gracefulShutdown = (signal) => {
      logger.info(`Received ${signal}, initiating graceful shutdown...`);
      
      if (worker && !worker.isDead()) {
        worker.send('shutdown');
        
        setTimeout(() => {
          worker.kill('SIGTERM');
          
          setTimeout(() => {
            worker.kill('SIGKILL');
          }, 5000);
        }, 3000);
      }
      
      setTimeout(() => {
        process.exit(0);
      }, 10000);
    };
    
    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
    
  } catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
  }
}

function setupWorkerCommunication(worker, opts) {
  worker.on('message', (data) => {
    if (typeof data === 'object') {
      logger.debug('[WORKER]', data);
    } else {
      switch (data) {
        case 'reset':
          logger.info('Restarting worker...');
          worker.process.kill();
          break;
        case 'uptime':
          worker.send(process.uptime());
          break;
        case 'ready':
          logger.info('Worker is ready and connected');
          break;
        default:
          logger.debug('Worker message:', data);
      }
    }
  });

  // Setup CLI interface for interactive commands
  if (!opts.test && process.stdin.isTTY) {
    console.log('\n💡 Comandos disponibles:');
    console.log('  restart - Reiniciar el bot');
    console.log('  stop - Detener el bot');
    console.log('  status - Ver estado del bot');
    console.log('  clear - Limpiar consola\n');
    
    rl.on('line', (line) => {
      const command = line.trim().toLowerCase();
      
      switch (command) {
        case 'restart':
          logger.info('Reiniciando bot...');
          worker.process.kill();
          break;
        case 'stop':
          logger.info('Deteniendo bot...');
          process.exit(0);
          break;
        case 'status':
          worker.send('status');
          break;
        case 'clear':
          console.clear();
          break;
        default:
          if (command && worker.isConnected()) {
            worker.send(line.trim());
          }
      }
    });
  }

  // Handle worker errors
  worker.on('error', (error) => {
    logger.error('Worker error:', error);
  });
}
