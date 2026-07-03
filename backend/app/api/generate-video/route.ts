import { generateVideo } from '@/src/image-gen/agnes-studio';
export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as any;
  if (!body?.prompt) return Response.json({ error: 'Нет prompt' }, { status: 400 });
  try {
    const result = await generateVideo(body.prompt, {
      width: body.width||768, height: body.height||1152,
      numFrames: body.numFrames||81, frameRate: body.frameRate||24,
    });
    return Response.json(result);
  } catch (e: any) { return Response.json({ error: e.message }, { status: 500 }); }
}
