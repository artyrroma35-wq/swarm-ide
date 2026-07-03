export interface MCPTool {
  id: string; name: string; description: string; category: string;
  url: string; author: string; version: string; downloads: number;
  rating: number; tags: string[]; config: Record<string, string>;
  free: boolean;
}

const MARKETPLACE: MCPTool[] = [
  { id: 'mcp-github', name: 'GitHub MCP', description: 'Управление репозиториями, PR, issues', category: 'dev', url: 'https://github.com/modelcontextprotocol/github', author: 'Anthropic', version: '1.0', downloads: 50000, rating: 4.8, tags: ['git','github','dev'], config: { token: 'GITHUB_TOKEN' }, free: true },
  { id: 'mcp-filesystem', name: 'File System', description: 'Чтение/запись файлов, поиск', category: 'system', url: 'https://github.com/modelcontextprotocol/filesystem', author: 'Anthropic', version: '1.0', downloads: 45000, rating: 4.7, tags: ['files','system'], config: { allowedDir: 'ALLOWED_DIR' }, free: true },
  { id: 'mcp-postgres', name: 'PostgreSQL', description: 'Запросы к БД, схемы, данные', category: 'data', url: 'https://github.com/your-mcp/postgres', author: 'Community', version: '1.2', downloads: 30000, rating: 4.5, tags: ['database','sql','postgres'], config: { connectionString: 'DATABASE_URL' }, free: true },
  { id: 'mcp-search', name: 'Web Search', description: 'Поиск в Google, Bing, DuckDuckGo', category: 'search', url: 'https://github.com/mcp/search', author: 'Community', version: '2.0', downloads: 40000, rating: 4.6, tags: ['search','web','google'], config: { apiKey: 'SEARCH_API_KEY' }, free: true },
  { id: 'mcp-puppeteer', name: 'Browser Automation', description: 'Управление браузером, скриншоты', category: 'automation', url: 'https://github.com/modelcontextprotocol/puppeteer', author: 'Anthropic', version: '1.0', downloads: 35000, rating: 4.4, tags: ['browser','automation','test'], config: {}, free: true },
  { id: 'mcp-slack', name: 'Slack', description: 'Сообщения, каналы, поиск', category: 'communication', url: 'https://github.com/mcp/slack', author: 'Community', version: '1.1', downloads: 25000, rating: 4.3, tags: ['slack','chat','communication'], config: { token: 'SLACK_TOKEN' }, free: true },
  { id: 'mcp-docker', name: 'Docker MCP', description: 'Управление контейнерами, образами', category: 'devops', url: 'https://github.com/mcp/docker', author: 'Community', version: '1.0', downloads: 20000, rating: 4.6, tags: ['docker','containers','devops'], config: { socket: 'DOCKER_SOCKET' }, free: true },
  { id: 'mcp-sqlite', name: 'SQLite', description: 'Локальная БД без сервера', category: 'data', url: 'https://github.com/mcp/sqlite', author: 'Community', version: '1.0', downloads: 22000, rating: 4.5, tags: ['sqlite','database','local'], config: { dbPath: 'DB_PATH' }, free: true },
];

export class MCPMarketplace {
  async search(query: string): Promise<MCPTool[]> {
    const q = query.toLowerCase();
    return MARKETPLACE.filter(t => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.tags.some(tg => tg.includes(q)));
  }

  async getById(id: string): Promise<MCPTool | undefined> { return MARKETPLACE.find(t => t.id === id); }
  async list(): Promise<MCPTool[]> { return MARKETPLACE; }

  async install(toolId: string, workspaceId: string, config: Record<string, string>): Promise<{ success: boolean; url: string }> {
    const tool = MARKETPLACE.find(t => t.id === toolId);
    if (!tool) throw new Error('Tool not found');
    await db.createMCPServer({ id: db.id(), workspaceId, name: tool.name, url: tool.url, tools: JSON.stringify([tool.name]), enabled: true, createdAt: new Date().toISOString() });
    return { success: true, url: tool.url };
  }
}
declare global { var __mcpMarketplace: MCPMarketplace | undefined; }
import { db } from '../db/client';
export function getMCPMarketplace(): MCPMarketplace {
  if (!globalThis.__mcpMarketplace) globalThis.__mcpMarketplace = new MCPMarketplace();
  return globalThis.__mcpMarketplace;
}
