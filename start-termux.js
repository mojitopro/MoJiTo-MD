// Script de inicio optimizado para Termux
process.env.NODE_OPTIONS = '--max-old-space-size=512';

// Verificar que estamos en Termux
if (process.env.PREFIX && process.env.PREFIX.includes('termux')) {
  console.log('🤖 Iniciando MoJiTo-MD Bot en Termux...');
  
  // Importar y ejecutar el bot principal
  import('./server/index.js')
    .then(() => {
      console.log('✅ Bot iniciado correctamente en Termux');
    })
    .catch((error) => {
      console.error('❌ Error al iniciar el bot:', error.message);
      console.log('💡 Intenta ejecutar: node server/index.js');
    });
} else {
  console.log('⚠️ Este script está optimizado para Termux');
  require('./server/index.js');
}
