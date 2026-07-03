import { db } from '../db/client';

export class ExportImport {
  async exportWorkspace(workspaceId: string): Promise<object> {
    const all = await db.listWorkspaces();
    const ws = all.find(w => w.id === workspaceId);
    const agents = await db.listAgents(workspaceId);
    const groups = await db.listGroups(workspaceId);
    const files = await db.listFiles(workspaceId);
    const messages: any[] = [];
    for (const g of groups) messages.push(...(await db.listMessages(g.id, 1000)));
    return { version: '3.0', exportedAt: new Date().toISOString(), workspace: ws, agents, groups, messages, files };
  }

  async importWorkspace(data: any): Promise<string> {
    const ws = await db.createWorkspace(data.workspace?.name || 'Imported');
    for (const a of (data.agents||[])) { await db.createAgent({ ...a, id: db.id(), workspaceId: ws.id, createdAt: new Date().toISOString() }); }
    for (const g of (data.groups||[])) { await db.createGroup({ ...g, id: db.id(), workspaceId: ws.id, createdAt: new Date().toISOString() }); }
    return ws.id;
  }
}
export const exportImport = new ExportImport();
