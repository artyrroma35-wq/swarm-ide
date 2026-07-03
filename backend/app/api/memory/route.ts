import { getBillionContext } from '@/src/memory/true-billion-context';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as any;
  const bc = getBillionContext();
  try {
    switch (body?.action) {
      case 'remember': {
        if (!body?.content) return Response.json({ error: 'Нет content' }, { status: 400 });
        await bc.remember(body.content, {
          agentId: body.agentId,
          workspaceId: body.workspaceId,
          conversationId: body.conversationId,
          importance: body.importance,
          toolsUsed: body.toolsUsed,
        });
        const stats = await bc.getStats();
        return Response.json({ saved: true, stats });
      }
      case 'search': {
        if (!body?.query) return Response.json({ error: 'Нет query' }, { status: 400 });
        const results = await bc.findRelevant(body.query, {
          workspaceId: body.workspaceId,
          limit: body.limit || 20,
          deep: true,
        });
        return Response.json({ results });
      }
      case 'context': {
        if (!body?.agentId || !body?.workspaceId) return Response.json({ error: 'Нужны agentId и workspaceId' }, { status: 400 });
        const context = await bc.buildContext(body.agentId, body.workspaceId, body.recentMessages || []);
        const stats = await bc.getStats();
        return Response.json({ context, stats });
      }
      case 'stats': {
        const stats = await bc.getStats();
        return Response.json({ stats });
      }
      case 'verify': {
        if (!body?.query) return Response.json({ error: 'Нет query' }, { status: 400 });
        const result = await bc.verify(body.query);
        return Response.json(result);
      }
      default: return Response.json({ error: 'Неизвестное действие' }, { status: 400 });
    }
  } catch (e: any) { return Response.json({ error: e.message }, { status: 500 }); }
}

export async function GET() {
  const bc = getBillionContext();
  const stats = await bc.getStats();
  return Response.json({
    stats,
    message: '🧠 TRUE 1 BILLION CONTEXT ACTIVE',
    system: 'Реальный 1 000 000 000 НЕСЖАТЫХ токенов контекста. BM25 + Semantic + RRF + MMR поиск.',
  });
}
