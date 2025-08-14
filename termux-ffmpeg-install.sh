#!/bin/bash

# Script para instalar FFmpeg en Termux para procesamiento de stickers
echo "🎭 Instalando FFmpeg para visualización de stickers en Termux"

# Verificar si estamos en Termux
if [[ -z "$TERMUX" && ! "$PREFIX" =~ termux ]]; then
    echo "❌ Este script es solo para Termux"
    exit 1
fi

# Actualizar repositorios
echo "📦 Actualizando repositorios..."
pkg update -y

# Instalar FFmpeg
echo "🎬 Instalando FFmpeg..."
pkg install -y ffmpeg

# Verificar instalación
if command -v ffmpeg &> /dev/null; then
    echo "✅ FFmpeg instalado correctamente"
    ffmpeg -version | head -1
else
    echo "❌ Error instalando FFmpeg"
    exit 1
fi

echo "🎭 Instalación completa. Los stickers ahora se mostrarán en consola."