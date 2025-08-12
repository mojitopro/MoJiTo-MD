/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
let handler = async (m, { conn, args, isBotAdmin, isAdmin, isOwner, isROwner }) => {
  if (!m.isGroup) throw '*[❗] Este comando solo funciona en grupos.*'
  if (!(isAdmin || isOwner || isROwner)) throw '*[❗] Solo los administradores pueden usar este comando.*'
  if (!isBotAdmin) throw '*[❗] El bot necesita ser administrador para cambiar el nombre del grupo.*'

  const newName = args.join(' ')
  if (!newName) throw '*❗ Debes escribir el nuevo nombre del grupo.*\n\nEjemplo:\n.setname Fiesta 🔥'

  if (newName.length > 75) throw '*❗ El nombre no puede tener más de 75 caracteres.*'

  try {
    await conn.groupUpdateSubject(m.chat, newName)
    m.reply(`✅ *Nombre del grupo actualizado a:*\n${newName}`)
  } catch (e) {
    console.error(e)
    throw '*❌ No se pudo cambiar el nombre del grupo.*'
  }
}

handler.help = ['setname <nuevo nombre>']
handler.tags = ['group']
handler.command = /^setname$/i
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler

