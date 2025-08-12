/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
let handler = async (m, { conn, args, isAdmin, isROwner, isOwner, isBotAdmin }) => {
  if (!m.isGroup) throw '*[❗] Este comando solo se puede usar en grupos.*'
  if (!(isAdmin || isOwner || isROwner)) throw '*[❗] Solo los administradores pueden activar o desactivar la bienvenida.*'

  const estado = args[0]?.toLowerCase()
  if (!['on', 'off'].includes(estado)) throw '*❗ Usa `.welcome on` para activar o `.welcome off` para desactivar.*'

  global.db.data.chats[m.chat].welcome = estado === 'on'

  m.reply(`✅ Función de bienvenida *${estado === 'on' ? 'activada' : 'desactivada'}* correctamente.`)
}

handler.help = ['welcome on/off']
handler.tags = ['group']
handler.command = /^welcome$/i
handler.group = true
handler.admin = true

export default handler

