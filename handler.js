






import { smsg } from './lib/simple.js'
import { format } from 'util'
import path, { join } from 'path'
import { pathToFileURL, fileURLToPath } from 'url'

// ✅ Carga dinámica de plugins
import { unwatchFile, watchFile } from 'fs'
import chalk from 'chalk'
import fs from 'fs'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ___dirname = path.join(__dirname, './plugins')  // <== Agrega esta línea


const { proto } = (await import('@whiskeysockets/baileys')).default
const isNumber = x => typeof x === 'number' && !isNaN(x)
const delay = ms => isNumber(ms) && new Promise(resolve => setTimeout(function () {
    clearTimeout(this)
    resolve()
}, ms))

export async function handler(chatUpdate, conn) {
  conn.msgqueque = conn.msgqueque || []
  if (!chatUpdate?.messages?.length || typeof chatUpdate.messages[0] !== 'object') return

  let m
  try {
    const messages = chatUpdate.messages
    m = messages[messages.length - 1]

    if (!m.message) return
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
    if (m.key.fromMe && typeof m.message?.conversation === 'string' && !new RegExp(global.prefix).test(m.message.conversation)) return
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */

/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
    // --- FILTRO PARA SILENCIADOS ---
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
    if (m.isGroup) {
      const chat = global.db.data.chats[m.chat]
      if (chat?.mutedUsers?.includes(m.sender)) {
        try {
          await conn.sendMessage(m.chat, { delete: m.key })
          return // No procesar más este mensaje
        } catch (e) {
          return // Ignorar si no se puede borrar
        }
      }

    }
    // --- FIN FILTRO ---

    if (!global.db.data) {
      await global.loadDatabase()
    }

    const msg = smsg(conn, m) || m
    m = msg
    try {
      if (!global.db._msgCache) global.db._msgCache = {}
      const cache = global.db._msgCache[m.chat] ||= []
      cache.push(m)
      if (cache.length > 100) cache.shift()
    } catch (e) {
      console.error('[❌ Error guardando mensajes en caché]', e)
    }
    msg.exp = 0
    msg.limit = false

    // 🧹 Registrar mensajes enviados por el bot (para limpieza posterior)
    global.botMessages = global.botMessages || {}
    if (!global.botMessages[m.chat]) global.botMessages[m.chat] = []
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */

    // Resto del handler...
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */

if (m.key.fromMe && m.message) {
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
  global.botMessages[m.chat].push(m.key)
  if (global.botMessages[m.chat].length > 30) global.botMessages[m.chat].shift()
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
}

    // 🔇 AUTODELETE A USUARIOS MUTEADOS (callados)
try {
  const chatId = m.chat
  const senderId = m.sender
  const isGroup = m.isGroup

  const muted = global.db?.data?.chats?.[chatId]?.mutedUsers || []

  if (isGroup && muted.includes(senderId)) {
    await conn.sendMessage(chatId, {
      delete: {
        remoteJid: chatId,
        fromMe: false,
        id: m.key.id,
        participant: m.participant || m.key.participant || m.sender
      }
    })
    return
  }

} catch (err) {
  console.error('[❌ Error auto-delete muteado]:', err)
}
    try {
      global.db.data.users[m.sender] = global.db.data.users[m.sender] || {}
      global.db.data.chats[m.chat] = global.db.data.chats[m.chat] || {}
      global.db.data.settings[conn.user.jid] = global.db.data.settings[conn.user.jid] || {}

      const user = global.db.data.users[m.sender]
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
      const chat = global.db.data.chats[m.chat]
      const settings = global.db.data.settings[conn.user.jid]

/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
      if (user.exp == null) user.exp = 0
      if (user.limit == null) user.limit = 10
      if (user.lastclaim == null) user.lastclaim = 0
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
      if (user.registered == null) user.registered = false
      if (!user.registered) {
        if (user.name == null) user.name = m.name
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
        if (user.age == null) user.age = -1
        if (user.regTime == null) user.regTime = -1
      }
      if (user.afk == null) user.afk = -1
      if (user.afkReason == null) user.afkReason = ''
      if (user.banned == null) user.banned = false
      if (user.warn == null) user.warn = 0
      if (user.level == null) user.level = 0
      if (user.role == null) user.role = 'Novato'
      if (user.autolevelup == null) user.autolevelup = true
      if (user.money == null) user.money = 0
      if (user.health == null) user.health = 100
      if (user.potion == null) user.potion = 0
      if (user.trash == null) user.trash = 0
      if (user.wood == null) user.wood = 0
      if (user.rock == null) user.rock = 0
      if (user.string == null) user.string = 0
      if (user.petFood == null) user.petFood = 0
      if (user.emerald == null) user.emerald = 0
      if (user.diamond == null) user.diamond = 0
      if (user.gold == null) user.gold = 0
      if (user.iron == null) user.iron = 0
      if (user.common == null) user.common = 0
      if (user.uncommon == null) user.uncommon = 0
      if (user.mythic == null) user.mythic = 0
      if (user.legendary == null) user.legendary = 0
      if (user.pet == null) user.pet = 0
      if (user.horse == null) user.horse = 0
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
      if (user.horseexp == null) user.horseexp = 0
      if (user.cat == null) user.cat = 0
      if (user.catexp == null) user.catexp = 0
      if (user.fox == null) user.fox = 0
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */

      if (user.foxexp == null) user.foxexp = 0
      if (user.dog == null) user.dog = 0
      if (user.dogexp == null) user.dogexp = 0
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
      if (user.horselastfeed == null) user.horselastfeed = 0
      if (user.catlastfeed == null) user.catlastfeed = 0
      if (user.foxlastfeed == null) user.foxlastfeed = 0
      if (user.doglastfeed == null) user.doglastfeed = 0
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
      if (user.armor == null) user.armor = 0
      if (user.armordurability == null) user.armordurability = 0
      if (user.sword == null) user.sword = 0
      if (user.sworddurability == null) user.sworddurability = 0
      if (user.pickaxe == null) user.pickaxe = 0
      if (user.pickaxedurability == null) user.pickaxedurability = 0
      if (user.fishingrod == null) user.fishingrod = 0
      if (user.fishingroddurability == null) user.fishingroddurability = 0
      if (user.lastadventure == null) user.lastadventure = 0
      if (user.lastfishing == null) user.lastfishing = 0
      if (user.lastdungeon == null) user.lastdungeon = 0
      if (user.lastduel == null) user.lastduel = 0
      if (user.lastmining == null) user.lastmining = 0
      if (user.lasthunt == null) user.lasthunt = 0
      if (user.lastweekly == null) user.lastweekly = 0
      if (user.lastmonthly == null) user.lastmonthly = 0

      if (chat.isBanned == null) chat.isBanned = false
      if (chat.welcome == null) chat.welcome = true
      if (chat.detect == null) chat.detect = true
      if (chat.sWelcome == null) chat.sWelcome = ''
      if (chat.sBye == null) chat.sBye = ''
      if (chat.sPromote == null) chat.sPromote = ''
      if (chat.sDemote == null) chat.sDemote = ''
      if (chat.delete == null) chat.delete = true
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
      if (chat.modohorny == null) chat.modohorny = false
      if (chat.autosticker == null) chat.autosticker = false
      if (chat.audios == null) chat.audios = false
      if (chat.antiLink == null) chat.antiLink = false
      if (chat.antiLink2 == null) chat.antiLink2 = false
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
      if (chat.antiviewonce == null) chat.antiviewonce = false
      if (chat.antiToxic == null) chat.antiToxic = false
      if (chat.expired == null) chat.expired = 0

      if (settings.self == null) settings.self = false
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
      if (settings.autoread == null) settings.autoread = false
      if (settings.restrict == null) settings.restrict = true

    } catch (e) {
      console.error(e)
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
    }



    if (opts['nyimak']) return
    if (!m.fromMe && opts['self']) return
    if (opts['pconly'] && m.chat.endsWith('g.us')) return
    if (opts['gconly'] && !m.chat.endsWith('g.us')) return
    if (opts['swonly'] && m.chat !== 'status@broadcast') return
    if (typeof m.text !== 'string') m.text = ''

        const normalizeJid = jid => jid.replace(/:\d+/, '')
const isROwner = [
  normalizeJid(conn.decodeJid(global.conn?.user?.id || conn.user?.id || '')), 
  ...(Array.isArray(global.owner) ? global.owner.map(([n]) => normalizeJid(n + '@s.whatsapp.net')) : [])
].includes(normalizeJid(m.sender))


        const isOwner = isROwner || m.fromMe
        const isMods = isOwner || global.mods.map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)
        const isPrems = isROwner || global.prems.map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
        if (opts['queque'] && m.text && !(isMods || isPrems)) {
            let queque = this.msgqueque || (this.msgqueque = [])
let time = 1000 * 5
const previousID = queque.length ? queque[queque.length - 1] : null

            queque.push(m.id || m.key.id)
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
            setInterval(async function () {
                if (previousID && queque.indexOf(previousID) === -1) clearInterval(this)

                await delay(time)
            }, time)
        }
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */

        if (m.isBaileys)
            return
        m.exp += Math.ceil(Math.random() * 10)

        let usedPrefix
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
let _user = global.db.data && global.db.data.users && global.db.data.users[m.sender]

conn.chats = conn.chats || {}

// ✅ Asegúrate de definir groupMetadata primero
const groupMetadata = (m.isGroup ? ((conn.chats?.[m.chat] || {}).metadata || await conn.groupMetadata(m.chat).catch(_ => null)) : {}) || {}
const participants = (m.isGroup ? groupMetadata.participants : []) || []

// ✅ Ahora sí puedes usar conn.decodeJid correctamente
const cleanSender = (conn.decodeJid?.(m.sender) || m.sender || '').replace(/:\d+/, '') // ← actualiza m.sender globalmente
const sender = m.sender // ← ya está limpio aquí

const botNumber = (conn.decodeJid?.(conn.user?.id || '') || conn.user?.id || '').replace(/:\d+/, '')


const user = (m.isGroup ? participants.find(u => conn.decodeJid(u.id) === sender) : {}) || {}
const bot = (m.isGroup
  ? participants.find(u => conn.decodeJid(u.id).replace(/:\d+/, '') === botNumber)
  : {}) || {}
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */

const isRAdmin = user?.admin === 'superadmin' || false
const isAdmin = isRAdmin || user?.admin === 'admin' || false
const isBotAdmin = bot?.admin === 'admin' || bot?.admin === 'superadmin' || false

        
        
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
        for (let name in global.plugins) {
  let plugin = global.plugins[name]
  if (!plugin || plugin.disabled) continue

  const __filename = join(___dirname, name)
  const __dirname = ___dirname

/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
  if (typeof plugin.all === 'function') {
    try {
      await plugin.all.call(this, m, {
        chatUpdate,
        __dirname,
        __filename
      })
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
    } catch (e) {
      console.error(e)
      for (let [jid] of global.owner.filter(([number, _, isDev]) => isDev && number)) {
        let data = (await conn.onWhatsApp(jid))[0] || {}
        if (data.exists)
          m.reply(`PLUGIN: ${name}\nUSUARIO: ${m.sender}\nCOMANDO: ${m.text}\n\nERROR:\n${format(e)}`, data.jid)
      }
    }
  }
            if (!opts['restrict'])
  if (plugin.tags && plugin.tags.includes('admin')) {
    continue
  }

const str2Regex = str => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
let _prefix = plugin.customPrefix
  ? plugin.customPrefix
  : conn.prefix
  ? conn.prefix
  : global.prefix

let match = (_prefix instanceof RegExp
  ? [[_prefix.exec(m.text), _prefix]]
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
  : Array.isArray(_prefix)

  ? _prefix.map(p => {
      let re = p instanceof RegExp ? p : new RegExp(str2Regex(p))
      return [re.exec(m.text), re]
    })
  : typeof _prefix === 'string'
  ? [[new RegExp(str2Regex(_prefix)).exec(m.text), new RegExp(str2Regex(_prefix))]]
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
  : [[[], new RegExp()]])
  .find(p => p[1] && p[0])

// Permitir comandos sin prefijo si el plugin no lo requiere
let allowNoPrefix = false

let executed = false

/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
if (!executed && !m.isCommand) {
  for (let name in global.plugins) {
    let plugin = global.plugins[name]
    if (!plugin || plugin.disabled) continue

    const _prefix = plugin.customPrefix
    if (!_prefix || plugin.command !== false) continue

    let matched = false
    let usedPrefix = ''

    if (_prefix instanceof RegExp) {
      matched = _prefix.test(m.text)
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
    }

    if (matched) {
    //  console.log(`[✅ Ejecutando plugin con customPrefix]: ${name} | Texto: ${m.text}`)
      try {
        const pluginFunction =
          typeof plugin === 'function'
            ? plugin
            : plugin.default || plugin.handler
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */

        await pluginFunction.call(conn, m, {
          args: [],
          text: m.text,
          command: '',
          usedPrefix,
          conn,
        })

/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
        m.isCommand = true
        m.plugin = name
        executed = true
        break
      } catch (e) {

        console.error(e)
        m.reply('*❗ Error en plugin customPrefix:* ' + e.message)
      }
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
    }
  }
}

if (!executed && !match) continue

if (typeof plugin.before === 'function') {
  const shouldSkip = await plugin.before.call(this, m, {
    match,
    conn: this,
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
    participants,
    groupMetadata,
    user,
    bot,
    isROwner,
    isOwner,
    isRAdmin,
    isAdmin,
    isBotAdmin,
    isPrems,
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
    chatUpdate,
    __dirname: ___dirname,
    __filename
  })
  if (shouldSkip) return
}

if (typeof plugin !== 'function' && typeof plugin !== 'object') return

const pluginFunction = typeof plugin === 'function' ? plugin : (typeof plugin.default === 'function' ? plugin.default : null)
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */

if (!pluginFunction) return

let noPrefix = m.text || ''
let command = ''
let args = []
let text = ''
let isCustomPrefix = false

if (plugin.customPrefix) {
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
  const matchCustom = (
    (plugin.customPrefix instanceof RegExp && plugin.customPrefix.test(noPrefix)) ||
    (typeof plugin.customPrefix === 'function' && plugin.customPrefix(noPrefix)) ||
    (Array.isArray(plugin.customPrefix) && plugin.customPrefix.some(p => typeof p === 'string' ? p === noPrefix : p instanceof RegExp && p.test(noPrefix))) ||
    (typeof plugin.customPrefix === 'string' && plugin.customPrefix === noPrefix)
  )
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */

  if (matchCustom) {
    command = noPrefix
    args = []
    text = ''
    isCustomPrefix = true
  }
}

if (!isCustomPrefix && match && (usedPrefix = (match[0] || '')[0])) {
  noPrefix = m.text.replace(usedPrefix, '')
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
  let _args = noPrefix.trim().split(/\s+/g)
  command = (_args.shift() || '').toLowerCase()
  args = _args
  text = _args.join(' ')


  let fail = plugin.fail || global.dfail

  let isAccept =
  !plugin.command ? true :  // ← Si no hay command (por ejemplo, cuando solo usa customPrefix), se acepta
  plugin.command instanceof RegExp
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
    ? plugin.command.test(command)
    : Array.isArray(plugin.command)
    ? plugin.command.some(cmd => cmd instanceof RegExp ? cmd.test(command) : cmd === command)
    : typeof plugin.command === 'string'
    ? plugin.command === command
    : false

                if (!isAccept)
                    continue
                m.plugin = name
                if (m.chat in global.db.data.chats || m.sender in global.db.data.users) {
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
                    let chat = global.db.data.chats[m.chat]
                    let user = global.db.data.users[m.sender]
                    if (name != 'owner-unbanchat.js' && chat?.isBanned)
                        return // Except this
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
                    if (name != 'owner-unbanuser.js' && user?.banned)
                        return
                }
                if (plugin.rowner && plugin.owner && !(isROwner || isOwner)) { // Both Owner
                    fail('owner', m, this)
                    continue
                }
                if (plugin.rowner && !isROwner) { // Real Owner
                    fail('rowner', m, this)
                    continue
                }
                if (plugin.owner && !isOwner) { // Number Owner
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
                    fail('owner', m, this)
                    continue

                }
                if (plugin.mods && !isMods) { // Moderator
                    fail('mods', m, this)
                    continue
                }
                if (plugin.premium && !isPrems) { // Premium
                    fail('premium', m, this)
                    continue
                }
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
                if (plugin.group && !m.isGroup) { // Group Only
                    fail('group', m, this)
                    continue
                } else if (plugin.botAdmin && !isBotAdmin) { // You Admin
                    fail('botAdmin', m, this)
                    continue
                } else if (plugin.admin && !isAdmin) { // User Admin
                    fail('admin', m, this)
                    continue
                }
                if (plugin.private && m.isGroup) { // Private Chat Only
                    fail('private', m, this)
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
                    continue
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
                }
                if (plugin.register == true && _user.registered == false) { // Butuh daftar?
                    fail('unreg', m, this)
                    continue
                }
                m.isCommand = true
                let xp = 'exp' in plugin ? parseInt(plugin.exp) : 17 // XP Earning per command
                if (xp > 200)
                    m.reply('Ngecit -_-') // Hehehe
                else
                    m.exp += xp
                if (!isPrems && plugin.limit && global.db.data.users[m.sender].limit < plugin.limit * 1) {
                    this.reply(m.chat, `*[❗𝐈𝐍𝐅𝐎 ❗] 𝚂𝚄𝚂 𝙳𝙸𝙰𝙼𝙰𝙽𝚃𝙴𝚂 𝚂𝙴 𝙷𝙰𝙽 𝙰𝙶𝙾𝚃𝙰𝙳𝙾, 𝙿𝚄𝙴𝙳𝙴 𝙲𝙾𝙼𝙿𝚁𝙰𝚁 𝙼𝙰𝚂 𝚄𝚂𝙰𝙽𝙳𝙾 𝙴𝙻 𝙲𝙾𝙼𝙰𝙽𝙳𝙾 ${usedPrefix}buy <cantidad>*`, m)
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
                    continue // Limit habis
                }
                if (plugin.level > _user.level) {
                    this.reply(m.chat, `*[❗𝐈𝐍𝐅𝐎 ❗] 𝚂𝙴 𝚁𝙴𝚀𝚄𝙸𝙴𝚁𝙴 𝙴𝙻 𝙽𝙸𝚅𝙴𝙻 ${plugin.level} 𝙿𝙰𝚁𝙰 𝚄𝚂𝙰𝚁 𝙴𝚂𝚃𝙴 𝙲𝙾𝙼𝙰𝙽𝙳𝙾. 𝚃𝚄 𝙽𝙸𝚅𝙴𝙻 𝙴𝚂 ${_user.level}*`, m)
                    continue // If the level has not been reached
                }
                let extra = {
                    match,
                    usedPrefix,
                    noPrefix,
                    _args,
                    args,
                    command,
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
                    text,
                    conn: this,

                    participants,
                    groupMetadata,
                    user,
                    bot,
                    isROwner,
                    isOwner,
                    isRAdmin,
                    isAdmin,
                    isBotAdmin,
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
                    isPrems,
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
                    chatUpdate,
                    __dirname: ___dirname,
                    __filename
                }
                try {
                    // Asignar al mensaje las propiedades necesarias para los plugins modernos
m.usedPrefix = usedPrefix
m.command = command
m.args = args
console.log('[🔎 Ejecutando plugin]:', name)
await pluginFunction.call(this, m, extra)

/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */

                    if (!isPrems)
                        m.limit = m.limit || plugin.limit || false
                } catch (e) {
                    // Error occured
                    m.error = e
                    console.error(e)
                    if (e) {
                        let text = format(e)
                        for (let key of Object.values(global.APIKeys))
                            text = text.replace(new RegExp(key, 'g'), '#HIDDEN#')
                        if (e.name)
                            for (let [jid] of global.owner.filter(([number, _, isDeveloper]) => isDeveloper && number)) {
                                let data = (await conn.onWhatsApp(jid))[0] || {}
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
                                if (data.exists)
                                    m.reply(`*[ ⚠️ 𝚁𝙴𝙿𝙾𝚁𝚃𝙴 𝙳𝙴 𝙲𝙾𝙼𝙰𝙽𝙳𝙾 𝙲𝙾𝙽 𝙵𝙰𝙻𝙻𝙾𝚂 ⚠️ ]*\n\n*—◉ 𝙿𝙻𝚄𝙶𝙸𝙽:* ${m.plugin}\n*—◉ 𝚄𝚂𝚄𝙰𝚁𝙸𝙾:* ${m.sender}\n*—◉ 𝙲𝙾𝙼𝙰𝙽𝙳𝙾:* ${usedPrefix}${command} ${args.join(' ')}\n\n\`\`\`${text}\`\`\`\n\n*[❗] 𝚁𝙴𝙿𝙾𝚁𝚃𝙴𝙻𝙾 𝙰𝙻 𝙲𝚁𝙴𝙰𝙳𝙾𝚁 𝙳𝙴𝙻 𝙱𝙾𝚃 𝙿𝙰𝚁𝙰 𝙳𝙰𝚁𝙻𝙴 𝚄𝙽𝙰 𝚂𝙾𝙻𝚄𝙲𝙸𝙾𝙽, 𝙿𝚄𝙴𝙳𝙴 𝚄𝚂𝙰𝚁 𝙴𝙻 𝙲𝙾𝙼𝙰𝙽𝙳𝙾 #reporte*`.trim(), data.jid)
                            }
                        m.reply(text)
                    }
                } finally {
                    // m.reply(util.format(_user))
                    if (typeof plugin.after === 'function') {
                        try {
                            await plugin.after.call(this, m, extra)
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
                        } catch (e) {
                            console.error(e)
                        }
                    }
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */

                    if (m.limit)
                        m.reply(+m.limit + 'Diamante Usado 💎')
                }
                break
            }
        }
    } catch (e) {
        console.error(e)
    } finally {
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
        if (opts['queque'] && m.text) {
            const quequeIndex = this.msgqueque.indexOf(m.id || m.key.id)
            if (quequeIndex !== -1)
                this.msgqueque.splice(quequeIndex, 1)
        }
        //console.log(global.db.data.users[m.sender])
        let user, stats = global.db.data.stats
        if (m) {
            if (m.sender && (user = global.db.data.users[m.sender])) {
                user.exp += m.exp
                user.limit -= m.limit * 1
            }

            let stat
            if (m.plugin) {
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
                let now = +new Date
                if (m.plugin in stats) {
                    stat = stats[m.plugin]
                    if (!isNumber(stat.total))
                        stat.total = 1
                    if (!isNumber(stat.success))
                        stat.success = m.error != null ? 0 : 1
                    if (!isNumber(stat.last))
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
                        stat.last = now
                    if (!isNumber(stat.lastSuccess))
                        stat.lastSuccess = m.error != null ? 0 : now
                } else
                    stat = stats[m.plugin] = {
                        total: 1,
                        success: m.error != null ? 0 : 1,
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
                        last: now,
                        lastSuccess: m.error != null ? 0 : now
                    }
                stat.total += 1
                stat.last = now
                if (m.error == null) {
                    stat.success += 1
                    stat.lastSuccess = now
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
                }
            }
        }


        try {
            if (!opts['noprint']) await (await import(`./lib/print.js`)).default(m, this)
        } catch (e) {
            console.log(m, m.quoted, e)
        }
        if (opts['autoread'])
    await this.readMessages([m.key])

try {
    if (typeof m !== 'undefined' && m && !m.fromMem && typeof m.text === 'string' && m.text.match(/(©ㅤⱮօلìէօ|MoJiTo-MD|©ㅤⱮօلìէօ - bot|the©ㅤⱮօلìէօ-bot)/gi)) {
        let emot = pickRandom(["🎃", "❤", "😘", "😍", "💕", "😎", "🙌", "⭐", "👻", "🔥"])
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
        this.sendMessage(m.chat, { react: { text: emot, key: m.key }})
    }
} catch (e) {}
        function pickRandom(list) { return list[Math.floor(Math.random() * list.length)]}
    }
}
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */

export async function participantsUpdate({ id, participants, action }, conn) {
  try {
    const chat = global.db.data.chats[id] || {};
    const groupMetadata = await conn.groupMetadata(id);
    
    
    if (!global.db.data.chats[id]) global.db.data.chats[id] = {}
    global.db.data.chats[id].subject = groupMetadata.subject
    global.db.data.chats[id].metadata = groupMetadata
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */


    console.log('\n[👥 EVENTO PARTICIPANTS UPDATE]')
    console.log('📌 Grupo:', id)
    console.log('👤 Participantes:', participants)
    console.log('🎯 Acción:', action)
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
    console.log('🛠️ chat.detect:', chat.detect)
    console.log('🛠️ chat.welcome:', chat.welcome)

    let text = '', mentions = [];

    for (const user of participants) {
      const userName = await conn.getName(user);
      const mention = `@${user.split('@')[0]}`;
      mentions.push(user);

      switch (action) {
        case 'add':
          if (chat.welcome) {
            text = `👋 Bienvenido/a ${mention} al grupo *${groupMetadata.subject}*`;
          }
          break;

/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
        case 'remove':
          if (chat.welcome) {
            text = `👋 Adiós ${mention}, te extrañaremos`;
          }
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
          break;
        case 'promote':
          if (chat.detect) {
            text = `👑 ${userName} (${mention}) ahora es *admin* del grupo.`;
          }
          break;
        case 'demote':
          if (chat.detect) {
            text = `👤 ${userName} (${mention}) ya no es admin.`;
          }
          break;
      }

/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
      console.log('🧾 Texto generado:', text || '(vacío)')

      if (text) {
        await conn.sendMessage(id, { text, mentions });
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
        console.log('✅ Mensaje enviado al grupo.')
      } else {
        console.log('⚠️ No se envió mensaje (vacío o desactivado).')
      }
    }
  } catch (e) {
    console.error('[❌ ERROR EN participantsUpdate]:', e)
  }
}

export async function deleteUpdate(message, conn) {
  try {
    const { fromMe, id, participant, chat } = message;
    if (fromMe) return;

    // Si quieres usar un sistema de cache para cargar mensajes anteriores,
    // implementa aquí la carga. Si no, usa directamente 'message'.
    const msg = message;
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */

    let chatData = global.db.data.chats[msg.chat] || {};
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
    if (chatData.delete) return;

    await conn.reply(msg.chat, `
━━━━⬣  𝘼𝙉𝙏𝙄 𝘿𝙀𝙇𝙀𝙏𝙀  ⬣━━━━
*■ Nombre:* @${participant.split`@`[0]}
*■ Enviando el mensaje..*
*■ Para desactivar esta función escriba el comando:*
*—◉ #disable antidelete*
*—◉ #enable delete*

━━━━⬣  𝘼𝙉𝙏𝙄 𝘿𝙀𝙇𝙀𝙏𝙀  ⬣━━━━
`.trim(), msg, {
      mentions: [participant]
    });

    await conn.copyNForward(msg.chat, msg);
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
  } catch (e) {
    console.error(e);
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
  }
}

global.dfail = (type, m, conn) => {
  const messages = {
    rowner: `❗️⚡ *ALERTA DE PROPIETARIO* ⚡❗️\n\n🚫 Este comando solo puede ser usado por\n👑 *EL PROPIETARIO DEL BOT* 👑`,
    owner: `❗️⚡ *ATENCIÓN PROPIETARIO* ⚡❗️\n\n🚫 Solo el/La *PROPIETARIO(A)* puede ejecutar este comando.`,
    mods: `🔰 *MODO MODERADOR* 🔰\n\nEste comando está reservado para\n🛡️ *MODERADORES* y *PROPIETARIO(A)* del bot.`,
    premium: `✨ *USUARIO PREMIUM* ✨\n\nSolo usuarios con *PREMIUM* y\n👑 el/la *PROPIETARIO(A)* pueden usar este comando.`,
    group: `👥 *COMANDO DE GRUPO* 👥\n\nEste comando solo funciona en *GRUPOS*.`,
    private: `📩 *COMANDO PRIVADO* 📩\n\nEste comando solo puede usarse en *CHAT PRIVADO*.`,
    admin: `⚔️ *RESTRICCIÓN DE ADMIN* ⚔️\n\nSolo *ADMINISTRADORES* del grupo pueden usar este comando.`,
    botAdmin: `🤖 *BOT NECESITA SER ADMIN* 🤖\n\nPara usar este comando, el bot debe\nser *ADMINISTRADOR* del grupo.`,
    unreg: `🚫 *NO REGISTRADO* 🚫\n\nPara usar este comando debes estar registrado.\nUsa el comando: *#verificar* para registrarte.`,
    restrict: `⛔ *COMANDO RESTRINGIDO* ⛔\n\nEste comando está desactivado o restringido\npor decisión del propietario.`
  }

  let text = messages[type]
  if (text) return m.reply(text)
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
}
let file = __filename
watchFile(file, async () => {
    unwatchFile(file)
    console.log(chalk.redBright("Update 'handler.js'"))
    if (global.reloadHandler) console.log(await global.reloadHandler())
})

