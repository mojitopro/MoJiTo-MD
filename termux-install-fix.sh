
#!/bin/bash

# MoJiTo-MD Bot - Script de reparación para problemas de instalación en Termux
echo "🔧 Reparando instalación de MoJiTo-MD Bot en Termux..."

# Limpiar instalaciones previas problemáticas
echo "🧹 Limpiando instalaciones problemáticas..."
rm -rf node_modules/.cache
rm -rf ~/.npm/_cacache

# Configurar variables de entorno para Termux
echo "⚙️ Configurando variables de entorno para Termux..."
export NODE_OPTIONS="--max-old-space-size=512"
export TERM=xterm-256color
export COLORTERM=truecolor
export PREFIX=/data/data/com.termux/files/usr
export TMPDIR=/data/data/com.termux/files/usr/tmp

# Configurar npm para evitar compilación nativa problemática
npm config set build-from-source false
npm config set optional false

# Instalar dependencias críticas una por una
echo "📦 Instalando dependencias críticas..."
npm install @whiskeysockets/baileys@6.7.18 --omit=optional --ignore-scripts
npm install express@4.21.2
npm install ws@8.18.0 --omit=optional --ignore-scripts
npm install fluent-ffmpeg@2.1.3
npm install jimp@0.16.13

# Instalar el resto sin dependencias opcionales
echo "📋 Instalando dependencias restantes..."
npm install --omit=optional --ignore-scripts

# Crear script de inicio optimizado para Termux
echo "📝 Creando script de inicio para Termux..."
cat > start-termux.js << 'EOF'
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
EOF

echo ""
echo "🎉 Reparación completada!"
echo ""
echo "📱 Para ejecutar en Termux usa:"
echo "   node start-termux.js"
echo "   o"
echo "   node server/index.js"
echo ""
