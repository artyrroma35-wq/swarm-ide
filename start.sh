#!/bin/bash
# 🚀 SWARM IDE — САМОВОССТАНАВЛИВАЮЩИЙСЯ ЗАПУСК
# Можно вызывать сколько угодно раз — сам восстановится.

set -e
SWARM_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT=${PORT:-3017}

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   🚀 SWARM IDE — ЗАПУСК                         ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ШАГ 1: Файлы
echo "📁 1. Проект: $(find "$SWARM_DIR" -type f -not -path '*/node_modules/*' -not -path '*/.next/*' -not -path '*/.git/*' 2>/dev/null | wc -l) файлов"

# ШАГ 2: Ключи (секреты НЕ хранятся в репозитории — берём из .env.local / переменных окружения)
if [ ! -f "$SWARM_DIR/backend/.env.local" ]; then
    cat > "$SWARM_DIR/backend/.env.local" << 'ENV'
# Вставьте свои ключи (см. backend/.env.example):
#   OPENCODE_ZEN_API_KEY — с opencode.ai/auth
#   MISTRAL_API_KEY      — с console.mistral.ai/api-keys
#   AGNES_API_KEY        — с agnes-ai.com
OPENCODE_ZEN_API_KEY=
TEXT_MODEL=nemotron-3-ultra-free
VISION_MODEL=mimo-v2.5-free
JWT_SECRET=change-me-in-production
AGNES_API_KEY=
AGNES_ENDPOINT=https://apihub.agnes-ai.com/v1
ENV
    echo "   ⚠️  Создан backend/.env.local — заполните API-ключи и перезапустите"
fi

# ШАГ 3: Зависимости
cd "$SWARM_DIR/backend"
if [ ! -d "node_modules" ]; then
    echo "📦 npm install..."
    npm install --silent 2>&1 | tail -1
fi

# ШАГ 4: Убить старый сервер
OLD_PID=$(ps aux | grep "next.*dev.*$PORT" | grep -v grep | awk '{print $2}' | head -1)
if [ -n "$OLD_PID" ]; then
    kill -9 $OLD_PID 2>/dev/null || true
    sleep 1
fi

# ШАГ 5: Запуск
echo "🚀 Запуск на порту $PORT..."
echo ""
echo "═══════════════════════════════════════════════════"
echo "  📱 ОТКРОЙ НА ТЕЛЕФОНЕ:"
echo "═══════════════════════════════════════════════════"
echo "$(ip addr show 2>/dev/null | grep -oP 'inet \K[\d.]+' | grep -v 127.0.0.1 | head -1 | xargs -I{} echo "  🌐 http://{}:$PORT")"
echo "  🌐 http://localhost:$PORT"
echo "═══════════════════════════════════════════════════"
echo ""

npx next dev -H 0.0.0.0 -p "$PORT"
