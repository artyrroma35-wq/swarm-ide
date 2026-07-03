import { db } from '@/src/db/client';

export async function POST(req: Request) {
  try {
    const fd = await req.formData();
    const wsId = fd.get('workspaceId') as string;
    const file = fd.get('file') as File | null;
    if (!wsId || !file) {
      return Response.json({ error: 'Нужны workspaceId и file' }, { status: 400 });
    }
    const r = await db.createFile({
      id: db.id(),
      workspaceId: wsId,
      name: file.name,
      path: '/' + file.name,
      mimeType: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    });
    return Response.json({ file: r }, { status: 201 });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
