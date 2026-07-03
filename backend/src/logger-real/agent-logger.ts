/**
 * 📝 Agent Logger — файловое логирование агентов
 * 
 * Пишет в .agent_logs/:
 * - content.log — что агент говорит
 * - reasoning.log — как агент мыслит
 * - tool_calls.log — какие инструменты
 * - tool_result.log — результаты
 * - ordered.log — хронология
 */

import { appendFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';

const LOG_DIR = join(process.cwd(), '.agent_logs');

async function ensureDir() {
  try { await mkdir(LOG_DIR, { recursive: true }); } catch {}
}

async function write(kind: string, agentId: string, text: string) {
  await ensureDir();
  const file = join(LOG_DIR, `agent-${agentId}.${kind}.log`);
  try { await appendFile(file, text, 'utf-8'); } catch {}
}

export async function logContent(agentId: string, text: string) {
  await write('content', agentId, text);
}

export async function logReasoning(agentId: string, text: string) {
  await write('reasoning', agentId, text);
}

export async function logToolCall(agentId: string, name: string, args: string, result?: string) {
  const text = `\n[${new Date().toISOString()}] TOOL: ${name}\nARGS: ${args}\n${result ? `RESULT: ${result.slice(0, 500)}\n` : ''}`;
  await write('tool_calls', agentId, text);
}

export async function logToolResult(agentId: string, result: string) {
  await write('tool_result', agentId, result + '\n');
}

export async function logOrdered(agentId: string, entry: string) {
  const text = `[${new Date().toISOString()}] ${entry}\n`;
  await write('ordered', agentId, text);
}

export async function logLLMRequest(agentId: string, body: string) {
  await write('llm_requests', agentId, body + '\n');
}
