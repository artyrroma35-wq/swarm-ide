import { db } from '@/src/db/client';
import { getRuntime } from '@/src/runtime/agent-runtime';

export async function GET(req: Request) {
  const wsId = new URL(req.url).searchParams.get('workspaceId') ?? undefined;
  const agents = await db.listAgents(wsId);
  return Response.json({ agents });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as any;
  const workspaceId = body?.workspaceId?.trim();
  const role = body?.role?.trim();
  if (!workspaceId || !role) return Response.json({ error: 'Не указаны workspaceId или role' }, { status: 400 });
  const runtime = getRuntime();
  const result = await runtime.createAgent(workspaceId, role, body?.creatorId ?? null, body?.guidance);
  return Response.json(result, { status: 201 });
}
