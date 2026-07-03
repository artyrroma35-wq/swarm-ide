import { agentTester, TestCase } from '@/src/agent-testing/agent-tester';
export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as any;
  try {
    if (body?.action === 'add') {
      agentTester.addTest(body.suite||'default', body.test as TestCase);
      return Response.json({ added: true });
    }
    if (body?.action === 'run') {
      const results = await agentTester.runTests(body.suite||'default', async (input) => ({ output: `[test] ${input}`, tools: [] }));
      const passed = results.filter(r => r.passed).length;
      return Response.json({ results, summary: `${passed}/${results.length} passed` });
    }
    return Response.json({ error: 'Неизвестное действие' }, { status: 400 });
  } catch (e: any) { return Response.json({ error: e.message }, { status: 500 }); }
}
