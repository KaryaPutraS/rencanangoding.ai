#!/usr/bin/env bash
set -e

# Clear screen & display banner
echo "========================================================"
echo "   🚀 RencanaNgodingAI — Server One-Line Installer"
echo "   Ubah ide kasar menjadi spesifikasi presisi AI Agent"
echo "========================================================"
echo ""

INSTALL_DIR="$HOME/rencanangoding.ai"
REPO_URL="https://github.com/KaryaPutraS/rencanangoding.ai.git"
PORT=7518

# Get server IP address
SERVER_IP=$(curl -s --connect-timeout 3 https://ifconfig.me 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")

echo "📦 Menyiapkan direktori instalasi: $INSTALL_DIR..."

if [ -d "$INSTALL_DIR" ]; then
    echo "🔄 Repository ditemukan. Memperbarui source code..."
    cd "$INSTALL_DIR"
    git fetch --all 2>/dev/null || true
    git reset --hard origin/main 2>/dev/null || true
else
    echo "📥 Mengunduh source code dari GitHub..."
    git clone "$REPO_URL" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

# Check Docker installation
HAS_DOCKER=false
if command -v docker &> /dev/null; then
    if docker info &> /dev/null; then
        HAS_DOCKER=true
    fi
fi

if [ "$HAS_DOCKER" = true ]; then
    echo ""
    echo "🐳 Docker terdeteksi. Membangun & menjalankan kontainer RencanaNgoding.ai..."
    
    if docker compose version &> /dev/null; then
        docker compose up -d --build
    elif command -v docker-compose &> /dev/null; then
        docker-compose up -d --build
    else
        docker compose up -d --build
    fi

else
    echo ""
    echo "⚙️ Docker tidak terdeteksi. Menggunakan mode Standalone Node.js..."

    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo "❌ Error: Node.js belum terinstall. Silakan install Node.js (v18+) terlebih dahulu."
        exit 1
    fi

    # Check/Install pnpm
    if ! command -v pnpm &> /dev/null; then
        echo "📦 Installing pnpm..."
        npm install -g pnpm
    fi

    echo "🔨 Installing dependencies..."
    pnpm install

    echo "🏗️ Building application..."
    pnpm build

    echo "🚀 Starting server background process..."
    # Kill any previous instance running on port 7518 if exists
    fuser -k 7518/tcp 2>/dev/null || true
    
    if command -v pm2 &> /dev/null; then
        pm2 restart rencanangoding 2>/dev/null || pm2 start "pnpm --filter @rencanangoding/web start" --name rencanangoding
    else
        nohup pnpm --filter @rencanangoding/web start > server.log 2>&1 &
    fi
fi

echo ""
echo "========================================================"
echo "   ✅ INSTALASI BERHASIL DILAKUKAN!"
echo "========================================================"
echo ""
echo " 🌐 Akses Web App di Browser:"
echo "    • Localhost: http://localhost:$PORT"
echo "    • Server IP: http://$SERVER_IP:$PORT"
echo ""
echo " 📁 Lokasi Data: ~/.rencanangoding"
echo " ⚙️ Port Default: $PORT"
echo ""
echo " Selamat merancang spesifikasi aplikasi kamu!"
echo "========================================================"
