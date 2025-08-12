/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
let handler = async (m, { conn}) => {

//let name = conn.getName(m.sender)
let av = `./media/${pickRandom(["a", "a2"])}.webp`

conn.sendFile(m.chat, av, 'a.webp', null, m, true, { type: 'stikerMessage', ptt: false })
} 

handler.customPrefix = /^(a|A|ª)$/i
handler.command = false

export default handler

function pickRandom(list) {
  return list[Math.floor(list.length * Math.random())]
}

