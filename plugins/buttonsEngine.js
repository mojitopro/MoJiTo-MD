/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
/* ERROR DE API: Unexpected token 'N', "Not Found" is not valid JSON */
import pkg from '@whiskeysockets/baileys'
const { proto, generateWAMessageFromContent } = pkg

async function sendCustomButtons(conn, jid, quoted) {
  const buttonMessage = {
    templateMessage: {
      hydratedTemplate: {
        hydratedContentText: '¿Quieres continuar?',
        hydratedFooterText: 'Botones artesanales',
        hydratedButtons: [
          proto.TemplateButton.hydratedQuickReplyButton({
            displayText: '✅ Sí',
            id: '.si'
          }),
          proto.TemplateButton.hydratedQuickReplyButton({
            displayText: '❌ No',
            id: '.no'
          }),
          proto.TemplateButton.hydratedQuickReplyButton({
            displayText: 'ℹ️ Info',
            id: '.info'
          }),
        ]
      }
    }
  }

  const msg = generateWAMessageFromContent(jid, buttonMessage, {
    userJid: conn.user.jid,
    quoted
  })

  await conn.relayMessage(jid, msg.message, { messageId: msg.key.id })
}

export { sendCustomButtons } // 🔁 necesario para importar en otros plugins

