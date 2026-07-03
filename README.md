# 🧠 Swarm IDE v3.0 — Роевой интеллект AI-агентов

**28 фишек · 126 файлов · 23 модуля · 12 моделей · Полностью на русском**

---

## 🤖 МОДЕЛИ — Fallback из 12 моделей

При ошибке/тротлинге система автоматически переключается на следующую.

### 🏆 УРОВЕНЬ 1: Opencode Zen (бесплатно)

| Модель | Качество | Бенчмарки | Контекст |
|--------|----------|-----------|----------|
| **Nemotron 3 Ultra Free** | 95/100 | MMLU-Pro 90.1%, GPQA 88.8%, AIME 92.1% | 1M |
| **DeepSeek V4 Flash Free** | 85/100 | SWE-Bench 79%, LiveCodeBench 91.6% | 1M |

### 🔥 УРОВЕНЬ 2: Mistral Console (500k запросов/день БЕСПЛАТНО)

| Модель | Качество | TPM | Бенчмарки | Context | Vision |
|--------|----------|-----|-----------|---------|--------|
| **Codestral** | 88/100 | 625K | HumanEval 86.6%, FIM <200ms | 256K | ❌ |
| **Mistral Large 3** | 86/100 | 250K | MMLU 84%, HumanEval 92% | 262K | ✅ |
| **Devstral 2** | 84/100 | 1M | SWE-Bench 72.2% | 262K | ❌ |
| **Leanstral 1.5.1** 🧪 | 80/100 | **5M!!** | pass@2 26.3% за $36 | 262K | ✅ |
| **Mistral Medium** | 78/100 | 375K | LMArena #8, Coding #3 | 262K | ✅ |
| **Mistral Small 2603** | 72/100 | 50K | Vision + функции | 262K | ✅ |
| **Ministral 8B** ⚡ | 65/100 | 625K | 3.13 req/s | 262K | ✅ |

#### 🔬 Подробно о ключевых моделях:

**Leanstral 1.5.1** — специалист по GENERATIVE AI и формальной верификации кода (Lean 4). Превосходит Claude Sonnet в 15x по цене/качеству. **5 000 000 TPM!**

**Devstral 2** — 123B параметров, Apache 2.0. SWE-Bench Verified 72.2%, Multilingual 61.3%. Лучший для agentic coding.

**Codestral** — 86.6% HumanEval, 80+ языков, FIM <200ms. Лучший для кода.

**Mistral Large 3** — 675B MoE (41B active). Apache 2.0. Нативное vision. GDPR-ready.

### 💰 УРОВЕНЬ 3: Agnes AI (наш ключ — всегда работает)

| Модель | Качество | Лимиты | Контекст |
|--------|----------|--------|----------|
| **Agnes 2.0 Flash** | 55/100 | ∞ | 512K |

---

## 🛠️ 15+ ИНСТРУМЕНТОВ

web_search · fetch_page · bash (root!) · install_package · write_file · read_file · generate_image · generate_video · analyze_image · create_agent · list_agents · list_files · self_info

---

## 🏆 28 ФИШЕК

**Ядро:** MCP, Spells, Skills, Agent Logger, UI Event Bus
**Модели:** 12 моделей, fallback, Vision, Image, Video
**Агенты:** 10 улучшений качества, 8 шаблонов
**Память:** 1 млрд токенов, 6 уровней
**Песочница:** Root, apt/npm/pip, фоновые процессы
**Технологии:** PostgreSQL, WebSocket, JWT, Zod, Rate Limiter
**Сеть:** DuckDuckGo, webhooks, автообновление
**Данные:** RAG, семантический поиск, экспорт/импорт

---

## 🚀 ЗАПУСК

```bash
git clone https://github.com/artyrroma35-wq/swarm-ide
cd swarm-ide/backend
cp .env.example .env.local
# Добавь API ключи в .env.local
npm install && npm run dev
```

Открой **http://localhost:3017**

## 🔑 API КЛЮЧИ

```env
OPENCODE_ZEN_API_KEY=ключ_от_opencode.ai/auth
MISTRAL_API_KEY=ключ_от_console.mistral.ai/api-keys
AGNES_API_KEY=ключ_от_agnes-ai.com
```

## 📄 Лицензия: MIT
