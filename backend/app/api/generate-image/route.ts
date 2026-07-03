import { generateImage } from '@/src/image-gen/agnes-studio';
export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as any;
  if (!body?.prompt) return Response.json({ error: 'Нет prompt' }, { status: 400 });
  try {
    const result = await generateImage(body.prompt, {
      width: body.width||1024, height: body.height||1024, model: body.model||'agnes-image-2.1-flash'
    });
    return Response.json(result);
  } catch (e: any) { return Response.json({ error: e.message }, { status: 500 }); }
}
