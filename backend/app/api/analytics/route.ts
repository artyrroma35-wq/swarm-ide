import { analytics } from '@/src/analytics/analytics';
export async function GET() {
  const stats = analytics.getStats('24h');
  return Response.json(stats);
}
export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as any;
  if (body) analytics.track(body);
  return Response.json({ tracked: true, stats: analytics.getStats('24h') });
}
