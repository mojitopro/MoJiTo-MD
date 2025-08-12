
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1'
import './config.js'
import { createRequire } from "module"
import path, { join } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { platform } from 'process'
import * as ws from 'ws'
import { readdirSync, statSync, unlinkSync, existsSync, readFileSync, watch } from 'fs'
import yargs from 'yargs'
import { spawn } from 'child_process'
import lodash from 'lodash'
import chalk from 'chalk'
import syntaxerror from 'syntax-error'
import { tmpdir } from 'os'
import { format } from 'util'
import P from 'pino'
import { protoType, serialize } from './lib/simple.js'
import { Low, JSONFile } from 'lowdb'
import { mongoDB, mongoDBV2 } from './lib/mongoDB.js'
import store from './lib/store.js'
import QRCode from 'qrcode'
import { setMaxListeners } from 'events'
setMaxListeners(50)

const { useMultiFileAuthState, DisconnectReason } = await import('@whiskeysockets/baileys')
const { CONNECTING } = ws
const { chain } = lodash
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000

protoType()
serialize()

const __dirname = path.dirname(fileURLToPath(import.meta.url))

global.__filename = (pathURL = import.meta.url, rmPrefix = platform !== 'win32') =>
  rmPrefix ? (/file:\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL) : pathToFileURL(pathURL).toString()
global.__dirname = () => __dirname
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
global.__require = createRequire(import.meta.url)
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */

/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
global.API = (name, path = '/', query = {}, apikeyqueryname) =>
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
  (name in global.APIs ? global.APIs[name] : name) + path + ((query || apikeyqueryname) ? '?' + new URLSearchParams({
    ...query,
    ...(apikeyqueryname ? { [apikeyqueryname]: global.APIKeys[name in global.APIs ? global.APIs[name] : name] } : {})
  }) : '')

global.timestamp = { start: new Date() }
global.opts = yargs(process.argv.slice(2)).exitProcess(false).parse()
global.prefix = new RegExp(`^[${global.opts.prefix || 'xzXZ/i!#$%+£¢€¥^°=¶∆×÷π√✓©®:;?&.\\-HhhHBb.aA'}]`)

global.db = new Low(
  /https?:\/\//.test(global.opts.db || '') ? new cloudDBAdapter(global.opts.db) :
  /mongodb(\+srv)?:\/\//i.test(global.opts.db) ? (global.opts.mongodbv2 ? new mongoDBV2(global.opts.db) : new mongoDB(global.opts.db)) :
  new JSONFile(`${global.opts._[0] ? global.opts._[0] + '_' : ''}database.json`)
)

global.DATABASE = global.db

global.loadDatabase = async () => {
  if (global.db.READ) return new Promise(resolve => setInterval(async function () {
    if (!global.db.READ) {
      clearInterval(this)
      resolve(global.db.data == null ? global.loadDatabase() : global.db.data)
    }
  }, 1000))

  if (global.db.data !== null) return
  global.db.READ = true
  await global.db.read().catch(console.error)
  global.db.READ = null
  global.db.data = {
    users: {},
    chats: {},
    stats: {},
    msgs: {},
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
    sticker: {},
    settings: {},
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
    ...(global.db.data || {})
  }
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
  global.db.chain = chain(global.db.data)
}
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */

await global.loadDatabase()

// Usamos carpeta personalizada para sesiones
const { state, saveCreds } = await useMultiFileAuthState('./MojiSession')

const connectionOptions = {
  auth: state,
  logger: P({ level: 'silent' }),
  browser: ['©ㅤⱮօلìէօ-MD', 'Edge', '1.0.0']
}

import { createWASocket } from './lib/simple.js'
global.conn = createWASocket(connectionOptions)
// Guardar la hora de arranque del bot
const botStartTime = Date.now()
conn.isInit = false

// Mostrar QR en consola manualmente
conn.ev.on('connection.update', async (update) => {
  if (update.qr) {
    console.log('\nEscanea este código QR en tu WhatsApp para conectar:\n')
    try {
      const qrTerminal = await QRCode.toString(update.qr, { type: 'terminal', small: true })
      console.log(qrTerminal)
    } catch {
      console.log('Escanea este código QR:', update.qr)
    }
  }

  if (update.connection === 'open') {
    console.log(chalk.greenBright('✔️ Conectado correctamente a WhatsApp'))
  }
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */

  if (update.lastDisconnect?.error) {
    const statusCode = update.lastDisconnect.error.output?.statusCode
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
    if (statusCode && statusCode !== DisconnectReason.loggedOut) {
      console.log(chalk.redBright('[❌ Desconectado de WhatsApp, intentando reconectar...]'))
      // Aquí puedes añadir lógica de reconexión si quieres
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
    }
  }
})
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */

// Guardar credenciales actualizadas
conn.ev.on('creds.update', saveCreds)

process.on('uncaughtException', err => {
  console.error('[💥 uncaughtException]', err)
  console.log(chalk.red('[⚠️ Reiniciando el bot tras fallo inesperado...]'))
  import('./main.js?' + Date.now())
})

function clearTmp() {
  const tmp = [tmpdir(), join(__dirname, './tmp')]
  const filename = []
  tmp.forEach(dirname => readdirSync(dirname).forEach(file => filename.push(join(dirname, file))))
  return filename.map(file => {
    const stats = statSync(file)
    if (stats.isFile() && (Date.now() - stats.mtimeMs >= 1000 * 60 * 3)) return unlinkSync(file)
    return false
  })
}

setInterval(async () => {
  const cleared = await clearTmp()
  console.log(chalk.cyanBright(`\n▣────────[ AUTOCLEARTMP ]───────────···\n│\n▣─❧ ARCHIVOS ELIMINADOS ✅\n│\n▣────────────────────────────────────···\n`))
}, 180000)

async function _quickTest() {
  let test = await Promise.all([
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
    spawn('ffmpeg'),
    spawn('ffprobe'),
    spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-filter_complex', 'color', '-frames:v', '1', '-f', 'webp', '-']),
    spawn('convert'),
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
    spawn('magick'),
    spawn('gm'),
    spawn('find', ['--version'])
  ].map(p => new Promise(resolve => {
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
    p.on('close', code => resolve(code !== 127))
    p.on('error', _ => resolve(false))
  })))

/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
  global.support = Object.freeze({
    ffmpeg: test[0],
    ffprobe: test[1],
    ffmpegWebp: test[2],
    convert: test[3],
    magick: test[4],
    gm: test[5],
    find: test[6]
  })
}

await _quickTest()

const pluginFolder = join(__dirname, './plugins')
const pluginFilter = filename => /\.js$/.test(filename)

global.loadPlugins = async function () {
  global.plugins = {}
  const pluginFiles = readdirSync(pluginFolder).filter(pluginFilter)

  for (let filename of pluginFiles) {
    const filePath = join(pluginFolder, filename)

    try {
      const code = readFileSync(filePath)
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
      const err = syntaxerror(code, filename, {
        sourceType: 'module',
        allowAwaitOutsideFunction: true
      })

/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
      if (err) {
        console.error(`❌ Error de sintaxis en plugin '${filename}':\n${format(err)}`)
        continue
      }

/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
      const file = pathToFileURL(filePath).href
      const module = await import(file + '?update=' + Date.now())
      const plugin = module.default || module

      if (typeof plugin !== 'function' && typeof plugin !== 'object') {
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
        console.warn(`⚠️ Plugin inválido ignorado: '${filename}'`)
        continue
      }

      global.plugins[filename] = plugin
    } catch (e) {
      console.error(`❌ Error cargando plugin '${filename}':`, e)
    }
  }


const plugins = Object.keys(global.plugins)
const total = plugins.length
const columns = 3
const columnWidth = 30

console.log(chalk.bold.cyanBright('\n╭━━━[ ✅ Plugins cargados ]━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'))
console.log(chalk.bold(`┃  ${chalk.magenta('Total:')} ${chalk.blueBright(total)} plugins\n`))

for (let i = 0; i < total; i += columns) {
  const row = plugins
    .slice(i, i + columns)
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
    .map(name => `${chalk.magenta('┗━▶')} ${chalk.greenBright(name.padEnd(columnWidth))}`)
    .join(' ')
  console.log(chalk.bold('┃ ') + row)
}

console.log(chalk.bold.cyanBright('╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'))
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */

  watch(pluginFolder, async (_event, filename) => {
    if (!pluginFilter(filename)) return

    const filePath = join(pluginFolder, filename)
    if (!existsSync(filePath)) {
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
      console.warn(`🗑️ Plugin eliminado: '${filename}'`)
      return delete global.plugins[filename]
    }

    const code = readFileSync(filePath)
    const err = syntaxerror(code, filename, {
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
      sourceType: 'module',
      allowAwaitOutsideFunction: true
    })

    if (err) {
      console.error(`❌ Error de sintaxis en plugin '${filename}':\n${format(err)}`)
      return
    }

    try {
      const module = await import(pathToFileURL(filePath).href + '?update=' + Date.now())
      const plugin = module.default || module

      if (typeof plugin !== 'function' && typeof plugin !== 'object') {
        console.warn(`⚠️ Plugin inválido ignorado: '${filename}'`)
        return
      }

      global.plugins[filename] = plugin
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
      console.log(`🔄 Plugin recargado: '${filename}'`)
    } catch (e) {
      console.error(`❌ Error al recargar plugin '${filename}':`, e)
    }
  })
}

/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
await global.loadPlugins()

async function connectionUpdate(update) {
  let pp = './src/nuevobot.jpg'
  const { connection, lastDisconnect, isNewLogin } = update

  if (isNewLogin) conn.isInit = true
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */

  const code = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode

  if (code && conn?.ws.readyState !== CONNECTING) {
    console.log(chalk.redBright('[❌ Desconectado de WhatsApp]'))
    if (code !== DisconnectReason.loggedOut) {
      global.reloadHandler(true).catch(console.error)
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
    } else {
      console.log(chalk.yellowBright('[🔄 Intentando reconexión desde cero]'))
      import('./main.js?' + Date.now())
    }
  }

  if (global.db.data == null) await loadDatabase()

  if (connection === 'open') {
    console.log(chalk.yellow('▣─────────────────────────────···\n│\n│❧ 𝙲𝙾𝙽𝙴𝙲𝚃𝙰𝙳𝙾 𝙲𝙾𝚁𝚁𝙴𝙲𝚃𝙰𝙼𝙴𝙽𝚃𝙴 𝙰𝙻 𝚆𝙷𝙰𝚃𝚂𝙰𝙿𝙿 ✅\n│\n▣─────────────────────────────···'))
  }
}

global.participantsUpdate = async function (update) {
  const { id, participants, action } = update
  const chat = global.db.data.chats[id] || {}
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
  if (!chat.welcome) return

  for (const user of participants) {
    const pp = await conn.profilePictureUrl(user, 'image').catch(() => 'https://i.imgur.com/aq39RMA.png')
    const username = '@' + user.split('@')[0]

    if (action === 'add') {
      await conn.sendMessage(id, {
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
        image: { url: pp },
        caption: `👋 Bienvenido ${username} al grupo.`,
        mentions: [user]
      })
    } else if (action === 'remove') {
      await conn.sendMessage(id, {
        image: { url: pp },
        caption: `👋 ${username} ha salido del grupo.`,
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
        mentions: [user]
      })
    }
  }
}

global.reloadHandler = async function (forceLog = false) {
  try {
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
    const modulePath = './handler.js?update=' + Date.now()
    const moduleHandler = await import(modulePath)

    if (!moduleHandler || typeof moduleHandler.handler !== 'function') throw new Error('[❌ handler.js inválido o no exporta handler()]')

    global.handler = moduleHandler
    global.handlerFunction = moduleHandler.handler
    global.participantsUpdate = moduleHandler.participantsUpdate || (() => {})
    global.groupsUpdate = moduleHandler.groupsUpdate || (() => {})
    global.groupUpdate = moduleHandler.groupUpdate || (() => {})
    global.messageDelete = moduleHandler.deleteUpdate || (() => {})
    global.callUpdate = moduleHandler.callUpdate || (() => {})
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
    conn.handler = moduleHandler.handler.bind(global.conn)
    conn.participantsUpdate = moduleHandler.participantsUpdate?.bind(global.conn) || (() => {})
    conn.groupsUpdate = moduleHandler.groupsUpdate?.bind(global.conn) || (() => {})
    conn.onDelete = moduleHandler.deleteUpdate?.bind(global.conn) || (() => {})
    conn.connectionUpdate = connectionUpdate.bind(global.conn)
    conn.credsUpdate = saveCreds.bind(global.conn, true)

    conn.ev.on('messages.upsert', async chatUpdate => {
  const { messages } = chatUpdate
  if (!messages || !Array.isArray(messages)) return

  const filteredMessages = messages.filter(msg => {
    if (!msg.messageTimestamp) return false
    return msg.messageTimestamp * 1000 >= botStartTime
  })

  if (filteredMessages.length === 0) return

  // Reemplaza handler por tu función actual (handler por defecto o handlerFunction)
  conn.handler({ ...chatUpdate, messages: filteredMessages }, conn)
})
    conn.ev.on('group-participants.update', update => participantsUpdate(update, conn))
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
    conn.ev.on('groups.update', conn.groupsUpdate)
    conn.ev.on('message.delete', conn.onDelete)
    conn.ev.on('connection.update', conn.connectionUpdate)
    conn.ev.on('creds.update', conn.credsUpdate)

    if (forceLog) console.log(chalk.greenBright('[✔️ handler.js recargado exitosamente]'))
  } catch (error) {
    console.error(chalk.red('[❌ Error recargando handler.js]:\n'), error)
  }
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
}

await global.reloadHandler()

