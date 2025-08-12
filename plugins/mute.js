/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
let handler = async (m, { conn, isAdmin, isOwner, isROwner, participants, command, args }) => {
  if (!m.isGroup) throw '*Este comando solo funciona en grupos.*'
  const chatId = m.chat
  if (!global.db.data.chats[chatId]) global.db.data.chats[chatId] = {}
  const chat = global.db.data.chats[chatId]
  if (!chat.mutedUsers || !Array.isArray(chat.mutedUsers)) chat.mutedUsers = []

  const text = m.text || ''
  const mention = m.mentionedJid?.[0] || (text.match(/@(\d{5,})/) ? text.match(/@(\d{5,})/)[1] + '@s.whatsapp.net' : null)

  console.log('Comando:', command)
  console.log('Mención detectada:', mention)
  console.log('MutedUsers antes:', chat.mutedUsers)

  if (/^mute$/i.test(command)) {
    if (!(isAdmin || isOwner || isROwner)) throw '*Solo administradores pueden silenciar.*'
    if (!mention) throw '*Debes mencionar a alguien para silenciar.*'
    if (chat.mutedUsers.includes(mention)) {
      chat.mutedUsers = chat.mutedUsers.filter(jid => jid !== mention)
      m.reply('🔊 Usuario ya estaba silenciado. Ahora ha sido des-silenciado.')
    } else {
      chat.mutedUsers.push(mention)
      m.reply('🔇 Usuario silenciado. Todos sus mensajes serán eliminados automáticamente.')
    }
    console.log('MutedUsers después:', chat.mutedUsers)
  }

  if (/^unmute$/i.test(command)) {
    if (!(isAdmin || isOwner || isROwner)) throw '*Solo administradores pueden des-silenciar.*'
    if (!mention) throw '*Debes mencionar a alguien para des-silenciar.*'
    if (!chat.mutedUsers.includes(mention)) throw '*Ese usuario no está silenciado.*'
    chat.mutedUsers = chat.mutedUsers.filter(jid => jid !== mention)
    m.reply('🔊 Usuario des-silenciado correctamente.')
    console.log('MutedUsers después:', chat.mutedUsers)
  }

  if (/^unmuteall$/i.test(command)) {
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
    if (!(isAdmin || isOwner || isROwner)) throw '*Solo administradores pueden usar este comando.*'
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
    if (!chat.mutedUsers.length) return m.reply('*No hay usuarios silenciados.*')
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
    chat.mutedUsers = []
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
    m.reply('🔊 Todos los usuarios han sido des-silenciados.')
    console.log('MutedUsers después:', chat.mutedUsers)
  }

  if (/^listmute$/i.test(command)) {
    if (!chat.mutedUsers.length) return m.reply('*No hay usuarios silenciados en este grupo.*')
    const list = chat.mutedUsers.map((jid, i) => {
      const name = participants.find(p => p.id === jid)?.name || jid.split('@')[0]
      return `${i + 1}. @${jid.split('@')[0]} (${name})`
    }).join('\n')
    return conn.reply(m.chat, `🔇 *Usuarios silenciados:*\n\n${list}`, m, { mentions: chat.mutedUsers })
  }
}

handler.command = /^(mute|unmute|unmuteall|listmute)$/i
handler.group = true
export default handler

