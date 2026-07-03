/**
 * 🤖 УНИВЕРСАЛЬНЫЙ LLM КЛИЕНТ
 *
 * Модели: Nemotron(95) → DeepSeek(85) → Mistral(72-88) → Agnes(55)
 * Mistral: 5M TPM макс, 7 моделей, Vision, функции
 */

export interface LLMMessage {
  role: string; content: string; tool_call_id?: string; name?: string;
  tool_calls?: Array<{ id: string; type: string; function: { name: string; arguments: string } }>;
}
export interface ToolDefinition { type: 'function'; function: { name: string; description: string; parameters: Record<string, unknown> }; }
export interface StreamChunk { type: 'reasoning' | 'content' | 'tool_call' | 'done' | 'error'; data: unknown; }

const BASE_MODELS = [
  { name: 'nemotron-3-ultra-free', provider: 'opencode', quality: 95, desc: 'Nemotron 3 Ultra' },
  { name: 'deepseek-v4-flash-free', provider: 'opencode', quality: 85, desc: 'DeepSeek V4 Flash' },
];

function getMistralModels(cfg: any): any[] {
  if (!cfg.mistralApiKey) return [];
  return [
    { name: 'codestral-latest', provider: 'mistral', quality: 88, desc: 'Codestral' },
    { name: 'mistral-large-latest', provider: 'mistral', quality: 86, desc: 'Mistral Large' },
    { name: 'devstral-latest', provider: 'mistral', quality: 84, desc: 'Devstral (1M TPM)' },
    { name: 'labs-leanstral-1-5-1', provider: 'mistral', quality: 80, desc: 'Leanstral (5M TPM!)' },
    { name: 'mistral-medium-latest', provider: 'mistral', quality: 78, desc: 'Mistral Medium' },
    { name: 'mistral-small-2603', provider: 'mistral', quality: 72, desc: 'Mistral Small' },
    { name: 'ministral-8b-latest', provider: 'mistral', quality: 65, desc: 'Ministral 8B' },
  ];
}

async function makeRequest(model: string, provider: string, messages: LLMMessage[], tools: ToolDefinition[], opts?: any): Promise<Response> {
  const { getConfig } = await import('./config');
  const cfg = getConfig();
  let url: string, key: string;
  if (provider === 'mistral') { url = `${cfg.mistralEndpoint}/chat/completions`; key = cfg.mistralApiKey; }
  else if (provider === 'agnes') { url = `${cfg.agnesEndpoint}/chat/completions`; key = cfg.agnesApiKey; }
  else { url = `${cfg.opencodeZenBaseUrl}/chat/completions`; key = cfg.opencodeZenApiKey; }
  const payload: any = { model, messages: messages.map(m => { const { tool_calls, ...rest } = m; return m.role === 'assistant' && tool_calls ? { ...rest, tool_calls } : rest; }), stream: true, max_tokens: opts?.maxTokens || 64000, temperature: 0.7 };
  if (tools.length > 0) { payload.tools = tools; payload.tool_choice = 'auto'; }
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (key) headers['Authorization'] = `Bearer ${key}`;
  return fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
}

async function* streamFromResponse(response: Response): AsyncGenerator<StreamChunk> {
  if (!response.ok) { const t = await response.text().catch(() => ''); yield { type: 'error', data: `${response.status}: ${t.slice(0, 100)}` }; return; }
  if (!response.body) { yield { type: 'error', data: 'empty' }; return; }
  const reader = response.body.getReader(); const decoder = new TextDecoder(); let buf = '';
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n'); buf = lines.pop() || '';
      for (const line of lines) {
        const t = line.trim(); if (!t || !t.startsWith('data: ')) continue;
        const d = t.slice(6).trim(); if (d === '[DONE]') return;
        try { const ch = JSON.parse(d); const c = ch.choices?.[0]; const dt = c?.delta;
          if (dt?.reasoning || dt?.reasoning_content) yield { type: 'reasoning', data: dt.reasoning || dt.reasoning_content };
          if (typeof dt?.content === 'string') yield { type: 'content', data: dt.content };
          if (dt?.tool_calls) { for (const tc of dt.tool_calls) yield { type: 'tool_call', data: { index: tc.index || 0, id: tc.id, name: tc.function?.name, arguments: tc.function?.arguments || '' } }; }
          if (typeof c?.finish_reason !== 'undefined') yield { type: 'done', data: { finishReason: c.finish_reason } };
        } catch {}
      }
    }
  } finally { reader.releaseLock(); }
}

export async function* streamChat(messages: LLMMessage[], tools: ToolDefinition[], options?: any): AsyncGenerator<StreamChunk> {
  const { getConfig } = await import('./config');
  const cfg = getConfig();
  const models = [...BASE_MODELS, ...getMistralModels(cfg)];
  if (cfg.agnesApiKey) models.push({ name: 'agnes-2.0-flash', provider: 'agnes', quality: 55, desc: 'Agnes 2.0 Flash' });
  if (options?.model) { const f = models.find((m: any) => m.name === options.model); if (f) { models.length = 0; models.push(f); } }
  let lastErr = '';
  for (const m of models) {
    try {
      const r = await makeRequest(m.name, m.provider, messages, tools, options);
      if (r.ok) { for await (const chunk of streamFromResponse(r)) yield chunk; return; }
      const s = r.status;
      if (s === 403 || s === 429) { lastErr = `${m.desc}: rate limit`; continue; }
      if (s >= 500) { lastErr = `${m.desc}: провайдер упал`; continue; }
      lastErr = `${m.desc}: ${s} ${(await r.text().catch(() => '')).slice(0, 50)}`;
    } catch (e: any) { lastErr = `${m.desc}: ${e.message?.slice(0, 100) || 'ошибка'}`; }
  }
  yield { type: 'error', data: `Все модели недоступны. ${lastErr}` };
}

export async function chat(messages: LLMMessage[], tools: ToolDefinition[], options?: any): Promise<{ content: string; toolCalls: any[] }> {
  let content = ''; const toolCalls: any[] = [];
  for await (const chunk of streamChat(messages, tools, options)) {
    switch (chunk.type) {
      case 'content': content += chunk.data as string; break;
      case 'tool_call': { const tc = chunk.data as any; const e = toolCalls.find((t: any) => t.name === tc.name); if (e) e.arguments += tc.arguments || ''; else toolCalls.push({ id: tc.id || `c_${Date.now()}`, name: tc.name || '?', arguments: tc.arguments || '' }); break; }
      case 'error': throw new Error(chunk.data as string);
    }
  }
  return { content, toolCalls };
}
