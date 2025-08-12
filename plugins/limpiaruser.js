/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
let delay = ms => new Promise(res => setTimeout(res, ms))

let handler = async (m, { conn }) => {
  if (!m.isGroup) throw '*Este comando solo funciona en grupos.*'

  const chatId = m.chat
  const botId = conn.user.jid
  const userId = m.sender
  const mentionedUserId = m.mentionedJid?.[0] || m.text.split('@')[1] + '@s.whatsapp.net'

  if (!mentionedUserId) throw '*Debes mencionar un usuario para limpiar sus mensajes.*'

  const cache = global.db._msgCache?.[chatId]
  if (!cache || !cache.length) throw '*No hay mensajes recientes almacenados.*'

  const recentCache = [...cache].reverse() // Prioriza los más recientes

  let deleted = 0
  let total = 0
  const MAX = 50

  for (const msg of recentCache) {
    if (total >= MAX) break

    const sender = msg.key.fromMe ? botId : (msg.participant || msg.key.participant || msg.key.remoteJid)

    if (sender === mentionedUserId) {
      try {
        await conn.sendMessage(chatId, {
          delete: {
            remoteJid: chatId,
            fromMe: msg.key.fromMe,
            id: msg.key.id,
            participant: msg.participant || msg.key.participant || msg.key.remoteJid
          }
        })
        deleted++
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
        total++
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
        await delay(500) // Pausa entre cada eliminación
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
      } catch (e) {
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
        if (e?.message?.includes?.('rate-overlimit') || e?.output?.statusCode === 500) {
          // En caso de alcanzar el rate limit, no mostramos el error al grupo
          console.warn('⚠️ Rate limit alcanzado al eliminar mensajes.')
          await m.reply('*⚠️ Se alcanzó el límite de solicitudes. No se pudieron eliminar más mensajes.*')
        } else {
          console.error('❌ Error al eliminar mensaje:', e)
          await m.reply('*❌ Hubo un problema al eliminar algunos mensajes. Intenta más tarde.*')
        }
        await delay(1000) // Pausa mayor si hay error
      }
    }
  }

  await m.reply(`🧹 Se eliminaron ${deleted} mensajes del usuario @${mentionedUserId.split('@')[0]}.`)
}

handler.help = ['limpiar']
handler.tags = ['group']
handler.command = /^limp$/i
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler

