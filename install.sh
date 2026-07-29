#!/usr/bin/env bash
set -e

echo "🚀 Memulai Instalasi Self-Host RencanaNgoding.ai..."

if ! command -v docker &> /dev/null
then
    echo "❌ Error: Docker belum terinstall. Harap install Docker & Docker Compose terlebih dahulu."
    exit 1
fi

mkdir -p rencanangoding
cd rencanangoding

echo "📥 Menyiapkan Docker Compose..."
curl -fsSL https://raw.githubusercontent.com/rencanangoding/rencanangoding.ai/main/docker-compose.yml -o docker-compose.yml

echo "🐳 Menjalankan kontainer RencanaNgoding.ai..."
docker compose up -d

echo "✅ Instalasi Selesai! Buka browser kamu di http://localhost:3000"
