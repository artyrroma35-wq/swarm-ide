import { db } from '@/src/db/client';

export async function GET(req: Request) {
  const wsId = new URL(req.url).searchParams.get('workspaceId') ?? '';
  if (!wsId) return Response.json({ error: 'Нет workspaceId' }, { status: 400 });
  const servers = await db.listMCPServers(wsId);
  return Response.json({ servers });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as any;
  if (!body?.workspaceId || !body?.name || !body?.url) {
    return Response.json({ error: 'Нужны workspaceId, name, url' }, { status: 400 });
  }
  const server = await db.createMCPServer({
    id: db.id(),
    workspaceId: body.workspaceId,
    name: body.name,
    url: body.url,
    tools: body.tools || '[]',
    enabled: true,
    createdAt: new Date().toISOString(),
  });
  return Response.json(server, { status: 201 });
}
