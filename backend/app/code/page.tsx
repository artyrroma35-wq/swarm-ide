'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Code2, Loader2, FolderOpen, Save } from 'lucide-react';

export default function CodePage() {
  const r = useRouter();
  const [path, setPath] = useState('/tmp/main.py');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  async function open() {
    if (!path.trim()) return;
    setLoading(true); setStatus('');
    try {
      const d = await fetch('/api/sandbox', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'read', path }) }).then(x => x.json());
      if (d.found) { setContent(d.content || ''); setStatus(`📂 ${path}`); }
      else setStatus('Файл не найден — можно создать новый');
    } catch (e: any) { setStatus(e.message); }
    setLoading(false);
  }

  async function save() {
    if (!path.trim()) return;
    setLoading(true); setStatus('');
    try {
      const d = await fetch('/api/sandbox', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'write', path, content }) }).then(x => x.json());
      setStatus(d.stdout || d.error || `✅ Сохранено: ${path}`);
    } catch (e: any) { setStatus(e.message); }
    setLoading(false);
  }

  return (<div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
    <div className="panel-header"><button className="btn btn-icon-sm" onClick={() => r.push('/')} style={{ border: 'none' }}><ChevronLeft size={18} /></button><h2>💻 Code Editor</h2></div>
    <div style={{ flex: 1, overflow: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input className="input" placeholder="/путь/к/файлу" value={path} onChange={e => setPath(e.target.value)} style={{ flex: 1, padding: 10, fontFamily: 'monospace', fontSize: 13 }} />
        <button className="btn btn-sm" onClick={open} disabled={loading}><FolderOpen size={14} /></button>
        <button className="btn btn-primary btn-sm" onClick={save} disabled={loading}><Save size={14} /></button>
      </div>
      <textarea
        className="input textarea"
        value={content}
        onChange={e => setContent(e.target.value)}
        spellCheck={false}
        style={{ minHeight: '55vh', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre', overflowX: 'auto' }}
        placeholder="// Откройте файл или начните печатать..."
      />
      <div style={{ fontSize: 12, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 6 }}>
        {loading && <Loader2 size={12} className="spin" />}
        <Code2 size={12} /> {status || `${content.length} симв. · ${content.split('\n').length} строк`}
      </div>
    </div>
  </div>);
}
