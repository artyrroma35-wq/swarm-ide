/**
 * 🤖 УНИВЕРСАЛЬНЫЙ LLM КЛИЕНТ С ТРОЙНЫМ FALLBACK
 * 
 * Стратегия: Nemotron → DeepSeek → Agnes
 * Качество: 95 → 85 → 55
 * Стабильность: Низкая → Средняя → Высокая
 */

import { getConfig } from './config';

export interface LLMMessage {
  role: string;
  content: string;
  tool_call_id?: string;
  name?: string;
  tool_calls?: Array<{ id: string; type: string; function: { name: string; arguments: string } }>;
}

export interface ToolDefinition {
  type: 'function';
  function: { name: string; description: string; parameters: Record<string, unknown> };
}

export interface StreamChunk {
  type: 'reasoning' | 'content' | 'tool_call' | 'done' | 'error';
  data: unknown;
}

const MODELS = [
  { name: 'nemotron-3-ultra-free', provider: 'opencode', quality: 95, desc: '🏆 Лучшее качество (NVIDIA)' },
  { name: 'deepseek-v4-flash-free', provider: 'opencode', quality: 85, desc: '⚡ Быстрый и стабильный' },
];

const AGNES_MODEL = { name: 'agnes-2.0-flash', provider: 'agnes', quality: 55, desc: '💰 Надёжный 24/7 (Agnes AI)' };

async function makeRequest(
  model: string,
  provider: string,
  messages: LLMMessage[],
  tools: ToolDefinition[],
  options?: { maxTokens?: number }
): Promise<Response> {
  const config = getConfig();
  let url: string;
  let key: string;

  if (provider === 'agnes') {
    url = `${config.agnesEndpoint}/chat/completions`;
    key = config.agnesApiKey;
  } else {
    url = `${config.opencodeZenBaseUrl}/chat/completions`;
    key = config.opencodeZenApiKey;
  }

  const payload: Record<string, unknown> = {
    model,
    messages: messages.map(m => {
      const { tool_calls, ...rest } = m;
      return m.role === 'assistant' && tool_calls ? { ...rest, tool_calls } : rest;
    }),
    tools: tools.length > 0 ? tools : undefined,
    tool_choice: tools.length > 0 ? 'auto' : undefined,
    stream: true,
    max_tokens: options?.maxTokens ?? 64000,
    temperature: 0.7,
  };

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (key) headers['Authorization'] = `Bearer ${key}`;

  return fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
}

async function* streamFromResponse(
  response: Response
): AsyncGenerator<StreamChunk> {
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    yield { type: 'error', data: `${response.status}: ${text.slice(0, 200)}` };
    return;
  }
  if (!response.body) {
    yield { type: 'error', data: 'Нет тела ответа' };
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const t = line.trim();
        if (!t || !t.startsWith('data: ')) continue;
        const d = t.slice(6).trim();
        if (d === '[DONE]') return;

        try {
          const chunk = JSON.parse(d);
          const choice = chunk.choices?.[0];
          const delta = choice?.delta;

          if (delta?.reasoning || delta?.reasoning_content) {
            yield { type: 'reasoning', data: delta.reasoning ?? delta.reasoning_content };
          }
          if (typeof delta?.content === 'string') {
            yield { type: 'content', data: delta.content };
          }
          if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
              yield {
                type: 'tool_call',
                data: {
                  index: tc.index ?? 0,
                  id: tc.id,
                  name: tc.function?.name,
                  arguments: tc.function?.arguments ?? '',
                },
              };
            }
          }
          if (typeof choice?.finish_reason !== 'undefined') {
            yield { type: 'done', data: { finishReason: choice.finish_reason } };
          }
        } catch {}
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * 🧠 ПОТОКОВЫЙ ЧАТ С ТРОЙНЫМ FALLBACK
 * 
 * Пытается: Nemotron → DeepSeek → Agnes
 * При ошибке или таймауте — переключается на следующую модель
 */
export async function* streamChat(
  messages: LLMMessage[],
  tools: ToolDefinition[],
  options?: { model?: string; maxTokens?: number }
): AsyncGenerator<StreamChunk> {
  const config = getConfig();
  const modelsToTry = [...MODELS];
  
  // Добавляем Agnes если есть ключ
  if (config.agnesApiKey) {
    modelsToTry.push(AGNES_MODEL);
  }

  // Если юзер явно указал модель — пробуем только её
  if (options?.model) {
    const modelInfo = modelsToTry.find(m => m.name === options.model);
    if (modelInfo) {
      modelsToTry.splice(0, modelsToTry.length, modelInfo);
    } else {
      modelsToTry.splice(0, modelsToTry.length, { name: options.model, provider: 'opencode', quality: 50, desc: 'User-specified' });
    }
  }

  let lastError = '';

  for (const model of modelsToTry) {
    try {
      const response = await makeRequest(model.name, model.provider, messages, tools, options);

      if (response.ok) {
        // Стримим ответ
        for await (const chunk of streamFromResponse(response)) {
          if (chunk.type === 'error') {
            lastError = chunk.data as string;
            yield { type: 'error', data: `[${model.name}] ${chunk.data}` };
            break; // Пробуем следующую модель
          }
          yield chunk; // Отдаём чанк
        }

        // Если мы дошли до конца без ошибки — всё ок
        return;

      } else {
        const text = await response.text().catch(() => '');
        const errorMsg = `${response.status} ${text.slice(0, 100)}`;
        lastError = `[${model.name}] ${errorMsg}`;
        
        // Если это 403/429 — rate limit, пробуем следующую модель
        if (response.status === 403 || response.status === 429) {
          
          continue;
        }
        
        // Если 500+ — провайдер упал, пробуем следующую
        if (response.status >= 500) {
          
          continue;
        }

        // Другие ошибки — тоже пробуем следующую
        
      }
    } catch (e: any) {
      lastError = `[${model.name}] ${e.message || e}`;
      
    }
  }

  // Если все модели упали
  if (lastError) {
    yield { type: 'error', data: `❌ Все модели недоступны. Последняя ошибка: ${lastError}` };
  } else {
    yield { type: 'error', data: '❌ Нет доступных моделей. Укажите API ключ.' };
  }
}

/**
 * НЕПОТОКОВЫЙ ЧАТ (для простых вызовов)
 */
export async function chat(
  messages: LLMMessage[],
  tools: ToolDefinition[],
  options?: { model?: string; maxTokens?: number }
): Promise<{ content: string; toolCalls: Array<{ id: string; name: string; arguments: string }> }> {
  let content = '';
  const toolCalls: Array<{ id: string; name: string; arguments: string }> = [];

  for await (const chunk of streamChat(messages, tools, options)) {
    switch (chunk.type) {
      case 'content':
        content += chunk.data as string;
        break;
      case 'tool_call': {
        const tc = chunk.data as any;
        const existing = toolCalls.find(t => t.name === tc.name);
        if (existing) {
          existing.arguments += tc.arguments || '';
        } else {
          toolCalls.push({
            id: tc.id || `call_${toolCalls.length}`,
            name: tc.name || 'unknown',
            arguments: tc.arguments || '',
          });
        }
        break;
      }
      case 'error':
        throw new Error(chunk.data as string);
    }
  }

  return { content, toolCalls };
}
