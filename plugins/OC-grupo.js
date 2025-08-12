/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
let handler = async (m, { conn, args, isAdmin, isBotAdmin, isOwner, isROwner }) => {
  if (!m.isGroup) throw '*[❗] Este comando solo se puede usar en grupos.*'
  if (!(isAdmin || isOwner || isROwner)) throw '*[❗] Solo los administradores pueden usar este comando.*'
  if (!isBotAdmin) throw '*[❗] El bot necesita ser administrador para cambiar los permisos del grupo.*'

  const command = args[0]?.toLowerCase()
  if (!['abrir', 'cerrar'].includes(command)) {
    throw '*❗ Usa el comando correctamente:* `.g abrir` o `.g cerrar`'
  }

  const action = command === 'abrir' ? 'not_announcement' : 'announcement'

  try {
    await conn.groupSettingUpdate(m.chat, action)
    m.reply(
      command === 'abrir'
        ? '✅ *Grupo abierto para todos los miembros.*'
        : '🔒 *Grupo cerrado. Solo administradores pueden enviar mensajes.*'
    )
  } catch (e) {
    console.error(e)
    throw '*❌ Error al cambiar el estado del grupo.*'
  }
}

handler.help = ['g abrir / cerrar']
handler.tags = ['g']
handler.command = /^g$/i
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler

