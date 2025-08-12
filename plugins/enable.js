/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
const handler = async (m, { conn, args, usedPrefix, command, isROwner, isOwner }) => {
  const isEnable = /true|enable|(turn)?on|1/i.test(command)
  const chat = global.db.data.chats[m.chat] ?? {}
  const bot = global.db.data.settings[conn.user.jid] ?? {}
  const type = (args[0] || '').toLowerCase()
  let isAll = false

  const adminOnly = ['welcome', 'detect', 'detect2', 'antilink', 'antilink2', 'modohorny', 'modoadmin', 'autosticker', 'audios', 'antitoxic', 'antitraba', 'antiviewonce', 'antidelete', 'antiarabes', 'antiarabes2']
  const ownerOnly = ['public', 'restrict', 'modejadibot', 'autoread', 'pconly', 'gconly', 'swonly', 'anticall', 'antiprivado', 'audios_bot', 'modoia', 'antispam']

  const groupFeatures = [...adminOnly]

  if (!type) {
    throw `❗ Ejemplo de uso:\n${usedPrefix + command} welcome`
  }

  if (![...adminOnly, ...ownerOnly].includes(type)) {
    throw `⚠️ Opción no reconocida: *${type}*`
  }

  // Requiere admin en grupo
  if (m.isGroup && groupFeatures.includes(type)) {
    const metadata = await conn.groupMetadata(m.chat)
    const participant = metadata.participants.find(p => p.id === m.sender)
    const isAdmin = participant?.admin || false

    if (!(isAdmin || isOwner || isROwner)) {
      global.dfail('admin', m, conn)
      throw false
    }
  }

  // Requiere owner del bot
  if (ownerOnly.includes(type)) {
    if (!(isOwner || isROwner)) {
      global.dfail('owner', m, conn)
      throw false
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
    }
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
    isAll = true
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
  }
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */

  // Guardar cambios
  switch (type) {
    case 'welcome': chat.welcome = isEnable; break
    case 'detect': chat.detect = isEnable; break
    case 'detect2': chat.detect2 = isEnable; break
    case 'antilink': chat.antiLink = isEnable; break
    case 'antilink2': chat.antiLink2 = isEnable; break
    case 'modohorny': chat.modohorny = isEnable; break
    case 'modoadmin': chat.modoadmin = isEnable; break
    case 'autosticker': chat.autosticker = isEnable; break
    case 'audios': chat.audios = isEnable; break
    case 'antitoxic': chat.antiToxic = isEnable; break
    case 'antitraba': chat.antiTraba = isEnable; break
    case 'antiviewonce': chat.antiviewonce = isEnable; break
    case 'antidelete': chat.antidelete = isEnable; break
    case 'antiarabes': chat.antiArab = isEnable; break
    case 'antiarabes2': chat.antiArab2 = isEnable; break

    case 'public': global.opts.self = !isEnable; break
    case 'restrict': bot.restrict = isEnable; break
    case 'modejadibot': bot.modejadibot = isEnable; break
    case 'autoread': bot.autoread2 = isEnable; break
    case 'pconly': global.opts.pconly = isEnable; break
    case 'gconly': global.opts.gconly = isEnable; break
    case 'swonly': global.opts.swonly = isEnable; break
    case 'anticall': bot.antiCall = isEnable; break
    case 'antiprivado': bot.antiPrivate = isEnable; break
    case 'audios_bot': bot.audios_bot = isEnable; break
    case 'modoia': bot.modoia = isEnable; break
    case 'antispam': bot.antispam = isEnable; break
  }

  conn.sendMessage(m.chat, {
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
    text: `🗂️ OPCIÓN: *${type.toUpperCase()}*\n🎚️ ESTADO: *${isEnable ? 'ACTIVADO ✅' : 'DESACTIVADO ❌'}*\n📣 APLICADO A: *${isAll ? 'BOT GLOBAL' : 'ESTE CHAT'}*`
  }, { quoted: m })
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
}

/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
handler.help = ['enable <opción>', 'disable <opción>']
handler.tags = ['group', 'owner']
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
handler.command = /^((en|dis)able|(turn)?[01])$/i

export default handler

