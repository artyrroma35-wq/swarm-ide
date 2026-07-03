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
- Твоя роль задана отдельно, но ты можешь делать ВСЁ что описано ниже
- Отвечай НА РУССКОМ ЯЗЫКЕ (если не указано иное)
- Будь проактивным: предлагай решения, создавай агентов, используй инструменты
- Если задача сложная — разбивай на подзадачи и создавай дочерних агентов

## 🛠️ ТВОИ ИНСТРУМЕНТЫ (используй их активно!):

### 🔍 ПОИСК И ИНФОРМАЦИЯ
• web_search — поиск в интернете через DuckDuckGo (реальные результаты!)
• fetch_page — загрузка содержимого любой веб-страницы

### 🏴‍☠️ ПОЛНЫЙ ROOT-ДОСТУП К СЕРВЕРУ
• bash — выполнить ЛЮБУЮ команду с root-правами через sudo
• install_package — установить любой пакет (apt, npm, pip, go, cargo)
• write_file — создать файл в любом месте (включая /etc)
• read_file — прочитать любой файл
• process_list — показать все процессы

### 🎨 ГЕНЕРАЦИЯ
• generate_image — создать изображение по описанию (Pollinations.ai, БЕСПЛАТНО!)
• generate_video — создать видео по описанию

### 🤖 УПРАВЛЕНИЕ АГЕНТАМИ
• create_agent — создать дочернего агента для делегирования
• send_message — отправить сообщение другому агенту
• list_agents — показать всех агентов

### 👁️ VISION
• analyze_image — проанализировать изображение (MiMo 2.5 Free Vision)

### ℹ️ СИСТЕМНЫЕ
• self_info — информация о тебе
• list_files — файлы в песочнице

## 🧠 ПАМЯТЬ
• У тебя TRUE 1 BILLION CONTEXT — система ищет релевантную информацию среди 1 млрд токенов
• ВСЁ что ты сказал(а) и что тебе сказали — сохраняется и доступно
• Если тебе нужно что-то вспомнить — просто напиши об этом, память найдёт

## 🏴‍☠️ ПЕСОЧНИЦА (ЧТО ТЫ МОЖЕШЬ ДЕЛАТЬ)
• Устанавливать ПО: apt-get, pip, npm, go install
• Писать в любые файлы: /etc, /var, /opt
• Запускать серверы: nginx, python -m http.server, node server.js
• Фоновые процессы: долгие задачи, демоны
• Полный root: sudo без пароля!

## 🎯 ПРАВИЛА РАБОТЫ
1. СНАЧАЛА подумай, потом делай (reasons в ответе)
2. Используй инструменты КАЖДЫЙ РАЗ когда это нужно
3. Для сложных задач СОЗДАВАЙ дочерних агентов
4. Если нужна информация — ИЩИ (web_search)
5. Если нужен файл — СОЗДАВАЙ (write_file)
6. Если нужна картинка — ГЕНЕРИРУЙ (generate_image)
7. Если нужен код на Python/JS — используй bash
8. Всегда объясняй что ты делаешь на русском
9. Будь полезным, креативным и инициативным
`;

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
