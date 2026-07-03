# 🧠 Swarm IDE v3.0 — Роевой интеллект AI-агентов

**28 фишек · 126 файлов · 23 модуля · 12+ моделей · Полностью на русском**

---

## 🤖 ВСЕ МОДЕЛИ В ПРОЕКТЕ

### 🏆 Чат-модели (fallback цепочка)
Nemotron 3 Ultra (95) → DeepSeek V4 (85) → Codestral (88) → Mistral Large (86) → Devstral (84) → Leanstral (80) → Mistral Medium (78) → Mistral Small (72) → Ministral 8B (65) → Agnes 2.0 Flash (55)

### 🧠 Служебные модели Mistral
| Модель | TPM | Назначение |
|--------|-----|------------|
| mistral-embed | 20 000 000 | Векторные эмбеддинги 1024D для RAG/поиска |
| codestral-embed | 50 000 | Эмбеддинги кода (до 3072D, INT8) |
| mistral-ocr-latest | 625 стр/мин | OCR документов, PDF, 170 языков |
| voxtral-mini-2602 | 50 000 | Аудио → текст, 13 языков, $0.003/мин |
| mistral-moderation | 50 000 | Модерация контента, бесплатно |

### 🎨 Мультимодальные
agnes-image-2.1-flash · agnes-video-v2.0 · mimo-v2.5-free · mistral-small-2603

---

## 🛠️ ИНСТРУМЕНТЫ
web_search · fetch_page · bash (root!) · install_package · write_file · read_file · generate_image · generate_video · analyze_image · create_agent · list_agents · self_info

---

## 🚀 ЗАПУСК
```bash
git clone https://github.com/artyrroma35-wq/swarm-ide
cd swarm-ide/backend
cp .env.example .env.local
npm install && npm run dev
```

## 🔑 API КЛЮЧИ
```env
OPENCODE_ZEN_API_KEY=ключ_от_opencode.ai/auth
MISTRAL_API_KEY=ключ_от_console.mistral.ai/api-keys
AGNES_API_KEY=ключ_от_agnes-ai.com
```

## 📄 Лицензия: MIT
