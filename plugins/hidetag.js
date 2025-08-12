/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
let handler = async (m, { conn, participants, isAdmin, isOwner, isROwner, isBotAdmin, args }) => {
  if (!m.isGroup) throw '*[❗] Este comando solo se puede usar en grupos.*'
  if (!(isAdmin || isOwner || isROwner)) throw '*[❗] Solo los administradores pueden usar este comando.*'
  if (!isBotAdmin) throw '*[❗] El bot necesita ser administrador para mencionar a todos.*'

  const text = args.join(' ') || (m.quoted?.text || '').trim()
  if (!text) throw '*❗ Escribe el mensaje que deseas enviar con menciones ocultas.*'

  const users = participants.map(p => p.id).filter(v => v !== conn.user.jid)

  await conn.sendMessage(m.chat, {
    text,
    mentions: users
  }, { quoted: m })
}

handler.help = ['hidetag <mensaje>']
handler.tags = ['group']
handler.command = /^hidetag$/i
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler

