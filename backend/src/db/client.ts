export type UUID = string;
export type WorkspaceRow = { id: UUID; name: string; settings?: string | null; createdAt: string };
export type AgentRow = { id: UUID; workspaceId: UUID; role: string; parentId: UUID | null; llmHistory: string; systemPrompt: string; model: string; status: string; createdAt: string };
export type GroupRow = { id: UUID; workspaceId: UUID; name: string | null; contextTokens: number | null; createdAt: string };
export type MessageRow = { id: UUID; workspaceId: UUID; groupId: UUID; senderId: UUID; contentType: string; content: string; reasoningContent?: string | null; toolCalls?: string | null; toolResults?: string | null; sendTime: string };
export type FileRow = { id: UUID; workspaceId: UUID; name: string; path: string; mimeType: string; size: number; uploadedAt: string };
export type MCPServerRow = { id: UUID; workspaceId: UUID; name: string; url: string; tools: string; enabled: boolean; createdAt: string };

class Store {
  private w = new Map<UUID, WorkspaceRow>(); private a = new Map<UUID, AgentRow>(); private g = new Map<UUID, GroupRow>();
  private gm = new Map<string, { groupId: UUID; userId: UUID; joinedAt: string }>(); private m = new Map<UUID, MessageRow>();
  private f = new Map<UUID, FileRow>(); private mcp = new Map<UUID, MCPServerRow>();
  id(): UUID { return crypto.randomUUID(); }
  async listWorkspaces() { return [...this.w.values()].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); }
  async createWorkspace(name: string) { const r: WorkspaceRow = { id: this.id(), name, createdAt: new Date().toISOString(), settings: '{}' }; this.w.set(r.id, r); return r; }
  async listAgents(wsId?: UUID) { const all = [...this.a.values()]; return wsId ? all.filter(a => a.workspaceId === wsId) : all; }
  async getAgent(id: UUID) { return this.a.get(id) ?? null; }
  async createAgent(data: AgentRow) { this.a.set(data.id, data); return data; }
  async updateAgent(id: UUID, data: Partial<AgentRow>) { const e = this.a.get(id); if (e) this.a.set(id, { ...e, ...data }); }
  async listGroups(wsId?: UUID) { const all = [...this.g.values()]; return wsId ? all.filter(g => g.workspaceId === wsId) : all; }
  async getGroup(id: UUID) { return this.g.get(id) ?? null; }
  async createGroup(data: GroupRow) { this.g.set(data.id, data); return data; }
  async addGroupMember(gid: UUID, uid: UUID) { const k = `${gid}:${uid}`; if (!this.gm.has(k)) this.gm.set(k, { groupId: gid, userId: uid, joinedAt: new Date().toISOString() }); }
  async listGroupMemberIds(gid: UUID) { return [...this.gm.values()].filter(m => m.groupId === gid).map(m => m.userId); }
  async listMessages(gid: UUID, limit = 200) { return [...this.m.values()].filter(m => m.groupId === gid).sort((a,b) => new Date(a.sendTime).getTime() - new Date(b.sendTime).getTime()).slice(-limit); }
  async createMessage(data: MessageRow) { this.m.set(data.id, data); return data; }
  async listFiles(wsId: UUID) { return [...this.f.values()].filter(f => f.workspaceId === wsId); }
  async createFile(data: FileRow) { this.f.set(data.id, data); return data; }
  async listMCPServers(wsId: UUID) { return [...this.mcp.values()].filter(s => s.workspaceId === wsId); }
  async createMCPServer(data: MCPServerRow) { this.mcp.set(data.id, data); return data; }
  async getOrCreateHumanAgent(wsId: UUID) { const all = await this.listAgents(wsId); const h = all.find(a => a.role === 'human'); if (h) return h; return this.createAgent({ id: this.id(), workspaceId: wsId, role: 'human', parentId: null, llmHistory: '[]', systemPrompt: 'Человек', model: '', status: 'idle', createdAt: new Date().toISOString() }); }
  async getOrCreateMainGroup(wsId: UUID, hId: UUID, aId: UUID) { const gs = await this.listGroups(wsId); const m = gs.find(g => g.name === 'Основной чат'); if (m) return m; const g = await this.createGroup({ id: this.id(), workspaceId: wsId, name: 'Основной чат', contextTokens: 0, createdAt: new Date().toISOString() }); await this.addGroupMember(g.id, hId); await this.addGroupMember(g.id, aId); return g; }
}
export const db = new Store();
