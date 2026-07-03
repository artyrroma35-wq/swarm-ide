import { db } from '@/src/db/client';
export async function GET(req: Request) {
  const url = new URL(req.url);
  const wsId = url.searchParams.get('workspaceId') ?? '';
  const q = (url.searchParams.get('q') ?? '').trim().toLowerCase();
  if (!wsId) return Response.json({ error: 'Не указан workspaceId' }, { status: 400 });
  const agents = await db.listAgents(wsId);
  const groups = await db.listGroups(wsId);
  return Response.json({
    agents: agents.filter(a => !q || a.role.toLowerCase().includes(q)).map(a => ({ id: a.id, role: a.role, parentId: a.parentId, status: a.status })),
    groups: groups.filter(g => !q || (g.name ?? '').toLowerCase().includes(q)).map(g => ({ id: g.id, name: g.name })),
    files: (await db.listFiles(wsId)).filter(f => !q || f.name.toLowerCase().includes(q)).map(f => ({ id: f.id, name: f.name, path: f.path })),
  });
}
