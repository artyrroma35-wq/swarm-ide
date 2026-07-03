import { getSandbox } from '@/src/sandbox/unlimited-sandbox';
export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as any;
  const sb = getSandbox();
  try {
    switch (body?.action) {
      case 'exec': {
        if (!body?.command) return Response.json({ error: 'Нет команды' }, { status: 400 });
        const result = sb.exec(body.command, { sudo: body.sudo, background: body.background, timeout: body.timeout });
        return Response.json(result);
      }
      case 'install': {
        if (!body?.package) return Response.json({ error: 'Нет пакета' }, { status: 400 });
        const result = sb.install(body.package, body.type || 'apt');
        return Response.json(result);
      }
      case 'write': {
        if (!body?.path || !body?.content) return Response.json({ error: 'Нужны path и content' }, { status: 400 });
        const result = sb.writeFile(body.path, body.content);
        return Response.json(result);
      }
      case 'read': {
        if (!body?.path) return Response.json({ error: 'Нет path' }, { status: 400 });
        const content = sb.readFile(body.path);
        return Response.json({ content, found: content !== null });
      }
      case 'ps': return Response.json({ output: sb.getProcessList() });
      case 'clean': { sb.clean(); return Response.json({ cleaned: true }); }
      case 'stats': return Response.json(sb.getStats());
      default: return Response.json({ error: 'Неизвестное действие' }, { status: 400 });
    }
  } catch (e: any) { return Response.json({ error: e.message }, { status: 500 }); }
}
