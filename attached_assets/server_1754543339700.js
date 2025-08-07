
import express from 'express'
import { createServer } from 'http'
import { toBuffer } from 'qrcode'
import fetch from 'node-fetch'

function connect(conn, PORT) {
  let app = global.app = express()
  let server = global.server = createServer(app)
  let _qr = 'invalid'
  let _pairingCode = null

  // Escucha eventos de conexión
  conn.ev.on('connection.update', async (update) => {
    const { qr, pairingCode, connection } = update

    if (qr) {
      _qr = qr
      console.log('\n🟡 [QR DETECTADO] Escanéalo desde WhatsApp Web o móvil.\n')
    }

    if (pairingCode) {
      _pairingCode = pairingCode
      console.log('\n🟢 [CÓDIGO DE EMPAREJAMIENTO]:', pairingCode, '\n')
    }

    if (connection === 'open') {
      console.log('✅ Bot conectado exitosamente a WhatsApp.')
    }

    if (connection === 'close') {
      console.log('🔴 Conexión cerrada con WhatsApp.')
    }
  })

  // Si se accede por navegador, responde con el QR en PNG o con el código
  app.use(async (req, res) => {
    res.setHeader('content-type', 'text/html')
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */

/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
    if (_pairingCode) {
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
      res.end(`<h1>Código de emparejamiento:</h1><pre style="font-size:2em">${_pairingCode}</pre>`)
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
      return
    }

    if (_qr === 'invalid') {
      res.end('<h1>QR aún no disponible, espera unos segundos...</h1>')
      return
    }

    try {
      const buffer = await toBuffer(_qr)
      res.setHeader('content-type', 'image/png')
      res.end(buffer)
    } catch (e) {
      console.error('❌ Error al generar QR:', e)
      res.status(500).send('Error al generar QR')
    }
  })

  server.listen(PORT, () => {
    console.log(`\n🚀 Servidor QR escuchando en: http://localhost:${PORT}/\n`)
    if (opts?.keepalive) keepAlive()
  })
}

function keepAlive() {
  const url = `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
  if (/(\/\/|\.)undefined\./.test(url)) return
  setInterval(() => {
    fetch(url).catch(console.error)
  }, 5 * 60 * 1000)
}

function pipeEmit(event, event2, prefix = '') {
  let old = event.emit
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
  event.emit = function (event, ...args) {
    old.emit(event, ...args)
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
    event2.emit(prefix + event, ...args)
  }
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
  return {
    unpipeEmit() {
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
      event.emit = old
    }
  }
}

export default connect

