import { ragEngine } from '@/src/rag/rag-engine';
export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as any;
  try {
    if (body?.action === 'add') {
      if (!body?.id || !body?.content) return Response.json({ error: 'Нужны id и content' }, { status: 400 });
      await ragEngine.addDocument(body.id, body.content, body.metadata);
      return Response.json({ added: true });
    }
    if (body?.action === 'query') {
      if (!body?.question) return Response.json({ error: 'Нет question' }, { status: 400 });
      const context = await ragEngine.query(body.question, body.workspaceId);
      return Response.json({ context });
    }
    return Response.json({ error: 'Неизвестное действие' }, { status: 400 });
  } catch (e: any) { return Response.json({ error: e.message }, { status: 500 }); }
}
