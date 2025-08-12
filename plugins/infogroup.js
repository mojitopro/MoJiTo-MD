/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
let handler = async (m, { conn }) => {
  if (!m.isGroup) throw '*[❗] Este comando solo se puede usar en grupos.*'

  const metadata = await conn.groupMetadata(m.chat)
  const groupName = metadata.subject
  const groupId = m.chat
  const groupDesc = metadata.desc?.toString() || '*Sin descripción*'
  const owner = metadata.owner || metadata.participants.find(p => p.admin === 'superadmin')?.id
  const admins = metadata.participants.filter(p => p.admin)
  const creationTime = new Date(metadata.creation * 1000).toLocaleString('es-ES', { timeZone: 'America/Sao_Paulo' })

  let info = `
*📛 NOMBRE:* ${groupName}
🆔 *ID:* ${groupId}
📅 *Creado:* ${creationTime}
👑 *Owner:* ${owner ? '@' + owner.split('@')[0] : '*No encontrado*'}
👥 *Miembros:* ${metadata.participants.length}
🔧 *Admins:* ${admins.length}
📝 *Descripción:* 
${groupDesc}
`.trim()

  await conn.sendMessage(m.chat, {
    text: info,
    mentions: owner ? [owner] : [],
  }, { quoted: m })
}

handler.help = ['infogrupo']
handler.tags = ['group']
handler.command = /^infogrupo$/i
handler.group = true

export default handler

