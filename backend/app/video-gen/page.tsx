'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Video, Loader2 } from 'lucide-react';
export default function VideoGenPage() {
  const r = useRouter();
  const [prompt, setPrompt] = useState('');
  const [video, setVideo] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  async function generate() {
    if (!prompt.trim()) return;
    setLoading(true); setVideo(''); setInfo('');
    try {
      const res = await fetch('/api/generate-video', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) });
      const d = await res.json();
      if (d.url) setVideo(d.url);
      if (d.fallback) setInfo('Прямая генерация недоступна — ссылка на внешний сервис:');
      if (d.error) setInfo((prev) => `${prev} ${d.error}`.trim());
      if (!d.url && d.error) setInfo(d.error);
    } catch (e: any) { setInfo(e.message); }
    setLoading(false);
  }
  return (<div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
    <div className="panel-header"><button className="btn btn-icon-sm" onClick={() => r.push('/')} style={{ border: 'none' }}><ChevronLeft size={18} /></button><h2>🎬 Генерация видео</h2></div>
    <div style={{ flex: 1, overflow: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <textarea className="input textarea" placeholder="Опишите видео..." value={prompt} onChange={e => setPrompt(e.target.value)} style={{ minHeight: 100, fontSize: 14 }} />
      <button className="btn btn-primary" onClick={generate} disabled={loading} style={{ justifyContent: 'center', padding: 14 }}>
        {loading ? <><Loader2 size={18} className="spin" /> Генерирую (может занять до минуты)... </> : <><Video size={18} /> Сгенерировать видео</>}
      </button>
      {info && <div className="panel" style={{ padding: 10, fontSize: 12, color: 'var(--text-dim)' }}>{info}</div>}
      {video && <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
        <a href={video} target="_blank" rel="noreferrer" style={{ color: '#38bdf8', padding: 10, display: 'block', wordBreak: 'break-all' }}>{video}</a>
      </div>}
    </div>
  </div>);
}
