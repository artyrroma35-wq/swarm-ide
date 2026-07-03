# 🧠 Swarm IDE v3.0 — Роевой интеллект AI-агентов

**28 фишек · 103 файла · 23 модуля · Полностью на русском**

## 🚀 Возможности

### 🤖 Модели (тройной fallback)
| Модель | Качество | Статус |
|--------|----------|--------|
| Nemotron 3 Ultra Free 🏆 | 95/100 — лучшее качество, reasoning | ⚠️ Нестабильный NVIDIA |
| DeepSeek V4 Flash Free ⚡ | 85/100 — скорость, код | ✅ Стабильный |
| Agnes 2.0 Flash 💰 | 55/100 — надёжность 24/7 | ✅ Стабильный |
| Agnes Image/Video 🎨 | — генерация | ✅ Работает |
| MiMo 2.5 Free 👁️ | — Vision анализ | ✅ Работает |

### 🛠️ Агенты — 10 улучшений качества
1. Тройной fallback — Nemotron → DeepSeek → Agnes
2. Context trimming — умная обрезка контекста
3. Response quality check — проверка качества
4. Tool retry — повтор при ошибках
5. Memory injection — память в каждый запрос
6. Conversation awareness — понимание контекста
7. Self-correction — самокоррекция
8. Timeout handling — обработка таймаутов
9. Language detection — автоопределение языка
10. System prompt — полный промпт с инструкциями

### 🏴‍☠️ Песочница — полный root-доступ
sudo whoami → root · apt-get install · pip install · npm install · запись в /etc

### 🔮 Spells — паттерны оркестрации
Map-Reduce · Router-Experts · Tree-Executor · Critic-Loop

### 🧩 MCP — Model Context Protocol
### 🧠 Память — 1 миллиард НЕСЖАТЫХ токенов
### 📊 28 фишек: ядро, модели, агенты, память, песочница, Postgres, WebSocket, JWT, Rate Limiter, RAG

## 🚀 Запуск
```bash
git clone https://github.com/artyrroma35-wq/swarm-ide
cd swarm-ide/backend
cp .env.example .env.local
npm install && npm run dev
```

## 🔑 API ключи
OpenCode Zen: https://opencode.ai/auth · Agnes AI: https://agnes-ai.com
