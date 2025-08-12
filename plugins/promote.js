/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
let handler = async (m, { conn, participants, isAdmin, isOwner, isROwner, isBotAdmin }) => {
  if (!m.isGroup) throw '*[❗] Este comando solo se puede usar en grupos.*'
  if (!(isAdmin || isOwner || isROwner)) throw '*[❗] Solo los administradores pueden usar este comando.*'
  if (!isBotAdmin) throw '*[❗] El bot necesita ser administrador para promover usuarios.*'

  const userToPromote = m.mentionedJid?.[0] || m.quoted?.sender
  if (!userToPromote) throw '*❗ Menciona o responde al usuario que deseas promover a admin.*'

  const metadata = await conn.groupMetadata(m.chat)
  const ownerId = (metadata.owner || metadata.participants.find(p => p.admin === 'superadmin')?.id)?.replace(/:\d+/, '')
  const userId = userToPromote.replace(/:\d+/, '')

  if (userId === ownerId) throw '*🚫 No puedes promover al creador, ya lo es por defecto.*'
  if (userId === conn.user.jid.replace(/:\d+/, '')) throw '*🚫 No puedo promoverme a mí mismo.*'

  const isInGroup = participants.some(p => p.id.replace(/:\d+/, '') === userId)
  if (!isInGroup) throw '*❌ El usuario no está en este grupo.*'

  try {
    await conn.groupParticipantsUpdate(m.chat, [userToPromote], 'promote')
    await m.reply(`✅ Promovido a admin: @${userId.split('@')[0]}`, null, {
      mentions: [userToPromote]
    })
  } catch (e) {
    console.error(e)
    throw '*❌ No se pudo promover al usuario.*'
  }
}

handler.help = ['promote @usuario']
handler.tags = ['group']
handler.command = /^(promote|↑)$/i
handler.group = true
handler.admin = true
handler.botAdmin = true
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
export default handler

