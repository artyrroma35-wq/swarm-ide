/**
 * 🧪 API тесты Swarm IDE
 * Запуск: npx vitest run
 */
import { describe, it, expect } from 'vitest';

describe('API Endpoints', () => {
  const BASE = 'http://localhost:3017';

  it('Health endpoint returns ok', async () => {
    const res = await fetch(`${BASE}/api/health`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.status).toBe('ok');
  });

  it('Spells API returns 4 spells', async () => {
    const res = await fetch(`${BASE}/api/spells`);
    const data = await res.json();
    expect(data.spells).toHaveLength(4);
    expect(data.spells[0]).toHaveProperty('name');
  });
});

describe('Sandbox', () => {
  const BASE = 'http://localhost:3017';

  it('exec whoami returns user', async () => {
    const res = await fetch(`${BASE}/api/sandbox`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'exec', command: 'whoami' })
    });
    const data = await res.json();
    expect(data.exitCode).toBe(0);
    expect(data.stdout).toBeTruthy();
  });
});

describe('Tools Registry', () => {
  it('getToolDefinitions returns array', async () => {
    const { getToolDefinitions } = await import('../src/tools/registry');
    const tools = getToolDefinitions();
    expect(Array.isArray(tools)).toBe(true);
    expect(tools.length).toBeGreaterThan(10);
  });
});

describe('Auth', () => {
  it('login schema validates correctly', async () => {
    const { validate } = await import('../src/lib/validation');
    const { WorkspaceCreateSchema } = await import('../src/lib/validation');
    const result = validate(WorkspaceCreateSchema, { name: 'Test' });
    expect(result.success).toBe(true);
  });
});
