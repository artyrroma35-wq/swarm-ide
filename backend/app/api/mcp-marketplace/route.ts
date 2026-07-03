import { getMCPMarketplace } from '@/src/mcp-marketplace/mcp-marketplace';
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get('q') || '';
  const mp = getMCPMarketplace();
  if (q) return Response.json({ tools: await mp.search(q) });
  return Response.json({ tools: await mp.list() });
}
export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as any;
  if (!body?.toolId) return Response.json({ error: 'Нет toolId' }, { status: 400 });
  try {
    const result = await getMCPMarketplace().install(body.toolId, body.workspaceId, body.config||{});
    return Response.json(result);
  } catch (e: any) { return Response.json({ error: e.message }, { status: 400 }); }
}
