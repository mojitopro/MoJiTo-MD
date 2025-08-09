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
  
  // Crear función de procesamiento para uso global
  const messageProcessor = async (update) => {
    const { messages, type } = update;
    
    if (type !== 'notify') return;
    
    // Procesar cada mensaje de forma asíncrona
    for (const message of messages) {
      // Procesar en paralelo para máxima velocidad
      setImmediate(() => processMessage(conn, message));
    }
  };
  
  // Registrar globalmente para uso en connection
  global.messageHandler = messageProcessor;
  
  // Escuchar mensajes con máxima compatibilidad
  conn.ev.on('messages.upsert', messageProcessor);
  
  logger.info('✅ Message handler configurado y registrado globalmente');
}