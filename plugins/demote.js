/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
let handler = async (m, { conn, participants, isAdmin, isOwner, isROwner, isBotAdmin }) => {
  if (!m.isGroup) throw '*[❗] Este comando solo se puede usar en grupos.*'
  if (!(isAdmin || isOwner || isROwner)) throw '*[❗] Solo los administradores pueden usar este comando.*'
  if (!isBotAdmin) throw '*[❗] El bot necesita ser administrador para degradar usuarios.*'

  const userToDemote = m.mentionedJid?.[0] || m.quoted?.sender
  if (!userToDemote) throw '*❗ Menciona o responde al usuario que deseas degradar.*'

  const metadata = await conn.groupMetadata(m.chat)
  const ownerId = (metadata.owner || metadata.participants.find(p => p.admin === 'superadmin')?.id)?.replace(/:\d+/, '')
  const userId = userToDemote.replace(/:\d+/, '')

  if (userId === ownerId) throw '*🚫 No puedes degradar al creador del grupo.*'
  if (userId === conn.user.jid.replace(/:\d+/, '')) throw '*🚫 No puedo degradarme a mí mismo.*'

  const isInGroup = participants.some(p => p.id.replace(/:\d+/, '') === userId)
  if (!isInGroup) throw '*❌ El usuario no está en este grupo.*'

  try {
    await conn.groupParticipantsUpdate(m.chat, [userToDemote], 'demote')
    await m.reply(`❌ Usuario degradado: @${userId.split('@')[0]}`, null, {
      mentions: [userToDemote]
    })
  } catch (e) {
    console.error(e)
    throw '*❌ No se pudo degradar al usuario.*'
  }
}

handler.help = ['demote @usuario']
handler.tags = ['group']
handler.command = /^(demote$|↓)$/i
handler.group = true
handler.admin = true
handler.botAdmin = true
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
export default handler

