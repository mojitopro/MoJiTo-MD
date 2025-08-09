/**
 * Ultra-fast group administration commands
 */

export async function handler(m, { conn, usedPrefix, command, args, isAdmin, isBotAdmin }) {
  if (!m.isGroup) {
    return conn.sendMessage(m.chat, { text: '❌ Este comando es solo para grupos, rey! 👥' });
  }

  const startTime = process.hrtime.bigint();

  switch (command) {
    case 'todos':
    case 'tagall':
    case 'everyone': {
      if (!isAdmin && !m.fromMe) {
        return conn.sendMessage(m.chat, { text: '⚠️ Solo admins pueden usar este comando, crack! 🔐' });
      }

      const groupMetadata = await conn.groupMetadata(m.chat);
      const participants = groupMetadata.participants;
      const mentions = participants.map(p => p.id);
      
      const responseTime = Number(process.hrtime.bigint() - startTime) / 1000000;
      
      const message = `
🚀 *CONVOCATORIA ÉPICA* 🚀

${args.join(' ') || '📢 ¡Todos convocados al chat! ¡Es momento de brillar! ✨'}

⚡ Procesado en ${responseTime.toFixed(1)}ms
👥 ${participants.length} miembros mencionados

*¡Nadie se escapa de esta notificación!* 🎯
`.trim();

      await conn.sendMessage(m.chat, { 
        text: message,
        mentions: mentions 
      });
      break;
    }

    case 'kick':
    case 'ban': {
      if (!isAdmin && !m.fromMe) {
        return conn.sendMessage(m.chat, { text: '⚠️ Solo admins pueden expulsar miembros! 🚫' });
      }
      
      if (!isBotAdmin) {
        return conn.sendMessage(m.chat, { text: '❌ Necesito ser admin para expulsar miembros! 🤖👑' });
      }

      const user = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null);
      if (!user) {
        return conn.sendMessage(m.chat, { text: `🎯 Usa: ${usedPrefix}kick @usuario\nO responde a un mensaje` });
      }

      try {
        await conn.groupParticipantsUpdate(m.chat, [user], 'remove');
        await conn.sendMessage(m.chat, { 
          text: `🚫 *EXPULSADO CON ÉXITO* 🚫\n\n👤 Usuario removido del grupo\n⚡ Acción completada en tiempo récord\n🎯 Orden y disciplina mantenidos!`,
          mentions: [user]
        });
      } catch (error) {
        await conn.sendMessage(m.chat, { text: '❌ Error al expulsar. Verifica que sea un miembro válido.' });
      }
      break;
    }

    case 'promote':
    case 'admin': {
      if (!isAdmin && !m.fromMe) {
        return conn.sendMessage(m.chat, { text: '⚠️ Solo admins pueden promover miembros! 👑' });
      }
      
      if (!isBotAdmin) {
        return conn.sendMessage(m.chat, { text: '❌ Necesito ser admin para promover miembros! 🤖' });
      }

      const user = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null);
      if (!user) {
        return conn.sendMessage(m.chat, { text: `👑 Usa: ${usedPrefix}promote @usuario\nO responde a un mensaje` });
      }

      try {
        await conn.groupParticipantsUpdate(m.chat, [user], 'promote');
        await conn.sendMessage(m.chat, { 
          text: `👑 *NUEVO ADMIN CORONADO* 👑\n\n🎉 ¡Felicidades por tu ascenso!\n⚡ Promoción procesada ultra rápido\n🔥 ¡Ahora tienes el poder!`,
          mentions: [user]
        });
      } catch (error) {
        await conn.sendMessage(m.chat, { text: '❌ Error al promover. El usuario ya podría ser admin.' });
      }
      break;
    }

    case 'demote':
    case 'deadmin': {
      if (!isAdmin && !m.fromMe) {
        return conn.sendMessage(m.chat, { text: '⚠️ Solo admins pueden degradar miembros! 📉' });
      }
      
      if (!isBotAdmin) {
        return conn.sendMessage(m.chat, { text: '❌ Necesito ser admin para degradar miembros! 🤖' });
      }

      const user = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null);
      if (!user) {
        return conn.sendMessage(m.chat, { text: `📉 Usa: ${usedPrefix}demote @usuario\nO responde a un mensaje` });
      }

      try {
        await conn.groupParticipantsUpdate(m.chat, [user], 'demote');
        await conn.sendMessage(m.chat, { 
          text: `📉 *ADMIN DEGRADADO* 📉\n\n😔 Adiós a los poderes de admin\n⚡ Degradación ultra rápida\n🎯 De vuelta a miembro regular`,
          mentions: [user]
        });
      } catch (error) {
        await conn.sendMessage(m.chat, { text: '❌ Error al degradar. El usuario podría no ser admin.' });
      }
      break;
    }

    case 'grupo':
    case 'group': {
      if (!isAdmin && !m.fromMe) {
        return conn.sendMessage(m.chat, { text: '⚠️ Solo admins pueden cambiar configuración del grupo! ⚙️' });
      }
      
      if (!isBotAdmin) {
        return conn.sendMessage(m.chat, { text: '❌ Necesito ser admin para cambiar configuración! 🤖' });
      }

      const action = args[0]?.toLowerCase();
      if (!['abrir', 'cerrar', 'open', 'close'].includes(action)) {
        return conn.sendMessage(m.chat, { 
          text: `⚙️ Usa: ${usedPrefix}grupo abrir/cerrar\n\n🔓 abrir - Todos pueden escribir\n🔒 cerrar - Solo admins pueden escribir` 
        });
      }

      const setting = ['abrir', 'open'].includes(action) ? 'not_announcement' : 'announcement';
      const status = setting === 'not_announcement' ? 'ABIERTO 🔓' : 'CERRADO 🔒';
      const description = setting === 'not_announcement' ? 
        'Todos los miembros pueden enviar mensajes' : 
        'Solo los admins pueden enviar mensajes';

      try {
        await conn.groupSettingUpdate(m.chat, setting);
        await conn.sendMessage(m.chat, { 
          text: `⚙️ *GRUPO ${status}* ⚙️\n\n🎯 ${description}\n⚡ Cambio aplicado instantáneamente\n🔥 ¡Configuración ultra rápida!`
        });
      } catch (error) {
        await conn.sendMessage(m.chat, { text: '❌ Error al cambiar configuración del grupo.' });
      }
      break;
    }
  }
}

export const help = ['todos', 'tagall', 'kick', 'ban', 'promote', 'demote', 'grupo'];
export const tags = ['group', 'admin'];
export const command = /^(todos|tagall|everyone|kick|ban|promote|admin|demote|deadmin|grupo|group)$/i;