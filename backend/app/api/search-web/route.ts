import { searchWeb, fetchPage } from '@/src/lib/search';
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q') ?? '';
  const action = url.searchParams.get('action') ?? 'search';
  if (!q) return Response.json({ error: 'Нет запроса' }, { status: 400 });
  if (action === 'fetch') {
    const content = await fetchPage(q);
    return Response.json({ content: content.slice(0, 50000) });
  }
  const results = await searchWeb(q);
  return Response.json({ results });
}
