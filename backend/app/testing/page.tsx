'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, TestTube, Loader2, Plus, Play, CheckCircle2, XCircle } from 'lucide-react';

interface TestResult { testId: string; passed: boolean; score: number; output: string; duration: number }
const SUITE = 'ui';

export default function TestingPage() {
  const r = useRouter();
  const [name, setName] = useState('');
  const [input, setInput] = useState('');
  const [expected, setExpected] = useState('');
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(0);

  async function addTest() {
    if (!name.trim() || !input.trim()) return;
    setLoading(true);
    try {
      await fetch('/api/agent-testing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add', suite: SUITE, test: { id: crypto.randomUUID(), name, input, expectedOutput: expected || undefined, tags: [] } }) });
      setAdded(n => n + 1);
      setName(''); setInput(''); setExpected('');
    } catch {}
    setLoading(false);
  }

  async function run() {
    setLoading(true); setResults(null);
    try {
      const d = await fetch('/api/agent-testing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'run', suite: SUITE }) }).then(x => x.json());
      setResults(d.results || []);
      setSummary(d.summary || '');
    } catch {}
    setLoading(false);
  }

  return (<div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
    <div className="panel-header"><button className="btn btn-icon-sm" onClick={() => r.push('/')} style={{ border: 'none' }}><ChevronLeft size={18} /></button><h2>🧪 Тестирование агентов</h2></div>
    <div style={{ flex: 1, overflow: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="panel" style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Новый тест-кейс (в наборе: {added})</div>
        <input className="input" placeholder="Название теста" value={name} onChange={e => setName(e.target.value)} style={{ padding: 10 }} />
        <input className="input" placeholder="Входные данные" value={input} onChange={e => setInput(e.target.value)} style={{ padding: 10 }} />
        <input className="input" placeholder="Ожидаемый фрагмент ответа (опционально)" value={expected} onChange={e => setExpected(e.target.value)} style={{ padding: 10 }} />
        <button className="btn btn-sm" onClick={addTest} disabled={loading} style={{ justifyContent: 'center', padding: 8 }}><Plus size={14} /> Добавить кейс</button>
      </div>
      <button className="btn btn-primary" onClick={run} disabled={loading} style={{ justifyContent: 'center', padding: 12 }}>
        {loading ? <><Loader2 size={16} className="spin" /> Выполняю...</> : <><Play size={16} /> Запустить тесты</>}
      </button>
      {summary && <div className="panel" style={{ padding: 10, fontSize: 13 }}><TestTube size={14} style={{ display: 'inline', marginRight: 6 }} />{summary}</div>}
      {results && results.map(res => (
        <div key={res.testId} className="panel" style={{ padding: 10, fontSize: 13, borderLeft: `3px solid ${res.passed ? '#22c55e' : '#ef4444'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {res.passed ? <CheckCircle2 size={15} color="#22c55e" /> : <XCircle size={15} color="#ef4444" />}
            {res.testId} · {res.duration}мс
          </div>
          <div style={{ marginTop: 4, color: 'var(--text-dim)', wordBreak: 'break-word' }}>{res.output}</div>
        </div>
      ))}
    </div>
  </div>);
}
