/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
const handler = async (m, { args, text, command, usedPrefix }) => {
  const setting = (args[0] || '').toLowerCase()
  const value = /true|enable|(on)/i.test(command)

  if (!m.isGroup) return m.reply('⚠️ Este comando solo funciona en grupos.')
  if (!isAdmin && !isOwner) return m.reply('⚠️ Solo los admins pueden usar este comando.')

  const chat = global.db.data.chats[m.chat]

  let response = ''

  switch (setting) {
    case 'detect':
      chat.detect = value
      response = `🔧 El modo *detect* ha sido ${value ? 'activado ✅' : 'desactivado ❌'}.`
      break
    case 'welcome':
      chat.welcome = value
      response = `👋 El modo *welcome* ha sido ${value ? 'activado ✅' : 'desactivado ❌'}.`
      break
    default:
      return m.reply(`⚙️ Usa uno de estos comandos:\n\n${usedPrefix}enable detect\n${usedPrefix}disable detect\n${usedPrefix}enable welcome\n${usedPrefix}disable welcome`)
  }

  m.reply(response)
}

handler.command = /^(enable|disable)\s?(detect|welcome)?$/i
handler.group = true
handler.admin = true
handler.tags = ['group']
handler.help = ['enable detect', 'disable welcome', 'enable welcome']

export default handler

