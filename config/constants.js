/**
 * Application Constants
 * Core configuration values and default settings
 */
import P from 'pino';

// Global configuration
export const GLOBAL_CONFIG = {
  wm: '©ㅤⱮօלìէօ-MD',
  author: 'Brian Martins',
  packname: '★𝐌øɉɨŧø★',
  vs: '2.0.0',
  botname: 'MoJiTo-MD',
  gt: 'Gracias por usar el bot',
  ig: '@brian_martins_dev'
};

/**
 * Bot Configuration Constants
 * Central configuration for bot behavior and settings
 */

export const CONNECTION_CONFIG = {
  logger: P.pino({ level: 'silent' }),
  printQRInTerminal: false,
  mobile: false,
  browser: ["MoJiTo Bot", "Desktop", "1.0.0"],
  connectTimeoutMs: 60000,
  defaultQueryTimeoutMs: 0,
  keepAliveIntervalMs: 10000,
  emitOwnEvents: true,
  fireInitQueries: true,
  generateHighQualityLinkPreview: false,
  syncFullHistory: false,
  markOnlineOnConnect: true,
  retryRequestDelayMs: 250,
  maxMsgRetryCount: 3,
  receivedPendingNotifications: false,
  getMessage: async (key) => {
    if (store) {
      const msg = await store.loadMessage(key.remoteJid, key.id);
      return msg?.message || undefined;
    }
    return {
      conversation: "Hello, this is a test message"
    };
  }
};

export const BOT_CONFIG = {
  sticker: {
    packname: '★𝐌øɉɨŧø★',
    author: 'Brian Martins'
  },
  watermark: '©ㅤⱮօלìէօ-MD',
  instagram: '@brian_martins_dev',
  messages: {
    wait: '⏳ Procesando comando...',
    error: '❌ Ocurrió un error',
    success: '✅ Comando ejecutado exitosamente'
  },
  multiplier: 69,
  rpg: true,
  owners: [
    ['5521989050540', 'Brian Martins', true],
    ['5521989050540', 'Owner', true]
  ],
  moderators: [],
  premium: [],
  version: '2.0.0',
  botname: 'MoJiTo-MD',
  prefix: /^[.,/#!$%\^&\*;:{}=\-_`~()]/i,
  thanks: 'Gracias por usar el bot'
};

export const DATABASE_CONFIG = {
  jsonFile: 'database.json',
  mongoUrl: process.env.MONGO_URI || '',
  useMongoDb: false,
  autoBackup: true,
  backupInterval: 300000 // 5 minutes
};

export const RATE_LIMIT_CONFIG = {
  windowMs: 60000, // 1 minute
  maxRequests: 20,
  skipSuccessfulRequests: false,
  skipFailedRequests: false
};

export const PLUGIN_CONFIG = {
  directory: './plugins',
  autoLoad: true,
  hotReload: true,
  ignoredFiles: ['loader.js', 'manager.js']
};

export const SERVER_CONFIG = {
  port: 5000,
  host: '0.0.0.0',
  cors: true,
  helmet: true
};

export const DB_SCHEMA = {
  users: {
    exp: 0,
    limit: 10,
    lastclaim: 0,
    registered: false,
    regTime: -1,
    afk: -1,
    afkReason: '',
    banned: false,
    warn: 0,
    level: 0,
    role: 'Novato',
    autolevelup: true,
    money: 0,
    health: 100,
    potion: 0,
    trash: 0,
    wood: 0,
    rock: 0,
    string: 0,
    petFood: 0,
    emerald: 0,
    diamond: 0,
    gold: 0,
    iron: 0,
    upgrader: 0,
    premium: false,
    premiumTime: 0
  },
  chats: {
    isBanned: false,
    welcome: true,
    detect: false,
    sWelcome: '',
    sBye: '',
    sPromote: '',
    sDemote: '',
    delete: true,
    antiLink: false,
    antiLink2: false,
    modohorny: false,
    autosticker: false,
    audios: true,
    restrict: false,
    viewonce: true,
    antiToxic: false,
    simi: false,
    autoread: false
  },
  stats: {
    commands: {},
    today: 0,
    sticker: {
      today: 0,
      total: 0
    }
  },
  settings: {
    self: false,
    autoread: false,
    restrict: false,
    status: 0,
    backup: true
  }
};

export const RATE_LIMITS = {
  commands: {
    window: 60000, // 1 minute
    max: 10 // 10 commands per minute
  },
  messages: {
    window: 10000, // 10 seconds
    max: 5 // 5 messages per 10 seconds
  },
  spam: {
    window: 30000, // 30 seconds
    max: 3 // 3 identical messages in 30 seconds
  }
};

export const SECURITY_CONFIG = {
  maxFileSize: 100 * 1024 * 1024, // 100MB
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'video/mp4',
    'video/webm',
    'application/pdf',
    'text/plain'
  ],
  blockedDomains: [
    'malicious-site.com',
    'spam-domain.org'
  ]
};