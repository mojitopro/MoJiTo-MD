/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
let handler = async (m, { conn }) => {
  const delay = ms => new Promise(res => setTimeout(res, ms))

  const empty = 'ㅤ'
  const frames = [
    `👉${empty.repeat(3)}`,
    `${empty}👌${empty.repeat(2)}`,
    `${empty.repeat(2)}👉${empty}`,
    `${empty.repeat(3)}👌`
  ]

  const rawSender = typeof m.sender === 'string' ? m.sender : ''
  // Ya no usar replace que puede romper el JID
  const number = rawSender.split('@')[0]
  const mentionJid = rawSender

  let sent = await conn.sendMessage(m.chat, {
    text: `Aquí va una señal para ti, @${number}...`,
    mentions: [mentionJid]
  }, { quoted: m })

  await delay(2500)

  for (let i = 0; i < 2; i++) {
    for (const frame of frames) {
      await delay(700)
      await conn.sendMessage(m.chat, {
        text: frame,
        edit: sent.key // IMPORTANTE: usar la key completa para editar
      })
    }
  }

  await conn.sendMessage(m.chat, {
    text: `¿Captas la indirecta? 😏 @${number}`,
    mentions: [mentionJid],
    edit: sent.key
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
  })
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
}
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */

/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
handler.customPrefix = /^(TROLL|Troll|troll)$/i
handler.command = false

export default handler

