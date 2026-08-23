'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, BookOpen, Loader2, Plus, Search } from 'lucide-react';

export default function RagPage() {
  const r = useRouter();
  const [tab, setTab] = useState<'add' | 'query'>('add');
  const [docId, setDocId] = useState('');
  const [docText, setDocText] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  async function addDoc() {
    if (!docId.trim() || !docText.trim()) { setStatus('Укажите ID и текст документа'); return; }
    setLoading(true); setStatus('');
    try {
      const d = await fetch('/api/rag', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add', id: docId, content: docText }) }).then(x => x.json());
      setStatus(d.added ? `✅ Документ «${docId}» добавлен (${Math.ceil(docText.length / 1000)} чанков)` : `Ошибка: ${d.error}`);
      if (d.added) { setDocText(''); }
    } catch (e: any) { setStatus(e.message); }
    setLoading(false);
  }

  async function query() {
    if (!question.trim()) return;
    setLoading(true); setStatus(''); setAnswer('');
    try {
      const d = await fetch('/api/rag', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'query', question }) }).then(x => x.json());
      if (d.context) setAnswer(d.context);
      else setStatus(d.error || 'Ничего не найдено');
    } catch (e: any) { setStatus(e.message); }
    setLoading(false);
  }

  return (<div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
    <div className="panel-header"><button className="btn btn-icon-sm" onClick={() => r.push('/')} style={{ border: 'none' }}><ChevronLeft size={18} /></button><h2>📚 RAG документы</h2></div>
    <div style={{ flex: 1, overflow: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className={`btn btn-sm ${tab === 'add' ? 'btn-primary' : ''}`} onClick={() => setTab('add')} style={{ flex: 1, justifyContent: 'center' }}><Plus size={14} /> Добавить</button>
        <button className={`btn btn-sm ${tab === 'query' ? 'btn-primary' : ''}`} onClick={() => setTab('query')} style={{ flex: 1, justifyContent: 'center' }}><Search size={14} /> Спросить</button>
      </div>

      {tab === 'add' ? (<>
        <input className="input" placeholder="ID документа (напр. docs-api)" value={docId} onChange={e => setDocId(e.target.value)} style={{ padding: 10 }} />
        <textarea className="input textarea" placeholder="Текст документа (PDF можно вставить текстом)..." value={docText} onChange={e => setDocText(e.target.value)} style={{ minHeight: 160, fontSize: 13 }} />
        <button className="btn btn-primary" onClick={addDoc} disabled={loading} style={{ justifyContent: 'center', padding: 12 }}>
          {loading ? <><Loader2 size={16} className="spin" /> Индексирую...</> : <><BookOpen size={16} /> Добавить в базу знаний</>}
        </button>
      </>) : (<>
        <textarea className="input textarea" placeholder="Вопрос по документам..." value={question} onChange={e => setQuestion(e.target.value)} style={{ minHeight: 80, fontSize: 13 }} />
        <button className="btn btn-primary" onClick={query} disabled={loading} style={{ justifyContent: 'center', padding: 12 }}>
          {loading ? <><Loader2 size={16} className="spin" /> Ищу...</> : <><Search size={16} /> Найти ответ</>}
        </button>
        {answer && <div className="panel" style={{ padding: 12, fontSize: 13, whiteSpace: 'pre-wrap' }}>{answer}</div>}
      </>)}

      {status && <div className="panel" style={{ padding: 10, fontSize: 12 }}>{status}</div>}
    </div>
  </div>);
}
