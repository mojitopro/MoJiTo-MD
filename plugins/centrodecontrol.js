/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
import fs from 'fs'

const ALIAS_FILE = './src/aliases.json'
const OWNER = '5521989050540@s.whatsapp.net' // ← tu número completo

// Carga segura de alias desde archivo JSON
let chatAliases = {}
if (fs.existsSync(ALIAS_FILE)) {
  try {
    chatAliases = JSON.parse(fs.readFileSync(ALIAS_FILE, 'utf-8'))
  } catch {
    console.warn(`⚠️ Archivo ${ALIAS_FILE} corrupto o inválido, se usará un objeto vacío.`)
    chatAliases = {}
  }
}

function saveAliases() {
  try {
    fs.writeFileSync(ALIAS_FILE, JSON.stringify(chatAliases, null, 2))
  } catch (e) {
    console.error('❌ Error guardando aliases:', e)
  }
}

// Normaliza jid quitando ":49" si existe
function normalizeJid(jid = '') {
  if (typeof jid !== 'string') return ''
  return jid.split(':')[0]
}

// Añade sufijo correcto si falta
function fixJid(jid = '') {
  if (typeof jid !== 'string') return ''
  if (!jid.includes('@')) {
    if (/^\d{10,}$/.test(jid)) return jid + '@s.whatsapp.net' // número
    if (jid.includes('-')) return jid + '@g.us' // grupo
  }
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
  return jid
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
}
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */

/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
let handler = async (m, { conn, args = [], command }) => {
  const sender = normalizeJid(m.sender)
  if (sender !== OWNER) return // solo tú puedes usarlo

  // LISTAR CHATS EN CACHE PARA USAR EN ALIAS
  if (command === 'listchats') {
    try {
      if (!global.db?._msgCache) return m.reply('❌ No hay chats en caché para listar.')

      const chats = Object.keys(global.db._msgCache)
      if (chats.length === 0) return m.reply('❌ No hay chats en caché para listar.')

      let chatsText = '*📋 Chats y grupos disponibles:*\n\n'

      for (const jid of chats) {
        let name = ''
        try {
          if (jid.endsWith('@g.us')) {
            const metadata = await conn.groupMetadata(jid).catch(() => null)
            name = metadata?.subject || ''
          } else {
            const contact = conn.contacts?.[jid] || {}
            name = contact.name || contact.notify || ''
          }
        } catch {
          // ignorar error
        }
        chatsText += `• ${name || 'Sin nombre'}\n  ID: ${jid}\n\n`
      }

      return m.reply(chatsText)
    } catch (e) {
      console.error('❌ Error al listar chats:', e)
      return m.reply('❌ Error al listar chats.')
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
    }
  }
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */

  // SISTEMA DE ALIAS
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
  if (command === 'alias') {
    const sub = args[0]?.toLowerCase()
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
    const name = args[1]?.toLowerCase()
    let value = args[2]

    if (sub === 'add') {
      if (!name || !value) return m.reply('❌ Uso: .alias add <nombre> <chatID>')
      value = fixJid(value.toLowerCase())
      chatAliases[name] = value
      saveAliases()
      return m.reply(`✅ Alias "${name}" agregado con ID "${value}".`)
    }

    if (sub === 'del') {
      if (!name) return m.reply('❌ Uso: .alias del <nombre>')
      if (!chatAliases[name]) return m.reply('❌ Alias no encontrado.')
      delete chatAliases[name]
      saveAliases()
      return m.reply(`✅ Alias "${name}" eliminado.`)
    }

    if (sub === 'list') {
      if (Object.keys(chatAliases).length === 0) return m.reply('📭 No tienes alias guardados.')
      let list = Object.entries(chatAliases).map(([k, v]) => `• ${k} → ${v}`).join('\n')
      return m.reply('📒 Alias guardados:\n' + list)
    }

    return m.reply('❌ Subcomando inválido. Usa:\n.alias add/del/list')
  }

  // SISTEMA PARA EJECUTAR COMANDOS EN OTROS CHATS VIA ALIAS
  if (command === 'run') {
    if (args.length < 2) return m.reply('❌ Uso: .run <alias> <comando> [args]')
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */

    const alias = args[0].toLowerCase()
    const chatId = chatAliases[alias]
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */

    if (!chatId) return m.reply('❌ Alias no encontrado.')

/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
    const realCommand = args[1]
    const realArgs = args.slice(2)
    const fakeText = `${realCommand} ${realArgs.join(' ')}`.trim()
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */

    // Generar un id único para el mensaje falso, para evitar conflicto con id duplicados
    const fakeId = `fakeMsg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

    let fakeMsg = {
      ...m,
      key: {
        remoteJid: chatId,
        fromMe: true,           // El bot "envía" el mensaje
        id: fakeId,
        participant: OWNER
      },
      message: {
        conversation: fakeText
      },
      chat: chatId,
      sender: OWNER,
      fromMe: true
    }

    try {
      // Emite el mensaje simulado para que el bot lo procese
      conn.ev.emit('messages.upsert', {
        messages: [fakeMsg],
        type: 'notify'
      })

      return m.reply(`✅ Comando enviado a "${alias}": ${fakeText}`)
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
    } catch (e) {
      console.error('❌ Error enviando comando simulado:', e)
      return m.reply('❌ Error enviando comando simulado.')
    }
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
  }
}

handler.help = ['alias', 'run', 'listchats']
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
handler.tags = ['tools']
handler.command = ['alias', 'run', 'listchats']
handler.rowner = true

/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
export default handler

