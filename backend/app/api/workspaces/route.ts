import { db } from '@/src/db/client';
import { getRuntime } from '@/src/runtime/agent-runtime';

export async function GET() {
  try {
    const workspaces = await db.listWorkspaces();
    return Response.json({ workspaces });
  } catch (e) { return Response.json({ error: String(e) }, { status: 500 }); }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null) as { name?: string } | null;
    const name = body?.name?.trim() || 'Моя рабочая область';
    const ws = await db.createWorkspace(name);
    const human = await db.getOrCreateHumanAgent(ws.id);
    const runtime = getRuntime();
    const { agentId } = await runtime.createAgent(ws.id, 'ассистент', null,
      'Ты главный ассистент. Помогай пользователю. Создавай дочерних агентов для сложных задач.');
    await db.getOrCreateMainGroup(ws.id, human.id, agentId);
    return Response.json(ws, { status: 201 });
  } catch (e) { return Response.json({ error: String(e) }, { status: 500 }); }
}
