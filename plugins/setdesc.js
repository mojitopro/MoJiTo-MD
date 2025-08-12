/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
let handler = async (m, { conn, args, isBotAdmin, isAdmin, isOwner, isROwner }) => {
  if (!m.isGroup) throw '*[❗] Este comando solo funciona en grupos.*'
  if (!(isAdmin || isOwner || isROwner)) throw '*[❗] Solo los administradores pueden usar este comando.*'
  if (!isBotAdmin) throw '*[❗] El bot necesita ser administrador para cambiar la descripción.*'

  const newDesc = args.join(' ')
  if (!newDesc) throw '*❗ Debes escribir la nueva descripción del grupo.*\n\nEjemplo:\n.setdesc Grupo oficial de noticias 📰'

  if (newDesc.length > 500) throw '*❗ La descripción no puede tener más de 500 caracteres.*'

  try {
    await conn.groupUpdateDescription(m.chat, newDesc)
    m.reply('✅ *Descripción del grupo actualizada correctamente.*')
  } catch (e) {
    console.error(e)
    throw '*❌ No se pudo cambiar la descripción del grupo.*'
  }
}

handler.help = ['setdesc <nueva descripción>']
handler.tags = ['group']
handler.command = /^setdesc$/i
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler

