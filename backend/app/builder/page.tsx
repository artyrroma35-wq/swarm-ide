'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Layers, Loader2, Bot, Plus, RefreshCw } from 'lucide-react';

interface Ws { id: string; name: string }
interface Agent { id: string; role: string; parentId: string | null; status: string }

export default function BuilderPage() {
  const r = useRouter();
  const [wsList, setWsList] = useState<Ws[]>([]);
  const [wsId, setWsId] = useState('');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [role, setRole] = useState('');
  const [guidance, setGuidance] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const load = useCallback(async (id: string) => {
    if (!id) return;
    const d = await fetch(`/api/agents?workspaceId=${id}`).then(x => x.json()).catch(() => null);
    setAgents(d?.agents || []);
  }, []);

  useEffect(() => {
    fetch('/api/workspaces').then(x => x.json()).then((d) => {
      const list: Ws[] = d.workspaces || [];
      setWsList(list);
      if (list[0]) { setWsId(list[0].id); load(list[0].id); }
    }).catch(() => {});
  }, [load]);

  async function create() {
    if (!role.trim()) return;
    setLoading(true); setStatus('');
    try {
      const d = await fetch('/api/agents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workspaceId: wsId, role, guidance }) }).then(x => x.json());
      if (d.agentId) { setStatus(`✅ Агент «${role}» создан`); setRole(''); setGuidance(''); await load(wsId); }
      else setStatus(`Ошибка: ${d.error}`);
    } catch (e: any) { setStatus(e.message); }
    setLoading(false);
  }

  return (<div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
    <div className="panel-header"><button className="btn btn-icon-sm" onClick={() => r.push('/')} style={{ border: 'none' }}><ChevronLeft size={18} /></button><h2>🏗️ Визуальный конструктор</h2></div>
    <div style={{ flex: 1, overflow: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <select className="input" value={wsId} onChange={e => { setWsId(e.target.value); load(e.target.value); }} style={{ flex: 1, padding: 10 }}>
          {wsList.length === 0 && <option value="">Нет рабочих областей</option>}
          {wsList.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
        <button className="btn btn-sm" onClick={() => load(wsId)}><RefreshCw size={14} /></button>
      </div>

      <div className="panel" style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-dim)' }}><Layers size={14} /> Создать агента</div>
        <input className="input" placeholder="Роль (напр. «исследователь»)" value={role} onChange={e => setRole(e.target.value)} style={{ padding: 10 }} />
        <textarea className="input textarea" placeholder="Инструкции для агента (опционально)" value={guidance} onChange={e => setGuidance(e.target.value)} style={{ minHeight: 70, fontSize: 13 }} />
        <button className="btn btn-primary" onClick={create} disabled={loading || !wsId} style={{ justifyContent: 'center', padding: 10 }}>
          {loading ? <Loader2 size={16} className="spin" /> : <><Plus size={16} /> Добавить агента</>}
        </button>
      </div>

      {status && <div className="panel" style={{ padding: 10, fontSize: 13 }}>{status}</div>}

      <div className="panel" style={{ padding: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}><Bot size={14} /> Рой ({agents.length})</div>
        {agents.map(a => (
          <div key={a.id} style={{ padding: '6px 0', fontSize: 13, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <span>{a.role}</span>
            <span style={{ color: a.status === 'idle' ? '#22c55e' : '#f59e0b' }}>{a.status}</span>
          </div>
        ))}
        {agents.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Пока нет агентов</div>}
      </div>
    </div>
  </div>);
}
