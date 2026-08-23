'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Search, Loader2, Bot, Users, FileText } from 'lucide-react';

interface Ws { id: string; name: string }
interface Agent { id: string; role: string; status: string }
interface Group { id: string; name: string | null }
interface File { id: string; name: string; path: string }
interface Results { agents: Agent[]; groups: Group[]; files: File[] }

export default function SearchPage() {
  const r = useRouter();
  const [wsList, setWsList] = useState<Ws[]>([]);
  const [wsId, setWsId] = useState('');
  const [q, setQ] = useState('');
  const [res, setRes] = useState<Results | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/workspaces').then(x => x.json()).then((d) => {
      const list: Ws[] = d.workspaces || [];
      setWsList(list);
      if (list[0]) setWsId(list[0].id);
    }).catch(() => {});
  }, []);

  const doSearch = useCallback(async () => {
    if (!wsId) return;
    setLoading(true); setRes(null);
    try {
      const d = await fetch(`/api/search?workspaceId=${wsId}&q=${encodeURIComponent(q)}`).then(x => x.json());
      setRes(d);
    } catch {}
    setLoading(false);
  }, [wsId, q]);

  return (<div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
    <div className="panel-header"><button className="btn btn-icon-sm" onClick={() => r.push('/')} style={{ border: 'none' }}><ChevronLeft size={18} /></button><h2>🌐 Поиск</h2></div>
    <div style={{ flex: 1, overflow: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <select className="input" value={wsId} onChange={e => setWsId(e.target.value)} style={{ padding: 10 }}>
        {wsList.length === 0 && <option value="">Нет рабочих областей</option>}
        {wsList.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
      </select>
      <div style={{ display: 'flex', gap: 8 }}>
        <input className="input" placeholder="Агенты, чаты, файлы..." value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && doSearch()} style={{ flex: 1, padding: 10 }} />
        <button className="btn btn-primary" onClick={doSearch} disabled={loading || !wsId}>
          {loading ? <Loader2 size={16} className="spin" /> : <Search size={16} />}
        </button>
      </div>
      {res && (
        <>
          <div className="panel" style={{ padding: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-dim)' }}><Bot size={14} /> Агенты ({res.agents.length})</div>
            {res.agents.map(a => <div key={a.id} style={{ padding: '6px 0', fontSize: 13 }}>• {a.role} — <span style={{ color: a.status === 'idle' ? '#22c55e' : '#f59e0b' }}>{a.status}</span></div>)}
            {res.agents.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Ничего не найдено</div>}
          </div>
          <div className="panel" style={{ padding: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-dim)' }}><Users size={14} /> Чаты ({res.groups.length})</div>
            {res.groups.map(g => <div key={g.id} style={{ padding: '6px 0', fontSize: 13 }}>• {g.name || 'Без названия'}</div>)}
            {res.groups.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Ничего не найдено</div>}
          </div>
          <div className="panel" style={{ padding: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-dim)' }}><FileText size={14} /> Файлы ({res.files.length})</div>
            {res.files.map(f => <div key={f.id} style={{ padding: '6px 0', fontSize: 13 }}>• {f.name} <span style={{ color: 'var(--text-dim)' }}>{f.path}</span></div>)}
            {res.files.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Ничего не найдено</div>}
          </div>
        </>
      )}
    </div>
  </div>);
}
