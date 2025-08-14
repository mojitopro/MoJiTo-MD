#!/bin/bash

# YouTube-DL installer optimized for Termux (Android) and Linux platforms
# Primary target: Termux on Android devices
# Secondary: Ubuntu, Debian, CentOS, Alpine, etc.

echo "🎵 Installing yt-dlp for MoJiTo-MD Bot..."

# Detect platform and environment
PLATFORM=$(uname -m)
OS=$(uname -s)

# Detect Termux environment
if [[ -n "$PREFIX" && "$PREFIX" == *"com.termux"* ]]; then
    echo "📱 Detected: Termux Android environment"
    IS_TERMUX=true
elif [[ -n "$ANDROID_DATA" || -n "$ANDROID_ROOT" ]]; then
    echo "📱 Detected: Android environment (possible Termux)"
    IS_TERMUX=true
else
    echo "🐧 Detected: $OS $PLATFORM (Linux environment)"
    IS_TERMUX=false
fi

# Function to install yt-dlp
install_ytdlp() {
    # Termux-specific installation (priority)
    if [[ "$IS_TERMUX" == true ]] && command -v pkg >/dev/null 2>&1; then
        echo "📱 Installing yt-dlp via Termux pkg (optimized for Android)..."
        pkg update
        pkg install -y python ffmpeg wget curl git
        
        # Install yt-dlp via pip for latest version
        if command -v pip >/dev/null 2>&1; then
            pip install --upgrade yt-dlp
        elif command -v pip3 >/dev/null 2>&1; then
            pip3 install --upgrade yt-dlp
        else
            pkg install -y python-pip
            pip install --upgrade yt-dlp
        fi
        
        echo "🔧 Termux setup complete!"
        echo "💡 Tip: Run 'termux-setup-storage' for better file access"
    elif command -v apt >/dev/null 2>&1; then
        # Debian/Ubuntu
        echo "🐧 Installing yt-dlp via apt..."
        apt update && apt install -y python3-pip ffmpeg
        pip3 install yt-dlp
    elif command -v yum >/dev/null 2>&1; then
        # CentOS/RHEL
        echo "🔴 Installing yt-dlp via yum..."
        yum install -y python3-pip ffmpeg
        pip3 install yt-dlp
    elif command -v apk >/dev/null 2>&1; then
        # Alpine
        echo "🏔️ Installing yt-dlp via apk..."
        apk update && apk add python3 py3-pip ffmpeg
        pip3 install yt-dlp
    elif command -v pacman >/dev/null 2>&1; then
        # Arch Linux
        echo "🎯 Installing yt-dlp via pacman..."
        pacman -Sy python-pip ffmpeg yt-dlp --noconfirm
    else
        # Fallback: direct installation
        echo "📦 Installing yt-dlp directly..."
        
        # Create local bin if it doesn't exist
        mkdir -p ~/.local/bin
        
        # Download yt-dlp binary
        if command -v curl >/dev/null 2>&1; then
            curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o ~/.local/bin/yt-dlp
        elif command -v wget >/dev/null 2>&1; then
            wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O ~/.local/bin/yt-dlp
        else
            echo "❌ curl or wget required for installation"
            exit 1
        fi
        
        chmod +x ~/.local/bin/yt-dlp
        
        # Add to PATH if not already there
        if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
            echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
            export PATH="$HOME/.local/bin:$PATH"
        fi
    fi
}

# Function to install ffmpeg if not present
install_ffmpeg() {
    if ! command -v ffmpeg >/dev/null 2>&1; then
        echo "🎬 Installing FFmpeg..."
        
        if command -v pkg >/dev/null 2>&1; then
            pkg install ffmpeg -y
        elif command -v apt >/dev/null 2>&1; then
            apt install -y ffmpeg
        elif command -v yum >/dev/null 2>&1; then
            yum install -y ffmpeg
        elif command -v apk >/dev/null 2>&1; then
            apk add ffmpeg
        elif command -v pacman >/dev/null 2>&1; then
            pacman -S ffmpeg --noconfirm
        else
            echo "⚠️ Please install ffmpeg manually"
        fi
    fi
}

# Run installations
install_ytdlp
install_ffmpeg

# Test installation
echo "🧪 Testing yt-dlp installation..."
if command -v yt-dlp >/dev/null 2>&1; then
    echo "✅ yt-dlp installed successfully!"
    yt-dlp --version
else
    echo "❌ yt-dlp installation failed"
    exit 1
fi

if command -v ffmpeg >/dev/null 2>&1; then
    echo "✅ FFmpeg installed successfully!"
    ffmpeg -version | head -1
else
    echo "⚠️ FFmpeg not found - audio conversion may not work"
fi

echo ""
echo "🎉 Installation complete!"
echo "🎵 MoJiTo-MD Bot is now ready for music downloads"
echo ""
echo "📋 Quick test:"
echo "yt-dlp --extract-audio --audio-format mp3 --audio-quality 128K 'https://youtu.be/dQw4w9WgXcQ' -o 'test.%(ext)s'"