/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
const handler = async (m, { conn }) => {
  console.log(`[DEBUG] Comando ${m.command} recibido de ${m.sender} en chat ${m.chat}`)

  try {
    if (!global.db?.data?.chats) return m.reply('No hay chats guardados en la base de datos.')

    const chats = Object.keys(global.db.data.chats)
    if (chats.length === 0) return m.reply('No hay chats en la base de datos.')

    let text = '📋 *Lista de chats y sus IDs:*\n\n'

    for (const chatId of chats) {
      let name = ''
      try {
        const metadata = await conn.groupMetadata(chatId)
        name = metadata.subject || ''
      } catch {
        // No es grupo
      }

      if (!name) {
        name = chatId.includes('@s.whatsapp.net') ? 'Chat privado' : 'Sin nombre'
      }

      text += `• ${name}\n  ID: ${chatId}\n\n`
    }

    if (text.length > 4000) {
      const chunks = text.match(/.{1,4000}/gs)
      for (const chunk of chunks) {
        await m.reply(chunk)
      }
    } else {
      await m.reply(text)
    }

  } catch (e) {
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
    console.error(e)
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
    m.reply('*❌ Error al listar chats.*')
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
  }
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
}

handler.command = ['listarchats', 'chatids']
handler.help = ['listarchats', 'chatids']
handler.tags = ['info']
handler.rowner = true
handler.register = false
handler.limit = false

export default handler

