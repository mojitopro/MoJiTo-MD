/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
let handler = async (m, { conn, participants, isAdmin, isOwner, isROwner, usedPrefix, command }) => {
  if (!m.isGroup) throw '*[❗] Este comando solo se puede usar en grupos.*'
  if (!(isAdmin || isOwner || isROwner)) throw '*[❗] Solo los administradores pueden usar este comando.*'

  const allMentions = participants.map(p => '@' + p.id.split('@')[0]).join(' ')
  const message = m.quoted?.text || m.text.split(/\s+/).slice(1).join(' ') || '*👥 Etiquetando a todos los miembros del grupo...*'

  await conn.sendMessage(m.chat, {
    text: `${message}\n\n${allMentions}`,
    mentions: participants.map(p => p.id),
  }, { quoted: m })
}

handler.help = ['tagall [mensaje]']
handler.tags = ['group']
handler.command = /^tagall$/i
handler.group = true
handler.admin = true

export default handler

