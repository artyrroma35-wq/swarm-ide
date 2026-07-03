export interface AgentBlueprint {
  id: string; name: string; role: string; systemPrompt: string;
  tools: string[]; parentId: string | null; position: { x: number; y: number };
  color: string; icon: string; children: string[]; connections: Array<{ to: string; type: 'creates'|'messages'|'supervises' }>;
  config: { model?: string; temperature?: number; maxTokens?: number; memoryEnabled?: boolean };
}

export class AgentBuilder {
  private blueprints = new Map<string, AgentBlueprint>();

  async save(blueprint: AgentBlueprint): Promise<void> { this.blueprints.set(blueprint.id, blueprint); }
  async load(id: string): Promise<AgentBlueprint | null> { return this.blueprints.get(id) || null; }
  async list(workspaceId?: string): Promise<AgentBlueprint[]> { return [...this.blueprints.values()]; }
  async delete(id: string): Promise<void> { this.blueprints.delete(id); }

  generatePrompt(blueprint: AgentBlueprint): string {
    const lines = [`Ты — агент с ролью "${blueprint.role}".`, `Имя: ${blueprint.name}`, '', `Инструкции:`, blueprint.systemPrompt, ''];
    if (blueprint.tools.length) lines.push(`Доступные инструменты: ${blueprint.tools.join(', ')}`);
    if (blueprint.children.length) lines.push(`Твои подчинённые: ${blueprint.children.map(c => this.blueprints.get(c)?.name || c).join(', ')}`);
    if (blueprint.config.model) lines.push(`Модель: ${blueprint.config.model}`);
    return lines.join('\n');
  }

  validate(blueprint: AgentBlueprint): string[] {
    const errors: string[] = [];
    if (!blueprint.name?.trim()) errors.push('Имя обязательно');
    if (!blueprint.role?.trim()) errors.push('Роль обязательна');
    if (blueprint.connections.some(c => !this.blueprints.has(c.to))) errors.push('Неверные связи');
    return errors;
  }
}

export const agentBuilder = new AgentBuilder();
