/**
 * Test directo del sistema de pairing code
 */
import pkg from 'baileys';
const { 
  default: makeWASocket, 
  DisconnectReason, 
  useMultiFileAuthState, 
  makeCacheableSignalKeyStore,
  Browsers,
  delay
} = pkg;
import fs from 'fs';

async function testPairingCode() {
  console.log('🚀 INICIANDO TEST DE PAIRING CODE...');
  
  const phoneNumber = '5521989050540';
  const authFolder = './MojiSession';
  
  try {
    // Crear carpeta si no existe
    if (!fs.existsSync(authFolder)) {
      fs.mkdirSync(authFolder, { recursive: true });
    }

    // Estado de autenticación
    const { state, saveCreds } = await useMultiFileAuthState(authFolder);
    
    console.log('📁 Estado de autenticación cargado');

    // Crear socket optimizado para pairing code
    const sock = makeWASocket({
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, console)
      },
      printQRInTerminal: false,
      browser: Browsers.ubuntu('Chrome'), // Browser específico para pairing
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      generateHighQualityLinkPreview: false,
      syncFullHistory: false,
      markOnlineOnConnect: true
    });

    console.log('🔌 Socket creado exitosamente');

    // Manejar eventos
    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      console.log('🔄 Estado de conexión:', connection);

      if (qr && !sock.authState.creds.registered) {
        console.log('📱 QR detectado, solicitando pairing code...');
        
        try {
          const code = await sock.requestPairingCode(phoneNumber);
          console.log('\n' + '🔥'.repeat(40));
          console.log('🔑 CÓDIGO DE EMPAREJAMIENTO GENERADO:');
          console.log('🔥'.repeat(40));
          console.log(`📱 Número: +${phoneNumber}`);
          console.log(`🔢 Código: ${code}`);
          console.log('🔥'.repeat(40));
          console.log('📋 INSTRUCCIONES:');
          console.log('1. WhatsApp > Configuración');
          console.log('2. Dispositivos vinculados');
          console.log('3. Vincular dispositivo');
          console.log('4. Vincular con número');
          console.log(`5. Ingresa: ${code}`);
          console.log('🔥'.repeat(40));
          
        } catch (codeError) {
          console.error('❌ Error generando código:', codeError.message);
        }
      }

      if (connection === 'open') {
        console.log('✅ ¡CONEXIÓN ESTABLECIDA!');
        console.log('👤 Usuario:', sock.user?.name || 'Usuario');
        console.log('📞 ID:', sock.user?.id || 'N/A');
        console.log('🎉 ¡PAIRING CODE FUNCIONÓ!');
        
        // Test de envío
        try {
          await sock.sendMessage(phoneNumber + '@s.whatsapp.net', {
            text: '🚀 Test de conexión exitoso! MoJiTo Bot conectado vía Pairing Code'
          });
          console.log('📤 Mensaje de test enviado');
        } catch (sendError) {
          console.log('⚠️ No se pudo enviar mensaje test:', sendError.message);
        }
      }

      if (connection === 'close') {
        const reason = lastDisconnect?.error?.output?.statusCode;
        console.log('❌ Conexión cerrada:', reason);
        
        if (reason === DisconnectReason.loggedOut) {
          console.log('🚪 Deslogueado, limpiando sesión...');
          // Limpiar para test fresco
        }
      }
    });

  } catch (error) {
    console.error('❌ Error en test:', error.message);
    process.exit(1);
  }
}

testPairingCode().catch(console.error);