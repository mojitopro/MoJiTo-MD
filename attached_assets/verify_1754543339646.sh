#!/bin/sh
echo "🟢 Verificando versiones de Node.js y npm..."
NODE_VER=$(node -v 2>/dev/null)
NPM_VER=$(npm -v 2>/dev/null)

if [ $? -ne 0 ]; then
  echo "❌ Node.js o npm no están instalados."
  exit 1
fi

echo "Node.js version: $NODE_VER"
echo "npm version: $NPM_VER"

NODE_MAJOR=$(echo "$NODE_VER" | cut -d '.' -f1 | tr -d 'v')
NPM_MAJOR=$(echo "$NPM_VER" | cut -d '.' -f1)

# Para comparar números en sh, usamos expr
NODE_CHECK=$(expr $NODE_MAJOR \>= 16)
NPM_CHECK=$(expr $NPM_MAJOR \>= 7)

if [ "$NODE_CHECK" -ne 1 ]; then
  echo "❌ Node.js debe ser >=16"
  exit 1
fi

if [ "$NPM_CHECK" -ne 1 ]; then
  echo "❌ npm debe ser >=7"
  exit 1
fi

echo "🟢 Instalando dependencias npm..."
npm install || { echo "❌ Error instalando dependencias npm"; exit 1; }

echo "🟢 Verificando binarios externos necesarios..."

BINARIOS="ffmpeg yt-dlp convert"

for bin in $BINARIOS; do
  if command -v "$bin" >/dev/null 2>&1; then
    echo "✔ $bin instalado"
  else
    echo "❌ $bin NO instalado o no está en PATH"
  fi
done

echo "✅ Verificación completada."
