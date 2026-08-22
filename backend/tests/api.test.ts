/**
 * 🧪 API тесты Swarm IDE
 * Запуск: npx vitest run
 */
import { describe, it, expect } from 'vitest';

describe('API Logic', () => {
  it('Health GET handler returns ok', async () => {
    const { GET } = await import('../app/api/health/route');
    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.status).toBe('ok');
  });

  it('Spells GET handler returns spells list', async () => {
    const { GET } = await import('../app/api/spells/route');
    const res = await GET();
    const data = await res.json();
    expect(Array.isArray(data.spells)).toBe(true);
    expect(data.spells.length).toBeGreaterThan(0);
    expect(data.spells[0]).toHaveProperty('name');
  });
});

describe('Sandbox', () => {
  it('exec whoami returns user', async () => {
    const { getSandbox } = await import('../src/sandbox/unlimited-sandbox');
    const sb = getSandbox();
    const data = sb.exec('whoami');
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
