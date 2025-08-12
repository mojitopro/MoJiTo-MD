/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
let handler = async (m, { conn }) => {
  try {
    console.log('[🎯 Plugin activado: nvso.js]')

    let av = `./media/${pickRandom(["So1", "So2"])}.webp`
    await conn.sendFile(m.chat, av, 'So1.webp', null, m, true, {
      type: 'stickerMessage',
      ptt: false
    })

  } catch (e) {
    console.error('[❌ Error en plugin nvso.js]', e)
    m.reply('❌ Error en el plugin.')
  }
}

handler.customPrefix = /^(que|q|k|pq|poke|pk|porque|ke|Khe)$/i
handler.command = false

export default handler

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)]
}

