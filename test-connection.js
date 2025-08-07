/**
 * Test de conexión simple para WhatsApp
 */
import pkg from '@whiskeysockets/baileys';
const { 
  default: createWASocket, 
  DisconnectReason, 
  useMultiFileAuthState
} = pkg;
import qrTerminal from 'qrcode-terminal';

async function testConnection() {
  console.log('🔍 Probando conexión directa a WhatsApp...');
  
  try {
    // Configuración mínima
    const { state, saveCreds } = await useMultiFileAuthState('./TestSession');
    
    const sock = createWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: ["Test Bot", "Chrome", "1.0.0"],
      logger: {
        level: 'silent',
        child: () => ({ level: 'silent' })
      }
    });

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        console.log('\n📱 CÓDIGO QR GENERADO:');
        console.log('════════════════════════════════════════════════════════');
        qrTerminal.generate(qr, { small: true });
        console.log('════════════════════════════════════════════════════════');
        console.log('📋 Escanea este código con WhatsApp > Dispositivos vinculados');
        console.log('⏳ Esperando conexión...\n');
      }
      
      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const reason = Object.keys(DisconnectReason)[Object.values(DisconnectReason).indexOf(statusCode)] || 'Unknown';
        console.log(`❌ Conexión cerrada: ${reason} (${statusCode})`);
        
        if (statusCode !== DisconnectReason.loggedOut) {
          console.log('🔄 Reintentando en 5 segundos...');
          setTimeout(() => testConnection(), 5000);
        }
      } else if (connection === 'open') {
        console.log('✅ ¡CONECTADO EXITOSAMENTE!');
        console.log(`📱 Usuario: ${sock.user.name} (${sock.user.id})`);
        console.log('🎉 El bot está funcionando correctamente');
      }
    });

    sock.ev.on('creds.update', saveCreds);

  } catch (error) {
    console.error('❌ Error en test de conexión:', error.message);
  }
}

testConnection();