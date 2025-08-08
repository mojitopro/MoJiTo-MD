/**
 * Utilidades para procesamiento de mensajes
 */

export function getMessageText(message) {
  return message?.conversation || 
         message?.extendedTextMessage?.text || 
         message?.imageMessage?.caption || 
         message?.videoMessage?.caption || 
         message?.documentMessage?.caption ||
         '';
}

export function getMessageType(message) {
  if (message?.conversation) return 'conversation';
  if (message?.extendedTextMessage) return 'extendedTextMessage';
  if (message?.imageMessage) return 'imageMessage';
  if (message?.videoMessage) return 'videoMessage';
  if (message?.audioMessage) return 'audioMessage';
  if (message?.stickerMessage) return 'stickerMessage';
  if (message?.documentMessage) return 'documentMessage';
  if (message?.contactMessage) return 'contactMessage';
  if (message?.locationMessage) return 'locationMessage';
  if (message?.buttonsMessage) return 'buttonsMessage';
  if (message?.templateMessage) return 'templateMessage';
  if (message?.listMessage) return 'listMessage';
  if (message?.reactionMessage) return 'reactionMessage';
  return 'unknown';
}

export function isMediaMessage(mtype) {
  return ['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage', 'documentMessage'].includes(mtype);
}

export function getMediaType(mtype) {
  switch (mtype) {
    case 'imageMessage': return 'image';
    case 'videoMessage': return 'video';
    case 'audioMessage': return 'audio';
    case 'stickerMessage': return 'sticker';
    case 'documentMessage': return 'document';
    default: return null;
  }
}