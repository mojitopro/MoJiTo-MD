#!/bin/bash

# Script para arreglar package.json en Termux
# Soluciona el error de sintaxis JSON y optimiza para Termux

echo "🔧 Reparando package.json para Termux..."

# Crear package.json limpio y optimizado para Termux
cat > package.json << 'EOF'
{
  "name": "mojito-md-bot",
  "version": "1.0.0",
  "type": "commonjs",
  "license": "MIT",
  "main": "start-termux.js",
  "scripts": {
    "start": "node start-termux.js",
    "dev": "node start-termux.js",
    "termux": "node start-termux.js"
  },
  "dependencies": {
    "@whiskeysockets/baileys": "^6.7.8",
    "express": "^4.21.0",
    "ws": "^8.18.0",
    "axios": "^1.7.0",
    "chalk": "^4.1.2",
    "qrcode-terminal": "^0.12.0",
    "qrcode": "^1.5.4",
    "awesome-phonenumber": "^7.5.0",
    "nanoid": "^5.1.0",
    "terminal-image": "^3.1.1",
    "zod": "^3.24.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

# Crear archivo de inicio simplificado para Termux
echo "📝 Creando archivo de inicio para Termux..."

cat > start-termux.js << 'EOF'
#!/usr/bin/env node

// MoJiTo-MD Bot - Archivo de inicio optimizado para Termux
// Configuración especial para entorno móvil Android

process.env.NODE_OPTIONS = '--max-old-space-size=512';
process.env.TERMUX = '1';
process.env.TERM = 'xterm-256color';
process.env.COLORTERM = 'truecolor';

// Importar y ejecutar el bot
const path = require('path');

// Verificar si existe el archivo principal
const mainFile = path.join(__dirname, 'server', 'index.js');
const fs = require('fs');

if (fs.existsSync(mainFile)) {
    console.log('🚀 Iniciando MoJiTo-MD Bot en Termux...');
    require(mainFile);
} else {
    // Fallback para desarrollo con TypeScript
    console.log('🔄 Iniciando en modo desarrollo...');
    
    // Configurar tsx para TypeScript
    try {
        require('tsx/cli').main(['server/index.ts']);
    } catch (error) {
        console.log('⚠️ tsx no disponible, intentando con ts-node...');
        try {
            require('ts-node/register');
            require('./server/index.ts');
        } catch (tsError) {
            console.log('❌ Error: No se puede ejecutar TypeScript directamente');
            console.log('💡 Ejecuta primero: npm run build');
            console.log('📝 O usa: node server/index.js');
            process.exit(1);
        }
    }
}
EOF

chmod +x start-termux.js

echo "✅ package.json y start-termux.js creados para Termux"
echo "🚀 Ahora ejecuta:"
echo "   npm i --omit=optional --ignore-scripts"
echo "   npm start"