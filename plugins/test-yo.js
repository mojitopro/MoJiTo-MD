/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
let handler = async (m, { conn, participants }) => {
  if (!m.isGroup) throw '*[❗] Este comando solo se puede usar en grupos.*'

  // Normalizar ID del bot
  const botNumber = conn.user.jid.replace(/:\d+/, '') 

  const botParticipant = participants.find(p => p.id.replace(/:\d+/, '') === botNumber)

  let statusTexto = '❌ NO ES ADMINISTRADOR'

  if (botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin') {
    statusTexto = '✅ SÍ ES ADMINISTRADOR'
  }

  const botInfo = `*🤖 ESTADO DEL BOT EN ESTE GRUPO:*\n\n🆔 *ID:* ${botNumber}\n👥 *Grupo:* ${m.chat}\n\n🔧 *¿Es administrador?* ${statusTexto}`

  m.reply(botInfo)
}

handler.help = ['botadmin']
handler.tags = ['group']
handler.command = /^yo$/i
handler.group = true

export default handler

