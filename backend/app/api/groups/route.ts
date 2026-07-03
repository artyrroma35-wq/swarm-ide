import { db } from '@/src/db/client';
export async function GET(req: Request) {
  const wsId = new URL(req.url).searchParams.get('workspaceId') ?? undefined;
  if (!wsId) return Response.json({ groups: [] });
  const groups = await db.listGroups(wsId);
  const enriched = await Promise.all(groups.map(async (g) => {
    const memberIds = await db.listGroupMemberIds(g.id);
    const messages = await db.listMessages(g.id, 1);
    return {
      id: g.id, name: g.name, memberIds, unreadCount: 0,
      lastMessage: messages.length > 0 ? { content: messages[0].content, senderId: messages[0].senderId, sendTime: messages[0].sendTime } : undefined,
      updatedAt: messages.length > 0 ? messages[0].sendTime : g.createdAt, createdAt: g.createdAt,
    };
  }));
  enriched.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return Response.json({ groups: enriched });
}
