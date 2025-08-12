/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
let handler = async (m, { conn, args, participants, isBotAdmin, isAdmin, isOwner, isROwner }) => {
  if (!m.isGroup) throw '*[❗] Este comando solo se puede usar en grupos.*'
  if (!(isAdmin || isOwner || isROwner)) throw '*[❗] Solo los administradores pueden usar este comando.*'
  if (!isBotAdmin) throw '*[❗] El bot necesita ser administrador para expulsar usuarios.*'

  const userToKick = m.mentionedJid?.[0] || m.quoted?.sender
  if (!userToKick) throw '*❗ Menciona o responde al mensaje del usuario que deseas expulsar.*'

  const metadata = await conn.groupMetadata(m.chat)
  const ownerId = metadata.owner || metadata.participants.find(p => p.admin === 'superadmin')?.id

  if (userToKick === ownerId) throw '*🚫 No se puede expulsar al creador del grupo.*'
  if (userToKick === conn.user.jid) throw '*🚫 No puedo expulsarme a mí mismo.*'

  const isTargetInGroup = participants.some(p => p.id === userToKick)
  if (!isTargetInGroup) throw '*⚠️ El usuario no está en este grupo.*'

  try {
    await conn.groupParticipantsUpdate(m.chat, [userToKick], 'remove')
    await m.reply(`👢 Usuario expulsado: @${userToKick.split('@')[0]}`, null, {
      mentions: [userToKick]
    })
  } catch (e) {
    console.error(e)
    throw '*❌ Ocurrió un error al intentar expulsar al usuario.*'
  }
}

handler.help = ['kick @usuario']
handler.tags = ['group']
handler.command = /^kick$/i
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler

