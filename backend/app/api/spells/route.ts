import { listSpells, getSpell, SpellName } from '@/src/spells';
export async function GET() { return Response.json({ spells: listSpells() }); }
export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as any;
  if (!body?.id) return Response.json({ error: 'Нет id' }, { status: 400 });
  const spell = getSpell(body.id as SpellName);
  if (!spell) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json({ spell });
}
