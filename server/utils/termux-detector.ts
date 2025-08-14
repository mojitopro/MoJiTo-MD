/**
 * Termux Environment Detection Utilities
 * Optimized for MoJiTo-MD Bot running on Android devices
 */

export interface PlatformInfo {
  isTermux: boolean;
  isAndroid: boolean;
  isLinux: boolean;
  architecture: string;
  platform: string;
  storageAccess: boolean;
  networkType: 'mobile' | 'wifi' | 'unknown';
}

export class TermuxDetector {
  private static _info: PlatformInfo | null = null;

  static detect(): PlatformInfo {
    if (this._info) return this._info;

    const env = process.env;
    const platform = process.platform;
    const arch = process.arch;

    // Detect Termux environment
    const isTermux = !!(
      env.PREFIX?.includes('com.termux') ||
      env.TERMUX_VERSION ||
      env.ANDROID_DATA ||
      env.ANDROID_ROOT
    );

    // Detect Android (broader than Termux)
    const isAndroid = !!(
      isTermux ||
      env.ANDROID_DATA ||
      env.ANDROID_ROOT ||
      platform === 'android'
    );

    // Detect Linux
    const isLinux = platform === 'linux' && !isAndroid;

    // Check storage access (Termux specific)
    const storageAccess = !!(
      env.EXTERNAL_STORAGE ||
      env.SECONDARY_STORAGE
    );

    // Estimate network type based on environment
    let networkType: 'mobile' | 'wifi' | 'unknown' = 'unknown';
    if (isTermux || isAndroid) {
      // Android devices typically use mobile networks
      networkType = 'mobile';
    } else if (isLinux) {
      // Server environments typically have stable connections
      networkType = 'wifi';
    }

    this._info = {
      isTermux,
      isAndroid,
      isLinux,
      architecture: arch,
      platform,
      storageAccess,
      networkType
    };

    return this._info;
  }

  static getOptimalSettings() {
    const info = this.detect();
    
    if (info.isTermux) {
      return {
        maxConcurrentDownloads: 2,
        rateLimitMs: 90000, // 1.5 minutes
        throttleRate: '50K',
        bufferSize: 1024,
        retries: 5,
        fragmentRetries: 5,
        sleepInterval: 2,
        maxSleepInterval: 10,
        audioQuality: '128K', // Conservative for mobile data
        preferredFormat: 'mp3'
      };
    } else if (info.isLinux) {
      return {
        maxConcurrentDownloads: 3,
        rateLimitMs: 60000, // 1 minute
        throttleRate: '100K',
        bufferSize: 4096,
        retries: 3,
        fragmentRetries: 3,
        sleepInterval: 1,
        maxSleepInterval: 5,
        audioQuality: '192K',
        preferredFormat: 'mp3'
      };
    } else {
      // Fallback settings
      return {
        maxConcurrentDownloads: 2,
        rateLimitMs: 75000,
        throttleRate: '75K',
        bufferSize: 2048,
        retries: 4,
        fragmentRetries: 4,
        sleepInterval: 1.5,
        maxSleepInterval: 7.5,
        audioQuality: '160K',
        preferredFormat: 'mp3'
      };
    }
  }

  static logEnvironmentInfo() {
    const info = this.detect();
    const settings = this.getOptimalSettings();

    console.log('🔍 Entorno detectado:');
    console.log(`  📱 Termux: ${info.isTermux ? 'Sí' : 'No'}`);
    console.log(`  🤖 Android: ${info.isAndroid ? 'Sí' : 'No'}`);
    console.log(`  🐧 Linux: ${info.isLinux ? 'Sí' : 'No'}`);
    console.log(`  💾 Arquitectura: ${info.architecture}`);
    console.log(`  🌐 Red estimada: ${info.networkType}`);
    console.log(`  📁 Acceso storage: ${info.storageAccess ? 'Sí' : 'No'}`);
    console.log('⚙️ Configuración optimizada:');
    console.log(`  🔄 Descargas simultáneas: ${settings.maxConcurrentDownloads}`);
    console.log(`  ⏰ Rate limit: ${settings.rateLimitMs}ms`);
    console.log(`  🎵 Calidad audio: ${settings.audioQuality}`);
    console.log(`  📶 Throttle: ${settings.throttleRate}`);
  }
}

export default TermuxDetector;