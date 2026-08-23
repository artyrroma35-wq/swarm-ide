'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Download, Upload, Loader2 } from 'lucide-react';

interface Ws { id: string; name: string }

export default function ExportPage() {
  const r = useRouter();
  const [wsList, setWsList] = useState<Ws[]>([]);
  const [wsId, setWsId] = useState('');
  const [data, setData] = useState('');
  const [importText, setImportText] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/workspaces').then(x => x.json()).then((d) => {
      const list: Ws[] = d.workspaces || [];
      setWsList(list);
      if (list[0]) setWsId(list[0].id);
    }).catch(() => {});
  }, []);

  async function doExport() {
    if (!wsId) return;
    setLoading(true); setStatus(''); setData('');
    try {
      const d = await fetch('/api/export-import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'export', workspaceId: wsId }) }).then(x => x.json());
      const json = JSON.stringify(d, null, 2);
      setData(json);
      const blob = new Blob([json], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `swarm-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e: any) { setStatus(e.message); }
    setLoading(false);
  }

  async function doImport() {
    if (!importText.trim()) return;
    setLoading(true); setStatus('');
    try {
      const parsed = JSON.parse(importText);
      const d = await fetch('/api/export-import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'import', data: parsed }) }).then(x => x.json());
      setStatus(d.workspaceId ? `✅ Импортировано! Новая область: ${d.workspaceId}` : `Ошибка: ${d.error}`);
    } catch (e: any) { setStatus(`Ошибка разбора JSON: ${e.message}`); }
    setLoading(false);
  }

  return (<div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
    <div className="panel-header"><button className="btn btn-icon-sm" onClick={() => r.push('/')} style={{ border: 'none' }}><ChevronLeft size={18} /></button><h2>📤 Экспорт / Импорт</h2></div>
    <div style={{ flex: 1, overflow: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="panel" style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Экспорт рабочей области в JSON</div>
        <select className="input" value={wsId} onChange={e => setWsId(e.target.value)} style={{ padding: 10 }}>
          {wsList.length === 0 && <option value="">Нет рабочих областей</option>}
          {wsList.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
        <button className="btn btn-primary" onClick={doExport} disabled={loading || !wsId} style={{ justifyContent: 'center', padding: 10 }}>
          {loading ? <Loader2 size={16} className="spin" /> : <><Download size={16} /> Экспорт + скачать</>}
        </button>
      </div>
      <div className="panel" style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Импорт из JSON</div>
        <textarea className="input textarea" placeholder='Вставьте JSON экспорта...' value={importText} onChange={e => setImportText(e.target.value)} style={{ minHeight: 100, fontSize: 12 }} />
        <button className="btn btn-sm" onClick={doImport} disabled={loading} style={{ justifyContent: 'center', padding: 8 }}><Upload size={14} /> Импортировать</button>
      </div>
      {data && <div className="panel" style={{ padding: 10, fontSize: 11, fontFamily: 'monospace', maxHeight: 200, overflow: 'auto', whiteSpace: 'pre-wrap' }}>{data.slice(0, 2000)}</div>}
      {status && <div className="panel" style={{ padding: 10, fontSize: 13 }}>{status}</div>}
    </div>
  </div>);
}
