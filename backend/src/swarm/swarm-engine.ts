import { db } from '../db/client';
import { getRuntime, UUID } from '../runtime/agent-runtime';
import { eventBus } from '../runtime/event-bus';

export interface SwarmNode {
  agentId: UUID; role: string; parentId: UUID | null; depth: number;
  children: SwarmNode[]; status: 'idle' | 'thinking' | 'done' | 'error';
  task: string; result?: string; createdAt: string;
}

export class SwarmEngine {
  async createSwarm(workspaceId: UUID, rootTask: string, maxDepth = 5): Promise<SwarmNode> {
    const runtime = getRuntime();
    const human = await db.getOrCreateHumanAgent(workspaceId);

    const root = await runtime.createAgent(workspaceId, 'swarm-coordinator', null,
      `Ты координатор роя. Твоя задача: "${rootTask}". Создавай дочерних агентов для подзадач. Координируй их работу.`);
    return this.buildNode(root.agentId, workspaceId, rootTask, 0, maxDepth);
  }

  private async buildNode(agentId: UUID, workspaceId: UUID, task: string, depth: number, maxDepth: number): Promise<SwarmNode> {
    const agent = await db.getAgent(agentId);
    const children: SwarmNode[] = [];
    if (depth < maxDepth) {
      for (let i = 0; i < Math.min(3, maxDepth - depth); i++) {
        try {
          const child = await getRuntime().createAgent(workspaceId, `sub-agent-${depth}-${i}`, agentId,
            `Подзадача: ${task.slice(0,100)}. Ты часть роя на глубине ${depth + 1}.`);
          children.push(await this.buildNode(child.agentId, workspaceId, `${task} (sub ${i})`, depth + 1, maxDepth));
        } catch {}
      }
    }
    return { agentId, role: agent?.role || 'unknown', parentId: agent?.parentId || null, depth, children, status: 'idle', task, createdAt: new Date().toISOString() };
  }

  async executeSwarm(root: SwarmNode): Promise<void> {
    await this.executeNode(root);
  }

  private async executeNode(node: SwarmNode): Promise<void> {
    node.status = 'thinking';
    eventBus.emit(`agent:${node.agentId}`, { event: 'status', data: 'thinking' });
    try {
      await getRuntime().wakeAgent(node.agentId);
      for (const child of node.children) await this.executeNode(child);
      node.status = 'done';
    } catch {
      node.status = 'error';
    }
    eventBus.emit(`agent:${node.agentId}`, { event: 'status', data: node.status });
  }

  formatSwarmTree(node: SwarmNode, indent = ''): string {
    const icon = node.status === 'done' ? '✅' : node.status === 'error' ? '❌' : node.status === 'thinking' ? '🔄' : '⏳';
    const lines = [`${indent}${icon} ${node.role} (${node.task.slice(0,60)})`];
    for (const child of node.children) lines.push(this.formatSwarmTree(child, indent + '  '));
    return lines.join('\n');
  }
}
export const swarmEngine = new SwarmEngine();
