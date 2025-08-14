import { WAMessage, WASocket } from '@whiskeysockets/baileys';
import { print } from '../utils/print';

interface LoadMessageContext {
  conn: WASocket;
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const handler = async (m: WAMessage, { conn }: LoadMessageContext) => {
  const empty = 'ㅤ';
  const frames = [
    `👉${empty.repeat(3)}`,
    `${empty}👌${empty.repeat(2)}`,
    `${empty.repeat(2)}👉${empty}`,
    `${empty.repeat(3)}👌`
  ];

  const rawSender = typeof m.key.participant === 'string' ? m.key.participant : m.key.remoteJid || '';
  const number = rawSender.split('@')[0];
  const mentionJid = rawSender;

  print.command('Load message animation triggered', 'troll', number);

  let sent = await conn.sendMessage(m.key.remoteJid!, {
    text: `Aquí va una señal para ti, @${number}...`,
    mentions: [mentionJid]
  }, { quoted: m });

  await delay(2500);

  for (let i = 0; i < 2; i++) {
    for (const frame of frames) {
      await delay(700);
      if (sent && sent.key) {
        await conn.sendMessage(m.key.remoteJid!, {
          text: frame,
          edit: sent.key
        });
      }
    }
  }

  if (sent && sent.key) {
    await conn.sendMessage(m.key.remoteJid!, {
      text: `¿Captas la indirecta? 😏 @${number}`,
      mentions: [mentionJid],
      edit: sent.key
    });
  }
};

export default {
  customPrefix: /^(TROLL|Troll|troll)$/i,
  command: false,
  handler,
  help: ['troll'],
  tags: ['fun'],
  description: 'Animación de mensaje trolleador'
};