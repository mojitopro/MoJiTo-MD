/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
import chalk from 'chalk'
import PhoneNumber from 'awesome-phonenumber'
import terminalImage from 'terminal-image'
import { watchFile, writeFileSync, unlinkSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import Jimp from 'jimp'
import ffmpeg from 'fluent-ffmpeg'
import { downloadContentFromMessage } from '@whiskeysockets/baileys'

export default async function printMessage(m, conn = {}) {
  const getName = async (jid) => {
    try {
      if (!jid) return '(Desconocido)'
      if (jid === conn.user?.jid) return conn.user?.name || 'Yo'
      if (global.db?.data?.users?.[jid]?.name) return global.db.data.users[jid].name
      if (global.db?.data?.chats?.[jid]?.subject) return global.db.data.chats[jid].subject
      if (global.db?.data?.chats?.[jid]?.name) return global.db.data.chats[jid].name
      if (conn.groupMetadata && jid.endsWith('@g.us')) {
        const metadata = await conn.groupMetadata(jid).catch(() => null)
        if (metadata?.subject) return metadata.subject
      }
      if (conn.getName) {
        const name = await conn.getName(jid)
        if (name && name !== jid) return name
      }
      return jid.split('@')[0]
    } catch {
      return jid.split('@')[0]
    }
  }

  const timeStr = new Date().toLocaleTimeString()
  const senderJid = (m.sender || '').replace(/:\d+/, '')
  const senderNum = senderJid.replace(/@.*/, '')
  const sender = PhoneNumber('+' + senderNum).getNumber('international') || senderNum
  const chatId = (m.chat || '').replace(/:\d+/, '')
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
  const isGroup = chatId.endsWith('@g.us')
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */

/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
  const chatName = await getName(chatId)
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
  const senderName = await getName(senderJid)

  console.log(chalk.cyanBright('┌─────────────────────────────'))
  console.log(chalk.cyanBright(`│ 📤 De: `) + chalk.green(senderName))
  console.log(chalk.cyanBright(`│ 🧭 Chat: `) + chalk.yellow(chatName))
  console.log(chalk.cyanBright(`│ 🕒 Hora: `) + chalk.magenta(timeStr))
  console.log(chalk.cyanBright(`│ 🗂️ Tipo: `) + chalk.blueBright((m.mtype || '').toUpperCase()))
  if (m.text) console.log(chalk.cyanBright(`│ 💬 Texto: `) + chalk.whiteBright(m.text.slice(0, 200)))
  console.log(chalk.cyanBright('└─────────────────────────────'))

  const mostrarImagen = async (buf, isWebp = false, isAnimated = false) => {
    try {
      if (isAnimated) {
        console.log(chalk.yellow('⚠️'))
        return
      }
      if (isWebp) {
        const input = join(tmpdir(), `sticker_${Date.now()}.webp`)
        const output = input.replace('.webp', '.png')
        writeFileSync(input, buf)

        await new Promise((resolve, reject) => {
          ffmpeg(input)
            .outputOptions(['-vcodec', 'png'])
            .save(output)
            .on('end', resolve)
            .on('error', (err) => {
              if (err.message.includes('code 69')) {
                console.log(chalk.yellow('⚠️ ffmpeg no pudo convertir este sticker (código 69), se omite la imagen.'))
                resolve()
              } else reject(err)
            })
        })
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
        try {
          if (existsSync(output)) {
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
            buf = await Jimp.read(output).then(img => img.getBufferAsync(Jimp.MIME_PNG))
          } else {
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
            console.log(chalk.yellow('⚠️ No se creó archivo PNG, se omite la imagen.'))
          }
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
        } catch {
          // si falla lectura, buf queda igual
        }

        if (existsSync(input)) unlinkSync(input)
        if (existsSync(output)) unlinkSync(output)
      } else {
        const img = await Jimp.read(buf)
        buf = await img.getBufferAsync(Jimp.MIME_PNG)
      }

      if (buf) process.stdout.write(await terminalImage.buffer(buf, { width: '20%' }) + '\n')
    } catch (err) {
      console.log(chalk.red('⚠️ Error mostrando imagen/sticker:'), err.message)
    }
  }

  const tipo = m.mtype || ''
  const mime = (m.msg || m)?.mimetype || m.mediaType || ''

  if (tipo.includes('image')) {
    try {
      const stream = await downloadContentFromMessage(m.msg || m.message?.imageMessage, 'image')
      let buf = Buffer.from([])
      for await (const chunk of stream) buf = Buffer.concat([buf, chunk])
      if (buf?.length) await mostrarImagen(buf)
      else console.log(chalk.yellow('⚠️ Imagen vacía o no disponible.'))
    } catch (err) {
      console.log(chalk.red('⚠️ Error mostrando imagen:'), err.message)
    }
  } else if (tipo.includes('sticker')) {
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
    try {
      const msgContent = m.msg || m.message?.stickerMessage
      const isAnimated = msgContent?.isAnimated || false
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
      const stream = await downloadContentFromMessage(msgContent, 'sticker')
      let buf = Buffer.from([])
      for await (const chunk of stream) buf = Buffer.concat([buf, chunk])
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */

      if (buf?.length) {
      //  console.log(`📦 Sticker buffer OK (${buf.length} bytes)`)
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
        await mostrarImagen(buf, true, isAnimated)
      } else {
        console.log(chalk.yellow('⚠️ Sticker vacío o no disponible.'))
      }
    } catch (err) {
      console.log(chalk.red('⚠️ Error mostrando sticker:'), err.message)
    }
  }

  if (m.error) {
    console.log(chalk.bgRedBright('💥 ERROR:'), chalk.red(m.error))
  }

  if (Array.isArray(m.mentionedJid)) {
    for (const jid of m.mentionedJid) {
      const cleanJid = jid.replace(/:\d+/, '')
      const name = await getName(cleanJid)
      const user = PhoneNumber('+' + cleanJid.replace(/@.*/, '')).getNumber('international')
      console.log(chalk.cyan(`🔔 Mencionado: ${user} ${name ? '~ ' + name : ''}`))
    }
  }

  console.log()
}

watchFile(import.meta.url, () => {
  console.log(chalk.redBright("🔄 Se actualizó 'lib/print.js'"))
})

