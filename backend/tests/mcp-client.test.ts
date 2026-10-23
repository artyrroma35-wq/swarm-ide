import { describe, it, expect } from 'vitest';
import { MCPClient } from '../src/mcp-real/mcp-client';

describe('MCPClient Security Tests', () => {
  it('safely handles stdio callTool without shell injection', async () => {
    const client = new MCPClient();

    const serversMap = (client as any).servers;
    const toolsMap = (client as any).tools;

    serversMap.set('testServer', {
      type: 'stdio',
      command: 'node',
      args: ['-e', 'console.log(JSON.stringify({ result: process.argv.slice(1) }))', '--'],
    });

    toolsMap.set('testServer_testTool', {
      exposedName: 'testServer_testTool',
      serverName: 'testServer',
      toolName: 'testTool',
      inputSchema: {},
    });

    const maliciousArgs = {
      payload: "'; touch /tmp/injection_test; echo '",
      subshell: '$(id)',
    };

    const res = await client.callTool('testServer_testTool', maliciousArgs);

    expect(res).toHaveProperty('result');
    expect(Array.isArray(res.result)).toBe(true);
    expect(res.result).toContain('--tool');
    expect(res.result).toContain('testTool');
    expect(res.result).toContain('--args');
    expect(res.result).toContain(JSON.stringify(maliciousArgs));
  });

  it('safely connects to stdio server using execFileSync', async () => {
    const client = new MCPClient();

    const serversMap = (client as any).servers;
    serversMap.set('stdioServer', {
      type: 'stdio',
      command: 'node',
      args: ['-e', 'console.log(JSON.stringify({ tools: [{ name: "myTool", description: "Test Tool" }] }))'],
    });

    const tools = await client.connectAll();
    expect(tools).toHaveLength(1);
    expect(tools[0].exposedName).toBe('stdioServer_myTool');
  });
});
