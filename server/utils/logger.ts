interface Logger {
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
  debug: (message: string, ...args: any[]) => void;
  trace: (message: string, ...args: any[]) => void;
  child: (options: any) => Logger;
  fatal?: (message: string, ...args: any[]) => void;
  level?: string;
}

class TermuxCompatibleLogger implements Logger {
  public level = 'info';
  
  private isTermux(): boolean {
    return !!(
      process.env.TERMUX || 
      process.env.PREFIX?.includes('/com.termux/') ||
      process.platform === 'android' ||
      process.env.HOME?.includes('/com.termux/')
    );
  }

  private formatMessage(level: string, message: any): string {
    if (this.isTermux()) {
      // Simplified format for Termux to avoid encoding issues
      return `[${level}] ${String(message)}`;
    }
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${String(message)}`;
  }

  private safeLog(level: string, message: any, ...args: any[]): void {
    try {
      // Convert all arguments to strings to avoid object serialization issues in Termux
      const safeMessage = String(message || '');
      const safeArgs = args.map(arg => {
        if (typeof arg === 'object' && arg !== null) {
          try {
            return JSON.stringify(arg);
          } catch {
            return '[Object]';
          }
        }
        return String(arg);
      });
      
      const formatted = this.formatMessage(level, safeMessage);
      console.log(formatted, ...safeArgs);
    } catch (error) {
      // Fallback to basic console.log if formatting fails
      console.log(`[${level}]`, String(message || ''));
    }
  }

  info(message: any, ...args: any[]): void {
    this.safeLog('INFO', message, ...args);
  }

  warn(message: any, ...args: any[]): void {
    this.safeLog('WARN', message, ...args);
  }

  error(message: any, ...args: any[]): void {
    this.safeLog('ERROR', message, ...args);
  }

  debug(message: any, ...args: any[]): void {
    // Only show debug in development or if explicitly enabled
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG) {
      this.safeLog('DEBUG', message, ...args);
    }
  }

  trace(message: any, ...args: any[]): void {
    // Only show trace in development with DEBUG enabled
    if (process.env.NODE_ENV === 'development' && process.env.DEBUG) {
      this.safeLog('TRACE', message, ...args);
    }
  }

  fatal(message: any, ...args: any[]): void {
    this.safeLog('FATAL', message, ...args);
  }

  child(options: any): Logger {
    // Return the same logger instance for Baileys compatibility
    // In a full implementation, you might want to extend the logger with additional context
    return this;
  }
}

export const logger = new TermuxCompatibleLogger();
