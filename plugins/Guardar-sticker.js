/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
import fs from 'fs'
import { downloadContentFromMessage } from '@whiskeysockets/baileys'

let handler = async (m, { text }) => {
  const quoted = m.quoted || m
  const content = quoted.msg || quoted

  if (!quoted.fileSha256 && !quoted.mediaType && !quoted.mimetype && !quoted.isMedia) {
    return m.reply('⚠️ *Debes responder a un sticker válido.*')
  }

  if (!text || !text.includes('|')) {
    return m.reply('❗ *Formato inválido.* Usa: `nombre|ext` (ej: `So1|webp`)')
  }

  const [fileNameRaw, extRaw] = text.split('|')
  const fileName = fileNameRaw.trim().replace(/\s+/g, '_')
  const extension = extRaw.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
  const fullPath = `./media/${fileName}.${extension}`

  try {
    const type = content.mimetype?.split('/')[0] || 'sticker'
    const stream = await downloadContentFromMessage(content, type)

    let buffer = Buffer.alloc(0)
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk])
    }

    if (!fs.existsSync('./media')) fs.mkdirSync('./media')
    await fs.promises.writeFile(fullPath, buffer)

    m.reply(`✅ *Sticker guardado como:* \`${fullPath}\``)

  } catch (e) {
    console.error('❌ Error al guardar sticker:', e)
    m.reply('❌ *No se pudo guardar el sticker. Asegúrate de que sea válido.*')
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
  }
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
}
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */

/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
handler.help = ['savesticker nombre|ext']
handler.tags = ['owner']
handler.command = /^(savesticker|s3)$/i
handler.rowner = true

export default handler

