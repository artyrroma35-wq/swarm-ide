import { exportImport } from '@/src/export-import/export-import';
export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as any;
  try {
    if (body?.action === 'export') {
      if (!body?.workspaceId) return Response.json({ error: 'Нет workspaceId' }, { status: 400 });
      const data = await exportImport.exportWorkspace(body.workspaceId);
      return Response.json(data);
    }
    if (body?.action === 'import') {
      if (!body?.data) return Response.json({ error: 'Нет данных' }, { status: 400 });
      const wsId = await exportImport.importWorkspace(body.data);
      return Response.json({ workspaceId: wsId });
    }
    return Response.json({ error: 'Неизвестное действие' }, { status: 400 });
  } catch (e: any) { return Response.json({ error: e.message }, { status: 500 }); }
}
