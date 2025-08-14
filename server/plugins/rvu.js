// RVU.js - Plugin para descargar videos de YouTube y otras plataformas
const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class RVUPlugin {
  constructor() {
    this.name = 'rvu';
    this.description = 'Descarga videos de YouTube, Instagram, TikTok y otras plataformas';
    this.commands = ['.rvu', '/rvu', '#rvu'];
  }

  async execute(sock, message, args) {
    try {
      const query = args.join(' ');
      if (!query) {
        await this.sendMessage(sock, message, '❌ Proporciona una URL o término de búsqueda\n\nEjemplo:\n• .rvu https://youtube.com/watch?v=...\n• .rvu nombre de la canción');
        return;
      }

      console.log(`🎵 RVU: Procesando solicitud "${query}"`);
      await this.sendMessage(sock, message, '🔍 Buscando video...');

      let videoInfo;
      if (query.includes('youtube.com') || query.includes('youtu.be')) {
        videoInfo = await this.downloadFromYouTube(query);
      } else if (query.includes('instagram.com')) {
        videoInfo = await this.downloadFromInstagram(query);
      } else if (query.includes('tiktok.com')) {
        videoInfo = await this.downloadFromTikTok(query);
      } else {
        // Búsqueda en YouTube
        videoInfo = await this.searchAndDownloadYouTube(query);
      }

      if (videoInfo) {
        await this.sendVideoResponse(sock, message, videoInfo);
      } else {
        await this.sendMessage(sock, message, '❌ No se pudo descargar el video. Intenta con otra URL.');
      }

    } catch (error) {
      console.error('❌ Error en RVU:', error.message);
      await this.sendMessage(sock, message, `❌ Error: ${error.message}`);
    }
  }

  async downloadFromYouTube(url) {
    try {
      const info = await ytdl.getInfo(url);
      const title = info.videoDetails.title;
      const duration = info.videoDetails.lengthSeconds;
      
      if (parseInt(duration) > 600) { // 10 minutos máximo
        throw new Error('Video muy largo (máximo 10 minutos)');
      }

      const filename = `yt_${Date.now()}.mp4`;
      const filepath = path.join(process.cwd(), 'downloads', filename);

      // Crear directorio si no existe
      if (!fs.existsSync(path.dirname(filepath))) {
        fs.mkdirSync(path.dirname(filepath), { recursive: true });
      }

      return new Promise((resolve, reject) => {
        const stream = ytdl(url, { 
          quality: 'lowest',
          filter: 'audioandvideo'
        });

        stream.pipe(fs.createWriteStream(filepath));
        
        stream.on('end', () => {
          resolve({
            title,
            filepath,
            duration: this.formatDuration(duration),
            size: this.getFileSize(filepath)
          });
        });

        stream.on('error', reject);
      });

    } catch (error) {
      throw new Error(`Error descargando de YouTube: ${error.message}`);
    }
  }

  async searchAndDownloadYouTube(query) {
    try {
      const searchResults = await ytSearch(query);
      if (!searchResults.videos.length) {
        throw new Error('No se encontraron videos');
      }

      const video = searchResults.videos[0];
      console.log(`🎵 Descargando: ${video.title}`);
      
      return await this.downloadFromYouTube(video.url);
    } catch (error) {
      throw new Error(`Error en búsqueda: ${error.message}`);
    }
  }

  async downloadFromInstagram(url) {
    // Implementación básica para Instagram
    throw new Error('Descarga de Instagram temporalmente no disponible');
  }

  async downloadFromTikTok(url) {
    // Implementación básica para TikTok
    throw new Error('Descarga de TikTok temporalmente no disponible');
  }

  async sendVideoResponse(sock, message, videoInfo) {
    const responseText = `✅ *Video Descargado*\n\n` +
                        `📺 *Título:* ${videoInfo.title}\n` +
                        `⏱️ *Duración:* ${videoInfo.duration}\n` +
                        `📦 *Tamaño:* ${videoInfo.size}`;

    await this.sendMessage(sock, message, responseText);

    // Enviar el archivo de video
    if (fs.existsSync(videoInfo.filepath)) {
      try {
        await sock.sendMessage(message.key.remoteJid, {
          video: fs.readFileSync(videoInfo.filepath),
          caption: `🎵 ${videoInfo.title}`,
          gifPlayback: false
        });

        // Limpiar archivo después de enviar
        setTimeout(() => {
          if (fs.existsSync(videoInfo.filepath)) {
            fs.unlinkSync(videoInfo.filepath);
          }
        }, 30000);

      } catch (error) {
        console.error('❌ Error enviando video:', error);
        await this.sendMessage(sock, message, '❌ Error enviando el video');
      }
    }
  }

  async sendMessage(sock, message, text) {
    try {
      await sock.sendMessage(message.key.remoteJid, {
        text: text
      });
    } catch (error) {
      console.error('❌ Error enviando mensaje:', error);
    }
  }

  formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  getFileSize(filepath) {
    try {
      const stats = fs.statSync(filepath);
      const size = stats.size / (1024 * 1024); // MB
      return `${size.toFixed(2)} MB`;
    } catch {
      return 'Desconocido';
    }
  }
}

module.exports = RVUPlugin;