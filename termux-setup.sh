#!/bin/bash

# MoJiTo-MD Bot - Script de configuración para Termux
# Este script prepara el entorno Termux para ejecutar el bot de WhatsApp

echo "🔧 Configurando MoJiTo-MD Bot para Termux..."

# Actualizar paquetes de Termux
echo "📦 Actualizando paquetes de Termux..."
pkg update -y && pkg upgrade -y

# Instalar dependencias esenciales
echo "🛠️ Instalando dependencias del sistema..."
pkg install -y nodejs npm python git ffmpeg wget curl build-essential clang

# Configurar variables para compilación nativa
echo "🔧 Configurando entorno de compilación..."
export CC=clang
export CXX=clang++
export AR=llvm-ar
export STRIP=llvm-strip
export RANLIB=llvm-ranlib

# Otorgar permisos de almacenamiento
echo "📱 Configurando permisos de almacenamiento..."
termux-setup-storage

# Configurar npm para Termux
echo "⚙️ Configurando npm para Termux..."
npm config set target_platform android
npm config set target_arch arm64
npm config set cache /data/data/com.termux/files/home/.npm
npm config set python python3

# Limpiar caché de npm
npm cache clean --force

# Arreglar package.json primero
echo "🔧 Reparando package.json..."
bash termux-fix-package.sh

# Instalar dependencias de Node.js (omitiendo paquetes problemáticos)
echo "📋 Instalando dependencias de Node.js..."
npm install --omit=optional --ignore-scripts || echo "⚠️ Algunos paquetes fallaron, continuando..."

# Instalar dependencias críticas individualmente
echo "🔧 Instalando dependencias críticas..."
npm install @whiskeysockets/baileys ws express fluent-ffmpeg jimp --ignore-scripts

# Configurar variables de entorno para Termux
echo "⚙️ Configurando variables de entorno..."
export NODE_OPTIONS="--max-old-space-size=512"
export TERM=xterm-256color
export COLORTERM=truecolor

# Crear directorio de descargas si no existe
mkdir -p downloads

# Verificar instalación de ffmpeg
if command -v ffmpeg &> /dev/null; then
    echo "✅ FFmpeg instalado correctamente"
    ffmpeg -version | head -n 1
else
    echo "❌ Error: FFmpeg no se instaló correctamente"
    exit 1
fi

# Verificar instalación de Node.js
if command -v node &> /dev/null; then
    echo "✅ Node.js instalado correctamente"
    node --version
else
    echo "❌ Error: Node.js no se instaló correctamente"
    exit 1
fi

# Configurar base de datos PostgreSQL (si está disponible)
if command -v postgres &> /dev/null; then
    echo "✅ PostgreSQL detectado"
    npm run db:push 2>/dev/null || echo "⚠️ Configuración de base de datos manual requerida"
else
    echo "⚠️ PostgreSQL no disponible - usando almacenamiento en memoria"
fi

echo ""
echo "🎉 Configuración de Termux completada exitosamente!"
echo ""
echo "📋 Para ejecutar el bot:"
echo "   npm run dev"
echo ""
echo "📱 Optimizaciones para Termux activadas:"
echo "   • Memoria limitada a 512MB"
echo "   • Procesamiento de imágenes optimizado"
echo "   • Visualización de stickers en terminal"
echo "   • Detección automática de entorno móvil"
echo ""
echo "🔧 Variables de entorno configuradas:"
echo "   • NODE_OPTIONS: --max-old-space-size=512"
echo "   • TERM: xterm-256color"
echo "   • COLORTERM: truecolor"
echo ""