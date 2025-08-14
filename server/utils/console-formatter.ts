import chalk from 'chalk';

// Custom console formatter to replace Baileys logs
export const formatters = {
  success: (message: string) => {
    console.log(chalk.green.bold(`✅ ${message}`));
  },
  
  error: (message: string) => {
    console.log(chalk.red.bold(`❌ ${message}`));
  },
  
  warning: (message: string) => {
    console.log(chalk.yellow.bold(`⚠️ ${message}`));
  },
  
  info: (message: string) => {
    console.log(chalk.blue.bold(`ℹ️ ${message}`));
  },
  
  command: (message: string) => {
    console.log(chalk.magenta.bold(`⚡ ${message}`));
  },
  
  connection: (message: string) => {
    console.log(chalk.cyan.bold(`🔗 ${message}`));
  },
  
  event: (message: string) => {
    console.log(chalk.gray(`📡 ${message}`));
  }
};

// Override console methods to suppress Baileys logs
export const setupConsoleOverride = () => {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalDebug = console.debug;

  console.log = (...args: any[]) => {
    const message = args.join(' ');
    
    // Suppress Baileys internal logs
    if (
      message.includes('[TRACE]') ||
      message.includes('[DEBUG]') ||
      message.includes('recv frame') ||
      message.includes('recv bytes') ||
      message.includes('sending receipt') ||
      message.includes('sent ack') ||
      message.includes('released buffered events') ||
      message.includes('opened connection') ||
      message.includes('pre-keys found') ||
      message.includes('handled offline messages') ||
      message.includes('[INFO]') ||
      message.includes('logging in') ||
      message.includes('offline preview received')
    ) {
      return;
    }
    
    originalLog(...args);
  };

  console.error = (...args: any[]) => {
    const message = args.join(' ');
    
    // Only show important errors
    if (!message.includes('[TRACE]') && !message.includes('[DEBUG]')) {
      originalError(...args);
    }
  };

  console.warn = (...args: any[]) => {
    const message = args.join(' ');
    
    // Only show important warnings
    if (!message.includes('[TRACE]') && !message.includes('[DEBUG]')) {
      originalWarn(...args);
    }
  };

  console.debug = () => {
    // Suppress all debug logs
    return;
  };
};