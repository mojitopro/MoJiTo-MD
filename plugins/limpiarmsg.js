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

  const cache = global.db._msgCache?.[chatId]
  if (!cache || !cache.length) throw '*No hay mensajes recientes almacenados.*'

  const recentCache = [...cache].reverse() // Prioriza mensajes recientes

  let deleted = 0
  let total = 0
  const MAX = 50

  for (const msg of recentCache) {
    if (total >= MAX) break

    const sender = msg.key.fromMe ? botId : (msg.participant || msg.key.participant || msg.key.remoteJid)

    if ([botId, userId].includes(sender)) {
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
        await delay(500)
      } catch (e) {
        total++
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
        if (e?.message?.includes?.('rate-overlimit') || e?.output?.statusCode === 500) {
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
          console.warn('⚠️ rate-overlimit al eliminar mensaje, se pausará.')
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
        } else {
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
          console.error('❌ Error al eliminar mensaje:', e)
        }
        await delay(1000)
      }
    }
  }

  await m.reply(`🧹 Se eliminaron ${deleted} mensajes recientes del bot y tuyos.`)
}

handler.help = ['limpiar']
handler.tags = ['group']
handler.command = /^limpiar$/i
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler

