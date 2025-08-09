/**
 * SISTEMA DE MENSAJES ULTRA RÁPIDO - COMPATIBLE 100%
 */
import { logger } from '../services/logger.js';
import { processMessage } from './message-processor.js';

export function setupMessageHandler(conn) {
  if (!conn) {
    logger.error('❌ Connection not provided to message handler');
    return;
  }

  console.log('✅ Sistema de mensajes integrado correctamente');
  
  // Escuchar mensajes con máxima compatibilidad
  conn.ev.on('messages.upsert', async (update) => {
    const { messages, type } = update;
    
    if (type !== 'notify') return;
    
    // Procesar cada mensaje de forma asíncrona
    for (const message of messages) {
      // Procesar en paralelo para máxima velocidad
      setImmediate(() => processMessage(conn, message));
    }
  });
}