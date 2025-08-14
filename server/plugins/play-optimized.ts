import { WAMessage, WASocket } from '@whiskeysockets/baileys';
import { print } from '../utils/print';
// @ts-ignore - yt-search doesn't have types
import ytSearch from 'yt-search';
import { promises as fs } from 'fs';
import { join } from 'path';
import os from 'os';
import { randomUUID } from 'crypto';
import { spawn } from 'child_process';
import TermuxDetector from '../utils/termux-detector';

// Queue system optimized for mobile/Termux environments
class DownloadQueue {
  private queue: Array<{ query: string; message: WAMessage; conn: WASocket; resolve: Function; reject: Function }> = [];
  private processing = false;
  private activeDownloads = new Set<string>();
  private rateLimiter = new Map<string, number>();
  private readonly maxConcurrent: number;
  private readonly rateLimit: number;

  constructor() {
    // Use advanced Termux detection
    const settings = TermuxDetector.getOptimalSettings();
    const platform = TermuxDetector.detect();
    
    this.maxConcurrent = settings.maxConcurrentDownloads;
    this.rateLimit = settings.rateLimitMs;

    console.log(`🎵 Queue configurada para ${platform.isTermux ? 'Termux/Android' : platform.isLinux ? 'Linux' : 'Otro'}: ${this.maxConcurrent} descargas simultáneas`);
    
    // Log detailed environment info only once
    if (!global._termuxLogged) {
      TermuxDetector.logEnvironmentInfo();
      global._termuxLogged = true;
    }
  }

  async addToQueue(query: string, message: WAMessage, conn: WASocket): Promise<void> {
    const userJid = message.key.remoteJid!;
    const userId = userJid.split('@')[0];
    
    // Rate limiting check
    const lastRequest = this.rateLimiter.get(userId);
    if (lastRequest && Date.now() - lastRequest < this.rateLimit) {
      const remainingTime = Math.ceil((this.rateLimit - (Date.now() - lastRequest)) / 1000);
      await conn.sendMessage(userJid, { 
        text: `⏰ Espera ${remainingTime} segundos antes de solicitar otra canción.` 
      });
      return;
    }

    // Check if user already has active download
    if (this.activeDownloads.has(userId)) {
      await conn.sendMessage(userJid, { 
        text: '⚠️ Ya tienes una descarga en proceso. Espera a que termine.' 
      });
      return;
    }

    return new Promise((resolve, reject) => {
      this.queue.push({ query, message, conn, resolve, reject });
      this.rateLimiter.set(userId, Date.now());
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    if (this.activeDownloads.size >= this.maxConcurrent) return;

    this.processing = true;
    const item = this.queue.shift();
    
    if (item) {
      const userId = item.message.key.remoteJid!.split('@')[0];
      this.activeDownloads.add(userId);
      
      try {
        await this.processDownload(item);
        item.resolve();
      } catch (error) {
        item.reject(error);
      } finally {
        this.activeDownloads.delete(userId);
        this.processing = false;
        // Process next item in queue
        setTimeout(() => this.processQueue(), 1000);
      }
    } else {
      this.processing = false;
    }
  }

  private async processDownload({ query, message, conn }: { query: string; message: WAMessage; conn: WASocket }): Promise<void> {
    const userJid = message.key.remoteJid!;
    let statusMsg: any;

    try {
      // Send initial status
      statusMsg = await conn.sendMessage(userJid, { 
        text: `🎵 Buscando: *${query}*\n⏳ Posición en cola: ${this.queue.length + 1}` 
      });

      // Update status
      await conn.sendMessage(userJid, {
        text: `🔍 Buscando en YouTube...\n🎵 *${query}*`,
        edit: statusMsg.key
      });

      // Search on YouTube
      const searchResults = await ytSearch(query);
      if (!searchResults.videos.length) {
        throw new Error('No se encontraron resultados');
      }

      const video = searchResults.videos[0];
      const title = video.title;
      const duration = video.duration.toString();
      
      // Check duration (max 10 minutes)
      const durationSeconds = this.parseDuration(duration);
      if (durationSeconds > 600) {
        throw new Error('La canción es muy larga (máximo 10 minutos)');
      }

      // Update status
      await conn.sendMessage(userJid, {
        text: `📥 Descargando: *${title}*\n⏱️ Duración: ${duration}\n⚡ Procesando audio...`,
        edit: statusMsg.key
      });

      // Download using yt-dlp (compatible with ARM/Linux/Termux)
      const audioPath = await this.downloadAudio(video.url, title);

      // Update status
      await conn.sendMessage(userJid, {
        text: `✅ Descarga completa: *${title}*\n📤 Enviando archivo...`,
        edit: statusMsg.key
      });

      // Send audio file
      const audioBuffer = await fs.readFile(audioPath);
      await conn.sendMessage(userJid, {
        audio: audioBuffer,
        mimetype: 'audio/mpeg',
        ptt: false,
        fileName: `${title}.mp3`
      }, { quoted: message });

      // Clean up
      await fs.unlink(audioPath).catch(() => {});
      
      // Delete status message
      await conn.sendMessage(userJid, {
        delete: statusMsg.key
      });

      console.log(`🎵 Audio enviado: ${title} | Usuario: ${userJid.split('@')[0]}`);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      
      if (statusMsg) {
        await conn.sendMessage(userJid, {
          text: `❌ Error: ${errorMsg}`,
          edit: statusMsg.key
        });
      } else {
        await conn.sendMessage(userJid, { text: `❌ Error: ${errorMsg}` });
      }
      
      console.log(`❌ Error en descarga: ${errorMsg} | Usuario: ${userJid.split('@')[0]}`);
      throw error;
    }
  }

  private parseDuration(duration: string): number {
    const parts = duration.split(':').map(Number);
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1]; // MM:SS
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2]; // HH:MM:SS
    }
    return 0;
  }

  private async downloadAudio(url: string, title: string): Promise<string> {
    const tempDir = os.tmpdir();
    const filename = `mojito_${randomUUID()}`;
    const outputTemplate = join(tempDir, `${filename}.%(ext)s`);
    
    return new Promise((resolve, reject) => {
      // Detect yt-dlp executable
      const ytdlpCmd = this.findYtDlp();
      if (!ytdlpCmd) {
        reject(new Error('yt-dlp no encontrado. Ejecuta ./install-ytdlp.sh'));
        return;
      }

      // Get platform-optimized arguments
      const args = this.getTermuxOptimizedArgs(url, outputTemplate);

      console.log(`🎵 Descargando con: ${ytdlpCmd} ${args.slice(-3).join(' ')}`);

      const ytdlp = spawn(ytdlpCmd, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, PYTHONUNBUFFERED: '1' }
      });

      let stderr = '';
      let stdout = '';
      
      ytdlp.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      ytdlp.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      // Dynamic timeout based on platform
      const platform = TermuxDetector.detect();
      const timeoutMs = platform.isTermux ? 600000 : 300000; // 10 min for Termux, 5 min for Linux
      
      const timeout = setTimeout(() => {
        ytdlp.kill('SIGTERM');
        reject(new Error(`Descarga cancelada por timeout (${timeoutMs/60000} minutos)`));
      }, timeoutMs);

      ytdlp.on('close', async (code) => {
        clearTimeout(timeout);
        
        if (code === 0) {
          // Find the downloaded file
          const possibleExtensions = ['.mp3', '.m4a', '.webm', '.mp4'];
          
          for (const ext of possibleExtensions) {
            const testPath = join(tempDir, `${filename}${ext}`);
            try {
              await fs.access(testPath);
              console.log(`✅ Archivo encontrado: ${testPath}`);
              resolve(testPath);
              return;
            } catch {
              continue;
            }
          }
          
          reject(new Error('Archivo de audio no encontrado después de la descarga'));
        } else {
          const errorMsg = stderr || stdout || 'Error desconocido';
          reject(new Error(`yt-dlp error (código ${code}): ${errorMsg.slice(0, 200)}`));
        }
      });

      ytdlp.on('error', (error) => {
        clearTimeout(timeout);
        reject(new Error(`Error ejecutando yt-dlp: ${error.message}`));
      });
    });
  }

  private findYtDlp(): string | null {
    // Termux-specific paths first, then other Linux distributions
    const possiblePaths = [
      // Termux Android paths (priority)
      '/data/data/com.termux/files/usr/bin/yt-dlp',
      '$PREFIX/bin/yt-dlp',
      // Standard Linux paths
      'yt-dlp',
      '/usr/bin/yt-dlp',
      '/usr/local/bin/yt-dlp',
      '/nix/store/*/bin/yt-dlp', // Replit Nix
      `${os.homedir()}/.local/bin/yt-dlp`,
      './yt-dlp'
    ];

    // Special handling for Termux environment variables
    if (process.env.PREFIX) {
      possiblePaths.unshift(`${process.env.PREFIX}/bin/yt-dlp`);
    }

    for (const path of possiblePaths) {
      try {
        // Handle glob patterns for Nix store
        if (path.includes('*')) {
          const { execSync } = require('child_process');
          const realPath = execSync(`ls ${path} 2>/dev/null | head -1`, { encoding: 'utf8' }).trim();
          if (realPath) {
            execSync(`${realPath} --version`, { stdio: 'ignore' });
            return realPath;
          }
        } else {
          require('child_process').execSync(`${path} --version`, { stdio: 'ignore' });
          return path;
        }
      } catch {
        continue;
      }
    }

    return null;
  }

  private getTermuxOptimizedArgs(url: string, outputTemplate: string): string[] {
    const settings = TermuxDetector.getOptimalSettings();
    const platform = TermuxDetector.detect();

    const baseArgs = [
      '--extract-audio',
      '--audio-format', settings.preferredFormat,
      '--audio-quality', settings.audioQuality,
      '--no-playlist',
      '--max-duration', '600',
      '--output', outputTemplate,
      '--retries', settings.retries.toString(),
      '--fragment-retries', settings.fragmentRetries.toString(),
      '--throttled-rate', settings.throttleRate,
      '--sleep-interval', settings.sleepInterval.toString(),
      '--max-sleep-interval', settings.maxSleepInterval.toString()
    ];

    if (platform.isTermux) {
      // Termux/Android-specific optimizations
      return [
        ...baseArgs,
        '--buffer-size', settings.bufferSize.toString(),
        '--no-check-certificate', // For mobile networks
        '--ignore-errors',
        '--continue', // Resume interrupted downloads
        '--no-call-home', // Privacy for mobile users
        '--prefer-free-formats', // Better compatibility
        '--format', 'bestaudio/best', // Ensure audio quality
        url
      ];
    } else {
      // Standard Linux optimizations
      return [
        ...baseArgs,
        '--prefer-ffmpeg',
        '--embed-metadata',
        '--add-metadata',
        '--format', 'bestaudio[ext=m4a]/bestaudio/best',
        url
      ];
    }
  }
}

const downloadQueue = new DownloadQueue();

const handler = async (m: WAMessage, { conn }: { conn: WASocket }) => {
  const text = m.message?.conversation || m.message?.extendedTextMessage?.text || '';
  const args = text.split(' ').slice(1);
  
  if (args.length === 0) {
    await conn.sendMessage(m.key.remoteJid!, {
      text: '❌ Proporciona el nombre de una canción.\n\n*Uso:* /play <nombre de canción>'
    });
    return;
  }

  const query = args.join(' ');
  
  try {
    await downloadQueue.addToQueue(query, m, conn);
  } catch (error) {
    console.log(`❌ Error en comando play: ${error}`);
    await conn.sendMessage(m.key.remoteJid!, {
      text: '❌ Error al procesar la solicitud. Intenta de nuevo más tarde.'
    });
  }
};

export default {
  command: /^play$/i,
  handler,
  help: ['play <query>'],
  tags: ['media'],
  description: 'Descarga música de YouTube con sistema de colas'
};