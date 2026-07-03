import { collabManager } from '@/src/collab/realtime-collab';
export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as any;
  try {
    switch (body?.action) {
      case 'join': collabManager.join(body.workspaceId, { userId: body.userId, username: body.username||'User', isTyping: false, lastActive: new Date().toISOString() }); return Response.json({ joined: true, users: collabManager.getUsers(body.workspaceId) });
      case 'leave': collabManager.leave(body.workspaceId, body.userId); return Response.json({ left: true });
      case 'typing': collabManager.setTyping(body.workspaceId, body.userId, body.typing); return Response.json({ set: true });
      case 'users': return Response.json({ users: collabManager.getUsers(body.workspaceId) });
      default: return Response.json({ error: 'Неизвестное действие' }, { status: 400 });
    }
  } catch (e: any) { return Response.json({ error: e.message }, { status: 500 }); }
}
