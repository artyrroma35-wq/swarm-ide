/**
 * 🤖 УНИВЕРСАЛЬНЫЙ LLM КЛИЕНТ С ЧЕТВЕРНЫМ FALLBACK
 * 
 * Nemotron (95) → DeepSeek (85) → Mistral (80) → Agnes (55)
 * 
 * Mistral Console: 500k запросов/день, 50 RPM, 200K TPM — бесплатно
 * Agnes: наш ключ, всегда работает
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

const BASE_MODELS = [
  { name: 'nemotron-3-ultra-free', provider: 'opencode', quality: 95, desc: '🏆 Nemotron 3 Ultra' },
  { name: 'deepseek-v4-flash-free', provider: 'opencode', quality: 85, desc: '⚡ DeepSeek V4 Flash' },
];

async function makeRequest(
  model: string, provider: string,
  messages: LLMMessage[], tools: ToolDefinition[],
  options?: { maxTokens?: number }
): Promise<Response> {
  const config = getConfig();
  let url: string, key: string;

  switch (provider) {
    case 'mistral':
      url = `${config.mistralEndpoint}/chat/completions`;
      key = config.mistralApiKey;
      break;
    case 'agnes':
      url = `${config.agnesEndpoint}/chat/completions`;
      key = config.agnesApiKey;
      break;
    default: // opencode
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

async function* streamFromResponse(response: Response): AsyncGenerator<StreamChunk> {
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    yield { type: 'error', data: `${response.status}: ${text.slice(0, 100)}` };
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
          if (delta?.reasoning || delta?.reasoning_content)
            yield { type: 'reasoning', data: delta.reasoning ?? delta.reasoning_content };
          if (typeof delta?.content === 'string')
            yield { type: 'content', data: delta.content };
          
          // Mistral uses delta.tool_calls differently
          if (delta?.tool_calls) {
            for (const tc of delta.tool_calls)
              yield { type: 'tool_call', data: { index: tc.index ?? 0, id: tc.id, name: tc.function?.name, arguments: tc.function?.arguments ?? '' } };
          }
          if (typeof choice?.finish_reason !== 'undefined')
            yield { type: 'done', data: { finishReason: choice.finish_reason } };
        } catch {}
      }
    }
  } finally { reader.releaseLock(); }
}

/**
 * 🧠 ПОТОКОВЫЙ ЧАТ С ЧЕТВЕРНЫМ FALLBACK
 * 
 * Nemotron → DeepSeek → Mistral (если есть ключ) → Agnes (если есть ключ)
 * При 403/429/ошибке — мгновенное переключение на следующую модель
 */
export async function* streamChat(
  messages: LLMMessage[],
  tools: ToolDefinition[],
  options?: { model?: string; maxTokens?: number }
): AsyncGenerator<StreamChunk> {
  const config = getConfig();
  
  // Собираем модели динамически (только те, для которых есть ключи)
  const modelsToTry: Array<{ name: string; provider: string; quality: number; desc: string }> = [...BASE_MODELS];
  
  if (config.mistralApiKey) {
    modelsToTry.push({ name: config.mistralModel, provider: 'mistral', quality: 80, desc: '🔥 Mistral ' + config.mistralModel });
  }
  
  if (config.agnesApiKey) {
    modelsToTry.push({ name: 'agnes-2.0-flash', provider: 'agnes', quality: 55, desc: '💰 Agnes 2.0 Flash' });
  }

  // Если указана конкретная модель
  if (options?.model) {
    const found = modelsToTry.find(m => m.name === options.model);
    if (found) {
      modelsToTry.splice(0, modelsToTry.length, found);
    }
  }

  let lastError = '';

  for (const model of modelsToTry) {
    try {
      const response = await makeRequest(model.name, model.provider, messages, tools, options);

      if (response.ok) {
        for await (const chunk of streamFromResponse(response)) {
          yield chunk;
        }
        return;
      }

      const status = response.status;
      if (status === 403 || status === 429) {
        lastError = `${model.desc}: rate limit (${status})`;
        continue;
      }
      if (status >= 500) {
        lastError = `${model.desc}: провайдер не отвечает (${status})`;
        continue;
      }
      const text = await response.text().catch(() => '');
      lastError = `${model.desc}: ${status} ${text.slice(0, 50)}`;
      
    } catch (e: any) {
      lastError = `${model.desc}: ${e.message?.slice(0, 100) || 'ошибка'}`;
    }
  }

  yield { type: 'error', data: `❌ Все модели недоступны. ${lastError}` };
}

/**
 * НЕПОТОКОВЫЙ ЧАТ
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
      case 'content': content += chunk.data as string; break;
      case 'tool_call': {
        const tc = chunk.data as any;
        const existing = toolCalls.find(t => t.name === tc.name);
        if (existing) existing.arguments += tc.arguments || '';
        else toolCalls.push({ id: tc.id || `call_${Date.now()}`, name: tc.name || 'unknown', arguments: tc.arguments || '' });
        break;
      }
      case 'error': throw new Error(chunk.data as string);
    }
  }
  return { content, toolCalls };
}
