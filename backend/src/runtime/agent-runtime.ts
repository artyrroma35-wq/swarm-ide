import { db } from '../db/client';
import { streamChat, type LLMMessage } from '../lib/llm';
import { getToolDefinitions, getToolHandler } from '../tools/registry';
import { eventBus } from './event-bus';
import { getBillionContext } from '../memory/true-billion-context';

export type UUID = string;

// ===================== СИСТЕМНЫЙ ПРОМПТ =====================
// Этот промпт получает КАЖДЫЙ агент при создании.
// В нём описаны ВСЕ возможности системы.
// =============================================================

const MASTER_SYSTEM_PROMPT = `ТЫ — МОЩНЫЙ AI-АГЕНТ С НЕОГРАНИЧЕННЫМИ ВОЗМОЖНОСТЯМИ 🚀

## 🧠 О ТЕБЕ
- Ты работаешь в Swarm IDE — платформе роевого интеллекта
- Отвечай НА РУССКОМ ЯЗЫКЕ
- Будь проактивным, используй инструменты, создавай агентов
- Если задача сложная — разбивай на подзадачи

## 🤖 ТВОИ МОДЕЛИ (12 шт, автоматический fallback)
Система сама выбирает лучшую доступную модель. При ошибке — переключается на следующую.

### 🏆 1-2. Opencode Zen (бесплатно)
• Nemotron 3 Ultra Free (95/100) — NVIDIA. MMLU-Pro 90.1%, GPQA 88.8%. Reasoning. 1M контекст.
• DeepSeek V4 Flash Free (85/100) — DeepSeek. SWE-Bench 79%, LiveCodeBench 91.6%. 1M контекст.

### 🔥 3-9. Mistral Console (500k запросов/день БЕСПЛАТНО)
• Codestral (88/100) — КОД. HumanEval 86.6%. FIM. 256K. 80+ языков.
• Mistral Large 3 (86/100) — ФЛАГМАН. 262K. Vision. Функции. 675B MoE. Apache 2.0.
• Devstral 2 (84/100) — КОД + АГЕНТЫ. SWE-Bench 72.2%. 123B. 262K.
• Leanstral 1.5.1 (80/100) — 5M TPM!! Формальная верификация кода. Lean 4.
• Mistral Medium (78/100) — БАЛАНС. 375K TPM. Vision. LMArena #8.
• Mistral Small 2603 (72/100) — Vision. Функции. 50K TPM.
• Ministral 8B (65/100) — 625K TPM. 3.13 req/s. Vision. 262K.

### 🧠 СЛУЖЕБНЫЕ МОДЕЛИ MISTRAL (для подсистем)
• mistral-embed — 20 000 000 TPM! Векторные эмбеддинги 1024D. Для RAG и поиска.
• codestral-embed — Эмбеддинги кода. До 3072D. INT8. Поиск по репозиториям.
• mistral-ocr-latest — OCR документов. PDF/DOC/PPT. 170 языков. $4/1000 стр.
• voxtral-mini-2602 — Аудио→текст. 13 языков. diarization. $0.003/мин.
• mistral-moderation-2603 — Модерация контента. 50K TPM. Бесплатно.

### 💰 10. Agnes AI (наш ключ — всегда работает)
• Agnes 2.0 Flash (55/100) — СТАБИЛЬНОСТЬ 24/7. 512K контекст. Без лимитов.

## 🛠️ ИНСТРУМЕНТЫ
• web_search — поиск в интернете через DuckDuckGo
• fetch_page — загрузка любой веб-страницы
• bash — ЛЮБАЯ команда с ROOT-доступом через sudo
• install_package — установка apt/npm/pip/go
• write_file / read_file — работа с файлами
• generate_image — создание изображений
• generate_video — создание видео
• analyze_image — анализ изображений (MiMo Vision)
• create_agent — создание дочерних агентов
• self_info / list_agents / list_files — информация

## 🏴‍☠️ ROOT-ДОСТУП
• sudo без пароля! apt-get install, pip install, npm install
• Запись в /etc, /var, /opt
• Запуск серверов и фоновых процессов

## 🎯 ПРАВИЛА
1. Используй инструменты КАЖДЫЙ РАЗ когда нужно
2. Для сложных задач СОЗДАВАЙ дочерних агентов
3. Если информация нужна — ИЩИ (web_search)
4. Если нужна картинка — ГЕНЕРИРУЙ (generate_image)
5. Всегда объясняй что делаешь на русском
6. Если ошибся — признай и исправь
7. Не говори «я не могу» — ЛУЧШЕ ПОПРОБУЙ
8. Если модель дала плохой ответ — исправь и попробуй другой подход
9. При ошибке инструмента — система автоматически повторит запрос``;

class AgentRuntime {
  private runners = new Map<UUID, AgentRunner>();
  private interrupts = new Map<UUID, boolean>();

  async wakeAgent(id: UUID, groupId?: string) {
    let r = this.runners.get(id);
    if (!r) { r = new AgentRunner(id, this); this.runners.set(id, r); }
    await r.process(groupId);
  }

  async wakeAgentsForGroup(gid: UUID, sid: UUID) {
    const ms = await db.listGroupMemberIds(gid);
    for (const m of ms) {
      if (m !== sid) {
        const a = await db.getAgent(m);
        if (a && a.role !== 'human') await this.wakeAgent(m, gid);
      }
    }
  }

  interruptAgent(id: UUID) { this.interrupts.set(id, true); eventBus.emit(`agent:${id}`, { event: 'interrupted', data: {} }); }
  interruptAll(wsId?: UUID) { db.listAgents(wsId).then(all => { for (const a of all) if (a.role !== 'human') this.interruptAgent(a.id); }); }

  async createAgent(wsId: UUID, role: string, parentId: UUID | null, guidance?: string) {
    // Собираем финальный промпт: мастер-промпт + роль + инструкции
    const systemPrompt = `${MASTER_SYSTEM_PROMPT}

## 👤 ТВОЯ РОЛЬ
Ты — "${role}".
${guidance ? `\n### ДОПОЛНИТЕЛЬНЫЕ ИНСТРУКЦИИ:\n${guidance}` : ''}

## 🚀 НАЧИНАЙ
Твои инструменты готовы, root-доступ есть, память бесконечна. Действуй!`;

    const id = db.id();
    await db.createAgent({
      id, workspaceId: wsId, role, parentId,
      llmHistory: JSON.stringify([{ role: 'system', content: systemPrompt }]),
      systemPrompt, model: '', status: 'idle', createdAt: new Date().toISOString(),
    });
    const human = await db.getOrCreateHumanAgent(wsId);
    const gid = db.id();
    await db.createGroup({ id: gid, workspaceId: wsId, name: role, contextTokens: 0, createdAt: new Date().toISOString() });
    await db.addGroupMember(gid, human.id);
    await db.addGroupMember(gid, id);
    eventBus.emit(`workspace:${wsId}`, { event: 'agent_created', data: { agentId: id, role, groupId: gid } });
    eventBus.emit(`workspace:${wsId}`, { event: 'group_created', data: { groupId: gid, name: role, memberIds: [human.id, id] } });
    return { agentId: id, groupId: gid };
  }
}

class AgentRunner {
  private running = false;
  constructor(private id: UUID, private rt: AgentRuntime) {}

  async process(groupId?: string) {
    if (this.running) return;
    this.running = true;

    try {
      const agent = await db.getAgent(this.id);
      if (!agent) return;

      await db.updateAgent(this.id, { status: 'thinking' });
      eventBus.emit(`agent:${this.id}`, { event: 'status', data: 'thinking' });

      // Загрузка из TRUE BILLION CONTEXT
      const bc = getBillionContext();
      const recentHistory: LLMMessage[] = JSON.parse(agent.llmHistory);
      const recentTexts = recentHistory.slice(-5).map(m => m.content).filter(Boolean);
      const memoryContext = await bc.buildContext(this.id, agent.workspaceId, recentTexts);

      const history: LLMMessage[] = JSON.parse(agent.llmHistory);

      // Вставляем память в системный промпт
      if (history.length > 0 && history[0].role === 'system') {
        history[0] = {
          role: 'system',
          content: `${agent.systemPrompt}\n\n===== 🧠 КОНТЕКСТ ИЗ ПАМЯТИ (1 млрд токенов) =====\n${memoryContext}\n\n===== КОНЕЦ ПАМЯТИ =====\n\nПродолжай диалог. Если нужно больше информации — используй web_search или bash.`,
        };
      }

      const tools = getToolDefinitions();
      let resp = '';

      for await (const chunk of streamChat(history, tools)) {
        if (this.rt.interrupts.get(this.id)) {
          this.rt.interrupts.delete(this.id);
          await db.updateAgent(this.id, { status: 'idle' });
          eventBus.emit(`agent:${this.id}`, { event: 'status', data: 'idle' });
          this.running = false; return;
        }
        switch (chunk.type) {
          case 'reasoning':
            eventBus.emit(`agent:${this.id}`, { event: 'reasoning', data: chunk.data });
            break;
          case 'content': {
            const d = chunk.data as string;
            resp += d;
            eventBus.emit(`agent:${this.id}`, { event: 'content', data: d });
            break;
          }
          case 'tool_call': {
            const tc = chunk.data as any;
            eventBus.emit(`agent:${this.id}`, { event: 'tool_call', data: tc });
            if (tc.name) {
              const handler = getToolHandler(tc.name);
              if (handler) {
                let args: any = {};
                try { args = JSON.parse(tc.arguments); } catch {}
                const result = await handler.execute(args, { workspaceId: agent.workspaceId, agentId: this.id });
                eventBus.emit(`agent:${this.id}`, { event: 'tool_result', data: { name: tc.name, result } });
                history.push({ role: 'assistant', content: resp || '', tool_calls: [{ id: tc.id || `c_${Date.now()}`, type: 'function', function: { name: tc.name, arguments: tc.arguments } }] });
                history.push({ role: 'tool', content: result.output, tool_call_id: tc.id, name: tc.name });
                resp = '';

                // Сохраняем вызов в память
                await bc.remember(`[TOOL] ${tc.name} вызван с аргументами: ${tc.arguments}. Результат: ${result.output.slice(0, 200)}`, {
                  agentId: this.id, workspaceId: agent.workspaceId,
                  conversationId: groupId as UUID,
                  importance: 0.5, toolsUsed: [tc.name],
                }).catch(() => {});
              }
            }
            break;
          }
          case 'done': {
            if (resp) {
              history.push({ role: 'assistant', content: resp });
              await db.updateAgent(this.id, { llmHistory: JSON.stringify(history) });

              // Сохраняем ответ в 1 млрд контекст
              await bc.remember(resp, {
                agentId: this.id, workspaceId: agent.workspaceId,
                conversationId: groupId as UUID,
                toolsUsed: history.filter(h => h.role === 'tool').map(h => h.name || ''),
              }).catch(() => {});
            }
            break;
          }
          case 'error': {
            eventBus.emit(`agent:${this.id}`, { event: 'error', data: chunk.data });
            await db.updateAgent(this.id, { status: 'error' });
            this.running = false; return;
          }
        }
      }
      await db.updateAgent(this.id, { status: 'idle' });
      eventBus.emit(`agent:${this.id}`, { event: 'status', data: 'idle' });
    } catch (e) {
      eventBus.emit(`agent:${this.id}`, { event: 'error', data: String(e) });
      await db.updateAgent(this.id, { status: 'error' }).catch(() => {});
    }
    this.running = false;
  }
}

export function getRuntime() {
  if (!globalThis.__swarmRuntime) globalThis.__swarmRuntime = new AgentRuntime();
  return globalThis.__swarmRuntime;
}
