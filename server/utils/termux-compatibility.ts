/**
 * Termux Compatibility Layer
 * Provides optimizations and fixes specifically for Android Termux environment
 */

export class TermuxCompatibility {
  private static isTermuxEnvironment(): boolean {
    return !!(
      process.env.TERMUX || 
      process.env.PREFIX?.includes('/com.termux/') ||
      process.platform === 'android' ||
      process.env.HOME?.includes('/com.termux/')
    );
  }

  static setupEnvironment(): void {
    if (!this.isTermuxEnvironment()) return;

    // Set memory optimization
    if (!process.env.NODE_OPTIONS) {
      process.env.NODE_OPTIONS = '--max-old-space-size=512';
    }

    // Set terminal capabilities
    process.env.TERM = 'xterm-256color';
    process.env.COLORTERM = 'truecolor';
    
    // Flag for other parts of the application
    process.env.TERMUX_DETECTED = '1';
    process.env.MOBILE_ENVIRONMENT = '1';

    console.log('📱 Termux environment detected - Mobile optimizations enabled');
  }

  static getOptimizedSettings() {
    if (!this.isTermuxEnvironment()) {
      return {
        memoryLimit: '2GB',
        useNativeOptimizations: true,
        enableDebugLogs: true,
        compression: false
      };
    }

    return {
      memoryLimit: '512MB',
      useNativeOptimizations: false, // Avoid native compilation issues
      enableDebugLogs: false, // Reduce memory usage
      compression: true, // Save bandwidth on mobile
      maxConcurrency: 2, // Limit concurrent operations
      enableFallbacks: true // Use JavaScript alternatives when possible
    };
  }

  static logEnvironmentInfo(): void {
    if (this.isTermuxEnvironment()) {
      console.log('🔧 Termux Environment Details:');
      console.log(`   📱 Platform: ${process.platform}`);
      console.log(`   🏠 Home: ${process.env.HOME}`);
      console.log(`   📂 Prefix: ${process.env.PREFIX}`);
      console.log(`   🧠 Memory: 512MB limit applied`);
      console.log(`   📡 Network: Mobile optimizations enabled`);
    }
  }
}

// Auto-setup when imported
TermuxCompatibility.setupEnvironment();