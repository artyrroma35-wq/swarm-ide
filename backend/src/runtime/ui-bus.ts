/**
 * 📡 UI Event Bus — структурированные события для UI
 * 
 * События: ui.agent.created, ui.agent.llm.start, ui.agent.tool_call.start и т.д.
 */

export type UIEvent =
  | { event: 'ui.agent.created'; data: { workspaceId: string; agent: { id: string; role: string; parentId: string | null } } }
  | { event: 'ui.group.created'; data: { workspaceId: string; group: { id: string; name: string | null; memberIds: string[] } } }
  | { event: 'ui.message.created'; data: { workspaceId: string; groupId: string; message: { id: string; senderId: string } } }
  | { event: 'ui.agent.llm.start'; data: { workspaceId: string; agentId: string; groupId: string; round: number } }
  | { event: 'ui.agent.llm.done'; data: { workspaceId: string; agentId: string; groupId: string; round: number; finishReason?: string } }
  | { event: 'ui.agent.tool_call.start'; data: { workspaceId: string; agentId: string; toolName?: string } }
  | { event: 'ui.agent.tool_call.done'; data: { workspaceId: string; agentId: string; toolName?: string; ok: boolean } }
  | { event: 'ui.db.write'; data: { workspaceId: string; table: string; action: string; recordId?: string } };

type Listener = (evt: UIEvent) => void;

class WorkspaceUIBus {
  private channels = new Map<string, { id: number; buffer: UIEvent[]; listeners: Set<Listener> }>();

  private getChannel(workspaceId: string) {
    if (!this.channels.has(workspaceId)) {
      this.channels.set(workspaceId, { id: 0, buffer: [], listeners: new Set() });
    }
    return this.channels.get(workspaceId)!;
  }

  emit(workspaceId: string, event: UIEvent) {
    const ch = this.getChannel(workspaceId);
    const evt = { ...event, id: ch.id++ } as any;
    ch.buffer.push(evt);
    if (ch.buffer.length > 2000) ch.buffer.shift();
    for (const listener of ch.listeners) listener(evt);
  }

  subscribe(workspaceId: string, listener: Listener): () => void {
    const ch = this.getChannel(workspaceId);
    ch.listeners.add(listener);
    return () => ch.listeners.delete(listener);
  }

  getSince(workspaceId: string, afterId: number): UIEvent[] {
    const ch = this.getChannel(workspaceId);
    return (ch.buffer as any[]).filter((e: any) => e.id > afterId);
  }
}

declare global { var __uiBus: WorkspaceUIBus | undefined; }
export function getWorkspaceUIBus(): WorkspaceUIBus {
  if (!globalThis.__uiBus) globalThis.__uiBus = new WorkspaceUIBus();
  return globalThis.__uiBus;
}
