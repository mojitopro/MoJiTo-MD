    
    
    
    
import { sticker } from '../lib/sticker.js'
import { downloadContentFromMessage } from '@whiskeysockets/baileys'

const handler = async (m, { conn }) => {
  try {
    
    
    const quoted = m.quoted || m
    const mime = (quoted.msg || quoted).mimetype || quoted.mediaType || ''

    

    if (!/image|video|webp/.test(mime)) {
      return m.reply('*solo 7 segundos.*')
    }

    if (/video/.test(mime)) {
      if ((quoted.msg || quoted).seconds > 7) {
        return m.reply('*solo 7 segundos.*')
      }
    }

    const type = mime.split('/')[0]
    const ext = mime.split('/')[1]
    const stream = await downloadContentFromMessage(quoted.msg || quoted, type)

    let buffer = Buffer.from([])
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk])
    }

    if (!buffer || buffer.length === 0) {
      throw new Error('No')
    }

    const stiker = await sticker(buffer, false, global.packname || 'Sticker', global.author || '')
    
    if (!stiker) {
    
      throw new Error('falló.')
    
    }
    

    await conn.sendFile(m.chat, stiker, 'sticker.webp', '', m)
  } catch (e) {
    console.error('[🔥 ERROR STICKER]:', e)
    m.reply('*Asegúrate. de que el archivo sea válido.*')
  }
}

handler.help = ['s']
handler.tags = ['sticker']
handler.command = /^s(tic?ker)?(gif)?(wm)?$/i

export default handler

