export interface TestCase {
  id: string; name: string; input: string; expectedOutput?: string;
  expectedTools?: string[]; expectedBehavior?: string;
  minScore?: number; tags: string[];
}

export interface TestResult {
  testId: string; passed: boolean; score: number; output: string;
  toolsCalled: string[]; errors: string[]; duration: number;
}

export class AgentTester {
  private testSuites = new Map<string, TestCase[]>();

  addTest(suite: string, test: TestCase) {
    if (!this.testSuites.has(suite)) this.testSuites.set(suite, []);
    this.testSuites.get(suite)!.push(test);
  }

  async runTests(suite: string, agentFn: (input: string) => Promise<{ output: string; tools: string[] }>): Promise<TestResult[]> {
    const tests = this.testSuites.get(suite) || [];
    const results: TestResult[] = [];
    for (const test of tests) {
      const start = Date.now();
      const errors: string[] = [];
      try {
        const { output, tools } = await agentFn(test.input);
        const passed = (!test.expectedOutput || output.includes(test.expectedOutput)) && (!test.expectedTools || test.expectedTools.every(t => tools.includes(t)));
        results.push({ testId: test.id, passed, score: passed ? 1 : 0.3, output, toolsCalled: tools, errors, duration: Date.now() - start });
      } catch (e: any) {
        results.push({ testId: test.id, passed: false, score: 0, output: '', toolsCalled: [], errors: [e.message], duration: Date.now() - start });
      }
    }
    return results;
  }
}
export const agentTester = new AgentTester();
