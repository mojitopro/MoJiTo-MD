import fs from 'fs'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  try {
    if (command === 'estado') {
      if (!text) return m.reply(`🚫 Debes escribir el texto que quieres subir al estado.\nEjemplo: ${usedPrefix}estado Hola mundo`)

      // Intentar enviar texto como estado
      await conn.sendMessage('status@broadcast', { text: text.trim() })
      m.reply('✅ Comando ejecutado: Intenté subir estado de texto (no garantizado que funcione).')
    } else if (command === 'estadoimg') {
      if (!m.quoted) return m.reply(`🚫 Debes responder a un mensaje que contenga una imagen o video.\nEjemplo: responde a una imagen con ${usedPrefix}estadoimg`)

      let mime = (m.quoted.msg || m.quoted).mimetype || ''
      if (!mime.startsWith('image/') && !mime.startsWith('video/')) return m.reply('🚫 El mensaje respondido no es una imagen o video válido.')

      let media = await m.quoted.download()
      let messageContent = mime.startsWith('image/') ? { image: media } : { video: media }

      // Intentar enviar multimedia como estado
      await conn.sendMessage('status@broadcast', messageContent)
      m.reply('✅ Comando ejecutado: Intenté subir estado multimedia (no garantizado que funcione).')
    }
  } catch (e) {
    m.reply(`⚠️ Error al intentar subir estado: ${e.message || e}`)
  }
}

handler.command = ['estado', 'estadoimg']
handler.help = ['estado <texto>', 'estadoimg (responde a imagen/video)']
handler.tags = ['tools']
handler.owner = false

export default handler