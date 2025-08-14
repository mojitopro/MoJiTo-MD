// Sticker Handler - Manejo y visualización de stickers en consola para Termux
const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');
const terminalImage = require('terminal-image');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class StickerHandler {
  constructor() {
    this.isTermux = !!(
      process.env.TERMUX || 
      process.env.PREFIX?.includes('/com.termux/') ||
      process.env.TERMUX_DETECTED
    );
    this.tempDir = path.join(process.cwd(), 'downloads', 'temp');
    this.ensureTempDir();
    this.checkFFmpegAvailability();
  }

  async checkFFmpegAvailability() {
    try {
      await execAsync('ffmpeg -version');
      this.ffmpegAvailable = true;
      console.log('✅ FFmpeg disponible para procesamiento de stickers');
    } catch (error) {
      this.ffmpegAvailable = false;
      if (this.isTermux) {
        console.log('⚠️ FFmpeg no encontrado. Instala con: pkg install ffmpeg');
      } else {
        console.log('⚠️ FFmpeg no disponible, usando modo de respaldo');
      }
    }
  }

  ensureTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  async processSticker(message, sock) {
    try {
      if (!message.message?.stickerMessage) {
        return null;
      }

      const stickerData = message.message.stickerMessage;
      console.log('🎭 Sticker recibido - Procesando para visualización...');

      // Crear info del sticker
      const stickerInfo = {
        isAnimated: stickerData.isAnimated || false,
        mimetype: stickerData.mimetype || 'image/webp',
        fileLength: stickerData.fileLength || 0,
        width: stickerData.width || 256,
        height: stickerData.height || 256
      };

      // Descargar y mostrar sticker
      await this.downloadAndDisplaySticker(sock, message, stickerInfo);

      return stickerInfo;

    } catch (error) {
      console.error('❌ Error procesando sticker:', error.message);
      return null;
    }
  }

  async downloadAndDisplaySticker(sock, message, stickerInfo) {
    try {
      // Descargar el sticker
      const buffer = await sock.downloadMediaMessage(message, 'buffer');
      if (!buffer) {
        console.log('❌ No se pudo descargar el sticker');
        return;
      }

      const timestamp = Date.now();
      const filename = `sticker_${timestamp}.webp`;
      const stickerPath = path.join(this.tempDir, filename);
      
      // Guardar archivo temporal
      fs.writeFileSync(stickerPath, buffer);

      if (this.isTermux) {
        await this.displayStickerWithFFmpeg(stickerPath, stickerInfo);
      } else {
        await this.displayStickerFallback(stickerPath, stickerInfo);
      }

      // Limpiar archivo temporal después de 30 segundos
      setTimeout(() => {
        if (fs.existsSync(stickerPath)) {
          fs.unlinkSync(stickerPath);
        }
      }, 30000);

    } catch (error) {
      console.error('❌ Error descargando sticker:', error.message);
    }
  }

  async displayStickerWithFFmpeg(stickerPath, info) {
    try {
      console.log('\n🎭 ═════════ STICKER REAL DETECTADO ═════════');
      
      let stickerDisplayed = false;

      if (info.isAnimated) {
        // Para stickers animados, extraer primer frame usando ffmpeg
        const framePath = path.join(this.tempDir, `frame_${Date.now()}.png`);
        
        // Comando ffmpeg optimizado para Termux
        const ffmpegCmd = `ffmpeg -i "${stickerPath}" -vframes 1 -vf "scale=320:240" -y "${framePath}" 2>/dev/null`;
        
        try {
          console.log('🎬 Procesando sticker animado con FFmpeg...');
          await execAsync(ffmpegCmd);
          
          if (fs.existsSync(framePath)) {
            console.log('📺 STICKER ANIMADO (Primer Frame):');
            console.log('┌────────────────────────────────────────┐');
            
            // Mostrar imagen real en terminal usando terminal-image
            const imageBuffer = fs.readFileSync(framePath);
            const terminalImg = await terminalImage.buffer(imageBuffer, { 
              width: 50, 
              height: 25,
              preserveAspectRatio: true 
            });
            console.log(terminalImg);
            
            console.log('└────────────────────────────────────────┘');
            stickerDisplayed = true;
            
            // Limpiar frame temporal
            fs.unlinkSync(framePath);
          }
        } catch (ffmpegError) {
          console.log('⚠️ FFmpeg error:', ffmpegError.message);
        }
      } else {
        // Para stickers estáticos, intentar múltiples métodos
        console.log('🖼️ Procesando sticker estático...');
        
        // Método 1: Usar Jimp para conversión
        try {
          const image = await Jimp.read(stickerPath);
          const pngPath = path.join(this.tempDir, `static_${Date.now()}.png`);
          
          // Redimensionar para mejor visualización
          image.resize(320, 240);
          await image.writeAsync(pngPath);
          
          console.log('📱 STICKER ESTÁTICO:');
          console.log('┌────────────────────────────────────────┐');
          
          const imageBuffer = fs.readFileSync(pngPath);
          const terminalImg = await terminalImage.buffer(imageBuffer, { 
            width: 50, 
            height: 25,
            preserveAspectRatio: true 
          });
          console.log(terminalImg);
          
          console.log('└────────────────────────────────────────┘');
          stickerDisplayed = true;
          
          // Limpiar archivo temporal
          fs.unlinkSync(pngPath);
          
        } catch (jimpError) {
          console.log('⚠️ Error con Jimp, probando FFmpeg...');
          
          // Método 2: Fallback a FFmpeg
          const pngPath = path.join(this.tempDir, `ffmpeg_${Date.now()}.png`);
          const fallbackCmd = `ffmpeg -i "${stickerPath}" -vf "scale=320:240" -y "${pngPath}" 2>/dev/null`;
          
          try {
            await execAsync(fallbackCmd);
            
            if (fs.existsSync(pngPath)) {
              console.log('📱 STICKER ESTÁTICO (FFmpeg):');
              console.log('┌────────────────────────────────────────┐');
              
              const imageBuffer = fs.readFileSync(pngPath);
              const terminalImg = await terminalImage.buffer(imageBuffer, { 
                width: 50, 
                height: 25,
                preserveAspectRatio: true 
              });
              console.log(terminalImg);
              
              console.log('└────────────────────────────────────────┘');
              stickerDisplayed = true;
              
              fs.unlinkSync(pngPath);
            }
          } catch (ffmpegFallbackError) {
            console.log('⚠️ FFmpeg fallback failed:', ffmpegFallbackError.message);
          }
        }
      }

      // Si no se pudo mostrar el sticker, usar placeholder mejorado
      if (!stickerDisplayed) {
        console.log('⚠️ No se pudo procesar la imagen, mostrando placeholder');
        this.showStickerPlaceholder(info, info.isAnimated);
      }

      // Información del sticker
      console.log('📊 INFORMACIÓN DEL STICKER:');
      console.log(`   📐 Dimensiones: ${info.width}x${info.height}px`);
      console.log(`   💾 Tamaño: ${(info.fileLength / 1024).toFixed(2)} KB`);
      console.log(`   🎬 Tipo: ${info.isAnimated ? 'Animado (WebP)' : 'Estático (WebP)'}`);
      console.log(`   🔧 Procesamiento: ${this.isTermux ? 'Optimizado Termux' : 'Modo Estándar'}`);
      console.log('═══════════════════════════════════════════════\n');

    } catch (error) {
      console.error('❌ Error crítico mostrando sticker:', error.message);
      this.showStickerPlaceholder(info, false);
    }
  }

  showStickerPlaceholder(info, isAnimated) {
    console.log('\n🎭 ═════════ STICKER PLACEHOLDER ═════════');
    console.log('┌──────────────────────────────────────────┐');
    console.log('│                                          │');
    console.log('│            🎭 STICKER RECIBIDO           │');
    console.log('│                                          │');
    
    if (isAnimated) {
      console.log('│          🎬 TIPO: ANIMADO                │');
      console.log('│         ╔════════════════╗              │');
      console.log('│         ║  ▶️ REPRODUCING ║              │');
      console.log('│         ║                ║              │');
      console.log('│         ║   ( ◉    ◉ )   ║              │');
      console.log('│         ║       ▽        ║              │');
      console.log('│         ║    ╰─────╯     ║              │');
      console.log('│         ║                ║              │');
      console.log('│         ╚════════════════╝              │');
    } else {
      console.log('│          📱 TIPO: ESTÁTICO               │');
      console.log('│         ┌────────────────┐              │');
      console.log('│         │                │              │');
      console.log('│         │   ( ◉    ◉ )   │              │');
      console.log('│         │       ▽        │              │');
      console.log('│         │    ╰─────╯     │              │');
      console.log('│         │                │              │');
      console.log('│         └────────────────┘              │');
    }
    
    console.log('│                                          │');
    console.log('│  ⚠️ No se pudo mostrar imagen real       │');
    console.log('│     (FFmpeg/Jimp no disponible)          │');
    console.log('│                                          │');
    console.log('└──────────────────────────────────────────┘');
    console.log('═══════════════════════════════════════════════');
  }

  async displayStickerFallback(stickerPath, info) {
    // Método de respaldo para sistemas no-Termux
    console.log('\n🎭 STICKER RECIBIDO (Modo Estándar)');
    try {
      const image = await Jimp.read(stickerPath);
      const pngPath = path.join(this.tempDir, `fallback_${Date.now()}.png`);
      await image.writeAsync(pngPath);
      
      const imageBuffer = fs.readFileSync(pngPath);
      const terminalImg = await terminalImage.buffer(imageBuffer, { width: 30, height: 15 });
      console.log(terminalImg);
      
      fs.unlinkSync(pngPath);
    } catch (error) {
      console.log('❌ Error en modo fallback:', error.message);
      this.showStickerPlaceholder(info, info.isAnimated);
    }
  }

  async displayStickerInTerminal(stickerData, info) {
    try {
      // Mostrar información básica primero
      console.log('\n' + '─'.repeat(50));
      console.log('🎭 STICKER RECIBIDO');
      console.log('─'.repeat(50));
      
      if (info.isAnimated) {
        console.log('🎬 Sticker animado detectado');
        console.log('📱 En Termux se muestra el primer frame');
      }

      // Intentar mostrar representación visual si es posible
      if (stickerData.url || stickerData.directPath) {
        console.log('🖼️  [STICKER VISUAL AQUÍ]');
        console.log('   ┌─────────────────┐');
        console.log('   │  🎭  STICKER   │');
        console.log('   │                 │');
        console.log('   │   📱→💻→🖥️     │');
        console.log('   │                 │');
        console.log('   └─────────────────┘');
      }

      console.log(`📐 Tamaño: ${info.width}x${info.height}`);
      console.log(`💾 Peso: ${(info.fileLength / 1024).toFixed(2)} KB`);
      console.log('─'.repeat(50) + '\n');

    } catch (error) {
      console.log('🎭 Sticker recibido (error en visualización)');
      console.error('❌ Error mostrando sticker:', error.message);
    }
  }

  displayStickerInfo(info) {
    console.log('\n🎭 STICKER RECIBIDO:');
    console.log(`   Tipo: ${info.isAnimated ? 'Animado' : 'Estático'}`);
    console.log(`   Dimensiones: ${info.width}x${info.height}`);
    console.log(`   Tamaño: ${(info.fileLength / 1024).toFixed(2)} KB`);
    console.log('');
  }

  async createSticker(imagePath, outputPath) {
    try {
      console.log('🎨 Creando sticker...');
      
      const image = await Jimp.read(imagePath);
      
      // Redimensionar a 512x512 (tamaño estándar de sticker)
      image.resize(512, 512);
      
      // Guardar como WebP si es posible, sino como PNG
      const ext = path.extname(outputPath).toLowerCase();
      if (ext === '.webp') {
        await image.writeAsync(outputPath);
      } else {
        await image.writeAsync(outputPath.replace(ext, '.png'));
      }

      console.log('✅ Sticker creado exitosamente');
      return outputPath;

    } catch (error) {
      console.error('❌ Error creando sticker:', error.message);
      throw error;
    }
  }

  generateStickerPreview() {
    // Generar una preview ASCII del sticker
    const preview = [
      '┌─────────────────┐',
      '│  🎭  STICKER   │',
      '│                 │',
      '│   ╭─────────╮   │',
      '│   │ ◉     ◉ │   │',
      '│   │    ▽    │   │',
      '│   │  ╰─────╯ │   │',
      '│   ╰─────────╯   │',
      '│                 │',
      '└─────────────────┘'
    ];
    
    return preview.join('\n');
  }

  logStickerStats() {
    console.log('📊 Estadísticas de Stickers:');
    console.log('   🎭 Recibidos hoy: 0');
    console.log('   🎨 Creados hoy: 0');
    console.log('   💾 Almacenados: 0');
  }
}

module.exports = StickerHandler;