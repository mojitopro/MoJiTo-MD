/**
 * Message utility functions
 */

export function getMessageText(message) {
  if (!message) return '';
  
  return message.conversation ||
         message.extendedTextMessage?.text ||
         message.imageMessage?.caption ||
         message.videoMessage?.caption ||
         message.documentMessage?.caption ||
         message.buttonsResponseMessage?.selectedButtonId ||
         message.listResponseMessage?.singleSelectReply?.selectedRowId ||
         message.templateButtonReplyMessage?.selectedId ||
         '';
}

export function getMessageType(message) {
  if (!message) return 'unknown';
  
  const types = Object.keys(message);
  return types[0] || 'unknown';
}

export function isCommand(text, prefixes = ['.', '/', '!', '#']) {
  if (!text) return false;
  return prefixes.some(prefix => text.startsWith(prefix));
}

export function extractCommand(text, prefixes = ['.', '/', '!', '#']) {
  if (!isCommand(text, prefixes)) return null;
  
  const usedPrefix = prefixes.find(prefix => text.startsWith(prefix));
  const command = text.slice(usedPrefix.length).split(' ')[0].toLowerCase();
  const args = text.slice(usedPrefix.length).split(' ').slice(1);
  
  return {
    command,
    args,
    usedPrefix,
    fullArgs: args.join(' ')
  };
}