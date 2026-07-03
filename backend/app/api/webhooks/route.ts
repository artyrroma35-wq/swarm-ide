import { getWebhookManager } from '@/src/webhook/webhook-manager';
export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as any;
  if (!body?.url) return Response.json({ error: 'url required' }, { status: 400 });
  const id = crypto.randomUUID();
  getWebhookManager().register({
    id, url: body.url, secret: body.secret,
    events: body.events || ['*'], enabled: true,
  });
  return Response.json({ id, registered: true });
}
export async function GET() {
  return Response.json({ webhooks: getWebhookManager().list() });
}
export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return Response.json({ error: 'id required' }, { status: 400 });
  getWebhookManager().unregister(id);
  return Response.json({ deleted: true });
}
