/**
 * 🤖 10 УЛУЧШЕНИЙ КАЧЕСТВА АГЕНТОВ
 */
import { eventBus } from '../runtime/event-bus';

// 2. CONTEXT TRIMMING
export function trimContext(history: any[], maxTokens: number = 80000): any[] {
  let totalTokens = countTokens(history);
  if (totalTokens <= maxTokens) return history;
  const trimmed = [...history];
  const systemIdx = trimmed.findIndex(m => m.role === 'system');
  const system = systemIdx >= 0 ? trimmed.splice(systemIdx, 1)[0] : null;
  while (trimmed.length > 10 && totalTokens > maxTokens) {
    const removed = trimmed.shift();
    if (removed) totalTokens -= countTokens([removed]);
  }
  if (totalTokens > maxTokens && trimmed.length > 5) {
    const oldMessages = trimmed.splice(0, trimmed.length - 5);
    trimmed.unshift({ role: 'system', content: `[Сжато: ${oldMessages.length} сообщений]` });
  }
  if (system) trimmed.unshift(system);
  return trimmed;
}

function countTokens(messages: any[]): number {
  return messages.reduce((s: number, m: any) => s + Math.ceil((typeof m.content === 'string' ? m.content : JSON.stringify(m.content)).length / 3), 0);
}

// 3. QUALITY CHECK
export function checkResponseQuality(response: string): { quality: 'good'|'poor'|'empty'; reason?: string } {
  if (!response?.trim()) return { quality: 'empty', reason: 'Пусто' };
  if (response.length < 10) return { quality: 'poor', reason: 'Слишком короткий' };
  if (/не знаю|не могу|не умею|извини/i.test(response)) return { quality: 'poor', reason: 'Отказ' };
  if (/ошибк|error|exception/i.test(response) && response.length < 50) return { quality: 'poor', reason: 'Ошибка' };
  return { quality: 'good' };
}

// 4. TOOL RETRY
export async function withToolRetry<T>(fn: () => Promise<T>, opts: { maxRetries?: number; toolName?: string } = {}): Promise<T> {
  for (let a = 1; a <= (opts.maxRetries || 2); a++) {
    try { return await fn(); } catch (e: any) {
      if (e.status === 403 || e.status === 429) throw e;
      if (a < (opts.maxRetries || 2)) await new Promise(r => setTimeout(r, 1000 * a));
      else throw e;
    }
  }
  throw new Error('Retry failed');
}

// 7. SELF-CORRECTION
export function shouldSelfCorrect(response: string, toolResults: any[]): boolean {
  if (toolResults.some(r => r.error)) return true;
  if (/ошибся|неправильно|перепутал|исправляюсь/i.test(response)) return true;
  return false;
}

// 9. TIMEOUT
export function createTimeoutPromise(ms: number): Promise<never> {
  return new Promise((_, r) => setTimeout(() => r(new Error(`Timeout ${ms}ms`)), ms));
}

// 10. LANGUAGE
export function detectLanguage(text: string): 'ru'|'en'|'mixed' {
  const ru = (text.match(/[а-яёА-ЯЁ]/g)||[]).length;
  const en = (text.match(/[a-zA-Z]/g)||[]).length;
  if (ru > en*2) return 'ru';
  if (en > ru*2) return 'en';
  return 'mixed';
}
