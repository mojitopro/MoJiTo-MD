/**
 * File Upload Utilities
 * Handle file uploads and temporary file management
 */
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { randomBytes } from 'crypto';
import { extname, join } from 'path';
import { logger } from '../services/logger.js';
import { sanitizeFilename } from '../utils/helpers.js';

const UPLOAD_DIR = './tmp';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.mp3', '.pdf', '.txt'];

/**
 * Upload file from buffer
 */
export async function uploadFile(buffer, originalName = 'file', options = {}) {
  try {
    // Validate file size
    if (buffer.length > (options.maxSize || MAX_FILE_SIZE)) {
      throw new Error(`File too large: ${buffer.length} bytes (max: ${options.maxSize || MAX_FILE_SIZE})`);
    }
    
    // Generate unique filename
    const ext = extname(originalName) || '.tmp';
    const baseName = sanitizeFilename(originalName.replace(ext, ''));
    const uniqueId = randomBytes(8).toString('hex');
    const fileName = `${baseName}_${uniqueId}${ext}`;
    
    // Validate extension if strict mode
    if (options.strictExtensions && !ALLOWED_EXTENSIONS.includes(ext.toLowerCase())) {
      throw new Error(`File extension not allowed: ${ext}`);
    }
    
    // Write file
    const filePath = join(UPLOAD_DIR, fileName);
    writeFileSync(filePath, buffer);
    
    logger.debug(`File uploaded: ${fileName} (${buffer.length} bytes)`);
    
    return {
      success: true,
      fileName,
      filePath,
      size: buffer.length,
      extension: ext
    };
    
  } catch (error) {
    logger.error('File upload error:', error);
    throw error;
  }
}

/**
 * Upload image with validation
 */
export async function uploadImage(buffer, name = 'image') {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  
  return uploadFile(buffer, name, {
    strictExtensions: true,
    allowedExtensions: imageExtensions,
    maxSize: 10 * 1024 * 1024 // 10MB for images
  });
}

/**
 * Upload video with validation
 */
export async function uploadVideo(buffer, name = 'video') {
  const videoExtensions = ['.mp4', '.avi', '.mov', '.webm'];
  
  return uploadFile(buffer, name, {
    strictExtensions: true,
    allowedExtensions: videoExtensions,
    maxSize: 100 * 1024 * 1024 // 100MB for videos
  });
}

/**
 * Upload audio with validation
 */
export async function uploadAudio(buffer, name = 'audio') {
  const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a'];
  
  return uploadFile(buffer, name, {
    strictExtensions: true,
    allowedExtensions: audioExtensions,
    maxSize: 20 * 1024 * 1024 // 20MB for audio
  });
}

/**
 * Delete uploaded file
 */
export function deleteFile(filePath) {
  try {
    if (existsSync(filePath)) {
      unlinkSync(filePath);
      logger.debug(`File deleted: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    logger.error('File deletion error:', error);
    return false;
  }
}

/**
 * Clean old files from upload directory
 */
export async function cleanOldFiles(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
  try {
    const { readdirSync, statSync } = await import('fs');
    const files = readdirSync(UPLOAD_DIR);
    let cleaned = 0;
    
    for (const file of files) {
      const filePath = join(UPLOAD_DIR, file);
      const stats = statSync(filePath);
      
      if (Date.now() - stats.mtime.getTime() > maxAge) {
        try {
          unlinkSync(filePath);
          cleaned++;
        } catch (error) {
          logger.warn(`Failed to delete old file: ${file}`, error);
        }
      }
    }
    
    if (cleaned > 0) {
      logger.info(`Cleaned ${cleaned} old files from upload directory`);
    }
    
    return cleaned;
    
  } catch (error) {
    logger.error('Error cleaning old files:', error);
    return 0;
  }
}

/**
 * Get file info
 */
export async function getFileInfo(filePath) {
  try {
    if (!existsSync(filePath)) {
      return null;
    }
    
    const { statSync } = await import('fs');
    const stats = statSync(filePath);
    
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      extension: extname(filePath),
      exists: true
    };
    
  } catch (error) {
    logger.error('Error getting file info:', error);
    return null;
  }
}

/**
 * Create temporary file with content
 */
export function createTempFile(content, extension = '.tmp') {
  try {
    const fileName = `temp_${randomBytes(8).toString('hex')}${extension}`;
    const filePath = join(UPLOAD_DIR, fileName);
    
    if (typeof content === 'string') {
      writeFileSync(filePath, content, 'utf8');
    } else {
      writeFileSync(filePath, content);
    }
    
    return {
      success: true,
      fileName,
      filePath
    };
    
  } catch (error) {
    logger.error('Error creating temp file:', error);
    throw error;
  }
}

/**
 * Validate file type by reading file signature
 */
export async function validateFileType(buffer) {
  try {
    const { fileTypeFromBuffer } = await import('file-type');
    const type = await fileTypeFromBuffer(buffer);
    
    return {
      detected: type?.ext || 'unknown',
      mime: type?.mime || 'application/octet-stream',
      valid: !!type
    };
    
  } catch (error) {
    logger.error('File type validation error:', error);
    return {
      detected: 'unknown',
      mime: 'application/octet-stream',
      valid: false
    };
  }
}

// Auto-cleanup old files every hour
setInterval(() => {
  cleanOldFiles();
}, 60 * 60 * 1000);