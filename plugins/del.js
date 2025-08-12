/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
let handler = async (m, { conn, isAdmin, isOwner, isROwner, isBotAdmin }) => {
  if (!m.isGroup) throw '*Este comando solo funciona en grupos.*'
  if (!(isAdmin || isOwner || isROwner)) throw '*Solo los administradores pueden usar este comando.*'
  if (!isBotAdmin) throw '*El bot necesita ser administrador para borrar mensajes.*'
  if (!m.quoted) throw '*Debes responder a un mensaje válido para eliminarlo.*'

  try {
    const chat = m.chat
    const quoted = m.quoted
    const id = quoted.id || quoted.key?.id
    const participant = quoted.participant || quoted.key?.participant || quoted.sender

    if (!id || !participant) throw '❌ No se pudo identificar correctamente el mensaje.'

    await conn.sendMessage(chat, {
      delete: {
        remoteJid: chat,
        fromMe: false,
        id: id,
        participant: participant
      }
    })
  } catch (e) {
    console.error(e)
    throw '*❌ No se pudo eliminar el mensaje. Puede que WhatsApp no lo permita o que no tenga permisos suficientes.*'
  }
}

handler.help = ['del']
handler.tags = ['group']
handler.command = /^del$/i
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler

